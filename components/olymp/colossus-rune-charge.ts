import * as T from 'three';
import type {locationKit} from './location-kit';
import {runeChargeFrame,colossusRuneOrigin} from '@/lib/colossus-runes';
import type {BossVenueFrame} from './boss-venue';

/** Shared geometry: two draws for every public station, no private dice data. */
export function createColossusRuneCharge(k:ReturnType<typeof locationKit>,players:{id:string;color:string}[],stations:{x:number;z:number}[]){
 const root=new T.Group();root.name='colossus-station-charge';root.userData.dynamic=true;k.root.add(root);
 const ringGeometry=new T.RingGeometry(.22,.27,16),sparkGeometry=new T.OctahedronGeometry(.065,0);k.geometries.add(ringGeometry);k.geometries.add(sparkGeometry);
 const material=new T.MeshBasicMaterial({color:'#ffffff',toneMapped:false,side:T.DoubleSide});
 const rings=new T.InstancedMesh(ringGeometry,material,players.length),sparks=new T.InstancedMesh(sparkGeometry,material,players.length);rings.name='public-rune-charge-rings';sparks.name='public-rune-charge-sparks';root.add(rings,sparks);
 const pose=new T.Object3D(),color=new T.Color(),phases=['#e8ca89','#8cd5cd','#c6b0e6'];
 // Prepare the instanced-color shader before the first interactive frame.
 players.forEach((player,i)=>{pose.position.set(stations[i].x,.393,stations[i].z+.65);pose.rotation.set(-Math.PI/2,0,0);pose.scale.setScalar(1);pose.updateMatrix();rings.setMatrixAt(i,pose.matrix);rings.setColorAt(i,color.set(player.color).multiplyScalar(.22));pose.scale.setScalar(0);pose.updateMatrix();sparks.setMatrixAt(i,pose.matrix);sparks.setColorAt(i,color.set(phases[0]));});
 rings.computeBoundingSphere();sparks.computeBoundingSphere();
 return {root,update(f:BossVenueFrame){
  const rows=players.map((player,i)=>{const station=stations[i],index=f.outcomes.findIndex(row=>row.id===player.id),outcome=index<0?undefined:f.outcomes[index];const row=runeChargeFrame(f.stage,f.elapsed,!!f.submitted[player.id],outcome,index,f.outcomes.length,!!f.motion),pulse=f.motion&&row.ready?Math.sin((f.now??0)*.003+i)*.035:0;
   pose.position.set(station.x,.393,station.z+.65);pose.rotation.set(-Math.PI/2,0,0);pose.scale.setScalar(1+pulse*row.charge);pose.updateMatrix();rings.setMatrixAt(i,pose.matrix);color.set(row.ready?phases[Math.max(0,Math.min(2,f.phase))]:player.color).multiplyScalar(row.ready?.35+.65*row.charge:.22);rings.setColorAt(i,color);
   const origin=colossusRuneOrigin(station);pose.position.set(origin[0],origin[1]+pulse*row.charge,origin[2]);pose.rotation.set(0,f.motion?(f.now??0)*.001:0,0);pose.scale.setScalar(row.charge);pose.updateMatrix();sparks.setMatrixAt(i,pose.matrix);sparks.setColorAt(i,color.set(phases[Math.max(0,Math.min(2,f.phase))]));
   return {id:player.id,ready:row.ready,charge:row.charge,launch:row.reveal?row.launch:null,origin};
  });
  rings.instanceMatrix.needsUpdate=true;sparks.instanceMatrix.needsUpdate=true;if(rings.instanceColor)rings.instanceColor.needsUpdate=true;if(sparks.instanceColor)sparks.instanceColor.needsUpdate=true;rings.computeBoundingSphere();sparks.computeBoundingSphere();root.userData.frame=rows;return rows;
 },dispose(){rings.dispose();sparks.dispose();material.dispose();root.removeFromParent();}};
}
