import assert from 'node:assert/strict';
import * as T from 'three';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/word-locations.mjs',bundle:true,platform:'node',format:'esm'});const {fixture}=await import('../outputs/word-locations.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
try{for(const width of[1440,390])for(const id of(process.env.GAMES?process.env.GAMES.split(','):['bomb','chain','categories'])){
 const m=fixture(id,12),p=await browser.newPage({viewport:{width,height:1100},hasTouch:width===390}),errors=[];
 if(id==='bomb')m.room.game.public.fragment='HA';
 if(id==='chain'){for(const player of m.room.players)m.command(player.id,{type:'game',action:{type:'suggestTopic',name:'Tiere',round:1,turn:0}});m.next();}
 if(id==='categories')m.room.game.public.letter='A';
 p.on('pageerror',e=>errors.push(e.message));p.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});await p.routeWebSocket('**/api/live',w=>w.close());
 await p.addInitScript(pid=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true}));localStorage.setItem('olymp.graphics','low');},m.first);
 await p.route('**/api/room',route=>{const b=route.request().postDataJSON();if(b.type==='action')m.act(b.action);return route.fulfill({json:m.view()});});await p.goto('http://127.0.0.1:5173');await p.locator('.adventure-ready').waitFor();await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForFunction(()=>Number(document.querySelector('.adventure-canvas canvas')?.dataset.readyAvatars)===12);
 const canvas=p.locator('.adventure-canvas canvas');async function pick(x,y,z){const r=await canvas.boundingBox(),c=new T.PerspectiveCamera(42,r.width/r.height,.1,180);c.position.fromArray((await canvas.getAttribute('data-camera')).split(',').map(Number));c.lookAt(new T.Vector3(...JSON.parse(await canvas.getAttribute('data-camera-target'))));c.updateMatrixWorld();const q=new T.Vector3(x,y,z).project(c),sx=r.x+(q.x+1)*r.width/2,sy=r.y+(1-q.y)*r.height/2;assert.ok(Number.isFinite(sx)&&Number.isFinite(sy),'Finite projected pick');if(width===390)await p.touchscreen.tap(sx,sy);else await p.mouse.click(sx,sy);}
 if(id==='bomb'){
  await pick(1.15,1.8,5.7);await p.getByRole('textbox',{name:'Wort mit Buchstabenfolge',exact:true}).fill('Haus');await p.getByRole('button',{name:'Weitergeben →',exact:true}).click();const next=m.view().room.game.turnId;assert.notEqual(next,m.first);await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForFunction(pid=>document.querySelector('.adventure-canvas canvas')?.dataset.bombHolder===pid,next);
  m.next();await p.locator('.bomb-exploded').waitFor();assert.equal(m.view().room.game.roster[next].alive,false);await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForTimeout(700);
 }else if(id==='chain'){
  assert.equal(await canvas.getAttribute('data-chain-steps'),'0');await p.getByRole('textbox',{name:'Dein Begriff',exact:true}).fill('Hund');await p.locator('[data-chain-console] form button.primary').click();await p.locator('.adventure-stage').scrollIntoViewIfNeeded();assert.equal(m.view().room.game.stage,'review');assert.equal(await canvas.getAttribute('data-chain-steps'),'0');
  for(const player of m.room.players.slice(1))m.command(player.id,{type:'game',action:{type:'approve',round:1,turn:m.room.game.public.turn}});await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.chainSteps==='1');m.next();const player=m.room.game.public.turnId;m.command(player,{type:'game',action:{type:'answer',answer:'Hund',round:1,turn:m.room.game.public.turn}});await p.waitForTimeout(800);assert.equal(await canvas.getAttribute('data-chain-steps'),'1');assert.equal(m.view().room.game.roster[player].alive,false);
 }else{
  const guest=m.room.players[1].id,secret='Atlantisgeheim';m.command(guest,{type:'game',action:{type:'draft',round:1,seq:1,answers:[secret,'','','','','','']}});assert.ok(!JSON.stringify(m.view().room.game).includes(secret));
  await pick(-4.95,1.9,-2.7);await p.getByRole('textbox',{name:'Land',exact:true}).fill('Argentinien');await p.getByRole('button',{name:'Antworten festlegen',exact:true}).click();
  for(const other of m.room.players.slice(1))m.command(other.id,{type:'game',action:{type:'answer',round:1,seq:2,answers:[secret,'','','','','','']}});
  await p.locator('.words-phase-vote').waitFor();assert.ok(m.view().room.game.options.some(o=>o.answer===secret));await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.atelierPhase==='vote');
 }
 await p.locator('.adventure-stage').screenshot({path:`outputs/qa/word-location-${id}-${width}.png`});assert.deepEqual(errors,[]);await p.close();console.log(`${id}/${width}: 12 players, confirmed transitions, privacy and individual location passed`);
}}finally{await browser.close();}

