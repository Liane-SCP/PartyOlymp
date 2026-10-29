import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({
  entryPoints: ["tests/browser-game-engine.ts"],
  outfile: "outputs/browser-game-engine.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { match } = await import("../outputs/browser-game-engine.mjs");
const m = match("typer", 3),
  target = "Ein kurzer Text für unser Rennen.";
m.room.game.public.text = target;
m.room.game.public.startedAt = Date.now() - 10000;
const browser = await chromium.launch({ headless: true });
let dropped = false,
  allowFinish = false,
  attempts = 0;
const errors = [];
try {
  const pages = [];
  for (const [i, width] of [1366, 390].entries()) {
    const viewer = m.room.participantIds[i],
      page = await browser.newPage({ viewport: { width, height: 844 } });
    page.on("pageerror", (e) => errors.push(e.message));
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
    }, viewer);
    await page.route("**/api/room", async (route) => {
      const body = route.request().postDataJSON(),
        action = body.action?.action;
      if (action) {
        attempts++;
        if (!dropped) dropped = true;
        else if (action.text !== target || allowFinish) m.act(viewer, action);
      }
      await route.fulfill({ json: m.view(viewer) });
    });
    await page.goto("http://127.0.0.1:5173");
    await page.locator(".type-arena").waitFor();
    pages.push(page);
  }
  const [a, b] = pages,
    input = a.getByLabel("Renntext abtippen");
  await input.fill(target.slice(0, 12));
  await b.getByRole("progressbar", { name: "Fortschritt Nova" }).waitFor();
  await b.waitForFunction(
    () =>
      document
        .querySelector('[aria-label="Fortschritt Nova"]')
        .getAttribute("aria-valuenow") !== "0",
  );
  assert.equal(m.room.game.players[m.first].progress, 12);
  assert.ok(attempts >= 2, "lost partial update retried without more typing");
  assert.equal(
    await b
      .getByRole("progressbar", { name: "Fortschritt Nova" })
      .getAttribute("aria-valuenow"),
    String(Math.floor(1200 / target.length)),
  );
  await input.fill(target + "x");
  assert.equal(
    await a
      .getByRole("progressbar", { name: "Fortschritt Nova" })
      .getAttribute("aria-valuenow"),
    "99",
  );
  assert.equal(await input.isEnabled(), true);
  await input.fill(target);
  const localWpm = await a.locator(".type-stats strong").innerText();
  await a.waitForTimeout(1800);
  assert.equal(
    await a.locator(".type-stats strong").innerText(),
    localWpm,
    "WPM freezes while finish confirmation is delayed",
  );
  allowFinish = true;
  await a.getByText("Zieleinlauf bestätigt ✓", { exact: true }).waitFor();
  const finalWpm = await a.locator(".type-stats strong").innerText();
  await b.waitForFunction(
    () =>
      document
        .querySelector('[aria-label="Fortschritt Nova"]')
        .getAttribute("aria-valuenow") === "100",
  );
  await a.waitForTimeout(1300);
  assert.equal(
    await a.locator(".type-stats strong").innerText(),
    finalWpm,
    "confirmed WPM never declines",
  );
  for (const page of pages) {
    const geometry = await page
      .getByRole("progressbar", { name: "Fortschritt Nova" })
      .evaluate((road) => {
        const car = road.querySelector(".type-car").getBoundingClientRect(),
          r = road.getBoundingClientRect();
        return {
          carRight: car.right,
          roadRight: r.right,
          left: car.left,
          start: r.left,
        };
      });
    assert.ok(
      geometry.carRight <= geometry.roadRight + 1 &&
        geometry.left >= geometry.start - 1,
      JSON.stringify(geometry),
    );
  }
  await a.reload();
  await a.locator(".type-arena").waitFor();
  assert.equal(
    await a.locator(".type-stats strong").innerText(),
    finalWpm,
    "reload preserves frozen WPM",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: shared progress, lost packet recovery, excess text, delayed confirmation, frozen WPM, reload and lane geometry on desktop/mobile.",
  );
} finally {
  await browser.close();
}
