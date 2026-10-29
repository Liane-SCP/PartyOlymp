import fs from "node:fs";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({entryPoints:["tests/wheel-browser-engine.ts"],outfile:"outputs/wheel-engine.mjs",bundle:true,platform:"node",format:"esm"});
const {modeWheel,match}=await import("../outputs/wheel-engine.mjs");
const browser=await chromium.launch({headless:true});
const errors=[];fs.mkdirSync("outputs/qa",{recursive:true});
async function open(m,width,reduced=false) {
  const page=await browser.newPage({viewport:{width,height:width<600?844:1100},reducedMotion:reduced?"reduce":"no-preference"});
  page.on("pageerror",e=>errors.push(e.message));
  await page.routeWebSocket("**/api/live",ws=>ws.close());
  await page.addInitScript(({id,reduced})=>{
    localStorage.setItem("olymp.session",JSON.stringify({code:"QA1234",playerId:id,token:"fixture"}));
    localStorage.setItem("olymp.settings",JSON.stringify({muted:true,motion:reduced}));
  },{id:m.first,reduced});
  await page.route("**/api/room",async route=>{
    const body=route.request().postDataJSON();
    if(body.action?.type==="game")m.act(m.first,body.action.action);
    await route.fulfill({json:m.view()});
  });
  await page.goto("http://127.0.0.1:5173");return page;
}
try {
  for(const scenario of [{name:"desktop",width:1440,count:40},{name:"mobile",width:390,count:21},{name:"calm",width:390,count:21,reduced:true}]) {
    const m=modeWheel(scenario.count),page=await open(m,scenario.width,scenario.reduced);
    await page.locator(".wheel-show").waitFor();
    await page.locator(".wheel-show").screenshot({path:`outputs/qa/wheel-${scenario.name}-spin.png`});
    await page.locator(".wheel-show.is-settled").waitFor();
    assert.equal(await page.locator(".wheel-result strong").innerText(),m.room.draw.entries[m.room.draw.selected].name);
    if(scenario.reduced)assert.equal(await page.locator(".wheel-show.is-calm").count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.locator(".wheel-show").screenshot({path:`outputs/qa/wheel-${scenario.name}-result.png`});
    await page.close();
  }
  const m=match("chain",3),page=await open(m,390);
  await page.locator(".topic-proposals").waitFor();
  await page.getByLabel("Deine Kategorie").fill("Videospiel-Charaktere");
  await page.getByLabel("Was zählt dazu?").fill("Nur spielbare Figuren.");
  await page.getByRole("button",{name:"Ins Glücksrad werfen"}).click();
  await page.locator(".topic-confirmed").waitFor();
  assert.equal(await page.locator(".topic-proposal-list strong").innerText(),"Videospiel-Charaktere");
  await page.locator(".topic-proposals").screenshot({path:"outputs/qa/wheel-category-proposal.png"});
  for(const id of m.room.participantIds.slice(1))m.act(id,{type:"suggestTopic",round:1,turn:0,name:"Automarken"});
  await page.locator(".wheel-show").waitFor();
  await page.locator(".wheel-show.is-settled").waitFor();
  await page.locator(".wheel-show").screenshot({path:"outputs/qa/wheel-category-result.png"});
  await page.locator(".chain-arena").waitFor();
  assert.equal(await page.locator(".chain-heading h2").innerText(),m.room.game.public.topic.name);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.close();assert.deepEqual(errors,[]);
  console.log("PASS: shared wheels at 40 entries, desktop/mobile, reduced motion, category proposal and transition to the first turn.");
} finally {await browser.close();}
