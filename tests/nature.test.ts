import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { createRoom,player,roomAction,publicRoom,tickRoom } from "../lib/game/room";
import { beginJourney } from "../lib/game/journey";
import { sampleMapMove } from "../lib/game/journey-motion";
import { spacedBosses } from "../lib/game/wheel";
import { isBoss } from "../lib/game/boss-rules";
import { coastProfile,createIslandTerrain } from "../components/olymp/journey-terrain";
import { createJourneyScene } from "../components/olymp/journey-scene";
import type { Selection } from "../lib/game/types";
import { journeyLayout } from "../lib/journey-world";
function fixture(){
  const now=1000000,host=player("Nova",0,now,0),room=createRoom("NAT234",host,now);
  room.players.push(player("Luna",1,now,1));room.participantIds=room.players.map(p=>p.id);
  room.selection=spacedBosses(["colossus","kraken","dragon"].map(id=>({id:id as any,rounds:3,seconds:30})));
  room.startedAt=now;room.phase="rules";room.deadline=now+45000;beginJourney(room);return {room,host,now};
}
test("Boss-only pools acquire real interludes, preserve boss settings and never start with or chain bosses",()=>{
  const selected:Selection[]=[{id:"colossus",rounds:6,seconds:45},{id:"kraken",rounds:9,seconds:30},{id:"dragon",rounds:3,seconds:60}];
  const plan=spacedBosses(selected);assert.equal(plan.length,6);assert.deepEqual(plan.filter(s=>isBoss(s.id)),selected);
  assert.ok(!isBoss(plan[0].id));for(let i=1;i<plan.length;i++)assert.ok(!(isBoss(plan[i].id)&&isBoss(plan[i-1].id)));
  assert.ok(isBoss(plan.at(-1)!.id));
});
test("Map movement is authenticated, bounded, synchronized, persisted and follows the safe walking ring",()=>{
  const {room:r,host,now}=fixture();r.phase="paused";
  roomAction(r,host,{type:"mapMove",index:0,x:-0.5,z:0.6},now);
  const move=r.journey!.moves![host.id];assert.ok(move.duration>=650);
  for(let t=0;t<=1;t+=0.05){const p=sampleMapMove(move,now+t*move.duration);assert.ok(Math.hypot(p.x,p.z)>=0.55&&Math.hypot(p.x,p.z)<=0.751);}
  const a=publicRoom(r,host.id,now).journey!.moves,b=publicRoom(r,r.players[1].id,now).journey!.moves;assert.deepEqual(a,b);
  const loaded=JSON.parse(JSON.stringify(r));assert.deepEqual(loaded.journey.moves,a);
  assert.throws(()=>roomAction(r,host,{type:"mapMove",index:0,x:1,z:0},now+10),/Bewegung/);
  assert.throws(()=>roomAction(r,host,{type:"mapMove",index:1,x:1,z:0},now+400),/vergangenen/);
  assert.throws(()=>roomAction(r,host,{type:"mapMove",index:0,x:NaN,z:0},now+400),/Ungültiges/);
  assert.throws(()=>roomAction(r,host,{type:"mapMove",index:0,x:100,z:0},now+400),/außerhalb/);
  const observer=player("Zuschauer",2,now,2);observer.spectator=true;r.players.push(observer);
  assert.throws(()=>roomAction(r,observer,{type:"mapMove",index:0,x:0,z:1},now+400),/aktive Crew/);
});
test("Next discipline starts synchronized crew travel; a reload preserves progress and rejects teleporting midflight",()=>{
  const {room:r,host,now}=fixture();r.phase="standings";r.deadline=now;
  tickRoom(r,now);assert.equal(r.index,1);assert.deepEqual({...r.journey!.travel,starts:undefined},{from:0,to:1,at:now,duration:6500,starts:undefined});assert.ok(r.journey!.travel!.starts![host.id]);
  assert.throws(()=>roomAction(r,host,{type:"mapMove",index:1,x:1,z:0},now+1000),/noch auf dem Weg/);
  const loaded=JSON.parse(JSON.stringify(r));assert.deepEqual(loaded.journey.travel,r.journey!.travel);
  roomAction(r,host,{type:"mapMove",index:1,x:1,z:0},now+7000);assert.equal(r.journey!.moves![host.id].index,1);
});
test("Legacy rooms preserve the complete displayed route without adding games",()=>{
 const {room:r,now}=fixture();r.journey!.orderVersion=1;const plan=structuredClone(r.selection);tickRoom(r,now);
 assert.deepEqual(r.selection,plan);assert.equal(r.journey!.orderVersion,3);tickRoom(r,now+100);assert.deepEqual(r.selection,plan);
});

test("Organic coasts have varying radii, consistent area and upward-facing walkable geometry",()=>{
  const c=coastProfile(7),d=coastProfile(8);assert.ok(Math.max(...c)-Math.min(...c)>0.2);assert.notDeepEqual(c,d);
  let area=0;for(let i=0;i<c.length;i++)area+=c[i]*c[(i+1)%c.length]*Math.sin(Math.PI*2/c.length)/2;
  assert.ok(Math.abs(area-Math.PI)<1e-9);
  const g=createIslandTerrain(T,3.2,7,"#819a6e"),normal=g.getAttribute("normal");assert.ok(normal.getY(65)>0.8);g.dispose();
});
test("The actual rendered characters travel, walk and react to shared emotes",()=>{
  const {room:r,host,now}=fixture(),crew=r.players.map(p=>({...p,look:{shape:0,accessory:2,color:0}}));
  const world=createJourneyScene(T,r.selection,1,1,crew,1,[]);
  assert.ok(world.characters.every(c=>c.root.userData.avatarStyle==="boss-sprite"&&c.root.children.some(o=>o instanceof T.Sprite)));
  const travel={from:0,to:1,at:now,duration:6500};
  world.update(0,false,{now:now+100,travel});const first=world.characters[0].root.position.clone();
  world.update(2,false,{now:now+3500,travel});assert.ok(first.distanceTo(world.characters[0].root.position)>3);
  world.update(4,false,{now:now+7000,travel,emotes:[{player:host.id,emote:37,at:now+6900}]});
  assert.equal(world.characters[0].root.userData.emote,37);assert.equal(world.characters[1].root.userData.emote,null);
  const position=world.characters[0].root.position.clone();
  const move={index:1,from:{x:0.6,z:0.3},to:{x:-0.6,z:0.3},at:now+7000,duration:2000};
  world.update(5,false,{now:now+8000,moves:{[host.id]:move}});assert.ok(position.distanceTo(world.characters[0].root.position)>0.2);
  world.dispose();
});
test("The odyssey groups discoveries into rising realms ending at bosses, including the largest filled pool",()=>{
  const selection=spacedBosses(Array.from({length:40},(_,i)=>({id:(["colossus","kraken","dragon"] as const)[i%3],rounds:3,seconds:30})));
  const nodes=journeyLayout(selection);assert.equal(nodes.length,80);assert.deepEqual(nodes,journeyLayout(selection));
  assert.ok(nodes.at(-1)!.position[1]>nodes[0].position[1]+100);
  for(const a of nodes)for(const b of nodes)if(a.index>b.index)assert.ok(Math.hypot(a.position[0]-b.position[0],a.position[2]-b.position[2])>a.radius+b.radius+5);
  assert.equal(new Set(nodes.map(n=>n.chapter)).size,40);
  for(const n of nodes.filter(n=>n.boss))assert.ok(!nodes[n.index+1]||nodes[n.index+1].chapter>n.chapter);
});
