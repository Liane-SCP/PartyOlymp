import assert from "node:assert/strict";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
import { match } from "../outputs/browser-boss-engine.mjs";
const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
  ],
});
const m = match(process.argv[2] || "dragon", Number(process.argv[3] || 12)),
  errors = [];
m.room.game.deadline = Date.now() - 1;
m.view();
m.room.game.deadline = Date.now() + 600000;
try {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
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
      JSON.stringify({ muted: true, motion: false, intense: true }),
    );
  }, m.first);
  await page.route("**/api/room", (route) => route.fulfill({ json: m.view() }));
  await page.goto("http://127.0.0.1:5173");
  await page
    .locator(".boss-scene-wrapper.is-ready")
    .waitFor({ timeout: 60000 });
  await page.screenshot({ path: `outputs/qa/boss-hud-${m.room.game.id}-laptop.png` });
  await page.getByRole("button", { name: "Crew & Ton", exact: true }).click();
  await page
    .locator(".crew-expanded .crew-panel")
    .waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Crew schließen/ }).click();
  await page.getByRole("button", { name: "Alle Emotes", exact: true }).click();
  await page.locator(".emote-picker").waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Emote-Menü schließen" }).click();
  await page
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  await page.getByRole("dialog", { name: "Einstellungen" }).waitFor();
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Crew & Ton", exact: true }).click();
  await page
    .locator(".crew-expanded .crew-panel")
    .waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Crew schließen/ }).click();
  await page.screenshot({ path: `outputs/qa/boss-hud-${m.room.game.id}-portrait.png` });
  m.room.phase = "lobby";
  await page.waitForFunction(() => !document.querySelector(".immersive-boss"));
  assert.equal(await page.locator(".boss-scene-canvas").count(), 0);
  assert.notEqual(
    await page
      .locator(".platform")
      .evaluate((el) => getComputedStyle(el).position),
    "fixed",
  );
  assert.deepEqual(errors, []);
  console.log(
    "HUD menus, laptop/portrait layout and lobby restoration passed.",
  );
} finally {
  await browser.close();
}
