import * as T from 'three';
import {DRAGON_COINS_PER_PLAYER,dragonShot,dragonCoinOrigin,type DragonOutcome} from '@/lib/dragon-salvo';

/** A bounded, shared-geometry coin stream from each public treasure plinth. */
export function createDragonSalvo(scene:T.Scene,ids:string[],colors:string[],target:T.Vector3){
 const root=new T.Group();root.name='confirmed-dragon-coin-salvo';scene.add(root);
 const coinGeo=new T.CylinderGeometry(.13,.13,.045,12),haloGeo=new T.RingGeometry(.16,.21,24);
 const coinMat=new T.MeshStandardMaterial({color:'#f4c86a',metalness:.72,roughness:.3,emissive:'#8f5819',emissiveIntensity:.28});
 const haloMat=new T.MeshBasicMaterial({color:'#fff0b1',transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide});
 const coins=new T.InstancedMesh(coinGeo,coinMat,ids.length*DRAGON_COINS_PER_PLAYER),halos=new T.InstancedMesh(haloGeo,haloMat,ids.length);
 const pools=[coins,halos],dummy=new T.Object3D(),origin=new T.Vector3();
 pools.forEach((mesh,i)=>{mesh.name=i?'dragon-contribution-rings':'dragon-earned-coins';mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.visible=false;root.add(mesh);});
 const state=ids.map((id,i)=>({id,origin:dragonCoinOrigin(i,ids.length),earned:false,power:0,coins:0,visibleCoins:0,fireAt:0,impactAt:0,impact:false}));
 const color=new T.Color();ids.forEach((_,i)=>{color.set(colors[i]??'#f4c86a');halos.setColorAt(i,color);});
 function put(pool:T.InstancedMesh,index:number,visible:boolean){if(!visible)dummy.scale.setScalar(0);dummy.updateMatrix();pool.setMatrixAt(index,dummy.matrix);}
 return {root,pools,
  update(elapsed:number,reveal:boolean,reduced:boolean,intense:boolean,outcomes:DragonOutcome[]){
   let activeCoins=0,activeHalos=0;
   ids.forEach((id,i)=>{
    const index=outcomes.findIndex(o=>o.id===id),shot=dragonShot(outcomes[index],Math.max(0,index),outcomes.length),row=state[i];
    row.earned=reveal&&shot.earned;row.power=row.earned?shot.power:0;row.coins=row.earned?shot.coins:0;row.visibleCoins=0;row.fireAt=shot.fireAt;row.impactAt=shot.impactAt;
    origin.fromArray(row.origin);
    for(let j=0;j<DRAGON_COINS_PER_PLAYER;j++){
     const progress=(elapsed-shot.fireAt-j*.018)/.75;
     const visible=row.earned&&!reduced&&j<shot.coins&&(intense||j<3)&&progress>=0&&progress<=1;
     if(visible){
      const spread=Math.sin(progress*Math.PI),angle=j*2.399;
      dummy.position.lerpVectors(origin,target,progress);
      dummy.position.x+=Math.cos(angle)*.27*spread;dummy.position.z+=Math.sin(angle)*.27*spread;
      dummy.position.y+=spread*(1.1+j*.025);
      dummy.rotation.set(progress*10+j,progress*7,j*.7);dummy.scale.setScalar(.8+shot.power*.4);
      activeCoins++;row.visibleCoins++;
     }
     put(coins,i*DRAGON_COINS_PER_PLAYER+j,visible);
    }
    const age=elapsed-shot.impactAt;
    row.impact=row.earned&&age>=0&&age<.45;
    const halo=row.impact&&!reduced;
    dummy.position.copy(target);dummy.rotation.set(0,0,i*.5);dummy.scale.setScalar((.7+shot.power*.5)*(1+Math.max(0,age)*2));
    put(halos,i,halo);if(halo)activeHalos++;
   });
   coins.visible=activeCoins>0;halos.visible=activeHalos>0;
   pools.forEach(p=>{if(p.visible)p.instanceMatrix.needsUpdate=true;});
  },
  snapshot:()=>({shots:state,draws:pools.filter(p=>p.visible).length}),
  dispose(){root.removeFromParent();pools.forEach(p=>p.dispose());coinGeo.dispose();haloGeo.dispose();coinMat.dispose();haloMat.dispose();}
 };
}
