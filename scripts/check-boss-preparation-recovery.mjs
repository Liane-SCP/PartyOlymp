import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/boss-preparation-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/boss-preparation-fixture.mjs'),out='outputs/qa/scene-recovery',results=[],errors=[];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
let release=()=>{},failure=null;
try{
 for(const width of process.env.BOSS_RECOVERY_WIDTHS?.split(',').map(Number)??[1280,1920])for(const kind of process.env.BOSS_RECOVERY_KINDS?.split(',')??['colossus','kraken','dragon'])for(const held of process.env.BOSS_RECOVERY_HOLDS?.split(',')??['model','hdr']){
  const model=fixture(kind,12);model.room.game.deadline=Date.now()+600000;
  const page=await browser.newPage({viewport:{width,height:Math.round(width*9/16)},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push({kind,width,held,message:e.message}));await page.routeWebSocket('**/api/live',s=>s.close());
  await page.addInitScript(pid=>{
   localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');
   const original=HTMLCanvasElement.prototype.getContext;window.__bossContexts=[];
   HTMLCanvasElement.prototype.getContext=function(kind,...args){const gl=original.call(this,kind,...args);if(kind==='webgl2'&&gl&&!window.__bossContexts.some(s=>s.canvas===this)){const state={canvas:this,programs:0},create=gl.createProgram;gl.createProgram=function(...args){state.programs++;return create.apply(this,args);};window.__bossContexts.push(state);}return gl;};
  },model.first);
  let unblock;const gate=new Promise(resolve=>unblock=resolve);let blocked=false,rejectModel=held==='model-error';release=()=>{rejectModel=false;unblock();};
  const path=held==='hdr'?'**/boss-environment/night-sky.hdr':`**/boss-models/${kind}.glb`;
  await page.route(path,async route=>{if(rejectModel){blocked=true;return route.fulfill({status:503,body:'Controlled model failure'});}if(!blocked){blocked=true;await gate;}await route.continue().catch(()=>{});});
  await page.route('**/api/room',route=>{const b=route.request().postDataJSON();if(b.type==='action')model.act(b.action);return route.fulfill({json:model.view()});});
  await page.goto('http://127.0.0.1:5173');
  let old;
  if(held==='model-error'){
   await page.locator('.boss-scene-retry').waitFor();old=(await page.evaluateHandle(()=>window.__bossContexts[0].canvas)).asElement();
  }else{
   await page.locator('.boss-scene-canvas').waitFor({state:'attached'});await page.waitForTimeout(150);old=await page.locator('.boss-scene-canvas').elementHandle();
   assert.equal(await old.evaluate(c=>{const ext=c.getContext('webgl2').getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true;}),true);
  }
  assert.equal(blocked,true,'The selected request was neither held nor rejected');
  assert.equal(await page.locator('.boss-scene-wrapper.is-ready').count(),0,'The arena finished before the interruption');
  const phase=model.room.phase,round=model.room.game.round,scores=JSON.stringify(model.room.game.scores);
  const retry=page.locator('.boss-scene-retry');await retry.waitFor();
  assert.equal(await old.evaluate(c=>c.isConnected),false,'Lost arena retained its renderer while preparation was pending');
  const stopped=await old.evaluate(c=>({programs:window.__bossContexts.find(s=>s.canvas===c).programs,rigged:c.dataset.rigged??''}));
  release();await retry.click();
  await page.waitForFunction(()=>{const c=document.querySelector('.boss-scene-wrapper.is-ready .boss-scene-canvas');return c?.dataset.rigged==='true'&&c?.dataset.venueReady==='true'&&c.style.opacity==='1';},null,{timeout:60000});
  await page.waitForTimeout(400);
  assert.deepEqual(await old.evaluate(c=>({programs:window.__bossContexts.find(s=>s.canvas===c).programs,rigged:c.dataset.rigged??''})),stopped,'Late preparation modified or compiled the dead arena');
  assert.equal(await old.evaluate(c=>c.getContext('webgl2').isContextLost()),true);assert.equal(await page.locator('.boss-scene-canvas').count(),1);
  // Recovery must remain usable after the replacement arena has finished loading.
  await page.locator('.boss-scene-canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await retry.click();await page.waitForFunction(()=>!!document.querySelector('.boss-scene-wrapper.is-ready .boss-scene-canvas'),null,{timeout:60000});
  assert.equal(await page.locator('.boss-scene-canvas').count(),1);assert.equal(model.room.phase,phase);assert.equal(model.room.game.round,round);assert.equal(JSON.stringify(model.room.game.scores),scores);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);
  results.push({kind,width,held,players:12,oldContextReleased:true,lateWorkRejected:true,noLateShaderPrograms:true,readyStateRetry:true,phaseAndScorePreserved:true});await page.screenshot({path:`${out}/boss-preparing-${kind}-${held}-${width}.png`});await page.close();console.log('PASS boss preparation recovery',kind,held,width);
 }
 assert.deepEqual(errors,[]);
}catch(e){failure=e.message;for(const p of browser.contexts().flatMap(c=>c.pages()))await p.screenshot({path:`${out}/boss-preparation-failure.png`}).catch(()=>{});throw e;}
finally{release();fs.writeFileSync(process.env.BOSS_RECOVERY_REPORT??`${out}/boss-preparation-report.json`,JSON.stringify({results,errors,failure,scope:'Actual context loss while a boss GLB or HDR response is held, or deliberate HTTP model failure. Late-completion and shader-program checks, native retry and a second ready-state loss; local controlled engine views, software WebGL.'},null,2));await browser.close();}
