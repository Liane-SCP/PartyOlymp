import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const base = process.env.QA_URL ?? "http://127.0.0.1:5173";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (body) => {
  const res = await fetch(base + "/api/room", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};
const identity = (data) => ({
  code: data.room.code,
  playerId: data.playerId,
  token: data.token,
});
async function room(game) {
  const host = identity(
    await api({ type: "create", name: "Netcode Host", avatar: 0 }),
  );
  const guest = identity(
    await api({
      type: "join",
      code: host.code,
      name: "Netcode Gast",
      avatar: 1,
    }),
  );
  const action = (s, action) =>
    api({ type: "action", ...s, requestId: crypto.randomUUID(), action });
  await action(host, {
    type: "configure",
    selection: [{ id: game, rounds: 1, seconds: 30 }],
  });
  await action(host, { type: "ready", ready: true });
  await action(guest, { type: "ready", ready: true });
  await action(host, { type: "start" });
  await action(host, { type: "ready", ready: true });
  await action(guest, { type: "ready", ready: true });
  return { host, guest, action };
}
async function connect(s) {
  const ws = new WebSocket(base.replace(/^http/, "ws") + "/api/live");
  let latest;
  const snapshots = [];
  const errors = [];
  ws.addEventListener("message", (e) => {
    const data = JSON.parse(e.data);
    if (data.type === "snapshot") {
      latest = data.room;
      snapshots.push({ at: Date.now(), room: data.room });
    }
    if (data.type === "error") errors.push(data.error);
  });
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  ws.send(JSON.stringify(s));
  const frames = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN)
      ws.send(JSON.stringify({ type: "frame" }));
  }, 70);
  ws.addEventListener("close", () => clearInterval(frames));
  return {
    ws,
    get latest() {
      return latest;
    },
    snapshots,
    errors,
    send(action) {
      ws.send(
        JSON.stringify({
          type: "action",
          requestId: crypto.randomUUID(),
          action,
        }),
      );
    },
  };
}
async function until(fn, ms = 20000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (fn()) return;
    await wait(25);
  }
  throw new Error("Timed out waiting for live state");
}
const w = await room("wiki"),
  client = await connect(w.host);
try {
  await until(() => client.latest?.game?.article?.live, 35000);
  const g = client.latest.game;
  assert.ok(g.article.html?.length > 1000);
  assert.ok(g.article.links.length > 10);
  const target = g.article.links.find((t) => t !== g.target && t !== g.start);
  const before = client.latest.phaseKey;
  client.send({
    type: "game",
    phase: before,
    action: { type: "navigate", title: target },
  });
  await until(() => client.latest?.game?.path?.length === 2, 25000);
  assert.ok(client.latest.game.article?.live);
  assert.ok(client.latest.game.article.title);
  assert.deepEqual(client.errors, []);
  console.log(
    "PASS: full live Wikipedia article and server-validated navigation beyond the curated bank.",
  );
} finally {
  client.ws.close();
}
