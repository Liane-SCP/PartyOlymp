import * as T from 'three';
import {sizeModelKey,type MeasureAxis} from '@/lib/size-presentation';
import type {locationKit} from './location-kit';

/** Shared display models. Named archive landmarks remain explicitly labelled category models. */
export function createSizeModelLibrary(k:ReturnType<typeof locationKit>){
 const failures:string[]=[];
 const templates=new Map<string,{root:T.Group;axis:'x'|'y'|'z'}>();
 function geometry<G extends T.BufferGeometry>(g:G){k.geometries.add(g);return g;}
 const box=geometry(new T.BoxGeometry(1,1,1)),sphere=geometry(new T.SphereGeometry(.5,16,10)),cylinder=geometry(new T.CylinderGeometry(.5,.5,1,24));
 function part(p:T.Group,color:string,pos:number[],scale:number[],g:T.BufferGeometry=box){const mesh=new T.Mesh(g,k.mat(color));mesh.position.set(pos[0],pos[1],pos[2]);mesh.scale.set(scale[0],scale[1],scale[2]);mesh.castShadow=true;mesh.receiveShadow=true;p.add(mesh);return mesh;}
 function template(key:string,axis:'x'|'y'|'z',build:(root:T.Group)=>void){const root=new T.Group();root.name=`measuring-model-${key}`;build(root);templates.set(key,{root,axis});}
 template('ball','x',r=>{part(r,'#d6bd77',[0,.5,0],[1,1,1],sphere);const ring=geometry(new T.TorusGeometry(.503,.013,4,48));for(let i=0;i<3;i++){const seam=new T.Mesh(ring,k.mat('#5f675b'));seam.position.y=.5;seam.rotation.set(i*Math.PI/2,i===2?Math.PI/2:0,0);r.add(seam);}});
 template('paper','y',r=>{part(r,'#e6e0cd',[0,.5,0],[.707,1,.008]);for(let i=0;i<5;i++)part(r,'#9aa6a3',[-.08,.75-i*.11,.009],[.37,.012,.004]);});
 template('card','x',r=>{part(r,'#91b6b2',[0,.315,0],[1,.63,.025]);part(r,'#d1b67d',[-.29,.38,.017],[.15,.12,.014]);for(let i=0;i<4;i++)part(r,'#e6ddc8',[-.32+i*.21,.16,.019],[.14,.025,.01]);});
 template('chip','y',r=>{part(r,'#435363',[0,.5,0],[.74,1,.06]);for(let i=0;i<5;i++)part(r,'#d8bd83',[-.28+i*.14,.87,.041],[.09,.18,.01]);});
 for(const name of['coin','disc'])template(name,'x',r=>{const face=part(r,name==='coin'?'#d1b876':'#a9bec8',[0,.5,0],[1,.065,1],cylinder);face.rotation.x=Math.PI/2;const ring=geometry(new T.TorusGeometry(name==='coin'?.41:.09,.014,4,48));const edge=new T.Mesh(ring,k.mat('#e6d4a7'));edge.position.set(0,.5,.04);r.add(edge);});
 template('device','y',r=>{part(r,'#4f6470',[0,.5,0],[.55,1,.06]);part(r,'#a4c6c4',[0,.53,.037],[.46,.79,.012]);part(r,'#cfddce',[0,.08,.041],[.08,.025,.01]);});
 template('brick','y',r=>{part(r,'#b57965',[0,.5,0],[2,1,1]);for(let i=0;i<4;i++)part(r,'#bf8c74',[(i%2-.5),1.08,Math.floor(i/2)*.5-.25],[.35,.16,.35],cylinder);});
 template('chess','x',r=>{part(r,'#9f835d',[0,.05,0],[1,.1,1]);for(let i=0;i<64;i++)part(r,(i+Math.floor(i/8))%2?'#e5d7b4':'#43575c',[(i%8-3.5)/8,.106,(Math.floor(i/8)-3.5)/8],[.124,.01,.124]);});
 template('goal','x',r=>{part(r,'#dfdac4',[-.515,.175,0],[.03,.35,.03]);part(r,'#dfdac4',[.515,.175,0],[.03,.35,.03]);part(r,'#dfdac4',[0,.348333,0],[1.06,.03,.03]);for(let i=0;i<9;i++)part(r,'#9ea9a0',[(i-4)*.116,.16,-.25],[.005,.32,.005]);});
 template('net','x',r=>{for(const x of[-.5,.5])part(r,'#7a8e90',[x,.2,0],[.025,.4,.025]);for(let i=0;i<5;i++)part(r,'#bbc2b4',[0,.07+i*.065,0],[1,.007,.007]);for(let i=0;i<15;i++)part(r,'#bbc2b4',[(i-7)/14,.2,0],[.005,.26,.005]);});
 template('table','z',r=>{part(r,'#7c9e9d',[0,.48,0],[.556,.04,1]);for(const x of[-.23,.23])for(const z of[-.4,.4])part(r,'#8c8b78',[x,.24,z],[.04,.48,.04]);part(r,'#e4dfc6',[0,.505,0],[.012,.004,1]);});
 template('pool','z',r=>{part(r,'#d5d1b7',[0,.05,0],[.5,.1,1]);part(r,'#7fb1be',[0,.11,0],[.45,.025,.95]);for(let i=-2;i<=2;i++)part(r,'#d3d2ac',[i*.08,.13,0],[.006,.006,.9]);});
 template('basket','y',r=>{part(r,'#829495',[0,.45,0],[.04,.9,.04]);part(r,'#e0d7bb',[0,.9,.1],[.5,.32,.04]);const ring=new T.Mesh(geometry(new T.TorusGeometry(.19,.014,5,32)),k.mat('#c69a69'));ring.position.set(0,.78,.3);ring.rotation.x=Math.PI/2;r.add(ring);});
 template('aircraft','z',r=>{part(r,'#c5cfcb',[0,.18,0],[.14,.14,1],sphere);part(r,'#90a9b3',[0,.18,.04],[1,.025,.19]);part(r,'#8ba2af',[0,.21,-.37],[.4,.02,.13]);part(r,'#94a6af',[0,.3,-.4],[.025,.24,.16]);});
 template('rocket','y',r=>{part(r,'#e2dbc6',[0,.5,0],[.15,1,.15],cylinder);part(r,'#6e7779',[0,.21,0],[.16,.12,.16],cylinder);part(r,'#6e7779',[0,.68,0],[.16,.1,.16],cylinder);const tip=part(r,'#d1b583',[0,1.03,0],[.15,.17,.15],geometry(new T.ConeGeometry(.5,1,12)));});
 template('arch','y',r=>{const curve=new T.CatmullRomCurve3(Array.from({length:25},(_,i)=>{const a=i/24*Math.PI;return new T.Vector3(Math.cos(a)*.5,Math.sin(a),0);}));const tube=new T.Mesh(geometry(new T.TubeGeometry(curve,32,.026,5,false)),k.mat('#a9b6b7'));r.add(tube);});
 template('statue','y',r=>{part(r,'#82a59e',[0,.45,0],[.3,.7,.2]);part(r,'#9cb4a4',[0,.88,0],[.2,.2,.2],sphere);const arm=part(r,'#82a59e',[.2,.79,0],[.09,.43,.09]);arm.rotation.z=-.4;});
 for(const type of['giraffe','elephant','whale'])template(type,type==='whale'?'z':'y',r=>{const color=type==='giraffe'?'#caac6b':type==='elephant'?'#a0aeb4':'#7d9da9';part(r,color,[0,.35,0],[.5,.35,type==='whale'?1:.55],sphere);if(type!=='whale'){for(const x of[-.15,.15])for(const z of[-.18,.18])part(r,color,[x,.16,z],[.09,.32,.09]);part(r,color,[.06,type==='giraffe'?.73:.51,.18],[.14,type==='giraffe'?.55:.25,.15]);part(r,color,[.06,type==='giraffe'?1:.61,.25],[.23,.15,.21],sphere);}else{part(r,color,[0,.27,-.43],[.5,.04,.2]);part(r,color,[0,.35,.4],[.4,.22,.22],sphere);}});
 template('track','x',r=>{const curve=new T.EllipseCurve(0,0,.5,.23,0,Math.PI*2,false,0),points=curve.getPoints(50).map(p=>new T.Vector3(p.x,.05,p.y));const road=new T.Mesh(geometry(new T.TubeGeometry(new T.CatmullRomCurve3(points,true),60,.035,4,true)),k.mat('#b79578'));r.add(road);});
 template('telescope','z',r=>{part(r,'#b9b5ce',[0,.15,0],[.65,.08,1]);part(r,'#cfb581',[0,.36,-.25],[.4,.4,.07]);});
 template('exhibit','y',r=>{part(r,'#b8c4b3',[0,.45,0],[.6,.9,.5]);part(r,'#cfb382',[0,.92,0],[.7,.1,.6]);});
 const jobs=Object.entries({giraffe:{id:'animals/giraffe',axis:'y',rotation:Math.PI/2},ship:{id:'watercraft/ship-ocean-liner',axis:'z'},container:{id:'watercraft/cargo-container-a',axis:'z'},bridge:{id:'roads/road-bridge',axis:'z'},building:{id:'city/building-type-h',axis:'y'},tower:{id:'city/building-type-f',axis:'y'},tree:{id:'nature/tree_plateau',axis:'y'}}).map(async([key,spec])=>{const parent=new T.Group();try{await k.models.place({id:spec.id,parent,position:[0,0,0],height:1,rotation:'rotation'in spec?spec.rotation:0});templates.set(key,{root:parent,axis:spec.axis as 'y'|'z'});}catch{failures.push(spec.id);templates.set(key,templates.get('exhibit')!);}});
 return {failures,ready:Promise.all(jobs),get(name:string,kind:string,axis:MeasureAxis,measure=""){
  const key=sizeModelKey(name,kind),spec=templates.get(key)??templates.get('exhibit')!,root=new T.Group(),model=spec.root.clone(true);root.add(model);
  let native=spec.axis;if(/h[o\u00f6]he|schulter/i.test(measure))native='y';else if(/breite|spannweite|durchmesser|abstand/i.test(measure))native='x';
  if(native==='z')model.rotation[axis==='x'?'y':'x']=Math.PI/2;else if(native!==axis)model.rotation.z=axis==='y'?Math.PI/2:-Math.PI/2;
  root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3());
  let from=new T.Vector3(),to=new T.Vector3();from[axis]=bounds.min[axis];to[axis]=bounds.max[axis];
  const anchors=key==='goal'?(native==='y'?[0,1/3]:native==='x'?[-.5,.5]:null):native==='y'?(key==='basket'?[0,.78]:key==='brick'?[0,1]:key==='net'?[0,.33]:key==='elephant'&&/schulter/i.test(measure)?[0,.525]:null):null;
  if(anchors){from.set(0,0,0);to.set(0,0,0);from[native]=anchors[0];to[native]=anchors[1];from.applyMatrix4(model.matrixWorld);to.applyMatrix4(model.matrixWorld);}
  const lo=Math.min(from[axis],to[axis]),hi=Math.max(from[axis],to[axis]),offset=new T.Vector3(axis==='x'?(lo+hi)/2:center.x,axis==='y'?lo:bounds.min.y,center.z);
  model.position.sub(offset);from.sub(offset);to.sub(offset);root.scale.setScalar(1/Math.max(.0001,hi-lo));root.userData.modelKey=key;root.userData.measuredAxis=axis;root.userData.measureFrom=from.toArray();root.userData.measureTo=to.toArray();root.userData.symbolic=!!kind||['tower','building','statue','aircraft','bridge','ship'].includes(key);return root;
 }};
}
