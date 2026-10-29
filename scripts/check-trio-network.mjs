import assert from "node:assert/strict";
import fs from "node:fs";
const url = "http://127.0.0.1:5173/api/room",
  wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(body) {
  const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    d = await r.json();
  assert.ok(r.ok, d.error);
  return d;
}
const command = (s, action) =>
    api({ ...s, type: "action", requestId: crypto.randomUUID(), action }),
  poll = async (s) => (await api({ ...s, type: "poll" })).room;
async function room(id) {
  const first = await api({ type: "create", name: "Alpha", avatar: 0 }),
    a = { code: first.room.code, playerId: first.playerId, token: first.token },
    members = [a];
  for (const name of ["Beta", "Gamma"]) {
    const p = await api({ type: "join", code: a.code, name, avatar: 1 });
    members.push({ code: a.code, playerId: p.playerId, token: p.token });
  }
  await command(a, {
    type: "configure",
    selection: [{ id, rounds: 1, seconds: 15 }],
  });
  for (const s of members) await command(s, { type: "ready" });
  await command(a, { type: "start" });
  for (const s of members) await command(s, { type: "ready" });
  await poll(a);
  await wait(3200);
  return members;
}
async function play(s, action) {
  const r = await poll(s);
  return command(s, {
    type: "game",
    phase: r.phaseKey,
    action: { ...action, round: r.game.round, turn: r.game.turn },
  });
}
await Promise.all([
  (async () => {
    const [a, b, c] = await room("auction");
    await play(a, { type: "topic", name: "Automarken" });
    await play(a, { type: "bid", value: 2 });
    await play(b, { type: "pass" });
    await play(c, { type: "pass" });
    await play(a, { type: "word", word: "BMW" });
    await play(a, { type: "word", word: "Audi" });
    assert.equal((await poll(b)).game.answers.length, 2);
    await play(a, { type: "finish" });
    await play(b, { type: "judge", votes: [true, true] });
    assert.equal((await poll(c)).game.mine.ballot, null);
    await play(c, { type: "judge", votes: [true, true] });
    assert.equal((await poll(a)).game.scores[a.playerId], 20);
    console.log(
      "PASS auction: three sessions, bidding, live words, private jury, points",
    );
  })(),
  (async () => {
    const members = await room("timing"),
      starts = [];
    for (const s of members) {
      starts.push(performance.now());
      await play(s, { type: "start" });
    }
    await wait(4200);
    for (const [i, s] of members.entries())
      await play(s, { type: "stop", elapsed: performance.now() - starts[i] });
    const r = await poll(members[0]);
    assert.equal(r.game.stage, "roundReveal");
    assert.ok(r.game.reveal.players.every((p) => p.elapsed >= 4000));
    console.log(
      "PASS timing: three independent starts/stops and shared reveal",
    );
  })(),
  (async () => {
    const [a, b, c] = await room("bomb"),
      r = await poll(a),
      words = JSON.parse(
        fs.readFileSync("lib/game/data/bomb-words.json", "utf8"),
      ),
      word = words.find((w) => w.includes(r.game.fragment.toLowerCase()));
    assert.ok(word);
    assert.equal(r.game.deadline, 0);
    await play(a, { type: "word", word });
    assert.equal((await poll(c)).game.turnId, b.playerId);
    const deadline = Date.now() + 40000;
    let out;
    while (Date.now() < deadline) {
      out = await poll(a);
      if (out.game.stage === "explosion") break;
      await wait(800);
    }
    assert.equal(out.game.roster[b.playerId].alive, false);
    console.log(
      "PASS bomb: dictionary acceptance, handoff, hidden fuse, server explosion",
    );
  })(),
]);
