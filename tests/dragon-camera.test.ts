import test from 'node:test';import assert from 'node:assert/strict';import {PerspectiveCamera,Vector3} from 'three';
import {dragonPortrait,dragonActionPose,dragonTrackedStation} from '../lib/dragon-camera';import {bossStation} from '../lib/boss-stations';

test('Close portrait keeps the own player and dragon action between the HUD and controls',()=>{
 for(const [width,height]of[[320,700],[390,844],[430,932]])for(const count of[2,8,12])for(const index of[0,Math.floor(count/2),count-1]){
  const station=bossStation(index,count),pose=dragonActionPose(height,station.x,false),camera=new PerspectiveCamera(42,width/height,.1,120);camera.position.fromArray(pose.position);camera.lookAt(new Vector3(...pose.aim));camera.updateMatrixWorld();
  const project=(p:number[])=>{const v=new Vector3(...p).project(camera);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2};},own=project([station.x,.65,station.z]),target=project([0,4.7,-.2]);
  assert.ok(own.x>20&&own.x<width-20,JSON.stringify({width,count,index,own}));assert.ok(own.y>230&&own.y<height-185,JSON.stringify({width,height,count,index,own}));assert.ok(target.y>190&&target.y<own.y-50);
 }
 assert.equal(dragonPortrait(390,844),true);assert.equal(dragonPortrait(844,390),false);assert.equal(dragonPortrait(568,320),false);
});
test('Only earned public contributions direct the salvo camera; the own place returns afterwards',()=>{
 const ids=['a','b','c'],outcomes=[{id:'b',submitted:true,score:1600},{id:'a',submitted:true,score:0},{id:'c',submitted:false,score:1600}];
 assert.equal(dragonTrackedStation(3,outcomes,ids,2),bossStation(2,3).x);
 assert.equal(dragonTrackedStation(3.6,outcomes,ids,2),bossStation(1,3).x);
 assert.equal(dragonTrackedStation(6.5,outcomes,ids,2),bossStation(1,3).x);
 assert.equal(dragonTrackedStation(8,outcomes,ids,2),bossStation(2,3).x);
});
