import test from "node:test";
import assert from "node:assert/strict";
import { player, createRoom, tickRoom, roomAction } from "../lib/game/room";
import {
  countdownValue,
  dealerProgress,
  dealerDuration,
  turnOrder,
} from "../lib/game/presentation";
import { emoteNames } from "../lib/emotes";
import { accessoryNames } from "../lib/appearance";
import { dice } from "../lib/game/games/dice";
import { fleet } from "../lib/game/games/fleet";
import { cards } from "../lib/game/games/cards";
import { blackjack } from "../lib/game/games/blackjack";
import { quiz } from "../lib/game/games/quiz";
import { wiki, wikiRoundScore } from "../lib/game/games/wiki";
import { award } from "../lib/game/scoring";
import { sizes, pictures } from "../lib/game/content";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { Context } from "../lib/game/types";
const ctx = (id: any): Context => ({
  ids: ["a", "b"],
  now: 1000,
  settings: { id, rounds: 1, seconds: 30 },
  used: [],
  random: () => 0.5,
});
test("Pixelblitz: mindestens 100 verschiedene lokale Fotos, Antworten bleiben geheim", () => {
  assert.ok(pictures.length >= 100);
  const hashes = pictures.map((p) => {
    assert.ok(p.author && p.license && p.source && p.licenseUrl);
    const bytes = readFileSync("public" + p.image);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    return createHash("sha256").update(bytes).digest("hex");
  });
  assert.equal(new Set(hashes).size, pictures.length);
  const c = ctx("picture"),
    q = quiz("picture"),
    g = q.init(c);
  assert.ok(g.public.image.startsWith("/pixel-photos/"));
  assert.equal(q.view(g, "a", false).reveal, undefined);
  assert.ok(!JSON.stringify(q.view(g, "a", false)).includes('"aliases"'));
  q.action(g,"a",{type:"buzz"},c);
  q.action(
    g,
    "a",
    { type: "answer", value: g.secret.item.answer },
    { ...c, now: c.now + 1000 },
  );
  q.tick(g, { ...c, now: g.deadline + 1 });
  assert.equal(g.public.reveal.players[0].correct, true);
  assert.ok(g.public.reveal.photoCredit.source);
});

test("Wiki: ein verpasstes Ziel löscht keine erfolgreichen Runden", () => {
  const c = ctx("wiki"),
    g = wiki.init(c);
  g.players.a.history = [{ arrival: 10000 }, { arrival: null }, { arrival: 0 }];
  g.players.b.history = [
    { arrival: null },
    { arrival: null },
    { arrival: null },
  ];
  const result = award(wiki.results(g, c), 2);
  assert.equal(result[0].valid, true);
  assert.equal(result[0].raw, 1700);
  assert.equal(result[0].points, 100);
  assert.equal(result[1].valid, false);
  assert.equal(result[1].points, 0);
  assert.equal(wikiRoundScore(null, 30), 0);
  assert.equal(wikiRoundScore(0, 30), 1000);
  assert.ok(wikiRoundScore(10000, 30) > wikiRoundScore(20000, 30));
});
test("Wiki: Weiterleitung auf den kanonischen Zielartikel zählt als Ankunft", () => {
  const c = ctx("wiki"),
    g = wiki.init(c),
    start = g.players.a.path.at(-1);
  g.public.target = "Ziel mit Alias";
  g.secret.targetCanonical = "Kanonisches Ziel";
  g.secret.liveLinks = { a: { title: start, links: ["Ziel mit Alias"] } };
  g.secret.nextArticle = {
    requested: "Ziel mit Alias",
    canonical: "Kanonisches Ziel",
  };
  c.now += 1000;
  wiki.action(g, "a", { type: "navigate", title: "Ziel mit Alias" }, c);
  assert.equal(g.players.a.arrival, c.now);
  assert.equal(g.players.a.submitted, true);
  wiki.tick(g, { ...c, now: g.deadline + 1 });
  assert.ok(g.public.reveal.players[0].score > 0);
  assert.equal(g.public.reveal.players[1].score, 0);
});
test("Farbwechsel: öffentliche Chronik erklärt Joker, Farbe, Ziehen und nächsten Spieler", () => {
  const c = ctx("cards"),
    g = cards.init(c);
  g.players.a.hand = [
    { id: "wild", color: 4, value: 14 },
    { id: "keep", color: 0, value: 3 },
  ];
  cards.action(g, "a", { type: "play", card: "wild", color: 2 }, c);
  const v = cards.view(g, "b", false),
    m = v.moves[0];
  assert.equal(m.color, 2);
  assert.equal(m.count, 4);
  assert.equal(m.target, "b");
  assert.equal(m.next, "a");
  assert.ok(m.id);
  assert.equal(m.at, c.now);
  assert.equal(m.hand, undefined);
  cards.action(g, "a", { type: "draw" }, { ...c, now: c.now + 500 });
  assert.equal(cards.view(g, "b", false).moves.length, 2);
});
test("Size it up: erweiterter Katalog hat eindeutige Aufgaben und gültige Größen", () => {
  assert.ok(sizes.length >= 60);
  assert.equal(new Set(sizes.map((s) => s.id)).size, sizes.length);
  assert.ok(sizes.every((s) => s.cm > 0 && s.source.startsWith("https://")));
});

test("Lange Farbwechsel-Runden enden nicht am alten Zuglimit; Antworttimer bleibt", () => {
  const c = ctx("cards"),
    g = cards.init(c);
  g.secret.turns = 10000;
  cards.tick(g, c);
  assert.equal(g.stage, "answer");
  const before = g.players.a.hand.length;
  c.now = g.deadline + 1;
  cards.tick(g, c);
  assert.equal(g.stage, "answer");
  assert.equal(g.players.a.hand.length, before + 1);
  assert.equal(g.public.turnId, "b");
  assert.deepEqual(cards.view(g, "a", false).order, ["a", "b"]);
});
test("Countdown endet mit LOS; Dealer deckt schrittweise auf; Rückwärts-Zugfolge stimmt", () => {
  assert.deepEqual(
    [0, 1000, 2000, 2999, 3000, 3400].map((n) => countdownValue(3000, n)),
    [3, 2, 1, 1, 0, 0],
  );
  assert.deepEqual(
    [0, 1499, 1500, 2999, 3000, 4500].map((n) => dealerProgress(n, 0, 4)),
    [1, 1, 2, 2, 3, 4],
  );
  assert.ok(dealerDuration(6) >= 6 * 1500 + 8000);
  assert.deepEqual(turnOrder(["a", "b", "c", "d"], "b", -1), [
    "b",
    "a",
    "d",
    "c",
  ]);
  const c = ctx("blackjack"),
    g = blackjack.init(c);
  c.now = g.deadline + 1;
  blackjack.tick(g, c);
  assert.equal(
    g.deadline - c.now,
    dealerDuration(g.public.reveal.dealer.length),
  );
});
test("Alle angebotenen Emotes funktionieren serverseitig; Spam bleibt begrenzt", () => {
  const p = player("Nova", 0, 1000, 0),
    r = createRoom("QATEST", p, 1000);
  assert.ok(emoteNames.length >= 48);
  for (let emote = 0; emote < emoteNames.length; emote++) {
    const now = 2000 + emote * 3000;
    roomAction(r, p, { type: "emote", emote }, now);
    assert.equal(r.emotes.at(-1)?.emote, emote);
    assert.throws(() => roomAction(r, p, { type: "emote", emote }, now + 100));
  }
  assert.throws(() =>
    roomAction(r, p, { type: "emote", emote: emoteNames.length }, 999999),
  );
});

test("Live-Aktionen: +2 und Zeitablauf erklären Wirkung ohne fremde Hand preiszugeben", () => {
  const c = ctx("cards"),
    g = cards.init(c);
  const card = { id: "qa-plus-two", color: g.public.color, value: 12 };
  g.players.a.hand = [card, { id: "qa-keep", color: 4, value: 13 }];
  const before = g.players.b.hand.length;
  cards.action(g, "a", { type: "play", card: card.id }, c);
  const v = cards.view(g, "b", false);
  assert.equal(v.lastMove.target, "b");
  assert.equal(v.lastMove.count, 2);
  assert.equal(v.counts.b, before + 2);
  assert.equal(v.turnId, "a");
  assert.equal(v.players, undefined);
  assert.equal(v.secret, undefined);
  const turn = g.public.turnId;
  c.now = g.deadline + 1;
  cards.tick(g, c);
  assert.equal(g.public.lastMove.kind, "timeout");
  assert.equal(g.public.lastMove.player, turn);
});

test("Crew-Sicht: Fehlversuche zählen, geheime Begriffe und Dealerkarte bleiben verborgen", () => {
  const c = ctx("picture"),
    q = quiz("picture"),
    g = q.init(c);
  q.action(g,"b",{type:"buzz"},c);
  q.action(g, "b", { type: "answer", value: "PrivaterFehlversuchXYZ" }, c);
  const v = q.view(g, "a", false);
  assert.deepEqual(v.guesses.b, { attempts: 1, solved: false });
  assert.ok(!JSON.stringify(v).includes("PrivaterFehlversuchXYZ"));
  const table = blackjack.init(ctx("blackjack"));
  blackjack.action(table, "b", { type: "bet", value: 50 }, ctx("blackjack"));
  const visible = blackjack.view(table, "a", false);
  assert.equal(visible.status.b.hand.length, 2);
  assert.equal(visible.status.b.bet, 50);
  assert.equal(visible.dealer.length, 1);
  assert.equal(visible.secret, undefined);
});

test("Wiki-Crew: Artikelwechsel und Zielankunft sind für Mitspieler sichtbar", () => {
  const c = ctx("wiki"),
    g = wiki.init(c);
  const path = g.secret.task.path;
  for (const title of path.slice(1)) {
    c.now += 1000;
    wiki.action(g, "b", { type: "navigate", title }, c);
  }
  const v = wiki.view(g, "a", false);
  assert.equal(v.racers.b.article, g.public.target);
  assert.equal(v.racers.b.clicks, path.length - 1);
  assert.equal(v.racers.b.arrived, true);
  assert.equal(v.racers.b.elapsed, (path.length - 1) * 1000);
  assert.equal(v.secret, undefined);
});

test("Entfernte Neonkurve: laufende alte Räume wechseln sicher zur nächsten Disziplin", () => {
  for (const next of [true, false]) {
    const p = player("Test", 0, 1000, 0);
    const r = createRoom("TEST", p, 1000);
    r.rulesVersion = 2;
    r.participantIds = [p.id];
    r.phase = "playing";
    r.selection = [
      { id: "curve" as any, rounds: 1, seconds: 30 },
      ...(next ? [{ id: "size" as const, rounds: 1, seconds: 30 }] : []),
    ];
    r.game = { id: "curve" } as any;
    tickRoom(r, 1000);
    assert.equal(r.rulesVersion, createRoom("VERSION", p, 1000).rulesVersion);
    assert.equal(r.phase, "rules");
    assert.equal(r.game, null);
    assert.equal(r.selection[r.index].id, next ? "size" : "picture");
    tickRoom(r, 1001);
    assert.equal(r.phase, "rules");
  }
});

test("Entfernte Neonkurve: alte Punkte verschwinden ohne übrige Ergebnisse zu verlieren", () => {
  const p = player("Test", 0, 1000, 0);
  const r = createRoom("TEST", p, 1000);
  r.rulesVersion = 2;
  r.history = [
    { game: "curve", results: [{ id: p.id, points: 100, rank: 1 }] },
    { game: "color", results: [{ id: p.id, points: 50, rank: 2 }] },
  ] as any;
  p.points = 150;
  p.wins = 1;
  p.seconds = 1;
  tickRoom(r, 1000);
  assert.equal(r.history.length, 1);
  assert.equal(r.history[0].game, "color");
  assert.equal(p.points, 50);
  assert.equal(p.lastPoints, 50);
  assert.equal(p.wins, 0);
  assert.equal(p.seconds, 1);
});
test("Bestehende Räume: alte Kniffel- und Flottenzustände bleiben spielbar", () => {
  const c = ctx("dice"),
    g = dice.init(c);
  delete g.public.turn;
  delete g.public.turnDeadline;
  dice.tick(g, c);
  dice.action(g, "a", { type: "roll" }, c);
  assert.equal(g.players.a.rolls, 1);
  assert.equal(g.public.turn, 1);
  const f = ctx("fleet"),
    sea = fleet.init(f);
  delete sea.public.volley;
  delete sea.public.maxVolleys;
  fleet.tick(sea, f);
  assert.equal(sea.totalRounds, 1);
  assert.equal(sea.public.maxVolleys, 12);
});
test("Kniffel: gemeinsame Züge warten auf alle, 13 Einträge beenden ein Blatt", () => {
  const c = ctx("dice"),
    g = dice.init(c);
  for (let turn = 0; turn < 13; turn++) {
    dice.action(g, "a", { type: "roll" }, c);
    dice.action(g, "a", { type: "category", index: turn }, c);
    assert.throws(() => dice.action(g, "a", { type: "roll" }, c));
    assert.equal(g.public.turn, turn + 1);
    dice.action(g, "b", { type: "roll" }, c);
    dice.action(g, "b", { type: "category", index: turn }, c);
    dice.tick(g, c);
    if (turn < 12) {
      assert.equal(g.stage, "turnReveal");
      c.now = g.public.turnDeadline + 1;
      dice.tick(g, c);
      assert.equal(g.stage, "answer");
    }
  }
  assert.equal(g.stage, "roundReveal");
  assert.equal(dice.view(g, "a", false).opponents.b.sheet.length, 13);
});
test("Schmugglerflotte: eine Runde umfasst eine vollständige Schlacht", () => {
  const c = ctx("fleet"),
    g = fleet.init(c);
  for (const id of c.ids)
    fleet.action(
      g,
      id,
      { type: "place", ships: [{ cell: 0 }, { cell: 16 }, { cell: 32 }] },
      c,
    );
  fleet.tick(g, c);
  assert.equal(g.stage, "answer");
  for (let volley = 1; volley <= g.public.maxVolleys; volley++) {
    for (const id of c.ids)
      fleet.action(g, id, { type: "shoot", cell: volley - 1 }, c);
    fleet.tick(g, c);
    if (volley < g.public.maxVolleys) {
      assert.equal(g.stage, "volleyReveal");
      c.now = g.deadline + 1;
      fleet.tick(g, c);
      assert.equal(g.stage, "answer");
    }
  }
  assert.equal(g.stage, "roundReveal");
  c.now = g.deadline + 1;
  fleet.tick(g, c);
  assert.equal(g.stage, "done");
});

test("Flotten-Finale: auch ohne letzten Schuss bleiben alle Spieler mit ihrer Beute sichtbar", () => {
  const c = ctx("fleet"),
    g = fleet.init(c);
  c.now = g.deadline + 1;
  fleet.tick(g, c);
  g.public.volley = g.public.maxVolleys;
  g.scores.a = 35;
  c.now = g.deadline + 1;
  fleet.tick(g, c);
  assert.equal(g.stage, "roundReveal");
  assert.equal(g.public.reveal.players.length, 2);
  assert.ok(
    g.public.reveal.players.every((p: any) => p.missed && p.cell === null),
  );
  assert.equal(fleet.view(g, "a", false).scores.a, 35);
});
test("Charakter: unabhängige Farbe, Form, Accessoire werden serverseitig validiert", () => {
  const p = player("Test", 0, 1000, 0, { shape: 5, accessory: 7, color: 11 });
  assert.deepEqual(p.look, {
    shape: 5,
    accessory: 7,
    color: 11,
    detail: 0,
    accent: 3,
  });
  assert.equal(p.color, "#8feb96");
  assert.throws(() =>
    player("Test", 0, 1000, 0, { shape: 99, accessory: 0, color: 0 }),
  );
  assert.throws(() =>
    player("Test", 0, 1000, 0, {
      shape: 0,
      accessory: accessoryNames.length,
      color: 0,
    }),
  );
});
