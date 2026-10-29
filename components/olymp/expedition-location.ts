import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {createIslandTerrain} from './journey-terrain';
import {chainFrame,chainPath,type ChainEntry} from '@/lib/chain-presentation';
import {createExpeditionGorge,decorateExpeditionIsland} from './expedition-gorge';

export function createExpeditionLocation(scene:T.Scene,count:number){
 const k=locationKit(scene,'chain-jungle-expedition'),{root,block,model,sign}=k;
 const gorge=createExpeditionGorge(k);
 block('river-in-gorge','#448c96',[-3,-1.3,0],[64,.2,36]);
 const islands=Array.from({length:3},(_,slot)=>{
  const group=new T.Group();group.name=`expedition-island-${slot}`;root.add(group);const ground=['#9eae83','#a9b88f','#8fae88'][slot],g=createIslandTerrain(T,14,8+slot*3,ground);k.geometries.add(g);const lawn=g.getAttribute('color'),color=new T.Color(ground).lerp(new T.Color('#8da077'),.12).multiplyScalar(.97),segments=g.userData.organicCoast.length;for(let i=0;i<segments*2;i++)lawn.setXYZ(i,color.r,color.g,color.b);lawn.setXYZ(lawn.count-1,color.r,color.g,color.b);const material=k.mat('#ffffff');material.vertexColors=true;const land=new T.Mesh(g,material);land.scale.set(slot===0?.42:.34,.14,.55);land.receiveShadow=true;group.add(land);
  for(let i=0;i<3;i++)model('nature/tree_plateau',[-3+i*2.6,0,-4.8-(i%2)*1.5],3.8+i%2,slot+i,group);
  for(let i=0;i<3;i++)model('nature/rock_largeA',[-3.8+i*3.4,-.6,3.9+(i%2)*.7],1.5+(i%2)*.6,i,group);
  if(slot===0){block('basecamp-boardwalk','#a88660',[-1,.04,-.8],[7.2,.18,4.8],group);model('furniture/table',[-2.5,.1,-4],.9,0,group);model('furniture/books',[-2.5,1,-4],.35,0,group);}
  decorateExpeditionIsland(k,group,slot);
  block('trail-sign-post','#795e48',[0,.55,3.5],[.14,1.1,.14],group);const milestone=sign('',[0,1.45,3.5],3.8,.55,'#eee0bb','#34544f');milestone.name=`expedition-milestone-${slot}`;
  return {group,milestone};
 });
 const ferry=new T.Group();ferry.name='expedition-spectator-ferry';ferry.position.set(-6,0,7.1);root.add(ferry);
 const boat=model('watercraft/ship-hull',[0,0,0],1,Math.PI/2,ferry).then(hull=>{if(!hull)return;const scale=11/hull.userData.nativeSize[2];hull.scale.setScalar(scale);hull.position.y=.4-2.1*scale;});
 block('ferry-open-deck','#a78b64',[0,.42,0],[8.8,.2,2.7],ferry);
 const ferrySign=sign('DIE CREW PRÜFT WEITER',[-6,-.05,9.1],6,.45,'#f3e2b8','#34544f');ferrySign.rotation.x=-Math.PI/6;

 const beacon=sign('DU BIST DRAN',[0,3.2,0],4.2,.6,'#f4d992','#34544f');beacon.name='expedition-active-marker';beacon.userData.pick='chainAnswer';
 const plankGeo=new T.BoxGeometry(1.16,.18,3.4),postGeo=new T.BoxGeometry(.1,.65,.1),ropeGeo=new T.CylinderGeometry(.045,.045,1,6);for(const g of[plankGeo,postGeo,ropeGeo])k.geometries.add(g);
 const bridge=new T.InstancedMesh(plankGeo,k.mat('#b68b5e'),24),posts=new T.InstancedMesh(postGeo,k.mat('#d6bc85'),48),ropes=new T.InstancedMesh(ropeGeo,k.mat('#c4ad80'),48);bridge.name='accepted-word-bridge';for(const m of[bridge,posts,ropes]){m.castShadow=true;m.receiveShadow=true;root.add(m);m.count=0;}
 const words=Array.from({length:12},()=>{const word=sign('',[0,0,0],2.8,.72,'#263f42','#dfc99d',.6);word.rotation.x=-Math.PI/2;word.rotation.z=-Math.PI/2;word.visible=false;return word;});
 const pose=new T.Object3D(),a=new T.Vector3(),b=new T.Vector3(),direction=new T.Vector3(),up=new T.Vector3(0,1,0);let disposed=false,key='',entries:ChainEntry[]=[],frame:ReturnType<typeof chainFrame>|null=null;const releases:(()=>void)[]=[];
 const ready=Promise.all([k.ready(),boat]).then(()=>{if(!disposed){for(const item of islands)releases.push(batchStaticMeshes(item.group,{mergeUnique:true}));releases.push(batchStaticMeshes(ferry,{mergeUnique:true}));releases.push(batchStaticMeshes(gorge,{mergeUnique:true}));}});
 return {...k,bridge,pickables:[beacon],ready,position(i:number){return new T.Vector3(...(frame?.rows[i]?.point??[-10+(i%2)*1.3,.52,-2+Math.floor(i/2)*.9]));},
  update(now:number,game:any,crew:{id?:string;name?:string}[],me:string,reduced:boolean,focused=false){
   const last=game.history?.at(-1),nextKey=`${game.round}:${game.history?.length??0}:${last?.id??''}:${last?.valid}`;if(key!==nextKey){key=nextKey;entries=(game.history??[]).filter((e:ChainEntry)=>e.valid===true);}
   frame=chainFrame(game,crew,me,now,reduced,entries);beacon.userData.pickDisabled=!frame.canType;
   for(const index of frame.islands){const item=islands[index%3],point=chainPath(index===0?-2:index*12);if(index===0)point[2]=0;item.group.position.set(point[0]-frame.scroll,.35,point[2]);item.milestone.position.set(point[0]-frame.scroll,1.45,point[2]+3.5);item.milestone.userData.setText(index===0?'EUER BASISLAGER':`AUSBLICK ${index} · ${index*12} IDEEN`);}
   bridge.count=frame.planks.length;posts.count=ropes.count=frame.planks.length*2;
   frame.planks.forEach((plank,i)=>{
    pose.position.fromArray(plank.point);pose.position.y=.4-(1-plank.build)*.5;pose.rotation.set(0,0,0);pose.scale.set(1,Math.max(.05,plank.build),1);pose.updateMatrix();bridge.setMatrixAt(i,pose.matrix);
    for(const side of[-1,1]){const j=i*2+(side>0?1:0),p=chainPath(plank.number);pose.position.set(p[0]-frame!.scroll,.4+.325*plank.build,p[2]+side*1.65);pose.scale.set(1,Math.max(.05,plank.build),1);pose.updateMatrix();posts.setMatrixAt(j,pose.matrix);
     a.fromArray(chainPath(plank.number-1));b.fromArray(p);a.x-=frame!.scroll;b.x-=frame!.scroll;a.y=b.y=.4+.65*plank.build;a.z+=side*1.65;b.z+=side*1.65;direction.subVectors(b,a);pose.position.copy(a).add(b).multiplyScalar(.5);pose.quaternion.setFromUnitVectors(up,direction.clone().normalize());pose.scale.set(1,direction.length(),Math.max(.05,plank.build));pose.updateMatrix();ropes.setMatrixAt(j,pose.matrix);pose.rotation.set(0,0,0);
    }
   });
   for(const mesh of[bridge,posts,ropes]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
   const latest=frame.planks.slice(-12);words.forEach((word,i)=>{const plank=latest[i];word.visible=!!plank;if(plank){word.position.fromArray(plank.point);word.position.y=.505;word.userData.setText(`${plank.number}. ${plank.answer.slice(0,18)}`);}});

   const active=frame.rows.find(r=>r.id===game.turnId);beacon.visible=!!active&&active.alive&&!frame.revealing;if(active){beacon.position.set(active.point[0],3.2,active.point[2]-.4);beacon.userData.setText(focused&&frame.canType?game.topic?.name??'DEIN BEGRIFF':`${active.name.slice(0,14)} IST DRAN`);}
   root.userData.accepted=frame.accepted;root.userData.frame=frame;
  },dispose(){if(disposed)return;disposed=true;releases.forEach(release=>release());bridge.dispose();posts.dispose();ropes.dispose();k.dispose();}
 };
}
