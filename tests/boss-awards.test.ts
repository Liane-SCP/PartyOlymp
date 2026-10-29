import test from "node:test";
import assert from "node:assert/strict";
import { Matrix4, Vector3 } from "three";
import { rotations } from "../components/olymp/boss-die";
import { award, olympiadMultiplier } from "../lib/game/scoring";
import { createRoom, player, tickRoom, context } from "../lib/game/room";
import { games } from "../lib/game/games";

test("All six die results face upward before the viewing tilt", () => {
  const normals = [null, [0, 0, 1], [1, 0, 0], [0, -1, 0], [0, 1, 0], [-1, 0, 0], [0, 0, -1]];
  for (let value = 1; value <= 6; value++) {
    const [x, y] = rotations[value];
    const orientation = new Matrix4().makeRotationX(x * Math.PI / 180)
      .multiply(new Matrix4().makeRotationY(y * Math.PI / 180));
    const normal = new Vector3(...normals[value] as [number, number, number]).applyMatrix4(orientation);
    assert.ok(normal.distanceTo(new Vector3(0, -1, 0)) < 1e-10, `face ${value}`);
  }
});

for (const id of ["colossus", "kraken", "dragon", "picture"] as const) {
  test(`${id}: awards, history and totals use the correct multiplier exactly once`, () => {
    const now = 1000000;
    const host = player("Host", 0, now, 0);
    const r = createRoom("ABC234", host, now);
    r.players.push(player("Guest", 1, now, 1), player("Third", 2, now, 2));
    r.participantIds = r.players.map(p => p.id);
    r.selection = [{ id, rounds: 3, seconds: 30 }];
    r.startedAt = now - 100;
    r.game = games[id].init(context(r, now));
    r.game.results = r.players.map((p, i) => ({ id: p.id, raw: 100 - i * 10, detail: "test", valid: i < 2 }));
    r.phase = "reveal";
    r.deadline = now;
    const expected = award(r.game.results, 3).map(p => p.points! * (id === "picture" ? 1 : 3));
    tickRoom(r, now);
    assert.deepEqual(r.players.map(p => p.points), expected);
    assert.deepEqual(r.players.map(p => p.lastPoints), expected);
    assert.deepEqual(r.history[0].results.map(p => p.points), expected);
    tickRoom(r, now);
    assert.deepEqual(r.players.map(p => p.points), expected);
    assert.equal(r.history.length, 1);
    const tied = award(r.players.map(p => ({ id: p.id, raw: 10, detail: "test", valid: true })), 3, olympiadMultiplier(id));
    assert.ok(tied.every(p => p.points === (id === "picture" ? 50 : 150)));
  });
}
