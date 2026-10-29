import assert from "node:assert/strict";
const url = (process.env.QA_URL || "http://127.0.0.1:5173") + "/api/room";
const api = async body => {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json(); assert.ok(response.ok, data.error); return data;
};
const first = await api({ type: "create", name: "Journey Alpha", avatar: 0 });
const a = { code: first.room.code, playerId: first.playerId, token: first.token };
const second = await api({ type: "join", code: a.code, name: "Journey Beta", avatar: 1 });
const b = { code: a.code, playerId: second.playerId, token: second.token };
const command = (s, action, requestId = crypto.randomUUID()) => api({ ...s, type: "action", action, requestId });
const poll = async s => (await api({ ...s, type: "poll" })).room;
const waitFor = async phase => {
  const until = Date.now() + 90000;
  while (Date.now() < until) {
    const room = await poll(a); await poll(b);
    if (room.phase === phase) return room;
    await new Promise(r => setTimeout(r, 750));
  }
  throw new Error(`Timed out waiting for ${phase}`);
};
await command(a, { type: "configure", selection: Array.from({ length: 3 }, () => ({ id: "herd", rounds: 1, seconds: 15 })) });
await command(a, { type: "ready" }); await command(b, { type: "ready" }); await command(a, { type: "start" });
for (let index = 0; index < 3; index++) {
  let r = await waitFor("rules");
  if (index === 0) {
    const relic = r.journey.inventory.find(it => it.kind === "laurel"), requestId = crypto.randomUUID();
    await command(a, { type: "relic", item: relic.id }, requestId);
    await command(a, { type: "relic", item: relic.id }, requestId);
    assert.equal((await poll(a)).journey.inventory.length, 2);
    assert.equal((await poll(b)).journey.inventory.length, 3);
    assert.ok(!(await poll(b)).journey.inventory.some(it => it.id === relic.id));
  }
  await command(a, { type: "ready" }); await command(b, { type: "ready" });
  r = await waitFor("playing");
  await command(a, { type: "game", phase: r.phaseKey, action: { type: "answer", answer: "Banane" } });
  await command(b, { type: "game", phase: r.phaseKey, action: { type: "answer", answer: "Banane" } });
  r = await waitFor("standings");
  assert.equal(r.history.length, index + 1);
  if (index === 0) {
    assert.equal(r.history[0].results.find(it => it.id === a.playerId).points, 62.5);
    assert.equal(r.history[0].results.find(it => it.id === b.playerId).points, 50);
  }
  if (index === 1) {
    assert.equal(r.journey.chests, 1);
    const requestId = crypto.randomUUID();
    await command(a, { type: "chest", kind: "phoenix" }, requestId);
    await command(a, { type: "chest", kind: "phoenix" }, requestId);
    r = await poll(a); assert.equal(r.journey.chests, 0); assert.equal(r.journey.inventory.length, 3);
  }
  console.log(`D1 journey discipline ${index + 1}: synchronized, persisted, exactly-once scores verified`);
  await command(a, { type: "continue" });
}
const final = await poll(a); assert.equal(final.phase, "podium");
assert.equal(final.standings.find(p => p.id === a.playerId).points, 162.5);
assert.equal(final.standings.find(p => p.id === b.playerId).points, 150);
await command(a, { type: "rematch" });
assert.equal((await poll(a)).journey, null);
console.log("Real HTTP/D1: 2 players, full 3-game journey, relic use, request replay, private inventory, chest claim, podium and rematch passed.");
