import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/camera-direction-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/camera-direction-fixture.mjs');
fs.mkdirSync('outputs/qa/camera-direction',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']}),results=[],errors=[];
async function open(m,playerId,width=1366,reduced=false){
 const p=await browser.newPage({viewport:{width,height:width<600?844:Math.round(width*9/16)},reducedMotion:reduced?'reduce':'no-preference'});
 p.on('pageerror',e=>errors.push(e.message));await p.routeWebSocket('**/api/live',w=>w.close());
 await p.addInitScript(({playerId,reduced})=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:reduced}));localStorage.setItem('olymp.graphics','low');},{playerId,reduced});
 await p.route('**/api/room',r=>{m.room.players.forEach(p=>p.lastSeen=Date.now());const b=r.request().postDataJSON();if(b.type==='action')m.command(playerId,b.action);return r.fulfill({json:m.view(playerId)});});
 await p.goto('http://127.0.0.1:5173');await p.locator('.adventure-ready').waitFor({timeout:60000});await p.waitForFunction(()=>!!document.querySelector('.adventure-canvas canvas')?.dataset.camera);return p;
}
const data=p=>p.locator('.adventure-canvas canvas').evaluate(c=>({view:c.dataset.pictureView,subject:c.dataset.cameraSubject,target:JSON.parse(c.dataset.cameraTarget),position:c.dataset.camera.split(',').map(Number)}));
async function shot(p,view,subject){await p.waitForFunction(({view,subject})=>{const c=document.querySelector('.adventure-canvas canvas');return c?.dataset.pictureView===view&&c?.dataset.cameraSubject===subject&&c?.dataset.cameraSettled==='true';},{view,subject});}
try{
 for(const [count,width,reduced]of process.env.CAMERA_CHECK==='race'?[]:[[12,1366,false],[12,1920,false],[2,390,false],[2,1366,true]]){
  const m=fixture('picture',count),other=m.room.participantIds.at(-1),p=await open(m,m.first,width,reduced),canvas=await p.locator('.adventure-canvas canvas').elementHandle();
  let observer=null;if(count===12){m.room.players.push({...structuredClone(m.room.players[0]),id:'observer',name:'Studio-Gast'});observer=await open(m,'observer',width,reduced);}
  const area=await p.locator('.adventure-canvas canvas').boundingBox();await p.mouse.move(area.x+area.width*.4,area.y+area.height*.4);await p.mouse.down();
  await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.cameraHeld==='true');const held=await data(p);
  m.command(other,{type:'game',action:{type:'buzz'}});await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.pictureView==='active');await p.waitForTimeout(550);
  assert.deepEqual((await data(p)).position,held.position,'Camera moved underneath a held pointer');await p.mouse.up();
  await shot(p,'active',other);if(observer)await shot(observer,'active',other);
  await p.screenshot({path:`outputs/qa/camera-direction/picture-${count}-${width}-${reduced}-active.png`});
  assert.equal(await p.getByRole('textbox',{name:'Deine Antwort',exact:true}).count(),0);
  // The picture remains available by explicit choice while another player answers.
  await p.getByRole('button',{name:'Bild ansehen',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.pictureView==='screen');
  await p.getByRole('button',{name:'Am Buzzer',exact:true}).click();await shot(p,'active',other);
  m.command(other,{type:'game',action:{type:'answer',value:'certainly incorrect'}});await shot(p,'screen','');
  if(count===12){m.command(m.room.participantIds[4],{type:'game',action:{type:'buzz'}});await shot(p,'active',m.room.participantIds[4]);m.room.game.public.buzzDeadline=Date.now()-1;m.tick();await shot(p,'screen','');}
  await p.locator('.pixel-buzzer button').click();await shot(p,'active',m.first);
  const input=p.getByRole('textbox',{name:'Deine Antwort',exact:true});await input.fill(m.room.game.secret.item.answer);if(width>=1100)await p.screenshot({path:`outputs/qa/camera-direction/picture-${count}-${width}-${reduced}-own.png`});const node=await input.elementHandle();
  await p.getByRole('button',{name:'Bild ansehen',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.pictureView==='screen');
  assert.equal(await node.evaluate(n=>n===document.querySelector('[data-picture-controls] input')),true);assert.equal(await input.inputValue(),m.room.game.secret.item.answer);
  await input.press('Enter');await p.locator('.round-reveal').waitFor();await shot(p,'screen','');
  assert.equal(await canvas.evaluate(c=>c===document.querySelector('.adventure-canvas canvas')),true);
  await p.screenshot({path:`outputs/qa/camera-direction/picture-${count}-${width}-${reduced}-reveal.png`});
  results.push({game:'picture',count,width,reduced,publicBuzzer:true,spectator:!!observer,heldPointerStable:true,manualPhoto:true,returnAfterWrong:true,inputPreserved:true,reveal:true,sameCanvas:true});
  await observer?.close();await p.close();console.log('PASS picture',count,width,reduced);
 }
 for(const id of process.env.CAMERA_CHECK==='race'?[]:['bomb','chain']){
  const m=fixture(id,12),g=m.room.game;if(id==='chain'){m.next();m.next();}g.stage=id==='bomb'?'word':'answer';g.public.turnId=m.room.participantIds.at(-1);g.deadline=Date.now()+120000;
  const p=await open(m,m.first);await p.waitForFunction(subject=>document.querySelector('.adventure-canvas canvas')?.dataset.cameraSubject===subject,g.public.turnId);
  const first=await data(p);g.public.turnId=m.room.participantIds[4];await p.waitForFunction(subject=>document.querySelector('.adventure-canvas canvas')?.dataset.cameraSubject===subject,g.public.turnId);await p.waitForTimeout(800);const next=await data(p);
  assert.notDeepEqual(first.target,next.target);
  if(id==='bomb'){
   g.public.turnId=m.first;g.public.turn++;g.secret.cursor=0;const input=p.getByRole('textbox',{name:'Wort mit Buchstabenfolge'});await input.waitFor();
   const words=JSON.parse(fs.readFileSync('lib/game/data/bomb-words.json','utf8')),word=words.find(w=>w.length>=3&&w.toLocaleLowerCase('de').replaceAll('\u00df','ss').includes(g.public.fragment.toLocaleLowerCase('de').replaceAll('\u00df','ss')));
   assert.ok(word);await input.fill(word);await input.press('Enter');assert.notEqual(g.public.turnId,m.first,'Word did not pass the bomb');
   await p.waitForFunction(subject=>document.querySelector('.adventure-canvas canvas')?.dataset.cameraSubject===subject,g.public.turnId);
  }
  await p.screenshot({path:`outputs/qa/camera-direction/${id}-turn.png`});results.push({game:id,count:12,turnFollow:true,first,next});await p.close();console.log('PASS',id);
 }
 // Automatic driving follows confirmed progress and releases on the result.
 {
  const m=fixture('typer',4),p=await open(m,m.first);await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.tracking==='true');const before=await data(p);
  await p.getByRole('textbox',{name:'Renntext abtippen'}).fill(m.room.game.public.text.slice(0,40));await p.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.progress??'[]').some(r=>r.progress>0));
  assert.ok(m.room.game.players[m.first].progress>0);await p.screenshot({path:'outputs/qa/camera-direction/race-driving.png'});
  await p.getByRole('textbox',{name:'Renntext abtippen'}).fill(m.room.game.public.text);await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.tracking==='false');assert.ok(m.room.game.players[m.first].submitted);assert.equal(m.room.game.stage,'answer','Crew must still be racing');
  m.next();await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.tracking==='false');
  results.push({game:'typer',automaticDriving:true,nativeInput:true,overviewOnOwnFinish:true,overviewOnReveal:true});await p.close();console.log('PASS race camera');
 }
 // Favorites now perform their visible primary action: sending.
 {
  const m=fixture('dice',2),p=await open(m,m.first);await p.getByRole('button',{name:'Alle Emotes',exact:true}).click();const slot=p.locator('.emote-slots>button').first(),label=await slot.getAttribute('aria-label');assert.match(label,/senden/);await slot.click();await p.waitForFunction(()=>!document.querySelector('.emote-picker'));assert.equal(m.room.emotes.length,1);results.push({emoteFavoriteClickSends:true,label});await p.close();console.log('PASS favorites');
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(`outputs/qa/camera-direction/report${process.env.CAMERA_CHECK==='race'?'-race-final':''}.json`,JSON.stringify({results,errors,limit:'Local Chromium render and native input against authoritative game fixtures. No real mobile hardware or remote multiplayer network.'},null,2));
}catch(e){for(const [i,p]of browser.contexts().flatMap(c=>c.pages()).entries())await p.screenshot({path:`outputs/qa/camera-direction/failure-${i}.png`}).catch(()=>{});throw e;}finally{await browser.close();}
