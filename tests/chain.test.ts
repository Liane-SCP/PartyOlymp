import test from "node:test";
import assert from "node:assert/strict";
import { chain } from "../lib/game/games/chain";
import { chainTopics } from "../lib/game/chain-content";
import type { Context } from "../lib/game/types";
const context = (n = 3): Context => ({
  ids: ["a", "b", "c"].slice(0, n),
  now: 1000,
  settings: { id: "chain", rounds: 1, seconds: 20 },
  used: [],
  random: () => 0,
});
function start(c: Context) {
  const g = chain.init(c);
  for (const id of c.ids) chain.action(g, id, {type:"suggestTopic", name:"Automarken", round:1, turn:0}, c);
  c.now = g.deadline;
  chain.tick(g,c);
  return g;
}
test("Kategorien-Kette: 50 distinct categories, turn order, duplicates, eliminated voters and scores", () => {
  assert.equal(chainTopics.length, 50);
  assert.equal(new Set(chainTopics.map((t) => t.name)).size, 50);
  const c = context(),
    g = start(c);
  const play = (id: string, action: any) =>
    chain.action(g, id, { ...action, round: 1, turn: g.public.turn }, c);
  const advance = () => {
    c.now = g.deadline + 1;
    chain.tick(g, c);
  };
  assert.throws(() => play("b", { type: "answer", answer: "BMW" }));
  play("a", { type: "answer", answer: "BMW" });
  assert.equal(g.stage, "review");
  play("b", { type: "approve" });
  play("c", { type: "approve" });
  assert.equal(g.public.lastOutcome.valid, true);
  advance();
  assert.equal(g.public.turnId, "b");
  play("b", { type: "answer", answer: "B.M.W.!" });
  assert.equal(g.players.b.alive, false);
  assert.equal(g.public.lastOutcome.reason, "Doppelt genannt");
  advance();
  assert.equal(g.public.turnId, "c");
  play("c", { type: "answer", answer: "Opel" });
  play("a", { type: "challenge" });
  assert.equal(chain.view(g, "b", false).mine.ballot, null);
  assert.equal(chain.view(g, "b", false).verdict, null);
  assert.throws(() => play("c", { type: "vote", valid: true }));
  play("b", { type: "vote", valid: true });
  assert.equal(g.public.lastOutcome.valid, true); // eliminated players can vote; tie accepts
  advance();
  assert.equal(g.public.turnId, "a");
  play("a", { type: "answer", answer: "Banane" });
  play("c", { type: "challenge" });
  play("b", { type: "vote", valid: false });
  assert.equal(g.players.a.alive, false);
  advance();
  assert.equal(g.stage, "roundReveal");
  assert.equal(g.public.reveal.winner, "c");
  assert.equal(g.scores.c, 100);
  assert.equal(g.scores.a, 50);
  assert.equal(g.scores.b, 0);
  advance();
  assert.equal(g.stage, "done");
  assert.equal(g.scores.c, 100);
});
test("Kategorien-Kette: unchallenged answers, missed turn, stale commands, and two-player review", () => {
  const c = context(2),
    g = start(c);
  chain.action(
    g,
    "a",
    { type: "answer", round: 1, turn: 1, answer: "Audi" },
    c,
  );
  c.now = g.deadline + 1;
  chain.tick(g, c);
  assert.equal(g.public.lastOutcome.valid, true);
  c.now = g.deadline + 1;
  chain.tick(g, c);
  assert.equal(g.public.turnId, "b");
  assert.throws(() =>
    chain.action(g, "a", { type: "challenge", round: 1, turn: 1 }, c),
  );
  c.now = g.deadline + 1;
  chain.tick(g, c);
  assert.equal(g.players.b.alive, false);
  c.now = g.deadline + 1;
  chain.tick(g, c);
  assert.equal(g.public.reveal.winner, "a");
  const c2 = context(2),
    g2 = start(c2);
  chain.action(
    g2,
    "a",
    { type: "answer", round: 1, turn: 1, answer: "Pizza" },
    c2,
  );
  chain.action(g2, "b", { type: "challenge", round: 1, turn: 1 }, c2);
  assert.equal(g2.players.a.alive, false);
  assert.equal(g2.stage, "turnReveal");
});
