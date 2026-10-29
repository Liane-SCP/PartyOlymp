import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/preparation-recovery-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/preparation-recovery-fixture.mjs'),out='outputs/qa/scene-recovery',results=[],errors=[];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
let release=()=>{},failure=null;
try{
 for(const width of [1280,1920]){
  const model=fixture('categories',12);model.room.game.deadline=Date.now()+600000;
  const page=await browser.newPage({viewport:{width,height:Math.round(width*9/16)},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket('**/api/live',s=>s.close());
  await page.addInitScript(pid=>{
   localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){const context=original.call(this,kind,...args);if(kind==='webgl2'&&context&&!window.__preparingCanvas)window.__preparingCanvas=this;return context;};
  },model.first);
  const gate=new Promise(resolve=>release=resolve);let blocked=false;
  await page.route('**/adventure-models/**/*.glb',async route=>{if(!blocked){blocked=true;await gate;}await route.continue().catch(()=>{});});
  await page.route('**/api/room',route=>{const b=route.request().postDataJSON();if(b.type==='action')model.act(b.action);return route.fulfill({json:model.view()});});
  await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>!!window.__preparingCanvas);
  const input=page.locator('[data-atelier-notebook] input').first();await input.fill('Ladeentwurf');const inputNode=await input.elementHandle();
  assert.equal(blocked,true,'No model request is held');assert.equal(await page.locator('.adventure-ready').count(),0,'The scene finished before the loss');
  const old=(await page.evaluateHandle(()=>window.__preparingCanvas)).asElement();
  assert.equal(await old.evaluate(c=>{const ext=c.getContext('webgl2').getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true;}),true);
  await page.locator('.scene-retry').waitFor();assert.equal(await input.inputValue(),'Ladeentwurf');
  // Let the old asynchronous model work settle only after its owner was destroyed.
  release();await page.locator('.scene-retry').click();
  await page.waitForFunction(()=>+document.querySelector('.adventure-ready canvas')?.dataset.frame>0,null,{timeout:60000});
  await page.waitForTimeout(400);
  assert.equal(await old.evaluate(c=>c.isConnected),false,'A late old scene was appended');assert.equal(await old.evaluate(c=>c.getContext('webgl2').isContextLost()),true);
  assert.equal(await page.locator('.adventure-canvas canvas').count(),1);assert.equal(await inputNode.evaluate(n=>n.isConnected),true);assert.equal(await input.inputValue(),'Ladeentwurf');
  // The fresh scene must also retain the ordinary ready-state recovery listener.
  await page.locator('.adventure-canvas canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.locator('.scene-retry').click();await page.waitForFunction(()=>+document.querySelector('.adventure-ready canvas')?.dataset.frame>0,null,{timeout:60000});
  assert.equal(await page.locator('.adventure-canvas canvas').count(),1);assert.equal(await inputNode.evaluate(n=>n.isConnected),true);assert.equal(await input.inputValue(),'Ladeentwurf');
  results.push({width,players:12,lossBeforeModelsReady:true,oldContextReleased:true,lateOldSceneRejected:true,draftAndNodePreserved:true,subsequentReadyRecovery:true});await page.screenshot({path:`${out}/preparing-${width}.png`});await page.close();console.log('PASS pending scene recovery',width);
 }
 assert.deepEqual(errors,[]);
}catch(e){failure=e.message;for(const p of browser.contexts().flatMap(c=>c.pages()))await p.screenshot({path:`${out}/preparation-failure.png`}).catch(()=>{});throw e;}
finally{release();fs.writeFileSync(`${out}/preparation-report.json`,JSON.stringify({results,errors,failure,scope:'Actual context loss while the first GLB response is deliberately held; native retry, late completion, and a second ready-state loss. Local controlled engine views, software WebGL.'},null,2));await browser.close();}
