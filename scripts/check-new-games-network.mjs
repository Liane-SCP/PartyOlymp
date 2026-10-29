import assert from "node:assert/strict";
import fs from "node:fs/promises";
const url = "http://127.0.0.1:5173/api/room",
  results = [];
async function api(body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  assert.equal(r.ok, true, data.error);
  return data;
}
const command = (s, action) =>
  api({ ...s, type: "action", requestId: crypto.randomUUID(), action });
for (const mode of ["typer", "herd", "spectrum", "geo"]) {
  const first = await api({ type: "create", name: "Alpha", avatar: 0 }),
    a = { code: first.room.code, playerId: first.playerId, token: first.token };
  const second = await api({
      type: "join",
      code: a.code,
      name: "Beta",
      avatar: 1,
    }),
    b = { code: a.code, playerId: second.playerId, token: second.token };
  await command(a, {
    type: "configure",
    selection: [{ id: mode, rounds: 1, seconds: 90 }],
  });
  await command(a, { type: "ready" });
  await command(b, { type: "ready" });
  await command(a, { type: "start" });
  await command(a, { type: "ready" });
  await command(b, { type: "ready" });
  await api({ ...a, type: "poll" });
  await new Promise((r) => setTimeout(r, 3200));
  let ra = (await api({ ...a, type: "poll" })).room,
    rb = (await api({ ...b, type: "poll" })).room;
  assert.equal(ra.game.id, mode);
  assert.equal(ra.phase, "playing");
  const play = async (s, action) => {
    const current = (await api({ ...s, type: "poll" })).room;
    return command(s, { type: "game", phase: current.phaseKey, action });
  };
  if (mode === "typer") {
    await play(a, { type: "type", seq: 1, text: ra.game.text.slice(0, 12) });
    rb = (await api({ ...b, type: "poll" })).room;
    assert.equal(rb.game.racers[a.playerId].progress, 12);
    await play(a, { type: "type", seq: 2, text: ra.game.text });
    await play(b, { type: "type", seq: 1, text: ra.game.text });
  }
  if (mode === "herd") {
    await play(a, { type: "answer", answer: "Banane" });
    rb = (await api({ ...b, type: "poll" })).room;
    assert.equal(rb.game.mine.answer, null);
    assert.ok(!JSON.stringify(rb.game).includes("Banane"));
    await play(b, { type: "answer", answer: "banane" });
  }
  if (mode === "spectrum") {
    assert.equal(typeof ra.game.target, "number");
    assert.equal(rb.game.target, undefined);
    await play(a, { type: "clue", clue: "Sonne" });
    rb = (await api({ ...b, type: "poll" })).room;
    assert.equal(rb.game.clue, "Sonne");
    assert.equal(rb.game.target, undefined);
    await play(b, { type: "lock", value: ra.game.target });
  }
  if (mode === "geo") {
    await play(a, { type: "pin", lat: 52, lon: 13 });
    rb = (await api({ ...b, type: "poll" })).room;
    assert.equal(rb.game.mine.answer, null);
    assert.equal(rb.game.place, undefined);
    await play(b, { type: "pin", lat: 48, lon: 2 });
  }
  if (mode === "blocks") {
    await play(a, {
      type: "inputs",
      inputs: [
        { seq: 1, key: "left" },
        { seq: 2, key: "cw" },
        { seq: 3, key: "drop" },
      ],
    });
    rb = (await api({ ...b, type: "poll" })).room;
    assert.ok(
      rb.game.fields[a.playerId].board.some((row) => row.some(Boolean)),
    );
    assert.equal(rb.game.deadline, 0);
    await play(b, {
      type: "inputs",
      inputs: [
        { seq: 1, key: "hold" },
        { seq: 2, key: "drop" },
      ],
    });
  }
  ra = (await api({ ...a, type: "poll" })).room;
  assert.equal(ra.game.stage, mode === "blocks" ? "battle" : "roundReveal");
  results.push({ mode, stage: ra.game.stage, multiplayer: true });
  console.log("PASS", mode);
}
await fs.writeFile(
  "outputs/qa/new-games-network.json",
  JSON.stringify(results, null, 2),
);
