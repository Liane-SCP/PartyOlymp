import fs from "node:fs";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({
  entryPoints: ["tests/browser-game-engine.ts"],
  outfile: "outputs/browser-hud.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { match } = await import("../outputs/browser-hud.mjs");
const modes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "dice",
      "wiki",
      "picture",
      "budget",
      "blackjack",
      "cards",
      "color",
      "size",
      "geo",
      "typer",
      "herd",
      "spectrum",
      "categories",
      "chain",
      "code",
      "auction",
      "timing",
      "bomb",
    ];
const browser = await chromium.launch({
  headless: true,
  channel: "chromium",
  args: ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist"],
});
const metrics = [],
  errors = [];
try {
  for (const [width, height] of process.env.HUD_WIDTH
    ? [[Number(process.env.HUD_WIDTH), Number(process.env.HUD_HEIGHT || 768)]]
    : [
        [1366, 768],
        [1920, 1080],
        [390, 844],
      ]) {
    for (const mode of modes) {
      const m = match(mode, 12),
        g = m.room.game;
      g.deadline = Date.now() + 600000;
      g.public.previewUntil = 0;
      if (mode === "dice") g.public.turnDeadline = Date.now() + 600000;
      const page = await browser.newPage({ viewport: { width, height } });
      page.on("pageerror", (e) =>
        errors.push({ mode, width, error: e.message }),
      );
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
      await page.route("**/api/room", (route) =>
        route.fulfill({ json: m.view() }),
      );
      await page.goto("http://127.0.0.1:5173", {
        waitUntil: "domcontentloaded",
      });
      await page.locator(".immersive-play .play-surface").waitFor();
      await page.waitForTimeout(250);
      const metric = await page.evaluate(() => {
        const rect = (s) =>
          document.querySelector(s).getBoundingClientRect().toJSON();
        const surface = document.querySelector(".play-surface"),
          stage = document.querySelector(".stage-panel");
        return {
          board: rect(".game-board"),
          surface: rect(".play-surface"),
          stage: rect(".stage-panel"),
          scroll: surface.scrollHeight - surface.clientHeight,
          horizontal: surface.scrollWidth - surface.clientWidth,
          stageHorizontal: stage.scrollWidth - stage.clientWidth,
          pageOverflow: document.documentElement.scrollWidth > innerWidth,
          border: getComputedStyle(stage).borderWidth,
          shadow: getComputedStyle(document.querySelector(".header-actions"))
            .boxShadow,
          outliers: [...surface.querySelectorAll("*")]
            .filter(
              (el) =>
                el.getBoundingClientRect().right >
                surface.getBoundingClientRect().right + 1,
            )
            .slice(0, 15)
            .map((el) => ({
              tag: el.tagName,
              cls: el.className,
              right: el.getBoundingClientRect().right,
              width: el.getBoundingClientRect().width,
            })),
          actions: [
            ...surface.querySelectorAll(
              "button.primary,.answer-form,.own-hand",
            ),
          ]
            .filter((el) => el.getClientRects().length)
            .map((el) => ({
              text: el.textContent.trim().slice(0, 32),
              bottom: Math.round(el.getBoundingClientRect().bottom),
            })),
        };
      });
      metrics.push({ mode, width, height, ...metric });
      await page.screenshot({
        path: `outputs/qa/hud-${mode}-${width}.png`,
        animations: "disabled",
      });
      assert.equal(metric.border, "0px");
      assert.ok(
        metric.stage.right <= width,
        `${mode}/${width}: stage exceeds viewport`,
      );
      assert.notEqual(metric.shadow, "none");
      assert.equal(
        metric.pageOverflow,
        false,
        `${mode}/${width}: viewport overflow`,
      );
      assert.ok(
        metric.horizontal <= 1,
        `${mode}/${width}: horizontal game scroll ${metric.horizontal}: ${JSON.stringify(metric.outliers)}`,
      );
      assert.ok(
        metric.stageHorizontal <= 1,
        `${mode}/${width}: horizontal stage scroll ${metric.stageHorizontal}`,
      );
      if (width >= 1100)
        assert.ok(
          metric.actions.every((a) => a.bottom <= metric.stage.bottom + 1),
          `${mode}/${width}: primary action below game area`,
        );
      if (mode === "dice" && width === 1366) {
        await page
          .getByRole("button", { name: "Crew & Ton", exact: true })
          .click();
        assert.ok(await page.locator("#room-crew").isVisible());
        await page.locator(".desktop-crew-toggle").click();
        await page
          .getByRole("button", { name: "Einstellungen", exact: true })
          .click();
        assert.ok(await page.locator(".settings-modal").isVisible());
        await page.keyboard.press("Escape");
        // Snapshots trigger a finite compositor animation, never the HUD itself.
        await page.evaluate(() => document.activeElement?.blur());
        g.events.push({
          id: "hud-shake-test",
          type: "dice",
          player: m.first,
          at: Date.now(),
        });
        m.room.revision++;
        await page.waitForFunction(
          () =>
            document.querySelector(".game-camera")?.dataset.cameraImpact ===
            "dice",
        );
        assert.equal(
          await page
            .locator(".site-header")
            .evaluate((el) => getComputedStyle(el).transform),
          "none",
        );
        await page.waitForTimeout(500);
        assert.equal(
          await page
            .locator(".game-camera")
            .evaluate((el) => getComputedStyle(el).transform),
          "none",
        );
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page
          .locator(".game-camera")
          .evaluate((el) => delete el.dataset.cameraImpact);
        g.events.push({
          id: "hud-reduced-test",
          type: "score",
          player: m.first,
          at: Date.now(),
        });
        m.room.revision++;
        await page.waitForTimeout(1100);
        assert.equal(
          await page.locator(".game-camera").getAttribute("data-camera-impact"),
          null,
        );
      }
      if (mode === "picture" && width === 1366) {
        await page.locator(".answer-form input").focus();
        g.events.push({
          id: "hud-input-test",
          type: "wrong",
          player: m.first,
          at: Date.now(),
        });
        m.room.revision++;
        await page.waitForTimeout(1100);
        assert.equal(
          await page.locator(".game-camera").getAttribute("data-camera-impact"),
          null,
        );
      }
      await page.close();
    }
  }
  fs.writeFileSync(
    "outputs/qa/game-hud-metrics.json",
    JSON.stringify({ metrics, errors }, null, 2),
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      metrics.map(
        ({
          mode,
          width,
          scroll,
          horizontal,
          stageHorizontal,
          actions,
          stage,
        }) => ({
          mode,
          width,
          scroll,
          horizontal,
          stageHorizontal,
          below: actions.filter((a) => a.bottom > stage.bottom + 1),
        }),
      ),
    ),
  );
} finally {
  await browser.close();
}
