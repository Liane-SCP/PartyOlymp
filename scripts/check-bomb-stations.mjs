import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';

await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/bomb-stations-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/bomb-stations-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}),results=[],errors=[];
try{
 for(const quality of ['low','high']){
  const m=fixture('bomb',12),g=m.room.game,ids=m.room.participantIds,pid=ids[9];
  for(const word of ['Haus','Hase','Hafen','Haube','Hammer','Haar','Halm','Hahn','Hand']){
   g.public.fragment='HA';m.command(g.public.turnId,{type:'game',action:{type:'word',word,round:1,turn:g.public.turn}});assert.equal(g.stage,'word');
  }
  assert.equal(g.public.turnId,pid);g.public.fragment='HA';
  const page=await browser.newPage({viewport:{width:390,height:900},hasTouch:true});page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket('**/api/live',w=>w.close());
  await page.addInitScript(({pid,quality})=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true}));localStorage.setItem('olymp.graphics',quality);},{pid,quality});
  await page.route('**/api/room',r=>{const a=r.request().postDataJSON();if(a.type==='action')m.command(pid,a.action);return r.fulfill({json:m.view(pid)});});await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(quality=>{const c=document.querySelector('.adventure-canvas canvas');return c?.dataset.readyAvatars==='12'&&c.dataset.bombPersonal==='true'&&c.dataset.quality===quality;},quality);
  const input=page.getByRole('textbox',{name:'Wort mit Buchstabenfolge',exact:true}),canvas=page.locator('.adventure-canvas canvas'),handle=await canvas.elementHandle();
  await page.waitForFunction(()=>{const f=JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.bomb||'null');return f?.canType&&f.position.every((n,i)=>Math.abs(n-[9.95,1.8,0][i])<.02);});
  const target=JSON.parse(await canvas.getAttribute('data-camera-target'));assert.ok(target.every((n,i)=>Math.abs(n-[9.375,2,0][i])<.02));
  await input.fill('Schaf');await page.setViewportSize({width:390,height:600});await page.waitForFunction(()=>Math.abs(document.querySelector('.adventure-bomb-focused')?.getBoundingClientRect().height-600)<2);assert.equal(await input.inputValue(),'Schaf');const box=await input.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=600);
  await page.locator('.adventure-stage').screenshot({path:`outputs/qa/bomb-station-right-${quality}-390-600.png`});
  await input.press('Enter');await page.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.bombPersonal==='false');assert.equal(g.public.turnId,ids[10]);assert.equal(await handle.evaluate(c=>c===document.querySelector('.adventure-canvas canvas')),true);assert.deepEqual(errors,[]);
  results.push({quality,players:12,station:9,nativePasses:10,shortViewport:true,keyboardSubmit:true,canvasPreserved:true,target});await page.close();console.log(`PASS bomb right station/${quality}: nine real passes, own camera, short viewport, Enter and shared return`);
 }
 fs.writeFileSync(process.env.BOMB_STATIONS_REPORT??'outputs/qa/bomb-stations.json',JSON.stringify({results,errors,limit:'Chromium SwiftShader, simulated viewport reduction; no native phone keyboard or hardware FPS acceptance'},null,2));
}finally{await browser.close();}
