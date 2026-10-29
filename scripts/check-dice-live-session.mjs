import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';

// Real HTTP/D1, actual browser WebSockets, native UI and real server time.
// No route interception, fixture engine, database editing or clock replacement.
const base=process.env.QA_URL??'http://127.0.0.1:5173';
const reportPath=process.env.DICE_LIVE_REPORT??'outputs/qa/dice-live-session.json';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function api(body,allowError=false){
 const response=await fetch(base+'/api/room',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 const data=await response.json();if(!allowError)assert.ok(response.ok,data.error);
 return {...data,status:response.status};
}
const identity=data=>({code:data.room.code,playerId:data.playerId,token:data.token});
const command=(session,action,requestId=crypto.randomUUID(),allowError=false)=>api({...session,type:'action',action,requestId},allowError);
const poll=async session=>(await api({...session,type:'poll'})).room;
async function until(read,predicate,label,timeout=35000){
 const deadline=Date.now()+timeout;let last;
 while(Date.now()<deadline){last=await read();if(predicate(last))return last;await pause(150);}
 throw Error(`Timed out: ${label}; phase=${last?.phase}, stage=${last?.game?.stage}, turn=${last?.game?.turn}`);
}
const ownFrame=async (page,id)=>page.locator('.adventure-canvas canvas').evaluate((c,id)=>JSON.parse(c.dataset.diceCrew??'null')?.rows.find(row=>row.id===id),id);
const total=sheet=>sheet.reduce((sum,n)=>sum+n,0)+(sheet.slice(0,6).reduce((sum,n)=>sum+n,0)>=63?35:0);
const errors=[],turns=[],clients=[];
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
let failure=null,summary=null;
try{
 const first=await api({type:'create',name:'Dice Live Alpha',avatar:0}),host=identity(first);
 const guest=identity(await api({type:'join',code:host.code,name:'Dice Live Beta',avatar:1}));
 const sessions=[host,guest];
 await command(host,{type:'configure',selection:[{id:'dice',rounds:1,seconds:120}]});
 for(const session of sessions)await command(session,{type:'ready'});
 await command(host,{type:'start'});
 await until(()=>poll(host),room=>room.phase==='rules','rules',90000);
 for(const session of sessions)await command(session,{type:'ready'});
 await until(()=>poll(host),room=>room.phase==='playing','first shared turn');

 for(const [index,session] of sessions.entries()){
  const page=await browser.newPage({viewport:{width:index?390:1440,height:index?844:1100},hasTouch:!!index});
  const client={page,session,snapshots:0,acks:0,actions:0,sockets:0,connected:0,lastAction:null,entries:[]};clients.push(client);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{const pathname=new URL(response.url()).pathname;if(response.status()>=400&&(/^\/_next\/static\//.test(pathname)||/^\/adventure-models\//.test(pathname)))errors.push(`Asset HTTP ${response.status()}: ${pathname}`);});
  page.on('console',message=>{if(message.type()==='error'&&/THREE|WebGL|React/i.test(message.text()))errors.push(message.text());});
  page.on('websocket',socket=>{
   client.sockets++;
   socket.on('framesent',frame=>{try{const body=JSON.parse(String(frame.payload));if(body.type==='action'){client.actions++;client.lastAction=body;}}catch{}});
   socket.on('framereceived',frame=>{try{const body=JSON.parse(String(frame.payload));if(body.type==='connected')client.connected++;if(body.type==='snapshot')client.snapshots++;if(body.type==='ack'){assert.equal(body.ok,true);client.acks++;}if(body.type==='error')errors.push(body.error);}catch(error){errors.push(error.message);}});
  });
  await page.addInitScript(session=>{localStorage.setItem('olymp.session',JSON.stringify(session));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:false}));localStorage.setItem('olymp.graphics','low');},session);
  await page.goto(base);
  await page.locator('.adventure-ready').waitFor({timeout:60000});
  await page.waitForFunction(()=>document.querySelector('.connection.online')&&document.querySelector('.adventure-canvas canvas')?.dataset.readyAvatars==='2');
 }

 let firstRollAction=null;
 const started=Date.now();
 for(let turn=1;turn<=13;turn++){
  await until(()=>poll(host),room=>room.phase==='playing'&&room.game.stage==='answer'&&room.game.turn===turn,`turn ${turn}`);
  if(turn===2){
   const stale=await command(host,firstRollAction.action,crypto.randomUUID(),true);
   assert.equal(stale.status,400);assert.equal((await poll(host)).game.mine.rolls,0,'An old turn must not roll the next one');
  }
  const state=[];
  for(const [index,client] of clients.entries()){
   const {page,session}=client,controls=page.locator('.dice-table-controls');
   const roll=controls.getByRole('button',{name:'Erster Wurf →',exact:true});await roll.waitFor();await roll.click();
   await controls.getByRole('button',{name:'Becher werfen · 2 übrig',exact:true}).waitFor();
   let room=await poll(session),p=room.game.mine;assert.equal(p.rolls,1);
   if(turn===1&&index===0){
    assert.equal(client.lastAction?.action?.action?.type,'roll');firstRollAction=structuredClone(client.lastAction);
    const replay=await command(session,firstRollAction.action,firstRollAction.requestId);assert.equal(replay.room.game.mine.rolls,1,'Acknowledged duplicate must not roll again');
   }
   await controls.locator('.dice-tray>button').first().click();
   await page.waitForFunction(()=>document.querySelector('.dice-table-controls .dice-tray>button')?.getAttribute('aria-pressed')==='true');
   const held=p.dice[0];await controls.getByRole('button',{name:'Becher werfen · 2 übrig',exact:true}).click();
   await controls.getByRole('button',{name:'Becher werfen · 1 übrig',exact:true}).waitFor();
   room=await poll(session);p=room.game.mine;assert.equal(p.rolls,2);assert.equal(p.dice[0],held);assert.equal(p.held[0],true);
   if(turn===6&&index===1){
    const before={dice:[...p.dice],held:[...p.held],sheet:[...p.sheet]};await page.reload();
    await page.locator('.adventure-ready').waitFor({timeout:60000});
    await page.waitForFunction(id=>{const c=document.querySelector('.adventure-canvas canvas'),r=JSON.parse(c?.dataset.diceCrew??'null')?.rows.find(r=>r.id===id);return document.querySelector('.connection.online')&&c?.dataset.readyAvatars==='2'&&r?.dice.length===5;},session.playerId);
    const rejoined=(await poll(session)).game.mine;assert.deepEqual({dice:rejoined.dice,held:rejoined.held,sheet:rejoined.sheet},before);
    assert.deepEqual((await ownFrame(page,session.playerId)).dice,before.dice);
    await page.locator('.adventure-stage').screenshot({path:'outputs/qa/dice-live-rejoin-mobile.png'});
   }
   await controls.getByRole('button',{name:/^Wertungsblatt/}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();
   const category=dialog.locator('.score-sheet>button').nth(turn-1),label=await category.getAttribute('aria-label');
   await category.click();if(/: 0 Punkte möglich$/.test(label))await dialog.getByRole('button',{name:'Ja, 0 eintragen',exact:true}).click();
   await dialog.waitFor({state:'hidden'});
   room=await until(()=>poll(session),r=>r.game.mine.submitted,`entry ${turn}/${index}`);p=room.game.mine;
   assert.equal(p.sheet.filter(n=>n!==null).length,turn);assert.ok(p.sheet.slice(0,turn).every(n=>Number.isFinite(n)));assert.ok(p.sheet.slice(turn).every(n=>n===null));
   client.entries.push(p.sheet[turn-1]);assert.deepEqual(p.sheet.slice(0,turn),client.entries);state.push({dice:[...p.dice],value:p.sheet[turn-1]});
  }
  const a=await poll(host),b=await poll(guest);
  assert.deepEqual(a.game.mine.sheet,b.game.opponents[host.playerId].sheet);assert.deepEqual(b.game.mine.sheet,a.game.opponents[guest.playerId].sheet);
  for(const client of clients){const expected=client===clients[0]?a.game.mine:b.game.mine;await client.page.waitForFunction(({id,submitted})=>{const r=JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.diceCrew??'null')?.rows.find(r=>r.id===id);return !!r&&(submitted?r.status!=='BEREIT'&&!r.status.startsWith('WURF'):true);},{id:client.session.playerId,submitted:expected.submitted});}
  turns.push({turn,state,publicSheetsAgree:true});console.log(`PASS live dice turn ${turn}/13: two native clients, held reroll, authoritative entries and public sheets`);
  if(turn===12)for(const [index,client] of clients.entries())await client.page.locator('.adventure-stage').screenshot({path:`outputs/qa/dice-live-turn12-${index?'mobile':'desktop'}.png`});
 }
 const revealed=await until(()=>poll(host),r=>r.game?.stage==='roundReveal','full sheet reveal');
 if(process.env.DICE_LIVE_RESULTS==='1')await Promise.all(clients.map(async(client,index)=>{const page=client.page,other=sessions[1-index].playerId,panel=page.getByRole('region',{name:'Gemeinsamer Blattvergleich'}),before=client.actions;await panel.waitFor();assert.equal(await panel.getAttribute('data-selected'),client.session.playerId);const otherName=revealed.players.find(p=>p.id===other).name,button=panel.locator('.dice-result-crew button').filter({hasText:otherName});if(index)await button.tap();else await button.click();await page.waitForFunction(id=>document.querySelector('.dice-results')?.dataset.selected===id,other);const result=revealed.game.reveal.players.find(p=>p.id===other);assert.equal(Number(await panel.locator('tfoot td').first().innerText()),result.total);assert.equal(await panel.locator('thead th').count(),3);assert.equal(client.actions,before);await page.screenshot({path:`outputs/qa/dice-results-live-${index?'mobile':'desktop'}.png`});}));
 for(const [index,session] of sessions.entries()){
  const own=(await poll(session)).game.mine;assert.equal(own.done,true);assert.deepEqual(own.sheet,clients[index].entries);
  const entry=revealed.game.reveal.players.find(row=>row.id===session.playerId);assert.deepEqual(entry.sheet,own.sheet);assert.equal(entry.total,total(own.sheet));
 }
 const standings=await until(()=>poll(host),r=>r.phase==='standings','discipline standings',45000);
 assert.equal(standings.history.length,1);assert.equal(standings.history[0].game,'dice');assert.equal(standings.history[0].results.length,2);assert.ok(standings.history[0].results.every(row=>row.valid));
 const totals=clients.map(client=>total(client.entries));
 for(const [index,session] of sessions.entries()){
  const result=standings.history[0].results.find(row=>row.id===session.playerId);
  assert.equal(result.raw,totals[index]);assert.equal(result.rank,1+totals.filter(value=>value>totals[index]).length);
  assert.equal(standings.standings.find(row=>row.id===session.playerId).points,result.points);
 }
 for(const [index,client] of clients.entries()){
  await client.page.locator('.journey-ready').waitFor({timeout:30000});
  await client.page.screenshot({path:`outputs/qa/dice-live-standings-${index?'mobile':'desktop'}.png`,fullPage:true});
  assert.ok(client.connected>=1);assert.ok(client.snapshots>=26);assert.equal(client.actions,client.acks,'Each actual browser action must receive a successful acknowledgement');
 }
 assert.deepEqual(errors,[]);
 summary={players:2,turns:13,seconds:(Date.now()-started)/1000,rejoinTurn:6,duplicateRollIgnored:true,staleTurnRejected:true,interactiveResults:process.env.DICE_LIVE_RESULTS==='1',scoreTotals:revealed.game.reveal.players.map(row=>row.total),historyEntries:standings.history.length,results:standings.history[0].results.map(({raw,rank,points,valid})=>({raw,rank,points,valid})),clients:clients.map(c=>({width:c.page.viewportSize().width,sockets:c.sockets,connections:c.connected,snapshots:c.snapshots,actions:c.actions,acks:c.acks})),errors};
 console.log('PASS full live dice: 13 turns, native desktop/mobile-layout controls, D1/WebSockets, reload rejoin, authoritative totals and standings');
}catch(error){failure=error.message;for(const [index,client] of clients.entries())await client.page.screenshot({path:`outputs/qa/dice-live-failure-${index}.png`,fullPage:true}).catch(()=>{});throw error;
}finally{
 fs.writeFileSync(reportPath,JSON.stringify({summary,turns,errors,failure,limits:'One real local two-player 13-turn game with Chromium SwiftShader; HTTP/D1 setup and inspection, actual browser WebSocket gameplay. Not all crew sizes, a whole 21-game Olympiad, physical mobile hardware, hearing, FPS or hosted runtime acceptance. Local runtime close errors must be audited separately from the captured preview log. Session credentials are held only in memory.'},null,2));
 await browser.close();
}
