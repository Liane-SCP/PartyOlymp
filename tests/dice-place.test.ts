import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {dicePlaceDistance,diceGroupDistance,diceTableLayout} from '../lib/dice-presentation';
import {createAdventureScene} from '../components/olymp/adventure-scene';
import {createMapCharacter} from '../components/olymp/journey-characters';
import {fixture} from './adventure-browser-engine';

test('Every crew size from two through twelve maps equipment to the seated identity and gives spectators no action surfaces',()=>{
 for(let count=2;count<=12;count++)for(const me of ['p'+(count-1),'observer']){const crew=Array.from({length:count},(_,i)=>({id:'p'+i,color:'#badaaa'})),world=createAdventureScene(T,'dice',crew,me);world.update(0,1000,{id:'dice',stage:'answer',mine:me==='observer'?null:{}},{dicePersonal:false});const rows=world.scene.userData.diceCrew.rows;assert.equal(new Set(rows.map((r:any)=>r.seat)).size,count);for(const actor of world.actors){const row=rows.find((r:any)=>r.id===actor.id);assert.ok(Math.abs(row.origin[0]-actor.root.position.x*.72)<1e-9);assert.ok(Math.abs(row.origin[2]-actor.root.position.z*.72)<1e-9);}assert.equal(world.pickables.filter(p=>p.userData.pick==='diceRoll').length,me==='observer'?0:1);assert.equal(world.pickables.filter(p=>p.userData.pick?.startsWith('die:')).length,me==='observer'?0:5);world.dispose();}
});

test('Real rolls publish a common clock, preserve held values and clear their clock on the next turn',()=>{
 const m=fixture('dice',2),ids=m.room.participantIds;for(const id of ids)m.command(id,{type:'game',action:{type:'roll'}});const a:any=m.view(ids[0]).room.game,b:any=m.view(ids[1]).room.game;assert.equal(a.mine.rollStartedAt,b.opponents[ids[0]].rollStartedAt);assert.ok(a.mine.rollStartedAt>0);assert.equal(a.events.find((e:any)=>e.type==='dice'&&e.player===ids[0]).at,a.mine.rollStartedAt);
 const first=m.room.game!.players[ids[0]].dice[0];m.command(ids[0],{type:'game',action:{type:'hold',index:0}});m.command(ids[0],{type:'game',action:{type:'roll'}});assert.equal(m.room.game!.players[ids[0]].dice[0],first);
 for(const id of ids)m.command(id,{type:'game',action:{type:'category',index:12}});m.tick();m.room.game!.public.turnDeadline=Date.now()-1;m.tick();const next:any=m.view(ids[0]).room.game;assert.equal(next.mine.rolls,0);assert.equal(next.mine.rollStartedAt,null);assert.ok(Object.values(next.opponents).every((p:any)=>p.rollStartedAt===null));assert.ok(next.mine.sheet[12]>0);
});

test('Every public place has five actual dice; all six upward atlas faces match confirmed values',()=>{
 const crew=Array.from({length:12},(_,i)=>({id:'p'+i,name:'Crew '+i,color:'#badaaa'})),world=createAdventureScene(T,'dice',crew,'p0');
 const opponents=Object.fromEntries(crew.map((p,i)=>[p.id,{dice:Array.from({length:5},(_,j)=>(i+j)%6+1),held:[true,false,true,false,false],rolls:1,rollStartedAt:1000,rollId:1,sheet:Array(13).fill(null)}]));world.update(1,2000,{id:'dice',stage:'answer',opponents,mine:opponents.p0},{dicePersonal:false});
 const dice=world.scene.getObjectByName('public-crew-dice') as T.InstancedMesh,uv=dice.geometry.getAttribute('uv'),normals=dice.geometry.getAttribute('normal'),matrix=new T.Matrix4();assert.equal(dice.count,60);
 for(let i=0;i<12;i++)for(let j=0;j<5;j++){dice.getMatrixAt(i*5+j,matrix);let top=0;for(let face=0;face<6;face++){if(new T.Vector3().fromBufferAttribute(normals,face*4).transformDirection(matrix).y<.99)continue;let u=0,v=0;for(let k=0;k<4;k++){u+=uv.getX(face*4+k)/4;v+=uv.getY(face*4+k)/4;}top=1+Math.floor(u*3)+(1-Math.floor(v*2))*3;}assert.equal(top,opponents['p'+i].dice[j]);}
 assert.equal(world.scene.userData.diceCrew.rows.length,12);assert.equal(world.scene.getObjectByName('dice-crew-equipment')!.visible,true);assert.equal(world.actors[0].root.visible,true);assert.equal(world.scene.userData.diceCrew.rows[0].held.filter(Boolean).length,2);
 const version=dice.instanceMatrix.version;for(let n=0;n<20;n++)world.update(10+n,3000+n*100,{id:'dice',stage:'answer',opponents,mine:opponents.p0},{dicePersonal:false});assert.equal(dice.instanceMatrix.version,version,'Settled dice must not upload unchanged instance matrices');
 const before=[...dice.instanceMatrix.array];world.update(2,2000,{id:'dice',stage:'answer',opponents,mine:opponents.p0},{dicePersonal:true});assert.equal(dice.parent!.visible,true);assert.equal(world.actors[0].root.visible,false);assert.deepEqual([...dice.instanceMatrix.array],before);world.dispose();
});

test('Shared roll poses are independent of renderer elapsed time, held dice stay fixed and old joins never rethrow',()=>{
 const crew=[{id:'a',color:'#aaddcc'},{id:'b',color:'#ddccaa'}],a=createAdventureScene(T,'dice',crew,'a'),b=createAdventureScene(T,'dice',crew,'a'),p={dice:[1,2,3,4,5],held:[true,false,false,false,false],rolls:2,rollStartedAt:10000,rollId:2,sheet:Array(13).fill(null)},game={id:'dice',stage:'answer',mine:p,opponents:{a:p,b:p}};
 a.update(1,10325,game,{dicePersonal:false});b.update(999,10325,game,{dicePersonal:false});const da=a.scene.getObjectByName('public-crew-dice') as T.InstancedMesh,db=b.scene.getObjectByName('public-crew-dice') as T.InstancedMesh;assert.deepEqual([...da.instanceMatrix.array],[...db.instanceMatrix.array]);assert.equal(a.scene.userData.diceCrew.rows[1].rolling,true);
 const fixed=new T.Matrix4(),after=new T.Matrix4();da.getMatrixAt(0,fixed);a.update(2,10450,game,{dicePersonal:false});da.getMatrixAt(0,after);assert.deepEqual(after.toArray(),fixed.toArray());b.update(1000,20000,game,{dicePersonal:false});assert.equal(b.scene.userData.diceCrew.rows[1].rolling,false);assert.equal(b.scene.userData.diceRolling,false);
 a.update(3,10325,game,{dicePersonal:false},true);assert.ok(a.scene.userData.diceCrew.rows.every((r:any)=>!r.rolling));a.update(4,10325,{...game,mine:{...p,rollStartedAt:null},opponents:{a:{...p,rollStartedAt:null},b:{...p,rollStartedAt:null}}},{dicePersonal:false});assert.ok(a.scene.userData.diceCrew.rows.every((r:any)=>!r.rolling));a.dispose();b.dispose();
});

test('The personal camera fits cup, thrown dice, held dice and clipboard across portrait and landscape',()=>{
 for(const aspect of[.4,.8,1.4,2.5])for(const yaw of[-.6,.05,.6])for(const pitch of[.6,.87,1])for(const target of[new T.Vector3(0,2.5,0),new T.Vector3(0,1.7,3.888)]){
  const d=dicePlaceDistance(aspect,yaw,pitch,target),camera=new T.PerspectiveCamera(42,aspect,.1,180);camera.position.set(target.x+Math.sin(yaw)*d,target.y+Math.sin(pitch)*d,target.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateMatrixWorld();
  for(const x of[-1.15,1.15])for(const y of[1.5,2.15])for(const z of[2.8,4.9]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.9&&Math.abs(p.y)<.86&&p.z> -1&&p.z<1);}
 }
});

test('Small crews sit closer together and both cameras fit the actual size for every crew count',()=>{
 assert.ok(diceTableLayout(2).radiusX<diceTableLayout(8).radiusX*.5);
 assert.deepEqual(diceTableLayout(12),{radiusX:7.5,radiusZ:5.4,placeScale:10/12});
 for(let count=2;count<=12;count++){
  const layout=diceTableLayout(count),crew=Array.from({length:count},(_,i)=>({id:'p'+i,color:'#aaddcc'})),world=createAdventureScene(T,'dice',crew,'p0');
  world.update(0,1000,{id:'dice',stage:'answer',mine:{}},{dicePersonal:false});
  assert.ok(Math.abs(world.actors[0].root.position.z-layout.radiusZ)<1e-8);
  const originZ=world.scene.userData.diceCrew.rows[0].origin[2];assert.ok(Math.abs(originZ-layout.radiusZ*.72)<1e-8);
  for(const aspect of[.4,.8,1.4,2.5])for(const yaw of[-.6,.05,.6])for(const personal of[false,true]){
   const pitch=personal?.87:.62,target=new T.Vector3(0,personal?1.7:2.5,personal?originZ:0),d=personal?dicePlaceDistance(aspect,yaw,pitch,target,originZ,layout.placeScale):diceGroupDistance(aspect,yaw,pitch,target,count),camera=new T.PerspectiveCamera(42,aspect,.1,180);
   camera.position.set(target.x+Math.sin(yaw)*d,target.y+Math.sin(pitch)*d,target.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateMatrixWorld();
   const xs=personal?[-1.15*layout.placeScale,1.15*layout.placeScale]:[-layout.radiusX-1,layout.radiusX+1],ys=personal?[1.5,1.56+.59*layout.placeScale]:[.3,4.3],zs=personal?[originZ-1.088*layout.placeScale,originZ+1.012*layout.placeScale]:[-layout.radiusZ-1,layout.radiusZ+1];
   for(const x of xs)for(const y of ys)for(const z of zs){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.9&&Math.abs(p.y)<.86&&p.z> -1&&p.z<1,`crew ${count}, ${aspect}, personal ${personal}`);}
  }
  world.dispose();
 }
});

test('Actual spinning dice remain inside the personal camera throughout the throw for every table size',()=>{
 for(let count=2;count<=12;count++){
  const crew=Array.from({length:count},(_,i)=>({id:'p'+i,color:'#aaddcc'})),world=createAdventureScene(T,'dice',crew,'p0'),layout=diceTableLayout(count),originZ=layout.radiusZ*.72;
  for(const age of[0,.1,.2,.325,.45,.6,.65]){
   const p={dice:[1,2,3,4,5],held:[],rolls:1,rollStartedAt:1000};world.update(0,1000+age*1000,{id:'dice',stage:'answer',mine:p,opponents:{p0:p}},{dicePersonal:true});
   const mesh=world.scene.getObjectByName('public-crew-dice') as T.InstancedMesh;
   for(const aspect of[.4,.8,1.4,2.5])for(const yaw of[-.6,.05,.6]){
    const pitch=.87,target=new T.Vector3(0,1.7,originZ),d=dicePlaceDistance(aspect,yaw,pitch,target,originZ,layout.placeScale),camera=new T.PerspectiveCamera(42,aspect,.1,180);
    camera.position.set(Math.sin(yaw)*d,target.y+Math.sin(pitch)*d,target.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateMatrixWorld();
    for(let i=0;i<5;i++){const matrix=new T.Matrix4();mesh.getMatrixAt(i,matrix);for(const x of[-.125,.125])for(const y of[-.125,.125])for(const z of[-.125,.125]){const q=new T.Vector3(x,y,z).applyMatrix4(matrix).project(camera);assert.ok(Math.abs(q.x)<.98&&Math.abs(q.y)<.98&&q.z> -1&&q.z<1,`crew ${count}, throw ${age}, aspect ${aspect}`);}}
   }
  }
  world.dispose();
 }
});

test('The own physical place and sheet summary follow confirmed bonus, zero and reset',()=>{
 const world=createAdventureScene(T,'dice',[{id:'a',name:'Nova',color:'#aaddcc'},{id:'b',name:'Luna',color:'#ddccaa'}],'a');
 const sheet=[3,6,9,12,15,18,null,null,0,null,null,null,null],g:any={id:'dice',mine:{sheet,dice:[1,2,3,4,5],rolls:1,held:[]},opponents:{b:{sheet:Array(13).fill(50)}}};
 world.update(0,0,g);assert.equal(world.scene.userData.diceSheet.total,98);assert.equal(world.scene.userData.diceCrew.rows[0].total,98);assert.equal(world.scene.userData.diceSheet.entries,7);assert.deepEqual(world.scene.userData.diceSheet.values,sheet);
 assert.ok(world.pickables.some(o=>o.userData.pick==='diceSheet'));
 g.mine.sheet=Array(13).fill(null);g.mine.rolls=0;world.update(1,1000,g);assert.equal(world.scene.userData.diceSheet.total,0);assert.equal(world.scene.userData.diceSheet.entries,0);
 delete g.mine;world.update(2,2000,g);assert.equal(world.scene.userData.diceSheet.total,0);world.dispose();
});

test('Avatar preparation settles on decode, supersession, failure and disposal',async()=>{
 const previousImage=globalThis.Image,previousSerializer=globalThis.XMLSerializer,images:any[]=[];
 class ImageStub{onload:(()=>void)|null=null;onerror:(()=>void)|null=null;src='';constructor(){images.push(this);}}
 globalThis.Image=ImageStub as any;globalThis.XMLSerializer=class{serializeToString(){return '<svg/>';}} as any;
 const source={cloneNode(){return {setAttribute(){}};}} as any,actor=createMapCharacter(T,{id:'a',color:'#aaeecc'});
 try{
  const initial=actor.setAvatar(source);assert.notEqual(actor.root.userData.avatarReady,true);images[0].onload();assert.equal(await initial,true);assert.equal(actor.root.userData.avatarReady,true);
  const old=actor.setAvatar(source),latest=actor.setAvatar(source);images[1].onload();assert.equal(await old,false);images[2].onload();assert.equal(await latest,true);
  const texture=(actor.root.children[0] as T.Sprite).material.map,failed=actor.setAvatar(source);images[3].onerror();assert.equal(await failed,false);assert.equal((actor.root.children[0] as T.Sprite).material.map,texture);
  const pending=actor.setAvatar(source);actor.dispose();assert.equal(await pending,false);assert.equal(images[4].onload,null);assert.equal(images[4].src,'');assert.equal(await actor.setAvatar(source),false);
 }finally{actor.dispose();if(previousImage===undefined)delete (globalThis as any).Image;else globalThis.Image=previousImage;if(previousSerializer===undefined)delete (globalThis as any).XMLSerializer;else globalThis.XMLSerializer=previousSerializer;}
});
