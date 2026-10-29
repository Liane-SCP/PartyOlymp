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
async function pageFor(name, width = 1440, change = () => {}) {
  const f = structuredClone(fixtures.find((f) => f.name === name));
  if (!f) throw Error(name);
  change(f.response.room);
  const room = f.response.room;
  room.players.forEach(
    (p, i) => (p.look = { shape: i % 6, accessory: i % 8, color: i % 12 }),
  );
  room.game.deadline = Date.now() + 120000;
  const page = await browser.newPage({
    viewport: { width, height: width === 390 ? 844 : 1000 },
  });
  const actions = [];
  page.on("pageerror", (e) => errors.push(e.message));
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
    room.serverTime = Date.now();
    return route.fulfill({ json: f.response });
  });
  await page.goto("http://127.0.0.1:5173");
  await page.locator(".room-shell").waitFor();
  return { page, actions, room };
}
async function shot(page, name, width) {
  await page.screenshot({
    path: `outputs/qa/gameplay-${name}-${width}.png`,
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    `${name} overflow`,
  );
}
try {
  for (const width of [1440, 390]) {
    let t = await pageFor("cards", width, (r) => {
      r.game.mine.hand = [
        { id: "test-joker", color: 4, value: 13 },
        { id: "test-number", color: r.game.color, value: 5 },
      ];
    });
    await t.page
      .locator(".own-hand")
      .getByRole("button", { name: "Joker", exact: true })
      .click();
    assert.equal(t.actions.length, 0);
    await t.page.getByRole("dialog", { name: "Jokerfarbe wählen" }).waitFor();
    await shot(t.page, "joker", width);
    await t.page
      .getByRole("button", { name: "Jokerfarbe Blau", exact: true })
      .click();
    assert.equal(t.actions.length, 0);
    assert.equal(
      await t.page
        .getByRole("button", { name: "Jokerfarbe Blau", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await t.page
      .getByRole("button", { name: "Diese Farbe bestätigen" })
      .click();
    assert.equal(t.actions.at(-1).action.color, 1);
    assert.equal(t.actions.at(-1).action.card, "test-joker");
    await t.page.close();
    t = await pageFor("blackjack", width);
    await t.page.locator(".hand-total").waitFor();
    assert.ok(await t.page.locator(".hand-total strong").innerText());
    await shot(t.page, "club21", width);
    await t.page.close();
    t = await pageFor("size", width, (r) => {
      r.game.item = { name: "Golden Gate Bridge", measure: "Hauptspannweite" };
      r.game.reference = {
        name: "Eiffelturm · Höhe",
        icon: "Eiffelturm",
        cm: 33000,
      };
    });
    await t.page.locator(".size-object").waitFor();
    assert.equal(
      await t.page.locator(".size-object svg").getAttribute("aria-label"),
      "Golden Gate Bridge: Hauptspannweite",
    );
    assert.ok(
      (await t.page.locator(".size-reference").innerText()).includes("330 m"),
    );
    await shot(t.page, "size-bridge", width);
    await t.page.close();
  }
  let t = await pageFor("wiki", 390, (r) => {
    r.game.article = {
      title: "Erde",
      html: '<p>Die <a href="#article" data-wiki-title="Sonne"><span>Sonne</span></a> scheint.</p>',
      links: ["Sonne"],
      live: true,
    };
  });
  await t.page
    .locator(".wiki-full")
    .getByRole("link", { name: "Sonne", exact: true })
    .click();
  assert.equal(t.actions.at(-1).action.title, "Sonne");
  assert.equal(new URL(t.page.url()).hash, "");
  await t.page.getByRole("status").filter({ hasText: "Weiter zu" }).waitFor();
  await t.page.close();
  t = await pageFor("podium-12", 390, (r) => {
    r.phase = "standings";
    r.deadline = Date.now() + 24000;
    r.standings = r.standings.slice(0, 2);
    r.participantIds = r.standings.map((p) => p.id);
    r.previousStandings = r.standings.map((p, i) => ({
      id: p.id,
      rank: i + 1,
      points: i ? 50 : 100,
      wins: 0,
      seconds: 0,
    }));
    r.standings[0].points = 100;
    r.standings[0].lastPoints = 0;
    r.standings[0].previousRank = 1;
    r.standings[0].rank = 2;
    r.standings[1].points = 150;
    r.standings[1].lastPoints = 100;
    r.standings[1].previousRank = 2;
    r.standings[1].rank = 1;
    r.standings.reverse();
  });
  await t.page.locator(".ranking-track").waitFor();
  const id = t.room.standings[0].name;
  await t.page.waitForTimeout(8200);
  assert.ok((await t.page.locator(".ranking-moment").innerText()).includes(id));
  assert.ok(
    (await t.page.locator(".ranking-moment").innerText()).includes("übernimmt"),
  );
  await shot(t.page, "overtake", 390);
  await t.page.close();
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto("http://127.0.0.1:5173");
  await p.waitForFunction(
    () => localStorage.getItem("olymp.settings") !== null,
  );
  await p
    .getByRole("button", { name: "Olympiade erstellen", exact: true })
    .click();
  await p.getByRole("tab", { name: /Formen/ }).click();
  await p.getByRole("button", { name: "Stern", exact: true }).click();
  await p.getByRole("tab", { name: /Accessoires/ }).click();
  await p.getByRole("button", { name: "Kopfhörer", exact: true }).click();
  await p.getByRole("button", { name: "Körperfarbe 4", exact: true }).click();
  assert.ok(
    (await p.locator(".character-preview").innerText()).includes(
      "Stern · Kopfhörer",
    ),
  );
  await shot(p, "character", 390);
  await p.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: responsive Club21, UNO visual joker choice, bridge/reference art, native inline wiki click, animated overtake, independent character choices.",
  );
} finally {
  await browser.close();
}
