import fs from "node:fs";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {chromium} from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({entryPoints:["tests/gameshow-browser-engine.ts"],outfile:"outputs/gameshow-engine.mjs",bundle:true,platform:"node",format:"esm"});
const {showFixture}=await import("../outputs/gameshow-engine.mjs");
const browser=await chromium.launch({headless:true});const errors=[];
fs.mkdirSync("outputs/qa",{recursive:true});
try {
  for(const scenario of [
    {name:"preview-mobile",width:390,phase:"rules",count:12},
    {name:"recap-desktop",width:1440,phase:"standings",count:3},
    {name:"recap-mobile",width:390,phase:"standings",count:12,reduced:true},
    {name:"ties",width:390,phase:"paused",count:12,tied:true},
  ]) {
    const m=showFixture(scenario.count,scenario.phase,scenario.tied);
    const page=await browser.newPage({viewport:{width:scenario.width,height:1000},reducedMotion:scenario.reduced?"reduce":"no-preference"});
    page.on("pageerror",e=>errors.push(e.message));
    await page.routeWebSocket("**/api/live",ws=>ws.close());
    await page.addInitScript(({id,reduced})=>{
      localStorage.setItem("olymp.session",JSON.stringify({code:"QA1234",playerId:id,token:"fixture"}));
      localStorage.setItem("olymp.settings",JSON.stringify({muted:true,motion:!!reduced}));
    },{id:m.first,reduced:scenario.reduced});
    await page.route("**/api/room",route=>route.fulfill({json:m.view()}));
    await page.goto("http://127.0.0.1:5173");await page.locator(".gameshow").waitFor();
    if(scenario.phase==="rules") {
      await page.waitForTimeout(800);
      assert.match(await page.locator(".gameshow-comment p").innerText(),/Punkte zum Punktgleichstand/);
      assert.equal(await page.locator(".gameshow-faces .avatar-art").count(),2);
    } else if(scenario.tied) {
      assert.equal(await page.locator(".ranking-rider.show-passing").count(),0);
      assert.equal(await page.locator(".gameshow-lead").count(),0);
      assert.deepEqual(await page.locator(".ranking-place").allTextContents(),Array(scenario.count).fill("01"));
    } else {
      if(!scenario.reduced) {
        await page.locator(".ranking-rider.show-passing").first().waitFor();
        await page.locator(".ranking-show").screenshot({path:"outputs/qa/gameshow-overtake.png"});
      }
      await page.locator(".gameshow-lead").waitFor();
      await page.waitForTimeout(800);
      assert.match(await page.locator(".gameshow-comment h3").innerText(),/Nova/);
      if(!scenario.reduced) {
        await page.locator(".ranking-show.settled").waitFor();
        assert.match(await page.locator(".ranking-moment strong").innerText(),/Nova übernimmt die Führung/);
        assert.match(await page.locator(".ranking-rider.leader.show-passing .ranking-name strong").innerText(),/Nova/);
      }
      await page.locator(".gameshow").screenshot({path:`outputs/qa/gameshow-${scenario.name}-leader.png`});
      // Manual browsing retains the selected card rather than jumping on the next clock tick.
      while(await page.locator(".gameshow-record").count()===0) {
        await page.getByRole("button",{name:"Nächster Show-Moment"}).click();
      }
      assert.match(await page.locator(".gameshow-comment p").innerText(),/denselben Runden/);
      await page.waitForTimeout(1100);assert.equal(await page.locator(".gameshow-record").count(),1);
    }
    if(await page.locator(".gameshow-voice").count()) assert.equal(await page.locator(".gameshow-voice").isDisabled(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.locator(".gameshow").screenshot({path:`outputs/qa/gameshow-${scenario.name}.png`});
    if(scenario.phase!=="rules")await page.locator(".ranking-show").screenshot({path:`outputs/qa/gameshow-${scenario.name}-ranking.png`});
    await page.close();
  }
  assert.deepEqual(errors,[]);console.log("PASS: rivalry preview, leader/overtake animation, persistent record navigation, 12-player mobile layout, ties, reduced motion, mute and safe rendering.");
} finally {await browser.close();}
