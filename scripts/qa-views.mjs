import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({
  entryPoints: ["tests/view-fixtures.ts"],
  outfile: "outputs/view-fixtures.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const generated = spawnSync(process.execPath, ["outputs/view-fixtures.mjs"], {
  stdio: "inherit",
});
assert.equal(generated.status, 0);
const fixtures = JSON.parse(
    await readFile("outputs/qa/view-fixtures.json", "utf8"),
  ),
  browser = await chromium.launch({ headless: true }),
  errors = [];
for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  const ctx = await browser.newContext({
    viewport,
    isMobile: viewport.width < 500,
    hasTouch: viewport.width < 500,
  });
  for (const fixture of fixtures) {
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(fixture.name + ": " + e.message));
    await page.addInitScript(
      ({ id }) => {
        localStorage.setItem(
          "olymp.session",
          JSON.stringify({
            code: "QA1234",
            playerId: id,
            token: "render-fixture-only",
          }),
        );
        localStorage.setItem(
          "olymp.settings",
          JSON.stringify({ motion: true, muted: true }),
        );
      },
      { id: fixture.response.playerId },
    );
    await page.route("**/api/room", (route) =>
      route.fulfill({ json: fixture.response }),
    );
    await page.goto(process.env.QA_URL ?? "http://127.0.0.1:5173");
    await page.locator(".room-shell").waitFor();
    await page.screenshot({
      path: `outputs/qa/view-${viewport.width}-${fixture.name}.png`,
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow: ${fixture.name}/${viewport.width}`,
    );
    assert.ok(
      await page.evaluate(() => {
        const main = document.querySelector(".room-shell");
        const dock = document.querySelector(".emote-dock");
        return (
          main.scrollWidth <= main.clientWidth &&
          main.getBoundingClientRect().bottom <=
            dock.getBoundingClientRect().top
        );
      }),
      `Emote bar covers game content: ${fixture.name}/${viewport.width}`,
    );
    await page.locator(".room-shell").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.screenshot({
      path: `outputs/qa/view-${viewport.width}-${fixture.name}-bottom.png`,
      fullPage: true,
    });
    await page.close();
    console.log(`Rendered ${viewport.width}: ${fixture.name}`);
  }
  await ctx.close();
}
await browser.close();
assert.deepEqual(errors, []);
console.log(
  `PASS: ${fixtures.length} current game/lobby/result views on desktop and mobile. Controlled server-engine fixtures; multiplayer is verified separately.`,
);
