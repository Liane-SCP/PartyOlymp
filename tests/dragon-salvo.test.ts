import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {dragonShot,dragonCoinOrigin} from '../lib/dragon-salvo';
import {createDragonSalvo} from '../components/olymp/dragon-salvo';
import {bossStation} from '../lib/boss-stations';

test('Only confirmed earned scores launch coins; phase-capped damage remains a scored hit',()=>{
 for(const outcome of[undefined,{id:'x',submitted:false,score:1600},{id:'x',submitted:true,score:0},{id:'x',submitted:true,score:NaN}])assert.equal(dragonShot(outcome,0,12).coins,0);
 assert.equal(dragonShot({id:'x',submitted:true,score:1600,damage:0},0,12).coins,9);
 assert.equal(dragonShot({id:'x',submitted:true,score:1},0,12).coins,3);
 for(let n=2;n<=12;n++){assert.equal(dragonShot(undefined,0,n).fireAt,3.45);assert.equal(dragonShot(undefined,n-1,n).impactAt,6.9);for(let i=0;i<n;i++){const p=bossStation(i,n);assert.deepEqual(dragonCoinOrigin(i,n),[p.x,.58,p.z-.52]);}}
});
test('Coins leave public plinths, arrive at the boss, and exclude misses and absent players',()=>{
 const scene=new T.Scene(),ids=['a','b','c','d'],target=new T.Vector3(0,4.7,-.2),fx=createDragonSalvo(scene,ids,ids.map(()=>'#aabbcc'),target);
 const outcomes=[{id:'a',submitted:true,score:1600,damage:0},{id:'b',submitted:true,score:0},{id:'c',submitted:false,score:1600},{id:'d',submitted:true,score:800}];
 fx.update(3.45,true,false,true,outcomes);let state=fx.snapshot();assert.equal(state.shots[0].visibleCoins,1);assert.equal(state.shots[0].coins,9);assert.equal(state.shots[1].earned,false);assert.equal(state.shots[2].earned,false);
 const matrix=new T.Matrix4(),position=new T.Vector3();fx.pools[0].getMatrixAt(0,matrix);position.setFromMatrixPosition(matrix);assert.ok(position.distanceTo(new T.Vector3(...dragonCoinOrigin(0,4)))<1e-6);
 fx.update(4.2,true,false,true,outcomes);state=fx.snapshot();assert.equal(state.shots[0].impact,true);fx.pools[0].getMatrixAt(0,matrix);position.setFromMatrixPosition(matrix);assert.ok(position.distanceTo(target)<1e-6);
 fx.update(3.7,true,false,false,outcomes);assert.equal(fx.snapshot().shots[0].visibleCoins,3);assert.equal(fx.snapshot().shots[0].coins,9,'Lower effects preserve public earned strength');
 for(const [reveal,reduced]of[[false,false],[true,true]]){fx.update(3.7,reveal,reduced,true,outcomes);assert.equal(fx.snapshot().draws,0);}
 fx.update(10,true,false,true,outcomes);assert.equal(fx.snapshot().draws,0);
 fx.dispose();assert.equal(scene.getObjectByName('confirmed-dragon-coin-salvo'),undefined);
});
test('All crew sizes use two fixed pools with stable resources and exactly-once disposal',()=>{
 for(const n of[2,8,12]){
  const scene=new T.Scene(),ids=Array.from({length:n},(_,i)=>String(i)),fx=createDragonSalvo(scene,ids,ids.map(()=>'#ffbb66'),new T.Vector3(0,4.7,-.2)),geometries=fx.pools.map(p=>p.geometry),outcomes=ids.map(id=>({id,submitted:true,score:1600}));
  assert.equal(fx.pools[0].count,n*9);
  for(let round=0;round<3;round++)for(let t=0;t<12;t+=.1){fx.update(t,true,false,true,outcomes);assert.ok(fx.snapshot().draws<=2);assert.deepEqual(fx.pools.map(p=>p.geometry),geometries);}
  let disposed=0;geometries.forEach(g=>g.addEventListener('dispose',()=>disposed++));fx.dispose();assert.equal(disposed,2);
 }
});
