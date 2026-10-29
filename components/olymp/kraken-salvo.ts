import * as T from 'three';
import {krakenShot,krakenTarget,type KrakenOutcome} from '@/lib/kraken-salvo';

/** Four fixed instance pools. No particle objects or GPU resources are created per shot. */
export function createKrakenSalvo(scene:T.Scene,guns:T.Group[],ids:string[],boss:T.Vector3){
 const root=new T.Group();root.name='confirmed-kraken-salvo';scene.add(root);
 const puff=new T.IcosahedronGeometry(1,0),ring=new T.TorusGeometry(1,.035,4,24);
 const flashMat=new T.MeshBasicMaterial({color:'#ffe3a1',transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false});
 const smokeMat=new T.MeshBasicMaterial({color:'#b0b8bc',transparent:true,opacity:.24,depthWrite:false});
 const waterMat=new T.MeshBasicMaterial({color:'#a2e9ef',transparent:true,opacity:.85,depthWrite:false});
 const pools=[new T.InstancedMesh(puff,flashMat,ids.length),new T.InstancedMesh(puff,smokeMat,ids.length*3),new T.InstancedMesh(puff,waterMat,ids.length*12),new T.InstancedMesh(ring,waterMat,ids.length)];
 pools.forEach((mesh,i)=>{mesh.name=['cannon-muzzle-flashes','cannon-drifting-smoke','kraken-water-drops','kraken-water-rings'][i];mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.visible=false;root.add(mesh);});
 const dummy=new T.Object3D(),origin=new T.Vector3(),forward=new T.Vector3(),rotation=new T.Quaternion(),target=new T.Vector3();
 const base=boss.toArray(),state=ids.map(id=>({id,confirmed:false,hit:false,fireAt:0,impactAt:0,flash:false,smoke:false,water:false,muzzle:[0,0,0],target:[0,0,0]}));
 function put(pool:T.InstancedMesh,index:number,visible:boolean){if(!visible)dummy.scale.setScalar(0);dummy.updateMatrix();pool.setMatrixAt(index,dummy.matrix);}
 return {root,pools,
  update(elapsed:number,reveal:boolean,reduced:boolean,intense:boolean,outcomes:KrakenOutcome[]){
   if(!reveal||reduced){pools.forEach(p=>p.visible=false);state.forEach(row=>{row.confirmed=false;row.hit=false;row.flash=false;row.smoke=false;row.water=false;});return;}
   const active=[0,0,0,0];
   ids.forEach((id,i)=>{
    const index=outcomes.findIndex(o=>o.id===id),shot=krakenShot(outcomes[index],Math.max(0,index),outcomes.length,elapsed),gun=guns[i];
    const allowed=reveal&&!reduced&&shot.confirmed&&!!gun;
    if(gun){gun.updateWorldMatrix(true,false);origin.set(0,.455,-.72);gun.localToWorld(origin);gun.getWorldQuaternion(rotation);forward.set(0,0,-1).applyQuaternion(rotation);}
    else origin.set(0,0,0);
    const flash=allowed&&shot.age>=0&&shot.age<.16;
    dummy.position.copy(origin).addScaledVector(forward,.08);dummy.quaternion.copy(rotation);dummy.scale.set(.19,.19,.34).multiplyScalar(Math.max(0,1-shot.age/.16));put(pools[0],i,flash);if(flash)active[0]++;
    const smoke=allowed&&shot.age>=0&&shot.age<.7;
    for(let j=0;j<3;j++){const size=(.08+shot.age*.24)*(1-j*.12);dummy.position.copy(origin).addScaledVector(forward,.08+shot.age*(.6+j*.14));dummy.position.y+=shot.age*.32+j*.025;dummy.rotation.set(i,j,shot.age);dummy.scale.setScalar(size);put(pools[1],i*3+j,smoke&&(intense||j===0));if(smoke&&(intense||j===0))active[1]++;}
    target.fromArray(krakenTarget(i,shot.hit,base));
    const water=allowed&&shot.impactAge>=0&&shot.impactAge<.85;
    for(let j=0;j<12;j++){const t=shot.impactAge,a=j*2.399+i*.7,speed=.6+(j%4)*.28;dummy.position.copy(target);dummy.position.x+=Math.cos(a)*t*speed;dummy.position.z+=Math.sin(a)*t*speed;dummy.position.y+=t*(1.4+(j%3)*.4)-2.8*t*t;dummy.rotation.set(a,t*3,i);dummy.scale.set(.035,.1,.035).multiplyScalar(Math.max(0,1-t/.85));put(pools[2],i*12+j,water&&(intense||j%3===0));if(water&&(intense||j%3===0))active[2]++;}
    dummy.position.copy(target);dummy.position.y=.16;dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(.15+Math.max(0,shot.impactAge)*1.5);put(pools[3],i,water&&!shot.hit);if(water&&!shot.hit)active[3]++;
    const row=state[i];row.confirmed=shot.confirmed;row.hit=shot.hit;row.fireAt=shot.fireAt;row.impactAt=shot.impactAt;row.flash=flash;row.smoke=smoke;row.water=water;origin.toArray(row.muzzle);target.toArray(row.target);
   });
   pools.forEach((pool,i)=>{pool.visible=active[i]>0;if(pool.visible)pool.instanceMatrix.needsUpdate=true;});
  },
  snapshot:()=>({shots:state,draws:pools.filter(p=>p.visible).length}),
  dispose(){root.removeFromParent();pools.forEach(p=>p.dispose());puff.dispose();ring.dispose();flashMat.dispose();smokeMat.dispose();waterMat.dispose();}
 };
}
