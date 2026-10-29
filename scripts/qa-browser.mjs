import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.QA_URL ?? "http://127.0.0.1:5173";
await mkdir("outputs/qa", { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  }),
  page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await ctx.addInitScript(() => {
  const Original = window.AudioContext;
  window.AudioContext = class extends Original {
    constructor(...args) {
      super(...args);
      window.__qaAudioContext = this;
    }
  };
});
await page.goto(base);
await page
  .getByRole("heading", { name: "Ein Abend. Viele Spiele. Ein Podium." })
  .waitFor();
await page.screenshot({ path: "outputs/qa/desktop-home.png", fullPage: true });
await page
  .getByRole("button", { name: "Olympiade erstellen", exact: true })
  .click();
await page.getByRole("dialog").getByLabel("Dein Name").fill("Nova");
await page
  .getByRole("dialog")
  .getByRole("button", { name: "Olympiade erstellen", exact: true })
  .click();
await page.getByRole("heading", { name: "Die Crew sammelt sich." }).waitFor();
const session = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("olymp.session")),
);
assert.equal(session.code.length, 6);
await page.waitForFunction(() => window.__qaAudioContext?.state === "running");
await page.screenshot({ path: "outputs/qa/desktop-lobby.png", fullPage: true });
const ctx2 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  }),
  mobile = await ctx2.newPage();
mobile.on("pageerror", (e) => errors.push(e.message));
await mobile.goto(base + "/?room=" + session.code);
await mobile.getByRole("dialog").getByLabel("Dein Name").fill("Pixel");
await mobile
  .getByRole("dialog")
  .getByRole("button", { name: "Mitspielen", exact: true })
  .click();
await mobile.getByRole("heading", { name: "Die Crew sammelt sich." }).waitFor();
await mobile.screenshot({
  path: "outputs/qa/mobile-lobby.png",
  fullPage: true,
});
assert.ok(
  await mobile.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth,
  ),
  "Mobile overflow",
);
await page.getByRole("button", { name: "Einstellungen", exact: true }).click();
await page.getByLabel("Weniger Bewegung").check();
await page.getByRole("dialog").locator("input[type=range]").nth(1).fill("0.2");
await page
  .getByRole("dialog")
  .getByRole("button", { name: "Schließen" })
  .click();
await page.reload();
await page.getByRole("heading", { name: "Die Crew sammelt sich." }).waitFor();
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("olymp.settings")).motion,
  ),
  true,
);
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("olymp.settings")).music,
  ),
  0.2,
);
await ctx.setOffline(true);
await page.locator(".connection.reconnecting").waitFor({ timeout: 15000 });
await ctx.setOffline(false);
await page.locator(".connection.online").waitFor({ timeout: 15000 });
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("olymp.session")).playerId,
  ),
  session.playerId,
);
await page.getByRole("button", { name: "Ich bin bereit", exact: true }).click();
await mobile
  .getByRole("button", { name: "Ich bin bereit", exact: true })
  .click();
await page
  .getByRole("button", { name: "Olympiade starten", exact: true })
  .click();
await page
  .getByRole("button", { name: "Verstanden. Ich bin bereit.", exact: true })
  .waitFor();
await page
  .getByRole("button", { name: "Verstanden. Ich bin bereit.", exact: true })
  .click();
await mobile
  .getByRole("button", { name: "Verstanden. Ich bin bereit.", exact: true })
  .click();
await page
  .getByRole("textbox", { name: "Deine Antwort" })
  .waitFor({ timeout: 20000 });
await page.getByRole("button", { name: "Alle Emotes", exact: true }).click();
await page
  .getByRole("button", { name: "Wie bitte?! senden", exact: true })
  .click();
await mobile.locator(".live-emote").filter({ hasText: "Nova" }).waitFor();
await page.screenshot({
  path: "outputs/qa/desktop-game-emote.png",
  fullPage: true,
});
await mobile.screenshot({ path: "outputs/qa/mobile-game.png", fullPage: true });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("olymp.session")).playerId,
  ),
  session.playerId,
);
assert.deepEqual(errors, []);
console.log(
  "PASS: Desktop/Mobile rendering, real room join, AudioContext activation, settings persistence, refresh, offline/reconnect, synchronized start, in-game emotes.",
);
await browser.close();
