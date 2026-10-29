import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {krakenShot,krakenFireAt,krakenTarget} from '../lib/kraken-salvo';
import {createKrakenSalvo} from '../components/olymp/kraken-salvo';
import {createBossSpectacle} from '../components/olymp/boss-spectacle';

test('Only confirmed submissions fire; zero damage does not suppress a valid shot',()=>{
 assert.equal(krakenShot(undefined,0,12,4).confirmed,false);
 assert.equal(krakenShot({id:'0',submitted:false,score:100},0,2,4).confirmed,false);
 const miss=krakenShot({id:'0',submitted:true,score:0,damage:0},0,2,4.3);assert.equal(miss.confirmed,true);assert.equal(miss.hit,false);
 const hit=krakenShot({id:'0',submitted:true,score:1000,damage:0},0,2,4.3);assert.equal(hit.hit,true);
 for(let count=2;count<=12;count++){assert.equal(krakenFireAt(0,count),3.45);assert.equal(krakenFireAt(count-1,count),6.15);for(let i=1;i<count;i++)assert.ok(krakenFireAt(i,count)>krakenFireAt(i-1,count));}
 assert.deepEqual(krakenTarget(0,true,[0,3,-2.6]),[0,3,-2.6]);assert.equal(krakenTarget(0,false,[0,3,-2.6])[1],.15);
});
test('Effects use actual world-space muzzle anchors and distinguish water misses',()=>{
 const scene=new T.Scene(),ship=new T.Group();ship.position.set(2,.5,1);ship.rotation.set(.1,.2,.05);scene.add(ship);
 const guns=Array.from({length:12},(_,i)=>{const g=new T.Group();g.position.set(i,.84,3);ship.add(g);return g;}),ids=guns.map((_,i)=>String(i)),boss=new T.Vector3(0,3,-2.6),fx=createKrakenSalvo(scene,guns,ids,boss);
 const outcomes=ids.map((id,i)=>({id,submitted:i!==2,score:i===0?0:1000,damage:0}));
 fx.update(3.5,true,false,true,outcomes);let snapshot=fx.snapshot();assert.equal(snapshot.shots[0].flash,true);assert.equal(snapshot.shots[2].confirmed,false);assert.ok(snapshot.draws<=4);
 const actual=guns[0].localToWorld(new T.Vector3(0,.455,-.72));assert.deepEqual(snapshot.shots[0].muzzle,actual.toArray());
 fx.update(4.3,true,false,true,outcomes);snapshot=fx.snapshot();assert.equal(snapshot.shots[0].water,true);assert.equal(snapshot.shots[0].hit,false);assert.equal(fx.pools[3].visible,true,'Miss expands a water-surface ring');assert.equal(snapshot.shots[1].hit,true,'A phase-capped valid score still hits');
 fx.update(10,true,false,true,outcomes);assert.equal(fx.snapshot().draws,0);
 fx.update(3.5,true,true,true,outcomes);assert.equal(fx.snapshot().draws,0,'Reduced motion has no moving effects');
 fx.update(3.5,false,false,true,outcomes);assert.equal(fx.snapshot().draws,0,'No reveal events leak into private input');
 fx.dispose();assert.equal(scene.getObjectByName('confirmed-kraken-salvo'),undefined);
});
test('Instance pools stay fixed across rounds, low effects, and the full crew range',()=>{
 for(const count of[2,8,12]){
  const scene=new T.Scene(),guns=Array.from({length:count},()=>new T.Group()),ids=guns.map((_,i)=>String(i)),fx=createKrakenSalvo(scene,guns,ids,new T.Vector3(0,3,-2.6));
  const uuids=fx.pools.map(p=>p.geometry.uuid),outcomes=ids.map(id=>({id,submitted:true,score:0}));
  for(const intense of[true,false])for(const t of[3.5,4.3,6.2,7.8,12]){fx.update(t,true,false,intense,outcomes);assert.ok(fx.snapshot().draws<=4);assert.deepEqual(fx.pools.map(p=>p.geometry.uuid),uuids);}
  assert.equal(new Set(uuids).size,2);const disposed=new Map<string,number>();for(const g of new Set(fx.pools.map(p=>p.geometry)))g.addEventListener('dispose',()=>disposed.set(g.uuid,(disposed.get(g.uuid)??0)+1));fx.dispose();assert.ok([...disposed.values()].every(n=>n===1));
 }
});

test('A miss has no perpetual charge particles or unearned boss shock rings',()=>{
 for(const kind of ['colossus','kraken','dragon'] as const){
 const texture=new T.Texture(),fx=createBossSpectacle(T,kind,new T.Vector3(0,3,-2.6),texture);
 const frame={time:4.3,elapsed:4.3,stage:'roundReveal',impact:0,phaseBroken:false,victory:false,reduced:false,intense:true};
 assert.equal(fx.update(frame).charge,0);fx.root.traverse(o=>{if(o instanceof T.Points)assert.equal(o.visible,false);if(kind!=='colossus'&&o instanceof T.Mesh&&o.geometry instanceof T.RingGeometry)assert.equal(o.visible,false);});
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();fx.root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture.dispose();
 }
});
