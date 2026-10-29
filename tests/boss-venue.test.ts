import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {bossStation} from '../lib/boss-stations';
import {createBossVenue,type BossVenueFrame} from '../components/olymp/boss-venue';
import type {BossArena} from '../components/olymp/boss-models';
const players=Array.from({length:12},(_,i)=>({id:String(i),color:`#${(0xa0b0c0+i*200).toString(16)}`}));
function arena():BossArena{return {root:new T.Group(),boss:new T.Group(),target:new T.Vector3(),playerHeight:0,palette:{background:0,fog:0,key:0,glow:0},update(){}};}
const frame=():BossVenueFrame=>({time:1,elapsed:0,phase:0,stage:'answer',impact:0,breakProgress:0,victory:0,motion:0,submitted:{},outcomes:[],active:true});
test('Workstations preserve a separate player position behind each cannon for two to twelve crew',()=>{
 for(let count=2;count<=12;count++){const points=Array.from({length:count},(_,i)=>bossStation(i,count,true));for(const p of points){assert.ok(Math.abs(p.x)<=5.4);assert.ok(Math.abs(p.z-p.cannonZ-.85)<1e-9);}for(let i=1;i<count;i++)assert.ok(points[i].x-points[i-1].x>.97);}
});
test('Authored hull is a valid compact GLB, preserves the deck, and contains all stations',()=>{
 const b=readFileSync('public/adventure-models/watercraft/ship-hull.glb'),n=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+n).toString()),bin=b.subarray(28+n),p=j.meshes[0].primitives[0],a=j.accessors[p.attributes.POSITION],v=j.bufferViews[a.bufferView],positions=Array.from({length:a.count},(_,i)=>[0,1,2].map(c=>bin.readFloatLE(v.byteOffset+i*12+c*4))),ia=j.accessors[p.indices],iv=j.bufferViews[ia.bufferView],indices=Array.from({length:ia.count},(_,i)=>bin.readUInt16LE(iv.byteOffset+i*2));
 assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);assert.ok(positions.every(row=>row.every(Number.isFinite)&&row[1]<=2.45001));assert.ok(indices.every(i=>i<positions.length));assert.ok(positions.some(row=>Math.abs(row[1]-2.1)<1e-5));
 function inside(x:number,z:number){for(let i=0;i<indices.length;i+=3){const[a,b,c]=indices.slice(i,i+3).map(v=>positions[v]),den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-7)continue;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,w=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;if(u>=-1e-5&&w>=-1e-5&&u+w<=1.00001)return true;}return false;}
 const scale=14/(a.max[2]-a.min[2]),centerZ=(a.max[2]+a.min[2])/2,centerX=(a.max[0]+a.min[0])/2;
 for(let count=2;count<=12;count++)for(let i=0;i<count;i++){const station=bossStation(i,count,true);for(const z of[station.z,station.cannonZ+.5])assert.ok(inside(centerX+(5.1-z)/scale,centerZ+station.x/scale),`Unsupported deck station ${count}/${i}`);}
});
test('Only the local confirmed dice enter the temple, and actual phase transitions open seals',()=>{
 const scene=new T.Scene(),v=createBossVenue(scene,arena(),'colossus',players,'0'),f=frame();f.mineDice={dice:[1,2,3,4,5],held:[true,false,false,false,false],rolls:1};f.outcomes=[{id:'1',dice:[6,6,6,6,6],damage:999}];v.update(f);assert.deepEqual(v.root.userData.ownDice,[1,2,3,4,5]);assert.equal(v.root.userData.readyCount,0);assert.equal(v.root.userData.phaseSeals,3);
 f.phase=1;f.submitted={'0':true};v.update(f);assert.equal(v.root.userData.phaseSeals,2);assert.equal(v.root.getObjectByName('temple-phase-seal-0')?.visible,false,'Completed seal cannot protrude below the temple floor');assert.equal(v.root.userData.readyCount,1);f.phase=2;v.update(f);assert.equal(v.root.userData.phaseSeals,1);v.dispose();
});
test('The dragon altar never reveals a price during input and clears its reveal flag next round',()=>{
 const scene=new T.Scene(),v=createBossVenue(scene,arena(),'dragon',players,'0'),f=frame();f.price=99999;v.update(f);assert.equal(v.root.userData.priceVisible,false);f.stage='roundReveal';f.elapsed=2.7;v.update(f);assert.equal(v.root.userData.priceVisible,false);f.elapsed=2.8;v.update(f);assert.equal(v.root.userData.priceVisible,true);f.stage='answer';f.elapsed=0;delete f.price;v.update(f);assert.equal(v.root.userData.priceVisible,false);v.dispose();
});

test('Rune dice cannot be held before rolling or after the last roll; a fully held hand cannot reroll',()=>{
 const v=createBossVenue(new T.Scene(),arena(),'colossus',players,'0'),f=frame(),holds=v.pickables.filter(p=>String(p.userData.pick).startsWith('hold'));
 v.update(f);assert.equal(holds.length,5);assert.ok(holds.every(p=>p.userData.pickDisabled));
 f.mineDice={dice:[1,2,3,4,5],held:[false,false,false,false,false],rolls:1};v.update(f);assert.ok(holds.every(p=>!p.userData.pickDisabled));
 f.mineDice.held=[true,true,true,true,true];v.update(f);assert.equal(v.pickables.find(p=>p.userData.pick==='roll')?.userData.pickDisabled,true);
 f.mineDice.rolls=3;v.update(f);assert.ok(holds.every(p=>p.userData.pickDisabled));assert.equal(v.pickables.find(p=>p.userData.pick==='strike')?.userData.pickDisabled,false);
 f.active=false;v.update(f);assert.ok(v.pickables.every(p=>p.userData.pickDisabled));v.dispose();
});
