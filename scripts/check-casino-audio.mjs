import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';

await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/casino-audio-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/casino-audio-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}),results=[],errors=[];
const shoe=[-2.8,1.8,-1.8],bank=[0,1.671,-.15];
const countAt=(page,point)=>page.evaluate(point=>window.__panners.filter(p=>p.position?.every((n,i)=>Math.abs(n-point[i])<.03)).length,point);
async function seek(page,t){page.qaNow=t;await page.evaluate(t=>{window.__casinoNow=t;sessionStorage.setItem('__casinoNow',String(t));},t);}
try{for(const width of[1440,390]){
 const m=fixture('blackjack',2),g=m.room.game,now=Date.now(),page=await browser.newPage({viewport:{width,height:width===390?950:1100},hasTouch:width===390});page.qaNow=now;
 page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket('**/api/live',w=>w.close());
 await page.addInitScript(({pid,now})=>{
  localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:false,music:0,effects:.7,motion:false}));localStorage.setItem('olymp.graphics','low');
  window.__casinoNow=Number(sessionStorage.getItem('__casinoNow'))||now;Date.now=()=>window.__casinoNow;
  window.__contexts=[];window.__panners=[];window.__sources=[];const Native=AudioContext;
  window.AudioContext=class extends Native{
   constructor(...a){super(...a);window.__contexts.push(this);}
   createPanner(){const p=super.createPanner(),entry={node:p,connected:false,position:null},connect=p.connect.bind(p),disconnect=p.disconnect.bind(p);p.connect=function(...a){entry.connected=true;entry.position=[p.positionX.value,p.positionY.value,p.positionZ.value];return connect(...a);};p.disconnect=function(...a){entry.connected=false;return disconnect(...a);};window.__panners.push(entry);return p;}
   createBufferSource(){const s=super.createBufferSource(),entry={node:s,connected:false},connect=s.connect.bind(s),disconnect=s.disconnect.bind(s);s.connect=function(...a){entry.connected=true;return connect(...a);};s.disconnect=function(...a){entry.connected=false;return disconnect(...a);};window.__sources.push(entry);return s;}
  };
 },{pid:m.first,now});
 await page.route('**/api/room',r=>{const a=r.request().postDataJSON();if(a.type==='action')m.command(m.first,a.action);const view=m.view();view.room.serverTime=page.qaNow;return r.fulfill({json:view});});
 // Valid controlled deck: first player has twenty, second sixteen, dealer draws to eighteen.
 const hands=[[{rank:10,suit:0},{rank:10,suit:1}],[{rank:7,suit:2},{rank:9,suit:3}]];if(width===390)hands.reverse();
 const dealer=[{rank:2,suit:0},{rank:3,suit:1}],draws=[...hands.flat(),{rank:5,suit:2},{rank:8,suit:3}];
 const deck=Array.from({length:312},(_,i)=>({rank:i%13+1,suit:Math.floor(i/13)%4}));for(const c of[...dealer,...draws]){const i=deck.findIndex(d=>d.rank===c.rank&&d.suit===c.suit);assert.ok(i>=0);deck.splice(i,1);}g.secret.dealer=dealer;g.public.dealer=[dealer[0]];g.secret.deck=[...deck,...draws.toReversed()];
 await page.goto('http://127.0.0.1:5173');await page.locator('.adventure-ready').waitFor({timeout:60000});await page.locator('.adventure-stage').scrollIntoViewIfNeeded();await page.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.casino||'null')?.dealerReady);
 assert.equal(await page.evaluate(()=>window.__contexts.length),0,'Rejoining must not open audio');
 await page.getByRole('button',{name:'Mit 50 Chips starten',exact:true}).click();await page.waitForFunction(point=>window.__panners.some(p=>p.position?.every((n,i)=>Math.abs(n-point[i])<.03)),shoe);assert.equal(g.players[m.first].bet,50);
 const beforeRemote=await countAt(page,shoe);await seek(page,now+1000);m.command(m.room.participantIds[1],{type:'game',action:{type:'bet',value:50}});
 await page.waitForFunction(({point,before})=>window.__panners.filter(p=>p.position?.every((n,i)=>Math.abs(n-point[i])<.03)).length>before,{point:shoe,before:beforeRemote});
 const start=now+2000;for(const pid of m.room.participantIds)m.command(pid,{type:'game',action:{type:'stand'}});m.tick();assert.equal(g.public.reveal.dealerValue,18);assert.deepEqual(g.public.reveal.players.map(p=>p.payout),width===390?[0,100]:[100,0]);g.public.revealStartedAt=start;g.deadline=start+600000;
 await seek(page,start+5900);await page.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.casino||'null')?.visibleDealer===4);assert.equal(await countAt(page,bank),0,'No payout sound before the result gate');
 await seek(page,start+6500);await page.waitForFunction(point=>window.__panners.some(p=>p.position?.every((n,i)=>Math.abs(n-point[i])<.03)),bank);
 assert.equal(await page.evaluate(()=>window.__contexts.length),1);assert.equal(await page.evaluate(()=>window.__contexts[0].state),'running');
 await page.waitForFunction(()=>{const c=document.querySelector('.adventure-canvas canvas'),ctx=window.__contexts[0],pos=c?.dataset.camera?.split(',').map(Number);return pos&&[ctx.listener.positionX.value,ctx.listener.positionY.value,ctx.listener.positionZ.value].every((n,i)=>Math.abs(n-pos[i])<.15);});
 // The visibility handler must release both ambience loops and spatial voices.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>window.__panners.every(p=>!p.connected)&&window.__sources.filter(s=>s.node.loop).every(s=>!s.connected));assert.equal(await page.evaluate(()=>window.__sources.filter(s=>s.node.loop).length),2);
 await seek(page,start+8000);await page.reload();await page.locator('.adventure-ready').waitFor();await page.locator('.adventure-stage').scrollIntoViewIfNeeded();await page.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.casino||'null')?.resultReady);assert.equal(await page.evaluate(()=>window.__contexts.length),0);
 // An unrelated real gesture unlocks the app without replaying the historical result.
 const canvas=page.locator('.adventure-canvas canvas'),box=await canvas.boundingBox();if(width===390)await page.touchscreen.tap(box.x+box.width*.5,box.y+box.height*.2);else await page.mouse.click(box.x+box.width*.5,box.y+box.height*.2);
 await page.waitForFunction(()=>window.__contexts.length===1);await page.waitForFunction(()=>window.__contexts[0].state==='running'&&window.__contexts[0].currentTime>.75);assert.equal(await countAt(page,bank),0,'Settled rejoin must not replay a payout');
 results.push({width,players:2,ownPayout:g.public.reveal.players[0].payout,firstGesture:true,publicRemoteCard:true,cardSource:shoe,payoutSource:bank,payoutGated:true,listenerMatchesCamera:true,oneContext:true,hiddenCleanup:true,loops:2,rejoinDoesNotReplay:true});console.log(`PASS casino audio/${width}: first gesture, public deal, gated payout, listener, cleanup and settled rejoin`);await page.close();
 }assert.deepEqual(errors,[]);fs.writeFileSync('outputs/qa/casino-audio.json',JSON.stringify({results,errors,limit:'Instrumented native Web Audio and real UI/engine actions; no physical listening or hardware latency acceptance'},null,2));
}finally{await browser.close();}
