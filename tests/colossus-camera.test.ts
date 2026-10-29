import test from 'node:test';import assert from 'node:assert/strict';import {PerspectiveCamera,Vector3} from 'three';
import {colossusPortrait,colossusActionPose,colossusTrackedStation} from '../lib/colossus-camera';import {bossStation} from '../lib/boss-stations';

test('Temple portrait frames the own player below the guardian and above the controls',()=>{
 for(const [width,height]of[[320,700],[390,844],[430,932]])for(const count of[2,8,12])for(const index of[0,Math.floor(count/2),count-1]){
  const station=bossStation(index,count),pose=colossusActionPose(height,station.x,false),camera=new PerspectiveCamera(42,width/height,.1,120);camera.position.fromArray(pose.position);camera.lookAt(new Vector3(...pose.aim));camera.updateMatrixWorld();
  const project=(p:number[])=>{const v=new Vector3(...p).project(camera);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2};},own=project([station.x,.56,station.z]),head=project([0,7.2,-2.5]);
  assert.ok(own.x>20&&own.x<width-20,JSON.stringify({width,count,index,own}));assert.ok(own.y>230&&own.y<height-185,JSON.stringify({width,height,count,index,own}));assert.ok(head.y>190&&head.y<own.y-80,JSON.stringify({width,height,count,index,head,own}));
 }
 assert.equal(colossusPortrait(390,844),true);assert.equal(colossusPortrait(844,390),false);assert.equal(colossusPortrait(568,320),false);
});
test('Only confirmed damaging rune attacks redirect the camera and the own place returns afterwards',()=>{
 const ids=['a','b','c'],outcomes=[{id:'b',submitted:true,damage:600},{id:'a',submitted:true,damage:0},{id:'c',submitted:false,damage:1600}];
 assert.equal(colossusTrackedStation(3,outcomes,ids,2),bossStation(2,3).x);assert.equal(colossusTrackedStation(3.6,outcomes,ids,2),bossStation(1,3).x);assert.equal(colossusTrackedStation(6.5,outcomes,ids,2),bossStation(1,3).x);assert.equal(colossusTrackedStation(8,outcomes,ids,2),bossStation(2,3).x);
 assert.equal(colossusTrackedStation(4,[{id:'stranger',submitted:true,damage:600}],ids,2),bossStation(2,3).x);
});
