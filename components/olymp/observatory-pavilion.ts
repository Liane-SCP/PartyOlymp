import * as T from 'three';
import type {locationKit} from './location-kit';

/** Cutaway star pavilion. Everything is immutable: no time source, moving
 * instrument, pulsating material, repeated ticks or animated sky in this room. */
export function createObservatoryPavilion(k:ReturnType<typeof locationKit>,parent:T.Group){
 const {block,mat,model}=k,room=new T.Group();room.name='observatory-star-pavilion';parent.add(room);
 function own(g:T.BufferGeometry){k.geometries.add(g);return g;}
 function mesh(name:string,g:T.BufferGeometry,color:string,p:[number,number,number],s:[number,number,number]=[1,1,1]){const o=new T.Mesh(g,mat(color));o.name=name;o.position.set(...p);o.scale.set(...s);o.castShadow=o.receiveShadow=true;room.add(o);return o;}
 const brass='#c6ab77',stone='#667b86',ink='#243c50';
 const disk=own(new T.CylinderGeometry(1,1,1,48)),orb=own(new T.IcosahedronGeometry(1,0));
 mesh('pavilion-terrace-edge',disk,'#526b77',[0,-.08,0],[13.15,.45,13.15]);
 mesh('pavilion-limestone-terrace',disk,'#a4b7b0',[0,.18,0],[12.8,.16,12.8]);
 // A quiet mosaic rather than a numbered dial: no visual timing cues.
 const ring=own(new T.TorusGeometry(9.25,.035,4,64));const inlay=mesh('terrace-brass-inlay',ring,brass,[0,.27,0]);inlay.rotation.x=-Math.PI/2;
 for(const side of[-1,1]){
  block('garden-inset',ink,[side*10.6,.34,2.6],[2.4,.2,5.6],room);
  block('garden-stone-planter',stone,[side*10.6,.6,2.6],[2.25,.48,5.4],room);
  block('garden-soil','#4f6157',[side*10.6,.86,2.6],[1.93,.08,5.05],room);
  for(const z of[.7,2.6,4.4])model('nature/plant_bush',[side*10.6,.9,z],.78,side*.6,room);
  block('rest-bench-base',stone,[side*9.3,.55,6.6],[2,.6,1.1],room);
  block('rest-bench-seat','#b4a488',[side*9.3,.9,6.6],[2.2,.16,1.2],room);
 }
 // Solid lower masonry supports a rear half dome; its front is open to the crew.
 for(let i=0;i<12;i++){
  const a=Math.PI+(i+.5)*Math.PI/12,x=-Math.cos(a)*12.3,z=Math.sin(a)*12.3;
  const panel=block('pavilion-curved-parapet',i%2?'#71858d':stone,[x,1.85,z],[3.24,3.15,.5],room);panel.rotation.y=a-Math.PI/2;
  const cap=block('pavilion-parapet-cap',brass,[x,3.48,z],[3.3,.13,.68],room);cap.rotation.y=panel.rotation.y;
 }
 for(const a of[Math.PI,Math.PI*1.2,Math.PI*1.8,Math.PI*2]){
  const x=-Math.cos(a)*12.05,z=Math.sin(a)*12.05;
  mesh('pavilion-column',disk,'#718995',[x,4.1,z],[.3,7.65,.3]);
  mesh('pavilion-column-foot',disk,brass,[x,.6,z],[.53,.55,.53]);
  mesh('pavilion-column-capital',disk,brass,[x,7.85,z],[.52,.28,.52]);
 }
 // Two asymmetric roof wings leave an open meridian slit over the telescope sky.
 for(const [start,length]of[[Math.PI,Math.PI*.42],[Math.PI*1.58,Math.PI*.42]]){
  const dome=own(new T.SphereGeometry(12.4,20,10,start,length,.15,Math.PI/2-.15));
  const roof=mesh('open-observatory-dome',dome,'#456c79',[0,7.9,0],[1,.4,1]);roof.material.side=T.DoubleSide;roof.material.emissive.set('#284552');roof.material.emissiveIntensity=.25;
 }
 const rim=own(new T.TorusGeometry(12.4,.14,5,64,Math.PI));const cornice=mesh('dome-brass-cornice',rim,brass,[0,7.9,0]);cornice.rotation.x=-Math.PI/2;
 for(const phi of[Math.PI,Math.PI*1.2,Math.PI*1.42,Math.PI*1.58,Math.PI*1.8,Math.PI*2]){
  const points=Array.from({length:13},(_,i)=>{const theta=.15+(Math.PI/2-.15)*i/12;return new T.Vector3(-12.43*Math.cos(phi)*Math.sin(theta),7.9+4.98*Math.cos(theta),12.43*Math.sin(phi)*Math.sin(theta));});
  mesh('fixed-dome-rib',own(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,.065,5,false)),brass,[0,0,0]);
 }
 // Permanent star relief on the back wall, safely behind the result board.
 const constellation=[[-4.3,5.8],[-2.5,6.6],[-.6,6.15],[1.3,7.15],[3.4,6.7],[4.6,7.4]];
 constellation.forEach(([x,y],i)=>{mesh('fixed-constellation-star',orb,'#e0cc98',[x,y,-11.85],[.12,.12,.07]);if(i){const [px,py]=constellation[i-1],o=block('fixed-constellation-link',brass,[(x+px)/2,(y+py)/2,-11.87],[Math.hypot(x-px,y-py),.035,.04],room);o.rotation.z=Math.atan2(y-py,x-px);}});
 mesh('telescope-observation-dais',disk,stone,[-7.1,.49,-4.65],[2.1,.48,2.1]);
 mesh('telescope-brass-base',disk,brass,[-7.1,.75,-4.65],[1.85,.06,1.85]);
 model('props/observatory-telescope',[-7.1,.8,-4.65],5.1,.45,room);
 model('furniture/bookcaseOpen',[8.65,.3,-5.45],3.35,-.38,room);
 model('furniture/cabinetBedDrawerTable',[7.5,.3,-2.35],1.75,0,room);
 model('furniture/books',[7.45,2.05,-2.35],.48,.2,room);
 model('furniture/lampRoundTable',[8.15,2.05,-2.35],.9,0,room);
 for(const side of[-1,1])model('furniture/lampWall',[side*10.7,4.2,-5.45],.75,side*.6,room);
 room.userData.design={type:'cutaway-star-pavilion',static:true,telescope:'props/observatory-telescope',noPeriodicCues:true};
 return room;
}
