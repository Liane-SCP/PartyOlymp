import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/auction-jury-engine.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/auction-jury-engine.mjs');let now=Date.now();Date.now=()=>now;
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}),results=[],errors=[];
const frame=p=>p.locator('.adventure-canvas canvas').getAttribute('data-auction').then(JSON.parse);
async function until(read,predicate,label){for(let i=0;i<100;i++){const value=await read();if(predicate(value))return value;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout '+label);}
async function ready(p,count){await p.locator('.adventure-ready').waitFor({timeout:60000});await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForFunction(n=>+document.querySelector('.adventure-canvas canvas')?.dataset.readyAvatars===n,count);}
try{
 for(const count of (process.env.JURY_COUNTS?.split(',').map(Number)??[2,12]))for(const width of (process.env.JURY_WIDTHS?.split(',').map(Number)??[1440,390])){
  now+=100000;const total=count===2?7:50,m=fixture('auction',count),g=m.room.game,ids=m.room.participantIds,actor=ids[1],act=(id,a)=>m.command(id,{type:'game',action:{...a,round:1}});
  act(ids[0],{type:'topic',name:'Dinge aus der Abenteuerwelt'});act(ids[0],{type:'bid',value:3});for(const id of ids.slice(1))act(id,{type:'pass'});
  for(let i=0;i<total;i++)act(ids[0],{type:'word',word:i===total-1?'Ein sehr langer Begriff mit Umlauten: Drachenhöhle':`Abenteuerbegriff ${i+1}`});act(ids[0],{type:'finish'});
  const spectator={...m.room.players[0],id:'jury-observer',name:'Zuschauer',spectator:true};m.room.players.push(spectator);
  const pages=[];async function open(id){const p=await browser.newPage({viewport:{width,height:1100},hasTouch:width<600});pages.push(p);p.on('pageerror',e=>errors.push(e.message));await p.routeWebSocket('**/api/live',ws=>ws.close());await p.addInitScript(({id,now})=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:id,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');window.__juryNow=now;Date.now=()=>window.__juryNow;},{id,now});await p.route('**/api/room',async r=>{try{const a=r.request().postDataJSON();if(a.type==='action')m.command(id,a.action);await r.fulfill({json:m.view(id)});}catch(e){await r.fulfill({status:400,json:{error:e.message}});}});await p.goto('http://127.0.0.1:5173');await ready(p,count);return p;}
  const b=await open(actor),a=await open(ids[0]),observer=await open(spectator.id),jury=b.getByRole('region',{name:'Dein privates Jurybuch'});
  assert.equal(await a.locator('[data-auction-jury]').count(),0);assert.equal(await observer.locator('[data-auction-jury]').count(),0);assert.equal(await jury.locator('[data-jury-word]').count(),6);
  async function choose(index,name){const row=jury.locator(`[data-jury-word="${index}"]`),button=row.getByRole('button',{name,exact:true});if(width<600)await button.tap();else if(index===2){await button.focus();await b.keyboard.press('Enter');}else await button.click();}
  await choose(0,'✓ Gültig');await choose(1,'✕ Ungültig');await choose(2,'– Enthalten');
  await jury.getByRole('status').filter({hasText:`3 / ${total} geprüft`}).waitFor();
  await until(()=>m.view(actor).room.game.mine.timeoutInput,a=>a?.action?.reviewed?.[2]===true,'private draft ack');
  const own=m.view(actor).room.game.mine.timeoutInput.action;assert.deepEqual(own.votes.slice(0,4),[true,false,null,null]);assert.deepEqual(own.reviewed.slice(0,4),[true,true,true,false]);
  for(const id of [ids[0],spectator.id])assert.ok(!JSON.stringify(m.view(id).room.game).includes('reviewed'));
  await b.reload();await jury.waitFor();assert.equal(await jury.locator('[data-jury-word="2"] button[aria-pressed=true]').innerText(),'– Enthalten');
  await b.evaluate(()=>{for(const key of Object.keys(sessionStorage))if(key.startsWith('olymp.auction-jury:'))sessionStorage.removeItem(key);});await b.reload();await ready(b,count);await jury.waitFor();assert.equal(await jury.locator('[data-jury-word="2"] button[aria-pressed=true]').innerText(),'– Enthalten');
  const canvas=await b.locator('.adventure-canvas canvas').elementHandle();await jury.getByRole('button',{name:'Bühnenbuch ansehen',exact:true}).click();await b.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.auctionPersonal==='true');
  const c=b.locator('.adventure-canvas canvas'),box=await c.boundingBox(),camera=new T.PerspectiveCamera(42,box.width/box.height,.1,180);camera.position.fromArray((await c.getAttribute('data-camera')).split(',').map(Number));camera.lookAt(new T.Vector3(...JSON.parse(await c.getAttribute('data-camera-target'))));camera.updateMatrixWorld();const q=new T.Vector3(3.8,6.1-3*.58,-7.88).project(camera),x=box.x+(q.x+1)*box.width/2,y=box.y+(1-q.y)*box.height/2;
  assert.equal(await b.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,{x,y}),'CANVAS');if(width<600)await b.touchscreen.tap(x,y);else await b.mouse.click(x,y);
  await jury.locator('[data-jury-word="3"][data-active=true]').waitFor();assert.equal(await jury.locator('[data-jury-word="3"] button[aria-pressed=true]').count(),0);
  const pageCount=Math.ceil(total/6);for(let i=1;i<pageCount;i++)await jury.getByRole('button',{name:'Nächste Begriffe auf der Bühne',exact:true}).click();
  await choose(total-1,'✓ Gültig');await jury.getByRole('status').filter({hasText:`4 / ${total} geprüft`}).waitFor();
  await b.locator('.adventure-stage').scrollIntoViewIfNeeded();await b.waitForFunction(index=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.auction??'null')?.words?.at(-1)?.index===index,total-1);
  assert.equal(await canvas.evaluate(c=>c===document.querySelector('.adventure-canvas canvas')),true);assert.ok((await frame(b)).words.every(w=>w.valid===null));
  await b.locator('.adventure-stage').screenshot({path:`outputs/qa/auction-jury-${count}-${width}-book.png`});
  await b.reload();await jury.waitFor();assert.equal(await jury.locator(`[data-jury-word="${total-1}"] button[aria-pressed=true]`).innerText(),'✓ Gültig');
  await jury.getByRole('button',{name:'Offene Begriffe',exact:true}).click();await jury.locator('[data-jury-word="3"][data-active=true]').waitFor();for(let i=1;i<pageCount;i++)await jury.getByRole('button',{name:'Nächste Begriffe auf der Bühne',exact:true}).click();await choose(total-1,'✓ Gültig');
  await jury.scrollIntoViewIfNeeded();await b.waitForTimeout(200);const layout=await jury.evaluate(e=>{const r=e.getBoundingClientRect(),c=e.closest('.adventure-console'),cr=c.getBoundingClientRect(),hit=document.elementFromPoint(Math.max(0,Math.min(innerWidth-1,r.x+r.width/2)),Math.max(0,Math.min(innerHeight-1,r.y+Math.min(r.height/2,150)))) ;return {jury:{x:r.x,y:r.y,width:r.width,height:r.height},console:{x:cr.x,y:cr.y,width:cr.width,height:cr.height,scrollTop:c.scrollTop},hit:hit?.className,hitInJury:e.contains(hit)};});
  await jury.screenshot({path:`outputs/qa/auction-jury-${count}-${width}-private.png`});await b.screenshot({path:`outputs/qa/auction-jury-${count}-${width}-viewport.png`});
  await jury.getByRole('button',{name:'Bewertung festlegen',exact:true}).click();const confirmation=jury.getByRole('group',{name:'Offene Bewertungen bestätigen'});await confirmation.waitFor();assert.equal(g.players[actor].submitted,false);
  await confirmation.getByRole('button',{name:'Weiter prüfen',exact:true}).click();await confirmation.waitFor({state:'detached'});assert.equal(g.players[actor].submitted,false);
  await jury.getByRole('button',{name:'Bewertung festlegen',exact:true}).click();await confirmation.getByRole('button',{name:`Mit ${total-4} offenen Begriffen festlegen`,exact:true}).click();
  await until(()=>g.players[actor].submitted,v=>v===true,'submitted ballot');
  if(count>2){await jury.getByRole('heading',{name:'Bewertung versiegelt',exact:true}).waitFor();assert.ok(await jury.locator('.auction-ballot button').evaluateAll(bs=>bs.every(b=>b.disabled)));assert.ok((await frame(a)).words.every(w=>w.valid===null));await b.reload();await jury.getByRole('heading',{name:'Bewertung versiegelt',exact:true}).waitFor();const votes=Array(total).fill(null);votes[0]=true;votes[1]=false;votes[total-1]=true;for(const id of ids.slice(2))act(id,{type:'judge',votes});}
  await b.locator('.round-reveal').waitFor();assert.equal(g.public.reveal.count,2);assert.equal(g.public.reveal.success,false);assert.equal(g.public.reveal.players[0].score,-30);
  assert.equal(await b.evaluate(()=>Object.keys(sessionStorage).filter(k=>k.startsWith('olymp.auction-jury:')).length),0);
  for(const p of pages)assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  results.push({count,total,width,layout,privateJury:true,threeContexts:true,touch:width<600,localRestore:true,serverDraftRestore:true,explicitAbstention:true,bookPick:true,linkedPage:true,sameCanvas:true,confirmation:true,sealedRecall:count>2,publicVotesOnlyOnReveal:true,correctScore:true,cacheCleared:true});
  for(const p of pages)await p.close();console.log(`PASS auction jury ${count}/${total}/${width}`);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(process.env.JURY_REPORT??'outputs/qa/auction-jury-browser.json',JSON.stringify({results,errors,scope:'Native Chromium with three separate contexts, real room commands behind controlled HTTP, fixed shared fixture clock, closed WebSockets. No live network, physical device, FPS or hearing acceptance.'},null,2));
}catch(e){for(const [i,p]of browser.contexts().flatMap(c=>c.pages()).entries())await p.screenshot({path:`outputs/qa/auction-jury-failure-${i}.png`}).catch(()=>{});throw e;}finally{await browser.close();}
