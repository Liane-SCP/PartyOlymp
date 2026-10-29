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
const browser = await chromium.launch({ headless: true }),
  errors = [];
async function open(name, width, edit = () => {}) {
  const f = structuredClone(fixtures.find((x) => x.name === name)),
    r = f.response.room,
    actions = [];
  r.game.deadline = Date.now() + 60000;
  r.game.startedAt = Date.now() - 30000;
  edit(r);
  const page = await browser.newPage({ viewport: { width, height: 950 } });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.routeWebSocket("**/api/live", (ws) => ws.close());
  await page.addInitScript((id) => {
    localStorage.setItem(
      "olymp.session",
      JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" }),
    );
    localStorage.setItem("olymp.settings", JSON.stringify({ muted: true }));
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
async function shot(page, name) {
  await page.waitForTimeout(700);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.screenshot({ path: `outputs/qa/${name}.png`, fullPage: true });
}
try {
  for (const width of [1440, 390]) {
    let t = await open("picture", width);
    await t.page.waitForFunction(() => {
      const c = document.querySelector(".pixel-canvas");
      if (!c) return false;
      return c.getContext("2d").getImageData(240, 220, 1, 1).data[3] > 0;
    });
    assert.equal(await t.page.locator(".pixel-photo-stage > p").count(), 0);
    await shot(t.page, `photo-pixel-${width}`);
    await t.page.close();
    t = await open("picture-reveal", width);
    await t.page.locator(".revealed-photo img").evaluate((img) => img.decode());
    assert.ok(
      (await t.page.locator(".revealed-photo figcaption").innerText()).includes(
        "Foto:",
      ),
    );
    await shot(t.page, `photo-reveal-${width}`);
    await t.page.close();
    t = await open("cards", width, (r) => {
      const [a, b] = r.players;
      r.game.mine.hand = [
        { id: "test-wild", color: 4, value: 14 },
        { id: "keep", color: 1, value: 3 },
      ];
      const m = {
        id: "new-move",
        at: Date.now(),
        player: b.id,
        target: a.id,
        kind: "play",
        card: { id: "played", color: 4, value: 14 },
        color: 1,
        count: 4,
        next: a.id,
      };
      r.game.moves = [m];
      r.game.lastMove = m;
      r.game.top = m.card;
      r.game.color = 1;
    });
    await t.page.locator(".card-action-theatre.is-replaying").waitFor();
    assert.equal(await t.page.locator(".draw-burst").innerText(), "+4");
    await t.page.locator(".card-action-history summary").click();
    assert.match(
      await t.page.locator(".card-action-history ol").innerText(),
      /Pixel.*4/,
    );
    assert.equal(await t.page.locator(".discard-wish").count(), 1);
    await t.page
      .locator(".own-hand")
      .getByRole("button", { name: "Joker +4", exact: true })
      .click();
    const blue = t.page.getByRole("button", {
      name: "Jokerfarbe Blau",
      exact: true,
    });
    await blue.click();
    assert.equal(t.actions.length, 0);
    assert.equal(await blue.getAttribute("aria-pressed"), "true");
    await shot(t.page, `wish-confirm-${width}`);
    await t.page
      .getByRole("button", { name: "Diese Farbe bestätigen" })
      .click();
    assert.equal(t.actions.at(-1).action.color, 1);
    await t.page.locator(".card-action-theatre").scrollIntoViewIfNeeded();
    await shot(t.page, `card-action-${width}`);
    await t.page.close();
  }
  const t = await open("wiki-reveal", 390, (r) => {
    r.game.reveal.players[0].arrival = 0;
    r.game.reveal.players[0].score = 1000;
  });
  await t.page.locator(".round-player-result").first().waitFor();
  assert.match(
    await t.page.locator(".round-player-result").first().innerText(),
    /0.0 s/,
  );
  assert.match(
    await t.page.locator(".round-player-result").first().innerText(),
    /1000 Spielpunkte/,
  );
  await t.page.close();
  const s = await open("size", 390, (r) => {
    r.game.item = {
      name: "Nintendo Switch 2",
      measure: "Breite mit angesteckten Joy-Con 2",
    };
  });
  await s.page.locator(".size-silhouette").first().waitFor();
  await shot(s.page, "size-switch");
  await s.page.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: local photo canvas and attribution, card-action replay and log, explicit visual joker confirmation, zero-second Wiki finish, extra size art; desktop/mobile, no overflow or browser errors.",
  );
} finally {
  await browser.close();
}
