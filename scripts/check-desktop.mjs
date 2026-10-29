import fs from "node:fs";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({
  entryPoints: ["tests/view-fixtures.ts"],
  outfile: "outputs/view-fixtures.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
assert.equal(
  spawnSync(process.execPath, ["outputs/view-fixtures.mjs"]).status,
  0,
);
const fixtures = JSON.parse(
    fs.readFileSync("outputs/qa/view-fixtures.json", "utf8"),
  ),
  browser = await chromium.launch({ headless: true }),
  errors = [],
  metrics = [];
try {
  for (const [width, height] of [
    [1920, 1080],
    [1366, 768],
    [390, 844],
  ]) {
    for (const mode of [
      "dice",
      "wiki",
      "picture",
      "budget",
      "blackjack",
      "cards",
      "fleet",
      "color",
      "size",
    ]) {
      const f = structuredClone(fixtures.find((x) => x.name === mode)),
        r = f.response.room;
      r.game.deadline = Date.now() + 60000;
      r.game.startedAt = Date.now() - 20000;
      r.game.turnDeadline = Date.now() + 60000;
      r.game.previewUntil = 0;
      const page = await browser.newPage({ viewport: { width, height } });
      page.on("pageerror", (e) => errors.push(mode + ": " + e.message));
      await page.routeWebSocket("**/api/live", (ws) => ws.close());
      await page.addInitScript((id) => {
        localStorage.setItem(
          "olymp.session",
          JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" }),
        );
        localStorage.setItem(
          "olymp.settings",
          JSON.stringify({ muted: true, motion: true }),
        );
      }, f.response.playerId);
      await page.route("**/api/room", (route) => {
        r.serverTime = Date.now();
        return route.fulfill({ json: f.response });
      });
      await page.goto("http://127.0.0.1:5173");
      await page.locator(".play-surface").waitFor();
      await page.waitForTimeout(150);
      const metric = await page.evaluate(() => {
        const shell = document.querySelector(".room-shell"),
          board = document.querySelector(".game-board");
        return {
          scroll: shell.scrollHeight - shell.clientHeight,
          boardWidth: Math.round(board.getBoundingClientRect().width),
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          shellBottom: Math.round(shell.getBoundingClientRect().bottom),
          actions: [
            ...document.querySelectorAll(
              ".play-surface button.primary,.play-surface .answer-form,.play-surface .own-hand",
            ),
          ].map((e) => Math.round(e.getBoundingClientRect().bottom)),
        };
      });
      assert.equal(
        metric.overflow,
        false,
        `${mode} ${width} horizontal overflow`,
      );
      metrics.push({ mode, width, ...metric });
      if(width>=1100) {
        assert.ok(metric.scroll<=90,`${mode} ${width}: unnecessary page scroll ${metric.scroll}`);
        assert.ok(metric.actions.every(bottom=>bottom<=metric.shellBottom),`${mode} ${width}: primary actions below viewport`);
      }
      if (width >= 1100 && mode === "cards") {
        await page
          .getByRole("button", { name: "Crew & Ton", exact: true })
          .click();
        assert.equal(await page.locator("#room-crew").isVisible(), true);
        await page
          .getByRole("button", { name: "Crew schließen ×", exact: true })
          .click();
        assert.equal(await page.locator("#room-crew").isVisible(), false);
      }
      if (width >= 1100)
        await page.screenshot({
          path: `outputs/qa/desktop-${mode}-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
      await page.close();
    }
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "outputs/qa/desktop-metrics.json",
    JSON.stringify(metrics, null, 2),
  );
  console.log(JSON.stringify(metrics));
} finally {
  await browser.close();
}
