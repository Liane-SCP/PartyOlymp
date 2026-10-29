import test from "node:test";
import assert from "node:assert/strict";
import {gameShow,updatePersonalBests,type PersonalBests} from "../lib/game/gameshow";
import {createRoom,player,roomAction,tickRoom,publicRoom} from "../lib/game/room";
import { games } from "../lib/game/games";
import type {Result,Selection} from "../lib/game/types";
const result=(id:string,raw:number,rank=1,valid=true):Result=>({id,raw,rank,valid,detail:null,points:100});
const settings:Selection={id:"color",rounds:1,seconds:20};
const rows=[{id:"a",name:"Ada",rank:1,points:200,lastPoints:100},{id:"b",name:"Ben",rank:2,points:170,lastPoints:50},{id:"c",name:"Cora",rank:3,points:120,lastPoints:0}];
const input=()=>({standings:structuredClone(rows),previousStandings:[{id:"a",rank:1,points:100},{id:"b",rank:2,points:120},{id:"c",rank:3,points:120}],history:[{id:"first",game:"color" as const,results:[result("a",30),result("b",20,2),result("c",10,3)]}],selection:[settings],index:0});

test("Preview chooses the closest real rivalry, names players and reports actual point gaps",()=>{
  const s=gameShow(input());
  assert.equal(s.preview[0].kind,"duel");assert.deepEqual(s.preview[0].players,["b","a"]);
  assert.match(s.preview[0].text,/Ben fehlen 30 Punkte/);assert.equal(s.preview[0].metric,"30 PUNKTE ABSTAND");
  assert.deepEqual(s.preview[0].headToHead,{left:0,right:1,ties:0});
  assert.deepEqual(gameShow(input()),s);
});
test("Equal points share a place without inventing an overtake",()=>{
  const r=input();r.standings[1].points=200;
  assert.match(gameShow(r).preview[0].text,/gleicher Platz/);
  assert.ok(!gameShow(r).recap.some(s=>s.kind==="lead"));
  r.standings[1].rank=1;assert.match(gameShow(r).preview[0].text,/gleicher Platz/);
  assert.equal(gameShow(r).recap.find(s=>s.kind==="lead")?.label,"GETEILTE FÜHRUNG");
});
test("Opening avoids fake rivalries and handles an empty spectator lobby",()=>{
  const r=input();r.history=[];
  assert.equal(gameShow(r).preview[0].kind,"opening");assert.deepEqual(gameShow(r).recap,[]);
  r.standings=[];assert.deepEqual(gameShow(r),{preview:[],recap:[]});
});
test("Recap detects a new leader, a two-place climb and a genuine winning streak",()=>{
  const r=input();r.previousStandings=[{id:"a",rank:4,points:100},{id:"b",rank:5,points:120},{id:"c",rank:1,points:120}];
  r.history.unshift({id:"previous",game:"color",results:[result("a",20)]});
  const s=gameShow(r).recap;
  assert.equal(s[0].kind,"lead");assert.deepEqual(s[0].players,["a"]);
  assert.ok(s.some(m=>m.kind==="comeback"&&m.players[0]==="b"));
  assert.match(s.find(m=>m.kind==="streak")!.metric!,/2 SIEGE/);
  r.history[0].results[0].valid=false;
  assert.ok(!gameShow(r).recap.some(m=>m.kind==="streak"));
});
test("Joining a shared lead announces a shared lead; a shared victory stays shared",()=>{
  const r=input();r.standings[1].rank=1;r.standings[1].points=200;
  const lead=gameShow(r).recap.find(m=>m.kind==="lead")!;
  assert.equal(lead.label,"GETEILTE FÜHRUNG");assert.match(lead.text,/geteilt/);
  r.previousStandings=[];r.history[0].results[1].rank=1;
  assert.equal(gameShow(r).recap[0].label,"GETEILTER DISZIPLINSIEG");
});
test("Personal records require comparable settings, finite valid results and a real improvement",()=>{
  const bests:PersonalBests={};
  assert.deepEqual(updatePersonalBests(bests,settings,3,[result("a",50)]),[]);
  assert.deepEqual(updatePersonalBests(bests,settings,3,[result("a",40)]),[]);
  assert.deepEqual(updatePersonalBests(bests,settings,3,[result("a",50+Number.EPSILON*50)]),[]);
  assert.deepEqual(updatePersonalBests(bests,{...settings,rounds:2},3,[result("a",80)]),[]);
  assert.deepEqual(updatePersonalBests(bests,{...settings,seconds:30},3,[result("a",80)]),[]);
  assert.deepEqual(updatePersonalBests(bests,settings,12,[result("a",80)]),[]);
  assert.deepEqual(updatePersonalBests(bests,settings,3,[result("a",100,1,false),result("b",Infinity)]),[]);
  assert.deepEqual(updatePersonalBests(bests,settings,3,[result("a",60)]),[{player:"a",previous:50,raw:60,game:"color"}]);
  assert.deepEqual(updatePersonalBests(bests,settings,3,[result("a",60)]),[]);
  // Higher scores can still be negative (time-based scoring).
  updatePersonalBests(bests,settings,3,[result("negative",-80)]);
  assert.equal(updatePersonalBests(bests,settings,3,[result("negative",-60)])[0].previous,-80);
});
test("All twelve personal records remain accessible and inactive players are not announced",()=>{
  const r=input();const records=Array.from({length:12},(_,i)=>({player:`p${i}`,previous:10,raw:20,game:"color" as const}));
  r.standings=records.map((x,i)=>({id:x.player,name:`Crew ${i}`,rank:i+1,points:100-i,lastPoints:5}));
  const history={...r.history[0],recordBreaks:[...records,{...records[0],player:"spectator"}]};
  const s=gameShow({...r,history:[history]});
  assert.equal(s.recap.filter(s=>s.kind==="record").length,12);
  assert.ok(!s.recap.some(s=>s.players.includes("spectator")));
});
test("Server stores records exactly once, keeps them through a rematch, and sends the same safe show to everyone",()=>{
  const now=1000000,a=player("Ada",0,now,0),r=createRoom("SHOW",a,now);
  const b=player("Ben",1,now,1);r.players.push(b);r.participantIds=[a.id,b.id];r.startedAt=now;r.selection=[settings];
  r.game=games.color.init({ids:r.participantIds,now,settings,used:[],random:()=>0});
  r.game.results=[result(a.id,50),result(b.id,40,2)];r.phase="reveal";r.deadline=now;
  tickRoom(r,now);assert.equal(r.history.length,1);const initial=structuredClone(r.personalBests);
  tickRoom(r,now+1);assert.deepEqual(r.personalBests,initial);
  r.phase="podium";roomAction(r,a,{type:"rematch"},now+2);assert.deepEqual(r.personalBests,initial);
  r.players.forEach(p=>p.ready=true);roomAction(r,a,{type:"start"},now+3);
  r.phase="reveal";r.deadline=now+4;r.game=games.color.init({ids:r.participantIds,now,settings,used:[],random:()=>0});
  r.game.results=[result(a.id,60),result(b.id,40,2)];tickRoom(r,now+4);
  assert.equal(r.history[0].recordBreaks!.length,1);
  const left=publicRoom(r,a.id,now+5),right=publicRoom(r,b.id,now+5);
  assert.deepEqual(left.gameShow,right.gameShow);assert.ok(left.gameShow.recap.some(m=>m.kind==="record"));
  const wire=JSON.stringify(left);assert.ok(!wire.includes(a.token));assert.ok(!wire.includes('"personalBests"'));
});
