import test from "node:test";
import assert from "node:assert/strict";
import { auction } from "../lib/game/games/auction";
import { timing } from "../lib/game/games/timing";
import { bomb, bombKey } from "../lib/game/games/bomb";
import words from "../lib/game/data/bomb-words.json";
import fragments from "../lib/game/data/bomb-fragments.json";
import type { Context, GameId } from "../lib/game/types";
const ctx = (id: GameId, n = 3): Context => ({
  ids: ["a", "b", "c"].slice(0, n),
  settings: { id, rounds: 2, seconds: 30 },
  now: 1000,
  used: [],
  random: () => 0.5,
});
test("Auktion: Rechte, Überbieten, Passen, live Begriffe, geheime Mehrheitsprüfung und Minuswertung", () => {
  const c = ctx("auction"),
    g = auction.init(c),
    act = (id: string, a: any) => auction.action(g, id, { round: 1, ...a }, c);
  assert.throws(() => act("b", { type: "topic", name: "Pokémon" }));
  act("a", { type: "topic", name: "Pokémon" });
  act("b", { type: "bid", value: 2 });
  assert.throws(() => act("a", { type: "bid", value: 2 }));
  act("a", { type: "bid", value: 3 });
  act("b", { type: "pass" });
  assert.throws(() => act("b", { type: "bid", value: 4 }));
  act("c", { type: "pass" });
  assert.equal(g.stage, "perform");
  act("a", { type: "word", word: "Pikachu" });
  assert.throws(() => act("a", { type: "word", word: "PIKACHU!" }));
  act("a", { type: "word", word: "Evoli" });
  act("a", { type: "word", word: "Banane" });
  assert.equal(auction.view(g, "b", false).answers.length, 3);
  act("a", { type: "finish" });
  assert.throws(() => act("a", { type: "judge", votes: [true, true, true] }));
  act("b", { type: "judge", votes: [true, true, false] });
  assert.equal(auction.view(g, "c", false).mine.ballot, null);
  assert.equal(
    JSON.stringify(auction.view(g, "c", false)).includes('"votes"'),
    false,
  );
  act("c", { type: "judge", votes: [true, true, true] });
  assert.equal(g.public.reveal.count, 2);
  assert.equal(g.scores.a, -30);
  assert.equal(g.stage, "roundReveal");
  c.now = g.deadline + 1;
  auction.tick(g, c);
  assert.equal(g.public.setter, "b");
  assert.throws(() => act("a", { type: "topic", name: "Alt" }));
});
test("Auktion: erfolgreiche Extra-Antwort, Ablauf ohne Gebote und nur einmal Punkte", () => {
  const c = ctx("auction", 2),
    g = auction.init(c),
    act = (id: string, a: any) => auction.action(g, id, { round: 1, ...a }, c);
  act("a", { type: "topic", choice: g.public.choices[0].id });
  act("a", { type: "bid", value: 1 });
  act("b", { type: "pass" });
  act("a", { type: "word", word: "BMW" });
  act("a", { type: "word", word: "Audi" });
  act("a", { type: "finish" });
  act("b", { type: "judge", votes: [false, true] });
  assert.equal(g.scores.a, 10);
  auction.tick(g, c);
  assert.equal(g.scores.a, 10);
  const empty = auction.init(c);
  c.now = empty.deadline + 1;
  auction.tick(empty, c);
  c.now = empty.deadline + 1;
  auction.tick(empty, c);
  assert.equal(empty.stage, "roundReveal");
  assert.deepEqual(empty.scores, { a: 0, b: 0 });
});
test("Zeitgefühl: lokale Millisekunden, private Ergebnisse, Stopp-Sperre, Timeout und Ablenkung", () => {
  const c = ctx("timing"),
    g = timing.init(c),
    act = (id: string, a: any) => timing.action(g, id, { round: 1, ...a }, c);
  assert.throws(() => act("a", { type: "stop", elapsed: 0 }));
  act("a", { type: "start" });
  act("b", { type: "start" });
  const target = g.public.target;
  c.now += target;
  assert.throws(() => act("a", { type: "stop", elapsed: NaN }));
  assert.throws(() => act("a", { type: "stop", elapsed: 0 }));
  act("a", { type: "stop", elapsed: target });
  act("b", { type: "stop", elapsed: target + 500 });
  assert.equal(timing.view(g, "a", false).mine.elapsed, null);
  assert.equal(timing.view(g, "c", false).roster.a.submitted, true);
  assert.throws(() => act("a", { type: "stop", elapsed: target }));
  c.now = g.deadline + 1;
  timing.tick(g, c);
  assert.equal(g.scores.a, 1000);
  assert.ok(g.scores.b < 1000);
  assert.equal(g.scores.c, 0);
  assert.equal(g.public.reveal.players[1].error, 500);
  c.now = g.deadline + 1;
  timing.tick(g, c);
  assert.equal(g.public.mode, "echo");
});
test("Bombenwort: großer lokaler Pool, geheime Lunte, Übergabe, Wiederholung, Explosion und Plätze", () => {
  assert.ok(words.length >= 48000);
  assert.ok(fragments.length >= 500);
  assert.equal(bombKey("STRAẞE"), "strasse");
  const c = ctx("bomb"),
    g = bomb.init(c),
    act = (id: string, a: any) =>
      bomb.action(g, id, { round: 1, turn: g.public.turn, ...a }, c);
  g.public.fragment = "BRA";
  const fuse = g.deadline;
  assert.equal(bomb.view(g, "a", false).deadline, 0);
  assert.equal(
    JSON.stringify(bomb.view(g, "a", false)).includes("explodesAt"),
    false,
  );
  assert.throws(() => act("b", { type: "word", word: "Zebra" }));
  act("a", { type: "word", word: "Zebra" });
  assert.equal(g.public.turnId, "b");
  assert.equal(g.deadline, fuse);
  assert.notEqual(g.public.fragment, "BRA");
  assert.equal(g.public.history[0].fragment, "BRA");
  assert.throws(() => act("b", { type: "word", word: "ZEBRA" }));
  assert.throws(() => act("b", { type: "word", word: "Haus" }));
  c.now = g.deadline + 1;
  bomb.tick(g, c);
  assert.equal(g.stage, "explosion");
  assert.equal(g.players.b.alive, false);
  c.now = g.deadline + 1;
  bomb.tick(g, c);
  assert.equal(g.public.turnId, "c");
  c.now = g.deadline + 1;
  bomb.tick(g, c);
  c.now = g.deadline + 1;
  bomb.tick(g, c);
  assert.equal(g.public.reveal.winner, "a");
  assert.deepEqual(g.scores, { a: 100, b: 0, c: 50 });
});
test("Bombenwort: unbekannte Wörter, pausierte Lunte, geheime Stimmen und ausgeschiedene Prüfer", () => {
  const c = ctx("bomb"),
    g = bomb.init(c),
    act = (id: string, a: any) =>
      bomb.action(g, id, { round: 1, turn: g.public.turn, ...a }, c);
  g.public.fragment = "BRA";
  g.players.c.alive = false;
  c.now += 500;
  const remaining = g.deadline - c.now;
  act("a", { type: "word", word: "Zebrakuschelkissen" });
  assert.equal(g.stage, "judge");
  assert.throws(() => act("a", { type: "judge", valid: true }));
  act("b", { type: "judge", valid: true });
  assert.equal(bomb.view(g, "c", false).mine.ballot, null);
  c.now += 4000;
  act("c", { type: "judge", valid: true });
  assert.equal(g.public.turnId, "b");
  assert.equal(g.deadline - c.now, remaining);
  assert.notEqual(g.public.fragment, "BRA");
  const fragment = g.public.fragment;
  const rejected = `${fragment}blafantasie`;
  act("b", { type: "word", word: rejected });
  assert.equal(g.public.fragment, fragment);
  act("a", { type: "judge", valid: false });
  act("c", { type: "judge", valid: true });
  assert.equal(g.public.turnId, "b");
  assert.equal(g.public.verdict.valid, false);
  assert.equal(g.public.fragment, fragment);
  assert.throws(() => act("b", { type: "word", word: rejected }));
});

test("Bombenwort: every correct handoff changes the prompt without resetting the fuse", () => {
  const c = ctx("bomb"), g = bomb.init(c), deadline = g.deadline;
  for(let i=0;i<40;i++) {
    const fragment = g.public.fragment;
    const word = words.find(w => w.includes(fragment.toLowerCase()) && !g.secret.used.includes(bombKey(w)))!;
    assert.ok(word);
    const id=g.public.turnId,turn=g.public.turn;
    bomb.action(g,id,{type:"word",word,turn,round:1},c);
    assert.notEqual(g.public.fragment,fragment);
    assert.equal(g.deadline,deadline);
    assert.equal(g.secret.explodesAt,deadline);
    assert.equal(g.public.turn,turn+1);
    assert.equal(g.public.turnId,c.ids[(c.ids.indexOf(id)+1)%3]);
    assert.equal(g.players[id].words,Math.floor(i/3)+1);
    for(const pid of c.ids) assert.equal(bomb.view(g,pid,false).fragment,g.public.fragment);
    assert.throws(()=>bomb.action(g,id,{type:"word",word,turn,round:1},c));
  }
  const fragment=g.public.fragment,id=g.public.turnId,turn=g.public.turn;
  assert.throws(()=>bomb.action(g,id,{type:"word",word:"xx",turn,round:1},c));
  assert.equal(g.public.fragment,fragment);
});
