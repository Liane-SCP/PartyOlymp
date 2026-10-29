import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,player,roomAction,publicRoom,phaseKey,REJOIN_MS,context} from '../lib/game/room';
import {games} from '../lib/game/games';

function fixture(count=2){
 const now=1000000,host=player('Nova',0,now,0),r=createRoom('QA1234',host,now);
 for(let i=1;i<count;i++)r.players.push(player(`Crew ${i}`,i,now,i));
 const spectator=player('Gast',0,now,0);spectator.spectator=true;r.players.push(spectator);
 r.phase='podium';r.startedAt=now-50000;r.participantIds=r.players.filter(p=>!p.spectator).map(p=>p.id);
 r.players.forEach((p,i)=>p.points=100-i);r.selection=[{id:'dice',rounds:1,seconds:30}];
 const command=(p:typeof host,type:string,choice?:unknown,at=now)=>roomAction(r,p,{type,choice,phase:phaseKey(r)},at);
 const view=()=>publicRoom(r,host.id,now).rematch!;
 return {r,host,spectator,now,command,view};
}
test('legacy podium projects all roles and public champions without mutating or leaking tokens',()=>{
 const {r,view}=fixture(12),snapshot=structuredClone(r),v=view();
 assert.equal(v.seats,12);assert.equal(v.pending,12);assert.equal(v.watching,1);assert.equal(v.rows.length,13);
 assert.equal(v.champions[0].name,'Nova');assert.deepEqual(r,snapshot);
 for(const p of r.players)assert.ok(!JSON.stringify(v).includes(p.token));
});
test('reserved places cannot be stolen; explicit watch frees one and repeat choices are idempotent',()=>{
 const {r,host,spectator,command,view}=fixture(12),points=r.players.map(p=>p.points);
 assert.throws(()=>command(spectator,'rematchIntent','play'),/reserviert/);
 assert.equal(r.rematch,undefined);
 command(host,'rematchIntent','watch');command(host,'rematchIntent','watch');
 assert.equal(view().seats,11);command(spectator,'rematchIntent','play');command(spectator,'rematchIntent','play');
 assert.equal(view().seats,12);assert.equal(view().playing,1);assert.equal(view().pending,11);
 assert.throws(()=>command(host,'rematchIntent','play'),/reserviert/);assert.deepEqual(r.players.map(p=>p.points),points);
});
test('phase, host, kicked and invalid-choice guards reject unintended changes',()=>{
 const {r,host,spectator,command,now}=fixture();
 for(const choice of [null,undefined,'toggle',{},true])assert.throws(()=>command(host,'rematchIntent',choice));
 assert.throws(()=>roomAction(r,host,{type:'rematchIntent',choice:'play',phase:'old'},now));
 assert.throws(()=>command(spectator,'rematch'));spectator.kicked=true;
 assert.throws(()=>command(spectator,'rematchIntent','play'));assert.equal(r.rematch,undefined);
 command(host,'rematchIntent','play');const phase=phaseKey(r);command(host,'rematch');
 assert.throws(()=>roomAction(r,host,{type:'rematchIntent',choice:'watch',phase},now));
 assert.throws(()=>command(host,'rematchIntent','play'));
});
test('a short disconnect reserves a seat; expired seat reassignment survives old-player return',()=>{
 const {r,host,spectator,command,now,view}=fixture(12),old=r.players[1];
 old.lastSeen=now-REJOIN_MS+1;assert.throws(()=>command(spectator,'rematchIntent','play'),/reserviert/);
 old.lastSeen=now-REJOIN_MS;command(spectator,'rematchIntent','play');
 old.lastSeen=now;assert.equal(view().seats,12);assert.equal(view().rows.find(p=>p.id===old.id)!.reserved,false);
 assert.throws(()=>command(old,'rematchIntent','play'),/reserviert/);
 command(host,'rematch');assert.equal(old.spectator,true);assert.equal(spectator.spectator,false);
});
test('host prepares without starting or losing results, settings, champions or personal bests',()=>{
 const {r,host,spectator,command}=fixture(),other=r.players[1];
 r.game=games.dice.init(context(r,1000000));
 r.game.players[host.id].timeoutInput={phase:phaseKey(r),deadline:1001000,action:{type:'old-private-action'}};
 r.players.forEach(p=>p.ready=true);r.history=[{id:'old',game:'dice',results:[]}];r.personalBests={};
 const previous=structuredClone({selection:r.selection,history:r.history,points:r.players.map(p=>p.points),personalBests:r.personalBests});
 command(other,'rematchIntent','watch');command(spectator,'rematchIntent','play');command(host,'rematch');
 assert.equal(r.phase,'lobby');assert.equal(r.game,null);assert.equal(r.journey,undefined);assert.equal(r.draw,undefined);
 assert.deepEqual(r.participantIds,[]);assert.ok(r.players.every(p=>!p.ready));
 assert.equal(other.spectator,true);assert.equal(spectator.spectator,false);assert.equal(host.spectator,false);
 assert.deepEqual({selection:r.selection,history:r.history,points:r.players.map(p=>p.points),personalBests:r.personalBests},previous);
 assert.equal(r.rematch!.champions[0].id,host.id);assert.throws(()=>command(host,'start'),/bereit/);
 command(host,'ready');command(spectator,'ready');command(host,'start');
 assert.notEqual(r.phase,'lobby');assert.equal(r.rematch,undefined);assert.deepEqual(r.history,[]);
 assert.ok(r.players.every(p=>p.points===0));assert.deepEqual(r.participantIds.sort(),[host.id,spectator.id].sort());
});
test('lobby participation checks capacity, preserves repeated readiness and clears changed readiness',()=>{
 const {r,host,spectator,command,now}=fixture(12);command(host,'rematch');host.ready=true;
 command(host,'participation','play');assert.equal(host.ready,true);
 assert.throws(()=>command(spectator,'participation','play'),/reserviert/);
 command(host,'participation','watch');assert.equal(host.ready,false);command(spectator,'participation','play');
 spectator.ready=true;command(spectator,'participation','play');assert.equal(spectator.ready,true);
 const old=r.players[1];old.lastSeen=now-REJOIN_MS;command(host,'participation','play');
 assert.equal(old.spectator,true);old.lastSeen=now;assert.throws(()=>command(old,'participation','play'),/reserviert/);
 assert.equal(r.players.filter(p=>!p.spectator).length,12);
});
test('new lobbies support spectator admission without a prior ceremony',()=>{
 const {r,host,spectator,command}=fixture();r.phase='lobby';
 assert.equal(publicRoom(r,host.id,1000000).rematch,null);command(spectator,'participation','play');
 assert.equal(spectator.spectator,false);assert.equal(spectator.ready,false);assert.equal(r.rematch,undefined);
});
test('every supported group size can prepare and start with precisely the chosen crew',()=>{
 for(let count=2;count<=12;count++){
  const {r,host,spectator,command}=fixture(count),oldPhase=phaseKey(r);
  command(host,'rematchIntent','watch');
  for(const p of r.players.filter(p=>p.id!==host.id&&!p.spectator))command(p,'rematchIntent','play');
  command(spectator,'rematchIntent','play');command(host,'rematch');
  const active=r.players.filter(p=>!p.spectator);assert.equal(active.length,count);
  for(const p of active)command(p,'ready');command(host,'start');
  assert.deepEqual(new Set(r.participantIds),new Set(active.map(p=>p.id)));
  assert.throws(()=>roomAction(r,host,{type:'participation',choice:'play',phase:oldPhase},1000001));
 }
});
test('a client cannot choose a role for another person through an action payload',()=>{
 const {r,host,spectator,now}=fixture();roomAction(r,host,{type:'rematchIntent',choice:'watch',player:spectator.id,phase:phaseKey(r)},now);
 assert.equal(r.rematch!.responses[host.id],'watch');assert.equal(r.rematch!.responses[spectator.id],undefined);
});
