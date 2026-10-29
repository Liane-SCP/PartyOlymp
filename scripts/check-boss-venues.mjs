import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {PerspectiveCamera,Vector3} from 'three';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/browser-game-engine.ts'],outfile:'outputs/browser-boss-engine.mjs',bundle:true,platform:'node',format:'esm'});
const {match}=await import('../outputs/browser-boss-engine.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const errors=[],results=[];
const focused=process.env.BOSS_STATION_FOCUS==='1',crewCount=Number(process.env.BOSS_CREW||12),playerIndex=Number(process.env.BOSS_PLAYER_INDEX||0);
assert.ok(crewCount>=2&&crewCount<=12&&playerIndex>=0&&playerIndex<crewCount);
const reducedMotion=process.env.BOSS_REDUCED_MOTION!=='0';
const fileSuffix=(focused?'-focus':'')+(crewCount!==12||playerIndex!==0?`-crew${crewCount}-player${playerIndex}`:'')+(reducedMotion?'':'-animated');
fs.mkdirSync('outputs/qa',{recursive:true});
try{
 for(const kind of process.argv.slice(2).length?process.argv.slice(2):['colossus','kraken','dragon'])for(const width of[1440,390]){
  const m=match(kind,crewCount),g=m.room.game;m.first=m.room.participantIds[playerIndex];
  g.deadline=Date.now()-1;m.view();g.deadline=Date.now()+600000;
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},hasTouch:width===390});
  page.on('pageerror',e=>errors.push(e.message));
  await page.routeWebSocket('**/api/live',ws=>ws.close());
  await page.addInitScript(({id,reducedMotion})=>{localStorage.setItem('olymp.session',JSON.stringify({code:'QA1234',playerId:id,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:reducedMotion,intense:false}));},{id:m.first,reducedMotion});
  await page.route('**/api/room',async route=>{try{const b=route.request().postDataJSON();if(b.action?.type==='game')m.command(m.first,b.action);await route.fulfill({json:m.view(m.first)});}catch(e){errors.push(e.message);await route.fulfill({status:400,json:{error:e.message}});}});
  await page.goto('http://127.0.0.1:5173');
  const canvas=page.locator('.boss-scene-wrapper.is-ready canvas[data-rigged="true"]');
  await canvas.waitFor({timeout:60000});
  await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')?.dataset.venueReady==='true',null,{timeout:30000});
  await page.getByRole('button',{name:'Welt ansehen',exact:true}).click();
  if(focused){await page.locator('.boss-station-toggle').click();await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')?.dataset.stationFocus==='1');await page.screenshot({path:`outputs/qa/boss-venue-${kind}-station-${width}${fileSuffix}.png`});}
  async function point(key){
   await page.waitForFunction(key=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venuePicks||'[]').some(p=>p.key===key),key==='cannonMuzzle'?'cannon':key);
   const d=await canvas.evaluate(c=>({...c.dataset,rect:c.getBoundingClientRect().toJSON()}));
   const camera=new PerspectiveCamera();camera.projectionMatrix.fromArray(JSON.parse(d.cameraProjection));camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();camera.matrixWorld.fromArray(JSON.parse(d.cameraWorld));camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
   const picks=JSON.parse(d.venuePicks),pick=key==='cannonMuzzle'?{point:JSON.parse(d.venueCannons).find(c=>c.index===playerIndex).muzzle}:key==='price'?picks.findLast(p=>p.key===key):picks.find(p=>p.key===key),v=new Vector3().fromArray(pick.point).project(camera);
   const x=d.rect.x+(v.x+1)*d.rect.width/2,y=d.rect.y+(1-v.y)*d.rect.height/2;
   assert.ok(x>0&&x<width&&y>0&&y<d.rect.height,`${kind}/${width}: ${key} in view (${x},${y})`);
   assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,{x,y}),'CANVAS',`${kind}/${width}: ${key} unobstructed`);
   return{x,y};
  }
  async function press(key,hold=0,offsetX=0){const p=await point(key);p.x+=offsetX;if(width===390){const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});if(hold)await page.waitForTimeout(hold);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else{await page.mouse.move(p.x,p.y);await page.mouse.down();if(hold)await page.waitForTimeout(hold);await page.mouse.up();}}
  if(kind==='colossus'){
   await press('roll');try{await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueDice||'[]').length===5);}catch(e){await page.screenshot({path:'outputs/qa/boss-venue-failure.png'});console.log(JSON.stringify({player:g.players[m.first],data:await canvas.evaluate(c=>({...c.dataset,opacity:c.style.opacity})),errors}));throw e;}
   const firstValue=g.players[m.first].dice[0];
   if(focused){await press('hold0',0,width===390?-21:0);try{await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueHeld||'[]')[0]===true);}catch(e){await page.screenshot({path:'outputs/qa/boss-venue-hold-failure.png'});console.log(JSON.stringify({data:await canvas.evaluate(c=>({...c.dataset})),buttons:await page.locator('.boss-dice-tray > button').evaluateAll(list=>list.map(b=>({held:b.getAttribute('aria-pressed'),disabled:b.disabled}))),errors}));throw e;}assert.equal(await page.locator('.boss-dice-tray > button').first().getAttribute('aria-pressed'),'true');await page.screenshot({path:`outputs/qa/boss-venue-colossus-held-${width}${fileSuffix}.png`});}
   await press('roll');for(let i=0;i<30&&g.players[m.first].rolls<2;i++)await page.waitForTimeout(100);assert.equal(g.players[m.first].rolls,2,'3D reroll remains separate from the enabled strike');
   if(focused){assert.equal(g.players[m.first].held[0],true,'3D held selection reaches authoritative reroll');assert.equal(g.players[m.first].dice[0],firstValue,'Held die preserves confirmed value');}
   await page.waitForTimeout(1200);
   const own=[...g.players[m.first].dice];m.act(m.room.participantIds.find(id=>id!==m.first),{type:'roll',round:g.round+1});await page.waitForTimeout(1200);
   assert.deepEqual(JSON.parse(await canvas.getAttribute('data-venue-dice')),own,'Other players cannot replace own dice');
   await page.screenshot({path:`outputs/qa/boss-venue-colossus-dice-${width}${fileSuffix}.png`});
   await press('strike');await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venuePicks||'[]').length===0);
   assert.equal(g.players[m.first].submitted,true,'3D strike submits');
   for(const phase of[0,1,2]){g.public.boss.phase=phase;await page.waitForFunction(n=>document.querySelector('canvas.boss-scene-canvas')?.dataset.phaseSeals===String(3-n),phase);}
  }else if(kind==='kraken'){
   await page.waitForFunction(count=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venueCannons??'[]').length===count,crewCount);
   const cannons=JSON.parse(await canvas.getAttribute('data-venue-cannons')),spacing=Math.min(1.72,10.8/Math.max(1,crewCount-1));
   assert.ok(cannons.every(c=>c.asset==='props/ship-cannon'&&c.meshes===1&&c.scale===1&&c.width<spacing-.035&&c.muzzle.every(Number.isFinite)&&c.floor.every(Number.isFinite)),'Actual authored cannons must fit every station');
   assert.equal(new Set(cannons.map(c=>c.geometry)).size,1,'Cannons must share geometry');assert.equal(new Set(cannons.map(c=>c.material)).size,1,'Cannons must share the palette material');
   if(focused&&width===390){const bounds=await page.locator('.boss-command').boundingBox();assert.ok(bounds.width>=width-24&&bounds.height<=200,'Mobile controls need a compact full-width row below the character');
    const clear=await canvas.evaluate(canvas=>{const rect=canvas.getBoundingClientRect();return JSON.parse(canvas.dataset.ownCrewQuad??'[]').map(p=>{const x=rect.x+(p[0]+1)*rect.width/2,y=rect.y+(1-p[1])*rect.height/2;return Math.abs(p[0])<1&&Math.abs(p[1])<1&&document.elementFromPoint(x,y)===canvas;});});assert.equal(clear.length,4);assert.ok(clear.every(Boolean),'The own character face must be clear of HUD controls');
   }
   assert.equal(await page.locator('.boss-charge').isVisible(),true,'World input retains the real timing gauge');
   await page.screenshot({path:`outputs/qa/boss-venue-kraken-ready-${width}${fileSuffix}.png`});
   assert.equal(await canvas.getAttribute('data-crew-on-deck'),'true');
   await press(process.env.BOSS_CANNON_MUZZLE==='1'?'cannonMuzzle':'cannon',320);await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas')?.dataset.venuePicks||'[]').length===0);
   assert.equal(g.players[m.first].submitted,true,'Physical 3D press/release fires');assert.ok(g.players[m.first].elapsed>=250,'Actual held time recorded');
   if(focused){for(const id of m.room.participantIds.filter(id=>id!==m.first)){m.act(id,{type:'start',round:g.round+1});m.act(id,{type:'fire',round:g.round+1,elapsed:1000});}assert.equal(g.stage,'roundReveal');g.deadline=Date.now()+60000;await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')?.dataset.stationFocus==='0');}
  }else{
   await page.waitForFunction(id=>document.querySelector('canvas.boss-scene-canvas')?.dataset.venueProduct===id,g.public.product.id);
   assert.equal(await canvas.getAttribute('data-venue-price'),'false');
   await press('price');await page.locator('.boss-price-input input').waitFor({state:'visible'});assert.equal(await page.locator('.boss-price-input input').evaluate(e=>e===document.activeElement),true,'3D altar opens and focuses estimate');
   await page.getByRole('textbox',{name:'Preisschätzung in Euro'}).fill((g.secret.product.price/100).toFixed(2).replace('.',','));
   for(const id of m.room.participantIds.filter(id=>id!==m.first))m.act(id,{type:'estimate',round:g.round+1,guess:g.secret.product.price,risk:'safe'});
   await page.getByRole('button',{name:'Tipp versiegeln'}).click();assert.equal(g.stage,'roundReveal');
   g.public.revealStartedAt=Date.now()-3200;g.deadline=Date.now()+60000;
   await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')?.dataset.venuePrice==='true');
   await page.getByRole('button',{name:'Welt ansehen',exact:true}).click();
   await page.screenshot({path:`outputs/qa/boss-venue-dragon-reveal-${width}${fileSuffix}.png`});
   g.deadline=Date.now()-1;m.view();g.deadline=Date.now()+600000;
   await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')?.dataset.venuePrice==='false');
   await page.waitForFunction(id=>document.querySelector('canvas.boss-scene-canvas')?.dataset.venueProduct===id,g.public.product.id);
  }
  await page.screenshot({path:`outputs/qa/boss-venue-${kind}-${width}${fileSuffix}.png`});
  const data=await canvas.evaluate(c=>({...c.dataset}));results.push({kind,width,count:crewCount,playerIndex,venue:data.venue,drawCalls:data.drawCalls,triangles:data.triangles,ownDice:data.venueDice,price:data.venuePrice,cannons:JSON.parse(data.venueCannons??'[]'),nativeMuzzle:kind==='kraken'&&process.env.BOSS_CANNON_MUZZLE==='1'});
  console.log(`PASS ${kind} ${width} ${data.drawCalls} calls`);await page.close();
 }
 assert.deepEqual(errors,[]);
 const suffix=process.argv.slice(2).length?`-${process.argv.slice(2).join('-')}`:'';
 fs.writeFileSync(`outputs/qa/boss-venues${suffix}${fileSuffix}.json`,JSON.stringify({results,errors,focused,renderer:'Chromium SwiftShader; functional evidence, not device FPS'},null,2));
}finally{await browser.close();}
