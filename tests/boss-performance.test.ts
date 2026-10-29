import test from "node:test";
import assert from "node:assert/strict";
import { BossFrameClock, BossResolution } from "../lib/boss-performance";

for (const refresh of [60, 120, 144, 165, 240, 360])
  test(`60 FPS pacing on ${refresh} Hz`, () => {
    const clock = new BossFrameClock();
    let frames = 0;
    for (let n = 0; n < refresh * 10; n++)
      if (clock.ready((n * 1000) / refresh)) frames++;
    assert.ok(frames >= 598 && frames <= 602, `${frames} frames in 10 seconds`);
  });
test("missed frames and tab resume do not cause a catch-up burst", () => {
  const clock = new BossFrameClock();
  assert.ok(clock.ready(0));
  assert.ok(clock.ready(5000));
  assert.equal(clock.ready(5001), false);
});
test("quality recovers slowly and ignores short stalls", () => {
  const resolution = new BossResolution();
  for (let i = 1; i < 180; i++)
    resolution.sample(i < 150 ? 7 : 30, i * 16.67, true);
  assert.equal(resolution.scale, 1);
  for (let i = 180; i < 400; i++) resolution.sample(24, i * 16.67, true);
  assert.ok(resolution.scale < 1 && resolution.scale >= 0.6);
  const low = resolution.scale;
  for (let i = 400; i < 1300; i++) resolution.sample(5, i * 16.67, true);
  assert.ok(resolution.scale > low && resolution.scale <= 1);
});
test("sustained severe overload still reduces resolution with a bounded floor", () => {
  const resolution = new BossResolution();
  for (let t = 250; t <= 4000; t += 250) resolution.sample(250, t, false);
  assert.ok(resolution.scale < 1);
  for (let t = 4250; t <= 60000; t += 250) resolution.sample(250, t, false);
  assert.equal(resolution.scale, 0.6);
});
