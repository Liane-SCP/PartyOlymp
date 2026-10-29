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
  args: [
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
  ],
});
const errors = [],
  metrics = [];
fs.mkdirSync("outputs/qa", { recursive: true });
async function open(m, width = 1440, options = {}) {
  const page = await browser.newPage({
    viewport: { width, height: width < 600 ? 844 : 900 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (
      msg.type() === "error" &&
      /THREE|WebGL|React|uncaught/i.test(msg.text()) &&
      !(options.fallback && /Error creating WebGL context/i.test(msg.text()))
    )
      errors.push(msg.text());
  });
  await page.routeWebSocket("**/api/live", (ws) => ws.close());
  await page.addInitScript(
    ({ id, fallback }) => {
      localStorage.setItem(
        "olymp.session",
        JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" }),
      );
      localStorage.setItem(
        "olymp.settings",
        JSON.stringify({ muted: true, motion: false, intense: true }),
      );
      if (fallback) {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (name, ...args) {
          if (String(name).includes("webgl")) return null;
          return original.call(this, name, ...args);
        };
      }
    },
    { id: m.first, fallback: options.fallback },
  );
  await page.route("**/api/room", async (route) => {
    const b = route.request().postDataJSON();
    try {
      if (b.action?.type === "game") m.act(m.first, b.action.action);
      await route.fulfill({ json: m.view() });
    } catch (e) {
      errors.push(e.message);
      await route.fulfill({ status: 400, json: { error: e.message } });
    }
  });
  await page.goto("http://127.0.0.1:5173");
  await page.locator(".boss-game").waitFor();
  await page
    .locator(
      options.fallback
        ? ".boss-scene-retry"
        : ".boss-scene-wrapper.is-ready canvas[data-rigged='true']",
    )
    .waitFor({ timeout: 60000 });
  return page;
}
function answer(m) {
  if (m.room.game.stage === "intro") m.room.game.deadline = Date.now() - 1;
  m.view();
}
async function shot(page, name) {
  await page.waitForTimeout(350);
  const metric = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    canvas: !!document.querySelector("canvas.boss-scene-canvas"),
    height: document.querySelector(".boss-game").getBoundingClientRect().height,
    scroll:
      document.querySelector(".room-shell").scrollHeight -
      document.querySelector(".room-shell").clientHeight,
    viewport: { width: innerWidth, height: innerHeight },
    arena: document
      .querySelector(".boss-scene-wrapper")
      .getBoundingClientRect()
      .toJSON(),
    command: document
      .querySelector(".boss-command")
      .getBoundingClientRect()
      .toJSON(),
  }));
  assert.equal(metric.overflow, false, name);
  assert.equal(metric.arena.x, 0, `${name}: left edge`);
  assert.equal(metric.arena.y, 0, `${name}: top edge`);
  assert.equal(
    metric.arena.width,
    metric.viewport.width,
    `${name}: full width`,
  );
  assert.equal(
    metric.arena.height,
    metric.viewport.height,
    `${name}: full height`,
  );
  assert.ok(
    metric.command.x >= 0 && metric.command.right <= metric.viewport.width,
    `${name}: HUD horizontal bounds`,
  );
  assert.ok(
    metric.command.y >= 0 && metric.command.bottom <= metric.viewport.height,
    `${name}: HUD vertical bounds`,
  );
  metrics.push({ name, ...metric });
  await page.screenshot({
    path: `outputs/qa/boss-${name}.png`,
    fullPage: true,
  });
}
try {
  for (const kind of ['colossus', 'dragon']) for (const width of [1440, 390]) {
    const m = match(kind, 2);
    answer(m);
    if(kind==='colossus') m.act(m.first, { type:'roll', round:1 });
    const page = await open(m, width);
    await shot(page, `${kind}-updated-${width}`);
    if(kind==='dragon') {
      assert.equal(await page.locator('.boss-command-heading svg').count(), 0);
      assert.equal(await page.locator('.boss-product-fallback').count(), 0);
      const box = await page.locator('.boss-treasure-product > div').boundingBox();
      assert.ok(box.width >= 115 && box.height >= 145, JSON.stringify(box));
    } else {
      assert.equal(await page.locator('.boss-die-side.is-result').count(), 5);
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log('Desktop and mobile dice/product checks passed');
} finally { await browser.close(); }