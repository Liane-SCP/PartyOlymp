import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RaceMotorDrive,audibleRaceMotors} from '../lib/race-motor-drive';
import {createAdventureScene} from '../components/olymp/adventure-scene';
const driver={id:'a',position:[0,1,0] as [number,number,number]};
const game=(progress:number,finishedAt:number|null=null)=>({stage:'answer',round:0,startedAt:1000,racers:{a:{progress,finishedAt}},mine:{progress:100000}});

test('Only a new public advance revs a motor; a late join, draft or error cannot accelerate it',()=>{
 const drive=new RaceMotorDrive(),sample=(progress:number,now:number)=>drive.update(game(progress),now,[driver],'a')[0].power;
 assert.equal(sample(20,1000),0);assert.equal(sample(20,1200),0);
 const power=sample(24,1500);assert.ok(power>0);assert.equal(sample(24,1600),power);
 assert.ok(sample(24,2500)<power*.1);assert.ok(sample(22,2501)<power*.1);
 assert.equal(sample(22,5002),0,'A long hidden interval settles without replay');
 assert.ok(sample(23,5200)>0);assert.equal(sample(23,5000),0,'A backwards clock resets safely');
});
test('Finish, inactive phases, missing racers and a new round stop or reset the motor',()=>{
 const drive=new RaceMotorDrive();drive.update(game(0),1000,[driver],'a');assert.ok(drive.update(game(5),1500,[driver],'a')[0].power>0);
 assert.deepEqual(drive.update(game(5,0),1600,[driver],'a'),[]);
 assert.deepEqual(drive.update({...game(5),stage:'roundReveal'},1700,[driver],'a'),[]);
 assert.deepEqual(drive.update({...game(5),racers:{}},1800,[driver],'a'),[]);
 assert.equal(drive.update({...game(5),round:1,startedAt:2000},2000,[driver],'a')[0].power,0);
 assert.deepEqual(drive.update(game(5),2100,[{...driver,position:[NaN,1,0]}],'a'),[]);
});
test('At most four motors are audible, retaining the own vehicle and nearest public rivals',()=>{
 const rows=Array.from({length:12},(_,i)=>({id:'p'+i,position:[i,1,0] as [number,number,number],power:.5,own:i===11}));
 assert.deepEqual(audibleRaceMotors(rows,[0,1,0]).map(r=>r.id),['p11','p0','p1','p2']);
 assert.deepEqual(audibleRaceMotors(rows,[5,1,0],50).map(r=>r.id),['p11','p5','p4','p6']);
 assert.equal(audibleRaceMotors(rows,[0,1,0],0).length,0);assert.equal(rows[0].id,'p0','Selection must not reorder source rows');
});
test('Motor anchors follow actual rendered vehicle occupants for all crew sizes and disappear at reveal',()=>{
 for(let count=2;count<=12;count++){
  const crew=Array.from({length:count},(_,i)=>({id:'p'+i,color:'#bbddaa'})),world=createAdventureScene(T,'typer',crew,'p0'),camera=new T.PerspectiveCamera();
  const g={id:'typer',stage:'answer',round:0,startedAt:1000,text:'A public race text',racers:Object.fromEntries(crew.map((p,i)=>[p.id,{progress:i,finishedAt:null}]))};
  world.update(0,1000,g);const motors=world.audioFrame(camera).motors!;assert.equal(motors.length,count);
  for(const actor of world.actors){const motor=motors.find(row=>row.id===actor.id)!;assert.deepEqual(motor.position,[actor.root.position.x,actor.root.position.y+.15,actor.root.position.z]);assert.equal(motor.power,0);assert.equal(motor.own,actor.id==='p0');}
  world.update(1,2000,{...g,stage:'roundReveal'});assert.deepEqual(world.audioFrame(camera).motors,[]);world.dispose();
 }
});
