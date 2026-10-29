import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/journey-browser-engine.ts'],outfile:'outputs/journey-regions-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/journey-regions-fixture.mjs');
const report=process.env.JOURNEY_REGION_REPORT??'outputs/qa/journey-regions.json',prefix=process.env.JOURNEY_REGION_PREFIX??'journey-regions';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}),results=[],errors=[];
try{
 for(const width of[1440,390]){
  const m=fixture(12);m.atlas();const layout=m.layout();assert.equal(new Set(layout.map(n=>n.region.id)).size,6);
  const p=await browser.newPage({viewport:{width,height:1100},hasTouch:width<600,reducedMotion:'reduce'});
  p.on('pageerror',e=>errors.push(e.message));await p.routeWebSocket('**/api/live',w=>w.close());
  await p.addInitScript(id=>{localStorage.setItem('olymp.session',JSON.stringify({code:'QA1234',playerId:id,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));},m.first);
  await p.route('**/api/room',r=>r.fulfill({json:m.view()}));await p.goto('http://127.0.0.1:5173');await p.locator('.journey-ready').waitFor();
  await p.waitForFunction(()=>document.querySelector('.journey-canvas canvas')?.dataset.readyAvatars==='12');const canvas=p.locator('.journey-canvas canvas'),rows=[];
  for(const node of layout){
   await p.locator('.journey-route > button').nth(node.index).click();await p.waitForFunction(i=>document.querySelector('.journey-canvas canvas')?.dataset.selectedIsland===String(i),node.index);await p.waitForTimeout(120);
   assert.equal(await p.locator('.atlas-badge').textContent(),node.region.name.toLocaleUpperCase('de'));
   assert.equal(await p.locator('.journey-location h3').textContent(),node.theme.name);
   const draws=Number(await canvas.getAttribute('data-draw-calls'));assert.ok(draws>0);rows.push({game:node.game,region:node.region.id,draws});
  }
  await p.getByRole('button',{name:'Alle Inseln anzeigen',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.journey-atlas')?.classList.contains('atlas-overview'));await p.waitForTimeout(200);
  const overviewDraws=Number(await canvas.getAttribute('data-draw-calls'));await p.locator('.journey-atlas').screenshot({path:`outputs/qa/${prefix}-${width}-overview.png`});
  assert.equal(await p.locator('.journey-canvas canvas').count(),1);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  results.push({width,players:12,regions:6,rows,overviewDraws});await p.close();console.log(`PASS regional atlas ${width}: all locations and chapters, twelve figures, overview ${overviewDraws} draw calls`);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(report,JSON.stringify({results,errors,limit:'Native Chromium/SwiftShader fixtures; draw calls and visible state only. Not a GPU timing, real phone, memory or full live Olympiad acceptance.'},null,2));
}finally{await browser.close();}
