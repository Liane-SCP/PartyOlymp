import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {createTreehouseClubhouse} from './treehouse-clubhouse';

export function createTreehouseLocation(scene:T.Scene,count:number){
 const k=locationKit(scene,'color-cards-treehouse'),{root,block:primitive,model,sign}=k;
 const forest=new T.Group();forest.name='treehouse-forest';root.add(forest);
 const block=(name:string,color:string,position:[number,number,number],size:[number,number,number],parent:T.Object3D=forest)=>primitive(name,color,position,size,parent);
 createTreehouseClubhouse(k,forest);
 block('treehouse-deck','#99704e',[0,.13,0],[24,.35,20]);
 for(let i=-11;i<=11;i++)block('deck-seam','#5c4b3e',[i,.315,0],[.026,.015,20]);
 for(const x of[-10.5,10.5]){
  block('treehouse-support-column','#68563e',[x,2,-6],[1.1,10,1.1]);
  block('railing-post','#d2b785',[x,1.6,8.4],[.18,2.6,.18]);
 }
 for(let i=-11;i<=11;i+=2){if(Math.abs(i)>=5)block('back-railing-post','#c7a36c',[i,1.4,-9.3],[.15,2.2,.15]);block('railing-post','#c7a36c',[-11.5,1.4,i*.75],[.15,2.2,.15]);}
 for(const x of[-8.25,8.25])block('back-rope-rail','#e7d5a1',[x,2.4,-9.3],[6.5,.12,.12]);
 block('left-rope-rail','#e7d5a1',[-11.5,2.4,0],[.12,.12,18]);
 for(const x of[-10.5,10.5])for(const side of[-1,1]){const brace=block('treehouse-brace','#746044',[x+side,5.2,-6],[.23,3.5,.23]);brace.rotation.z=side*.6;}
 block('sign-beam','#a18052',[0,7.4,-6.5],[21.5,.3,.3]);
 sign('DIE BUNTE BAUMRUNDE',[0,6.3,-6.4],12,1,'#2d5149','#fae2a4');
 const bannerColors=['#df929f','#86cbdc','#b4d87b','#ebaf6c'];
 for(let i=0;i<12;i++){const x=-9+i*1.64,y=6.8-Math.sin(i/11*Math.PI)*.9;const flag=block('party-pennant',bannerColors[i%4],[x,y,-6.3],[.7,.75,.05]);flag.rotation.z=Math.sin(i)*.13;}
 for(const [x,z,h]of[[-15,-11,14],[15,-11,13],[-16,4,11],[16,4,12],[-5,-15,15],[6,-15,14]])model('nature/tree_plateau',[x,-7,z],h,x*.2,forest);
 for(const x of[-8.5,8.5])model('nature/plant_bush',[x,.3,6.6],1.3,x,forest);
 // A suspended bridge arrives at the open front of the treehouse.
 for(let i=0;i<7;i++)block('rope-bridge-plank','#bb9361',[9.5,.2-i*.04,10+i*.8],[2.2,.16,.6]);
 // Reserve a clear front arc for the private hand; neighboring faces stay beside it.
 const seats=Array.from({length:count},(_,i)=>{const a=i===0?Math.PI/2:count===2?Math.PI*1.5:Math.PI/2+Math.PI/3+(i-1)/Math.max(1,count-2)*Math.PI*4/3;return new T.Vector3(Math.cos(a)*7.7,1.3,Math.sin(a)*5.9);});
 seats.forEach(p=>model('furniture/stoolBar',[p.x,.34,p.z],1.03,-Math.atan2(p.x,p.z),forest));
 const directionWheel=new T.Group();directionWheel.name='card-direction-wheel';directionWheel.position.set(0,1.65,-.7);root.add(directionWheel);
 for(let i=0;i<4;i++){const a=i*Math.PI/2,arrow=block('direction-arrow',bannerColors[i],[Math.sin(a)*2.1,0,Math.cos(a)*2.1],[.6,.08,.8],directionWheel);arrow.rotation.y=a;}
 let disposed=false,release=()=>{};const ready=k.ready().then(()=>{if(!disposed)release=batchStaticMeshes(forest,{mergeUnique:true});});
 return {...k,seats,directionWheel,ready,dispose(){disposed=true;release();k.dispose();}};
}
