import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createAdventureScene} from '../components/olymp/adventure-scene';
const crew=[{id:'a',name:'Nova',color:'#bbddaa'},{id:'b',name:'Luna',color:'#ccbbee'}];
test('Audio listener follows the actual camera orientation and physical reference stations',()=>{
 const camera=new T.PerspectiveCamera();camera.position.set(12,18,32);camera.lookAt(new T.Vector3(2,2,1));
 for(const id of ['dice','budget','typer'] as const){const world=createAdventureScene(T,id,crew,'a');if(id==='dice')world.update(1,1000,{id,stage:'answer',mine:{}},{dicePersonal:false});const frame=world.audioFrame(camera);assert.deepEqual(frame.listener,camera.position.toArray());const forward=new T.Vector3(...frame.forward),up=new T.Vector3(...frame.up);assert.ok(Math.abs(forward.length()-1)<1e-6);assert.ok(Math.abs(up.dot(forward))<1e-6);
  if(id==='dice'){const cup=world.pickables.find(p=>p.userData.pick==='diceRoll')!;assert.deepEqual(frame.anchors.dice,cup.position.toArray());assert.deepEqual(frame.anchors['dice:a'],cup.position.toArray());assert.notDeepEqual(frame.anchors['dice:a'],frame.anchors['dice:b']);world.update(2,1000,{id,stage:'answer',mine:{}},{dicePersonal:true});assert.deepEqual(world.audioFrame(camera).anchors.dice,frame.anchors.dice);}
  if(id==='budget'){const scanner=world.scene.getObjectByName('checkout-scanner')!;assert.deepEqual(frame.anchors.checkoutScan,scanner.position.toArray());assert.deepEqual(frame.anchors.basket,[-9,1,6]);}
  if(id==='typer'){const actor=world.actors[0].root;assert.deepEqual(frame.anchors.typeKey,[actor.position.x,actor.position.y+.15,actor.position.z]);}
  world.dispose();
 }
});
test('Timing and hidden deadlines cannot create environmental or spatial cue anchors',()=>{
 const world=createAdventureScene(T,'timing',crew,'a'),camera=new T.PerspectiveCamera();const before=world.audioFrame(camera);world.update(1,1000,{id:'timing',stage:'answer',round:1,mode:'calm',deadline:12345,mine:{startedAt:50}});const after=world.audioFrame(camera);assert.deepEqual(before.anchors,{});assert.deepEqual(after.anchors,{});world.dispose();
});
test('Navigation sounds stay on public equipment and their actual crew stations',()=>{
 const world=createAdventureScene(T,'geo',crew,'a'),camera=new T.PerspectiveCamera();
 const frame=world.audioFrame(camera);
 assert.deepEqual(frame.anchors.mapPin,[-5,4.1,0]);
 assert.deepEqual(frame.anchors.geoReveal,frame.anchors.mapPin);
 for(const actor of world.actors){const p=actor.root.position;assert.deepEqual(frame.anchors['geoSeal:'+actor.id],[p.x,p.y+.6,p.z]);}
 assert.notDeepEqual(frame.anchors['geoSeal:a'],frame.anchors['geoSeal:b']);
 world.dispose();
});
