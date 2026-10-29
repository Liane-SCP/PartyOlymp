import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import * as T from 'three';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/reference-moments-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/reference-moments-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const errors=[],results=[];fs.mkdirSync('outputs/qa',{recursive:true});
async function open(m,width,pid=m.first,frozen=false){
 const page=await browser.newPage({viewport:{width,height:1100},hasTouch:width===390});
 page.qaNow=Date.now();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|WebGL|React/i.test(m.text()))errors.push(m.text());});
 await page.routeWebSocket('**/api/live',ws=>ws.close());
 await page.addInitScript(({pid,frozen,now})=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:false}));localStorage.setItem('olymp.graphics','low');if(frozen){window.__qaNow=Number(sessionStorage.getItem('__qaTime'))||now;Date.now=()=>window.__qaNow;}},{pid,frozen,now:page.qaNow});
 await page.route('**/api/room',async route=>{const body=route.request().postDataJSON();if(body.type==='action')m.command(pid,body.action);const view=m.view(pid);if(frozen)view.room.serverTime=page.qaNow;await route.fulfill({json:view});});
 await page.goto('http://127.0.0.1:5173');await page.locator('.adventure-ready').waitFor({timeout:60000});await page.locator('.adventure-stage').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>!!document.querySelector('.adventure-canvas canvas')?.dataset.stage);
 return page;
}
async function shot(page,name){await page.locator('.adventure-stage').scrollIntoViewIfNeeded();await page.locator('.adventure-stage').screenshot({path:`outputs/qa/reference-moment-${name}.png`});}
async function clock(page,now){page.qaNow=now;await page.evaluate(now=>{window.__qaNow=now;sessionStorage.setItem('__qaTime',String(now));},now);}
try{for(const width of[1440,390]){
 const m=fixture('budget',12),g=m.room.game;g.public.budget=10000;g.secret.items=g.secret.items.map((p,i)=>({...p,price:i===0?9900:10100}));
 const [a,b]=[await open(m,width,m.first,true),await open(m,width,m.room.participantIds[1],true)];
 assert.equal(await a.locator('.adventure-canvas canvas').getAttribute('data-shopping').then(JSON.parse).then(s=>s.total),null);
 for(const [i,id]of m.room.participantIds.entries())m.command(id,{type:'game',action:{type:'answer',value:i<2?[g.public.items[i].id]:[],round:1}});
 m.tick();assert.equal(g.stage,'roundReveal');g.deadline=Date.now()+600000;const start=g.public.revealStartedAt,slot=14000/12;
 for(const index of[0,1,11]){
  const now=start+800+slot*(index+.8);await clock(a,now);await clock(b,now);
  for(const p of[a,b])await p.waitForFunction(id=>{const s=JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.shopping||'null');return s?.customer===id&&s.complete===true;},m.room.participantIds[index]);
  const [sa,sb]=await Promise.all([a,b].map(p=>p.locator('.adventure-canvas canvas').getAttribute('data-shopping').then(JSON.parse)));
  assert.deepEqual({id:sa.customer,total:sa.total,outcome:sa.outcome},{id:sb.customer,total:sb.total,outcome:sb.outcome});
  if(index===0){assert.equal(sa.outcome,'close');await a.getByText(/KNAPP GESCHAFFT!/).waitFor();await a.waitForTimeout(2000);await shot(a,`budget-close-${width}`);}
  if(index===1){assert.equal(sa.outcome,'over');await a.getByText(/ÜBER DEM BUDGET!/).waitFor();await shot(a,`budget-over-${width}`);await b.reload();await b.locator('.adventure-ready').waitFor();await b.locator('.adventure-stage').scrollIntoViewIfNeeded();await b.waitForFunction(id=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.shopping||'null')?.customer===id,m.room.participantIds[1]);}
 }
 await clock(a,start+15000);await a.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.shopping||'null')?.summary===true);await shot(a,`budget-summary-${width}`);
 m.next();await a.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.shopping||'null')?.total===null);assert.equal(await a.locator('.adventure-moment').count(),0);await a.close();await b.close();results.push({kind:'budget',width,players:12,viewers:2,sharedCustomers:true,rejoin:true,reset:true});console.log(`PASS budget ${width}: two coordinated views, close/over/empty/summary, rejoin and reset`);

 const dice=fixture('dice',12);dice.room.players[1].name='Luna';const dp=await open(dice,width);
 const canvas=dp.locator('.adventure-canvas canvas'),rect=await canvas.boundingBox(),camera=new T.PerspectiveCamera(42,rect.width/rect.height,.1,180);camera.position.fromArray((await canvas.getAttribute('data-camera')).split(',').map(Number));camera.lookAt(0,2.5,0);camera.updateMatrixWorld();const point=new T.Vector3(-4.7,2.15,1.6).project(camera),x=rect.x+(point.x+1)*rect.width/2,y=rect.y+(1-point.y)*rect.height/2;
 assert.equal(await dp.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,{x,y}),'CANVAS','The physical cup must be unobstructed');if(width===390)await dp.touchscreen.tap(x,y);else await dp.mouse.click(x,y);
 await dp.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.diceRolling==='true');assert.equal(dice.room.game.players[dice.first].rolls,1);
 const throwAgain=dp.getByRole('button',{name:'Becher werfen · 2 übrig',exact:true});if(width===390)await throwAgain.tap();else await throwAgain.click();await dp.getByRole('button',{name:'Becher werfen · 1 übrig',exact:true}).waitFor();assert.equal(dice.room.game.players[dice.first].rolls,2);
 const other=dice.room.participantIds[1];dice.command(other,{type:'game',action:{type:'roll',round:1,turn:1}});dice.room.game.players[other].dice=[6,6,6,6,6];
 await dp.getByText('Luna · FÜNFERPASCH!',{exact:true}).waitFor();await shot(dp,`dice-combination-${width}`);await dp.close();results.push({kind:'dice',width,players:12,firstRoll:true,publicCombination:true});console.log(`PASS dice ${width}: first roll animation and public five-of-a-kind reaction`);

 const race=fixture('typer',12),rg=race.room.game,opponent=race.room.participantIds[1];rg.players[race.first].history=[{finished:true,wpm:1}];rg.round=1;
 race.command(opponent,{type:'game',action:{type:'type',text:rg.public.text.slice(0,30),seq:1,round:2}});
 const rp=await open(race,width),input=rp.getByRole('textbox',{name:'Renntext abtippen',exact:true});
 await input.fill(rg.public.text.slice(0,10));await rp.locator('.adventure-stage').scrollIntoViewIfNeeded();await rp.waitForFunction(pid=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.progress||'[]').find(p=>p.id===pid)?.progress>0,race.first);
 await input.fill(rg.public.text.slice(0,50));await rp.locator('.adventure-stage').scrollIntoViewIfNeeded();await rp.locator('.adventure-moment').filter({hasText:/Nova ÜBERHOLT/}).waitFor();await shot(rp,`race-overtake-${width}`);
 await input.fill(rg.public.text);await rp.locator('.adventure-stage').scrollIntoViewIfNeeded();await rp.locator('.adventure-moment').filter({hasText:/REKORD/}).waitFor();assert.notEqual(rg.players[race.first].finishedAt,null);await shot(rp,`race-record-${width}`);
 await rp.close();results.push({kind:'typer',width,players:12,confirmedOvertake:true,finishRecord:true});console.log(`PASS typer ${width}: real input, overtake, confirmed finish and earlier-round record`);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('outputs/qa/reference-moments.json',JSON.stringify({results,errors,renderer:'Chromium SwiftShader; coordinated real game-engine fixtures, not a live network or device-FPS acceptance'},null,2));
}finally{await browser.close();}
