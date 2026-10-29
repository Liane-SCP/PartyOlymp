import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
const base = "http://127.0.0.1:5173";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
// Exercise the real socket: action responses must arrive without a frame poll.
const created = await (
  await fetch(base + "/api/room", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "create", name: "UI Check", avatar: 0 }),
  })
).json();
assert.ok(created.token, JSON.stringify(created));
const ws = new WebSocket(base.replace("http", "ws") + "/api/live");
const messages = [];
ws.addEventListener("message", (e) => messages.push(JSON.parse(e.data)));
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});
try {
  ws.send(
    JSON.stringify({
      code: created.room.code,
      playerId: created.playerId,
      token: created.token,
    }),
  );
  for (let i = 0; i < 100 && !messages.some((m) => m.type === "snapshot"); i++)
    await delay(50);
  assert.ok(messages.some((m) => m.type === "snapshot"));
  messages.length = 0;
  ws.send(
    JSON.stringify({
      type: "action",
      requestId: crypto.randomUUID(),
      action: { type: "ready", ready: true },
    }),
  );
  for (let i = 0; i < 100 && !messages.some((m) => m.type === "ack"); i++)
    await delay(50);
  assert.ok(
    messages
      .find((m) => m.type === "snapshot")
      ?.room.players.find((p) => p.id === created.playerId).ready,
    "Committed action snapshot must precede ack without polling",
  );
  assert.equal(messages.find((m) => m.type === "ack")?.ok, true);
} finally {
  ws.close();
}

await build({
  entryPoints: ["tests/browser-game-engine.ts"],
  outfile: "outputs/browser-boss-ui.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { match } = await import("../outputs/browser-boss-ui.mjs");
const browser = await chromium.launch({
  headless: true,
  channel: "chromium",
  args: ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist"],
});
const errors = [],
  results = [];
try {
  for (const kind of ["colossus", "kraken", "dragon"]) {
    const m = match(kind, 12),
      g = m.room.game;
    g.deadline = Date.now() - 1;
    m.view();
    g.deadline = Date.now() + 600000;
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    page.on("pageerror", (e) => errors.push(e.message));
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
    await page.routeWebSocket("**/api/live", (socket) => socket.close());
    const actions = [];
    let rejectNext = false;
    await page.route("**/api/room", async (route) => {
      const body = route.request().postDataJSON();
      let error;
      if (body.type === "action") {
        actions.push(body.action.action);
        await delay(900);
        if (rejectNext) {
          error = "Test: Bitte erneut versuchen.";
          rejectNext = false;
        } else {
          m.act(m.first, body.action.action);
          m.room.revision++;
        }
      }
      await route.fulfill({
        status: error ? 400 : 200,
        json: { ...m.view(), ...(error ? { error } : {}) },
      });
    });
    await page.goto(base);
    await page
      .locator(".boss-scene-wrapper.is-ready")
      .waitFor({ timeout: 90000 });
    if (kind === "colossus") {
      const roll = page.getByRole("button", { name: "Würfeln", exact: true });
      await roll.click();
      await page
        .locator(".boss-die.is-rolling")
        .first()
        .waitFor({ timeout: 300 });
      assert.equal(
        g.players[m.first].rolls,
        0,
        "Animation must start before server reply",
      );
      await page
        .getByRole("button", { name: "Noch mal (2)", exact: true })
        .waitFor();
      await page.waitForTimeout(550);
      const dice = page.locator(".boss-dice-tray button");
      const before = actions.length;
      const responseMs = await page.evaluate(() => {
        const buttons = [
          ...document.querySelectorAll(".boss-dice-tray button"),
        ];
        const start = performance.now();
        buttons[0].click();
        buttons[2].click();
        buttons[4].click();
        return new Promise((resolve) =>
          requestAnimationFrame(() => resolve(performance.now() - start)),
        );
      });
      for (const i of [0, 2, 4])
        assert.equal(await dice.nth(i).getAttribute("aria-pressed"), "true");
      assert.equal(
        actions.length,
        before,
        "Holding must not enqueue network requests",
      );
      assert.ok(responseMs < 150, `Slow selection: ${responseMs}ms`);
      const initial = [...g.players[m.first].dice];
      await page
        .getByRole("button", { name: "Noch mal (2)", exact: true })
        .click();
      await page
        .locator(".boss-die.is-rolling")
        .first()
        .waitFor({ timeout: 300 });
      assert.equal(await page.locator(".boss-die.is-rolling").count(), 2);
      await page.screenshot({ path: "outputs/qa/boss-dice-rolling.png" });
      await page
        .getByRole("button", { name: "Noch mal (1)", exact: true })
        .waitFor();
      for (const i of [0, 2, 4])
        assert.equal(g.players[m.first].dice[i], initial[i]);
      assert.deepEqual(actions.at(-1).held, [true, false, true, false, true]);
      await page.waitForTimeout(550);
      assert.equal(await page.locator(".boss-die-side").count(), 30);
      await page.screenshot({ path: "outputs/qa/boss-dice-settled.png" });
      rejectNext = true;
      await page
        .getByRole("button", { name: "Noch mal (1)", exact: true })
        .click();
      await page.waitForFunction(
        () => !document.querySelector(".boss-die.is-rolling"),
      );
      assert.equal(g.players[m.first].rolls, 2);
      assert.ok(
        await page
          .getByRole("button", { name: "Noch mal (1)", exact: true })
          .isEnabled(),
      );
      await page
        .getByRole("button", { name: "Angriff laden", exact: true })
        .click();
      await page
        .getByText("Angriff wird geladen …", { exact: true })
        .waitFor({ timeout: 300 });
      await page.locator(".boss-sealed").waitFor();
      results.push({
        kind,
        selectionResponseMs: responseMs,
        atomicHolds: true,
        rejectionRecovers: true,
      });
    } else if (kind === "kraken") {
      const button = page.locator(".boss-trigger"),
        rect = await button.boundingBox();
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.down();
      await page
        .getByText("LOSLASSEN · SCHUSS FESTLEGEN", { exact: true })
        .waitFor({ timeout: 300 });
      const left = await page
        .locator(".boss-charge-needle")
        .evaluate((el) => el.style.left);
      await page.waitForTimeout(150);
      assert.notEqual(
        await page
          .locator(".boss-charge-needle")
          .evaluate((el) => el.style.left),
        left,
      );
      await page.mouse.up();
      await page
        .getByText("KANONE GELADEN", { exact: true })
        .waitFor({ timeout: 300 });
      await page.locator(".boss-sealed").waitFor({ timeout: 6000 });
      assert.deepEqual(
        actions.map((a) => a.type),
        ["start", "fire"],
      );
      assert.ok(
        g.players[m.first].elapsed < 900,
        "Local aim must not include network delay",
      );
      results.push({
        kind,
        immediateGauge: true,
        localElapsed: g.players[m.first].elapsed,
      });
    } else {
      await page.getByLabel("Preisschätzung in Euro").fill("123,45");
      await page.getByRole("button", { name: /Riskant/ }).click();
      assert.equal(
        await page
          .getByRole("button", { name: /Riskant/ })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page
        .getByRole("button", { name: "Tipp versiegeln", exact: true })
        .click();
      await page
        .getByText("Tipp wird versiegelt …", { exact: true })
        .waitFor({ timeout: 300 });
      await page.locator(".boss-sealed").waitFor();
      assert.equal(g.players[m.first].guess, 12345);
      results.push({ kind, immediateFeedback: true });
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "outputs/qa/boss-ui.json",
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
