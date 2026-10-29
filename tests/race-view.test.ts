import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {raceOverviewDistance} from '../lib/race-presentation';
import {createCoastalRace} from '../components/olymp/coastal-race';

test('The overview fits the full course across portrait/landscape orbits and a returning follow target',()=>{
 for(const aspect of[.45,.8,1.4,2.5])for(const yaw of[-.7,.1,.65])for(const pitch of[.22,.6,.85])for(const target of[new T.Vector3(),new T.Vector3(9,1,6)]){
  const d=raceOverviewDistance(aspect,yaw,pitch,target),camera=new T.PerspectiveCamera(42,aspect,.1,500);assert.ok(Number.isFinite(d)&&d>0);
  camera.position.set(target.x+Math.sin(yaw)*d,target.y+Math.sin(pitch)*d,target.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateMatrixWorld();
  for(const x of[-18,18])for(const y of[0,8])for(const z of[-12,12]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.9&&Math.abs(p.y)<.7&&p.z<1&&p.z> -1,`Course corner cropped at ${aspect}/${yaw}/${pitch}: ${p.toArray()}`);}
 }
});

test('All two-to-twelve starting and finish lanes leave separate space for their drivers',()=>{
 for(let count=2;count<=12;count++){
  const race=createCoastalRace(new T.Scene(),Array(count).fill('#a1d5ff'));
  assert.ok(race.avatarScale*1.2<race.laneSpacing);
  for(const progress of[0,.35,1]){race.cars.forEach((_,i)=>race.position(i,progress));for(let i=1;i<count;i++){const gap=race.cars[i].position.distanceTo(race.cars[i-1].position);assert.ok(Math.abs(gap-race.laneSpacing)<1e-8);assert.ok(gap>race.avatarScale*1.2);}}
  race.dispose();
 }
});
