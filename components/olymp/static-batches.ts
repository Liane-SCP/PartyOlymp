import * as T from 'three';

import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Bake an immutable subtree only. Original resources stay with their loader. */
export function batchStaticMeshes(root:T.Object3D,options:{mergeUnique?:boolean}={}){
 root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();
 const groups=new Map<string,{geometry:T.BufferGeometry;material:T.Material;objects:T.Mesh[]}>();
 root.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||o instanceof T.SkinnedMesh||Array.isArray(o.material)||o.morphTargetInfluences||o.material.transparent||o.matrixWorld.determinant()<=0)return;
  // Do not hoist children out of a hidden, animated or interactive parent.
  for(let node:T.Object3D|null=o;node;node=node.parent){if(!node.visible||node.userData.dynamic||node.userData.pick)return;if(node===root)break;}
  const key=`${options.mergeUnique?'merged':o.geometry.uuid}:${o.material.uuid}:${o.castShadow}:${o.receiveShadow}:${o.layers.mask}:${o.renderOrder}:${o.frustumCulled}`;const g=groups.get(key)??{geometry:o.geometry,material:o.material,objects:[] as T.Mesh[]};g.objects.push(o);groups.set(key,g);});
 const instances:T.InstancedMesh[]=[];
 const merged:T.Mesh[]=[];
 for(const {geometry,material,objects} of groups.values()){
  if(objects.length<2)continue;
  if(options.mergeUnique&&!objects.every(o=>o.geometry===geometry)){
   const temporary=objects.map(o=>o.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld)));
   let combined:T.BufferGeometry|null=null;
   try{combined=mergeGeometries(temporary,false);}finally{temporary.forEach(g=>g.dispose());}
   if(!combined)continue;
   const mesh=new T.Mesh(combined,material);mesh.name='static-location-merged';mesh.castShadow=objects[0].castShadow;mesh.receiveShadow=objects[0].receiveShadow;mesh.layers.mask=objects[0].layers.mask;mesh.renderOrder=objects[0].renderOrder;mesh.frustumCulled=objects[0].frustumCulled;
   objects.forEach(o=>o.removeFromParent());root.add(mesh);merged.push(mesh);continue;
  }
  const batch=new T.InstancedMesh(geometry,material,objects.length);batch.name='static-location-batch';batch.castShadow=objects[0].castShadow;batch.receiveShadow=objects[0].receiveShadow;batch.layers.mask=objects[0].layers.mask;batch.renderOrder=objects[0].renderOrder;batch.frustumCulled=objects[0].frustumCulled;
  objects.forEach((o,i)=>{batch.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));o.removeFromParent();});batch.computeBoundingSphere();root.add(batch);instances.push(batch);
 }
 let released=false;
 return ()=>{if(released)return;released=true;instances.forEach(o=>{o.removeFromParent();o.dispose();});merged.forEach(o=>{o.removeFromParent();o.geometry.dispose();});};
}

