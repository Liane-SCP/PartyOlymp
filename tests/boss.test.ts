import assert from "node:assert/strict";
import test from "node:test";
import { games } from "../lib/game/games";
import {
  colossusScore,
  dragonScore,
  krakenGauge,
  type BossId,
} from "../lib/game/boss-rules";
import { catalog, duration } from "../lib/game/catalog";
import type { Context } from "../lib/game/types";

function setup(id: BossId, count = 2, rounds = 6) {
  const c: Context = {
    now: 1000,
    ids: Array.from({ length: count }, (_, index) => `p${index}`),
    settings: { id, rounds, seconds: 30 },
    random: () => 0.37,
    used: [],
  };
  const module = games[id];
  const g = module.init(c);
  const advance = () => {
    c.now = g.deadline;
    module.tick(g, c);
  };
  const act = (player: string, action: any) =>
    module.action(g, player, { ...action, round: g.round + 1 }, c);
  return { c, g, module, advance, act };
}

test("Boss catalog entries are separate games with at least three attacks", () => {
  for (const id of ["colossus", "kraken", "dragon"] as const) {
    assert.equal(catalog.filter((game) => game.id === id).length, 1);
    assert.equal(setup(id, 2, 1).g.totalRounds, 3);
    assert.equal(
      duration([{ id, rounds: 1, seconds: 30 }], 2),
      duration([{ id, rounds: 3, seconds: 30 }], 2),
    );
  }
});

test("Colossus combinations and explicit armor weaknesses score consistently", () => {
  assert.equal(colossusScore([2, 2, 2, 2, 2], "pairs").score, 1500);
  assert.equal(colossusScore([1, 2, 3, 4, 5], "straight").score, 1200);
  assert.equal(colossusScore([1, 2, 3, 4, 4], "straight").score, 950);
  assert.equal(colossusScore([1, 1, 1, 3, 3], "kind").score, 1100);
  assert.equal(colossusScore([1, 1, 2, 2, 6], "pairs").score, 650);
  assert.equal(colossusScore([1, 1, 2, 3, 5], "kind").score, 200);
  assert.equal(colossusScore([1, 2, 3, 5, 6], "pairs").score, 100);
  assert.equal(colossusScore([0, 0, 0, 0, 0], "pairs").score, 0);
});

test("Colossus holds dice, limits rolls, rejects stale and repeated attacks", () => {
  const { c, g, advance, act, module } = setup("colossus");
  assert.throws(() => act("p0", { type: "roll" }));
  advance();
  assert.throws(() => act("p0", { type: "strike" }));
  assert.throws(() => act("p0", { type: "hold", index: 0 }));
  act("p0", { type: "roll" });
  act("p0", { type: "hold", index: 0 });
  c.random = () => 0.9;
  act("p0", { type: "roll" });
  assert.deepEqual(g.players.p0.dice, [3, 6, 6, 6, 6]);
  act("p0", { type: "roll" });
  assert.throws(() => act("p0", { type: "roll" }));
  assert.throws(() => module.action(g, "p0", { type: "strike", round: 0 }, c));
  assert.throws(() => act("spectator", { type: "roll" }));
  act("p0", { type: "strike" });
  assert.equal(module.view(g, "p1", false).roster[0].rolls, 3);
  assert.equal(module.view(g, "p1", false).players, undefined);
  assert.throws(() => act("p0", { type: "strike" }));
  act("p1", { type: "pass" });
  assert.equal(g.stage, "roundReveal");
  assert.equal(g.scores.p0, 1250);
  assert.equal(g.scores.p1, 0);
  assert.equal(g.public.reveal.outcomes[1].submitted, false);
});

test("Colossus applies local holds atomically with the roll and rejects forged first-roll holds", () => {
  const { c, g, advance, act } = setup("colossus");
  advance();
  assert.throws(() =>
    act("p0", { type: "roll", held: [true, false, false, false, false] }),
  );
  assert.equal(g.players.p0.rolls, 0);
  act("p0", { type: "roll", held: [false, false, false, false, false] });
  c.random = () => 0.99;
  act("p0", { type: "roll", held: [true, false, true, false, true] });
  assert.deepEqual(g.players.p0.dice, [3, 6, 3, 6, 3]);
  assert.throws(() => act("p0", { type: "roll", held: [true] }));
  assert.throws(() => act("p0", { type: "roll", held: [1, 0, 1, 0, 1] }));
  assert.equal(g.players.p0.rolls, 2);
  act("p0", { type: "roll", held: [false, true, false, true, false] });
  assert.deepEqual(g.players.p0.dice, [6, 6, 6, 6, 6]);
});

test("Kraken gauge is deterministic, moving phases retain a reachable perfect target", () => {
  for (const phase of [0, 1, 2]) {
    const samples = Array.from({ length: 3001 }, (_, ms) =>
      krakenGauge(ms, phase, 370000),
    );
    assert.ok(
      samples.every((sample) => sample.position >= 0 && sample.position <= 1),
    );
    assert.ok(
      samples.every(
        (sample) =>
          sample.target - sample.width / 2 >= 0 &&
          sample.target + sample.width / 2 <= 1,
      ),
    );
    assert.equal(Math.max(...samples.map((sample) => sample.accuracy)), 1);
    assert.deepEqual(
      krakenGauge(1050, phase, 42),
      krakenGauge(1050, phase, 42),
    );
  }
  assert.equal(krakenGauge(1020, 0, 0).accuracy, 1);
  assert.notEqual(
    krakenGauge(500, 1, 42).target,
    krakenGauge(1500, 1, 42).target,
  );
  assert.ok(krakenGauge(0, 0, 0).width > krakenGauge(0, 2, 0).width);
});

test("Kraken accepts local timing with delayed delivery and rejects impossible input", () => {
  const { c, g, module, advance, act } = setup("kraken");
  advance();
  assert.throws(() => act("p0", { type: "fire", elapsed: 1020 }));
  act("p0", { type: "start" });
  assert.equal(module.view(g, "p1", false).roster[0].charging, true);
  c.now += 250;
  act("p0", { type: "start" });
  assert.equal(g.players.p0.chargingStartedAt, c.now);
  assert.throws(() => act("p0", { type: "fire", elapsed: 15001 }));
  assert.throws(() => act("p0", { type: "fire", elapsed: Number.NaN }));
  assert.throws(() => act("p0", { type: "fire", elapsed: 5000 }));
  c.now += 6020;
  act("p0", { type: "fire", elapsed: 1020 });
  const view = module.view(g, "p1", false);
  assert.equal(view.roster[0].charging, false);
  assert.equal(view.roster[0].accuracy, undefined);
  assert.equal(view.roster[0].elapsed, undefined);
  assert.throws(() => act("p0", { type: "fire", elapsed: 1020 }));
  act("p1", { type: "pass" });
  assert.equal(g.scores.p0, 1000);
  assert.equal(g.players.p0.streak, 1);
});

test("Kraken series adds capped points and an unanswered attack resets it", () => {
  const { c, g, advance, act } = setup("kraken", 2, 30);
  advance();
  for (let attack = 0; attack < 5; attack++) {
    act("p0", { type: "start" });
    c.now += 1020;
    act("p0", { type: "fire", elapsed: 1020 });
    act("p1", { type: "pass" });
    assert.equal(
      g.public.reveal.outcomes[0].streakBonus,
      Math.min(attack, 3) * 100,
    );
    advance();
    if (g.stage === "intro") advance();
  }
  advance();
  assert.equal(g.stage, "roundReveal");
  assert.equal(g.players.p0.streak, 0);
});

test("Dragon percentage accuracy gives explicit risk trade-offs", () => {
  assert.equal(dragonScore(10000, 10000, "safe").score, 1000);
  assert.equal(dragonScore(10000, 10000, "risky").score, 1600);
  assert.equal(dragonScore(5000, 10000, "safe").score, 500);
  assert.equal(dragonScore(5000, 10000, "bold").score, 313);
  assert.equal(dragonScore(5000, 10000, "risky").score, 100);
  assert.equal(dragonScore(20000, 10000, "risky").score, 0);
  assert.equal(
    dragonScore(9000, 10000, "safe").score,
    dragonScore(11000, 10000, "safe").score,
  );
});

test("Dragon publishes only sanitized product metadata and keeps other guesses secret", () => {
  const { c, g, module, advance, act } = setup("dragon");
  const price = g.secret.product.price;
  const product = module.view(g, "p0", false).product;
  assert.deepEqual(Object.keys(product).sort(), [
    "category",
    "id",
    "image",
    "name",
    "priceDate",
  ]);
  assert.match(product.image, /^\/amazon-products\//);
  assert.equal(module.view(g, "spectator", false).mine, null);
  advance();
  assert.throws(() => act("p0", { type: "estimate", guess: 0, risk: "safe" }));
  assert.throws(() =>
    act("p0", { type: "estimate", guess: price, risk: "cheat" }),
  );
  act("p0", { type: "estimate", guess: price, risk: "risky" });
  const view = module.view(g, "p1", false);
  assert.equal(view.mine.guess, null);
  assert.equal(view.roster[0].guess, undefined);
  assert.equal(view.reveal, undefined);
  assert.equal(view.product.price, undefined);
  assert.equal(view.secret, undefined);
  act("p1", { type: "estimate", guess: price * 2, risk: "safe" });
  assert.equal(g.public.reveal.price, price);
  assert.equal(g.public.reveal.outcomes[0].guess, price);
  assert.equal(g.scores.p0, 1600);
  assert.equal(g.scores.p1, 0);
  const previousProduct = product.id;
  advance();
  assert.equal(g.public.reveal, undefined);
  assert.notEqual(g.public.product.id, previousProduct);
  assert.equal(g.players.p0.guess, null);
  assert.equal(c.used.length, 2);
});

for (const id of ["colossus", "kraken", "dragon"] as const) {
  for (const playerCount of [2, 12]) {
    test(`${id}: ${playerCount} simultaneous players break three separate phases without losing individual points`, () => {
      const { c, g, module, advance, act } = setup(id, playerCount, 3);
      const phaseNames: string[] = [];
      for (let phase = 0; phase < 3; phase++) {
        assert.equal(g.stage, "intro");
        assert.equal(g.public.boss.phase, phase);
        phaseNames.push(g.public.boss.phaseName);
        advance();
        const actions = c.ids.map((playerId) => {
          if (id === "colossus") {
            act(playerId, { type: "roll" });
            return { type: "strike" };
          }
          if (id === "dragon")
            return {
              type: "estimate",
              guess: g.secret.product.price,
              risk: "risky",
            };
          act(playerId, { type: "start" });
          let elapsed = 0;
          while (krakenGauge(elapsed, phase, g.public.seed).accuracy < 0.999)
            elapsed++;
          return { type: "fire", elapsed };
        });
        c.now += 3000;
        c.ids.forEach((playerId, index) => act(playerId, actions[index]));
        assert.equal(g.stage, "roundReveal");
        const reveal = g.public.reveal;
        assert.equal(reveal.phaseBroken, true);
        assert.equal(
          g.public.boss.phase,
          phase,
          "Current scene remains visible for the destruction cinematic",
        );
        assert.equal(reveal.hpAfter, g.public.boss.segmentHp * (2 - phase));
        assert.equal(reveal.totalDamage, g.public.boss.segmentHp);
        assert.equal(
          reveal.outcomes.reduce(
            (sum: number, row: any) => sum + row.damage,
            0,
          ),
          reveal.totalDamage,
        );
        assert.ok(reveal.totalScore > reveal.totalDamage);
        const before = g.scores.p0;
        module.tick(g, { ...c, now: c.now + 1 });
        assert.equal(g.scores.p0, before, "Resolution is never applied twice");
        advance();
      }
      assert.equal(g.stage, "done");
      assert.equal(g.public.boss.victory, true);
      assert.equal(new Set(phaseNames).size, 3);
      assert.ok(module.results(g, c).every((row) => row.valid && row.raw > 0));
    });
  }

  test(`${id}: timeouts, disconnected players and retreat always finish cleanly`, () => {
    const { c, g, module, advance, act } = setup(id, 2, 3);
    advance();
    g.players.p1.abandoned = true;
    act("p0", { type: "pass" });
    assert.equal(
      g.stage,
      "roundReveal",
      "An abandoned player does not block the shared volley",
    );
    let transitions = 0;
    while (String(g.stage) !== "done" && transitions++ < 20) advance();
    assert.equal(g.stage, "done");
    assert.equal(g.public.boss.victory, false);
    assert.equal(g.public.boss.hp, g.public.boss.maxHp);
    assert.equal(g.round, 2);
    assert.ok(module.results(g, c).every((row) => row.raw === 0 && !row.valid));
    assert.throws(() => act("p0", { type: "pass" }));
  });
}
