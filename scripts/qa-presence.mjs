import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.env.QA_URL ?? "http://127.0.0.1:5173";
async function call(body) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(base + "/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.status === 409 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      continue;
    }
    assert.equal(res.status, 200, data.error);
    return data;
  }
  throw new Error("Persistent conflict");
}
const created = await call({
    type: "create",
    name: "Presence Host",
    avatar: 0,
  }),
  code = created.room.code;
const sessions = [{ code, playerId: created.playerId, token: created.token }];
const joined = await Promise.all(
  Array.from({ length: 11 }, (_, i) =>
    call({ type: "join", code, name: `Presence ${i + 1}`, avatar: i + 1 }),
  ),
);
sessions.push(
  ...joined.map((p) => ({ code, playerId: p.playerId, token: p.token })),
);
const initial = await call({ type: "poll", ...sessions[0] }),
  revision = initial.room.revision;
await new Promise((r) => setTimeout(r, 5500));
const started = Date.now();
const states = await Promise.all(
  sessions.map((s) => call({ type: "poll", ...s })),
);
for (const state of states) {
  assert.equal(
    state.room.revision,
    revision,
    "Heartbeats must not rewrite room state",
  );
  assert.ok(
    state.room.players.find((p) => p.id === state.playerId).lastSeen >= started,
  );
}
const visible = await call({ type: "poll", ...sessions[0] });
assert.ok(visible.room.players.every((p) => p.connected));
const requestId = crypto.randomUUID();
await call({
  type: "action",
  ...sessions[0],
  requestId,
  action: { type: "ready" },
});
await call({
  type: "action",
  ...sessions[0],
  requestId,
  action: { type: "ready" },
});
const final = await call({ type: "poll", ...sessions[0] });
assert.equal(final.room.revision, revision + 1);
assert.equal(final.room.players[0].ready, true);
await mkdir("outputs/qa", { recursive: true });
await writeFile(
  "outputs/qa/presence.json",
  JSON.stringify(
    {
      base,
      passed: true,
      players: 12,
      heartbeatRoomWrites: 0,
      actionRoomWrites: 1,
    },
    null,
    2,
  ),
);
console.log(
  "PASS: 12 concurrent persisted heartbeats, zero room revision changes, connected crew, idempotent game mutation.",
);
