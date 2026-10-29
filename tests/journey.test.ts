import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { createRoom, player, roomAction, tickRoom, publicRoom, context } from "../lib/game/room";
import { beginJourney } from "../lib/game/journey";
import { games } from "../lib/game/games";
import { ranking } from "../lib/game/scoring";
import { ceremonyCamera } from "../lib/ceremony";
import { createJourneyScene } from "../components/olymp/journey-scene";
import type { GameId, Selection } from "../lib/game/types";

function fixture(count = 4, game: GameId = "picture") {
  const now = 1000000, host = player("Nova", 0, now, 0), room = createRoom("QAJ234", host, now);
  for (let i = 1; i < count; i++) room.players.push(player(`Crew ${i}`, i, now, i));
  room.participantIds = room.players.map(p => p.id); room.startedAt = now; room.phase = "rules";
  room.selection = [game, "kraken", "dragon", "colossus"].map(id => ({ id: id as GameId, rounds: 3, seconds: 30 }));
  room.deadline = now + 45000; beginJourney(room);
  return { room, now, host };
}
test("Relics: identical starter inventory, ownership, timing and one consumable per discipline", () => {
  const { room: r, now, host } = fixture();
  for (const p of r.players) assert.deepEqual(r.journey!.inventories[p.id].map(i => i.kind), ["laurel", "phoenix", "comet"]);
  const own = r.journey!.inventories[host.id][0], foreign = r.journey!.inventories[r.players[1].id][0];
  assert.throws(() => roomAction(r, host, { type: "relic", item: foreign.id }, now), /Rucksack/);
  host.ready = true;
  assert.throws(() => roomAction(r, host, { type: "relic", item: own.id }, now), /bereit/); host.ready = false;
  roomAction(r, host, { type: "relic", item: own.id }, now);
  assert.equal(r.journey!.inventories[host.id].length, 2);
  assert.throws(() => roomAction(r, host, { type: "relic", item: own.id }, now), /versiegelt/);
  r.phase = "playing";
  assert.throws(() => roomAction(r, r.players[1], { type: "relic", item: foreign.id }, now), /vor einer/);
  const view = publicRoom(r, host.id, now).journey!;
  assert.equal(view.inventory.length, 2); assert.equal(view.equipped.length, 1);
  assert.ok(!JSON.stringify(view).includes(foreign.id));
});
test("Actual room result transaction awards all effects exactly once, including bosses and invalid answers", () => {
  for (const game of ["picture", "colossus"] as const) {
    const { room: r, now } = fixture(4, game);
    const kinds = ["laurel", "phoenix", "comet", "phoenix"];
    r.players.forEach((p, i) => roomAction(r, p, { type: "relic", item: r.journey!.inventories[p.id].find(it => it.kind === kinds[i])!.id }, now));
    r.game = games[game].init(context(r, now));
    r.game.results = r.players.map((p, i) => ({ id: p.id, raw: [100, 10, 90, 0][i], valid: i < 3, detail: null }));
    r.phase = "reveal"; r.deadline = now;
    tickRoom(r, now);
    const m = game === "colossus" ? 3 : 1;
    const points = r.players.map(p => p.points);
    assert.equal(points[0], 125 * m);
    assert.equal(points[1], 40 * m);
    assert.ok(Math.abs(points[2] - (100 * 2 / 3 + 20) * m) < 1e-8);
    assert.equal(points[3], 0);
    assert.equal(r.history[0].results[0].rank, 1);
    tickRoom(r, now);
    assert.deepEqual(r.players.map(p => p.points), points); assert.equal(r.history.length, 1);
    assert.equal(r.journey!.lastRewards!.rows.length, 4);
    if (game === "colossus") assert.deepEqual(r.journey!.trophies, [{ boss: "colossus", index: 0, victory: false }]);
  }
});
test("Chests persist across reloads, enforce capacity and cannot be claimed twice", () => {
  const { room: r, now, host } = fixture();
  r.index = 1; r.game = games.kraken.init(context(r, now));
  r.game.public.boss.victory = true;
  r.game.results = r.players.map(p => ({ id: p.id, raw: 100, valid: true, detail: null }));
  r.phase = "reveal"; r.deadline = now; tickRoom(r, now);
  assert.equal(r.journey!.chests[host.id], 1);
  assert.equal(r.journey!.trophies[0].victory, true);
  const loaded = JSON.parse(JSON.stringify(r)); tickRoom(loaded, now);
  assert.equal(loaded.journey.chests[host.id], 1);
  roomAction(loaded, loaded.players[0], { type: "chest", kind: "comet" }, now);
  assert.equal(loaded.journey.inventories[host.id].length, 4);
  assert.throws(() => roomAction(loaded, loaded.players[0], { type: "chest", kind: "comet" }, now), /keine ungeöffnete/);
  loaded.journey.chests[host.id] = 2;
  roomAction(loaded, loaded.players[0], { type: "chest", kind: "laurel" }, now);
  assert.throws(() => roomAction(loaded, loaded.players[0], { type: "chest", kind: "laurel" }, now), /Rucksack ist voll/);
  assert.equal(loaded.journey.chests[host.id], 1);
});
test("Rematch clears relics, chests and trophies; a fresh start restores the same loadout", () => {
  const { room: r, now, host } = fixture(); r.phase = "podium";
  roomAction(r, host, { type: "rematch" }, now); assert.equal(r.journey, undefined);
  r.players.forEach(p => p.ready = true);
  roomAction(r, host, { type: "start" }, now);
  assert.equal(r.journey!.inventories[host.id].length, 3); assert.equal(r.journey!.trophies.length, 0);
});
test("Quarter-point relic results preserve true ties and meaningful near differences", () => {
  const ranked = ranking([{ points: 31.25 }, { points: 31.25 + 1e-14 }, { points: 31.25 - 12.5 / 11 }]);
  assert.deepEqual(ranked.map(p => p.rank), [1, 1, 3]);
});
test("The 3D journey handles short and 40-game routes, current crew and boss trophies", () => {
  for (const count of [1, 4, 40]) for (const selected of [0, count - 1]) {
    const selection: Selection[] = Array.from({ length: count }, (_, i) => ({ id: (["colossus", "kraken", "dragon", "picture"] as const)[i % 4], rounds: 3, seconds: 30 }));
    const world = createJourneyScene(T, selection, selected, selected, [{ color: "#bcff5c" }], count, [{ index: 0, victory: true }]);
    for (const t of [0, 1, 100]) for (const calm of [false, true]) {
      world.update(t, calm);
      world.scene.traverse(object => assert.ok([...object.position, ...object.scale].every(Number.isFinite)));
    }
    assert.ok(world.scene.getObjectByName("olympus-halo")); world.dispose();
  }
});
test("Ceremony camera travels through authored shots and reduced motion stays completely still", () => {
  assert.notDeepEqual(ceremonyCamera(0, 1.5, false), ceremonyCamera(6.4, 1.5, false));
  assert.deepEqual(ceremonyCamera(0, 0.5, true), ceremonyCamera(12, 0.5, true));
  assert.deepEqual(ceremonyCamera(14, 1.5, false), ceremonyCamera(25, 1.5, false));
  for (const aspect of [0.45, 1.5]) for (let t = 0; t < 26; t += 0.1) {
    const shot = ceremonyCamera(t, aspect, false); assert.ok([...shot.position, ...shot.target].every(Number.isFinite));
  }
});
