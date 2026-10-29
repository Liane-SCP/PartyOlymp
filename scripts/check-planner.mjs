import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const api = async (body) => {
    const r = await page.request.post("http://127.0.0.1:5173/api/room", {
      data: body,
    });
    const data = await r.json();
    assert.ok(r.ok(), JSON.stringify(data));
    return data;
  };
  const host = await api({ type: "create", name: "Planer Test", avatar: 0 });
  const guest = await api({
    type: "join",
    code: host.room.code,
    name: "Gast Test",
    avatar: 1,
  });
  const session = {
    code: host.room.code,
    playerId: host.playerId,
    token: host.token,
  };
  await page.addInitScript((s) => {
    localStorage.setItem("olymp.session", JSON.stringify(s));
    localStorage.setItem("olymp.settings", JSON.stringify({ muted: true }));
  }, session);
  await page.goto("http://127.0.0.1:5173");
  await page.locator(".olympiad-planner").waitFor();
  const help = page.getByRole("button", {
    name: "Der Würfelkoloss: Spielinfo",
    exact: true,
  });
  await help.hover();
  await page.getByRole("tooltip").waitFor();
  assert.match(await page.getByRole("tooltip").innerText(), /Alle würfeln/);
  await help.focus();
  await help.press("Escape");
  assert.equal(await page.getByRole("tooltip").count(), 0);
  await help.click();
  await page.getByRole("tooltip").waitFor();
  await page.getByLabel("Spiele suchen").focus();
  assert.equal(await page.getByRole("tooltip").count(), 0);
  await page.screenshot({
    path: "outputs/qa/planner-desktop.png",
    fullPage: true,
  });
  const before = await page.locator(".planner-stop").count();
  await page.getByLabel("Spiele suchen").fill("Codeknacker");
  assert.equal(await page.locator(".planner-game").count(), 1);
  await page
    .getByRole("button", { name: "Codeknacker hinzufügen", exact: true })
    .click();
  await page.waitForFunction(
    (n) => document.querySelectorAll(".planner-stop").length === n,
    before + 1,
  );
  await page
    .getByRole("button", {
      name: `Mehr Runden Spiel ${before + 1}`,
      exact: true,
    })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Spielplan aktualisiert." })
    .waitFor();
  await page
    .locator(".planner-stop")
    .last()
    .getByRole("button", { name: /Ohne Timer/ })
    .click();
  assert.ok(
    await page
      .getByText("Alle lösen oder geben auf. Es gibt keinen Zugtimer.")
      .isVisible(),
  );
  await page
    .getByRole("button", { name: `Spiel ${before + 1} nach oben`, exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Reihenfolge geändert." })
    .waitFor();
  assert.match(
    await page
      .locator(".planner-stop")
      .nth(before - 1)
      .innerText(),
    /Codeknacker/,
  );
  await page.getByRole("button", { name: "Rückgängig", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Letzte Änderung rückgängig gemacht." })
    .waitFor();
  assert.match(
    await page.locator(".planner-stop").last().innerText(),
    /Codeknacker/,
  );
  await page.getByRole("button", { name: "Kurze Runde", exact: true }).click();
  assert.ok(await page.getByLabel("Vorlagenvorschau").isVisible());
  assert.equal(await page.locator(".planner-stop").count(), before + 1);
  await page
    .getByRole("button", { name: "Diesen Spielplan nehmen", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Vorlage übernommen." })
    .waitFor();
  await page
    .locator(".planner-stop")
    .first()
    .getByRole("button", { name: /Details/ })
    .click();
  await page.getByLabel("Zeit für Spiel 1").selectOption("60");
  await page
    .getByRole("status")
    .filter({ hasText: "Spielplan aktualisiert." })
    .waitFor();
  await page.getByRole("button", { name: "Suche leeren", exact: true }).click();
  await page.getByRole("button", { name: "Bosse", exact: true }).click();
  assert.equal(await page.locator(".planner-game").count(), 3);
  await page.getByLabel("Spiele suchen").fill("xyzunfindbar");
  assert.ok(await page.getByText("Kein passendes Spiel gefunden.").isVisible());
  await page
    .getByRole("button", { name: "Alle Spiele anzeigen", exact: true })
    .click();
  assert.equal(await page.locator(".planner-game").count(), 21);
  await page.reload();
  await page.locator(".olympiad-planner").waitFor();
  assert.equal(await page.locator(".planner-stop").count(), 3);
  await page
    .locator(".planner-stop")
    .first()
    .getByRole("button", { name: /Details/ })
    .click();
  assert.equal(await page.getByLabel("Zeit für Spiel 1").inputValue(), "60");
  await page.screenshot({
    path: "outputs/qa/planner-desktop.png",
    fullPage: true,
  });
  for (const [width, height] of [
    [1366, 768],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    if (width >= 1100) {
      const bounds = await page.evaluate(() => ({
        heading: document
          .querySelector(".planner-toolbar")
          .getBoundingClientRect().top,
        launch: document.querySelector(".lobby-launch").getBoundingClientRect()
          .bottom,
        dock: document.querySelector(".emote-dock").getBoundingClientRect().top,
        gamesHeight: document
          .querySelector(".planner-game-grid")
          .getBoundingClientRect().height,
      }));
      assert.ok(bounds.heading >= 50, JSON.stringify(bounds));
      assert.ok(bounds.launch <= bounds.dock, JSON.stringify(bounds));
      assert.ok(bounds.gamesHeight >= 380, JSON.stringify(bounds));
      console.log("Desktop space:", JSON.stringify(bounds));
    }
    await page.screenshot({
      path: `outputs/qa/planner-${width}.png`,
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  const visitor = await browser.newPage({
    viewport: { width: 1366, height: 768 },
  });
  await visitor.addInitScript(
    (s) => localStorage.setItem("olymp.session", JSON.stringify(s)),
    { code: host.room.code, playerId: guest.playerId, token: guest.token },
  );
  await visitor.goto("http://127.0.0.1:5173");
  await visitor.locator(".olympiad-planner").waitFor();
  assert.equal(await visitor.locator(".planner-add").count(), 0);
  assert.equal(await visitor.locator(".planner-presets").count(), 0);
  assert.ok(
    await visitor
      .getByRole("button", { name: "Mehr Runden Spiel 1", exact: true })
      .isDisabled(),
  );
  await visitor
    .getByRole("button", { name: "Ich bin bereit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ich bin bereit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Olympiade starten", exact: true })
    .waitFor();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent.includes("Olympiade starten") && !b.disabled,
    ),
  );
  await page
    .getByRole("button", { name: "Olympiade starten", exact: true })
    .click();
  await page.locator(".discipline-intro").waitFor();
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    "outputs/qa/planner-results.json",
    JSON.stringify({
      passed: true,
      checks: [
        "search",
        "categories",
        "empty state",
        "add",
        "rounds",
        "no timer explanation",
        "reorder",
        "undo",
        "preset preview",
        "replace",
        "timer",
        "persistence",
        "responsive",
        "guest permissions",
        "ready and start",
      ],
      errors,
    }),
  );
  console.log(
    "Planner interactions, persistence, guest permissions and start passed.",
  );
} finally {
  await browser.close();
}
