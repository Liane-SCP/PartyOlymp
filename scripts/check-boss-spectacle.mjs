import fs from "node:fs";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({
  entryPoints: ["tests/browser-game-engine.ts"],
  outfile: "outputs/browser-boss-engine.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { match } = await import("../outputs/browser-boss-engine.mjs");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BOSS_HARDWARE === "1" ? { channel: "chromium" } : {}),
  args:
    process.env.BOSS_HARDWARE === "1"
      ? ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist"]
      : [
          "--use-angle=swiftshader",
          "--enable-webgl",
          "--ignore-gpu-blocklist",
          "--enable-unsafe-swiftshader",
        ],
});
const errors = [],
  results = [];
try {
  for (const kind of process.argv.slice(2).length
    ? process.argv.slice(2)
    : ["colossus", "kraken", "dragon"]) {
    const m = match(kind, kind === "kraken" ? 12 : 2),
      g = m.room.game;
    g.deadline = Date.now() - 1;
    m.view();
    g.deadline = Date.now() + 600000;
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.routeWebSocket("**/api/live", (ws) => ws.close());
    await page.addInitScript(
      ({ id }) => {
        localStorage.setItem(
          "olymp.session",
          JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" }),
        );
        localStorage.setItem(
          "olymp.settings",
          JSON.stringify({ muted: true, motion: false, intense: true }),
        );
      },
      { id: m.first },
    );
    await page.route("**/api/room", (route) =>
      route.fulfill({ json: m.view() }),
    );
    await page.goto("http://127.0.0.1:5173");
    await page
      .locator(".boss-scene-wrapper.is-ready")
      .waitFor({ timeout: 90000 });
    const canvas = page.locator("canvas.boss-scene-canvas");
    await canvas.evaluate((el) => {
      el.dataset.testIdentity = "original-arena";
    });
    assert.match(await canvas.getAttribute("data-effects"), /bloom/);
    // A real remote room update must alter the already mounted arena, then reset.
    m.room.emotes = [
      {
        id: "remote-dance",
        player: m.room.participantIds[1],
        emote: 37,
        at: Date.now(),
      },
    ];
    await page.waitForFunction(
      (id) =>
        document
          .querySelector("canvas.boss-scene-canvas")
          ?.dataset.emotingPlayers?.includes(id),
      m.room.participantIds[1],
    );
    await page.screenshot({ path: `outputs/qa/spectacle-${kind}-emote.png` });
    await page.waitForFunction(
      () =>
        document.querySelector("canvas.boss-scene-canvas")?.dataset
          .emotingPlayers === "",
      { timeout: 10000 },
    );
    assert.equal(
      await page.locator('[data-emote-key=""] svg.emote-face').count(),
      0,
    );
    // Latest of several simultaneous reactions per player wins, without remounting WebGL.
    const ids = m.room.participantIds.slice(0, 2);
    m.room.emotes = ids.map((player, i) => ({
      id: `reaction-${i}`,
      player,
      emote: i ? 1 : 13,
      at: Date.now(),
    }));
    await page.waitForFunction(
      () =>
        document
          .querySelector("canvas.boss-scene-canvas")
          ?.dataset.emotingPlayers?.split(",").length === 2,
    );
    const original = await canvas.getAttribute("data-bones");
    g.stage = "roundReveal";
    g.deadline = Date.now() + 600000;
    g.public.reveal = {
      outcomes: m.room.participantIds.map((id) => ({
        id,
        score: 1200,
        damage: 450,
        accuracy: 1,
        submitted: true,
        label: "Perfekter Treffer",
        guess: g.secret.product?.price,
      })),
      totalDamage: 900,
      hpBefore: 1800,
      hpAfter: 900,
      phaseBroken: true,
      victory: false,
      price: g.secret.product?.price,
    };
    // Freeze server reveal clocks through the response for reproducible cinematic frames.
    let offset = 1.7;
    await page.unroute("**/api/room");
    await page.route("**/api/room", (route) => {
      g.public.revealStartedAt = Date.now() - offset * 1000;
      return route.fulfill({ json: m.view() });
    });
    for (const [shot, at] of [
      ["charge-dolly", 1.7],
      ["salvo-tracking", 5.1],
      ["armor-break", 8.7],
      ["victory-crane", 12],
    ]) {
      offset = at;
      if (at === 12) g.public.reveal.victory = true;
      await page.waitForFunction(
        (shot) =>
          document.querySelector("canvas.boss-scene-canvas")?.dataset
            .cameraShot === shot,
        shot,
      );
      await page.screenshot({
        path: `outputs/qa/spectacle-${kind}-${shot}.png`,
      });
    }
    assert.equal(await canvas.getAttribute("data-bones"), original);
    assert.equal(
      await canvas.getAttribute("data-test-identity"),
      "original-arena",
    );
    await page.evaluate(
      () => (document.documentElement.dataset.motion = "reduced"),
    );
    await page.waitForTimeout(300);
    assert.equal(
      await page
        .locator(".boss-scene-wrapper")
        .evaluate((el) => el.style.getPropertyValue("--boss-letterbox")),
      "0px",
    );
    results.push({
      kind,
      emoteReset: true,
      remoteEmotes: true,
      shots: 4,
      reducedMotion: true,
    });
    await page.close();
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "outputs/qa/boss-spectacle.json",
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log(JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
