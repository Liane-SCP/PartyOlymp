import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.QA_URL??'http://127.0.0.1:5173',phases=[];
async function api(body,allowError=false){const response=await fetch(base+'/api/room',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)}),data=await response.json();if(!allowError)assert.ok(response.ok,data.error);return {...data,status:response.status};}
const identity=d=>({code:d.room.code,playerId:d.playerId,token:d.token});
const command=(s,action,allowError=false,requestId=crypto.randomUUID())=>api({...s,type:'action',action,requestId},allowError);
const poll=async s=>(await api({...s,type:'poll'})).room;
const scores=r=>r.standings.map(({id,rank,points,wins,seconds,lastPoints})=>({id,rank,points,wins,seconds,lastPoints}));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let host,guest,spectator;
async function until(predicate,label,timeout=90000){const deadline=Date.now()+timeout;while(Date.now()<deadline){const r=await poll(host);await poll(guest);if(spectator)await poll(spectator);if(phases.at(-1)!==r.phase){phases.push(r.phase);console.log('PHASE '+r.phase);}if(predicate(r))return r;await sleep(400);}throw Error('Timeout '+label);}
try{
 host=identity(await api({type:'create',name:'Live Host',avatar:0}));guest=identity(await api({type:'join',code:host.code,name:'Live Crew',avatar:1}));
 await command(host,{type:'configure',selection:[{id:'timing',rounds:1,seconds:45}]});
 await command(host,{type:'ready'});await command(guest,{type:'ready'});await command(host,{type:'start'});
 await until(r=>r.phase==='rules','rules');await command(host,{type:'ready'});await command(guest,{type:'ready'});
 let r=await until(r=>r.phase==='playing','playing');
 spectator=identity(await api({type:'join',code:host.code,name:'Live Zuschauer',avatar:2}));
 assert.equal((await poll(spectator)).players.find(p=>p.id===spectator.playerId).spectator,true);
 for(const s of [host,guest])await command(s,{type:'game',phase:r.phaseKey,action:{type:'start',round:1}});
 await sleep(300);r=await poll(host);
 for(const s of [host,guest])await command(s,{type:'game',phase:r.phaseKey,action:{type:'stop',round:1,elapsed:300}});
 r=await until(r=>r.phase==='podium','podium');const history=r.history,standings=scores(r),selection=r.selection,key=r.phaseKey;
 const requestId=crypto.randomUUID();await command(guest,{type:'rematchIntent',phase:key,choice:'watch'},false,requestId);
 await command(guest,{type:'rematchIntent',phase:key,choice:'watch'},false,requestId);
 await command(spectator,{type:'rematchIntent',phase:key,choice:'play'});
 r=await poll(host);assert.deepEqual(r.history,history);assert.deepEqual(scores(r),standings);assert.equal(r.rematch.playing,1);assert.equal(r.rematch.watching,1);
 assert.equal((await command(spectator,{type:'rematch',phase:key},true)).status,400);
 r=(await command(host,{type:'rematch',phase:key})).room;assert.equal(r.phase,'lobby');assert.deepEqual(r.history,history);assert.deepEqual(r.selection,selection);assert.ok(r.players.every(p=>!p.ready));
 assert.equal(r.players.find(p=>p.id===guest.playerId).spectator,true);assert.equal(r.players.find(p=>p.id===spectator.playerId).spectator,false);
 assert.equal((await command(guest,{type:'rematchIntent',phase:key,choice:'play'},true)).status,400);
 assert.equal((await command(host,{type:'start'},true)).status,400);
 await command(host,{type:'ready'});await command(spectator,{type:'ready'});
 r=(await command(host,{type:'start'})).room;assert.equal(r.rematch,null);assert.deepEqual(r.history,[]);assert.deepEqual(r.participantIds.sort(),[host.playerId,spectator.playerId].sort());assert.ok(r.players.every(p=>p.points===0));
 fs.writeFileSync('outputs/qa/rematch-live.json',JSON.stringify({passed:true,phases,realHTTP:true,realD1:true,players:2,spectators:1,realTime:true,requestReplay:true,hostGuard:true,stalePhaseGuard:true,readinessGuard:true,retainedResults:true,newStart:true,scope:'Local Wrangler real HTTP/D1 and real clock. No browser WebSockets, hosted networking, physical phone or full Olympiad acceptance.'},null,2));
 console.log('PASS real HTTP/D1 timing -> podium -> role exchange -> lobby -> new start');
}catch(e){fs.writeFileSync('outputs/qa/rematch-live-failure.json',JSON.stringify({passed:false,phases,error:e.message},null,2));throw e;}
