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
assert.equal(
  spawnSync(process.execPath, ["outputs/view-fixtures.mjs"], {
    stdio: "inherit",
  }).status,
  0,
);
const all = JSON.parse(await readFile("outputs/qa/view-fixtures.json", "utf8"));
const fixtures = all.filter((f) =>
  ["dice", "fleet", "size", "budget"].includes(f.name),
);
const score = structuredClone(
  all.find((f) => f.name === "podium") ?? all.at(-1),
);
score.name = "score-show";
score.response.room.phase = "reveal";
score.response.room.deadline = Date.now() + 16000;
score.response.room.game.results = score.response.room.history.at(-1).results;
fixtures.push(score);
const browser = await chromium.launch({ headless: true }),
  errors = [];
try {
  for (const width of [1440, 390])
    for (const f of fixtures) {
      const page = await browser.newPage({
        viewport: { width, height: width === 390 ? 844 : 1000 },
        hasTouch: width === 390,
      });
      page.on("pageerror", (e) => errors.push(e.message));
      await page.routeWebSocket("**/api/live", (ws) => ws.close());
      await page.addInitScript((id) => {
        localStorage.setItem(
          "olymp.session",
          JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" }),
        );
        localStorage.setItem(
          "olymp.settings",
          JSON.stringify({ muted: true, motion: false }),
        );
      }, f.response.playerId);
      await page.route("**/api/room", (route) =>
        route.fulfill({ json: f.response }),
      );
      await page.goto(process.env.QA_URL ?? "http://127.0.0.1:5173");
      await page.locator(".room-shell").waitFor();
      if (f.name === "size") {
        const obj = page.locator(".size-object");
        await obj.scrollIntoViewIfNeeded();
        const before = await obj.getAttribute("style"),
          box = await obj.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width / 2 + 35,
          box.y + box.height / 2 - 12,
          { steps: 5 },
        );
        await page.mouse.up();
        await page.waitForTimeout(200);
        await page.screenshot({
          path: `outputs/qa/size-drag-debug-${width}.png`,
          fullPage: true,
        });
        assert.notEqual(await obj.getAttribute("style"), before);
        const handle = page.locator(".size-handle"),
          h = await handle.boundingBox();
        const slider = page.locator(".size-slider input");
        const prior = await slider.inputValue();
        await page.mouse.move(h.x + 15, h.y + 15);
        await page.mouse.down();
        await page.mouse.move(h.x + 50, h.y - 15, { steps: 5 });
        await page.mouse.up();
        assert.ok(Number(await slider.inputValue()) > Number(prior));
      }
      if (f.name === "budget")
        await page.locator(".product-photo img").first().waitFor();
      if (f.name === "score-show") await page.waitForTimeout(4700);
      else await page.waitForTimeout(400);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow ${width}/${f.name}`,
      );
      await page.screenshot({
        path: `outputs/qa/refined-${width}-${f.name}.png`,
        fullPage: true,
      });
      await page.close();
      console.log(`Rendered ${width}: ${f.name}`);
    }
} finally {
  await browser.close();
}
assert.deepEqual(errors, []);
console.log(
  "PASS: focused new desktop/mobile views, object dragging/resizing, score sequence, no JavaScript errors or horizontal overflow.",
);
