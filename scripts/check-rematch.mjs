import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['lib/game/room.ts'],outfile:'outputs/rematch-browser-engine.mjs',bundle:true,platform:'node',format:'esm'});
const {createRoom,player,roomAction,publicRoom}=await import('../outputs/rematch-browser-engine.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const results=[],errors=[];
try {
 for(const count of [2,12])for(const width of [1440,390]){
  const now=Date.now(),host=player('Nova',0,now,0),room=createRoom('QA1234',host,now);
  for(let i=1;i<count;i++)room.players.push(player(`Crew ${i}`,i,now,i));
  const guest=room.players[1],spectator=player('Gast',0,now,0);spectator.spectator=true;room.players.push(spectator);
  room.startedAt=now-50000;room.phase='podium';room.participantIds=room.players.filter(p=>!p.spectator).map(p=>p.id);
  room.selection=[{id:'timing',rounds:1,seconds:30}];room.players.forEach((p,i)=>p.points=600-i*20);
  const actions=[],pages=[];
  async function open(actor){
   const p=await browser.newPage({viewport:{width,height:1000},hasTouch:width<600});pages.push(p);
   p.on('pageerror',e=>errors.push(e.message));await p.routeWebSocket('**/api/live',ws=>ws.close());
   await p.addInitScript(({id})=>{localStorage.setItem('olymp.session',JSON.stringify({code:'QA1234',playerId:id,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');},{id:actor.id});
   await p.route('**/api/room',async route=>{
    const body=route.request().postDataJSON();actor.lastSeen=Date.now();
    try{if(body.type==='action'){actions.push({actor:actor.id,...body.action});roomAction(room,actor,body.action,Date.now());}await route.fulfill({json:{playerId:actor.id,room:publicRoom(room,actor.id,Date.now())}});}
    catch(e){await route.fulfill({status:400,json:{error:e.message}});}
   });
   await p.goto('http://127.0.0.1:5173');await p.getByRole('region',{name:'Gemeinsame Revanche'}).waitFor();return p;
  }
  const hp=await open(host),gp=await open(guest),sp=await open(spectator);
  const board=p=>p.getByRole('region',{name:'Gemeinsame Revanche'}),choice=(p,name)=>board(p).getByRole('button',{name,exact:true});
  const press=async(p,locator)=>{await locator.scrollIntoViewIfNeeded();if(width<600)await locator.tap();else await locator.click();};
  await hp.locator('.ceremony-viewport canvas').waitFor();const canvas=await hp.locator('.ceremony-viewport canvas').elementHandle();
  assert.equal(await board(hp).locator('.rematch-crew li').count(),count+1);
  assert.equal(await sp.getByRole('button',{name:'Revanche vorbereiten',exact:true}).count(),0);
  if(count===12)assert.equal(await choice(sp,'Mitspielen').isDisabled(),true);
  await press(gp,choice(gp,'Zuschauen'));
  await hp.waitForFunction(id=>document.querySelector(`[data-player="${id}"]`)?.dataset.choice==='watch',guest.id);
  await choice(sp,'Mitspielen').waitFor({state:'visible'});await sp.waitForFunction(()=>!document.querySelector('.rematch-choice button').disabled);
  await press(sp,choice(sp,'Mitspielen'));await sp.waitForFunction(()=>document.querySelector('.rematch-choice button')?.getAttribute('aria-pressed')==='true');
  await hp.waitForFunction(id=>document.querySelector(`[data-player="${id}"]`)?.dataset.choice==='play',spectator.id);
  assert.equal(await canvas.evaluate(c=>c===document.querySelector('.ceremony-viewport canvas')),true);
  assert.equal(room.phase,'podium');assert.equal(host.points,600);
  if(width>=600){await choice(hp,'Mitspielen').focus();await hp.keyboard.press('Enter');await hp.waitForFunction(()=>document.querySelector('.rematch-choice button')?.getAttribute('aria-pressed')==='true');assert.equal(room.rematch.responses[host.id],'play');}
  await sp.reload();await board(sp).waitFor();assert.equal(await choice(sp,'Mitspielen').getAttribute('aria-pressed'),'true');
  await board(hp).screenshot({path:`outputs/qa/rematch-${count}-${width}.png`});
  await press(hp,hp.getByRole('button',{name:'Revanche vorbereiten',exact:true}));
  await hp.locator('.lobby-participation').waitFor();await gp.locator('.lobby-participation').waitFor();await sp.locator('.lobby-participation').waitFor();
  assert.equal(room.phase,'lobby');assert.equal(guest.spectator,true);assert.equal(spectator.spectator,false);assert.ok(room.players.every(p=>!p.ready));
  assert.equal(await hp.getByRole('button',{name:'Olympiade starten'}).isDisabled(),true);
  assert.equal(await gp.getByRole('button',{name:'Ich bin bereit',exact:true}).isDisabled(),true);
  await hp.locator('.lobby-participation').screenshot({path:`outputs/qa/rematch-lobby-${count}-${width}.png`});
  if(count===2){
   await press(sp,sp.getByRole('button',{name:'Ich bin bereit',exact:true}));
   await press(hp,hp.getByRole('button',{name:'Ich bin bereit',exact:true}));
   const start=hp.getByRole('button',{name:'Olympiade starten'});await hp.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Olympiade starten'))?.disabled);
   await press(hp,start);await hp.waitForFunction(()=>!document.querySelector('.lobby-participation'));
   assert.equal(room.rematch,undefined);assert.equal(room.players.every(p=>p.points===0),true);
   assert.deepEqual(room.participantIds.sort(),[host.id,spectator.id].sort());
  }else{
   const role=gp.locator('.lobby-participation').getByRole('button',{name:'Mitspielen',exact:true});assert.equal(await role.isDisabled(),true);
   await press(sp,sp.locator('.lobby-participation').getByRole('button',{name:'Zuschauen',exact:true}));
   await gp.waitForFunction(()=>!document.querySelector('.lobby-participation [role=group] button').disabled);
   await press(gp,role);await gp.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Ich bin bereit')?.disabled);
   assert.equal(guest.spectator,false);assert.equal(spectator.spectator,true);
  }
  for(const p of pages)assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.ok(actions.filter(a=>['rematchIntent','participation'].includes(a.type)).every(a=>a.phase));
  results.push({count,width,views:3,touch:width<600,keyboard:width>=600,roles:true,capacity:true,sharedReplies:true,persistedReload:true,sameCeremonyCanvas:true,hostPrepare:true,readinessRequired:true,newStart:count===2,lobbyRoleExchange:count===12,overflow:false});
  for(const p of pages)await p.close();console.log(`PASS rematch ${count}/${width}`);
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync('outputs/qa/rematch-browser.json',JSON.stringify({results,errors,scope:'Native Chromium with three isolated browser contexts per case, real roomAction/publicRoom through controlled HTTP responses; WebSockets closed. Desktop and touch-enabled narrow viewport, not physical mobile or live network acceptance.'},null,2));
}catch(e){for(const [i,p] of browser.contexts().flatMap(c=>c.pages()).entries())await p.screenshot({path:`outputs/qa/rematch-failure-${i}.png`}).catch(()=>{});throw e;}finally{await browser.close();}
