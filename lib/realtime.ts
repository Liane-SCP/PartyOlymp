import { POST } from "../server/cloudflare/room";
import { publicRoom, tickRoom } from "./game/room";
import type { Room } from "./game/types";
import { enrichWiki } from "./wiki-service";

// Each socket owns its I/O context. D1 CAS coordinates distinct Worker isolates.
export function realtime(request: Request, env: Cloudflare.Env) {
  const db = env.DB;
  if (!db) return new Response("Speicher nicht verfügbar", { status: 503 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return new Response("Forbidden", { status: 403 });
  const pair = new WebSocketPair(),
    client = pair[0],
    ws = pair[1];
  ws.accept();
  let code = "",
    id = "",
    token = "",
    authenticated = false,
    closed = false,
    authenticating = false,
    articleKey = "",
    pumping = false;
  let commands = Promise.resolve();
  const timeout = setTimeout(() => {
    if (!authenticated) ws.close(1008, "Anmeldung erforderlich");
  }, 5000);
  const cleanup = () => {
    closed = true;
    clearTimeout(timeout);
  };
  ws.addEventListener("close", cleanup);
  ws.addEventListener("error", cleanup);
  const pump = async () => {
    if (closed || pumping) return;
    pumping = true;
    try {
      let room: Room | null = null;
      const now = Math.floor(Date.now() / 100) * 100;
      for (let attempt = 0; attempt < 4; attempt++) {
        const row = await db
          .prepare(
            "SELECT revision,state,(SELECT json_group_object(player_id,last_seen) FROM room_presence WHERE room_code=rooms.code) AS presence FROM rooms WHERE code=?",
          )
          .bind(code)
          .first<{ revision: number; state: string; presence: string }>();
        if (!row) break;
        room = JSON.parse(row.state);
        const presence = JSON.parse(row.presence || "{}");
        for (const p of room!.players)
          p.lastSeen = Math.max(p.lastSeen, presence[p.id] ?? 0);
        const before = JSON.stringify(room);
        tickRoom(room!, now);
        if (before !== JSON.stringify(room)) {
          room!.revision = row.revision + 1;
          const saved = await db
            .prepare(
              "UPDATE rooms SET state=?,revision=?,updated_at=? WHERE code=? AND revision=?",
            )
            .bind(JSON.stringify(room), room!.revision, now, code, row.revision)
            .run();
          if (!saved.meta.changes) {
            room = null;
            continue;
          }
        }
        break;
      }
      if (room) {
        const member = room.players.find(
          (p) => p.id === id && p.token === token && !p.kicked,
        );
        if (!member) {
          ws.close(1008, "Sitzung beendet");
          return;
        }
        if (now - member.lastSeen > 4000)
          await db
            .prepare(
              "INSERT INTO room_presence (room_code,player_id,last_seen) VALUES (?,?,?) ON CONFLICT(room_code,player_id) DO UPDATE SET last_seen=MAX(room_presence.last_seen,excluded.last_seen)",
            )
            .bind(code, id, now)
            .run();
        member.lastSeen = now;
        const view: any = publicRoom(room, id, Date.now());
        await enrichWiki(view, db);
        if (view.game?.article?.html) {
          const key = `${view.game.article.title}:${view.game.article.revision}`;
          if (articleKey === key) delete view.game.article.html;
          articleKey = key;
        }
        if (!closed) ws.send(JSON.stringify({ type: "snapshot", room: view }));
      }
    } catch {
      /* Temporary storage failures retry on the next snapshot tick. */
    } finally {
      pumping = false;
    }
  };
  ws.addEventListener("message", async (event) => {
    try {
      if (typeof event.data !== "string" || event.data.length > 16000)
        throw new Error("Ungültige Nachricht");
      const body = JSON.parse(event.data);
      if (!authenticated) {
        if (authenticating || !/^[A-Z2-9]{6}$/.test(body.code)) return;
        authenticating = true;
        const row = await db
          .prepare("SELECT state FROM rooms WHERE code=?")
          .bind(body.code)
          .first<{ state: string }>();
        const room = row && (JSON.parse(row.state) as Room);
        const member = room?.players.find(
          (p) => p.id === body.playerId && p.token === body.token && !p.kicked,
        );
        if (!member) throw new Error("Sitzung nicht gefunden");
        code = body.code;
        id = member.id;
        token = member.token;
        authenticated = true;
        clearTimeout(timeout);
        ws.send(JSON.stringify({ type: "connected" }));
        await pump();
        return;
      }
      if (body.type === "frame") {
        await pump();
        return;
      }
      if (body.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", at: body.at }));
        return;
      }
      if (body.type !== "action") return;
      const perform = async () => {
        const res = await POST(
          new Request(new URL("/api/room", request.url), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              type: "action",
              code,
              playerId: id,
              token,
              requestId: body.requestId,
              action: body.action,
            }),
          }),
        );
        const data: any = await res.json();
        if (!closed) {
          // POST already has the committed, player-filtered state. Deliver it now
          // rather than waiting for the next 450 ms frame request and D1 read.
          if (data.room)
            ws.send(JSON.stringify({ type: "snapshot", room: data.room }));
          if (!res.ok)
            ws.send(JSON.stringify({ type: "error", error: data.error }));
          ws.send(
            JSON.stringify({
              type: "ack",
              requestId: body.requestId,
              ok: res.ok,
            }),
          );
        }
      };
      commands = commands.then(perform);
      await commands;
    } catch (error) {
      if (!closed)
        ws.send(
          JSON.stringify({ type: "error", error: (error as Error).message }),
        );
      if (!authenticated) ws.close(1008, "Anmeldung fehlgeschlagen");
    }
  });
  return new Response(null, { status: 101, webSocket: client });
}
