import { env } from "cloudflare:workers";
import { ensure, random, type Room } from "@/lib/game/types";
import { prepareWiki, enrichWiki } from "@/lib/wiki-service";
import {
  createRoom,
  player,
  tickRoom,
  roomAction,
  publicRoom,
} from "@/lib/game/room";
export const dynamic = "force-dynamic";
const json = (data: any, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    ensure(
      !origin || origin === new URL(request.url).origin,
      "Unzulässiger Ursprung.",
    );
    ensure(
      Number(request.headers.get("content-length") ?? 0) < 20000,
      "Eingabe zu groß.",
    );
    const text = await request.text();
    ensure(text.length < 20000, "Eingabe zu groß.");
    const body = JSON.parse(text);
    ensure(env.DB, "Datenbank ist nicht verfügbar.");
    const db = env.DB;
    if (body.type === "create") {
      const now = Date.now(),
        p = player(body.name, body.avatar, now, 0, body.look);
      for (let i = 0; i < 8; i++) {
        const code = Array.from(
          { length: 6 },
          () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(random() * 32)],
        ).join("");
        const r = createRoom(code, p, now);
        const result = await db
          .prepare(
            "INSERT OR IGNORE INTO rooms (code,revision,state,updated_at) VALUES (?,0,?,?)",
          )
          .bind(code, JSON.stringify(r), now)
          .run();
        if (result.meta.changes)
          return json({
            playerId: p.id,
            token: p.token,
            room: publicRoom(r, p.id, now),
          });
      }
      throw new Error("Raum konnte nicht erstellt werden.");
    }
    ensure(
      typeof body.code === "string" && /^[A-Z2-9]{6}$/.test(body.code),
      "Ungültiger Raumcode.",
    );
    for (let attempt = 0; attempt < 15; attempt++) {
      const row = await db
        .prepare(
          "SELECT revision,state,(SELECT json_group_object(player_id,last_seen) FROM room_presence WHERE room_code=rooms.code) AS presence FROM rooms WHERE code=?",
        )
        .bind(body.code)
        .first<{ revision: number; state: string; presence: string }>();
      ensure(row, "Raum nicht gefunden.");
      const r = JSON.parse(row.state) as Room,
        initialNow = Date.now();
      let now = initialNow;
      const presence = JSON.parse(row.presence || "{}");
      for (const member of r.players)
        member.lastSeen = Math.max(member.lastSeen, presence[member.id] ?? 0);
      let p = r.players.find(
        (p) => p.id === body.playerId && p.token === body.token && !p.kicked,
      );
      let joined = false;
      if (body.type === "join" && !p) {
        ensure(r.players.filter(p=>!p.kicked).length < 24, "Dieser Raum ist voll.");
        p = player(body.name, body.avatar, now, r.players.length, body.look);
        p.spectator =
          r.phase !== "lobby" ||
          r.players.filter((x) => !x.spectator).length >= 12;
        r.players.push(p);
        joined = true;
      }
      ensure(p, "Sitzung nicht gefunden. Bitte tritt dem Raum erneut bei.");
      const before = JSON.stringify(r);
      now = Date.now();
      tickRoom(r, now);
      let actionError: string | undefined;
      if (body.type === "action") {
        ensure(
          typeof body.requestId === "string" && body.requestId.length <= 100,
          "Aktionskennung fehlt.",
        );
        if (!r.receipts.includes(`${p.id}:${body.requestId}`)) {
          const snapshot = structuredClone(r);
          try {
            // Only navigation needs link preparation. Polls and replayed receipts
            // must still work when Wikipedia is unavailable or the page changed.
            await prepareWiki(r, p.id, body.action, db);
            now = Date.now();
            tickRoom(r, now);
            roomAction(r, p, body.action, now);
            r.receipts.push(`${p.id}:${body.requestId}`);
            r.receipts = r.receipts.slice(-1024);
          } catch (e) {
            Object.assign(r, snapshot);
            p = r.players.find((x) => x.id === p!.id)!;
            actionError = (e as Error).message;
          }
        }
      }
      if (before !== JSON.stringify(r) || joined) {
        r.revision = row.revision + 1;
        const saved = await db
          .prepare(
            "UPDATE rooms SET state=?,revision=?,updated_at=? WHERE code=? AND revision=?",
          )
          .bind(JSON.stringify(r), r.revision, now, r.code, row.revision)
          .run();
        if (!saved.meta.changes) continue;
      }
      // Presence has its own rows so twelve heartbeats do not contend with game mutations.
      // Tick with the previous timestamp first: reconnecting after the grace period
      // must still abandon the current discipline before refreshing presence.
      if (now - p.lastSeen > 4000 || joined) {
        await db
          .prepare(
            "INSERT INTO room_presence (room_code,player_id,last_seen) VALUES (?,?,?) ON CONFLICT(room_code,player_id) DO UPDATE SET last_seen=MAX(room_presence.last_seen,excluded.last_seen)",
          )
          .bind(r.code, p.id, now)
          .run();
        p.lastSeen = now;
      }
      return json(
        {
          playerId: p.id,
          ...(body.type === "join" ? { token: p.token } : {}),
          room: await enrichWiki(publicRoom(r, p.id, Date.now()), db),
          ...(actionError ? { error: actionError } : {}),
        },
        actionError ? 400 : 200,
      );
    }
    return json(
      { error: "Viele gleichzeitige Eingaben. Bitte erneut versuchen." },
      409,
    );
  } catch (e) {
    const message = (e as Error).message || "Unbekannter Fehler.";
    if (
      /D1_ERROR|network connection|overloaded|temporarily unavailable/i.test(
        message,
      )
    )
      return json(
        {
          error:
            "Die Verbindung zum Spielspeicher ist kurz unterbrochen. Bitte erneut versuchen.",
        },
        503,
      );
    return json({ error: message }, 400);
  }
}
