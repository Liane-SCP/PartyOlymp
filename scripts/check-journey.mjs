import fs from "node:fs";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({ entryPoints: ["tests/journey-browser-engine.ts"], outfile: "outputs/journey-browser-engine.mjs", bundle: true, platform: "node", format: "esm" });
const { fixture } = await import("../outputs/journey-browser-engine.mjs");
fs.mkdirSync("outputs/qa", { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
const errors = [];
try {
  for (const scenario of [
    { name: "desktop", width: 1440, count: 8 },
    { name: "mobile", width: 390, count: 12 },
    { name: "fallback", width: 390, count: 2, fallback: true },
    { name: "reduced", width: 1440, count: 3, reduced: true },
  ]) {
    const m = fixture(scenario.count);
    const page = await browser.newPage({ viewport: { width: scenario.width, height: 1100 }, reducedMotion: scenario.reduced ? "reduce" : "no-preference" });
    page.on("pageerror", e => errors.push(e.message));
    await page.routeWebSocket("**/api/live", ws => ws.close());
    await page.addInitScript(({ id, reduced, fallback }) => {
      localStorage.setItem("olymp.session", JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" }));
      localStorage.setItem("olymp.settings", JSON.stringify({ muted: true, motion: !!reduced, intense: true }));
      if (fallback) { const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (name, ...args) { return String(name).includes("webgl") ? null : original.call(this, name, ...args); }; }
    }, { id: m.first, reduced: scenario.reduced, fallback: scenario.fallback });
    await page.route("**/api/room", async route => {
      const body = route.request().postDataJSON();
      if (body.type === "action") m.act(body.action);
      await route.fulfill({ json: m.view() });
    });
    await page.goto("http://127.0.0.1:5173");
    const journey = page.getByRole("region", { name: "Eure Reise zum Olymp" });
    await journey.waitFor();
    if (scenario.fallback) await page.getByText("Euer Weg steht in den Sternen.").waitFor();
    else await page.locator(".journey-ready").waitFor();
    await journey.screenshot({ path: `outputs/qa/journey-${scenario.name}.png` });
    assert.equal(await page.locator(".relic-card").count(), 3);
    await page.getByRole("button", { name: "Nächste Insel", exact: true }).click();
    assert.match(await page.locator(".journey-location h3").innerText(), /Sturmmeer/);
    await page.getByRole("button", { name: "Vorherige Insel", exact: true }).click();
    await page.getByRole("button", { name: "Für diese Disziplin einsetzen", exact: true }).first().click();
    await page.getByText("Goldener Lorbeer ist für diese Disziplin versiegelt.").waitFor();
    assert.equal(m.room.journey.inventories[m.first].length, 2);
    await page.reload();
    await page.getByText("Goldener Lorbeer ist für diese Disziplin versiegelt.").waitFor();
    m.chest();
    await page.getByRole("button", { name: "✧ Sternensplitter", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector(".journey-chest"));
    assert.equal(m.room.journey.inventories[m.first].filter(r => r.kind === "comet").length, 2);
    if(scenario.name==="desktop") {
      m.reveal(); await page.locator(".score-show").waitFor();
      await page.waitForFunction(()=>document.querySelector(".score-show")?.classList.contains("awarded"));
      const own=page.locator(".show-result.self");
      assert.match(await own.innerText(),/Goldener Lorbeer: \+75/);
      await page.waitForFunction(()=>document.querySelector(".show-result.self .show-award strong")?.textContent?.includes("375"));
      assert.match(await own.locator(".show-award strong").innerText(),/375/);
      await page.locator(".score-show").screenshot({path:"outputs/qa/journey-relic-results.png"});
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log("Journey: desktop/mobile 3D, route navigation, equip, reload persistence, chest choice, 12-player layout, reduced motion, WebGL fallback passed.");
} finally { await browser.close(); }
