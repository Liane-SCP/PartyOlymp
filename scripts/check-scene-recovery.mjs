import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/scene-recovery-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture,ids}=await import('../outputs/scene-recovery-fixture.mjs'),results=[],errors=[];
const out='outputs/qa/scene-recovery';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
let failure=null;
try{
 for(const width of process.env.RECOVERY_WIDTHS?.split(',').map(Number)??[1280,1920])for(const kind of process.env.RECOVERY_GAMES?.split(',')??[...ids,'map','ceremony']){
  const model=fixture(['map','ceremony'].includes(kind)?'dice':kind,12),room=model.room;
  room.game.deadline=Date.now()+600000;
  if(kind==='color')room.game.public.previewUntil=Date.now()-1;
  if(kind==='map'){room.phase='paused';room.selection=ids.map(id=>({id,rounds:1,seconds:120}));}
  if(kind==='ceremony'){room.phase='podium';room.players.forEach((p,i)=>{p.points=(12-i)*100;});}
  const page=await browser.newPage({viewport:{width,height:Math.round(width*9/16)},reducedMotion:'no-preference'});
  page.on('pageerror',e=>errors.push({kind,width,message:e.message}));await page.routeWebSocket('**/api/live',s=>s.close());
  await page.addInitScript(pid=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:false}));localStorage.setItem('olymp.graphics','low');},model.first);
  await page.route('**/api/room',r=>{room.players.forEach(p=>p.lastSeen=Date.now());const b=r.request().postDataJSON();if(b.type==='action')model.act(b.action);return r.fulfill({json:model.view()});});
  await page.goto('http://127.0.0.1:5173');
  const boss=['colossus','kraken','dragon'].includes(kind),selector=kind==='map'?'.journey-canvas canvas':kind==='ceremony'?'.ceremony-viewport canvas':boss?'.boss-scene-canvas':'.adventure-canvas canvas';
  async function ready(){await page.waitForFunction(({selector,kind,boss})=>{const c=document.querySelector(selector);if(!c)return false;if(kind==='map')return +c.dataset.drawCalls>0;if(kind==='ceremony')return c.dataset.readyAvatars==='12'&&+c.dataset.drawCalls>0;if(boss)return c.dataset.rigged==='true'&&c.dataset.venueReady==='true';return !!c.closest('.adventure-ready')&&+c.dataset.frame>0;},{selector,kind,boss},{timeout:60000});}
  await ready();let draft=null,draftNode=null;
  if(kind==='map'){await page.getByRole('button',{name:'Alle Inseln anzeigen',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.journey-canvas canvas')?.dataset.mapView==='all');}
  if(kind==='categories'){draft=page.locator('[data-atelier-notebook] input').first();await draft.fill('Atelierentwurf');}
  if(kind==='typer'){draft=page.getByRole('textbox',{name:'Renntext abtippen',exact:true});await draft.fill(room.game.public.text.slice(0,15));}
  if(kind==='picture'){await page.locator('.pixel-buzzer button').click();draft=page.getByRole('textbox',{name:'Deine Antwort',exact:true});await draft.fill('Bildentwurf');}
  if(kind==='color'){draft=page.getByRole('slider',{name:'Rot mischen',exact:true});await draft.focus();await draft.press('Home');await draft.press('ArrowRight');}
  if(draft)draftNode=await draft.elementHandle();
  const savedDraft=draft?await draft.inputValue():null,phase=room.phase,round=room.game.round,score=JSON.stringify(room.game.scores),repeats=kind==='categories'?3:1;
  if(kind==='ceremony'){const skip=page.getByRole('button',{name:'Zum Siegerauftritt',exact:true});if(await skip.isVisible())await skip.click();}
  for(let attempt=0;attempt<repeats;attempt++){
   const old=await page.locator(selector).elementHandle();
   assert.equal(await old.evaluate(c=>{const gl=c.getContext('webgl2'),ext=gl?.getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true;}),true,'Real context-loss extension unavailable');
   const retry=page.locator(boss?'.boss-scene-retry':'.scene-retry');await retry.waitFor();
   assert.equal(await retry.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top>=100&&r.bottom<=innerHeight-24&&r.height>=43.5&&(hit===el||el.contains(hit));}),true,'Recovery action is clipped, too small or covered');
   if(!boss&&!['map','ceremony'].includes(kind)){const b=await page.locator('.adventure-stage').boundingBox();assert.ok(Math.abs(b.width-width)<2&&Math.abs(b.height-Math.round(width*9/16))<2,`Fallback collapsed the game stage: ${JSON.stringify(b)}`);}
   if(kind==='picture'){const photo=page.locator('.picture-recovery canvas[data-picture-ready=true]');await photo.waitFor();assert.equal(await photo.getAttribute('data-picture-source'),room.game.public.image);await page.screenshot({path:`${out}/picture-fallback-${width}.png`});}
   if(draft)assert.equal(await draft.inputValue(),savedDraft,'Losing graphics discarded an input draft');
   await retry.click();await page.waitForFunction(c=>!c.isConnected,old);await ready();
   assert.equal(await old.evaluate(c=>c.isConnected),false,'Old canvas remained mounted');
   assert.equal(await old.evaluate(c=>c.getContext('webgl2').isContextLost()),true,'Old WebGL context survived teardown');
   assert.equal(await page.locator(selector).count(),1,'More than one renderer remained mounted');
   if(draft){assert.equal(await draft.inputValue(),savedDraft);assert.equal(await draftNode.evaluate(n=>n.isConnected),true,'Graphics restart remounted the input');}
   if(kind==='picture')assert.equal(await page.locator('.pixel-photo-stage').count(),0,'Hidden fallback keeps redrawing alongside 3D');
   if(kind==='picture')await page.waitForFunction(pid=>document.querySelector('.adventure-canvas canvas')?.dataset.cameraSubject===pid,model.first);
   if(kind==='map')assert.equal(await page.locator(selector).getAttribute('data-map-view'),'all','Graphics restart discarded the selected map view');
   if(kind==='ceremony')assert.ok(+await page.locator(selector).getAttribute('data-ceremony-time')>=14,'Graphics restart replayed the award ceremony');
  }
  assert.equal(room.phase,phase);assert.equal(room.game.round,round);assert.equal(JSON.stringify(room.game.scores),score,'Graphics restart changed a score');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false,'Recovery created document scrolling');
  await page.screenshot({path:`${out}/${kind}-${width}.png`});results.push({kind,width,players:12,restarts:repeats,oldContextReleased:true,singleCanvas:true,draftPreserved:!!draft,phasePreserved:true,scorePreserved:true});await page.close();console.log('PASS scene recovery',kind,width);
 }
 assert.deepEqual(errors,[]);
}catch(e){failure=e.message;for(const [i,p]of browser.contexts().flatMap(c=>c.pages()).entries())await p.screenshot({path:`${out}/failure-${i}.png`}).catch(()=>{});throw e;}
finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify({results,errors,failure,scope:'Actual WEBGL_lose_context loss and native retry on local Chromium software WebGL. Controlled engine views; no real-network, hardware performance or process-memory claim.'},null,2));await browser.close();}
