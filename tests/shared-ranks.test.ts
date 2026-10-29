import test from "node:test";
import assert from "node:assert/strict";
import {ranking} from "../lib/game/scoring";
import {createRoom,player,tickRoom,publicRoom} from "../lib/game/room";
test("Competition ranks skip occupied places and use only total points",()=>{
  const people=[200,200,150,150,100].map((points,i)=>({id:`p${i}`,points,wins:i,seconds:10-i}));
  assert.deepEqual(ranking(people).map(p=>p.rank),[1,1,3,3,5]);
  assert.deepEqual(ranking(people).map(p=>p.points),[200,200,150,150,100]);
});
test("Existing rooms migrate former tie-break ranks without changing points or wins",()=>{
  const now=1000000,a=player("Ada",0,now,0),r=createRoom("TIE",a,now),b=player("Ben",1,now,1);
  r.players.push(b);r.participantIds=[a.id,b.id];r.rulesVersion=5;
  a.points=b.points=200;a.wins=0;b.wins=4;a.previousRank=2;b.previousRank=1;
  r.previousStandings=[{id:b.id,points:100,rank:1,wins:4,seconds:1},{id:a.id,points:100,rank:2,wins:0,seconds:0}];
  tickRoom(r,now);
  assert.equal(r.rulesVersion,6);assert.deepEqual(r.previousStandings.map(p=>p.rank),[1,1]);
  assert.deepEqual(r.players.map(p=>p.previousRank),[1,1]);
  assert.deepEqual(publicRoom(r,a.id,now).standings.map(p=>p.rank),[1,1]);
  assert.equal(b.wins,4);assert.equal(a.points,200);assert.equal(b.points,200);
  tickRoom(r,now+1);assert.deepEqual(r.previousStandings.map(p=>p.rank),[1,1]);
});
