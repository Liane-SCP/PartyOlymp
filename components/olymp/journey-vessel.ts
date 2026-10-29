import type * as Three from 'three';
import {createAdventureModels} from './adventure-models';
import type {TransitFrame} from '@/lib/journey-transit';

/** One shared crew vessel. The locally hosted Kenney hull keeps its original UVs. */
export function createJourneyVessel(T:typeof Three,loadAssets=true){
 const root=new T.Group();root.name='crew-journey-vessel';root.userData.dynamic=true;root.visible=false;
 const geometries=new Set<Three.BufferGeometry>(),materials=new Set<Three.Material>(),palette=new Map<string,Three.MeshStandardMaterial>();
 const geo=<G extends Three.BufferGeometry>(g:G)=>{geometries.add(g);return g;},box=geo(new T.BoxGeometry(1,1,1)),cylinder=geo(new T.CylinderGeometry(1,1,1,8)),sphere=geo(new T.SphereGeometry(1,12,8));
 const mat=(color:string)=>{let m=palette.get(color);if(!m){m=new T.MeshStandardMaterial({color,roughness:.85,metalness:.05,flatShading:true});materials.add(m);palette.set(color,m);}return m;};
 const mesh=(parent:Three.Object3D,g:Three.BufferGeometry,color:string,p:number[],s:number[])=>{const o=new T.Mesh(g,mat(color));o.position.fromArray(p);o.scale.fromArray(s);parent.add(o);return o;};
 const block=(parent:Three.Object3D,color:string,p:number[],s:number[])=>mesh(parent,box,color,p,s);
 const fallback=new T.Group();fallback.name='vessel-loading-hull';root.add(fallback);mesh(fallback,sphere,'#735944',[0,-.9,0],[2.25,1.05,5.4]);
 block(root,'#b29670',[0,-.08,0],[4.35,.16,8]);
 for(const side of[-1,1]){block(root,'#647d7b',[side*2.13,.35,0],[.09,.09,7.8]);for(const z of[-3.8,-1.9,0,1.9,3.8])block(root,'#647d7b',[side*2.13,.2,z],[.075,.4,.075]);}
 const balloon=new T.Group();balloon.name='airship-envelope';root.add(balloon);
 mesh(balloon,sphere,'#e5d6ad',[0,8.8,-1.2],[2.8,2.3,5.5]);
 const band=geo(new T.TorusGeometry(1,.025,4,32));for(const z of[-3.5,0,3.5]){const r=Math.sqrt(1-(z/5.5)**2);mesh(balloon,band,'#a88353',[0,8.8,z-1.2],[2.82*r,2.32*r,1]);}
 for(const side of[-1,1])for(const z of[-2.7,2.7]){const a=new T.Vector3(side*2,.15,z),b=new T.Vector3(side*2,7.3,z-1.2),delta=b.clone().sub(a),rope=mesh(balloon,cylinder,'#596967',a.clone().add(b).multiplyScalar(.5).toArray(),[.028,delta.length(),.028]);rope.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());}
 const propeller=new T.Group();propeller.position.set(0,-.65,5.4);balloon.add(propeller);mesh(propeller,sphere,'#b79559',[0,0,0],[.25,.25,.2]);for(const angle of[0,Math.PI/2]){const blade=block(propeller,'#667d7b',[0,0,0],[2.1,.2,.08]);blade.rotation.z=angle;}
 const sails=new T.Group();sails.name='ferry-sails';root.add(sails);mesh(sails,cylinder,'#7b6349',[0,3,-3.8],[.07,6,.07]);block(sails,'#bda778',[0,5.8,-3.8],[4.1,.1,.1]);
 const sailGeo=geo(new T.BufferGeometry());sailGeo.setAttribute('position',new T.Float32BufferAttribute([-.1,2.5,-3.8,-.1,5.7,-3.8,-2,2.5,-3.8,.1,2.5,-3.8,2,2.5,-3.8,.1,5.7,-3.8],3));sailGeo.computeVertexNormals();const sailMat=new T.MeshStandardMaterial({color:'#e5dfbf',side:T.DoubleSide,roughness:1});materials.add(sailMat);sails.add(new T.Mesh(sailGeo,sailMat));
 block(sails,'#769c9b',[0,3.9,-3.77],[.3,2.8,.04]);
 const gangway=new T.Group();gangway.name='crew-boarding-gangway';gangway.userData.dynamic=true;
 const plank=new T.InstancedMesh(box,mat('#aa906e'),12);gangway.add(plank);const matrix=new T.Matrix4(),rotation=new T.Quaternion(),scale=new T.Vector3(),up=new T.Vector3(0,0,1);
 const assets=loadAssets&&typeof window!=='undefined'?createAdventureModels():null;let disposed=false,loaded=false;
 const ready=assets?assets.place({id:'watercraft/ship-hull',parent:root,position:[0,-2.1,0],width:4.8,name:'licensed-crew-ship-hull'}).then(hull=>{if(hull&&!disposed){fallback.visible=false;loaded=true;}}).catch(()=>{}):Promise.resolve();
 return {root,gangway,ready,stats:()=>({hullReady:loaded,...(assets?.stats()??{loaded:0,failed:0,pending:0})}),update(frame:TransitFrame|null,time:number){
  root.visible=!!frame&&frame.kind!=='bridge'&&frame.f<1;gangway.visible=root.visible&&!!frame&&(frame.f<.25||frame.f>=.82);if(!frame||!root.visible)return;
  root.position.fromArray(frame.position);root.rotation.y=frame.yaw;balloon.visible=frame.kind==='airship';sails.visible=frame.kind==='ferry';propeller.rotation.z=time*8;
  if(gangway.visible){const start=new T.Vector3(...(frame.f<.25?frame.sourcePort:frame.targetPort)),end=new T.Vector3(...frame.position),direction=end.clone().sub(start),length=direction.length();rotation.setFromUnitVectors(up,direction.normalize());scale.set(2.2,.1,length/12*.92);for(let i=0;i<12;i++){const p=start.clone().lerp(end,(i+.5)/12);matrix.compose(p,rotation,scale);plank.setMatrixAt(i,matrix);}plank.instanceMatrix.needsUpdate=true;plank.computeBoundingSphere();}
 },dispose(){disposed=true;assets?.dispose();plank.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();gangway.removeFromParent();}};
}
