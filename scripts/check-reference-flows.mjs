import assert from 'node:assert/strict';
import * as T from 'three';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/reference-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/reference-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
try{for(const id of ['dice','typer'])for(const width of [1440,390]){
 const m=fixture(id,12),page=await browser.newPage({viewport:{width,height:1100},hasTouch:width===390}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.routeWebSocket('**/api/live',ws=>ws.close());
 await page.addInitScript(pid=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true}));},m.first);
 await page.route('**/api/room',r=>{const b=r.request().postDataJSON();if(b.type==='action')m.act(b.action);return r.fulfill({json:m.view()});});
 await page.goto('http://127.0.0.1:5173');await page.locator('.adventure-ready').waitFor();const canvas=page.locator('.adventure-canvas canvas');
 if(await page.locator('.adventure-race-focused').count())await page.getByRole('button',{name:'Rennansicht verlassen'}).click();
 await page.getByLabel('Grafikqualität',{exact:true}).selectOption('low');await page.locator('.adventure-stage').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.quality==='low');
 if(id==='dice'){
  await page.getByRole('button',{name:'Mein W\u00fcrfelplatz',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.dicePersonal==='true');
  const beforeRoll=Number(await canvas.getAttribute('data-frame'));
  await page.getByRole('button',{name:'Erster Wurf →',exact:true}).click();await page.locator('.adventure-stage').scrollIntoViewIfNeeded();
  await page.waitForFunction(before=>{const c=document.querySelector('.adventure-canvas canvas');return Number(c?.dataset.frame)>before+1&&c?.dataset.diceRolling==='false';},beforeRoll);
  const rect=await canvas.boundingBox(),camera=new T.PerspectiveCamera(42,rect.width/rect.height,.1,180);camera.position.fromArray((await canvas.getAttribute('data-camera')).split(',').map(Number));camera.lookAt(new T.Vector3(...JSON.parse(await canvas.getAttribute('data-camera-target'))));camera.updateMatrixWorld();
  const place=JSON.parse(await canvas.getAttribute('data-dice-crew')).rows.find(r=>r.id===m.first),point=new T.Vector3(...place.dicePositions[0]).project(camera),x=rect.x+(point.x+1)*rect.width/2,y=rect.y+(1-point.y)*rect.height/2;
  if(width===390)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
  try{await page.waitForFunction(()=>document.querySelector('.dice-tray > button')?.classList.contains('held'));}catch(e){console.log({id,width,rect,x,y,canvas:await canvas.getAttribute('data-camera'),target:await canvas.getAttribute('data-camera-target'),hit:await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.outerHTML.slice(0,300),{x,y})});await page.screenshot({path:`outputs/qa/reference-flow-${id}-${width}-failure.png`});throw e;}assert.equal(m.view().room.game.mine.held[0],true);
 }else{
  const follow=page.locator('.adventure-shop-nav button').first();if(await follow.getAttribute('aria-pressed')!=='true')await follow.click();
  await page.getByRole('textbox',{name:'Renntext abtippen',exact:true}).fill(m.room.game.public.text);
  await page.locator('.adventure-stage').scrollIntoViewIfNeeded();await page.waitForFunction(pid=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.progress??'[]').find(p=>p.id===pid)?.progress===1,m.first);
  assert.notEqual(m.view().room.game.racers[m.first].finishedAt,null);
 }
 await page.waitForTimeout(1200);await page.locator('.adventure-stage').screenshot({path:`outputs/qa/reference-flow-${id}-${width}.png`});
 await page.reload();await page.locator('.adventure-ready').waitFor();await page.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.quality==='low');
 assert.equal(await page.getByLabel('Grafikqualität',{exact:true}).inputValue(),'low');assert.deepEqual(errors,[]);console.log(`${id}/${width}: 12 players, low graphics, primary 3D action, reload passed`);await page.close();
}}finally{await browser.close();}

