import * as T from 'three';
import {createAdventureModels} from './adventure-models';

/** Shared resource ownership only; each location composes its own architecture. */
export function locationKit(scene:T.Scene,name:string){
 const root=new T.Group();root.name=name;scene.add(root);const models=createAdventureModels();
 const geometries=new Set<T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>(),textures=new Set<T.Texture>();
 const box=new T.BoxGeometry(1,1,1);geometries.add(box);
 const mat=(color:string)=>{let m=materials.get(color);if(!m){m=new T.MeshStandardMaterial({color,roughness:.8});materials.set(color,m);}return m;};
 function block(name:string,color:string,p:[number,number,number],s:[number,number,number],parent:T.Object3D=root){const mesh=new T.Mesh(box,mat(color));mesh.name=name;mesh.position.set(...p);mesh.scale.set(...s);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function sign(text:string,p:[number,number,number],w:number,h:number,color='#293c43',background='#fff2cf',fontScale=.48){
  if(typeof document==='undefined'){const geometry=new T.PlaneGeometry(w,h);geometries.add(geometry);const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({color:background}));mesh.position.set(...p);mesh.userData.setText=()=>{};root.add(mesh);return mesh;}
  const canvas=document.createElement('canvas');canvas.width=Math.min(768,Math.max(128,Math.round(w*70)));canvas.height=Math.max(32,Math.min(512,Math.round(canvas.width*h/w)));const c=canvas.getContext('2d')!;c.fillStyle=background;c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font=`700 ${Math.round(canvas.height*fontScale)}px sans-serif`;c.fillText(text,canvas.width/2,canvas.height/2,canvas.width*.92);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.add(texture);const material=new T.MeshBasicMaterial({map:texture});const geometry=new T.PlaneGeometry(w,h);geometries.add(geometry);const mesh=new T.Mesh(geometry,material);mesh.position.set(...p);root.add(mesh);let previous=text;mesh.userData.setText=(next:string)=>{if(next===previous)return;previous=next;c.fillStyle=background;c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle=color;c.fillText(next,canvas.width/2,canvas.height/2,canvas.width*.92);texture.needsUpdate=true;};return mesh;
 }
 const jobs:Promise<unknown>[]=[],errors:string[]=[],instances:T.InstancedMesh[]=[];let disposed=false;
 function model(id:string,position:[number,number,number],height:number,rotation=0,parent:T.Object3D=root){const job=models.place({id,parent,position,height,rotation}).catch(()=>{errors.push(id);return null;});jobs.push(job);return job;}
 function ready(){return Promise.all(jobs).then(()=>{
  if(disposed)return;
  const groups=new Map<T.Material,T.Mesh[]>();
  for(const o of [...root.children])if(o instanceof T.Mesh&&o.geometry===box&&!Array.isArray(o.material)&&!o.userData.dynamic){const list=groups.get(o.material)??[];list.push(o);groups.set(o.material,list);}
  for(const [material,list] of groups){if(list.length<4)continue;const inst=new T.InstancedMesh(box,material,list.length);list.forEach((o,i)=>{o.updateMatrix();inst.setMatrixAt(i,o.matrix);o.removeFromParent();});inst.castShadow=true;inst.receiveShadow=true;inst.computeBoundingSphere();root.add(inst);instances.push(inst);}
  root.userData.assetsReady=errors.length===0;root.userData.assetErrors=errors;
 });}
 return {root,mat,block,sign,model,ready,models,geometries,textures,
 dispose(){disposed=true;models.dispose();instances.forEach(o=>o.dispose());root.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshBasicMaterial)o.material.dispose();});root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
