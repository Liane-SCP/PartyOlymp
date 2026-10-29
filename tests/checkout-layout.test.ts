import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {checkoutLayout,checkoutItemPose,checkoutCameraDistance} from '../lib/checkout-layout';
import {createAdventureScene} from '../components/olymp/adventure-scene';
const crew=[{id:'a',name:'Nova',color:'#aaddbb'},{id:'b',name:'Luna',color:'#bbaadd'}];

test('Checkout framing fits the whole counter, signs and customer during the camera transition',()=>{
 for(const aspect of[.45,.8,1.5,2.5])for(const yaw of[-.6,.05,.6])for(const pitch of[.22,.6,.8])for(const target of[new T.Vector3(0,2.5,0),new T.Vector3(...checkoutLayout.focus)]){
  const d=checkoutCameraDistance(aspect,yaw,pitch,target),camera=new T.PerspectiveCamera(42,aspect,.1,180);camera.position.set(target.x+Math.sin(yaw)*d,target.y+Math.sin(pitch)*d,target.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateMatrixWorld();
  for(const x of checkoutLayout.bounds.x)for(const y of checkoutLayout.bounds.y)for(const z of checkoutLayout.bounds.z){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.88&&Math.abs(p.y)<.78&&p.z> -1&&p.z<1);}
 }
});

test('The worktop fits the existing figures and ten packed articles stay within its surface',()=>{
 const world=createAdventureScene(T,'budget',crew,'a'),counter=world.scene.getObjectByName('checkout-counter') as T.Mesh;
 assert.equal(counter.position.y+counter.scale.y/2,checkoutLayout.top);assert.ok(checkoutLayout.top>.3+.4&&checkoutLayout.top<.3+1.2-.2);
 for(let i=0;i<10;i++){const p=checkoutItemPose({scanProgress:10,scanned:10},i,true);assert.ok(p[1]>checkoutLayout.top);assert.ok(p[0]-.24>7.65&&p[0]+.24<12.35&&p[2]-.156>4.3&&p[2]+.156<6.7);}
 const last=checkoutItemPose({scanProgress:10.3,scanned:10},9);assert.ok(last[0]>10.3,'The last scanned article must also reach the packing area');
 world.dispose();
});

test('Shared-time articles and customers are identical after seek, different frame histories and reload',()=>{
 const a=createAdventureScene(T,'budget',crew,'a'),b=createAdventureScene(T,'budget',crew,'b'),g:any={id:'budget',round:1,stage:'roundReveal',budget:10000,items:[{id:'p'},{id:'q'},{id:'r'}],mine:{answer:[]},revealStartedAt:10000,reveal:{players:[{id:'a',items:['p','q','r'],sum:600,over:false,count:3}],items:[{id:'p',name:'A',price:100},{id:'q',name:'B',price:200},{id:'r',name:'C',price:300}]}};
 a.update(0,10800,g);a.update(.01,11000,g);a.update(1,11905,g);b.update(80,11905,g);
 for(let i=0;i<3;i++)assert.deepEqual(a.scene.getObjectByName(`basket-item-${i}`)!.position.toArray(),b.scene.getObjectByName(`basket-item-${i}`)!.position.toArray());assert.deepEqual(a.actors[0].root.position.toArray(),b.actors[0].root.position.toArray());
 const first=a.scene.userData.moment.detail;a.update(2,12500,g);assert.notEqual(a.scene.userData.moment.detail,first);
 g.stage='answer';g.round=2;a.update(3,13000,g,{basket:[]},true);assert.equal(a.scene.getObjectByName('budget-department-store')!.userData.shopping.total,null);assert.equal(a.scene.getObjectByName('checkout-paper-bag')!.visible,false);assert.equal(a.scene.userData.cameraFocus,null);
 g.stage='roundReveal';g.reveal.players=[{id:'a',items:[],sum:0,over:false,count:0}];a.update(4,13000,g,{},true);assert.equal(a.scene.userData.moment.reaction,23,'An empty basket must not receive a victory reaction');a.dispose();b.dispose();
});
