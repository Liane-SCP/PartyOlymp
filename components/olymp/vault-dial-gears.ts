import * as T from 'three';

/** Keep each dial's actual moving pivot while drawing the four curated,
 * identical imported gears together. Loader materials retain their owner. */
export function batchVaultDialGears(parent:T.Group,pivots:T.Group[],geometries:Set<T.BufferGeometry>){
 const sources:T.Mesh[][]=pivots.map(pivot=>{const meshes:T.Mesh[]=[];pivot.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});return meshes;});
 if(!sources.length||sources.some(rows=>rows.length!==1)||sources.some(rows=>Array.isArray(rows[0].material))||sources.some(rows=>rows[0].geometry!==sources[0][0].geometry||rows[0].material!==sources[0][0].material))return null;
 const source=sources[0][0];pivots[0].updateWorldMatrix(true,true);
 const transform=new T.Matrix4().copy(pivots[0].matrixWorld).invert().multiply(source.matrixWorld),geometry=source.geometry.clone().applyMatrix4(transform);geometries.add(geometry);
 const batch=new T.InstancedMesh(geometry,source.material as T.Material,pivots.length);batch.name='code-imported-dial-gears';batch.castShadow=source.castShadow;batch.receiveShadow=source.receiveShadow;parent.add(batch);
 for(const rows of sources)rows[0].removeFromParent();
 const inverse=new T.Matrix4(),matrix=new T.Matrix4();let disposed=false;
 function update(){if(disposed)return;parent.updateWorldMatrix(true,false);inverse.copy(parent.matrixWorld).invert();pivots.forEach((pivot,i)=>{pivot.updateWorldMatrix(true,false);batch.setMatrixAt(i,matrix.multiplyMatrices(inverse,pivot.matrixWorld));});batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();}
 update();return{batch,update,dispose(){if(disposed)return;disposed=true;batch.removeFromParent();batch.dispose();}};
}
