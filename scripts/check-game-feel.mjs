import fs from "node:fs";
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({
  entryPoints: ["tests/view-fixtures.ts"],
  outfile: "outputs/view-fixtures.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
assert.equal(
  spawnSync(process.execPath, ["outputs/view-fixtures.mjs"], {
    stdio: "inherit",
  }).status,
  0,
);
const fixtures = JSON.parse(
  fs.readFileSync("outputs/qa/view-fixtures.json", "utf8"),
);
const browser = await chromium.launch({ headless: true });
const errors = [];
async function open(name, width, edit = () => {}) {
  const f = structuredClone(fixtures.find((x) => x.name === name));
  assert.ok(f, name);
  const r = f.response.room;
  edit(r);
  r.game.deadline = Date.now() + 60000;
  r.game.revealStartedAt = Date.now();
  r.game.turnDeadline = Date.now() + 60000;
  const page = await browser.newPage({
      viewport: { width, height: width === 390 ? 844 : 1000 },
    }),
    actions = [];
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  await page.routeWebSocket("**/api/live", (ws) => ws.close());
  await page.addInitScript((id) => {
    localStorage.setItem(
      "olymp.session",
      JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" }),
    );
    localStorage.setItem(
      "olymp.settings",
      JSON.stringify({ muted: true, motion: false }),
    );
  }, f.response.playerId);
  await page.route("**/api/room", (route) => {
    const b = route.request().postDataJSON();
    if (b.type === "action") actions.push(b.action);
    r.serverTime = Date.now();
    return route.fulfill({ json: f.response });
  });
  await page.goto("http://127.0.0.1:5173");
  await page.locator(".room-shell").waitFor();
  return { page, r, actions };
}
async function capture(page, name, width) {
  await page.locator(".room-shell").evaluate((e) => (e.scrollTop = 0));
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    `${name} ${width}: horizontal overflow`,
  );
  await page.screenshot({
    path: `outputs/qa/feel-${name}-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
}
try {
  const modes = (
    process.env.QA_MODES ??
    "dice,wiki,picture,budget,blackjack,cards,color,size"
  ).split(",");
  for (const width of [1440, 390])
    for (const mode of modes) {
      const t = await open(mode, width);
      await t.page.locator(".play-guide").waitFor();
      assert.equal(
        await t.page
          .locator(mode === "cards" ? ".turn-order > div" : ".live-player")
          .count(),
        12,
      );
      if (mode === "dice") {
        const sheet = t.page.locator(".score-sheet");
        const zero = sheet
          .locator("button")
          .filter({ has: sheet.page().locator("strong", { hasText: /^0$/ }) });
        // Select a real zero-valued category from the rendered current roll.
        if (await zero.count()) {
          await zero.first().click();
          assert.equal(t.actions.length, 0);
          await t.page
            .getByRole("button", { name: "Ja, 0 eintragen", exact: true })
            .click();
          assert.equal(t.actions.at(-1).action.type, "category");
        }
      }
      if (mode === "budget") {
        assert.equal(
          await t.page.locator(".basket-checkout button").isEnabled(),
          false,
        );
        const products = t.page.locator(".product-grid button");
        assert.equal(await products.count(), 10);
        await products.nth(0).click();
        assert.equal(
          await products.nth(0).getAttribute("aria-pressed"),
          "true",
        );
        assert.equal(
          await t.page.locator(".basket-checkout button").isEnabled(),
          true,
        );
        await t.page.locator(".basket-checkout button").click();
        assert.equal(t.actions.at(-1).action.value.length, 1);
      }
      if (mode === "size") {
        const before = Number(
          await t.page.locator(".size-slider input").inputValue(),
        );
        await t.page
          .getByRole("button", { name: "×2 Doppelt so groß", exact: true })
          .click();
        const after = Number(
          await t.page.locator(".size-slider input").inputValue(),
        );
        assert.ok(after > before + 0.6);
        const obj = t.page.getByRole("group", {
          name: "Größenobjekt verschieben",
          exact: true,
        });
        await obj.press("ArrowRight");
        assert.ok((await obj.getAttribute("style")).includes("10px"));
      }
      await capture(t.page, mode, width);
      await t.page.close();
    }
  for (const mode of modes) {
    const width = mode === "budget" || mode === "color" ? 1440 : 390;
    const t = await open(mode + "-reveal", width);
    await t.page.locator(".round-player-results").waitFor();
    if (mode === "budget") {
      await t.page
        .getByRole("heading", { name: "Hat das Budget gereicht?", exact: true })
        .waitFor({ timeout: 16000 });
      assert.equal(await t.page.locator(".round-player-result").count(), 12);
      assert.ok(
        (await t.page.locator(".basket-tally").first().innerText()).includes(
          "€",
        ),
      );
    }
    assert.ok(
      !(await t.page.locator(".round-cinema").innerText()).includes("NaN"),
    );
    await capture(t.page, mode + "-reveal", width);
    await t.page.close();
  }
  const saved = await open("budget", 390, (r) => {
    r.game.mine.submitted = true;
    r.game.mine.answer = [r.game.items[0].id];
    r.game.submitted[r.players[0].id] = true;
  });
  await saved.page.locator(".commit-seal").waitFor();
  assert.equal(
    await saved.page
      .locator('.product-grid button[aria-pressed="true"]')
      .count(),
    1,
  );
  assert.equal(
    await saved.page.locator(".basket-checkout button").isEnabled(),
    false,
  );
  await saved.page.close();
  const resumed = await open("budget-reveal", 390);
  resumed.r.game.revealStartedAt = Date.now() - 8800;
  await resumed.page.reload();
  await resumed.page.locator(".price-count").waitFor();
  assert.ok(
    Number.parseInt(
      await resumed.page.locator(".price-count>span").innerText(),
      10,
    ) >= 8,
    "Price reveal must resume from server time after refresh",
  );
  await resumed.page.close();
  assert.deepEqual(errors, []);
  console.log(
    `PASS: ${modes.length} mode guides, live crew and results; desktop/mobile interactions, saved basket and server-timed reveal after reload; no browser errors or overflow.`,
  );
} finally {
  await browser.close();
}
