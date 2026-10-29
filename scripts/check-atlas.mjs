import fs from "node:fs";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({ entryPoints: ["tests/journey-browser-engine.ts"], outfile: "outputs/atlas-engine.mjs", bundle: true, platform: "node", format: "esm" });
const { fixture } = await import("../outputs/atlas-engine.mjs");
fs.mkdirSync("outputs/qa", { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
const errors = [];
try {
  for (const scenario of [{ name: "desktop", width: 1440 }, { name: "mobile", width: 390 }, { name: "forty", width: 1440, count: 40 }, { name: "reduced", width: 1440, reduced: true }]) {
    const m = fixture(12); m.atlas(scenario.count);
    const page = await browser.newPage({ viewport: { width: scenario.width, height: 1100 }, reducedMotion: scenario.reduced ? "reduce" : "no-preference" });
    page.on("pageerror", e => errors.push(e.message));
    await page.routeWebSocket("**/api/live", ws => ws.close());
    await page.addInitScript(id => { localStorage.setItem("olymp.session", JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" })); localStorage.setItem("olymp.settings", JSON.stringify({ muted: true, intense: true })); }, m.first);
    await page.route("**/api/room", route => route.fulfill({ json: m.view() }));
    await page.goto("http://127.0.0.1:5173"); await page.locator(".journey-ready").waitFor();
    const canvas = page.locator(".journey-canvas canvas"), atlas = page.locator(".journey-atlas");
    assert.equal(Number(await canvas.getAttribute("data-island-count")), m.room.selection.length);
    const size = await atlas.boundingBox(); assert.ok(size.height >= 610);
    await atlas.screenshot({ path: `outputs/qa/atlas-${scenario.name}-titan.png` });
    if (scenario.name !== "forty") {
      for (const index of scenario.name === "desktop" ? Array.from({length:m.room.selection.length-1},(_,i)=>i+1) : [1,2,9,20]) {
        await page.locator(".journey-route > button").nth(index).click();
        await page.waitForFunction(i => document.querySelector(".journey-canvas canvas")?.dataset.selectedIsland === String(i), index);
        await page.waitForTimeout(scenario.reduced ? 100 : 650);
        if (scenario.name === "desktop") await atlas.screenshot({ path: `outputs/qa/atlas-island-${m.room.selection[index].id}.png` });
      }
    }
    await page.getByRole("button", { name: "Alle Inseln anzeigen", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".journey-atlas")?.classList.contains("atlas-overview"));
    await page.waitForTimeout(1100);
    const beforeZoom = Number(await canvas.getAttribute("data-view-size"));
    await atlas.screenshot({ path: `outputs/qa/atlas-${scenario.name}-overview.png` });
    await page.getByRole("button", { name: "Karte vergrößern", exact: true }).click(); await page.waitForTimeout(800);
    assert.ok(Number(await canvas.getAttribute("data-view-size")) < beforeZoom * 0.94);
    await atlas.scrollIntoViewIfNeeded();
    const beforePan = await canvas.getAttribute("data-camera-target");
    const start = await canvas.evaluate(c => { const r=c.getBoundingClientRect(); for(const y of [0.4,0.5,0.3,0.6])for(const x of [0.45,0.55,0.35,0.65]) { const px=r.x+r.width*x,py=r.y+r.height*y; if(document.elementFromPoint(px,py)===c)return {x:px,y:py}; } return null; });
    assert.ok(start,"A visible, unobstructed map surface is available for dragging");
    await page.mouse.move(start.x,start.y); await page.mouse.down(); await page.mouse.move(start.x - 65,start.y + 28,{steps:10}); await page.mouse.up();
    await page.waitForTimeout(650); assert.notEqual(await canvas.getAttribute("data-camera-target"), beforePan);
    await page.getByRole("button", { name: "Karte im Vollbild öffnen", exact: true }).click();
    await page.getByRole("dialog", { name: "Die große Inselwelt" }).waitFor(); await page.locator(".atlas-fullscreen.journey-ready").waitFor();
    const full = await page.locator(".atlas-fullscreen").boundingBox(); assert.equal(Math.round(full.width), scenario.width); assert.equal(Math.round(full.height), 1100);
    await page.getByRole("button", { name: "Alle Inseln anzeigen", exact: true }).click(); await page.waitForTimeout(900);
    await page.locator(".atlas-fullscreen").screenshot({ path: `outputs/qa/atlas-${scenario.name}-fullscreen.png` });
    if(scenario.name==="mobile") {
      const cdp=await page.context().newCDPSession(page); await cdp.send("Emulation.setTouchEmulationEnabled",{enabled:true,maxTouchPoints:2});
      const beforePinch=Number(await page.locator(".atlas-fullscreen canvas").getAttribute("data-view-size"));
      await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:140,y:450,id:1},{x:210,y:450,id:2}]});
      for(let k=1;k<=6;k++) await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:140-k*6,y:450,id:1},{x:210+k*6,y:450,id:2}]});
      await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]}); await page.waitForTimeout(650);
      assert.ok(Number(await page.locator(".atlas-fullscreen canvas").getAttribute("data-view-size"))<beforePinch*0.8,"Two-finger pinch zooms the actual mobile canvas");
    }
    await page.keyboard.press("Escape"); await page.getByRole("dialog").waitFor({ state: "detached" });
    await page.locator(".journey-ready").waitFor();
    await page.getByRole("button", { name: "Zur Crew springen", exact: true }).click();
    assert.match(await page.locator(".journey-location h3").innerText(), /Zitadelle/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    console.log(`Atlas ${scenario.name}: ${m.room.selection.length} islands, focus, zoom, drag, overview, fullscreen and crew return passed`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
