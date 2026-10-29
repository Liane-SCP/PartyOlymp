import * as T from 'three';
import {locationKit} from './location-kit';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createIslandTerrain} from './journey-terrain';
import {batchStaticMeshes} from './static-batches';

export function createCoastalRace(scene:T.Scene,colors:string[]){
 const k=locationKit(scene,'typer-coastal-race'),{root,block,sign,model}=k;
 // Rigid cars share one baked geometry per model variant and palette material.
 const combinedCars=new Map<string,{geometry:T.BufferGeometry;material:T.Material}[]>();
 function combineCar(body:T.Group,id:string){
  body.updateWorldMatrix(true,true);const before=new T.Box3().setFromObject(body,true);
  let parts=combinedCars.get(id);
  if(!parts){
   const inverse=body.matrixWorld.clone().invert(),groups=new Map<T.Material,T.BufferGeometry[]>();
   body.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material))return;const list=groups.get(o.material)??[];list.push(o.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld)));groups.set(o.material,list);});
   parts=[];
   const temporary=[...groups.values()].flat();
   for(const [material,geometries] of groups){const geometry=mergeGeometries(geometries,false);if(!geometry){temporary.forEach(g=>g.dispose());parts.forEach(p=>p.geometry.dispose());return;}parts.push({geometry,material});}
   temporary.forEach(g=>g.dispose());
   if(!parts.length)return;parts.forEach(p=>k.geometries.add(p.geometry));combinedCars.set(id,parts);
  }
  body.clear();for(const part of parts){const mesh=new T.Mesh(part.geometry,part.material);mesh.name=`rigid-${id}`;mesh.castShadow=mesh.receiveShadow=true;body.add(mesh);}
  const after=new T.Box3().setFromObject(body,true);body.userData.boundsError=Math.max(before.min.distanceTo(after.min),before.max.distanceTo(after.max));
 }
 block('coastal-sea','#4d9da8',[0,-1.1,0],[240,.3,240]);
 const landGeometry=createIslandTerrain(T,21,3,'#a3ad79');k.geometries.add(landGeometry);const landMaterial=k.mat('#ffffff');landMaterial.vertexColors=true;const land=new T.Mesh(landGeometry,landMaterial);land.scale.set(1,.15,.66);land.position.y=.2;land.receiveShadow=true;root.add(land);
 const landscape=new T.Group();landscape.name='coastal-landscape';root.add(landscape);
 // Minimum horizontal radius is 8²/14 = 4.57, safely above the 3.1 half-width.
 const path=new class extends T.Curve<T.Vector3>{constructor(){super();}getPoint(t:number,target=new T.Vector3()){const a=2.25+t*(Math.PI*3-4.5);return target.set(Math.cos(a)*14,.5+1.3*Math.max(0,-Math.sin(a))**4,Math.sin(a)*8);}}();
 const count=160,width=6.2,positions:number[]=[],indices:number[]=[];
 for(let i=0;i<=count;i++){const p=path.getPointAt(i/count),t=path.getTangentAt(i/count),normal=new T.Vector3(-t.z,0,t.x).normalize();for(const side of[-1,1]){const v=p.clone().addScaledVector(normal,side*width/2);positions.push(v.x,v.y,v.z);}if(i<count){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
 const roadGeometry=new T.BufferGeometry();roadGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));roadGeometry.setIndex(indices);roadGeometry.computeVertexNormals();k.geometries.add(roadGeometry);const road=new T.Mesh(roadGeometry,k.mat('#42505a'));road.material.side=T.DoubleSide;road.receiveShadow=true;root.add(road);
 // Continuous ribbons avoid overlapping block faces on the inside of a bend.
 for(const side of[-1,1]){const vertices:number[]=[],colors:number[]=[];for(let i=0;i<160;i++){const corners:T.Vector3[]=[];for(const u of[i/160,(i+1)/160]){const p=path.getPointAt(u),t=path.getTangentAt(u),n=new T.Vector3(-t.z,0,t.x).normalize();for(const distance of[3.02,3.45])corners.push(p.clone().addScaledVector(n,side*distance).add(new T.Vector3(0,.07,0)));}const color=new T.Color(Math.floor(i/3)%2?'#e8d9bc':'#bd6e58');for(const index of[0,2,1,1,2,3]){vertices.push(...corners[index].toArray());colors.push(color.r,color.g,color.b);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();k.geometries.add(g);const m=new T.Mesh(g,landMaterial);m.material.side=T.DoubleSide;m.receiveShadow=true;root.add(m);}
 for(let i=0;i<=60;i++){const u=i/60,p=path.getPointAt(u),t=path.getTangentAt(u);
  if(i%3===0){const dash=block('center-line','#eee2be',[p.x,p.y+.025,p.z],[.12,.02,.55]);dash.rotation.y=Math.atan2(t.x,t.z);}
 }
 for(const x of[-5,0,5])block('bridge-pier','#d5c5a0',[x,-.2,-7],[1.2,1.8,1.5]);
 const finish=new T.Group(),end=path.getPointAt(1),direction=path.getTangentAt(1);finish.name='finish-gate';finish.position.copy(end);finish.rotation.y=Math.atan2(direction.x,direction.z);root.add(finish);
 for(const side of[-1,1])block('finish-post','#f2d99c',[side*3.3,2.6,0],[.3,5.2,.3],finish);
 block('finish-banner','#f0e3c3',[0,5.2,0],[7,.7,.2],finish);const finishSign=sign('ZIEL',[0,5.2,.14],5,.6);finish.add(finishSign);
 for(let i=0;i<12;i++)block('finish-checker',i%2?'#293b45':'#f5e7c9',[-2.75+i*.5,.06,0],[.5,.025,.65],finish);
 sign('KÜSTENKURVE',[0,4,-10],9,1);
 model('racing/grandStandCovered',[0,.35,1.4],2.8,0,landscape);
 model('racing/tentLong',[-4,.35,-2],2.7,0,landscape);
 model('racing/flagCheckers',[5.7,.4,6],3,0,landscape);
 model('racing/flagCheckers',[12.4,.4,6],3,0,landscape);
 for(const [x,z,h] of [[-17,-5,4],[-14,-10,5],[-7,-11,3.5],[3,-11.5,4.5],[13,-10,4],[18,-4,3.5],[-16,8,4],[-18,-1,3],[5,8,2.5]])model('nature/tree_plateau',[x,.35,z],h,x*.1,landscape);
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2,x=Math.cos(a)*19,z=Math.sin(a)*12;model(i%2?'nature/rock_largeA':'nature/rock_largeC',[x,-.4,z],1.1+i%3*.45,a,landscape);}
 for(const [x,z] of[[-9,1],[0,-2.4],[2,-1.5],[5,-1.5]])model('nature/plant_bush',[x,.35,z],.8,x,landscape);
 sign('START',[-9,3.6,7],4.2,.8);
 // Keep the start decoration outside every lane, including the twelve-car grid.
 for(const side of[-1,1])for(let i=0;i<3;i++){const p=path.getPointAt(i*.014),t=path.getTangentAt(i*.014),normal=new T.Vector3(-t.z,0,t.x).normalize();p.addScaledVector(normal,side*3.8);model('car/cone',[p.x,p.y,p.z],.6);}
 const laneSpacing=Math.min(1.35,4.8/Math.max(1,colors.length-1)),avatarScale=Math.min(.7,laneSpacing/1.28),seatHeights=colors.map(()=>.55);
 const cars=colors.map((color,i)=>{const car=new T.Group();car.name=`race-car-${i}`;root.add(car);const markerWidth=Math.min(.4,laneSpacing*.82),badge=block('crew-car-marker',color,[0,.63,0],[markerWidth,.05,markerWidth],car);badge.userData.player=i;const id=i%2?'car/race-future':'car/race';model(id,[0,0,0],.65,0,car).then(body=>{if(!body)return;const native=body.userData.nativeSize as number[],width=native[0]*body.scale.x,factor=Math.min(1,laneSpacing*.82/Math.max(.001,width));body.scale.multiplyScalar(factor);seatHeights[i]=.55*factor;badge.position.y=seatHeights[i]+.025;car.userData.modelWidth=width*factor;car.userData.modelLength=native[2]*body.scale.z;combineCar(body,id);car.userData.bodyMeshes=body.children.length;car.userData.boundsError=body.userData.boundsError;car.userData.bodyGeometry=(body.children[0] as T.Mesh)?.geometry.uuid;});return car;});
 const badges=colors.map((_,i)=>{const badge=sign('',[0,2.2,0],Math.min(.8,4.8/Math.max(1,colors.length-1)*.85),.5);badge.name=`public-race-place-${i}`;badge.visible=false;return badge;});
 function position(i:number,progress:number){const u=Math.max(0,Math.min(1,progress)),p=path.getPointAt(u),t=path.getTangentAt(u),normal=new T.Vector3(-t.z,0,t.x).normalize();const lane=(i-(colors.length-1)/2)*laneSpacing;p.addScaledVector(normal,lane);cars[i].position.copy(p);cars[i].rotation.y=Math.atan2(t.x,t.z);}
 cars.forEach((_,i)=>position(i,0));let disposed=false,release=()=>{};const ready=k.ready().then(()=>{if(!disposed){const releases=[batchStaticMeshes(landscape),batchStaticMeshes(finish)];release=()=>releases.forEach(fn=>fn());}});return {...k,cars,badges,finish,position,laneSpacing,avatarScale,seatHeights,ready,dispose(){disposed=true;release();k.dispose();combinedCars.clear();}};
}

