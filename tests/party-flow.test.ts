import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,player,roomAction,tickRoom,publicRoom,context,phaseKey} from '../lib/game/room';
import {PARTY_FLOW,mapAvailable,briefingFormat} from '../lib/game/party-flow';
import {games} from '../lib/game/games';
import {nextSceneTarget} from '../lib/scene-preload';
import type {Selection} from '../lib/game/types';

function fixture(){
  const now=1000000,host=player('Host',0,now,0),room=createRoom('FLOW23',host,now);
  room.players.push(player('Crew',1,now,1));
  room.selection=[{id:'colossus',rounds:3,seconds:20},{id:'picture',rounds:1,seconds:20},{id:'picture',rounds:2,seconds:30}];
  room.players.forEach(p=>p.ready=true);
  return {room,host,now};
}

for (const phase of ['travel','rules','countdown','playing','reveal'] as const) {
  test(`Temporary skip during ${phase}: host only, no points, stale requests rejected`,()=>{
    const {room:r,host,now}=fixture();
    roomAction(r,host,{type:'start'},now);
    tickRoom(r,r.deadline);
    r.players.forEach(p=>p.ready=true);
    tickRoom(r,now+2000);
    tickRoom(r,r.deadline);
    assert.ok(r.game);
    r.phase=phase;
    host.points=123;
    const key=phaseKey(r),plan=structuredClone(r.selection);
    assert.throws(()=>roomAction(r,r.players[1],{type:'testSkip',phase:key},now),/Gastgeber/);
    roomAction(r,host,{type:'testSkip',phase:key},now);
    assert.equal(r.index,1);assert.equal(r.phase,'travel');assert.equal(r.game,null);
    assert.equal(host.points,123);assert.equal(r.history.length,0);
    assert.deepEqual(r.selection,plan);assert.ok(r.players.every(p=>!p.ready));
    assert.equal(r.journey!.travel!.to,1);
    assert.throws(()=>roomAction(r,host,{type:'testSkip',phase:key},now),/bereits vorbei/);
    r.index=r.selection.length-1;
    roomAction(r,host,{type:'testSkip',phase:phaseKey(r)},now);
    assert.equal(r.phase,'podium');assert.equal(r.deadline,0);assert.equal(host.points,123);
    assert.throws(()=>roomAction(r,host,{type:'testSkip',phase:phaseKey(r)},now),/keine Disziplin/);
  });
}
test('Displayed order is binding: no roulette, hidden interludes or settings changes across reloads',()=>{
  const {room:r,host,now}=fixture(),plan=structuredClone(r.selection);
  roomAction(r,host,{type:'start'},now);
  assert.equal(r.phase,'travel');assert.equal(r.draw,undefined);assert.equal(r.wheelEnabled,false);
  assert.deepEqual(r.selection,plan);assert.equal(r.deadline,now+PARTY_FLOW.arrival);
  const loaded=JSON.parse(JSON.stringify(r));tickRoom(loaded,now+200);
  assert.deepEqual(loaded.selection,plan);assert.equal(loaded.phase,'travel');
  assert.equal(nextSceneTarget(publicRoom(r,host.id,now))?.id,'colossus');
  tickRoom(r,r.deadline);assert.equal(r.phase,'rules');
  assert.ok(r.players.every(p=>!p.ready));
});
test('One complete route: ready, countdown, game, one award, standings, synchronized travel, ceremony',()=>{
  const {room:r,host,now}=fixture(),plan=structuredClone(r.selection);
  roomAction(r,host,{type:'start'},now);
  for(let index=0;index<plan.length;index++){
    assert.equal(r.phase,'travel');assert.equal(r.index,index);
    assert.deepEqual(r.selection,plan);
    tickRoom(r,r.deadline);assert.equal(r.phase,'rules');
    let at=r.deadline-PARTY_FLOW.rules+1;
    r.players.forEach(p=>{p.lastSeen=at;roomAction(r,p,{type:'ready'},at);});
    tickRoom(r,at);assert.equal(r.phase,'countdown');
    at=r.deadline;tickRoom(r,at);assert.equal(r.phase,'playing');
    assert.throws(()=>roomAction(r,host,{type:'mapMove',index,x:.7,z:0},at),/Karte/);
    r.game!.stage='done';
    // The normal authoritative award path remains responsible for the result transaction.
    r.game!.results=r.players.map((p,i)=>({id:p.id,raw:100-i*20,valid:true,detail:null}));
    r.phase='reveal';r.deadline=at;
    tickRoom(r,at);assert.equal(r.phase,'standings');assert.equal(r.history.length,index+1);
    const points=r.players.map(p=>p.points);tickRoom(r,at+1);assert.deepEqual(r.players.map(p=>p.points),points);
    roomAction(r,host,{type:'pause'},at+1);assert.equal(r.phase,'paused');
    roomAction(r,host,{type:'continue'},at+2);
    if(index+1<plan.length){assert.equal(r.phase,'travel');assert.equal(r.journey!.travel!.from,index);assert.equal(r.deadline,r.journey!.travel!.at+r.journey!.travel!.duration);}
  }
  assert.equal(r.phase,'podium');assert.equal(r.history.length,plan.length);
  roomAction(r,host,{type:'rematch'},r.startedAt+100000);assert.equal(r.phase,'lobby');assert.deepEqual(r.selection,plan);
});
test('Plan edits revoke consent, an identical save does not, guests cannot configure',()=>{
  const {room:r,host,now}=fixture();
  roomAction(r,host,{type:'configure',selection:r.selection},now);assert.ok(r.players.every(p=>p.ready));
  const changed:Selection[]=[...r.selection].reverse();
  roomAction(r,host,{type:'configure',selection:changed},now);assert.ok(r.players.every(p=>!p.ready));
  assert.throws(()=>roomAction(r,host,{type:'start'},now),/bereit/);
  assert.throws(()=>roomAction(r,r.players[1],{type:'configure',selection:changed},now),/Gastgeber/);
});
test('Legacy roulette migrates without redrawing, changing the displayed route or awarding again',()=>{
  const {room:r,now}=fixture(),plan=structuredClone(r.selection);
  r.rulesVersion=6;r.phase='wheel';r.startedAt=now;r.participantIds=r.players.map(p=>p.id);r.wheelEnabled=true;
  tickRoom(r,now);assert.equal(r.phase,'travel');assert.equal(r.rulesVersion,7);assert.equal(r.draw,undefined);assert.deepEqual(r.selection,plan);
  const deadline=r.deadline;tickRoom(r,now+1);assert.equal(r.deadline,deadline);assert.equal(r.history.length,0);
});
test('Only travel and pause own a map; briefing copy describes the selected game only',()=>{
  for(const phase of ['lobby','rules','countdown','playing','reveal','standings','podium'])assert.equal(mapAvailable(phase),false);
  assert.equal(mapAvailable('travel'),true);assert.equal(mapAvailable('paused'),true);
  assert.match(briefingFormat({id:'dice',rounds:1,seconds:45}),/13 gemeinsame/);
  assert.match(briefingFormat({id:'code',rounds:2,seconds:45}),/ohne Zeitdruck/);
  assert.ok(!briefingFormat({id:'picture',rounds:1,seconds:20}).includes('Blackjack'));
});
test('Reactions never become timing clues in the timing minigame',()=>{
  const {room:r,host,now}=fixture();r.participantIds=r.players.map(p=>p.id);r.phase='playing';
  r.selection=[{id:'timing',rounds:1,seconds:45}];r.game=games.timing.init(context(r,now));
  assert.throws(()=>roomAction(r,host,{type:'emote',emote:0},now),/Reaktionen/);
  assert.equal(r.emotes.length,0);r.phase='standings';roomAction(r,host,{type:'emote',emote:0},now);assert.equal(r.emotes.length,1);
});
