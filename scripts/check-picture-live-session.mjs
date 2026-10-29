import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';

// Real D1, HTTP and browser WebSockets. No routes, clocks or game state replaced.
// The known content catalogue supplies an answer only after the public image is selected.
await build({entryPoints:['lib/game/content.ts'],outfile:'outputs/picture-live-content.mjs',bundle:true,platform:'node',format:'esm'});
const {pictures}=await import('../outputs/picture-live-content.mjs');
const base=process.env.QA_URL??'http://127.0.0.1:5173',out='outputs/qa/picture-live';
fs.mkdirSync(out,{recursive:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),results=[],errors=[],clients=[];
async function raw(body){const response=await fetch(base+'/api/room',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});return {status:response.status,body:await response.json()};}
async function api(body){const r=await raw(body);assert.equal(r.status,200,r.body.error);return r.body;}
const identity=r=>({code:r.room.code,playerId:r.playerId,token:r.token});
const command=(s,action)=>api({...s,type:'action',requestId:crypto.randomUUID(),action});
const poll=async s=>(await api({...s,type:'poll'})).room;
async function until(read,predicate,label,timeout=30000){let last;const end=Date.now()+timeout;while(Date.now()<end){last=await read();if(predicate(last))return last;await pause(120);}throw Error(`Timed out: ${label}; phase=${last?.phase}, stage=${last?.game?.stage}`);}
async function play(s,action){const r=await poll(s);return command(s,{type:'game',phase:r.phaseKey,action:{round:r.game.round,...action}});}
async function shot(client,subject){await client.page.waitForFunction(subject=>{const c=document.querySelector('.adventure-canvas canvas');return c?.dataset.cameraSubject===subject&&c?.dataset.pictureView===(subject?'active':'screen')&&c?.dataset.cameraSettled==='true';},subject,{timeout:12000});}
async function open(browser,session,width){
 const page=await browser.newPage({viewport:{width,height:Math.round(width*9/16)}}),client={page,session,connected:0,snapshots:0,acks:[],latest:null};clients.push(client);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('websocket',ws=>ws.on('framereceived',f=>{try{const b=JSON.parse(String(f.payload));if(b.type==='connected')client.connected++;if(b.type==='snapshot'){client.snapshots++;client.latest=b.room;}if(b.type==='ack')client.acks.push(b.ok);}catch{}}));
 await page.addInitScript(s=>{localStorage.setItem('olymp.session',JSON.stringify(s));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:false}));localStorage.setItem('olymp.graphics','low');},session);
 await page.goto(base);await page.locator('.adventure-ready').waitFor({timeout:60000});await page.waitForFunction(()=>document.querySelector('.connection.online'));
 await until(()=>Promise.resolve(client.connected>0&&client.snapshots>0),Boolean,'real socket connected');return client;
}
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
let failure=null;
try{
 for(const count of process.env.PICTURE_COUNTS?.split(',').map(Number)??[2,12]){
  const members=[identity(await api({type:'create',name:'Studio Host',avatar:0}))],host=members[0];
  for(let i=1;i<count;i++)members.push(identity(await api({type:'join',code:host.code,name:`Studio Crew ${i}`,avatar:i%12})));
  await command(host,{type:'configure',selection:[{id:'picture',rounds:2,seconds:120}]});
  for(const s of members)await command(s,{type:'ready'});await command(host,{type:'start'});
  await until(()=>poll(host),r=>r.phase==='rules','rules');for(const s of members)await command(s,{type:'ready'});
  await until(()=>poll(host),r=>r.phase==='playing','playing');
  const spectator=identity(await api({type:'join',code:host.code,name:'Studio Zuschauer',avatar:6}));
  const active=[await open(browser,host,1280),await open(browser,members.at(-1),1920)],observer=await open(browser,spectator,1280),caseClients=[...active,observer];
  assert.equal((await poll(spectator)).players.find(p=>p.id===spectator.playerId).spectator,true);
  const spectatorPanel=observer.page.locator('[data-picture-spectator]');await spectatorPanel.waitFor();
  assert.ok((await spectatorPanel.boundingBox()).height<250,'Spectator status obscures too much of the picture');
  assert.equal(await observer.page.locator('.spectator .game-art').count(),0);
  assert.equal(await observer.page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);
  await observer.page.screenshot({path:`${out}/${count}-spectator.png`});console.log('READY studio',count);
  const phase=(await poll(host)).phaseKey;
  // Race two native clicks, or twelve HTTP requests. Mixing Playwright's enabled-
  // button auto-wait with HTTP can defer a click until the first owner's timeout.
  const burst=await Promise.allSettled(count===2?active.map(c=>c.page.locator('.pixel-buzzer button').click()):
   members.map(s=>raw({...s,type:'action',requestId:crypto.randomUUID(),action:{type:'game',phase,action:{type:'buzz',round:1}}})));
  for(const r of burst){assert.equal(r.status,'fulfilled',r.reason?.message);if(r.value?.status)assert.ok([200,400].includes(r.value.status),`Unexpected racing HTTP status ${r.value.status}`);}
  if(count===12)assert.equal(burst.filter(r=>r.value.status===200).length,1,'Exactly one racing HTTP request may win');
  const buzz=await until(()=>poll(host),r=>!!r.game.buzzer,'exclusive buzzer'),owner=buzz.game.buzzer;
  assert.equal(buzz.game.buzzTurn,1);assert.equal(buzz.game.events.filter(e=>e.type==='buzz').length,1);
  await Promise.all(caseClients.map(client=>shot(client,owner)));
  assert.ok((await spectatorPanel.locator('h2').textContent()).includes(buzz.players.find(p=>p.id===owner).name));
  assert.equal(await spectatorPanel.getByRole('timer').count(),1);
  const ownerClient=active.find(c=>c.session.playerId===owner);
  for(const client of caseClients)assert.equal(await client.page.getByRole('textbox',{name:'Deine Antwort',exact:true}).count(),client===ownerClient?1:0);
  const watcher=(await poll(spectator)).game;assert.equal(watcher.mine,null);assert.equal(watcher.secret,undefined);assert.equal(watcher.reveal,undefined);
  // A spectator cannot claim the public buzzer or answer on behalf of the crew.
  const illegal=await raw({...spectator,type:'action',requestId:crypto.randomUUID(),action:{type:'game',phase,action:{type:'buzz',round:1}}});assert.equal(illegal.status,400);
  const wrong='Live QA private incorrect answer';await play(members.find(s=>s.playerId===owner),{type:'answer',value:wrong});
  await Promise.all(caseClients.map(client=>shot(client,'')));
  for(const s of [...members.filter(s=>s.playerId!==owner),spectator])assert.ok(!JSON.stringify((await poll(s)).game).includes(wrong),'Private failed answer leaked');
  const next=members.find(s=>s.playerId!==owner),nextClient=active.find(c=>c.session.playerId===next.playerId);
  if(nextClient)await nextClient.page.locator('.pixel-buzzer button').click();else await play(next,{type:'buzz'});
  const answer=pictures.find(p=>p.image===(buzz.game.image))?.answer;assert.ok(answer);
  if(nextClient){const field=nextClient.page.getByRole('textbox',{name:'Deine Antwort',exact:true});await field.fill(answer);await field.press('Enter');}else await play(next,{type:'answer',value:answer});
  const reveal=await until(()=>poll(host),r=>r.game.stage==='roundReveal','first reveal');assert.equal(reveal.game.reveal.answer,answer);
  console.log('PASS buzzer race, privacy and first reveal',count);
  for(const c of caseClients){await shot(c,'');assert.equal(await c.page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);}
  await observer.page.screenshot({path:`${out}/${count}-reveal.png`});
  const second=await until(()=>poll(host),r=>r.game.stage==='answer'&&r.game.round===2,'next round',20000);
  assert.notEqual(second.game.image,buzz.game.image);assert.equal(second.game.buzzer,null);assert.ok(Object.values(second.game.guesses).every(p=>!p.out&&p.attempts===0));
  await active[0].page.locator('.pixel-buzzer button').click();const held=await until(()=>poll(host),r=>r.game.buzzer===host.playerId,'second buzzer');
  await observer.page.reload();await observer.page.locator('.adventure-ready').waitFor();
  const resumed=await poll(spectator),reloadBuzzerActive=resumed.game.buzzer===host.playerId;
  await shot(observer,resumed.game.buzzer??'');
  await until(()=>poll(host),r=>!r.game.buzzer&&r.game.guesses[host.playerId].out,'real eight second timeout',12000);
  assert.ok(Date.now()>=held.game.buzzDeadline);await Promise.all(caseClients.map(c=>shot(c,'')));
  // Round reset and timeout both preserve the next player's right to answer.
  const finisher=active[1];await finisher.page.locator('.pixel-buzzer button').click();const input=finisher.page.getByRole('textbox',{name:'Deine Antwort',exact:true});
  await input.fill(pictures.find(p=>p.image===second.game.image).answer);await input.press('Enter');
  await until(()=>poll(host),r=>r.game.stage==='roundReveal','second reveal');
  const ended=await until(()=>poll(host),r=>r.history.some(h=>h.game==='picture'),'history',30000);assert.equal(ended.history.length,1);assert.equal(ended.history[0].results.length,count);
  results.push({count,buzzerRace:count===2?'two native browser clicks':'twelve concurrent HTTP requests',viewports:['1280x720','1920x1080'],nativeClients:2,spectator:true,compactSpectatorStatus:true,exclusiveBuzzer:true,publicCamera:true,reloadConsistent:true,reloadBuzzerActive,privateWrongAnswer:true,correctAnswer:true,roundReset:true,realTimeout:true,historyEntries:1,sockets:caseClients.map(c=>({connected:c.connected,snapshots:c.snapshots,acknowledged:c.acks.length}))});
  for(const c of caseClients)await c.page.close();console.log('PASS real Pixelblitz',count,'players');
 }
 assert.deepEqual(errors,[]);
}catch(e){failure=e.message;for(const [i,c]of clients.entries())if(!c.page.isClosed())await c.page.screenshot({path:`${out}/failure-${i}.png`}).catch(()=>{});throw e;}
finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify({results,errors,failure,scope:'Local real HTTP/D1/WebSocket sessions. Separate Chromium contexts, two native player UIs and a spectator; additional participants use HTTP. No hosted deployment, hardware FPS or subjective audio acceptance.'},null,2));await browser.close();}
