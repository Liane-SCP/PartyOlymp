import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import * as T from 'three';
await build({entryPoints:['tests/journey-browser-engine.ts','lib/journey-plaza.ts','lib/journey-world.ts'],outdir:'outputs/plaza-fixture',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/plaza-fixture/tests/journey-browser-engine.js');
const {journeyWalkHeight}=await import('../outputs/plaza-fixture/lib/journey-plaza.js');
const {JOURNEY_CAMERA}=await import('../outputs/plaza-fixture/lib/journey-world.js');
const m=fixture(12);m.atlas(21);
await build({entryPoints:['components/olymp/journey-scene.ts'],outfile:'outputs/plaza-scene.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const {createJourneyScene}=await import('../outputs/plaza-scene.mjs');
const world=createJourneyScene(T,m.room.selection,0,0,m.room.players,0,[]);
world.update(0,true);world.scene.updateMatrixWorld(true);
const perNode=world.nodes.map(()=>[]),matrix=new T.Matrix4();
for(const mesh of world.pickables){
 if(!(mesh instanceof T.Mesh))continue;
 const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
 if(materials.every(material=>material.transparent&&material.opacity<.95))continue;
 if(mesh instanceof T.InstancedMesh){
  for(let i=0;i<mesh.count;i++){
   const index=mesh.userData.islandIndices?.[i];if(!(index>=0))continue;
   mesh.getMatrixAt(i,matrix);
   const copy=new T.Mesh(mesh.geometry,mesh.material);copy.matrixWorld.multiplyMatrices(mesh.matrixWorld,matrix);perNode[index].push(copy);
  }
 }else if(mesh.userData.islandIndex>=0)perNode[mesh.userData.islandIndex].push(mesh);
}
const ray=new T.Raycaster(),direction=new T.Vector3(...JOURNEY_CAMERA).normalize(),results=[];
for(const node of world.nodes){
 const blocked=[];let samples=0;
 for(const time of[0,Math.PI/2.4,Math.PI/1.2,Math.PI*3/2.4,Math.PI*2/1.2,2.5,7.2]){world.update(time,false);world.scene.updateMatrixWorld(true);
 for(const radius of[.56,.68,.75])for(let slot=0;slot<72;slot++)for(const height of[.65,.95]){
  const angle=slot*Math.PI/36,origin=new T.Vector3(node.position[0]+Math.cos(angle)*node.radius*radius,node.position[1]+journeyWalkHeight(node)+.05+height,node.position[2]+Math.sin(angle)*node.radius*radius);
  ray.set(origin,direction);ray.far=node.radius*3;samples++;
  const hit=ray.intersectObjects(perNode[node.index],false)[0];
  if(hit){const p=new T.Vector3().setFromMatrixPosition(hit.object.matrixWorld).sub(new T.Vector3(...node.position));blocked.push({time,radius,slot,height,geometry:hit.object.geometry.type,center:p.toArray().map(v=>+v.toFixed(3))});}
 }}
 results.push({game:node.game,scale:world.roots[node.index].userData.landmarkScale,samples,blocked:blocked.length,examples:blocked.slice(0,8)});
}
world.dispose();
fs.writeFileSync('outputs/qa/journey-sightlines.json',JSON.stringify({results,limit:'Geometry rays through opaque local island meshes; excludes other avatars, remote islands, texture alpha and the screen HUD. Rendered browser images remain required.'},null,2));
console.log(JSON.stringify(results));
for(const result of results)assert.equal(result.blocked,0,`${result.game}: opaque geometry hides a sampled face position`);
