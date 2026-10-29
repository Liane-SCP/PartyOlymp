import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {scenePreloader} from '@/lib/scene-preload';

export type ModelPlacement={id:string;parent:T.Object3D;position:[number,number,number];height?:number;width?:number;rotation?:number;name?:string;origin?:'base'|'authored'};

/** One owner per scene: clones share geometry/materials and dispose exactly once. */
export function createAdventureModels(){
  const loader=new GLTFLoader(),pending=new Map<string,Promise<T.Group>>();
  const geometry=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
  const roots=new Set<T.Group>();let disposed=false,loaded=0,failed=0;
  const animations=new Map<string,T.AnimationClip[]>();
  const plainMaterials=new Map<string,T.MeshStandardMaterial>();
  function shareMaterial(m:T.Material){
    // Textured materials retain their GLTF sampler and UV configuration.
    if(!(m instanceof T.MeshStandardMaterial)||Object.values(m).some(v=>v instanceof T.Texture)||m.onBeforeCompile!==T.Material.prototype.onBeforeCompile)return m;
    const {uuid,name,metadata,...properties}=m.toJSON();
    const key=JSON.stringify(properties),existing=plainMaterials.get(key);if(existing)return existing;plainMaterials.set(key,m);return m;
  }
  function release(){geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());geometry.clear();materials.clear();textures.clear();}
  function load(id:string){
    if(!/^(furniture|food|car|nature|racing|factory|city|watercraft|roads|animals|props)\/[a-zA-Z0-9_-]+$/.test(id))return Promise.reject(new Error('Unknown model path'));
    let promise=pending.get(id);if(promise)return promise;
    const url=`/adventure-models/${id}.glb`;
    promise=scenePreloader.read(url).then(prepared=>prepared?loader.parseAsync(prepared,url.slice(0,url.lastIndexOf('/')+1)):loader.loadAsync(url)).then(gltf=>{
      gltf.scene.traverse(o=>{if(!(o instanceof T.Mesh))return;geometry.add(o.geometry);o.castShadow=true;o.receiveShadow=true;
        for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if(m instanceof T.MeshStandardMaterial){m.roughness=Math.max(.65,m.roughness);m.metalness=Math.min(.2,m.metalness);}for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);}
      });
      if(disposed){release();throw new Error('Scene disposed');}
      gltf.scene.traverse(o=>{if(o instanceof T.Mesh)o.material=Array.isArray(o.material)?o.material.map(shareMaterial):shareMaterial(o.material);});
      animations.set(id,gltf.animations);loaded++;return gltf.scene;
    }).catch(error=>{failed++;throw error;});pending.set(id,promise);return promise;
  }
  return {
    async place(spec:ModelPlacement){
      const original=await load(spec.id);if(disposed)return null;
      const root=new T.Group(),model=original.clone(true);root.name=spec.name??`asset-${spec.id}`;root.userData.asset=spec.id;root.add(model);
      root.userData.animationClips=animations.get(spec.id)??[];
      const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());root.userData.nativeSize=size.toArray();
      const scale=spec.width!==undefined?spec.width/Math.max(.001,size.x):spec.origin==='authored'&&spec.height===undefined?1:(spec.height??1)/Math.max(.001,spec.id.startsWith('food/')||spec.id.startsWith('factory/')||spec.id.includes('/rock_')?Math.max(size.x,size.y,size.z):size.y);
      if(spec.origin!=='authored')model.position.set(-center.x,-bounds.min.y,-center.z);root.scale.setScalar(scale);root.position.set(...spec.position);root.rotation.y=spec.rotation??0;spec.parent.add(root);roots.add(root);return root;
    },
    stats:()=>({loaded,failed,pending:pending.size-loaded-failed}),
    dispose(){disposed=true;roots.forEach(root=>root.removeFromParent());roots.clear();release();pending.clear();plainMaterials.clear();animations.clear();}
  };
}


