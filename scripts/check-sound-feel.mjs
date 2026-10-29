import fs from "node:fs";
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({
  entryPoints: ["tests/view-fixtures.ts"],
  outfile: "outputs/view-fixtures.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
assert.equal(
  spawnSync(process.execPath, ["outputs/view-fixtures.mjs"], {
    stdio: "inherit",
  }).status,
  0,
);
const audio = await build({
  entryPoints: ["lib/audio.ts"],
  bundle: true,
  format: "iife",
  globalName: "AudioQA",
  write: false,
});
const fixtures = JSON.parse(
  fs.readFileSync("outputs/qa/view-fixtures.json", "utf8"),
);
const browser = await chromium.launch({ headless: true }),
  errors = [];
async function open(name, width, edit = () => {}) {
  const f = structuredClone(fixtures.find((x) => x.name === name)),
    r = f.response.room;
  r.game.deadline = Date.now() + 60000;
  r.game.revealStartedAt = Date.now();
  edit(r);
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.routeWebSocket("**/api/live", (ws) => ws.close());
  await page.addInitScript((id) => {
    localStorage.setItem(
      "olymp.session",
      JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" }),
    );
    localStorage.setItem("olymp.settings", JSON.stringify({ muted: true }));
  }, f.response.playerId);
  await page.route("**/api/room", (route) => {
    r.serverTime = Date.now();
    return route.fulfill({ json: f.response });
  });
  await page.goto("http://127.0.0.1:5173");
  await page.locator(".room-shell").waitFor();
  return { page, r };
}
try {
  for (const width of [1440, 390]) {
    const { page, r } = await open("blackjack-reveal", width, (r) => {
      r.game.reveal.dealer = [
        { rank: 2, suit: 0 },
        { rank: 3, suit: 1 },
        { rank: 5, suit: 2 },
        { rank: 8, suit: 3 },
      ];
      r.game.reveal.dealerValue = 18;
    });
    await page.locator(".dealer-waiting").waitFor();
    assert.equal(await page.locator(".dealer-card-flip").count(), 1);
    assert.equal(await page.locator(".round-player-result").count(), 0);
    await page.waitForTimeout(1600);
    assert.equal(await page.locator(".dealer-card-flip").count(), 2);
    assert.equal(await page.locator(".round-player-result").count(), 0);
    await page.screenshot({
      path: `outputs/qa/dealer-staged-${width}.png`,
      fullPage: true,
    });
    r.game.revealStartedAt = Date.now() - 6100;
    await page.reload();
    await page.locator(".dealer-finished").waitFor();
    assert.equal(await page.locator(".dealer-card-flip").count(), 4);
    assert.equal(await page.locator(".round-player-result").count(), 12);
    await page.close();
    const t = await open("cards", width, (r) => {
      r.game.direction = -1;
      r.game.turnId = r.game.order[1];
    });
    await t.page.locator(".turn-order .active").waitFor();
    assert.match(
      await t.page.locator(".turn-order>div").nth(1).innerText(),
      /Du/,
    );
    assert.equal(await t.page.locator(".hand-count b").count(), 12);
    assert.ok(
      await t.page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await t.page.locator(".room-shell").evaluate((e) => (e.scrollTop = 0));
    await t.page.screenshot({
      path: `outputs/qa/turn-order-${width}.png`,
      fullPage: true,
    });
    await t.page.locator(".emote-dock > button").click();
    assert.equal(await t.page.locator(".emote-send-choice").count(), 48);
    assert.equal(await t.page.locator(".emote-star").count(), 48);
    assert.equal(await t.page.locator(".emote-slots > button").count(), 6);
    await t.page.screenshot({
      path: `outputs/qa/emotes-library-${width}.png`,
      fullPage: true,
    });
    await t.page.close();
  }
  const c = await open("cards", 390, (r) => {
    r.phase = "countdown";
    r.deadline = Date.now() + 2500;
  });
  await c.page.locator(".countdown-number").waitFor();
  await c.page.waitForTimeout(2600);
  assert.equal(await c.page.locator(".countdown-number").innerText(), "LOS!");
  await c.page.close();
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:5173");
  await page.addScriptTag({ content: audio.outputFiles[0].text });
  const levels = await page.evaluate(async () => {
    const results = [];
    for (const cue of [
      "emote",
      "price",
      "dealer",
      "card",
      "casinoPayout",
      "cardReverse",
      "cardSkip",
      "cardPenalty",
      "cardLast",
      "reveal",
      "win",
      "bust",
      "muted",
    ]) {
      const ctx = new OfflineAudioContext(1, 48000 * 3, 48000),
        s = AudioQA.sound;
      s.ctx = ctx;
      s.master = ctx.createGain();
      s.master.connect(ctx.destination);
      s.settings = { ...AudioQA.defaults, muted: cue === "muted" };
      s.last = {};
      s.active = 0;
      // Offline contexts schedule before rendering; mimic the unlocked live context.
      Object.defineProperty(ctx, "state", { get: () => "running" });
      s.play(cue === "muted" ? "win" : cue, cue === "emote" ? 0 : undefined);
      const buffer = await ctx.startRendering(),
        data = buffer.getChannelData(0);
      results.push({
        cue,
        energy: data.reduce((a, x) => a + x * x, 0),
        peak: data.reduce((a, x) => Math.max(a, Math.abs(x)), 0),
      });
    }
    return results;
  });
  for (const x of levels)
    assert.ok(
      x.cue === "muted" ? x.energy === 0 : x.energy > 0.01,
      JSON.stringify(x),
    );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: staged dealer and delayed results, reconnect timing, reverse turn order and 12 card counts, 48 emotes and six favorites, countdown LOS, audible distinct cues and mute.",
    levels,
  );
} finally {
  await browser.close();
}
