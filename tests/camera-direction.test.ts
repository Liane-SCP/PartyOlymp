import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {cameraSubject,turnCamera,cameraBlend} from '../lib/camera-direction';
import {pictureCamera} from '../lib/picture-presentation';
import {fixture} from './adventure-browser-engine';
import {createAdventureScene} from '../components/olymp/adventure-scene';

test('Camera ownership follows the exclusive server buzzer for participants and spectators, then releases',()=>{
 const m=fixture('picture',12),id=m.room.participantIds.at(-1)!;
 assert.equal(cameraSubject(m.view().room.game),null);
 m.command(id,{type:'game',action:{type:'buzz'}});
 for(const viewer of[m.first,id,'observer'])assert.equal(cameraSubject(m.view(viewer).room.game),id);
 // A losing buzzer cannot redirect anyone's camera.
 assert.throws(()=>m.command(m.first,{type:'game',action:{type:'buzz'}}),/Buzzer/);
 assert.equal(cameraSubject(m.view().room.game),id);
 m.command(id,{type:'game',action:{type:'answer',value:'certainly incorrect'}});
 assert.equal(cameraSubject(m.view().room.game),null);
 m.command(m.first,{type:'game',action:{type:'buzz'}});
 m.expire(m.room.game!.public.buzzDeadline+1);
 assert.equal(cameraSubject(m.view().room.game),null);
});

test('Active Pixelblitz shots frame every real avatar, buzzer and nameplate at 2/8/12 places',()=>{
 for(const count of[2,8,12]){
  const m=fixture('picture',count),world=createAdventureScene(T,'picture',m.room.players,m.first);
  for(const actor of world.actors)for(const aspect of[.35,.65,16/9,3]){
   const seat=actor.root.position.toArray() as [number,number,number],shot=pictureCamera(aspect,'active',seat),c=new T.PerspectiveCamera(42,aspect,.1,180);
   c.position.set(shot.target[0]+Math.sin(shot.yaw)*shot.distance,shot.target[1]+Math.sin(shot.pitch)*shot.distance,shot.target[2]+Math.cos(shot.yaw)*Math.cos(shot.pitch)*shot.distance);c.lookAt(new T.Vector3(...shot.target));c.updateMatrixWorld();
   for(const [dx,y,dz]of[[-1.4,1,1.65],[1.4,3.5,0],[0,1.96,.9]]){
    const q=new T.Vector3(seat[0]+dx,y,seat[2]+dz).project(c);
    assert.ok(Math.abs(q.x)<.9&&Math.abs(q.y)<.8&&q.z>-1&&q.z<1,`${count}/${aspect}/${actor.id}: clipped participant`);
   }
  }world.dispose();
 }
});

test('Turn direction uses actual moving scene actors; private work and quiet views take priority',()=>{
 for(const id of['bomb','chain'] as const){
  const m=fixture(id,12),g=m.room.game!;g.stage=id==='bomb'?'word':'answer';g.public.turnId=m.room.participantIds[7];
  const view=m.view().room.game,world=createAdventureScene(T,id,m.room.players,m.first);world.update(0,Date.now(),view);
  const subject=cameraSubject(view)!;assert.equal(subject,g.public.turnId);assert.equal(cameraSubject(view,true),null);assert.equal(cameraSubject(view,false,true),null);
  const actor=world.actors.find(a=>a.id===subject)!,pos=actor.root.position.toArray() as [number,number,number];
  for(const aspect of[.35,16/9]){const shot=turnCamera(id,subject,pos,aspect)!;assert.ok(shot.distance>0);assert.equal(shot.subject,subject);assert.ok(Math.abs(shot.target[0]-pos[0])<2);assert.equal(shot.target[2],pos[2]);}
  world.dispose();
 }
 for(const id of['timing','size','color','spectrum','wiki','geo','code','categories','budget','blackjack','cards','dice','herd','typer','auction','colossus','kraken','dragon'])assert.equal(cameraSubject({id,stage:'answer',turnId:'do-not-follow'}),null,`${id}: unsolicited turn camera`);
});

test('Camera settling is equivalent at 30/60/120 FPS and reduced motion cuts directly',()=>{
 const end=(fps:number)=>{let n=0;for(let i=0;i<fps;i++)n+=(1-n)*cameraBlend(1/fps);return n;};
 assert.ok(Math.abs(end(30)-end(60))<1e-10);assert.ok(Math.abs(end(60)-end(120))<1e-10);assert.ok(end(30)>.999);
 assert.equal(cameraBlend(1/60,true),1);assert.equal(cameraBlend(-1),0);
});
