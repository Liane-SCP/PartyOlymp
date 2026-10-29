import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const base = process.env.QA_URL ?? "http://127.0.0.1:5173";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const products = JSON.parse(
  await readFile("lib/game/data/amazon-products.json", "utf8"),
);
await mkdir("outputs/qa", { recursive: true });
await build({
  entryPoints: ["lib/game/boss-rules.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "outputs/qa/boss-network-rules.mjs",
});
const { colossusScore, krakenGauge } =
  await import("../outputs/qa/boss-network-rules.mjs");

async function api(body, expected = 200) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(base + "/api/room", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if ((response.status === 409 || response.status >= 500) && attempt < 4) {
      await delay(100 + attempt * 200);
      continue;
    }
    assert.equal(response.status, expected, data.error ?? JSON.stringify(data));
    return data;
  }
  throw new Error("Repeated API conflict");
}
const command = (
  session,
  action,
  requestId = crypto.randomUUID(),
  expected = 200,
) => api({ ...session, type: "action", action, requestId }, expected);
const poll = async (session) => (await api({ ...session, type: "poll" })).room;
const sessionFrom = (response) => ({
  code: response.room.code,
  playerId: response.playerId,
  token: response.token,
});

async function run(kind, count) {
  const host = sessionFrom(
    await api({ type: "create", name: `Boss ${count}`, avatar: 0 }),
  );
  const members = [host];
  for (let i = 1; i < count; i++)
    members.push(
      sessionFrom(
        await api({
          type: "join",
          code: host.code,
          name: `Crew ${i + 1}`,
          avatar: i % 12,
        }),
      ),
    );
  await command(host, {
    type: "configure",
    selection: [{ id: kind, rounds: 3, seconds: 45 }],
  });
  await Promise.all(
    members.map((member) => command(member, { type: "ready" })),
  );
  await command(host, { type: "start" });
  await Promise.all(
    members.map((member) => command(member, { type: "ready" })),
  );
  let room, introKey;
  const setupDeadline = Date.now() + 25000;
  do {
    room = await poll(host);
    if (room.game?.stage === "intro") introKey = room.phaseKey;
    if (room.phase === "playing" && room.game.stage === "answer") break;
    assert.ok(
      Date.now() < setupDeadline,
      `${kind}/${count}: intro did not finish`,
    );
    await delay(350);
  } while (true);
  assert.equal(room.game.id, kind);
  assert.equal(room.game.totalRounds, 3);
  assert.ok(introKey);
  const phase = room.phaseKey;
  const round = room.game.round;
  const play = (member, action, requestId, expected = 200) =>
    command(
      member,
      { type: "game", phase, action: { ...action, round } },
      requestId,
      expected,
    );
  await command(
    host,
    { type: "game", phase: introKey, action: { type: "pass", round } },
    undefined,
    400,
  );
  assert.equal(
    (await poll(host)).game.mine.submitted,
    false,
    "Stale intro actions must not consume the current attack",
  );

  let finishActions;
  if (kind === "colossus") {
    const receipt = crypto.randomUUID();
    await play(host, { type: "roll" }, receipt);
    await play(host, { type: "roll" }, receipt);
    assert.equal(
      (await poll(host)).game.mine.rolls,
      1,
      "The same request receipt must not roll twice",
    );
    await Promise.all(
      members.slice(1).map((member) => play(member, { type: "roll" })),
    );
    await play(host, { type: "hold", index: 0 });
    const held = (await poll(host)).game.mine.dice[0];
    await play(host, { type: "roll" });
    assert.equal((await poll(host)).game.mine.dice[0], held);
    finishActions = members.map(() => ({ type: "strike" }));
  } else if (kind === "kraken") {
    await Promise.all(members.map((member) => play(member, { type: "start" })));
    // Authentic local duration; wait once while all cannons charge concurrently.
    await delay(1020);
    finishActions = members.map(() => ({ type: "fire", elapsed: 1020 }));
    assert.equal(krakenGauge(1020, 0, room.game.seed).accuracy, 1);
  } else {
    assert.deepEqual(Object.keys(room.game.product).sort(), [
      "category",
      "id",
      "image",
      "name",
      "priceDate",
    ]);
    const product = products.find((entry) => entry.id === room.game.product.id);
    assert.ok(product);
    finishActions = members.map((_, index) => ({
      type: "estimate",
      guess: product.price,
      risk: index === 0 ? "bold" : "risky",
    }));
  }

  const receipt = crypto.randomUUID();
  await play(host, finishActions[0], receipt);
  await play(host, finishActions[0], receipt);
  const opponent = await poll(members[1]);
  assert.equal(
    opponent.game.stage,
    "answer",
    "One player must not trigger a premature volley",
  );
  assert.equal(opponent.game.reveal, undefined);
  assert.equal(opponent.game.mine.submitted, false);
  assert.equal(opponent.game.players, undefined);
  assert.equal(opponent.game.secret, undefined);
  assert.equal(
    opponent.game.roster.find((entry) => entry.id === host.playerId).submitted,
    true,
  );
  assert.ok(
    opponent.game.roster.every(
      (entry) =>
        entry.guess === undefined &&
        entry.dice === undefined &&
        entry.elapsed === undefined,
    ),
  );
  if (kind === "dragon") {
    assert.equal(opponent.game.product.price, undefined);
    assert.equal(opponent.game.mine.guess, null);
  }
  await play(host, finishActions[0], undefined, 400);
  await Promise.all(
    members
      .slice(1)
      .map((member, index) => play(member, finishActions[index + 1])),
  );
  const states = await Promise.all(members.map(poll));
  const final = states[0];
  assert.equal(final.game.stage, "roundReveal");
  assert.equal(final.game.reveal.outcomes.length, count);
  assert.equal(
    final.game.boss.phase,
    0,
    "Keep the attacked model phase during the destruction sequence",
  );
  assert.notEqual(final.phaseKey, phase);
  assert.ok(
    states.every(
      (state) => state.game.revealStartedAt === final.game.revealStartedAt,
    ),
  );
  assert.ok(
    states.every(
      (state) =>
        JSON.stringify(state.game.scores) === JSON.stringify(final.game.scores),
    ),
  );
  const total = final.game.reveal.outcomes.reduce((sum, outcome) => {
    assert.ok(outcome.submitted && outcome.score > 0);
    assert.equal(final.game.scores[outcome.id], outcome.score);
    if (kind === "colossus")
      assert.equal(
        outcome.score,
        colossusScore(outcome.dice, final.game.weakness).score,
      );
    if (kind === "kraken") assert.equal(outcome.score, 1000);
    if (kind === "dragon")
      assert.equal(outcome.score, outcome.id === host.playerId ? 1250 : 1600);
    return sum + outcome.damage;
  }, 0);
  assert.equal(total, final.game.reveal.totalDamage);
  assert.equal(final.game.boss.maxHp - final.game.boss.hp, total);
  if (kind !== "colossus") assert.equal(final.game.reveal.phaseBroken, true);
  await play(host, finishActions[0], undefined, 400);
  assert.deepEqual(
    (await poll(host)).game.scores,
    final.game.scores,
    "Late duplicates never add points",
  );
  const result = {
    kind,
    players: count,
    sharedDamage: total,
    individualScores: Object.values(final.game.scores),
    stage: final.game.stage,
    checked: [
      "authentication",
      "phase guard",
      "idempotency",
      "simultaneous writes",
      "private answers",
      "shared cinematic timestamp",
      "authoritative scores",
    ],
  };
  console.log(
    `PASS ${kind}: ${count} authenticated players, private decisions, simultaneous volley, scoring and retries`,
  );
  return result;
}

// Three independent rooms run concurrently, then repeat with a full twelve-person crew.
const reports = [];
for (const count of [2, 12])
  reports.push(
    ...(await Promise.all(
      ["colossus", "kraken", "dragon"].map((kind) => run(kind, count)),
    )),
  );
await writeFile(
  "outputs/qa/boss-network.json",
  JSON.stringify({ at: new Date().toISOString(), base, reports }, null, 2),
);
console.log(`PASS all ${reports.length} boss multiplayer scenarios`);
