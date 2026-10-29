import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {vaultFrame,vaultWorkbenchDistance} from '../lib/vault-presentation';import {createAdventureScene} from '../components/olymp/adventure-scene';
import {fixture} from './adventure-browser-engine';
import {batchVaultDialGears} from '../components/olymp/vault-dial-gears';
test('Workbench touch regions remain distinct, visible and at least 44px on small screens',()=>{
 const world=createAdventureScene(T,'code',[{id:'a',name:'Nova',color:'#aaccbb'},{id:'b',name:'Luna',color:'#bbccaa'}],'a');world.update(0,1000,{id:'code',stage:'guess',mine:{submitted:false},roster:{}});world.scene.updateMatrixWorld(true);
 for(const[width,height]of [[296,420],[366,420],[750,800]]){
  const camera=new T.PerspectiveCamera(42,width/height,.1,180),d=vaultWorkbenchDistance(width/height);camera.position.set(0,2.6+Math.sin(.95)*d,3.3+Math.cos(.95)*d);camera.lookAt(0,2.6,3.3);camera.updateMatrixWorld();
  for(const target of world.pickables){const box=new T.Box3().setFromObject(target),points=[];for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(camera));const xs=points.map(p=>p.x),ys=points.map(p=>p.y),w=(Math.max(...xs)-Math.min(...xs))*width/2,h=(Math.max(...ys)-Math.min(...ys))*height/2;
   assert.ok(w>=44&&h>=44,`${target.userData.pick}/${width}: ${w.toFixed(1)} x ${h.toFixed(1)}`);assert.ok(Math.max(...xs)<1&&Math.min(...xs)>-1);const center=target.getWorldPosition(new T.Vector3()).project(camera),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(center.x,center.y),camera);assert.equal(ray.intersectObjects(world.pickables,false)[0]?.object,target,`${target.userData.pick} must receive its own center tap`);
  }
 }world.dispose();
});
test('Code settlement publishes one shared solve clock and resets it without exposing pending colors',()=>{
 const m=fixture('code',2),g=m.room.game!;g.secret.code=[0,1,2,3];const ids=m.room.participantIds;
 m.command(ids[0],{type:'game',action:{type:'guess',colors:[0,1,2,3],round:1,turn:1}});assert.equal(g.public.firstSolvedAt,null);assert.equal((m.view(ids[1]).room.game as any).roster[ids[0]].pending,undefined);
 m.command(ids[1],{type:'game',action:{type:'guess',colors:[1,0,3,2],round:1,turn:1}});assert.ok(Number(g.public.firstSolvedAt)>0);assert.equal(g.public.firstSolvedAt,g.public.feedbackAt);assert.equal(g.players[ids[0]].solved,true);const start=Number(g.public.firstSolvedAt);
 const view:any=m.view(ids[1]).room.game;assert.equal(view.roster[ids[0]].guesses,undefined);assert.equal(vaultFrame(view,start).progress,0);assert.equal(vaultFrame(view,start+600).progress,.5);assert.equal(vaultFrame(view,start+1200).progress,1);
 m.command(ids[1],{type:'game',action:{type:'giveUp',round:1,turn:2}});assert.equal(g.public.firstSolvedAt,start);m.next();assert.equal(g.public.firstSolvedAt,null);
});
test('Public workstations contain only status and aggregate feedback, even for an authorized spectator',()=>{
 const f=vaultFrame({stage:'guess',roster:{a:{solved:true,ready:true,guesses:[{colors:[1,2,3,4]}],pending:[4,3,2,1],feedback:[{turn:1,exact:2,misplaced:1,colors:[0,0,0,0]}]}}},1000);assert.equal(f.canUse,false);assert.deepEqual(f.roster[0].feedback,{turn:1,exact:2,misplaced:1});assert.ok(!JSON.stringify(f).includes('colors'));assert.equal(f.progress,1);
});

test('Own mechanical dials show distinct colors and counted pips without reading another player\'s draft',()=>{
 const world=createAdventureScene(T,'code',[{id:'a',name:'Nova',color:'#aaccbb'},{id:'b',name:'Luna',color:'#bbccaa'}],'a');
 const g={id:'code',stage:'guess',mine:{submitted:false},roster:{b:{pending:[5,5,5,5],guesses:[{colors:[5,5,5,5]}]}}};
 world.update(0,1000,g,{code:[0,2,4,5],codeSlot:1});
 const faces=world.scene.getObjectByName('code-color-dials') as T.InstancedMesh,pips=world.scene.getObjectByName('code-dial-color-pips') as T.InstancedMesh,color=new T.Color(),matrix=new T.Matrix4();
 assert.equal(faces.count,4);assert.equal(pips.count,15);
 for(const [i,hex]of ['f35d70','ffd657','b685ff','ff9b43'].entries()){faces.getColorAt(i,color);assert.equal(color.getHexString(),hex);faces.getMatrixAt(i,matrix);assert.ok(Math.abs(new T.Vector3().setFromMatrixScale(matrix).x-(i===1?1.08:1))<1e-6);}
 // A server-confirmed pending hand takes precedence over a stale local draft.
 world.update(1,2000,{...g,mine:{submitted:true,pending:[1,1,1,1]}},{code:[0,2,4,5],codeSlot:1});assert.equal(pips.count,8);
 for(let i=0;i<4;i++){faces.getColorAt(i,color);assert.equal(color.getHexString(),'448fff');}
 world.update(2,3000,{...g,mine:undefined},{});assert.equal(pips.count,0);assert.ok(world.pickables.every(p=>p.userData.pickDisabled));world.dispose();
});

test('Imported gear instances retain the real pivot, authored transform and shared material owner',()=>{
 const root=new T.Group();root.position.set(2,3,4);root.rotation.y=.3;const geometry=new T.BoxGeometry(1,2,.2),material=new T.MeshStandardMaterial(),owned=new Set<T.BufferGeometry>(),pivots=Array.from({length:4},(_,i)=>{const p=new T.Group();p.position.set(i*2,1,0);p.rotation.z=i*.4;p.scale.setScalar(1+i*.05);root.add(p);const source=new T.Mesh(geometry,material);source.position.set(0,-1,.36);source.rotation.x=.2;source.scale.setScalar(2);p.add(source);return p;});
 root.updateMatrixWorld(true);const expected=pivots.map(p=>new T.Vector3(.5,1,.1).applyMatrix4(p.children[0].matrixWorld));
 const batch=batchVaultDialGears(root,pivots,owned)!;assert.ok(batch);assert.equal(batch.batch.count,4);assert.equal(batch.batch.material,material);const m=new T.Matrix4();
 for(let i=0;i<4;i++){batch.batch.getMatrixAt(i,m);const actual=new T.Vector3(.5,1,.1).applyMatrix4(new T.Matrix4().makeScale(2,2,2)).applyAxisAngle(new T.Vector3(1,0,0),.2).add(new T.Vector3(0,-1,.36)).applyMatrix4(m).applyMatrix4(root.matrixWorld);assert.ok(actual.distanceTo(expected[i])<1e-5);}
 pivots[0].rotation.z=1.2;pivots[0].scale.setScalar(1.08);batch.update();batch.batch.getMatrixAt(0,m);assert.ok(Math.abs(new T.Vector3().setFromMatrixScale(m).x-1.08)<1e-6);
 let materialDisposals=0;material.addEventListener('dispose',()=>materialDisposals++);batch.dispose();batch.dispose();assert.equal(materialDisposals,0);assert.equal(owned.size,1);owned.forEach(g=>g.dispose());geometry.dispose();material.dispose();
});
test('Actual door and wheel resume the public clock; spectator controls and next-round reset stay safe',()=>{
 const crew=[{id:'a',name:'Nova',color:'#aaccbb'},{id:'b',name:'Luna',color:'#bbccaa'}],a=createAdventureScene(T,'code',crew,'a'),b=createAdventureScene(T,'code',crew,'b'),spectator=createAdventureScene(T,'code',crew,'guest');const g:any={id:'code',round:0,stage:'guess',firstSolvedAt:10000,mine:{solved:false,submitted:false,guesses:[]},roster:{a:{solved:true,ready:true,feedback:[{turn:1,exact:4,misplaced:0}]},b:{solved:false,ready:false,feedback:[{turn:1,exact:0,misplaced:4}]}}};
 a.update(1,10600,g);b.update(99,10600,g);const da=a.scene.getObjectByName('vault-hinged-door')!,db=b.scene.getObjectByName('vault-hinged-door')!;assert.equal(da.rotation.y,db.rotation.y);assert.ok(da.rotation.y<0);assert.equal(a.scene.getObjectByName('code-mechanical-vault')!.userData.progress.solved,1);const la=a.scene.getObjectByName('vault-feedback-lamps') as T.InstancedMesh,lb=b.scene.getObjectByName('vault-feedback-lamps') as T.InstancedMesh,tint=new T.Color();la.getColorAt(0,tint);assert.equal(tint.getHexString(),'d6c580');lb.getColorAt(0,tint);assert.equal(tint.getHexString(),'8dcad6');la.getColorAt(1,tint);assert.equal(tint.getHexString(),'f35d70');lb.getColorAt(1,tint);assert.equal(tint.getHexString(),'fff2dc');assert.equal(a.scene.getObjectByName('vault-hinged-door')!.children.find(o=>o.userData.dynamic)!.rotation.z,b.scene.getObjectByName('vault-hinged-door')!.children.find(o=>o.userData.dynamic)!.rotation.z);
 spectator.update(0,10600,{...g,mine:undefined});assert.ok(spectator.pickables.every(p=>p.userData.pickDisabled));g.firstSolvedAt=null;g.roster.a.solved=false;a.update(2,12000,g);assert.equal(da.rotation.y,0);let releases=0;((a.pickables[0] as T.Mesh).material as T.Material).addEventListener('dispose',()=>releases++);a.dispose();assert.equal(releases,1,'Shared hit material has exactly one disposal owner');b.dispose();spectator.dispose();
});
