import fs from 'node:fs';import assert from 'node:assert/strict';import {build} from 'esbuild';import {PerspectiveCamera,Vector3} from 'three';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/browser-game-engine.ts'],outfile:'outputs/colossus-runes-fixture.mjs',bundle:true,platform:'node',format:'esm'});const {match}=await import('../outputs/colossus-runes-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']}),errors=[],results=[],reduced=process.env.RUNE_REDUCED==='1';
const counts=process.env.RUNE_COUNTS?.split(',').map(Number)??[2,12],widths=process.env.RUNE_WIDTHS?.split(',').map(Number)??[1440,390];
try{for(const count of counts)for(const width of widths){
 const m=match('colossus',count),g=m.room.game,ids=m.room.participantIds,own=ids.at(-1),page=await browser.newPage({viewport:{width,height:width===390?844:1000},hasTouch:width===390});g.deadline=Date.now()-1;m.view();g.deadline=Date.now()+600000;
 page.on('pageerror',error=>errors.push(error.message));await page.routeWebSocket('**/api/live',socket=>socket.close());
 await page.addInitScript(({own,reduced})=>{localStorage.setItem('olymp.session',JSON.stringify({code:'QA1234',playerId:own,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:reduced,intense:false}));}, {own,reduced});
 await page.route('**/api/room',route=>{const body=route.request().postDataJSON();if(body.action?.type==='game')m.command(own,body.action);return route.fulfill({json:m.view(own)});});
 await page.goto('http://127.0.0.1:5173');const canvas=page.locator('canvas.boss-scene-canvas');await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')?.dataset.venueReady==='true',null,{timeout:60000});
 await page.getByRole('button',{name:'Welt ansehen',exact:true}).click();await page.getByRole('button',{name:'Dein Runenplatz',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')?.dataset.stationFocus==='1');
 await canvas.evaluate(canvas=>{window.__runeSamples=[];new MutationObserver(()=>{if(window.__runeSamples.length<300)window.__runeSamples.push({at:Date.now(),roll:JSON.parse(canvas.dataset.venueRoll??'null')});}).observe(canvas,{attributes:true,attributeFilter:['data-venue-roll']});});
 const data=async name=>JSON.parse(await canvas.getAttribute('data-'+name));
 async function press(key){
  await page.waitForFunction(key=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venuePicks??'[]').some(p=>p.key===key),key);
  const d=await canvas.evaluate(c=>({...c.dataset,rect:c.getBoundingClientRect().toJSON()})),camera=new PerspectiveCamera();camera.projectionMatrix.fromArray(JSON.parse(d.cameraProjection));camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();camera.matrixWorld.fromArray(JSON.parse(d.cameraWorld));camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  const pick=JSON.parse(d.venuePicks).find(p=>p.key===key);assert.ok(pick,`Missing ${key}`);const p=new Vector3(...pick.point).project(camera),x=d.rect.x+(p.x+1)*d.rect.width/2,y=d.rect.y+(1-p.y)*d.rect.height/2;
  assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,{x,y}),'CANVAS');if(width===390)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
 }
 await press('roll');await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueDice??'[]').length===5);
 if(!reduced)await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueRoll??'null')?.rolling===true);else assert.equal((await data('venue-roll')).rolling,false);
 await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueRoll??'null')?.rolling===false);
 await press('hold0');await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueHeld??'[]')[0]===true);const fixed=(await data('venue-roll')).positions[0],value=g.players[own].dice[0];
 await press('roll');await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')&&JSON.parse(document.querySelector('canvas.boss-scene-canvas').dataset.venueDice??'[]').length===5&&JSON.parse(document.querySelector('canvas.boss-scene-canvas').dataset.venueRoll??'null')?.age!==null);
 for(let i=0;i<40&&g.players[own].rolls<2;i++)await page.waitForTimeout(25);assert.equal(g.players[own].rolls,2);
 assert.equal(g.players[own].held[0],true);assert.equal(g.players[own].dice[0],value);
 if(!reduced)await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueRoll??'null')?.rolling===true);
 assert.deepEqual((await data('venue-roll')).positions[0],fixed);assert.deepEqual((await data('venue-roll')).rotations[0],[0,0,0]);
 await canvas.screenshot({path:`outputs/qa/colossus-runes-${count}-${width}-${reduced?'reduced':'animated'}-throw.png`});
 await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueRoll??'null')?.rolling===false);
 const confirmed=[...g.players[own].dice];await page.reload();await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')?.dataset.venueReady==='true',null,{timeout:60000});assert.deepEqual(await data('venue-dice'),confirmed);assert.equal((await data('venue-roll')).rolling,false);
 await page.getByRole('button',{name:'Welt ansehen',exact:true}).click();await page.getByRole('button',{name:'Dein Runenplatz',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')?.dataset.stationFocus==='1');
 m.act(ids[0],{type:'roll',round:1});await page.waitForTimeout(900);assert.deepEqual(await data('venue-dice'),confirmed);assert.equal((await data('venue-roll')).rolling,false);
 await press('strike');await page.waitForFunction(own=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueRuneCharge??'[]').some(row=>row.id===own&&row.ready&&row.charge===1&&row.launch===null),own);
 await canvas.screenshot({path:`outputs/qa/colossus-runes-${count}-${width}-${reduced?'reduced':'animated'}-charged.png`});
 // First player passes: readiness must never be mistaken for a damaging attack.
 m.act(ids[0],{type:'pass',round:1});for(const id of ids.slice(1,-1)){m.act(id,{type:'roll',round:1});m.act(id,{type:'strike',round:1});}m.view();assert.equal(g.stage,'roundReveal');
 await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueRuneCharge??'[]').some(row=>row.launch!==null));const initial=await data('venue-rune-charge');assert.equal(initial.find(row=>row.id===ids[0]).charge,0);assert.ok(initial.find(row=>row.id===own).ready);
 await page.waitForFunction(()=>{const rows=JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueRuneCharge??'[]');return rows.length>0&&rows.every(row=>row.charge===0&&row.launch!==null);},null,{timeout:15000});
 await canvas.screenshot({path:`outputs/qa/colossus-runes-${count}-${width}-${reduced?'reduced':'animated'}-salvo.png`});
 results.push({count,width,reduced,nativeRollHoldStrike:true,heldPoseFixed:true,lateJoinSettled:true,foreignRollPrivate:true,publicReadyCharge:true,passedAttackEmpty:true,sharedSalvoRelease:true,draws:Number(await canvas.getAttribute('data-draw-calls'))});assert.deepEqual(errors,[]);console.log(`PASS colossus runes ${count}/${width}/${reduced?'reduced':'animated'}: native throw/hold, late join, privacy, ready charge and shared discharge`);await page.close();
}fs.writeFileSync(`outputs/qa/colossus-runes-${reduced?'reduced':'animated'}.json`,JSON.stringify({results,errors,limits:'Real game-engine fixtures and native Chromium mouse/touch inputs, real server/renderer clocks, SwiftShader. Not device FPS, hearing, a full live boss fight or the whole Olympiad.'},null,2));
}catch(error){for(const [i,page] of browser.contexts().flatMap(context=>context.pages()).entries()){await page.screenshot({path:`outputs/qa/colossus-runes-failure-${i}.png`});const data=await page.locator('canvas.boss-scene-canvas').evaluate(canvas=>({...canvas.dataset})).catch(()=>null),samples=await page.evaluate(()=>window.__runeSamples??[]);fs.writeFileSync(`outputs/qa/colossus-runes-failure-${i}.json`,JSON.stringify({data,samples,errors,failure:error.message},null,2));}throw error;
}finally{await browser.close();}
