import * as T from 'three';
import type {createAdventureModels} from './adventure-models';

/** Cutaway timber room: props and hearth sit outside every occupied table place. */
export function createSalonRoom(parent:T.Group,assets:ReturnType<typeof createAdventureModels>,layout:{radiusX:number;radiusZ:number}){
 const root=new T.Group();root.name='salon-timber-room';parent.add(root);
 const halfX=layout.radiusX+4.2,halfZ=layout.radiusZ+4.6;
 const geometry=new Set<T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>();
 const cube=new T.BoxGeometry(1,1,1),pip=new T.SphereGeometry(1,8,6),flame=new T.ConeGeometry(1,1,5);geometry.add(cube);geometry.add(pip);geometry.add(flame);
 function mat(color:string,glow=false){const key=`${color}:${glow}`;let material=materials.get(key);if(!material){material=new T.MeshStandardMaterial({color,roughness:.9,...(glow?{emissive:color,emissiveIntensity:.6}: {})});materials.set(key,material);}return material;}
 function block(name:string,color:string,p:number[],s:number[],target:T.Group=root){const mesh=new T.Mesh(cube,mat(color));mesh.name=name;mesh.position.set(p[0],p[1],p[2]);mesh.scale.set(s[0],s[1],s[2]);mesh.castShadow=true;mesh.receiveShadow=true;target.add(mesh);return mesh;}
 block('salon-floor','#80614d',[0,.1,0],[halfX*2,.3,halfZ*2+1.2]);
 const planks=Math.ceil(halfX*2/1.2);
 for(let i=0;i<=planks;i++){const x=-halfX+i*halfX*2/planks;block('walnut-floor-seam','#654b3e',[x,.257,0],[.025,.012,halfZ*2+1.15]);if(i<planks)for(let j=0;j<3;j++)block('staggered-board-joint','#654b3e',[x+halfX/planks,.257,-halfZ+2.2+j*5.2+(i%2)*1.7],[halfX*2/planks,.012,.024]);}
 block('forest-green-back-wall','#365a50',[0,3.8,-halfZ],[halfX*2,7.4,.4]);
 block('cutaway-left-wall','#547065',[-halfX,2.1,-1],[.35,4,halfZ*2-2]);
 block('walnut-wainscot','#584235',[0,1.18,-halfZ+.24],[halfX*2,1.8,.22]);
 block('wainscot-rail','#c5a16c',[0,2.13,-halfZ+.35],[halfX*2,.12,.14]);
 block('ceiling-cornice','#d1b37c',[0,7.25,-halfZ+.3],[halfX*2,.2,.35]);
 for(const x of[-halfX+.2,-halfX*.3,halfX*.3,halfX-.2])block('timber-post','#5a4131',[x,3.8,-halfZ+.32],[.22,7.25,.32]);
 for(let i=0;i<Math.floor(halfX*2/.8);i++)block('wainscot-panel-seam','#49392f',[-halfX+.5+i*.8,1.15,-halfZ+.37],[.025,1.55,.03]);
 for(const x of[-halfX*.57,halfX*.57]){
  const w=halfX*.43;
  block('deep-window-frame','#9e794e',[x,4.65,-halfZ+.35],[w+.4,3.9,.28]);
  block('soft-window-sky','#c3d4c3',[x,4.65,-halfZ+.52],[w,3.5,.08]);
  block('window-mullion','#e7d5ac',[x,4.65,-halfZ+.6],[.1,3.6,.12]);
  block('window-crossbar','#e7d5ac',[x,4.55,-halfZ+.61],[w,.11,.12]);
  block('window-sill','#c3a476',[x,2.8,-halfZ+.66],[w+.55,.16,.55]);
  for(const side of[-1,1]){const curtain=block('folded-russet-curtain','#9c5950',[x+side*(w/2+.32),4.7,-halfZ+.72],[.5,4,.34]);curtain.rotation.z=-side*.035;block('curtain-tie','#d8b978',[x+side*(w/2+.32),4,-halfZ+.93],[.54,.15,.08]);}
 }
 block('hearth-dark-opening','#28292b',[0,1.35,-halfZ+.58],[2.6,2,.3]);
 for(const side of[-1,1])for(let i=0;i<3;i++)block('hearth-stone','#8b8875',[side*1.55,.63+i*.69,-halfZ+.85],[.65,.65,.72]);
 block('hearth-lintel','#a7a08b',[0,2.48,-halfZ+.88],[3.8,.55,.85]);
 block('walnut-mantel','#614735',[0,2.86,-halfZ+.95],[4.05,.2,1.05]);
 block('hearth-step','#93917d',[0,.36,-halfZ+1.08],[4,.18,1.5]);
 for(const side of[-1,1]){const log=block('hearth-log','#634532',[side*.36,.57,-halfZ+1.02],[1.3,.2,.25]);log.rotation.y=side*.38;}
 const fire=new T.Group();fire.name='quiet-salon-hearth';fire.userData.dynamic=true;root.add(fire);
 const flames=Array.from({length:3},(_,i)=>{const mesh=new T.Mesh(flame,mat(i===1?'#ffc66c':'#d98c45',true));mesh.position.set((i-1)*.38,.92,-halfZ+.96);mesh.rotation.y=i;fire.add(mesh);return mesh;});
 block('dice-club-crest-frame','#b79359',[0,4.8,-halfZ+.42],[2.2,2.2,.18]);
 block('dice-club-crest','#e3d5ad',[0,4.8,-halfZ+.54],[1.9,1.9,.12]);
 for(const[x,y]of[[-.5,-.5],[-.5,.5],[0,0],[.5,-.5],[.5,.5]]){const dot=new T.Mesh(pip,mat('#3f554b'));dot.position.set(x,4.8+y,-halfZ+.64);dot.scale.set(.15,.15,.04);root.add(dot);}
 const jobs:Promise<unknown>[]=[],errors:string[]=[];
 function model(id:string,p:[number,number,number],height:number,rotation=0){const job=assets.place({id,parent:root,position:p,height,rotation}).catch(()=>{errors.push(id);return null;});jobs.push(job);return job;}
 model('furniture/bookcaseClosedWide',[-halfX+1.25,.3,-halfZ+2.25],3.6);
 model('furniture/bookcaseOpen',[-halfX+1.25,.3,-halfZ+5],3.6);
 model('furniture/books',[-halfX+1.35,1.65,-halfZ+4.8],.55);
 const counterX=halfX-1.25;
 model('furniture/cabinetBedDrawerTable',[counterX,.3,-2],2);
 model('furniture/lampRoundTable',[counterX,2.3,-2.2],1.15);
 model('food/cup',[counterX-.55,2.3,-1.7],.3);
 model('food/bread',[counterX+.3,2.3,-1.7],.22);
 model('furniture/pottedPlant',[-halfX+.95,.3,halfZ-2.1],2.5);
 model('furniture/pottedPlant',[halfX-.9,.3,-halfZ+1.4],2.7);
 for(const side of[-1,1])model('furniture/lampWall',[side*(halfX-.65),3.9,-halfZ+.65],.75);
 root.userData.roomBounds={halfX,halfZ};
 return{root,ready:Promise.all(jobs),errors,update(now:number,reduced:boolean){flames.forEach((mesh,i)=>{const flicker=reduced?0:Math.sin(now*2.4+i*2.1)*.06+Math.sin(now*3.7+i)*.025;mesh.scale.set(.24+i%2*.035,.7+(i===1?.22:0)+flicker,.22);});},dispose(){root.removeFromParent();geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
