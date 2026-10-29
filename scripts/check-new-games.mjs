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
);
const browser = await chromium.launch({ headless: true }),
  errors = [],
  metrics = [];
try {
  for (const [width, height] of process.argv.includes("--reveals")
    ? [[1366, 768]]
    : [
        [1366, 768],
        [390, 844],
      ])
    for (const mode of process.argv.includes("--reveals")
      ? ["herd-reveal", "spectrum-reveal", "geo-reveal"]
      : [
          "typer",
          "herd",
          "spectrum",
          "geo",
          ...(width === 1366
            ? ["typer-reveal", "herd-reveal", "spectrum-reveal", "geo-reveal"]
            : []),
        ]) {
      const f = structuredClone(fixtures.find((x) => x.name === mode)),
        r = f.response.room,
        actions = [];
      r.game.deadline = mode === "blocks" ? 0 : Date.now() + 60000;
      r.game.startedAt = Date.now();
      const page = await browser.newPage({ viewport: { width, height } });
      page.on("pageerror", (e) => errors.push(mode + ": " + e.message));
      await page.routeWebSocket("**/api/live", (ws) => ws.close());
      await page.route("https://tile.openstreetmap.org/**", (route) =>
        route.fulfill({
          contentType: "image/svg+xml",
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#aad3df"/></svg>',
        }),
      );
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
        const b = route.request().postDataJSON();
        if (b.action?.type === "game") {
          actions.push(b.action.action);
          if (b.action.action.type === "type")
            r.game.mine.seq = b.action.action.seq;
        }
        r.serverTime = Date.now();
        return route.fulfill({ json: f.response });
      });
      await page.goto("http://127.0.0.1:5173");
      await page
        .locator(mode.endsWith("-reveal") ? ".round-reveal" : ".play-surface")
        .waitFor();
      if (mode === "typer") {
        await page
          .getByLabel("Renntext abtippen")
          .pressSequentially(r.game.text.slice(0, 15), { delay: 40 });
        await page.waitForTimeout(250);
        assert.ok(
          actions.filter((a) => a.type === "type").length > 1,
          "typing progress must stream while continuously typing",
        );
      }
      if (mode === "herd") {
        await page.getByPlaceholder("Dein erster Gedanke …").fill("Banane");
        await page.getByRole("button", { name: "Geheim festlegen" }).click();
        await page.waitForTimeout(150);
        assert.ok(actions.some((a) => a.answer === "Banane"));
      }
      if (mode === "spectrum") {
        await page.getByLabel("Ein passender Begriff").fill("Kaffee");
        await page.getByRole("button", { name: "Hinweis teilen" }).click();
        await page.waitForTimeout(150);
        assert.ok(actions.some((a) => a.clue === "Kaffee"));
      }
      if (mode === "blocks") {
        await page.keyboard.press("ArrowLeft");
        await page.keyboard.press("ArrowUp");
        await page.keyboard.press("Space");
        await page.waitForTimeout(250);
        assert.ok(
          actions.flatMap((a) => a.inputs ?? []).some((c) => c.key === "drop"),
        );
      }
      if (mode === "geo") {
        await page.waitForFunction(
          () => !document.querySelector(".pano-loading"),
        );
        await page
          .locator(".street-map")
          .click({ position: { x: 110, y: 80 } });
        await page
          .getByRole("button", { name: "Hier bin ich · Festlegen" })
          .click();
        await page.waitForTimeout(150);
        assert.ok(
          actions.some((a) => a.type === "pin" && Number.isFinite(a.lat)),
        );
        assert.ok((await page.locator(".map-tiles img").count()) > 0);
      }
      if (mode === "geo-reveal")
        await page.waitForFunction(
          () => document.querySelectorAll(".map-tiles img").length > 0,
        );
      const metric = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        scroll:
          document.querySelector(".room-shell").scrollHeight -
          document.querySelector(".room-shell").clientHeight,
      }));
      assert.equal(metric.overflow, false, mode + " overflow");
      metrics.push({ mode, width, ...metric });
      await page.screenshot({
        path: `outputs/qa/new-${mode}-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
      await page.close();
    }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "outputs/qa/new-games-metrics.json",
    JSON.stringify(metrics, null, 2),
  );
  console.log(JSON.stringify(metrics));
} finally {
  await browser.close();
}
