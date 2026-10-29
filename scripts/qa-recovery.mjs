import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.env.QA_URL ?? "http://127.0.0.1:5173";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function call(body, ok = true) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(base + "/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (response.status === 409 || response.status >= 500) {
      await delay(300 * (attempt + 1));
      continue;
    }
    if (ok) assert.equal(response.status, 200, data.error);
    return { ...data, status: response.status };
  }
  throw new Error("Persistent connection failure");
}
const created = await call({
  type: "create",
  name: "Recovery Host",
  avatar: 0,
});
const host = {
  code: created.room.code,
  playerId: created.playerId,
  token: created.token,
};
const joined = await call({
  type: "join",
  code: host.code,
  name: "Recovery Guest",
  avatar: 1,
});
const guest = {
  code: host.code,
  playerId: joined.playerId,
  token: joined.token,
};
const act = (s, action, ok = true) =>
  call({ type: "action", ...s, requestId: crypto.randomUUID(), action }, ok);
await act(host, {
  type: "configure",
  selection: [
    { id: "dice", rounds: 1, seconds: 8 },
    { id: "color", rounds: 1, seconds: 8 },
  ],
});
await act(host, { type: "ready" });
await act(guest, { type: "ready" });
await act(host, { type: "start" });
const started = Date.now();
let recovered = false,
  phase = "",
  target = [128, 128, 128],
  lastProgress = started,
  result;
while (Date.now() - started < 360000) {
  const response = await call({ type: "poll", ...guest });
  const room = response.room;
  result = room;
  if (room.phase !== phase) {
    phase = room.phase;
    console.log(`Recovery: ${room.selection[room.index].id} → ${phase}`);
  }
  if (!recovered && Date.now() - started >= 94000) {
    assert.equal(
      room.host,
      guest.playerId,
      "Host must transfer after 90 seconds",
    );
    const reconnect = await call({
      type: "join",
      ...host,
      name: "Recovery Host",
      avatar: 0,
    });
    assert.equal(reconnect.playerId, host.playerId);
    assert.equal(reconnect.room.host, guest.playerId);
    assert.equal(reconnect.room.game.id, "dice");
    assert.equal(reconnect.room.game.mine.abandoned, true);
    const forbidden = await act(
      host,
      {
        type: "game",
        phase: reconnect.room.phaseKey,
        action: { type: "roll" },
      },
      false,
    );
    assert.equal(forbidden.status, 400);
    assert.match(forbidden.error, /Wiederbeitrittsfrist verstrichen/);
    recovered = true;
    console.log(
      "Recovery: automatic host transfer, same identity, abandoned discipline blocks actions.",
    );
  }
  if (recovered) await call({ type: "poll", ...host });
  if (room.phase === "podium") break;
  if (room.phase === "rules") {
    if (!room.players.find((p) => p.id === guest.playerId).ready)
      await act(guest, { type: "ready" });
    if (recovered && !room.players.find((p) => p.id === host.playerId).ready)
      await act(host, { type: "ready" });
  }
  if (room.phase === "standings") await act(guest, { type: "continue" });
  if (room.phase === "playing") {
    const g = room.game,
      p = g.mine;
    if (g.id === "dice" && !p.done && !p.submitted && g.stage === "answer") {
      const a = p.rolls
        ? { type: "category", index: p.sheet.findIndex((x) => x === null) }
        : { type: "roll" };
      const answer = await act(
        guest,
        { type: "game", phase: room.phaseKey, action: a },
        false,
      );
      if (answer.status !== 200)
        assert.match(
          answer.error,
          /vergangenen|abgelaufen|Kategorie nicht verfügbar|nächsten gemeinsamen Zug/,
        );
    }
    if (g.id === "color" && g.stage === "answer") {
      target = g.target ?? target;
      if (room.serverTime >= g.previewUntil) {
        for (const member of [guest, host]) {
          const view = await call({ type: "poll", ...member });
          if (view.room.phase === "playing" && !view.room.game.mine.submitted)
            await act(member, {
              type: "game",
              phase: view.room.phaseKey,
              action: { type: "answer", value: target },
            });
        }
      }
    }
  }
  if (Date.now() - lastProgress > 20000) {
    console.log(
      `Recovery: running · ${Math.round((Date.now() - started) / 1000)} s`,
    );
    lastProgress = Date.now();
  }
  await delay(800);
}
assert.equal(recovered, true);
assert.equal(result.phase, "podium");
assert.equal(result.history.length, 2);
const abandoned = result.history[0].results.find((p) => p.id === host.playerId);
assert.equal(abandoned.valid, false);
assert.equal(abandoned.points, 0);
assert.equal(
  result.history[1].results.find((p) => p.id === host.playerId).valid,
  true,
);
await mkdir("outputs/qa", { recursive: true });
await writeFile(
  "outputs/qa/recovery.json",
  JSON.stringify(
    {
      base,
      passed: true,
      seconds: (Date.now() - started) / 1000,
      history: result.history,
    },
    null,
    2,
  ),
);
console.log(
  "PASS: real HTTP host loss, 90-second grace, transfer, identity recovery, abandoned discipline zero, active return next discipline.",
);
