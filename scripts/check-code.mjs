import fs from "node:fs";
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
const browser = await chromium.launch({ headless: true }),
  errors = [],
  metrics = [];
const names = ["Rot", "Blau", "Gelb", "Grün", "Violett", "Orange"];
async function open(m, id, width = 1366) {
  const page = await browser.newPage({
    viewport: { width, height: width === 1366 ? 768 : 844 },
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
      JSON.stringify({ muted: true, motion: true }),
    );
  }, id);
  await page.route("**/api/room", async (route) => {
    const b = route.request().postDataJSON();
    try {
      if (b.action?.type === "game") m.act(id, b.action.action);
      await route.fulfill({ json: m.view(id) });
    } catch (e) {
      errors.push(e.message);
      await route.fulfill({ status: 400, json: { error: e.message } });
    }
  });
  await page.goto("http://127.0.0.1:5173");
  await page.locator(".code-arena").waitFor();
  return page;
}
async function guess(page, colors) {
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("button", { name: new RegExp(`^Position ${i + 1}:`) })
      .click();
    await page
      .getByRole("button", { name: `Farbe ${names[colors[i]]}`, exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Tipp verdeckt festlegen" }).click();
}
async function shot(page, name) {
  const metric = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    scroll:
      document.querySelector(".room-shell").scrollHeight -
      document.querySelector(".room-shell").clientHeight,
  }));
  assert.equal(metric.overflow, false, name);
  metrics.push({ name, ...metric });
  await page.screenshot({
    path: `outputs/qa/code-${name}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
try {
  const m = match("code", 3),
    ids = m.room.participantIds;
  m.room.game.secret.code = [0, 1, 2, 3];
  const pages = [];
  for (const id of ids) pages.push(await open(m, id));
  const [a, b, c] = pages;
  await guess(a, [0, 2, 3, 1]);
  assert.equal(m.room.game.players[ids[0]].guesses.length, 0);
  await a
    .getByText("Dein Tipp ist versiegelt. Die Crew ist noch dran.")
    .waitFor();
  await guess(b, [0, 0, 0, 0]);
  await guess(c, [1, 1, 1, 1]);
  await a.locator(".code-guess-row .code-pins .exact").waitFor();
  assert.equal(
    await a.locator(".code-guess-row .code-pins .misplaced").count(),
    3,
  );
  assert.equal(await a.locator(".code-rival .code-peg").count(), 0);
  await shot(a, "turn-two");
  await guess(a, [0, 1, 2, 3]);
  await guess(b, [1, 2, 3, 0]);
  await c
    .getByRole("button", { name: "Aufgeben & zuschauen", exact: true })
    .click();
  await c.getByRole("button", { name: "Ja, aufgeben & zuschauen" }).click();
  await a.locator(".code-state").waitFor();
  await a.getByRole("button", { name: "Brett ansehen" }).first().click();
  await a.getByText("Crew 1 · Live-Brett").waitFor();
  assert.equal(await a.locator(".code-history .code-peg").count(), 8);
  await shot(a, "spectating");
  await b.getByRole("button", { name: "Tipp verdeckt festlegen" }).waitFor();
  await guess(b, [0, 1, 2, 3]);
  await a.getByText("Der Code ist offen.").waitFor();
  assert.equal(m.room.game.stage, "roundReveal");
  assert.equal(m.room.game.players[ids[0]].guesses.length, 2);
  assert.equal(m.room.game.players[ids[1]].guesses.length, 3);
  await shot(a, "reveal");
  for (const page of pages) await page.close();
  for (const width of [1366, 390]) {
    const many = match("code", 12);
    many.room.game.secret.code = [0, 1, 2, 3];
    for (let t = 1; t <= 3; t++)
      for (const id of many.room.participantIds)
        many.act(id, {
          type: "guess",
          round: 1,
          turn: t,
          colors: [t, 4, 4, 5],
        });
    const page = await open(many, many.first, width);
    await shot(page, `twelve-${width}`);
    await page.close();
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "outputs/qa/code-metrics.json",
    JSON.stringify(metrics, null, 2),
  );
  console.log(JSON.stringify(metrics));
} finally {
  await browser.close();
}
