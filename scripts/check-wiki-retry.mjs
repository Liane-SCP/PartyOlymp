import assert from "node:assert/strict";
const base = "http://127.0.0.1:5173/api/room";
async function api(body, status = 200) {
  const response = await fetch(base, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(response.status, status, data.error);
  return data;
}
const command = (s, action) =>
  api({ ...s, type: "action", requestId: crypto.randomUUID(), action });
const first = await api({ type: "create", name: "Wiki Retry", avatar: 0 });
const a = {
  code: first.room.code,
  playerId: first.playerId,
  token: first.token,
};
const second = await api({
  type: "join",
  code: a.code,
  name: "Wiki Peer",
  avatar: 1,
});
const b = { code: a.code, playerId: second.playerId, token: second.token };
await command(a, {
  type: "configure",
  selection: [{ id: "wiki", rounds: 1, seconds: 180 }],
});
for (const s of [a, b]) await command(s, { type: "ready" });
await command(a, { type: "start" });
for (const s of [a, b]) await command(s, { type: "ready" });
await api({ ...a, type: "poll" });
await new Promise((r) => setTimeout(r, 3200));
const room = (await api({ ...a, type: "poll" })).room;
assert.ok(room.game.article.links.length);
const next = room.game.article.links.find(
  (title) => title !== room.game.article.title,
);
const request = {
  ...a,
  type: "action",
  requestId: crypto.randomUUID(),
  action: {
    type: "game",
    phase: room.phaseKey,
    action: { type: "navigate", title: next },
  },
};
const navigated = await api(request);
assert.equal(navigated.room.game.path.length, 2);
const replayed = await api(request);
assert.deepEqual(replayed.room.game.path, navigated.room.game.path);
const bad = await api(
  {
    ...a,
    type: "action",
    requestId: crypto.randomUUID(),
    action: {
      type: "game",
      phase: replayed.room.phaseKey,
      action: { type: "navigate", title: "__not_a_real_article_link__" },
    },
  },
  400,
);
assert.ok(
  bad.room,
  "Rejected navigation must include the current playable room",
);
assert.deepEqual(bad.room.game.path, navigated.room.game.path);
await command(a, { type: "emote", emote: 0 });
assert.equal(
  (await api({ ...b, type: "poll" })).room.game.racers[a.playerId].clicks,
  1,
);
console.log(
  "PASS Wiki real HTTP: article navigation, repeated receipt exactly once, invalid link rollback, emotes and peer progress.",
);
