import fs from "node:fs";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({
  entryPoints: ["tests/view-fixtures.ts"],
  outfile: "outputs/view-fixtures.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
assert.equal(
  spawnSync(process.execPath, ["outputs/view-fixtures.mjs"]).status,
  0,
);
const fixtures = JSON.parse(
  fs.readFileSync("outputs/qa/view-fixtures.json", "utf8"),
);
const browser = await chromium.launch({ headless: true }),
  errors = [],
  metrics = [];
try {
  for (const name of process.argv.includes("--views-only")
    ? []
    : ["amazon-products", "pixel-photos", "world-panoramas"]) {
    const item = JSON.parse(
      fs.readFileSync(`lib/game/data/${name}.json`, "utf8"),
    ).at(-1);
    const response = await fetch(`http://127.0.0.1:5173${item.image}`);
    assert.equal(response.status, 200, `${name}: missing bundled image`);
    assert.ok(
      response.headers.get("content-type")?.startsWith("image/"),
      `${name}: wrong asset response`,
    );
    await response.arrayBuffer();
  }
  for (const mode of [
    "size",
    "spectrum",
    "categories",
    "categories-vote",
    "categories-reveal",
    "chain",
    "chain-review",
    "chain-challenge",
    "chain-reveal",
  ]) {
    const f = structuredClone(fixtures.find((x) => x.name === mode)),
      r = f.response.room;
    r.game.deadline = Date.now() + 60000;
    if (mode === "size")
      r.game.item = {
        name: "Ponte Vasco da Gama",
        measure: "Länge",
        kind: "bridge",
      };
    else if (mode === "spectrum")
      r.game.axis = {
        id: "qa",
        left: "Leicht zu lernen",
        right: "Schwer zu lernen",
        context: "Handwerkliche Tätigkeiten",
      };
    const page = await browser.newPage({
      viewport: { width: 1366, height: 768 },
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
    }, f.response.playerId);
    const actions = [];
    await page.route("**/api/room", (route) => {
      const body = route.request().postDataJSON();
      if (body.action?.type === "game") actions.push(body.action.action);
      r.serverTime = Date.now();
      return route.fulfill({ json: f.response });
    });
    await page.goto("http://127.0.0.1:5173");
    await page
      .locator(mode.endsWith("-reveal") ? ".round-reveal" : ".play-surface")
      .waitFor();
    if (mode === "size")
      assert.ok(
        await page
          .locator(".size-silhouette title")
          .allTextContents()
          .then((x) => x.some((s) => s.includes("Symbolbild"))),
      );
    else if (mode === "spectrum")
      await page
        .getByText("Handwerkliche Tätigkeiten", { exact: true })
        .waitFor();
    else if (mode === "categories") {
      await page
        .getByRole("textbox", { name: "Land", exact: true })
        .fill("Australien");
      await page.getByRole("button", { name: "Antworten festlegen" }).click();
      await page.waitForTimeout(200);
      assert.ok(
        actions.some(
          (a) => a.type === "answer" && a.answers[0] === "Australien",
        ),
      );
    } else if (mode === "categories-vote") {
      for (const b of await page
        .getByRole("button", { name: "✓ Gültig", exact: true })
        .all())
        await b.click();
      await page
        .getByRole("button", { name: "Stimmen abgeben", exact: true })
        .click();
      await page.waitForTimeout(200);
      assert.ok(
        actions.some(
          (a) => a.type === "vote" && Object.keys(a.ballot).length === 12,
        ),
      );
    } else if (mode === "categories-reveal")
      assert.equal(await page.locator(".words-results tbody tr").count(), 12);
    else if (mode === "chain") {
      await page.getByRole("textbox", { name: "Dein Begriff" }).fill("Opel");
      await page.getByRole("button", { name: "Begriff nennen" }).click();
      await page.waitForTimeout(150);
      assert.ok(
        actions.some((a) => a.type === "answer" && a.answer === "Opel"),
      );
    } else if (mode === "chain-review") {
      await page.getByRole("button", { name: "⚑ Anfechten" }).click();
      await page.waitForTimeout(150);
      assert.ok(actions.some((a) => a.type === "challenge"));
    } else if (mode === "chain-challenge") {
      await page.getByRole("button", { name: "✓ Gültig", exact: true }).click();
      await page.waitForTimeout(150);
      assert.ok(actions.some((a) => a.type === "vote" && a.valid === true));
    }
    const metric = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      scroll:
        document.querySelector(".room-shell").scrollHeight -
        document.querySelector(".room-shell").clientHeight,
    }));
    assert.equal(metric.overflow, false);
    metrics.push({ mode, ...metric });
    await page.screenshot({
      path: `outputs/qa/content-${mode}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(metrics));
} finally {
  await browser.close();
}
