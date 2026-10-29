import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {batchStaticMeshes} from '../components/olymp/static-batches';
import {createAdventureModels} from '../components/olymp/adventure-models';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

test('Authored model placement preserves measured anchors while existing placements keep base normalization',async()=>{
 const original=GLTFLoader.prototype.loadAsync,geometry=new T.BoxGeometry(2,4,6),material=new T.MeshStandardMaterial();
 GLTFLoader.prototype.loadAsync=async()=>{const scene=new T.Group(),mesh=new T.Mesh(geometry,material);mesh.position.set(3,2,5);scene.add(mesh);return {scene} as any;};
 const assets=createAdventureModels(),parent=new T.Group();
 try{const authored=await assets.place({id:'props/cannon',parent,position:[0,0,0],origin:'authored'}),normal=await assets.place({id:'props/default',parent,position:[0,0,0],height:1});
  const a=new T.Box3().setFromObject(authored!),b=new T.Box3().setFromObject(normal!);assert.deepEqual(a.getCenter(new T.Vector3()).toArray(),[3,2,5]);assert.equal(authored!.scale.x,1);assert.deepEqual(b.getCenter(new T.Vector3()).toArray(),[0,.5,0]);assert.equal(b.min.y,0);assert.deepEqual(authored!.children[0].position.toArray(),[0,0,0]);
 }finally{assets.dispose();GLTFLoader.prototype.loadAsync=original;}
});

test('Static consolidation preserves transformed vertices and normals, and owns only its new geometry',()=>{
 const world=new T.Group(),root=new T.Group();world.add(root);root.position.set(3,2,-4);root.rotation.set(.2,.8,-.1);root.scale.set(2,.8,1.3);
 const material=new T.MeshStandardMaterial(),sources=[new T.BoxGeometry(),new T.BoxGeometry(2,3,1)],parents=[new T.Group(),new T.Group()];
 parents.forEach((p,i)=>{root.add(p);p.position.set(i*4,1,-i);p.rotation.set(.3,i*.7,.2);p.scale.set(1,2,1.4);const m=new T.Mesh(sources[i],material);m.castShadow=m.receiveShadow=true;p.add(m);});
 world.updateMatrixWorld(true);
 const sample=(meshes:T.Mesh[])=>meshes.flatMap(m=>{const p=m.geometry.getAttribute('position'),n=m.geometry.getAttribute('normal'),normal=new T.Matrix3().getNormalMatrix(m.matrixWorld);return Array.from({length:p.count},(_,i)=>[...new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld).toArray(),...new T.Vector3().fromBufferAttribute(n,i).applyMatrix3(normal).normalize().toArray()]);});
 const original=parents.map(p=>p.children[0] as T.Mesh),before=sample(original),triangles=original.reduce((n,m)=>n+m.geometry.index!.count/3,0);let sourceDisposals=0;
 sources.forEach(g=>g.addEventListener('dispose',()=>sourceDisposals++));material.addEventListener('dispose',()=>sourceDisposals++);
 const release=batchStaticMeshes(root,{mergeUnique:true});world.updateMatrixWorld(true);
 const merged=root.children.find(o=>o.name==='static-location-merged') as T.Mesh;assert.ok(merged);const after=sample([merged]);assert.equal(after.length,before.length);assert.equal(merged.geometry.index!.count/3,triangles);
 before.forEach((v,i)=>v.forEach((component,j)=>assert.ok(Math.abs(component-after[i][j])<1e-5)));
 let mergedDisposals=0;merged.geometry.addEventListener('dispose',()=>mergedDisposals++);release();release();assert.equal(mergedDisposals,1);assert.equal(sourceDisposals,0);assert.equal(merged.parent,null);
 sources.forEach(g=>g.dispose());material.dispose();
});

test('Hidden, moving, interactive and mirrored descendants retain their parents and visibility',()=>{
 const root=new T.Group(),geometry=new T.BoxGeometry(),material=new T.MeshStandardMaterial();
 const parents=Array.from({length:4},()=>new T.Group());parents.forEach(p=>root.add(p));parents[0].visible=false;parents[1].userData.dynamic=true;parents[2].userData.pick='offer:1';parents[3].scale.x=-1;
 const meshes=parents.map(p=>{const m=new T.Mesh(geometry,material);p.add(m);return m;});
 const staticMeshes=Array.from({length:2},()=>{const m=new T.Mesh(geometry,material);root.add(m);return m;});
 const release=batchStaticMeshes(root,{mergeUnique:true});meshes.forEach((m,i)=>assert.equal(m.parent,parents[i]));assert.ok(staticMeshes.every(m=>m.parent===null));
 parents[0].visible=true;assert.equal(meshes[0].parent,parents[0]);release();geometry.dispose();material.dispose();
});

test('Model sharing retains material differences, texture ownership and scene-local lifetime',async()=>{
 const original=GLTFLoader.prototype.loadAsync,owned:T.Material[]=[],geometries:T.BufferGeometry[]=[],textures:T.Texture[]=[];let disposals=0;
 GLTFLoader.prototype.loadAsync=(async function(url:string){
  const scene=new T.Group(),material=new T.MeshStandardMaterial({color:url.includes('different')?'#884422':'#ccaa88',roughness:.8});material.name=url;owned.push(material);material.addEventListener('dispose',()=>disposals++);
  if(url.includes('textured')){material.map=new T.Texture();textures.push(material.map);}
  const geometry=new T.BoxGeometry();geometries.push(geometry);scene.add(new T.Mesh(geometry,material));return {scene};
 }) as typeof GLTFLoader.prototype.loadAsync;
 const a=createAdventureModels(),b=createAdventureModels(),parent=new T.Group();
 try{
  const place=(manager:ReturnType<typeof createAdventureModels>,id:string)=>manager.place({id,parent,position:[0,0,0],height:1});
  const [first,second,different,textured,otherScene]=await Promise.all([place(a,'furniture/first'),place(a,'furniture/second'),place(a,'furniture/different'),place(a,'furniture/textured'),place(b,'furniture/first')]);
  const material=(root:T.Group|null)=>(root!.children[0].children[0] as T.Mesh).material;
  assert.equal(material(first),material(second));assert.notEqual(material(first),material(different));assert.notEqual(material(first),material(textured));assert.notEqual(material(first),material(otherScene));
  a.dispose();assert.equal(disposals,4);assert.equal(otherScene!.parent,parent);b.dispose();assert.equal(disposals,5);
 }finally{a.dispose();b.dispose();GLTFLoader.prototype.loadAsync=original;}
 assert.equal(disposals,5,'Each source material is disposed exactly once, including deduplicated originals');
});
