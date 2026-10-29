import test from 'node:test';import assert from 'node:assert/strict';import {PerspectiveCamera,Vector3} from 'three';
import {krakenPortrait,krakenActionPose,krakenTrackedStation} from '../lib/kraken-camera';import {bossStation} from '../lib/boss-stations';

test('Portrait action keeps the own face and boss head between header and input area',()=>{
 for(const [width,height] of [[320,700],[390,844],[430,932]])for(const count of[2,8,12])for(const index of[0,Math.floor(count/2),count-1]){
  const station=bossStation(index,count,true),pose=krakenActionPose(height,station.x,false),camera=new PerspectiveCamera(42,width/height,.1,120);camera.position.fromArray(pose.position);camera.lookAt(new Vector3(...pose.aim));camera.updateMatrixWorld();
  const project=(p:number[])=>{const v=new Vector3(...p).project(camera);return {x:(v.x+1)*width/2,y:(1-v.y)*height/2};},own=project([station.x,1.31,station.z]),head=project([0,6.8,-2.6]);
  assert.ok(own.x>20&&own.x<width-20);assert.ok(own.y>190&&own.y<height-240);assert.ok(head.y>190&&head.y<own.y-80);
 }
 assert.equal(krakenPortrait(390,844),true);assert.equal(krakenPortrait(844,390),false);assert.equal(krakenPortrait(568,320),false);
});
test('Salvo tracking follows confirmed public firing stations and returns to the own place',()=>{
 const ids=['a','b','c'],outcomes=[{id:'b',submitted:true},{id:'a',submitted:false},{id:'c',submitted:true}];
 assert.equal(krakenTrackedStation(3,outcomes,ids,0),bossStation(0,3,true).x);
 assert.equal(krakenTrackedStation(3.6,outcomes,ids,0),bossStation(1,3,true).x);
 assert.equal(krakenTrackedStation(5,outcomes,ids,0),bossStation(1,3,true).x,'Unsubmitted outcome does not redirect the camera');
 assert.equal(krakenTrackedStation(6.3,outcomes,ids,0),bossStation(2,3,true).x);
 assert.equal(krakenTrackedStation(8,outcomes,ids,0),bossStation(0,3,true).x);
});
