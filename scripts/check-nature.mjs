import fs from "node:fs";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {chromium} from "../../.tools/qa/node_modules/playwright/index.mjs";
import * as T from "three";
await build({entryPoints:["tests/journey-browser-engine.ts"],outfile:"outputs/nature-engine.mjs",bundle:true,platform:"node",format:"esm"});
const {fixture}=await import("../outputs/nature-engine.mjs");
const browser=await chromium.launch({headless:true,args:["--use-angle=swiftshader","--enable-webgl","--ignore-gpu-blocklist","--enable-unsafe-swiftshader"]}),errors=[];
fs.mkdirSync("outputs/qa",{recursive:true});
try{
  for(const scenario of[{name:"desktop",width:1440,count:3},{name:"mobile",width:390,count:2},{name:"crew",width:1440,count:12},{name:"reduced",width:390,count:3,reduced:true}]){
    const m=fixture(scenario.count);m.nature();
    const page=await browser.newPage({viewport:{width:scenario.width,height:1100},hasTouch:scenario.name==="mobile",reducedMotion:scenario.reduced?"reduce":"no-preference"});page.on("pageerror",e=>errors.push(e.message));
    await page.routeWebSocket("**/api/live",ws=>ws.close());
    await page.addInitScript(id=>{localStorage.setItem("olymp.session",JSON.stringify({code:"QA1234",playerId:id,token:"fixture"}));localStorage.setItem("olymp.settings",JSON.stringify({muted:true,intense:true}));},m.first);
    await page.route("**/api/room",route=>{const body=route.request().postDataJSON();if(body.type==="action")m.act(body.action);return route.fulfill({json:m.view()});});
    await page.goto("http://127.0.0.1:5173");await page.locator(".journey-ready").waitFor();
    await page.waitForFunction(count=>Number(document.querySelector(".journey-canvas canvas")?.dataset.readyAvatars)===count,scenario.count);
    assert.equal(await page.locator(".journey-canvas canvas").getAttribute("data-avatar-style"),"boss-sprite");
    await page.locator(".journey-atlas").screenshot({path:`outputs/qa/nature-${scenario.name}.png`});
    await page.getByRole("button",{name:"Figur links bewegen",exact:true}).click();
    await page.waitForFunction(pid=>JSON.parse(document.querySelector(".journey-canvas canvas")?.dataset.crewPositions??"[]").some(p=>p.id===pid&&p.walking),m.first);
    await page.locator(".journey-atlas").scrollIntoViewIfNeeded();await page.waitForTimeout(350);
    const canvas=page.locator(".journey-canvas canvas"),rect=await canvas.boundingBox(),size=Number(await canvas.getAttribute("data-view-size")),target=(await canvas.getAttribute("data-camera-target")).split(",").map(Number),aspect=rect.width/rect.height;
    const camera=new T.OrthographicCamera(-size*aspect/2,size*aspect/2,size/2,-size/2,0.1,1400);camera.position.fromArray((await canvas.getAttribute('data-camera-position')).split(',').map(Number));camera.lookAt(...target);camera.updateMatrixWorld();
    const node=m.layout()[0],crewPositions=JSON.parse(await canvas.getAttribute('data-crew-positions')),walkHeight=JSON.parse(await canvas.getAttribute('data-plaza')).walkHeight;
    const half=rect.height/size*.6+7,faces=crewPositions.map(actor=>{const p=new T.Vector3(...actor.position).add(new T.Vector3(0,.62,0)).project(camera);return {x:rect.x+(p.x*.5+.5)*rect.width,y:rect.y+(-p.y*.5+.5)*rect.height};});let targetPoint=null;
    for(const radius of[.5,.62,.75])for(let slot=0;slot<24&&!targetPoint;slot++){const angle=slot*Math.PI/12,p=new T.Vector3(node.position[0]+Math.cos(angle)*node.radius*radius,node.position[1]+walkHeight+.05,node.position[2]+Math.sin(angle)*node.radius*radius).project(camera),point={x:rect.x+(p.x*.5+.5)*rect.width,y:rect.y+(-p.y*.5+.5)*rect.height};if(faces.some(face=>Math.abs(face.x-point.x)<half&&Math.abs(face.y-point.y)<half))continue;if(await page.evaluate(point=>document.elementFromPoint(point.x,point.y)===document.querySelector('.journey-canvas canvas'),point))targetPoint=point;}
    assert.ok(targetPoint,'No native floor point clear of crew figures and HUD');const {x:px,y:py}=targetPoint;
    const previous=m.room.journey.moves[m.first].at;
    if(scenario.name==="mobile")await page.touchscreen.tap(px,py);else await page.mouse.click(px,py);
    await page.waitForFunction(()=>document.querySelector(".atlas-feedback")?.textContent?.includes("läuft zum Ziel"));
    assert.ok(m.room.journey.moves[m.first].at>previous,"Click/tap on the real terrain sends a new authoritative movement");
    await page.getByRole("button",{name:"Karten-Emote: Jaaaa!",exact:true}).click();
    await page.locator(`.atlas-avatar-label[data-player="${m.first}"] .atlas-reaction`).waitFor();
    await page.locator(".journey-atlas").screenshot({path:`outputs/qa/nature-${scenario.name}-emote.png`});
    await page.getByRole("button",{name:"Alle Inseln anzeigen",exact:true}).click();await page.waitForTimeout(900);
    await page.locator(".journey-atlas").screenshot({path:`outputs/qa/nature-${scenario.name}-overview.png`});
    if(scenario.name==="desktop")for(const id of["colossus","kraken","dragon"]){const index=m.room.selection.findIndex(s=>s.id===id);await page.locator(".journey-route > button").nth(index).click();await page.waitForTimeout(700);await page.locator(".journey-atlas").screenshot({path:`outputs/qa/nature-${id}.png`});}
    m.travel();await page.waitForFunction(()=>document.querySelector(".journey-canvas canvas")?.dataset.travelling==="true");
    const before=await page.locator(".journey-canvas canvas").getAttribute("data-crew-positions");await page.waitForTimeout(850);
    const after=await page.locator(".journey-canvas canvas").getAttribute("data-crew-positions");if(!scenario.reduced)assert.notEqual(after,before);
    await page.locator(".journey-atlas").screenshot({path:`outputs/qa/nature-${scenario.name}-travel.png`});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.close();
    console.log(`Natural atlas ${scenario.name}: terrain, movable crew, emote and inter-island travel passed`);
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
