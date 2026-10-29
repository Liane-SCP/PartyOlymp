import fs from "node:fs";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";

await build({
  entryPoints: ["tests/browser-game-engine.ts"],
  outfile: "outputs/browser-boss-engine.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { match } = await import("../outputs/browser-boss-engine.mjs");
const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
  ],
});
const errors = [],
  metrics = [];
fs.mkdirSync("outputs/qa", { recursive: true });
async function open(m, width = 1440, options = {}) {
  const page = await browser.newPage({
    viewport: { width, height: width < 600 ? 844 : 900 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (
      msg.type() === "error" &&
      /THREE|WebGL|React|uncaught/i.test(msg.text()) &&
      !(options.fallback && /Error creating WebGL context/i.test(msg.text()))
    )
      errors.push(msg.text());
  });
  await page.routeWebSocket("**/api/live", (ws) => ws.close());
  await page.addInitScript(
    ({ id, fallback }) => {
      localStorage.setItem(
        "olymp.session",
        JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" }),
      );
      localStorage.setItem(
        "olymp.settings",
        JSON.stringify({ muted: true, motion: false, intense: true }),
      );
      if (fallback) {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (name, ...args) {
          if (String(name).includes("webgl")) return null;
          return original.call(this, name, ...args);
        };
      }
    },
    { id: m.first, fallback: options.fallback },
  );
  await page.route("**/api/room", async (route) => {
    const b = route.request().postDataJSON();
    try {
      if (b.action?.type === "game") m.command(m.first, b.action);
      await route.fulfill({ json: m.view() });
    } catch (e) {
      errors.push(e.message);
      await route.fulfill({ status: 400, json: { error: e.message } });
    }
  });
  await page.goto("http://127.0.0.1:5173");
  await page.locator(".boss-game").waitFor();
  await page
    .locator(
      options.fallback
        ? ".boss-scene-retry"
        : ".boss-scene-wrapper.is-ready canvas[data-rigged='true']",
    )
    .waitFor({ timeout: 60000 });
  return page;
}
function answer(m) {
  if (m.room.game.stage === "intro") m.room.game.deadline = Date.now() - 1;
  m.view();
}
async function shot(page, name) {
  await page.waitForTimeout(350);
  const metric = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    canvas: !!document.querySelector("canvas.boss-scene-canvas"),
    height: document.querySelector(".boss-game").getBoundingClientRect().height,
    scroll:
      document.querySelector(".room-shell").scrollHeight -
      document.querySelector(".room-shell").clientHeight,
    viewport: { width: innerWidth, height: innerHeight },
    arena: document
      .querySelector(".boss-scene-wrapper")
      .getBoundingClientRect()
      .toJSON(),
    command: document
      .querySelector(".boss-command")
      .getBoundingClientRect()
      .toJSON(),
  }));
  assert.equal(metric.overflow, false, name);
  assert.equal(metric.arena.x, 0, `${name}: left edge`);
  assert.equal(metric.arena.y, 0, `${name}: top edge`);
  assert.equal(
    metric.arena.width,
    metric.viewport.width,
    `${name}: full width`,
  );
  assert.equal(
    metric.arena.height,
    metric.viewport.height,
    `${name}: full height`,
  );
  assert.ok(
    metric.command.x >= 0 && metric.command.right <= metric.viewport.width,
    `${name}: HUD horizontal bounds`,
  );
  assert.ok(
    metric.command.y >= 0 && metric.command.bottom <= metric.viewport.height,
    `${name}: HUD vertical bounds`,
  );
  metrics.push({ name, ...metric });
  await page.screenshot({
    path: `outputs/qa/boss-${name}.png`,
    fullPage: true,
  });
}
function primeOthers(m) {
  const g = m.room.game;
  for (const id of m.room.participantIds.slice(1)) {
    const round = g.round + 1;
    if (g.id === "colossus") {
      m.act(id, { type: "roll", round });
      m.act(id, { type: "strike", round });
    } else if (g.id === "dragon")
      m.act(id, {
        type: "estimate",
        round,
        guess: g.secret.product.price,
        risk: "bold",
      });
    else {
      m.act(id, { type: "start", round });
      m.act(id, { type: "fire", round, elapsed: 1000 });
    }
  }
}
try {
  for (const kind of ["colossus", "kraken", "dragon"]) {
    const m = match(kind, 12),
      g = m.room.game;
    m.room.selection[0].rounds = 6;
    g.totalRounds = 6;
    const page = await open(m);
    await shot(page, `${kind}-intro`);
    answer(m);
    await page.waitForTimeout(1100);
    await shot(page, `${kind}-play-12`);
    if (kind === "colossus") {
      await page.getByRole("button", { name: "Würfeln", exact: true }).click();
      await page.getByRole("button", { name: /Würfel 1:/ }).click();
      assert.equal(await page.getByRole("button", { name: /Würfel 1:/ }).getAttribute("aria-pressed"), "true");
      await page.getByRole("button", { name: /Noch mal/ }).click();
      await page.getByRole("button", { name: /Noch mal/ }).click();
      await page.waitForTimeout(450);
      assert.equal(g.players[m.first].held[0], true);
      assert.equal(
        await page.getByRole("button", { name: /Würfel 1:/ }).isDisabled(),
        true,
      );
      primeOthers(m);
      await page.getByRole("button", { name: "Angriff laden" }).click();
    } else if (kind === "dragon") {
      await page
        .getByRole("textbox", { name: "Preisschätzung in Euro" })
        .fill((g.secret.product.price / 100).toFixed(2).replace(".", ","));
      await page.getByRole("button", { name: /Riskant/ }).click();
      primeOthers(m);
      await page.getByRole("button", { name: "Tipp versiegeln" }).click();
    } else {
      primeOthers(m);
      const trigger = page.getByRole("button", {
        name: "GEDRÜCKT HALTEN",
        exact: true,
      });
      await trigger.focus();
      await page.keyboard.down("Space");
      await page.waitForTimeout(1030);
      await page.keyboard.up("Space");
    }
    await page.locator(".boss-volley").waitFor();
    assert.equal(g.stage, "roundReveal", kind);
    g.public.revealStartedAt = Date.now() - 8600;
    g.deadline = Date.now() + 60000;
    await page.waitForTimeout(1100);
    await shot(page, `${kind}-volley`);
    await page.close();
    const mobile = match(kind, 2);
    answer(mobile);
    const mobilePage = await open(mobile, 390);
    await shot(mobilePage, `${kind}-mobile`);
    await mobilePage.close();
    // Each distinct arena must also support the core phase and its final defeat.
    const finale = match(kind, 2),
      f = finale.room.game;
    f.public.boss.phase = 2;
    f.public.boss.hp = f.public.boss.segmentHp;
    answer(finale);
    const finalPage = await open(finale);
    await shot(finalPage, `${kind}-phase-three`);
    f.stage = "roundReveal";
    f.public.revealStartedAt = Date.now() - 9800;
    f.deadline = Date.now() + 60000;
    f.public.reveal = {
      outcomes: finale.room.participantIds.map((id) => ({
        id,
        score: 1200,
        damage: f.public.boss.segmentHp / 2,
        label: "Perfekter Treffer",
        submitted: true,
        guess: f.secret.product?.price,
        accuracy: 1,
      })),
      totalDamage: f.public.boss.segmentHp,
      hpBefore: f.public.boss.segmentHp,
      hpAfter: 0,
      phaseBroken: true,
      victory: true,
      finalAttack: true,
      price: f.secret.product?.price,
    };
    f.public.boss.hp = 0;
    f.public.boss.victory = true;
    await finalPage.waitForTimeout(1300);
    await shot(finalPage, `${kind}-victory`);
    await finalPage.close();
  }
  const fallback = match("kraken", 2);
  answer(fallback);
  const page = await open(fallback, 1440, { fallback: true });
  await shot(page, "kraken-fallback");
  await page.close();
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "outputs/qa/boss-views.json",
    JSON.stringify({ metrics, errors }, null, 2),
  );
  console.log(JSON.stringify({ metrics, errors }, null, 2));
} finally {
  await browser.close();
}
