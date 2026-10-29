import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {bombFrame,bombSeat,bombStation} from '@/lib/bomb-presentation';
import {createInventorsHall} from './inventors-hall';

export function createBombWorkshop(scene:T.Scene,count:number){
 const k=locationKit(scene,'bomb-inventors-workshop'),{root,block:primitive,model,sign}=k,props=new T.Group();props.name='workshop-machinery';root.add(props);
 const block=(name:string,color:string,p:[number,number,number],size:[number,number,number],parent:T.Object3D=props)=>primitive(name,color,p,size,parent);
 createInventorsHall(k,props);
 block('workshop-floor','#8f9585',[0,.08,0],[27,.3,23]);block('brick-wall','#6e7772',[0,5.3,-10.5],[27,10,.4]);
 block('workshop-side-wall','#587780',[-13.2,3.5,0],[.3,7,21]);
 for(let i=-12;i<=12;i+=6)block('steel-roof-support','#455b60',[i,5.3,-10.1],[.15,10,.2]);
 sign('WERKSTATT FÜR GEWAGTE WÖRTER',[0,9.3,-9.9],20,1,'#eddfb4','#3b515a');
 model('factory/machine',[-9.5,.3,-9],3.8,0,props);model('factory/machine',[9.5,.3,-9],3.8,Math.PI,props);
 for(let i=0;i<5;i++)model('factory/pipe-large-long',[-6+i*3,7.7,-10],3,i%2?Math.PI:0,props);
 model('factory/pipe-large-valve',[-11.8,.3,-3.7],3.5,0,props);model('factory/pipe-large-bend',[11.7,2.5,-8.5],2.7,0,props);
 for(let i=0;i<4;i++)model('factory/conveyor-bars-fence',[-5+i*3.2,.3,-9],3.2,0,props);
 for(let i=0;i<3;i++)model('factory/box-large',[7.8+i*.85,.3,7],1.05,0,props);
 const seats=Array.from({length:count},(_,i)=>new T.Vector3(...bombSeat(i,count)));
 const stations=seats.map((_,i)=>new T.Vector3(...bombStation(i,count)));
 stations.forEach(p=>model('furniture/cabinetBedDrawerTable',[p.x,.3,p.z],.8,0,props));
 stations.forEach(p=>{block('personal-bomb-tray','#8e9d95',[p.x,1.04,p.z],[1.55,.12,1.55]);for(const dx of[-.72,.72])block('bomb-tray-rim','#d3bc86',[p.x+dx,1.13,p.z],[.08,.12,1.55]);});
 const spectators=seats.map((_,i)=>new T.Vector3((i-(count-1)/2)*1.8,.98,9.5));block('spectator-bench','#bf9d68',[0,.65,9.7],[Math.max(4,count*1.8+1),.5,1.3]);
 block('spectator-bench-back','#8e7960',[0,1.1,10.25],[Math.max(4,count*1.8+1),.4,.16]);
 const bomb=new T.Group();bomb.name='held-word-bomb';root.add(bomb);const sphere=new T.SphereGeometry(.7,20,12);k.geometries.add(sphere);
 const body=new T.Mesh(sphere,k.mat('#263c49'));body.userData.pick='bombWord';body.castShadow=true;bomb.add(body);block('bomb-cap','#b1aa8c',[0,.74,0],[.35,.2,.35],bomb);
 const fuseCurve=new T.QuadraticBezierCurve3(new T.Vector3(0,.83,0),new T.Vector3(-.1,1.5,0),new T.Vector3(.55,1.1,0)),fuseGeometry=new T.TubeGeometry(fuseCurve,12,.04,5,false);k.geometries.add(fuseGeometry);bomb.add(new T.Mesh(fuseGeometry,k.mat('#d0b77f')));
 block('fuse-tip','#e8ad69',[.55,1.1,0],[.12,.12,.12],bomb);
 for(const x of[-.22,.22]){const eye=new T.Mesh(sphere,k.mat('#e7e1c7'));eye.scale.set(.17,.2,.07);eye.position.set(x,.12,.65);bomb.add(eye);block('bomb-pupil','#172e39',[x,.1,.72],[.08,.11,.03],bomb);}
 const fragment=sign('…',[0,5.9,-9.8],7,1.4,'#f5ddb0','#304d57'),status=sign('DIE BOMBE GEHT AUF REISEN',[0,4.7,-9.8],12,.7,'#e8ddb9','#304d57');
 const latest=sign('JEDES NEUE WORT SCHICKT DIE BOMBE WEITER',[0,3.85,-9.8],12,.6,'#e8ddb9','#304d57');
 fragment.name='bomb-fragment-board';status.name='bomb-status-board';latest.name='bomb-latest-board';
 const labels=seats.map((p,i)=>{const note=sign('',[p.x,.63,p.z+1.05],2.7,.45,'#f0dfba','#304d57',.65);note.rotation.x=-Math.PI/5;note.name='bomb-crew-'+i;return note;});
 const smokeMaterial=new T.MeshBasicMaterial({color:'#c1c3b2',transparent:true,opacity:0,depthWrite:false}),smoke=new T.InstancedMesh(sphere,smokeMaterial,8),pose=new T.Object3D(),tint=new T.Color();smoke.name='comic-smoke';root.add(smoke);
 const lampGeometry=new T.SphereGeometry(.13,8,6);k.geometries.add(lampGeometry);const lamps=new T.InstancedMesh(lampGeometry,k.mat('#ffffff'),count);lamps.name='bomb-crew-lamps';for(let i=0;i<count;i++)lamps.setColorAt(i,tint.set('#92bfa8'));root.add(lamps);
 const releaseBomb=batchStaticMeshes(bomb,{mergeUnique:true});bomb.userData.dynamic=true;
 let disposed=false,release=()=>{},frame:ReturnType<typeof bombFrame>|null=null;
 const ready=k.ready().then(()=>{if(!disposed)release=batchStaticMeshes(props,{mergeUnique:true});});
 return {...k,seats,stations,spectators,bomb,pickables:[body],ready,position(i:number){return seats[i].clone().lerp(spectators[i],frame?.rows[i]?.bench??0);},update(now:number,game:any,crew:{id?:string;name?:string}[],reduced:boolean,me:string,focused=false){
  frame=bombFrame(game,crew,me,now);if(reduced)frame.rows.forEach(r=>{if(!r.alive){r.bench=1;r.leaving=1;}});body.userData.pickDisabled=!frame.canType;
  if(reduced&&!frame.exploding){const i=Math.max(0,crew.findIndex(p=>p.id===game.turnId));bomb.position.copy(stations[i]);}else bomb.position.fromArray(frame.position);bomb.visible=!frame.exploding&&!frame.revealing;
  const age=frame.smokeAge;smoke.visible=!reduced&&frame.smoke;smokeMaterial.opacity=smoke.visible?.5*(1-age/1.6):0;
  if(smoke.visible){for(let i=0;i<8;i++){pose.position.copy(bomb.position).add(new T.Vector3(Math.cos(i*2.4)*age*1.2,age*.9,Math.sin(i*2.4)*age));pose.scale.setScalar(.3+age*.7);pose.updateMatrix();smoke.setMatrixAt(i,pose.matrix);}smoke.instanceMatrix.needsUpdate=true;smoke.computeBoundingSphere();}
  const index=Math.max(0,crew.findIndex(p=>p.id===game.turnId)),last=game.history?.at(-1),winner=crew.find(p=>p.id===game.reveal?.winner);
  if(focused&&frame.canType){fragment.position.set(stations[index].x,4.4,stations[index].z-.3);}else fragment.position.set(0,5.9,-9.8);status.visible=latest.visible=!(focused&&frame.canType);
  fragment.userData.setText(frame.revealing?'GERETTET!':frame.exploding?'POFF!':game.fragment??'…');status.userData.setText(frame.revealing?`${winner?.name??'CREW'} RETTET DIE WERKSTATT`:frame.exploding?'EIN BISSCHEN RUSS. VIEL APPLAUS.':frame.judging?`CREW PRÜFT · ${frame.ready} / ${frame.judges} VERSIEGELT`:`${crew[index]?.name??'CREW'} HAT DIE BOMBE · ${frame.alive} NOCH DABEI`);
  latest.userData.setText(frame.judging?`PASST DAS WORT? ${game.candidate?.word??''}`:frame.verdict?`${frame.verdict.valid?'BESTÄTIGT':'ABGELEHNT'}: ${frame.verdict.word} · ${frame.verdict.yes} JA / ${frame.verdict.no} NEIN`:last?`ZULETZT: ${last.word}`:'JEDES NEUE WORT SCHICKT DIE BOMBE WEITER');
  const activeId=frame.revealing?game.reveal?.winner:game.turnId;frame.rows.forEach((row,i)=>{const p=seats[i].clone().lerp(spectators[i],row.bench);labels[i].position.set(p.x,.63,p.z+1.05);labels[i].userData.setText(`${row.id===activeId?'★ ':''}${row.name.slice(0,9)} · ${row.alive?row.words+' W':'SCHAUT ZU'}${frame!.judging&&row.id!==game.turnId?(row.voted?' ✓':' ?'):''}`);pose.position.set(labels[i].position.x,labels[i].position.y-.32,labels[i].position.z);pose.scale.setScalar(1);pose.updateMatrix();lamps.setMatrixAt(i,pose.matrix);lamps.setColorAt(i,tint.set(!row.alive?'#758388':row.id===game.turnId?'#efb87c':row.voted&&frame!.judging?'#b2d593':'#92bfa8'));});lamps.instanceMatrix.needsUpdate=true;lamps.instanceColor!.needsUpdate=true;lamps.computeBoundingSphere();root.userData.holder=game.turnId;root.userData.turn=game.turn;root.userData.frame={...frame,position:bomb.position.toArray(),smokeVisible:smoke.visible};
 },dispose(){if(disposed)return;disposed=true;release();releaseBomb();smoke.dispose();lamps.dispose();k.dispose();}};
}

