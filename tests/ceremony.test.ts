import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { ceremonyHeight, ceremonyProgress, ceremonyReveal,ceremonyLayout,ceremonyCrewCamera } from "../lib/ceremony";
import { createCeremonyScene } from "../components/olymp/ceremony-scene";

test("Ceremony reveals bronze, silver, gold in order and preserves tied podium heights", () => {
  assert.ok(ceremonyReveal(3)<ceremonyReveal(2));
  assert.ok(ceremonyReveal(2)<ceremonyReveal(1));
  for(const rank of [1,2,3]) {
    assert.equal(ceremonyProgress(0,rank),0);
    assert.equal(ceremonyProgress(14,rank),1);
    assert.ok(ceremonyHeight(rank)>0);
  }
});

test('Missing podium places do not create empty waiting shots',()=>{
 assert.equal(ceremonyReveal(1,[1]),2);assert.equal(ceremonyReveal(2,[1,2]),2);assert.equal(ceremonyReveal(1,[1,2]),4.4);assert.equal(ceremonyReveal(3,[1,3]),2);assert.equal(ceremonyReveal(1,[1,3]),4.4);assert.equal(ceremonyReveal(1,[1,2,3]),6.4);
 const world=createCeremonyScene(THREE,Array.from({length:12},(_,i)=>({id:`p${i}`,rank:1,name:`Crew ${i}`,points:100,color:'#aabbcc',avatar:i})));world.update(2.2,false,true);assert.ok(world.actors.every(a=>a.root.visible));world.update(3,false,true);assert.equal(world.scene.userData.fireworksActive,true);world.dispose();
});

test('The complete crew keeps its ranks and equal-height shared platforms, including twelve champions',()=>{
 for(let n=2;n<=12;n++)for(const tied of[false,true]){const players=Array.from({length:n},(_,i)=>({id:`p${i}`,name:`Crew ${i}`,rank:tied?1:i+1,points:100,color:'#aabbcc',avatar:i})),layout=ceremonyLayout(players),world=createCeremonyScene(THREE,players);assert.equal(layout.places.length,n);assert.equal(new Set(layout.places.map(p=>p.id)).size,n);assert.equal(world.actors.length,n);world.update(14,true,false,players[n-1].id);for(const actor of world.actors){assert.equal(actor.root.userData.avatarStyle,'boss-sprite');assert.equal(actor.root.visible,true);assert.equal(actor.root.position.y,actor.rank<=3?ceremonyHeight(actor.rank):.04);}assert.equal(world.actors.filter(a=>a.root.userData.selected).length,1);assert.equal(world.actors.at(-1)!.root.userData.selected,true);if(tied){assert.equal(layout.groups.length,1);assert.equal(world.scene.getObjectByName('ceremony-rank-2'),undefined);assert.equal(new Set(layout.places.map(p=>p.position[1])).size,1);}world.dispose();}
});

test('Actual crew bounds fit between the title and result controls at every ceremony shot',()=>{
 for(const ranks of [[1,2],[1,1,3],Array.from({length:12},()=>1),Array.from({length:12},(_,i)=>i+1),[1,2,...Array.from({length:10},()=>3)]])for(const [w,h]of [[320,700],[364,700],[771,800],[1100,800]])for(const time of[0,2,4,6.4,9,14]){
  const layout=ceremonyLayout(ranks.map((rank,i)=>({id:`p${i}`,rank}))),lens=ceremonyCrewCamera(time,w,h,false,layout),camera=new THREE.PerspectiveCamera(37,w/h,.1,180);camera.position.fromArray(lens.position);camera.lookAt(new THREE.Vector3(...lens.target));camera.updateMatrixWorld();for(const p of layout.bounds){const q=new THREE.Vector3(...p).project(camera),x=(q.x+1)*w/2,y=(1-q.y)*h/2;assert.ok(x>=lens.safe.left-.01&&x<=lens.safe.right+.01&&y>=lens.safe.top-.01&&y<=lens.safe.bottom+.01,`${ranks.length}/${w}/${time}: ${x},${y}`);}
 }
});

test('The face of every original character remains unobstructed by other crew sprites',()=>{
 for(const ranks of [Array.from({length:12},()=>1),Array.from({length:12},(_,i)=>i+1),[1,1,3,3,5,6,7,8,9,10,11,12]]){
  const world=createCeremonyScene(THREE,ranks.map((rank,i)=>({id:`p${i}`,rank,name:`Crew ${i}`,points:100,color:'#aabbcc',avatar:i})));world.update(14,true,false);world.scene.updateMatrixWorld(true);for(const width of[364,1100]){const lens=ceremonyCrewCamera(14,width,700,true,world.layout),camera=new THREE.PerspectiveCamera(37,width/700,.1,180);camera.position.fromArray(lens.position);camera.lookAt(new THREE.Vector3(...lens.target));camera.updateMatrixWorld();for(const a of world.actors){const face=a.root.localToWorld(new THREE.Vector3(0,.85,0)).project(camera),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(face.x,face.y),camera);const hit=ray.intersectObjects(world.actors.map(a=>a.root.children[0]),false)[0];assert.equal(hit?.object,a.root.children[0],`Hidden face ${a.id}/${width}`);}}world.dispose();
 }
});
test("3D ceremony supports two players, shared winners and reduced motion without invalid geometry", () => {
  for(const ranks of [[1,2],[1,1,3],[1,2,3]]) {
    const stage=createCeremonyScene(THREE,ranks.map((rank,i)=>({id:`p${i}`,name:`Player ${i}`,rank,points:100,
      color:"#bcff5c",avatar:i,look:{shape:i,accessory:i,color:i}})));
    for(const reduced of [false,true]) for(const time of [0,2.5,4.5,7,9,14,26]) {
      stage.update(time,reduced);
      stage.scene.traverse(object=>{
        assert.ok([...object.position,...object.scale,...object.rotation.toArray().slice(0,3)].every(v=>typeof v==="number"&&Number.isFinite(v)));
      });
    }
    stage.dispose();
  }
});
