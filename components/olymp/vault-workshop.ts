import * as T from 'three';
import type {locationKit} from './location-kit';

/** A cutaway locksmith's workshop: service equipment stays behind the occupied
 * stations; the central door swing and the full personal workbench stay clear. */
export function createVaultWorkshop(k:ReturnType<typeof locationKit>,parent:T.Group){
 const {block,model}=k,room=new T.Group();room.name='vault-locksmith-workshop';parent.add(room);
 const brass='#baa171',steel='#7a9696',dark='#30474f',copper='#aa7857';
 const cylinder=new T.CylinderGeometry(1,1,1,16);k.geometries.add(cylinder);
 function pipe(name:string,color:string,a:T.Vector3,b:T.Vector3,radius:number){const delta=b.clone().sub(a),o=new T.Mesh(cylinder,k.mat(color));o.name=name;o.position.copy(a).add(b).multiplyScalar(.5);o.scale.set(radius,delta.length(),radius);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());o.castShadow=o.receiveShadow=true;room.add(o);return o;}
 // Recessed brick panels and structural piers frame the giant safe.
 for(const side of[-1,1]){
  const x=side*8.6;
  block('vault-masonry-recess','#576b6d',[x,4.1,-8.58],[6.35,6.3,.13],room);
  for(let row=0;row<7;row++){
   block('masonry-course',dark,[x,1.45+row*.84,-8.49],[6.2,.025,.025],room);
   for(let col=0;col<4;col++)block('staggered-masonry-joint',dark,[x-2.55+col*1.55+(row%2)*.65,1.86+row*.84,-8.48],[.025,.8,.025],room);
  }
  block('vault-pier','#607d83',[side*5.8,3.7,-8.15],[.85,7.4,1.1],room);
  for(const y of[.5,7.05])block('pier-brass-cap',brass,[side*5.8,y,-8.04],[1.12,.3,1.3],room);
  pipe('copper-service-riser',copper,new T.Vector3(side*11.8,.5,-7.95),new T.Vector3(side*11.8,6.45,-7.95),.15);
  pipe('copper-service-header',copper,new T.Vector3(side*11.8,6.45,-7.95),new T.Vector3(side*6.3,6.45,-7.95),.15);
  for(const y of[1.6,3.8,5.8])block('pipe-retainer',brass,[side*11.8,y,-8.11],[.65,.12,.2],room);
  model('furniture/lampWall',[side*6.8,5.7,-8.25],.85,0,room);
 }
 block('upper-workshop-cornice',brass,[0,8.05,-8.42],[26,.18,.35],room);
 block('workshop-left-wainscot',dark,[-12.53,1.25,.1],[.16,2.2,19],room);
 block('workshop-left-rail',brass,[-12.4,2.4,.1],[.2,.12,19],room);
 for(const z of[-7,-2,3,8])block('side-structural-post',steel,[-12.3,3.1,z],[.35,5.8,.35],room);
 // Side service bay; no equipment in the main door's swept area.
 model('factory/machine',[10.15,.3,-7.6],2.6,-.4,room);
 model('factory/pipe-large-valve',[7.35,.3,-8.15],2.6,0,room);
 model('furniture/cabinetBedDrawerTable',[-7.7,.3,-7.5],1.75,0,room);
 model('furniture/books',[-7.7,2.05,-7.5],.45,.2,room);
 model('props/vault-gear',[-8.7,2.05,-7.5],.65,.3,room);
 // Overhead frosted panels imply workshop lights without extra light sources.
 for(const x of[-8,0,8]){
  block('overhead-lamp-bracket',dark,[x,7.65,-4.8],[2,.18,.8],room);
  const panel=block('frosted-workshop-panel','#d8cfad',[x,7.52,-4.8],[1.75,.09,.62],room);const material=panel.material as T.MeshStandardMaterial;material.emissive.set('#d8cfad');material.emissiveIntensity=.22;
 }
 // Fine floor plates and paired service strips create a clear central aisle.
 for(let row=0;row<8;row++)block('steel-floor-cross-joint','#52676a',[0,.245,-10+row*3],[25.8,.015,.025],room);
 for(const side of[-1,1]){
  block('aisle-brass-guide',brass,[side*6.7,.25,1],[.065,.015,20],room);
  for(let j=0;j<5;j++){const o=block('service-bay-chevron',brass,[side*(7.6+j*.28),.252,-5.6],[.14,.012,.85],room);o.rotation.y=side*.55;}
 }
 // The revealed chamber has depth and objects, never secret color clues.
 block('safe-inner-floor',dark,[0,.37,-7.3],[7.7,.12,2.3],room);
 block('safe-inner-step',brass,[0,.32,-5.8],[8.25,.12,.85],room);
 for(const x of[-2.7,0,2.7]){
  block('safe-deposit-shelf',steel,[x,1.5,-7.55],[2.4,2.2,.75],room);
  for(const y of[.85,1.5,2.15]){block('deposit-drawer',dark,[x,y,-7.1],[2.15,.5,.12],room);block('deposit-drawer-pull',brass,[x,y,-6.99],[.5,.08,.12],room);}
 }
 room.userData.design={type:'locksmith-vault-workshop',doorClearance:true,publicDecorationOnly:true};
 return room;
}
