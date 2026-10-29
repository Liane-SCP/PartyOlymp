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
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1366, 390]) {
    const m = match("spectrum", 3),
      viewer = m.room.game.public.psychic;
    let sends = 0;
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.routeWebSocket("**/api/live", (ws) => ws.close());
    await page.addInitScript((id) => {
      localStorage.setItem(
        "olymp.session",
        JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" }),
      );
      if (!localStorage.getItem("olymp.settings"))
        localStorage.setItem(
          "olymp.settings",
          JSON.stringify({
            muted: true,
            motion: true,
            favorites: [0, 1, 2, 3, 4, 5],
          }),
        );
    }, viewer);
    await page.route("**/api/room", async (route) => {
      const a = route.request().postDataJSON().action;
      if (a?.type === "game") m.act(viewer, a.action);
      if (a?.type === "emote") {
        sends++;
        m.room.emotes.push({
          id: String(sends),
          player: viewer,
          emote: a.emote,
          at: Date.now(),
        });
      }
      await route.fulfill({ json: m.view(viewer) });
    });
    await page.goto("http://127.0.0.1:5173");
    const input = page.getByLabel("Ein passender Begriff"),
      submit = page.getByRole("button", {
        name: "Hinweis teilen",
        exact: true,
      });
    await input.fill("50");
    assert.ok(await submit.isEnabled());
    await submit.click();
    await page.locator("#spectrum-clue-help[role=alert]").waitFor();
    assert.equal(m.room.game.stage, "clue");
    await input.fill("GTA 5");
    assert.ok(await submit.isEnabled());
    await submit.click();
    await input.waitFor({ state: "detached" });
    assert.equal(m.room.game.public.clue, "GTA 5");
    await page
      .getByRole("button", { name: "Alle Emotes", exact: true })
      .click();
    const menu = page.locator(".direct-emotes");
    await menu.waitFor();
    const star = menu.locator(".emote-star[aria-pressed=false]").first();
    await star.click();
    await menu.locator(".emote-slots.replacing").waitFor();
    await menu.locator(".emote-slots button").first().click();
    assert.equal(sends, 0);
    const favorites = await page.evaluate(
      () => JSON.parse(localStorage.getItem("olymp.settings")).favorites,
    );
    assert.equal(favorites.length, 6);
    assert.notEqual(favorites[0], 0);
    const box = await menu.boundingBox();
    assert.ok(
      box.x >= 0 &&
        box.x + box.width <= width + 1 &&
        box.y >= 0 &&
        box.y + box.height <= 845,
      JSON.stringify(box),
    );
    await page.screenshot({ path: `outputs/qa/emote-menu-${width}.png` });
    await menu.locator(".emote-send-choice").first().click();
    await menu.waitFor({ state: "detached" });
    await page.locator(".live-emote").waitFor();
    assert.equal(sends, 1);
    assert.equal(await page.locator(".emote-bubble").count(), 0);
    assert.equal(await page.locator(".live-emote").count(), 1);
    assert.match(await page.locator(".live-emote").innerText(), /Nova/);
    await page.reload();
    await page
      .getByRole("button", { name: "Alle Emotes", exact: true })
      .click();
    assert.deepEqual(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("olymp.settings")).favorites,
      ),
      favorites,
    );
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    "Spectrum submit and direct emote/favorites checks passed at desktop and mobile widths.",
  );
} finally {
  await browser.close();
}
