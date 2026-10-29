import assert from "node:assert/strict";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
const base = process.env.QA_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true }),
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
let state;
page.on("pageerror", (e) => errors.push(e.message));
page.on("websocket", (ws) =>
  ws.on("framereceived", (e) => {
    try {
      const d = JSON.parse(e.payload);
      if (d.room) state = d.room;
      if (d.type === "error") errors.push(d.error);
    } catch {}
  }),
);
const until = async (fn, ms = 30000) => {
  const t = Date.now();
  while (!fn()) {
    if (Date.now() - t > ms) throw Error("timeout");
    await new Promise((r) => setTimeout(r, 30));
  }
};
const api = async (b) => {
  const r = await fetch(base + "/api/room", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(b),
  });
  const d = await r.json();
  assert.ok(r.ok, d.error);
  return d;
};
try {
  await page.goto(base);
  await page.waitForFunction(
    () => localStorage.getItem("olymp.settings") !== null,
  );
  await page
    .getByRole("button", { name: "Olympiade erstellen", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Dein Name")
    .fill("Navigation Check");
  await page.getByRole("button", { name: "Kreis", exact: true }).click();
  await page.getByRole("button", { name: "Cap", exact: true }).click();
  await page
    .getByRole("button", { name: "Charakterfarbe 3", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Olympiade erstellen", exact: true })
    .click();
  await page.getByRole("heading", { name: "Die Crew sammelt sich." }).waitFor();
  const host = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("olymp.session")),
  );
  await until(() => state?.players);
  assert.deepEqual(state.players.find((p) => p.id === host.playerId).look, {
    shape: 3,
    accessory: 4,
    color: 2,
  });
  const j = await api({
      type: "join",
      code: host.code,
      name: "Gast",
      avatar: 1,
    }),
    guest = { code: host.code, playerId: j.playerId, token: j.token };
  const action = (s, a) =>
    api({ type: "action", ...s, requestId: crypto.randomUUID(), action: a });
  await action(host, {
    type: "configure",
    selection: [{ id: "wiki", rounds: 1, seconds: 90 }],
  });
  await action(host, { type: "ready", ready: true });
  await action(guest, { type: "ready", ready: true });
  await action(host, { type: "start" });
  await action(host, { type: "ready", ready: true });
  await action(guest, { type: "ready", ready: true });
  await page
    .locator(".wiki-full a[data-wiki-title]")
    .first()
    .waitFor({ timeout: 45000 });
  const link = page.locator(".wiki-full p a[data-wiki-title]").first();
  const title = await link.getAttribute("data-wiki-title");
  assert.ok(title);
  await link.click();
  await until(() => state?.game?.path?.length === 2, 35000);
  assert.equal(state.game.path.length, 2);
  assert.equal(new URL(page.url()).hash, "");
  assert.ok(state.game.article?.live);
  await until(() => state.game.article.title === state.game.path.at(-1));
  await action(guest, {
    type: "game",
    phase: state.phaseKey,
    action: { type: "navigate", title },
  });
  await until(() => state.game.racers?.[guest.playerId]?.clicks === 1);
  assert.equal(
    state.game.racers[guest.playerId].article,
    state.game.path.at(-1),
  );
  const guestStatus = page
    .locator(".live-player")
    .filter({ has: page.getByText("Gast", { exact: true }) });
  assert.ok((await guestStatus.innerText()).includes("1 Klick"));
  await page.screenshot({
    path: "outputs/qa/wiki-inline-live.png",
    fullPage: false,
  });
  await page.reload();
  await page.locator(".wiki-browser-bar strong").waitFor();
  assert.ok(
    (await page.locator(".wiki-browser-bar strong").innerText()).length,
  );
  assert.deepEqual(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("olymp.identity")).look,
    ),
    { shape: 3, accessory: 4, color: 2 },
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real live Wikipedia links, guest article movement visible through WebSocket, character persistence through refresh.",
  );
} finally {
  await browser.close();
}
