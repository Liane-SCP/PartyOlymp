import { cards } from "../lib/game/games/cards";
import { fleet } from "../lib/game/games/fleet";
import assert from "node:assert/strict";
import test from "node:test";
import { award, ranking } from "../lib/game/scoring";
import { diceScore, diceTotal } from "../lib/game/games/dice";
import { handValue } from "../lib/game/games/blackjack";
import { accepts, deltaE, sizeAccuracy } from "../lib/game/games/quiz";
import { games } from "../lib/game/games";
import {bots} from "./party-bots";
import {
  player,
  createRoom,
  roomAction,
  tickRoom,
  publicRoom,
  phaseKey,
  context,
} from "../lib/game/room";
import { catalog, preset, duration } from "../lib/game/catalog";
import type { Room, GameId } from "../lib/game/types";
import bank from "../lib/game/data/wiki.json";
import { pick } from "../lib/game/common";
import type { Context } from "../lib/game/types";
for (const retired of ["fleet", "blocks"] as const) {
  test(`Entferntes Spiel ${retired}: Auswahl gesperrt und gespeicherte Räume migriert`, () => {
    const now = 1000000,
      p = player("Host", 0, now, 0),
      r = createRoom("ABC234", p, now);
    assert.ok(!catalog.some((g) => g.id === retired));
    for (const minutes of [20, 60, 120])
      assert.ok(!preset(minutes).some((g) => g.id === retired));
    assert.throws(
      () =>
        roomAction(
          r,
          p,
          {
            type: "configure",
            selection: [{ id: retired, rounds: 1, seconds: 12 }],
          },
          now,
        ),
      /Unbekannte/,
    );
    r.rulesVersion = 4;
    r.selection = [{ id: retired, rounds: 1, seconds: 12 }];
    tickRoom(r, now);
    assert.equal(r.rulesVersion, 7);
    assert.equal(r.phase, "lobby");
    assert.equal(r.selection[0].id, "picture");
    r.rulesVersion = 4;
    r.selection = [
      { id: retired, rounds: 1, seconds: 12 },
      { id: "code", rounds: 1, seconds: 90 },
    ];
    r.participantIds = [p.id];
    r.phase = "playing";
    r.game = games[retired].init(context(r, now));
    tickRoom(r, now);
    assert.equal(r.game, null);
    assert.equal(r.selection[0].id, "code");
    assert.equal(r.index, 0);
    assert.equal(r.phase, "rules");
    tickRoom(r, now);
    assert.equal(r.rulesVersion, 7);
  });
}

test("Inhaltspools bleiben auch nach mehreren Durchläufen ohne Wiederholung im Zyklus", () => {
  const c: Context = {
    ids: ["a"],
    settings: { id: "size", rounds: 30, seconds: 25 },
    used: ["another-game-item"],
    now: 0,
    random: () => 0.51,
  };
  const pool = Array.from({ length: 17 }, (_, i) => ({ id: `test-${i}` }));
  let previous = "";
  for (let cycle = 0; cycle < 10; cycle++) {
    const selected = Array.from(
      { length: pool.length },
      () => pick(pool, c).id,
    );
    assert.equal(new Set(selected).size, pool.length);
    assert.notEqual(selected[0], previous);
    previous = selected.at(-1)!;
    assert.ok(c.used.includes("another-game-item"));
    assert.equal(c.used.length, pool.length + 1);
  }
});
test("Lange Olympiaden: nach Ausschöpfung des Bestands keine direkte Wiederholung", () => {
  const c: Context = {
    ids: ["a", "b"],
    settings: { id: "budget", rounds: 12, seconds: 8 },
    used: [],
    now: 1000,
    random: () => 0.51,
  };
  const pool = [{ id: "one" }, { id: "two" }, { id: "three" }];
  let previous = "";
  for (let i = 0; i < 30; i++) {
    const selected = pick(pool, c).id;
    assert.notEqual(selected, previous);
    previous = selected;
  }
  c.used = [];
  const g = games.budget.init(c);
  let last: string[] = [];
  for (let i = 0; i < 12; i++) {
    const current = g.public.items.map((p: any) => p.id);
    assert.equal(current.length, 10);
    assert.ok(current.every((id: string) => !last.includes(id)));
    last = current;
    games.budget.tick(g, { ...c, now: g.deadline + 1 });
    games.budget.tick(g, { ...c, now: g.deadline + 1 });
  }
});
test("Olympiadenwertung: Gleichstände, feste Teilnehmerzahl, ungültige Ergebnisse", () => {
  const rows = [
    { id: "a", raw: 100, valid: true, detail: null },
    { id: "b", raw: 100, valid: true, detail: null },
    { id: "c", raw: 0, valid: true, detail: null },
    { id: "d", raw: 0, valid: false, detail: null },
  ];
  const r = award(rows, 4);
  assert.ok(Math.abs(r[0].points! - 250 / 3) < 1e-10);
  assert.ok(Math.abs(r[1].points! - 250 / 3) < 1e-10);
  assert.equal(r[2].points, 100 / 3);
  assert.equal(r[3].points, 0);
  assert.equal(r[1].rank, 1);
  assert.ok(
    award(
      rows.map((x) => ({ ...x, valid: false })),
      4,
    ).every((x) => x.points === 0),
  );
  assert.deepEqual(
    award(
      rows.slice(0, 2).map((x, i) => ({ ...x, raw: 2 - i })),
      12,
    ).map((x) => x.points),
    [100, 1000 / 11],
  );
});
test("Gesamtgleichstand: gleicher Platz unabhängig von Siegen und zweiten Plätzen", () => {
  const a = player("A", 0, 0, 0),
    b = player("B", 1, 0, 1);
  a.points = b.points = 200;
  b.wins = 1;
  assert.deepEqual(ranking([a, b]).map(p=>p.rank),[1,1]);
  a.wins = 1;
  a.seconds = 2;
  assert.deepEqual(ranking([a, b]).map(p=>p.rank),[1,1]);
  b.seconds = 2;
  assert.deepEqual(
    ranking([a, b]).map((x) => x.rank),
    [1, 1],
  );
});
test("Gesamtwertung: Gleitkomma-Arithmetik löst mathematische Gleichstände nicht auf", () => {
  const players = Array.from({ length: 12 }, (_, i) =>
    player(`P${i}`, i, 0, i),
  );
  players[0].points = 200 + 1e-12;
  players[1].points = 200;
  players[1].wins = 1;
  assert.deepEqual(ranking(players).slice(0,2).map(p=>p.rank),[1,1]);
  players[0].wins = 1;
  assert.deepEqual(
    ranking(players)
      .slice(0, 2)
      .map((p) => p.rank),
    [1, 1],
  );
  assert.equal(
    players[0].points,
    200 + 1e-12,
    "Stored precision must remain unchanged",
  );
});
test("Würfel: Kategorien, Straßen, Full House, Bonus", () => {
  assert.equal(diceScore([6, 6, 6, 6, 6], 11), 50);
  assert.equal(diceScore([2, 2, 3, 3, 3], 8), 25);
  assert.equal(diceScore([3, 3, 3, 3, 3], 8), 0);
  assert.equal(diceScore([1, 2, 3, 4, 4], 9), 30);
  assert.equal(diceScore([2, 3, 4, 5, 6], 10), 40);
  assert.equal(diceTotal([3, 6, 9, 12, 15, 18, ...Array(7).fill(0)]), 98);
});
test("Blackjack: flexible Asse und Bildkarten", () => {
  assert.equal(
    handValue([
      { rank: 1, suit: 0 },
      { rank: 1, suit: 1 },
      { rank: 9, suit: 2 },
    ]),
    21,
  );
  assert.equal(
    handValue([
      { rank: 1, suit: 0 },
      { rank: 13, suit: 1 },
    ]),
    21,
  );
  assert.equal(
    handValue([
      { rank: 1, suit: 0 },
      { rank: 10, suit: 1 },
      { rank: 9, suit: 2 },
    ]),
    20,
  );
});
test("Wahrnehmung und Antworten: Symmetrie, CIELAB, Umlaute, Tippfehler", () => {
  assert.equal(sizeAccuracy(200, 100), sizeAccuracy(50, 100));
  assert.equal(deltaE([10, 100, 200], [10, 100, 200]), 0);
  assert.ok(deltaE([255, 255, 255], [0, 0, 0]) > 99);
  assert.ok(accepts("Wuerfel", ["Würfel", "Wuerfel"]));
  assert.ok(accepts("Raktee", ["Rakete"]) === false);
  assert.ok(accepts("Rakete!", ["Rakete"]));
  assert.ok(accepts("Rakete", ["Rakete"]));
  assert.ok(!accepts("a", ["Anker"]));
});
test("Wiki: jede Rennstrecke ist erreichbar und alle Schritte sind echte gespeicherte Links", () => {
  assert.ok(bank.tasks.length >= 100);
  for (const t of bank.tasks) {
    assert.equal(t.path[0], t.start);
    assert.equal(t.path.at(-1), t.target);
    for (let i = 0; i < t.path.length - 1; i++)
      assert.ok(
        (bank.articles as any)[t.path[i]].links.includes(t.path[i + 1]),
      );
  }
});
test("Dauervorgaben entsprechen ungefähr 20/60/120 Minuten", () => {
  for (const m of [20, 60, 120])
    assert.ok(
      Math.abs(duration(preset(m), 6) - m) <= 3,
      `${m}: ${duration(preset(m), 6)}`,
    );
});
function room(n: number) {
  const now = 1000000,
    p = player("Player 1", 0, now, 0),
    r = createRoom("ABC234", p, now);
  for (let i = 1; i < n; i++)
    r.players.push(player(`Player ${i + 1}`, i, now, i));
  r.players.forEach((p) => (p.ready = true));
  r.selection = catalog.map((g) => ({ id: g.id, rounds: 2, seconds: 8 }));
  roomAction(r, p, { type: "start" }, now);
  return r;
}

for (const n of [2, 8, 12])
  test(`Vollständige Olympiade: ${n} Spieler, alle Disziplinen, Persistenz, genau einmal verbucht`, () => {
    let r = room(n),
      now = 1000000,
      steps = 0;
    while (r.phase !== "podium" && steps++ < catalog.length * 1200) {
      if (r.phase === "rules") r.players.forEach((p) => (p.ready = true));
      bots(r, now);
      r.players.forEach((p) => (p.lastSeen = now));
      tickRoom(r, now);
      now += 200;
      r = JSON.parse(JSON.stringify(r));
    }
    assert.equal(
      r.phase,
      "podium",
      `${r.phase}/${r.game?.id}/${r.game?.stage}`,
    );
    assert.equal(r.history.length, catalog.length);
    assert.equal(new Set(r.history.map((h) => h.id)).size, catalog.length);
    assert.equal(r.participantIds.length, n);
    for (const history of r.history) {
      assert.ok(
        history.results.some((result) => result.valid),
        `${history.game}: no participant exercised a valid action`,
      );
      assert.ok(
        history.results.every(
          (result) =>
            Number.isFinite(result.raw) && Number.isFinite(result.points),
        ),
        `${history.game}: non-finite scoring`,
      );
    }
    for (const p of r.players) {
      const total = r.history.reduce(
        (s, h) => s + (h.results.find((x) => x.id === p.id)?.points ?? 0),
        0,
      );
      assert.equal(p.points, total);
    }
    const points = r.players.map((p) => p.points);
    tickRoom(r, now + 100000);
    assert.deepEqual(
      r.players.map((p) => p.points),
      points,
    );
    roomAction(
      r,
      r.players.find((p) => p.id === r.host)!,
      { type: "rematch" },
      now,
    );
    assert.equal(r.phase, "lobby");
  });
test("Rechte, Phasen, Verbindungsverlust und Zuschauer", () => {
  const r = room(2),
    now = 1010000;
  if (r.phase === "wheel" || r.phase === "travel") tickRoom(r, now);
  assert.throws(
    () =>
      roomAction(r, r.players[1], { type: "configure", selection: [] }, now),
    /Gastgeber/,
  );
  r.players[0].lastSeen = now - 91000;
  r.players[1].lastSeen = now;
  tickRoom(r, now);
  assert.equal(r.host, r.players[1].id);
  r.players.forEach((p) => (p.ready = true));
  tickRoom(r, now);
  tickRoom(r, now + 5000);
  const spectator = player("Gast", 0, now, 2);
  spectator.spectator = true;
  r.players.push(spectator);
  assert.throws(
    () =>
      roomAction(
        r,
        spectator,
        { type: "game", phase: phaseKey(r), action: { type: "roll" } },
        now + 5000,
      ),
    /Spielteilnahme/,
  );
  assert.throws(
    () =>
      roomAction(
        r,
        r.players[1],
        { type: "game", phase: "old", action: { type: "roll" } },
        now + 5000,
      ),
    /vergangenen/,
  );
});
test("Private Karten und Lösungen werden nicht übertragen", () => {
  const r = room(2);
  for (const id of [
    "blackjack",
    "cards",
    "code",
    "picture",
    "color",
    "size",
  ] as GameId[]) {
    r.index = r.selection.findIndex((g) => g.id === id);
    r.phase = "playing";
    r.game = games[id].init(context(r, Date.now()));
    const v = publicRoom(r, r.players[0].id, Date.now()),
      wire = JSON.stringify(v);
    assert.ok(!wire.includes('"secret"'));
    assert.ok(!wire.includes('"token"'));
    assert.ok(!wire.includes('"deck"'));
    if (id === "picture") assert.ok(!wire.includes('"aliases"'));
    if (id === "size")
      assert.ok(!wire.includes('"cm"') || wire.includes('"reference"'));
    if (id === "cards") assert.equal(v.game?.mine.hand.length, 7);
    if (id === "blackjack") assert.equal(v.game?.dealer.length, 1);
  }
});
test("Emotes: serverseitige Abklingzeit und Begrenzung", () => {
  const r = room(12),
    now = 1000000;
  for (const p of r.players) roomAction(r, p, { type: "emote", emote: 3 }, now);
  assert.equal(r.emotes.length, 12);
  const p = r.players.at(-1)!;
  assert.throws(
    () => roomAction(r, p, { type: "emote", emote: 1 }, now + 100),
    /bereit/,
  );
  roomAction(r, p, { type: "emote", emote: 1 }, now + 2600);
});

test("Zwei Spieler: Richtungswechsel setzt Gegner aus; +2 zieht und überspringt", () => {
  const c = {
      now: 10000,
      ids: ["a", "b"],
      settings: { id: "cards" as const, rounds: 1, seconds: 8 },
      used: [],
      random: () => 0.5,
    },
    g = cards.init(c);
  g.players.a.hand = [
    { color: 0, value: 11, id: "reverse" },
    { color: 0, value: 12, id: "drawtwo" },
    { color: 0, value: 1, id: "one" },
  ];
  g.public.top = { color: 0, value: 5, id: "top" };
  g.public.color = 0;
  cards.action(g, "a", { type: "play", card: "reverse" }, c);
  assert.equal(g.public.turnId, "a");
  const count = g.players.b.hand.length;
  cards.action(g, "a", { type: "play", card: "drawtwo" }, c);
  assert.equal(g.players.b.hand.length, count + 2);
  assert.equal(g.public.turnId, "a");
});
test("Gleichzeitige Flottentreffer teilen Beute unabhängig von der Spielerreihenfolge", () => {
  const c = {
      now: 10000,
      ids: ["a", "b", "c"],
      settings: { id: "fleet" as const, rounds: 1, seconds: 8 },
      used: [],
      random: () => 0.5,
    },
    g = fleet.init(c);
  g.stage = "answer";
  g.deadline = 20000;
  g.players.a.ships = [];
  g.players.b.ships = [];
  g.players.c.ships = [{ cells: [0], hits: [] }];
  for (const id of ["a", "b"])
    fleet.action(g, id, { type: "shoot", cell: 0 }, c);
  g.players.c.submitted = true;
  fleet.tick(g, c);
  assert.equal(g.scores.a, 17.5);
  assert.equal(g.scores.b, 17.5);
  assert.equal(g.scores.c, 0);
});
test("Antwortfristen: automatische Züge und Schwerkraft führen auch ohne Eingaben weiter", () => {
  let r = room(2),
    now = 1000000,
    steps = 0;
  // Codeknacker intentionally waits for human guesses/give-up without a timer.
  // Its non-expiring turn behavior is covered by code.test.ts.
  r.selection = r.selection.filter((s) => s.id !== "code");
  while (r.phase !== "podium" && steps++ < 3000) {
    r.players.forEach((p) => (p.lastSeen = now));
    tickRoom(r, now);
    if (
      r.game?.id === "dice" &&
      r.phase === "playing" &&
      r.game.stage === "answer"
    ) {
      now = Math.min(
        ...Object.values(r.game.players)
          .filter((p) => !p.done)
          .map((p) => p.deadline),
      );
      if (!Number.isFinite(now)) now = r.game.deadline;
    } else
      now = Math.max(
        now + 1000,
        r.game && r.phase === "playing" ? r.game.deadline : r.deadline,
      );
  }
  assert.equal(r.phase, "podium");
  assert.equal(r.history.length, r.selection.length);
  for (const h of r.history) assert.ok(h.results.every((r) => r.points === 0));
});
test("Mehr als 90 Sekunden getrennt: aktuelle Disziplin abgebrochen", () => {
  const r = room(2);
  if (r.phase === "wheel" || r.phase === "travel") tickRoom(r, 1010000);
  r.players.forEach((p) => (p.ready = true));
  tickRoom(r, 1010000);
  tickRoom(r, 1015000);
  const p = r.players[1];
  p.lastSeen = 900000;
  r.players[0].lastSeen = 1100000;
  tickRoom(r, 1100000);
  assert.equal(r.game!.players[p.id].abandoned, true);
  assert.throws(
    () =>
      roomAction(
        r,
        p,
        { type: "game", phase: phaseKey(r), action: { type: "roll" } },
        1100000,
      ),
    /Wiederbeitrittsfrist/,
  );
});
