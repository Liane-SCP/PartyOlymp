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
const tile =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#d6e5cd"/><path d="M0 40L256 160M90 0L130 256" stroke="white" stroke-width="6"/><text x="12" y="28">QA-Kartenkachel</text></svg>';
try {
  for (const width of [1366, 390])
    for (const mode of ["geo", "blocks", "typer", "spectrum"]) {
      const m = match(mode),
        actions = [],
        tileUrls = [];
      let finalAttempts = 0;
      const viewer = mode === "spectrum" ? m.room.participantIds[1] : m.first;
      if (mode === "spectrum")
        m.act(m.first, { type: "clue", clue: "Kaffee", round: 1 });
      const page = await browser.newPage({
        viewport: { width, height: width === 1366 ? 768 : 844 },
      });
      page.on("pageerror", (e) => errors.push(`${mode}: ${e.message}`));
      await page.routeWebSocket("**/api/live", (ws) => ws.close());
      // Exercise zoom without automated fetching/prefetching of public OSM tiles.
      await page.route("https://tile.openstreetmap.org/**", (route) => {
        tileUrls.push(route.request().url());
        return route.fulfill({ contentType: "image/svg+xml", body: tile });
      });
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
        const b = route.request().postDataJSON(),
          a = b.action?.type === "game" ? b.action.action : null;
        if (a) {
          actions.push(a);
          if (mode === "blocks") await new Promise((r) => setTimeout(r, 220));
          const lostFinish =
            mode === "typer" &&
            a.text === m.room.game.public.text &&
            ++finalAttempts === 1;
          if (!lostFinish) m.act(viewer, a);
        }
        await route.fulfill({ json: m.view(viewer) });
      });
      await page.goto("http://127.0.0.1:5173");
      await page.locator(".play-surface").waitFor();
      if (mode === "typer") {
        const text = m.room.game.public.text;
        await page
          .getByLabel("Renntext abtippen")
          .pressSequentially(text, { delay: 5 });
        await page
          .getByText("Zieleinlauf bestätigt ✓", { exact: true })
          .waitFor();
        assert.ok(finalAttempts >= 2, "lost finish must retry");
        assert.equal(m.room.game.players[viewer].submitted, true);
      }
      if (mode === "blocks") {
        await page.keyboard.down("a");
        await page.waitForTimeout(340);
        await page.keyboard.up("a");
        for (const key of ["d", "w", "s", "c", "Space"])
          await page.keyboard.press(key);
        await page.waitForFunction(
          () => document.querySelectorAll(".canvas-field canvas").length === 12,
        );
        await page.waitForTimeout(1600);
        const keys = actions.flatMap((a) => a.inputs ?? []).map((a) => a.key);
        for (const key of ["left", "right", "cw", "down", "hold", "drop"])
          assert.ok(keys.includes(key), key);
        assert.ok(
          keys.filter((k) => k === "left").length >= 3,
          "held A repeats",
        );
        const highest = Math.max(
          ...actions.flatMap((a) => a.inputs ?? []).map((a) => a.seq),
        );
        assert.equal(
          m.room.game.players[viewer].seq,
          highest,
          "all delayed commands acknowledged",
        );
        assert.equal(
          await page.locator(".block-field i").count(),
          0,
          "no DOM grid cells",
        );
      }
      if (mode === "spectrum") {
        const input = page.getByLabel("Dein geheimer Zeiger");
        await input.fill("73");
        await page
          .getByRole("button", { name: "Meinen Tipp versiegeln" })
          .click();
        await page.getByText("✓ Dein Tipp: 73 · Noch geheim").waitFor();
        assert.equal(m.room.game.players[viewer].guess, 73);
        const other = m.view(m.room.participantIds[2]).room.game;
        assert.equal(other.mine.guess, null);
        assert.equal(other.target, undefined);
      }
      if (mode === "geo") {
        await page.waitForFunction(
          () => !document.querySelector(".pano-loading"),
        );
        const plus = page.getByRole("button", { name: "Karte vergrößern" });
        for (let i = 0; i < 18; i++) await plus.click();
        await page.getByText("Zoom 19/19", { exact: true }).waitFor();
        assert.ok(tileUrls.some((url) => url.includes("/19/")));
        await page
          .locator(".street-map")
          .click({ position: { x: 110, y: 80 } });
        await page
          .getByRole("button", { name: "Hier bin ich · Festlegen" })
          .click();
        await page.waitForTimeout(200);
        assert.ok(
          actions.some((a) => a.type === "pin" && Number.isFinite(a.lat)),
        );
      }
      const metric = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        canvases: document.querySelectorAll(".canvas-field canvas").length,
      }));
      assert.equal(metric.overflow, false, `${mode} overflow ${width}`);
      metrics.push({ mode, width, ...metric });
      await page.screenshot({
        path: `outputs/qa/fixes-${mode}-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
      await page.close();
    }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "outputs/qa/game-fixes-metrics.json",
    JSON.stringify(metrics, null, 2),
  );
  console.log(JSON.stringify(metrics));
} finally {
  await browser.close();
}
