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
  spawnSync(process.execPath, ["outputs/view-fixtures.mjs"], {
    stdio: "inherit",
  }).status,
  0,
);
const fixtures = JSON.parse(
    fs.readFileSync("outputs/qa/view-fixtures.json", "utf8"),
  ),
  browser = await chromium.launch({ headless: true }),
  errors = [],
  metrics = [];
try {
  for (const mode of [
    "auction-topic",
    "auction-bid",
    "auction-perform",
    "auction-judge",
    "auction-reveal",
    "timing",
    "timing-running",
    "timing-reveal",
    "bomb",
    "bomb-judge",
    "bomb-explosion",
    "bomb-reveal",
  ]) {
    const f = structuredClone(fixtures.find((f) => f.name === mode)),
      r = f.response.room,
      actions = [];
    r.game.deadline = Date.now() + 60000;
    r.game.revealStartedAt = Date.now() - 12000;
    if (mode === "timing-running") r.game.mine.startedAt = Date.now() - 2000;
    const page = await browser.newPage({
      viewport: { width: 1366, height: 768 },
    });
    page.on("pageerror", (e) => errors.push(`${mode}: ${e.message}`));
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
      const body = route.request().postDataJSON();
      if (body.action?.type === "game") actions.push(body.action.action);
      r.serverTime = Date.now();
      return route.fulfill({ json: f.response });
    });
    await page.goto("http://127.0.0.1:5173");
    await page
      .locator(mode.endsWith("-reveal") ? ".trio-results" : ".trio-arena")
      .waitFor();
    if (mode === "auction-topic") {
      await page
        .getByRole("textbox", { name: "Eigene Kategorie" })
        .fill("Automarken");
      await page.getByRole("button", { name: "Eigene Aufgabe wählen" }).click();
    }
    if (mode === "auction-bid")
      await page.getByRole("button", { name: /9 bieten/ }).click();
    if (mode === "auction-perform") {
      await page
        .getByRole("textbox", { name: "Nächster Begriff" })
        .fill("Taubsi");
      await page.getByRole("button", { name: "Hinzufügen" }).click();
    }
    if (mode === "auction-judge") {
      await page
        .getByRole("button", { name: "✓ Gültig", exact: true })
        .first()
        .click();
      await page.getByRole("button", { name: "Bewertung festlegen" }).click();
    }
    if (mode === "timing")
      await page.getByRole("button", { name: "Meine Uhr starten" }).click();
    if (mode === "timing-running") {
      assert.equal(
        await page.locator(".game-topline .timer").innerText(),
        "Zeit verborgen",
      );
      await page.getByRole("button", { name: "STOPP", exact: true }).click();
    }
    if (mode === "bomb") {
      assert.equal(
        await page.locator(".game-topline .timer").innerText(),
        "Lunte geheim",
      );
      await page
        .getByRole("textbox", { name: "Wort mit Buchstabenfolge" })
        .fill("Zebra");
      await page.getByRole("button", { name: "Weitergeben" }).click();
    }
    if (mode === "bomb-judge")
      await page
        .getByRole("button", { name: "Gültiges Wort", exact: false })
        .first()
        .click();
    await page.waitForTimeout(250);
    if (
      [
        "auction-topic",
        "auction-bid",
        "auction-perform",
        "auction-judge",
        "timing",
        "timing-running",
        "bomb",
        "bomb-judge",
      ].includes(mode)
    )
      assert.ok(actions.length, `${mode} no action`);
    metrics.push({
      mode,
      ...(await page.evaluate(() => {
        const box = document
          .querySelector(".trio-arena,.trio-results")
          .getBoundingClientRect();
        return {
          x: document.documentElement.scrollWidth - innerWidth,
          y: document.documentElement.scrollHeight - innerHeight,
          top: Math.round(box.top),
          bottom: Math.round(box.bottom),
        };
      })),
    });
    await page.screenshot({
      path: `outputs/qa/trio-${mode}.png`,
      fullPage: true,
    });
    await page.close();
  }
  assert.deepEqual(errors, []);
  assert.ok(metrics.every((m) => m.x <= 1));
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
}
