import test from "node:test";
import assert from "node:assert/strict";
import { codeFeedback } from "../lib/game/code-feedback";
import { code } from "../lib/game/games/code";
import { award } from "../lib/game/scoring";
import type { Context } from "../lib/game/types";
const context = (): Context => ({
  ids: ["a", "b", "c"],
  now: 1000,
  settings: { id: "code", rounds: 1, seconds: 8 },
  random: () => 0.5,
  used: [],
});
function setup() {
  const c = context(),
    g = code.init(c);
  g.secret.code = [0, 1, 2, 3];
  const act = (id: string, a: any) =>
    code.action(g, id, { round: g.round + 1, turn: g.public.turn, ...a }, c);
  return { c, g, act };
}
test("Red and white pegs count duplicate colors exactly once, exhaustive reduced palette", () => {
  assert.deepEqual(codeFeedback([0, 1, 2, 3], [0, 2, 3, 1]), {
    exact: 1,
    misplaced: 3,
  });
  assert.deepEqual(codeFeedback([0, 0, 1, 1], [0, 1, 0, 0]), {
    exact: 1,
    misplaced: 2,
  });
  assert.deepEqual(codeFeedback([0, 1, 2, 3], [0, 0, 0, 0]), {
    exact: 1,
    misplaced: 0,
  });
  const decode = (n: number) =>
    Array.from({ length: 4 }, (_, i) => Math.floor(n / 3 ** i) % 3);
  for (let a = 0; a < 81; a++)
    for (let b = 0; b < 81; b++) {
      const s = decode(a),
        g = decode(b),
        r = codeFeedback(s, g);
      assert.equal(r.exact, s.filter((v, i) => v === g[i]).length);
      assert.equal(
        r.exact + r.misplaced,
        [0, 1, 2].reduce(
          (sum, v) =>
            sum +
            Math.min(
              s.filter((x) => x === v).length,
              g.filter((x) => x === v).length,
            ),
          0,
        ),
      );
      assert.deepEqual(r, codeFeedback(g, s));
    }
});
test("Shared turns reveal feedback only after everyone submits; no timer", () => {
  const { c, g, act } = setup();
  act("a", { type: "guess", colors: [0, 2, 3, 1] });
  assert.equal(g.players.a.guesses.length, 0);
  assert.equal(g.public.turn, 1);
  assert.equal(g.players.a.submitted, true);
  const b = code.view(g, "b", false);
  assert.equal(b.roster.a.guesses, undefined);
  assert.equal(b.roster.a.pending, undefined);
  assert.deepEqual(b.roster.a.feedback, []);
  assert.equal(b.secret, undefined);
  assert.equal(b.code, undefined);
  c.now += 10000000;
  code.tick(g, c);
  assert.equal(g.stage, "guess");
  assert.equal(g.public.turn, 1);
  act("b", { type: "guess", colors: [0, 0, 0, 0] });
  act("c", { type: "guess", colors: [1, 1, 1, 1] });
  assert.equal(g.public.turn, 2);
  assert.equal(g.players.a.submitted, false);
  assert.deepEqual(code.view(g, "b", false).roster.a.feedback, [
    { turn: 1, exact: 1, misplaced: 3 },
  ]);
  assert.equal(code.view(g, "b", false).roster.a.guesses, undefined);
  assert.throws(
    () => act("a", { type: "guess", colors: [0, 2, 3, 1] }),
    /bereits/,
  );
  act("a", { type: "guess", turn: 1, colors: [0, 2, 3, 1] });
  assert.equal(g.players.a.guesses.length, 1);
});
test("Solved players can spectate submitted colors while active players cannot; solver does not stop round", () => {
  const { g, act } = setup();
  act("a", { type: "guess", colors: [0, 1, 2, 3] });
  act("b", { type: "guess", colors: [0, 0, 0, 0] });
  act("c", { type: "guess", colors: [1, 1, 1, 1] });
  assert.equal(g.stage, "guess");
  assert.equal(g.players.a.solved, true);
  assert.equal(g.public.turn, 2);
  assert.deepEqual(
    code.view(g, "a", false).roster.b.guesses[0].colors,
    [0, 0, 0, 0],
  );
  assert.equal(code.view(g, "b", false).roster.a.guesses, undefined);
  act("b", { type: "guess", colors: [0, 0, 1, 1] });
  assert.deepEqual(code.view(g, "a", false).roster.b.pending, [0, 0, 1, 1]);
  assert.equal(code.view(g, "c", false).roster.b.pending, undefined);
  act("c", { type: "giveUp" });
  assert.equal(code.view(g, "c", false).canSpectate, true);
  assert.equal(g.public.turn, 3);
  act("b", { type: "guess", colors: [0, 1, 2, 3] });
  assert.equal(g.stage, "roundReveal");
  assert.deepEqual(g.public.reveal.code, [0, 1, 2, 3]);
  const result = award(code.results(g, context()), 3);
  assert.equal(result.find((r) => r.id === "a")!.rank, 1);
  assert.equal(result.find((r) => r.id === "b")!.rank, 2);
  assert.equal(result.find((r) => r.id === "c")!.points, 0);
});
test("Equal guesses share rank regardless of arrival time; no duplicate submission counted", () => {
  const { g, c, act } = setup();
  act("a", { type: "guess", colors: [0, 1, 2, 3] });
  act("a", { type: "guess", colors: [5, 5, 5, 5] });
  c.now += 500000;
  act("b", { type: "guess", colors: [0, 1, 2, 3] });
  act("c", { type: "giveUp" });
  assert.equal(g.players.a.guesses.length, 1);
  const rows = award(code.results(g, c), 3);
  assert.equal(rows[0].rank, 1);
  assert.equal(rows[1].rank, 1);
  assert.equal(rows[0].points, rows[1].points);
});
test("Validation, spectator writes, stale rounds and abandoned participants", () => {
  const { g, c, act } = setup();
  for (const colors of [
    [0, 1, 2],
    [0, 1, 2, 6],
    [0, 1, 2, 1.2],
    [0, 1, 2, "3"],
  ])
    assert.throws(() => act("a", { type: "guess", colors }));
  assert.throws(() => act("outsider", { type: "giveUp" }));
  assert.throws(() =>
    act("a", { type: "guess", round: 2, colors: [0, 1, 2, 3] }),
  );
  act("a", { type: "guess", colors: [0, 1, 2, 3] });
  g.players.b.abandoned = true;
  g.players.c.abandoned = true;
  code.tick(g, c);
  assert.equal(g.stage, "roundReveal");
  c.now = g.deadline;
  code.tick(g, c);
  assert.equal(g.stage, "done");
});
test("Multiple rounds rank solved count first then total guesses; independent of round order", () => {
  const { c, g, act } = setup();
  g.totalRounds = 2;
  act("a", { type: "guess", colors: [0, 1, 2, 3] });
  act("b", { type: "guess", colors: [0, 0, 0, 0] });
  act("c", { type: "giveUp" });
  act("b", { type: "guess", colors: [0, 1, 2, 3] });
  c.now = g.deadline;
  code.tick(g, c);
  assert.equal(g.public.turn, 1);
  assert.equal(g.players.a.guesses.length, 0);
  g.secret.code = [0, 1, 2, 3];
  act("a", { type: "giveUp" });
  act("b", { type: "guess", colors: [1, 1, 1, 1] });
  act("c", { type: "guess", colors: [0, 1, 2, 3] });
  act("b", { type: "guess", colors: [0, 1, 2, 3] });
  const rows = award(code.results(g, c), 3);
  assert.equal(rows.find((r) => r.id === "b")!.rank, 1);
  assert.equal(rows.find((r) => r.id === "a")!.rank, 2);
  assert.equal(rows.find((r) => r.id === "c")!.rank, 2);
});
