import test from "node:test";
import assert from "node:assert/strict";
import { categories } from "../lib/game/games/categories";
import type { Context } from "../lib/game/types";
const context = (): Context => ({
  ids: ["a", "b"],
  now: 1000,
  settings: { id: "categories", rounds: 1, seconds: 90 },
  used: [],
  random: () => 0,
});
test("Stadt Land Fluss: private drafts, synchronized voting, duplicates and final scoring", () => {
  const c = context(),
    g = categories.init(c);
  const a = ["Australien", "", "Apfel", "Affe", "", "", ""];
  const b = ["Argentinien", "", "", "Affe", "", "", ""];
  categories.action(g, "a", { type: "draft", round: 1, seq: 1, answers: a }, c);
  const other = categories.view(g, "b", false);
  assert.equal(JSON.stringify(other).includes("Australien"), false);
  assert.equal(other.progress.a.filled, 3);
  categories.action(g, "a", { type: "draft", round: 1, seq: 0, answers: b }, c);
  assert.equal(g.players.a.answers[0], "Australien");
  categories.action(
    g,
    "a",
    { type: "answer", round: 1, seq: 2, answers: a },
    c,
  );
  categories.action(
    g,
    "b",
    { type: "answer", round: 1, seq: 1, answers: b },
    c,
  );
  assert.equal(g.stage, "vote");
  let stages = 0;
  while (String(g.stage) !== "roundReveal" && stages++ < 30) {
    if (g.stage === "vote") {
      const ballot = Object.fromEntries(
        g.public.options
          .filter((o: any) => o.formatValid)
          .map((o: any) => [o.key, true]),
      );
      categories.action(
        g,
        "a",
        {
          type: "vote",
          round: 1,
          categoryIndex: g.public.categoryIndex,
          ballot,
        },
        c,
      );
      assert.equal(categories.view(g, "b", false).mine.ballot, null);
      assert.equal(categories.view(g, "b", false).options[0].yes, undefined);
      assert.throws(() =>
        categories.action(
          g,
          "a",
          {
            type: "vote",
            round: 1,
            categoryIndex: g.public.categoryIndex,
            ballot,
          },
          c,
        ),
      );
      categories.action(
        g,
        "b",
        {
          type: "vote",
          round: 1,
          categoryIndex: g.public.categoryIndex,
          ballot,
        },
        c,
      );
    } else {
      c.now = g.deadline + 1;
      categories.tick(g, c);
    }
  }
  assert.equal(g.stage, "roundReveal");
  assert.equal(g.public.reveal.reviews.length, 7);
  assert.equal(g.scores.a, 35);
  assert.equal(g.scores.b, 15);
  assert.equal(g.public.reveal.players[0].categories[3].score, 5);
  c.now = g.deadline + 1;
  categories.tick(g, c);
  assert.equal(g.stage, "done");
  assert.equal(g.scores.a, 35);
});
test("Stadt Land Fluss: timer preserves drafts; tied votes, wrong letters and missing votes score zero", () => {
  const c = context(),
    g = categories.init(c);
  categories.action(
    g,
    "a",
    {
      type: "draft",
      round: 1,
      seq: 1,
      answers: ["Australien", "Bibi", "", "", "", "", ""],
    },
    c,
  );
  assert.throws(() =>
    categories.action(
      g,
      "a",
      { type: "draft", round: 2, seq: 2, answers: Array(7).fill("A") },
      c,
    ),
  );
  c.now = g.deadline + 1;
  categories.tick(g, c);
  assert.equal(g.stage, "vote");
  categories.action(
    g,
    "a",
    { type: "vote", round: 1, categoryIndex: 0, ballot: { "option-0": true } },
    c,
  );
  categories.action(
    g,
    "b",
    { type: "vote", round: 1, categoryIndex: 0, ballot: { "option-0": false } },
    c,
  );
  assert.equal(g.public.lastReview.options[0].reason, "Gleichstand");
  c.now = g.deadline + 1;
  categories.tick(g, c);
  assert.equal(
    g.public.lastReview.options[0].reason,
    "Falscher Anfangsbuchstabe",
  );
  for (let i = 0; i < 10 && String(g.stage) !== "roundReveal"; i++) {
    c.now = g.deadline + 1;
    categories.tick(g, c);
  }
  assert.equal(g.stage, "roundReveal");
  assert.equal(g.scores.a, 0);
  const g2 = categories.init(context()),
    c2 = context();
  categories.action(
    g2,
    "a",
    {
      type: "answer",
      round: 1,
      seq: 1,
      answers: ["Australien", "", "", "", "", "", ""],
    },
    c2,
  );
  c2.now = g2.deadline + 1;
  categories.tick(g2, c2);
  c2.now = g2.deadline + 1;
  categories.tick(g2, c2);
  assert.equal(g2.public.lastReview.options[0].reason, "Keine Stimmen");
});
