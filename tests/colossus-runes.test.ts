import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {runeChargeFrame,runeRollFrame} from '../lib/colossus-runes';
import {createBossVenue,type BossVenueFrame} from '../components/olymp/boss-venue';
import {match} from './browser-game-engine';
import type {BossArena} from '../components/olymp/boss-models';
const arena=():BossArena=>({root:new T.Group(),boss:new T.Group(),target:new T.Vector3(),playerHeight:0,palette:{background:0,fog:0,key:0,glow:0},update(){}});
const frame=():BossVenueFrame=>({now:10370,time:999,elapsed:0,phase:0,stage:'answer',impact:0,breakProgress:0,victory:0,motion:1,submitted:{},outcomes:[],active:true,mineDice:{dice:[1,2,3,4,5],held:[true,false,false,false,false],rolls:2,rollId:2,rollStartedAt:10000}});

test('A real private boss roll publishes its authoritative clock only to its owner and resets next attack',()=>{
 const m=match('colossus',2),g=m.room.game!,ids=m.room.participantIds;g.deadline=Date.now()-1;m.view();
 m.act(ids[0],{type:'roll',round:1});const own=m.view(ids[0]).room.game as any,other=m.view(ids[1]).room.game as any;
 assert.ok(own.mine.rollStartedAt>0);assert.equal(own.events.find((e:any)=>e.type==='colossusRoll').at,own.mine.rollStartedAt);
 assert.equal(other.mine.rollStartedAt,null);assert.ok(!('players' in other));assert.ok(other.roster.every((p:any)=>!('dice' in p)&&!('rollStartedAt' in p)));
 const kept=own.mine.dice[0];m.act(ids[0],{type:'roll',round:1,held:[true,false,false,false,false]});assert.equal((m.view(ids[0]).room.game as any).mine.dice[0],kept);
 for(const id of ids){if(!g.players[id].rolls)m.act(id,{type:'roll',round:1});m.act(id,{type:'strike',round:1});}m.view();assert.equal(g.stage,'roundReveal');g.deadline=Date.now()-1;m.view();assert.equal((m.view(ids[0]).room.game as any).mine.rollStartedAt,null);
});
test('Only fresh confirmed throws move; missing legacy clocks and reduced motion settle quietly',()=>{
 const hand=frame().mineDice!;assert.ok(runeRollFrame(hand,10370,true).rolling);assert.equal(runeRollFrame(hand,11000,true).rolling,false);assert.equal(runeRollFrame(hand,9999,true).rolling,false);
 assert.equal(runeRollFrame(hand,10370,false).rolling,false);assert.equal(runeRollFrame({...hand,rollStartedAt:undefined},10370,true).rolling,false);
});
test('Actual dice poses agree across renderer clocks, preserve held dice and settle on confirmed upper faces',()=>{
 const players=[{id:'a',color:'#aaddcc'},{id:'b',color:'#ccbbdd'}],a=createBossVenue(new T.Scene(),arena(),'colossus',players,'a'),b=createBossVenue(new T.Scene(),arena(),'colossus',players,'a'),f=frame();
 a.update(f);b.update({...f,time:1});assert.deepEqual(a.root.userData.ownRoll,b.root.userData.ownRoll);assert.ok(a.root.userData.ownRoll.rolling);
 const held=a.root.getObjectByName('own-rune-die-0')!,moving=a.root.getObjectByName('own-rune-die-1')!;assert.equal(held.position.y,.055);assert.deepEqual(held.rotation.toArray().slice(0,3),[0,0,0]);assert.ok(moving.position.y>0);
 const before=held.position.toArray();a.update({...f,now:10500});assert.deepEqual(held.position.toArray(),before);
 a.update({...f,now:12000});assert.equal(a.root.userData.ownRoll.rolling,false);
 for(let i=0;i<5;i++){const die=a.root.getObjectByName('own-rune-die-'+i) as T.Mesh,uv=die.geometry.getAttribute('uv');let u=0,v=0;for(let k=8;k<12;k++){u+=uv.getX(k)/4;v+=uv.getY(k)/4;}assert.equal(1+Math.floor(u*3)+(1-Math.floor(v*2))*3,f.mineDice!.dice[i]);assert.deepEqual(die.rotation.toArray().slice(0,3),[0,0,0]);}
 a.dispose();b.dispose();
});
test('Readiness ignores stale private outcomes, and energy drains at the shared projectile launch',()=>{
 assert.deepEqual(runeChargeFrame('answer',99,true,{damage:1},0,12,true),runeChargeFrame('answer',99,true,{damage:999999},0,12,true));
 assert.equal(runeChargeFrame('answer',0,false,{damage:999},0,12,true).charge,0);assert.equal(runeChargeFrame('intro',0,true,{damage:999},0,12,true).charge,0);
 const launch=3.45+11*2.7/11;assert.equal(runeChargeFrame('roundReveal',launch-.5,true,{damage:42},11,12,true).charge,1);assert.ok(runeChargeFrame('roundReveal',launch-.2,true,{damage:42},11,12,true).charge<1);assert.equal(runeChargeFrame('roundReveal',launch,true,{damage:42},11,12,true).charge,0);
 assert.equal(runeChargeFrame('roundReveal',1,true,{damage:0},0,12,true).charge,0);assert.equal(runeChargeFrame('roundReveal',launch-.2,true,{damage:42},11,12,false).charge,1);
});
test('All public stations share two instanced draws and release their instance resources',()=>{
 for(let count=2;count<=12;count++){
  const players=Array.from({length:count},(_,i)=>({id:'p'+i,color:'#aaddcc'})),v=createBossVenue(new T.Scene(),arena(),'colossus',players,'observer'),f=frame();delete f.mineDice;f.submitted=Object.fromEntries(players.map(p=>[p.id,true]));v.update(f);
  assert.equal(v.root.userData.ownDice.length,0);assert.ok(v.root.userData.runeCharge.every((r:any)=>r.ready&&r.charge===1&&r.launch===null));
  const rings=v.root.getObjectByName('public-rune-charge-rings') as T.InstancedMesh,sparks=v.root.getObjectByName('public-rune-charge-sparks') as T.InstancedMesh;assert.equal(rings.count,count);assert.equal(sparks.count,count);let disposed=0;rings.addEventListener('dispose',()=>disposed++);sparks.addEventListener('dispose',()=>disposed++);
  const before=[...sparks.instanceMatrix.array];v.update({...f,motion:0,time:50,now:50000});const reduced=[...sparks.instanceMatrix.array];v.update({...f,motion:0,time:100,now:100000});assert.deepEqual([...sparks.instanceMatrix.array],reduced);assert.notDeepEqual(before,reduced);
  v.dispose();assert.equal(disposed,2);
 }
});
