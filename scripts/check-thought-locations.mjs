import assert from 'node:assert/strict';
import * as T from 'three';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
import {readFileSync} from 'node:fs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/thought-locations.mjs',bundle:true,platform:'node',format:'esm'});const {fixture}=await import('../outputs/thought-locations.mjs');
const bank=JSON.parse(readFileSync('lib/game/data/wiki.json','utf8'));
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
try{for(const width of[1440,390])for(const id of(process.env.GAMES?process.env.GAMES.split(','):['herd','spectrum','wiki'])){
 const m=fixture(id,12),p=await browser.newPage({viewport:{width,height:1100},hasTouch:width===390}),errors=[];
 let linkIndex=0,target='';
 if(id==='spectrum'){m.room.game.public.psychic=m.room.players[1].id;m.room.game.public.axis={left:'Kalt',right:'Heiß'};m.room.game.secret.target=62;m.command(m.room.players[1].id,{type:'game',action:{type:'clue',clue:'Kaffee',round:1}});assert.equal(m.view().room.game.target,undefined);}
 if(id==='wiki'){const article=m.view().room.game.article,links=article.links.filter(title=>title.replaceAll('_',' ').trim()!==article.title.replaceAll('_',' ').trim());linkIndex=Math.max(0,links.slice(0,3).findIndex(title=>bank.articles[title]));target=links[linkIndex];m.room.game.public.target=target;}
 p.on('pageerror',e=>errors.push(e.message));p.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});await p.routeWebSocket('**/api/live',w=>w.close());
 await p.addInitScript(pid=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');},m.first);
 await p.route('**/api/room',route=>{const b=route.request().postDataJSON();if(b.type==='action')m.act(b.action);return route.fulfill({json:m.view()});});await p.goto('http://127.0.0.1:5173');await p.locator('.adventure-ready').waitFor();await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForFunction(()=>Number(document.querySelector('.adventure-canvas canvas')?.dataset.readyAvatars)===12);
 const canvas=p.locator('.adventure-canvas canvas');async function screen(x,y,z){const r=await canvas.boundingBox(),c=new T.PerspectiveCamera(42,r.width/r.height,.1,180);c.position.fromArray((await canvas.getAttribute('data-camera')).split(',').map(Number));c.lookAt(new T.Vector3(...JSON.parse(await canvas.getAttribute('data-camera-target'))));c.updateMatrixWorld();const q=new T.Vector3(x,y,z).project(c);return {x:r.x+(q.x+1)*r.width/2,y:r.y+(1-q.y)*r.height/2};}async function pick(x,y,z){const q=await screen(x,y,z);if(width===390)await p.touchscreen.tap(q.x,q.y);else await p.mouse.click(q.x,q.y);}
 if(id==='herd'){
  const field=p.getByRole('textbox',{name:'Deine geheime Antwort',exact:true});await field.fill('Pizza');await p.getByRole('button',{name:'Geheim festlegen',exact:true}).click();m.command(m.room.players[5].id,{type:'game',action:{type:'answer',answer:'Pasta'}});assert.ok(!JSON.stringify(m.view().room.game).includes('Pasta'));
  await p.locator('.adventure-stage').scrollIntoViewIfNeeded();assert.deepEqual(JSON.parse(await canvas.getAttribute('data-herd-groups')),[]);
  for(let i=1;i<12;i++){if(i===5)continue;m.command(m.room.players[i].id,{type:'game',action:{type:'answer',answer:i<5?'Pizza':i<9?'Pasta':['Suppe','Obst','Reis'][i-9]}});}
  await p.locator('.round-reveal').waitFor();await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas').dataset.herdGroups).length===5);const groups=JSON.parse(await canvas.getAttribute('data-herd-groups'));assert.deepEqual(groups.map(g=>g.ids.length),[5,4,1,1,1]);const pos=JSON.parse(await canvas.getAttribute('data-position'));assert.ok(Math.abs(pos[0]+8)<.1&&Math.abs(pos[2]+2.5)<.1);
 }else if(id==='spectrum'){
  assert.equal(await canvas.getAttribute('data-spectrum-target'),'false');const start=await screen(0,3.3,.2),end=await screen(4,3.3,.2),camera=await canvas.getAttribute('data-camera');
  if(width===390)await p.touchscreen.tap(end.x,end.y);else{await p.mouse.move(start.x,start.y);await p.mouse.down();await p.mouse.move(end.x,end.y,{steps:8});await p.mouse.up();}
  await p.waitForFunction(()=>document.querySelector('.spectrum-controls input')?.value==='75');assert.equal(m.view().room.game.mine.dial,75);assert.equal(await canvas.getAttribute('data-camera'),camera);
  await pick(0,1.67,4.3);await p.waitForFunction(()=>!document.querySelector('.spectrum-controls'));assert.equal(m.view().room.game.mine.guess,75);assert.equal(m.view().room.game.target,undefined);
  for(const other of m.room.players.slice(2))m.command(other.id,{type:'game',action:{type:'lock',value:58,round:1}});await p.locator('.round-reveal').waitFor();await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas').dataset.spectrumTarget==='true');assert.equal(m.view().room.game.reveal.target,62);
 }else{
  assert.ok((m.view().room.game.article.links??[]).includes(target));await pick((linkIndex-1)*5.4,1.95,-1.05);await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.wikiArrived==='true');assert.equal(m.view().room.game.path.at(-1),target);assert.equal(m.view().room.game.path.length,2);assert.equal(await canvas.getAttribute('data-wiki-path'),'2');
 }
 await p.locator('.adventure-stage').screenshot({path:`outputs/qa/thought-location-${id}-${width}.png`});assert.deepEqual(errors,[]);await p.close();console.log(`${id}/${width}: 12 players, privacy, authoritative resolution and 3D interaction passed`);
}}finally{await browser.close();}


