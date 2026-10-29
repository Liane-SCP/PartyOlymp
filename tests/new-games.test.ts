import { test } from "node:test";
import assert from "node:assert/strict";
import { typer, correctPrefix } from "../lib/game/games/typer";
import { herd, herdKey } from "../lib/game/games/herd";
import { spectrum, spectrumPoints } from "../lib/game/games/spectrum";
import { blocks } from "../lib/game/games/blocks";
import { geo, geoDistance, geoScore } from "../lib/game/games/geo";
import { moveBlock, fits } from "../lib/game/blocks-physics";
import type { Context, GameId } from "../lib/game/types";
const context = (id: GameId, count = 4): Context => ({
  now: 1000,
  ids: Array.from({ length: count }, (_, i) => String(i)),
  settings: { id, rounds: 2, seconds: 45 },
  used: [],
  random: () => 0.37,
});
test("Geography scores actual great-circle distance and keeps coordinates private", () => {
  const c = context("geo", 2),
    g = geo.init(c),
    place = g.secret.place;
  assert.equal(geoScore(0), 5000);
  assert.ok(
    Math.abs(geoDistance({ lat: 0, lon: 0 }, { lat: 0, lon: 90 }) - 10007.54) <
      1,
  );
  assert.ok(geoDistance({ lat: 0, lon: 179 }, { lat: 0, lon: -179 }) < 225);
  const view = geo.view(g, "0", false);
  assert.equal(view.place, undefined);
  assert.equal(view.lat, undefined);
  assert.equal(JSON.stringify(view).includes(place.source), false);
  assert.throws(() => geo.action(g, "0", { type: "pin", lat: NaN, lon: 0 }, c));
  geo.action(g, "0", { type: "pin", lat: place.lat, lon: place.lon }, c);
  assert.equal(geo.view(g, "1", false).mine.answer, null);
  geo.action(
    g,
    "1",
    {
      type: "pin",
      lat: -place.lat,
      lon: place.lon > 0 ? place.lon - 180 : place.lon + 180,
    },
    c,
  );
  assert.equal(g.scores["0"], 5000);
  assert.ok(g.scores["1"] < 1);
  assert.equal(g.public.reveal.place.lat, place.lat);
});
test("Typeracer computes exact prefix, authoritative finish and retains prior rounds", () => {
  const c = context("typer", 2),
    g = typer.init(c);
  assert.equal(correctPrefix("AbX", "Abc"), 2);
  typer.action(
    g,
    "0",
    { type: "type", seq: 1, text: g.public.text.slice(0, 12) + "!" },
    { ...c, now: 2000 },
  );
  assert.equal(g.players["0"].progress, 12);
  assert.equal(typer.view(g, "1", false).racers["0"].text, undefined);
  typer.action(
    g,
    "0",
    { type: "type", seq: 2, text: g.public.text },
    { ...c, now: 4000 },
  );
  assert.equal(g.players["0"].finishedAt, 4000);
  typer.tick(g, { ...c, now: g.deadline });
  assert.equal(g.stage, "roundReveal");
  assert.ok(g.scores["0"] > g.scores["1"]);
  const score = g.scores["0"];
  typer.tick(g, { ...c, now: g.deadline });
  assert.equal(g.round, 1);
  assert.equal(g.players["0"].text, "");
  assert.equal(g.scores["0"], score);
  assert.throws(() =>
    typer.action(g, "0", { type: "type", seq: 1, text: 123 }, c),
  );
});
test("Hivemind keeps answers private and resolves ties without points", () => {
  const c = context("herd"),
    g = herd.init(c);
  herd.action(g, "0", { type: "answer", answer: "Äpfel" }, c);
  assert.equal(herd.view(g, "1", false).mine.answer, null);
  assert.equal(herd.view(g, "1", false).players, undefined);
  herd.action(g, "1", { type: "answer", answer: "Aepfel" }, c);
  herd.action(g, "2", { type: "answer", answer: "Banane" }, c);
  herd.action(g, "3", { type: "answer", answer: "Banane" }, c);
  assert.equal(g.stage, "roundReveal");
  assert.deepEqual(Object.values(g.scores), [0, 0, 0, 0]);
  assert.equal(herdKey(" Die Äpfel! "), herdKey("aepfel"));
});
test("Hivemind awards only unique largest group and rejects double submission", () => {
  const c = context("herd"),
    g = herd.init(c);
  herd.action(g, "0", { type: "answer", answer: "Pizza" }, c);
  assert.throws(() =>
    herd.action(g, "0", { type: "answer", answer: "Pasta" }, c),
  );
  for (const id of ["1", "2"])
    herd.action(g, id, { type: "answer", answer: "pizza" }, c);
  herd.action(g, "3", { type: "answer", answer: "Salat" }, c);
  assert.deepEqual(Object.values(g.scores), [100, 100, 100, 0]);
});
test("Spectrum hides target and each player's independent dial; scores individuals", () => {
  const c = context("spectrum"),
    g = spectrum.init(c);
  assert.equal(g.public.psychic, "0");
  assert.equal(spectrum.view(g, "1", false).target, undefined);
  assert.ok(spectrum.view(g, "0", false).target);
  assert.throws(() =>
    spectrum.action(g, "1", { type: "clue", clue: "Kaffee" }, c),
  );
  spectrum.action(g, "0", { type: "clue", clue: "Kaffee" }, c);
  assert.throws(() => spectrum.action(g, "0", { type: "lock", value: 50 }, c));
  spectrum.action(g, "1", { type: "dial", value: 14 }, c);
  assert.equal(spectrum.view(g, "2", false).mine.dial, 50);
  assert.equal(spectrum.view(g, "2", false).dial, undefined);
  spectrum.action(g, "2", { type: "lock", value: g.secret.target - 3 }, c);
  assert.equal(g.stage, "guess");
  spectrum.action(g, "1", { type: "lock", value: g.secret.target }, c);
  spectrum.action(g, "3", { type: "lock", value: 100 }, c);
  assert.deepEqual(Object.values(g.scores), [0, 4000, 3000, 0]);
  assert.throws(() => spectrum.action(g, "2", { type: "lock", value: 50 }, c));
  assert.equal(spectrumPoints(50, 50), 4);
  assert.equal(spectrumPoints(50, 61), 0);
  spectrum.tick(g, { ...c, now: g.deadline });
  assert.equal(g.public.psychic, "1");
  assert.equal(spectrum.view(g, "0", false).target, undefined);
});
test("Spectrum two-player individual scoring, missing clue excluded and role rotates", () => {
  const c = context("spectrum", 2),
    g = spectrum.init(c);
  spectrum.action(g, "0", { type: "clue", clue: "Sonne" }, c);
  spectrum.action(g, "1", { type: "lock", value: g.secret.target }, c);
  assert.equal(g.stage, "roundReveal");
  assert.deepEqual(Object.values(g.scores), [0, 4000]);
  spectrum.tick(g, { ...c, now: g.deadline });
  spectrum.tick(g, { ...c, now: g.deadline });
  assert.equal(g.public.reveal.missingClue, true);
  assert.deepEqual(Object.values(g.scores), [0, 4000]);
});
test("Block duel sends garbage only from valid server line clears, cancels and holds", () => {
  const c = context("blocks", 2),
    g = blocks.init(c),
    p = g.players["0"];
  p.kind = "I";
  p.rotation = 1;
  p.x = 2;
  p.y = 0;
  p.board = Array.from({ length: 22 }, (_, y) =>
    Array.from({ length: 10 }, (_, x) => (y >= 18 && x !== 4 ? 8 : 0)),
  );
  blocks.action(
    g,
    "0",
    { type: "inputs", inputs: [{ seq: 1, key: "drop" }] },
    c,
  );
  assert.equal(p.lines, 4);
  assert.equal(g.players["1"].incoming.length, 4);
  const before = p.kind;
  moveBlock(p, "hold", 1000);
  assert.equal(p.hold, before);
  const held = p.kind;
  moveBlock(p, "hold", 1000);
  assert.equal(p.kind, held);
  assert.ok(fits(p));
  assert.throws(() =>
    blocks.action(
      g,
      "0",
      { type: "inputs", inputs: [{ seq: 3, key: "drop" }] },
      c,
    ),
  );
  blocks.action(
    g,
    "0",
    { type: "inputs", inputs: [{ seq: 1, key: "drop" }] },
    c,
  );
  assert.equal(p.lines, 4);
});
test("Block duel survives arbitrary elapsed time while active; eliminates on overflow and resets rounds", () => {
  const c = context("blocks", 2),
    g = blocks.init(c);
  assert.equal(g.deadline, 0);
  blocks.tick(g, { ...c, now: 1000000 });
  assert.equal(g.stage, "battle");
  g.players["1"].board = Array.from({ length: 22 }, () => Array(10).fill(8));
  g.players["1"].alive = false;
  blocks.tick(g, c);
  assert.equal(g.stage, "roundReveal");
  assert.equal(g.public.reveal.winner, "0");
  blocks.tick(g, { ...c, now: g.deadline });
  assert.equal(g.round, 1);
  assert.equal(g.players["1"].alive, true);
});
