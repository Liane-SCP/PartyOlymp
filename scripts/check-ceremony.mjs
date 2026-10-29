import fs from "node:fs";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({entryPoints:["tests/browser-game-engine.ts"],outfile:"outputs/ceremony-engine.mjs",bundle:true,platform:"node",format:"esm"});
const {match}=await import("../outputs/ceremony-engine.mjs");
const browser=await chromium.launch({headless:true,args:["--use-angle=swiftshader","--enable-webgl","--ignore-gpu-blocklist","--enable-unsafe-swiftshader"]});
const errors=[];fs.mkdirSync("outputs/qa",{recursive:true});
try {
  for(const scenario of [
    {name:"desktop",width:1440,count:3},
    {name:"mobile",width:390,count:2},
    {name:"shared",width:1440,count:12,reduced:true,tied:true},
    {name:"fallback",width:390,count:3,fallback:true},
  ]) {
    const m=match("colossus",scenario.count);m.room.phase="podium";
    m.room.players.forEach((p,i)=>{p.points=scenario.tied?300:600-i*150;p.wins=scenario.tied?i:3-i;p.seconds=i%3;
      p.look={shape:i%10,color:i%12,accessory:i%8};p.name=i===0?"Nova":i===1?"Luna":`Crew ${i+1}`;});
    const page=await browser.newPage({viewport:{width:scenario.width,height:scenario.width<600?844:1000}});
    page.on("pageerror",e=>errors.push(e.message));
    await page.routeWebSocket("**/api/live",ws=>ws.close());
    await page.addInitScript(({id,reduced,fallback})=>{
      localStorage.setItem("olymp.session",JSON.stringify({code:"QA1234",playerId:id,token:"fixture"}));
      localStorage.setItem("olymp.settings",JSON.stringify({muted:true,motion:!!reduced,intense:true}));
      if(fallback){const original=HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext=function(name,...args){return String(name).includes("webgl")?null:original.call(this,name,...args);};}
    },{id:m.first,reduced:scenario.reduced,fallback:scenario.fallback});
    await page.route("**/api/room",route=>route.fulfill({json:m.view()}));
    await page.goto("http://127.0.0.1:5173");
    await page.locator(".victory-ceremony").waitFor();
    if(scenario.fallback) {
      await page.getByText("Der Applaus gehört euch.").waitFor();
      assert.equal(await page.locator(".ceremony-place.is-revealed").count(),3);
    } else {
      await page.locator(".ceremony-viewport canvas").waitFor();
      if(!scenario.reduced) {
        await page.waitForFunction(()=>Number(document.querySelector(".ceremony-viewport canvas")?.dataset.ceremonyTime)>2.1);
        const arrivalCamera=await page.locator(".ceremony-viewport canvas").getAttribute("data-camera-position");
        await page.locator(".victory-ceremony").screenshot({path:`outputs/qa/ceremony-${scenario.name}-arrival.png`});
        if(scenario.name==="desktop") {
          await page.waitForFunction(()=>Number(document.querySelector(".ceremony-viewport canvas")?.dataset.ceremonyTime)>9.1);
          assert.notEqual(await page.locator(".ceremony-viewport canvas").getAttribute("data-camera-position"),arrivalCamera);
          assert.equal(await page.locator(".ceremony-viewport canvas").getAttribute("data-fireworks"),"true");
          await page.locator(".victory-ceremony").screenshot({path:"outputs/qa/ceremony-fireworks.png"});
        }
        if(scenario.name!=="desktop")await page.getByRole("button",{name:"Zum Siegerauftritt"}).click();
      }
      await page.locator(".victory-ceremony.is-crowned").waitFor();
      await page.waitForTimeout(400);
      const expected=scenario.tied?1:scenario.count===2?2:3;
      assert.equal(await page.locator(".ceremony-place.is-revealed").count(),expected);
      if(scenario.tied) {
        assert.equal(await page.locator(".ceremony-place.medal-1").count(),1);
        assert.equal(await page.getByRole("combobox",{name:"Teilnehmer im Finale"}).locator("option").count(),12);
        assert.equal(await page.getByRole("button",{name:"Noch einmal feiern"}).count(),0);
      }
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.locator(".victory-ceremony").screenshot({path:`outputs/qa/ceremony-${scenario.name}.png`});
    if(scenario.name==="desktop") {
      await page.getByRole("button",{name:"Noch einmal feiern"}).click();
      await page.waitForFunction(()=>Number(document.querySelector(".ceremony-viewport canvas")?.dataset.ceremonyTime)<1);
      assert.equal(await page.locator(".ceremony-place.is-revealed").count(),0);
    }
    await page.close();
  }
  assert.deepEqual(errors,[]);console.log("Ceremony desktop/mobile, replay, shared winners, reduced motion and WebGL fallback passed");
} finally {await browser.close();}
