import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeRaceText,
  racePrefix,
  raceFinished,
  raceMetrics,
} from "../lib/game/typing";
import { typer } from "../lib/game/games/typer";
import { spectrum } from "../lib/game/games/spectrum";
import { spectrumClueError } from "../lib/game/spectrum-clue";
import { blocks } from "../lib/game/games/blocks";
import { moveBlock, predictFall } from "../lib/game/blocks-physics";
import { mapPoint, mapLocation, wrappedDelta } from "../lib/game/map-math";
import type { Context, GameId } from "../lib/game/types";
const ctx = (id: GameId): Context => ({
  ids: ["a", "b", "c"],
  now: 1000,
  settings: { id, rounds: 2, seconds: 45 },
  used: [],
  random: () => 0.5,
});
test("Typeracer: progress is shared, extra characters never finish, final WPM stays frozen", () => {
  const c = ctx("typer"),
    g = typer.init(c);
  g.public.text = "Ein kurzer Test.";
  typer.action(
    g,
    "a",
    { type: "type", seq: 1, text: "Ein kurzer", round: 1 },
    { ...c, now: 5000 },
  );
  assert.equal(typer.view(g, "b", false).racers.a.progress, 10);
  typer.action(
    g,
    "a",
    { type: "type", seq: 2, text: g.public.text + "x", round: 1 },
    { ...c, now: 6000 },
  );
  assert.equal(g.players.a.submitted, false);
  assert.equal(
    raceMetrics(g.players.a.progress, g.public.text.length, 1000, 6000, null)
      .percent,
    99,
  );
  typer.action(
    g,
    "a",
    { type: "type", seq: 3, text: g.public.text, round: 1 },
    { ...c, now: 7000 },
  );
  const snapshot = typer.view(g, "b", false).racers.a;
  assert.equal(snapshot.finishedWpm, 32);
  assert.equal(
    raceMetrics(snapshot.progress, 16, 1000, 40000, snapshot.finishedAt).wpm,
    32,
  );
  typer.action(
    g,
    "a",
    { type: "type", seq: 4, text: "", round: 1 },
    { ...c, now: 14000 },
  );
  assert.deepEqual(typer.view(g, "b", false).racers.a, snapshot);
  typer.tick(g, { ...c, now: g.deadline });
  assert.equal(g.public.reveal.players.find((x: any) => x.id === "a").wpm, 32);
});
test("Spectrum: names with numbers and single letters accepted, numeric targets explained", () => {
  for (const clue of ["GTA 5", "7Up", "E", "Öl", "Formel 1"]) {
    assert.equal(spectrumClueError(clue), "");
    const c = ctx("spectrum"),
      g = spectrum.init(c);
    spectrum.action(g, "a", { type: "clue", clue, round: 1 }, c);
    assert.equal(g.stage, "guess");
    assert.equal(g.public.clue, clue);
  }
  for (const clue of ["", "  ", "50", "75 %", "x".repeat(81)])
    assert.ok(spectrumClueError(clue));
});
test("Spectrum upgrades an old team room without hanging in its removed phase", () => {
  const c = ctx("spectrum"),
    g = spectrum.init(c);
  g.public = { teams: [["a", "b"], ["c"]] };
  g.stage = "side";
  g.scores.a = 9;
  g.round = 1;
  g.totalRounds = 1;
  spectrum.tick(g, c);
  assert.equal(g.stage, "clue");
  assert.equal(g.round, 0);
  assert.equal(g.totalRounds, 2);
  assert.equal(g.scores.a, 0);
  assert.equal(g.public.teams, undefined);
  assert.equal(spectrum.view(g, "b", false).target, undefined);
});
test("Typeracer: invisible/typographic differences, trailing Enter, no premature finish, reordered packets", () => {
  const target = '"Schön", sagt er - und geht...';
  assert.ok(raceFinished("„Scho\u0308n“, sagt er – und geht…\n", target));
  assert.equal(raceFinished(target + "x", target), false);
  assert.equal(raceFinished(target.toLowerCase(), target), false);
  assert.equal(racePrefix("ABC", "AB"), 2);
  assert.equal(normalizeRaceText("A\u00a0B\u200b"), "A B");
  const c = ctx("typer"),
    g = typer.init(c);
  g.public.text = target;
  typer.action(
    g,
    "a",
    { type: "type", seq: 3, text: target + "\n", round: 1 },
    c,
  );
  assert.equal(g.players.a.submitted, true);
  const at = g.players.a.finishedAt;
  typer.action(
    g,
    "a",
    { type: "type", seq: 2, text: "alt", round: 1 },
    { ...c, now: 2000 },
  );
  assert.equal(g.players.a.finishedAt, at);
  assert.equal(g.players.a.progress, target.length);
  typer.action(
    g,
    "b",
    { type: "type", seq: 3, text: target.slice(0, -1), round: 1 },
    c,
  );
  typer.action(g, "b", { type: "type", seq: 2, text: "alt", round: 1 }, c);
  assert.equal(g.players.b.progress, target.length - 1);
  assert.equal(g.players.b.submitted, false);
  assert.throws(() =>
    typer.action(g, "b", { type: "type", seq: 4, text: target, round: 2 }, c),
  );
});
test("Spectrum: each dial private, hint role excluded from mean, missed guess zero, at least two rounds", () => {
  const c = ctx("spectrum");
  c.settings.rounds = 1;
  const g = spectrum.init(c);
  assert.equal(g.totalRounds, 2);
  spectrum.action(g, "a", { type: "clue", clue: "Kaffee", round: 1 }, c);
  spectrum.action(
    g,
    "b",
    { type: "lock", value: g.secret.target, round: 1 },
    c,
  );
  const v = spectrum.view(g, "c", false);
  assert.equal(v.target, undefined);
  assert.equal(v.mine.guess, null);
  assert.equal(v.submitted.b, true);
  c.now = g.deadline;
  spectrum.tick(g, c);
  assert.equal(g.scores.b, 4000);
  assert.equal(g.players.c.opportunities, 1);
  assert.equal(g.players.a.opportunities, undefined);
  c.now = g.deadline;
  spectrum.tick(g, c);
  assert.equal(g.public.psychic, "b");
  spectrum.action(g, "b", { type: "clue", clue: "Lava", round: 2 }, c);
  spectrum.action(
    g,
    "a",
    { type: "lock", value: g.secret.target, round: 2 },
    c,
  );
  spectrum.action(
    g,
    "c",
    { type: "lock", value: g.secret.target, round: 2 },
    c,
  );
  assert.equal(g.scores.a, 4000);
  assert.equal(g.scores.b, 4000);
  assert.equal(g.scores.c, 2000);
});
test("Blocks: exact row compaction, no shifted columns, one spawn per drop, stale piece commands acknowledged without moving next piece", () => {
  const c = ctx("blocks"),
    g = blocks.init(c),
    p = g.players.a;
  p.kind = "I";
  p.rotation = 1;
  p.x = 2;
  p.y = 0;
  p.board = Array.from({ length: 22 }, (_, y) =>
    Array.from({ length: 10 }, (_, x) => (y >= 18 && x !== 4 ? 8 : 0)),
  );
  p.board[17][7] = 3;
  const piece = p.pieceId;
  blocks.action(
    g,
    "a",
    {
      type: "inputs",
      round: 1,
      inputs: [{ seq: 1, key: "drop", pieceId: piece }],
    },
    c,
  );
  assert.equal(p.lines, 4);
  assert.equal(p.board.length, 22);
  assert.ok(p.board.every((row: number[]) => row.length === 10));
  assert.equal(p.board[21][7], 3);
  assert.equal(p.board.flat().filter((v: number) => v === 3).length, 1);
  const x = p.x;
  blocks.action(
    g,
    "a",
    {
      type: "inputs",
      round: 1,
      inputs: [{ seq: 2, key: "left", pieceId: piece }],
    },
    c,
  );
  assert.equal(p.seq, 2);
  assert.equal(p.x, x);
  assert.equal(p.pieceId, piece + 1);
  const before = JSON.stringify(p.board),
    prediction = structuredClone(p);
  predictFall(prediction, 50000, g.public.startedAt);
  assert.equal(JSON.stringify(prediction.board), before);
  assert.equal(prediction.pieceId, p.pieceId);
  moveBlock(prediction, "hold", 50000);
  assert.equal(prediction.pieceId, p.pieceId + 1);
});
test("Mercator: worldwide roundtrip, street zoom precision and dateline wrapping", () => {
  for (const zoom of [1, 8, 19])
    for (const p of [
      { lat: 52.52, lon: 13.405 },
      { lat: -33.86, lon: 151.2 },
      { lat: 0, lon: 0 },
      { lat: 70, lon: -179.9 },
    ]) {
      const q = mapPoint(p.lat, p.lon, zoom),
        back = mapLocation(q.x, q.y, zoom);
      assert.ok(Math.abs(back.lat - p.lat) < 1e-8);
      assert.ok(Math.abs(back.lon - p.lon) < 1e-8);
    }
  assert.equal(wrappedDelta(2, 254, 256), 4);
  assert.equal(mapLocation(0, 128, 0).lon, -180);
  assert.ok(mapPoint(90, 0, 2).y >= -1e-6);
});
