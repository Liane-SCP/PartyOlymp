import assert from "node:assert/strict";
const url = "http://127.0.0.1:5173/api/room";
async function api(body) {
  const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    data = await response.json();
  assert.ok(response.ok, data.error);
  return data;
}
const command = (s, action) =>
    api({ ...s, type: "action", requestId: crypto.randomUUID(), action }),
  poll = async (s) => (await api({ ...s, type: "poll" })).room;
const first = await api({ type: "create", name: "Code Alpha", avatar: 0 }),
  a = { code: first.room.code, playerId: first.playerId, token: first.token },
  members = [a];
for (const name of ["Code Beta", "Code Gamma"]) {
  const p = await api({ type: "join", code: a.code, name, avatar: 1 });
  members.push({ code: a.code, playerId: p.playerId, token: p.token });
}
await command(a, {
  type: "configure",
  selection: [{ id: "code", rounds: 1, seconds: 8 }],
});
for (const s of members) await command(s, { type: "ready" });
await command(a, { type: "start" });
for (const s of members) await command(s, { type: "ready" });
await poll(a);
await new Promise((r) => setTimeout(r, 3200));
async function play(s, action) {
  const r = await poll(s);
  return command(s, {
    type: "game",
    phase: r.phaseKey,
    action: { ...action, round: r.game.round, turn: r.game.turn },
  });
}
const [_, b, c] = members;
await play(a, { type: "guess", colors: [0, 1, 2, 3] });
let v = await poll(b);
assert.deepEqual(v.game.roster[a.playerId].feedback, []);
assert.equal(v.game.roster[a.playerId].pending, undefined);
assert.equal(v.game.roster[a.playerId].guesses, undefined);
await Promise.all([
  play(b, { type: "guess", colors: [1, 2, 3, 4] }),
  play(c, { type: "guess", colors: [2, 3, 4, 5] }),
]);
v = await poll(a);
assert.equal(v.game.turn, 2);
assert.equal(v.game.mine.guesses.length, 1);
assert.equal(v.game.deadline, 0);
// Give up an unsolved account to verify the server changes its read access.
const observer = members.find((s) => !v.game.roster[s.playerId].solved);
assert.ok(observer);
await play(observer, { type: "giveUp" });
const watched = await poll(observer);
assert.equal(watched.game.canSpectate, true);
assert.ok(
  members.every((s) => watched.game.roster[s.playerId].guesses.length === 1),
);
for (const s of members) {
  const r = await poll(s);
  if (r.game.stage === "guess" && !r.game.mine.solved && !r.game.mine.gaveUp)
    await play(s, { type: "giveUp" });
}
assert.equal((await poll(a)).game.stage, "roundReveal");
console.log(
  "PASS real API: 3 authenticated sessions, simultaneous writes, turn barrier, private guesses, spectator access, round end",
);
