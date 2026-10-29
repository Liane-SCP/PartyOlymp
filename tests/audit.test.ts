import assert from "node:assert/strict";
import test from "node:test";
import { games } from "../lib/game/games";
import { prepareWiki } from "../lib/wiki-service";
import { createRoom, player } from "../lib/game/room";
import { award } from "../lib/game/scoring";
import type { Context, GameId } from "../lib/game/types";
const ctx = (id: GameId): Context => ({
  ids: ["a", "b", "c"],
  now: 1000,
  settings: { id, rounds: 2, seconds: 30 },
  used: [],
  random: () => 0.5,
});
const hand = (...ranks: number[]) => ranks.map((rank) => ({ rank, suit: 0 }));

test("Disziplinwertung: Rundungsreste lösen rechnerisch gleiche Gesamtpunkte nicht auf", () => {
  const rows = [0.1 + 0.2, 0.3, 0.2999].map((raw, i) => ({
    id: String(i),
    raw,
    valid: true,
    detail: null,
  }));
  const results = award(rows, 3);
  assert.deepEqual(
    results.map((r) => r.rank),
    [1, 1, 3],
  );
  assert.deepEqual(
    results.map((r) => r.points),
    [75, 75, 0],
  );
});

test("Club 21: Dealer-Blackjack schlägt eine normale 21; nur zwei Blackjacks teilen", () => {
  const c = ctx("blackjack"),
    g = games.blackjack.init(c);
  g.secret.dealer = hand(1, 10);
  for (const id of c.ids)
    games.blackjack.action(g, id, { type: "bet", value: 50 }, c);
  g.players.a.hand = hand(7, 7, 7);
  g.players.b.hand = hand(1, 10);
  g.players.c.hand = hand(10, 10);
  for (const id of c.ids) g.players[id].stood = true;
  games.blackjack.tick(g, c);
  assert.deepEqual(
    g.public.reveal.players.map((p: any) => p.payout),
    [0, 50, 0],
  );
});

test("Farbwechsel: letzte +2/+4 zieht Strafkarten vor der Resthandwertung", () => {
  for (const value of [12, 14]) {
    const c = ctx("cards"),
      g = games.cards.init(c);
    const card = {
      id: "finisher",
      color: value === 14 ? 4 : g.public.color,
      value,
    };
    g.players.a.hand = [card];
    const before = g.players.b.hand.length;
    games.cards.action(g, "a", { type: "play", card: card.id, color: 2 }, c);
    assert.equal(g.stage, "roundReveal");
    assert.equal(g.players.b.hand.length, before + (value === 12 ? 2 : 4));
    assert.equal(g.public.reveal.winner, "a");
    assert.equal(
      g.public.reveal.players.find((p: any) => p.id === "b").hand.length,
      g.players.b.hand.length,
    );
    assert.equal(g.public.lastMove.target, "b");
  }
});

test("Würfelwerk: Zeitablauf streicht mit null; neues Blatt zeigt keine alten Ergebnisse", () => {
  const c = ctx("dice"),
    g = games.dice.init(c);
  games.dice.action(g, "a", { type: "roll" }, c);
  g.players.a.dice = [1, 1, 1, 1, 1];
  c.now = g.public.turnDeadline;
  games.dice.tick(g, c);
  assert.equal(g.players.a.sheet[0], 0);
  while (g.stage !== "roundReveal") {
    c.now = g.public.turnDeadline;
    games.dice.tick(g, c);
  }
  c.now = g.deadline;
  games.dice.tick(g, c);
  assert.equal(g.round, 1);
  assert.equal(g.public.reveal, undefined);
  assert.equal(g.public.best, undefined);
  assert.equal(g.players.a.lastEntry, null);
  assert.ok(g.players.a.sheet.every((v: any) => v === null));
});

test("Wiki: Polls, Emotes und Ergebnisphasen benötigen keine Artikelabfrage", async () => {
  const c = ctx("wiki"),
    host = player("Host", 0, c.now, 0),
    r = createRoom("AUDIT1", host, c.now);
  c.ids = [host.id];
  r.game = games.wiki.init(c);
  r.phase = "playing";
  const unavailable = {
    prepare: () => {
      throw Error("must not fetch");
    },
  } as unknown as D1Database;
  await prepareWiki(r, host.id, undefined, unavailable);
  await prepareWiki(r, host.id, { type: "emote", emote: 0 }, unavailable);
  r.game.stage = "roundReveal";
  await prepareWiki(
    r,
    host.id,
    { type: "game", action: { type: "navigate", title: "Berlin" } },
    unavailable,
  );
});
