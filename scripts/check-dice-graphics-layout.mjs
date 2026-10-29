import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/dice-graphics-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/dice-graphics-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const results=[],errors=[];
try{
 for(const width of[320,390,600]){
  const m=fixture('dice',2),page=await browser.newPage({viewport:{width,height:844},hasTouch:true});
  page.on('pageerror',error=>errors.push(error.message));await page.routeWebSocket('**/api/live',socket=>socket.close());
  await page.addInitScript(id=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:id,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true}));localStorage.setItem('olymp.graphics','low');},m.first);
  await page.route('**/api/room',route=>{const body=route.request().postDataJSON();if(body.type==='action')m.act(body.action);return route.fulfill({json:m.view()});});
  await page.goto('http://127.0.0.1:5173');await page.locator('.adventure-ready').waitFor({timeout:60000});await page.locator('.adventure-stage').scrollIntoViewIfNeeded();
  const canvas=page.locator('.adventure-canvas canvas'),original=await canvas.elementHandle(),select=page.getByRole('combobox',{name:'Grafikqualität',exact:true});
  const layout=await select.evaluate(select=>{
   const rect=select.getBoundingClientRect(),box={x:rect.x,y:rect.y,width:rect.width,height:rect.height};
   const overlaps=Array.from(document.querySelectorAll('.dice-table-controls,.adventure-dice-camera button,.adventure-tools button,.adventure-heading')).filter(node=>{
    const r=node.getBoundingClientRect();return rect.left<r.right&&rect.right>r.left&&rect.top<r.bottom&&rect.bottom>r.top;
   }).map(node=>node.className||node.tagName);
   return {box,overlaps,clear:document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)===select};
  });
  assert.ok(layout.box.width>=44&&layout.box.height>=44);assert.ok(layout.clear);assert.deepEqual(layout.overlaps,[],'Graphics must not cover the dice dock, camera, title or tools');
  await select.selectOption('high');await page.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.quality==='high');
  assert.equal(await page.evaluate(()=>localStorage.getItem('olymp.graphics')),'high');
  await select.selectOption('low');await page.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.quality==='low');
  await page.locator('.adventure-stage').screenshot({path:`outputs/qa/dice-graphics-${width}.png`});
  await page.getByRole('button',{name:'Mein Würfelplatz',exact:true}).click();await page.locator('.adventure-dice-focused').waitFor();assert.equal(await select.isVisible(),false);
  await page.getByRole('button',{name:'Würfelplatz verlassen',exact:true}).click();await page.locator('.adventure-dice-focused').waitFor({state:'hidden'});assert.equal(await select.isVisible(),true);
  assert.ok(await original.evaluate(canvas=>canvas===document.querySelector('.adventure-canvas canvas')));assert.deepEqual(errors,[]);
  results.push({width,...layout,qualityChanges:true,persisted:true,hiddenInPersonalView:true,sameCanvas:true});console.log(`PASS dice graphics ${width}: 44px control, no intersecting UI, quality changes, fullscreen return`);await page.close();
 }
 fs.writeFileSync('outputs/qa/dice-graphics-layout.json',JSON.stringify({results,errors,limits:'Three touch-width Chromium fixture layouts. Geometry, UI state and native select changes; not an OS menu, physical mobile device or graphics FPS acceptance.'},null,2));
}finally{await browser.close();}
