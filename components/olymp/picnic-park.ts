import * as T from 'three';
import {herdGroupCenter} from '@/lib/herd-layout';
import {herdFrame,herdSeat,herdWrap} from '@/lib/herd-presentation';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {createIslandTerrain} from './journey-terrain';
import {createPicnicGarden} from './picnic-garden';

export function createPicnicPark(scene:T.Scene,count:number){
 const k=locationKit(scene,'herd-thoughts-picnic-park'),{root,model,block:primitive,sign}=k,props=new T.Group();props.name='picnic-garden';root.add(props);
 const block=(name:string,color:string,p:[number,number,number],size:[number,number,number],parent:T.Object3D=props)=>primitive(name,color,p,size,parent);
 createPicnicGarden(k,props);
 const terrain=createIslandTerrain(T,18,21,'#99b27d');k.geometries.add(terrain);
 // The broad playing lawn is quiet and even; preserve the varied coastal lip.
 // Angular colors near the fan's center otherwise produce a distracting star.
 const lawn=terrain.getAttribute('color'),lawnColor=new T.Color('#99b27d').lerp(new T.Color('#8da077'),.12).multiplyScalar(.97),segments=terrain.userData.organicCoast.length;
 for(let i=0;i<segments*2;i++)lawn.setXYZ(i,lawnColor.r,lawnColor.g,lawnColor.b);lawn.setXYZ(lawn.count-1,lawnColor.r,lawnColor.g,lawnColor.b);
 const landMaterial=k.mat('#ffffff');landMaterial.vertexColors=true;const land=new T.Mesh(terrain,landMaterial);land.scale.set(1,.18,.85);land.receiveShadow=true;root.add(land);
 for(const side of[-1,1]){model('furniture/table',[side*14,.2,8],1.1,0,props);model('food/apple',[side*14,1.3,8],.35,0,props);model('food/pizza-box',[side*14+.6,1.3,8],.65,0,props);block('picnic-blanket',side<0?'#d6a391':'#9dbac3',[side*14.2,.2,5],[4,.025,2.8]);}
 for(const[x,z,h]of[[-14,-7,6],[-15,1,5],[14,-7,6],[15,1,5],[-7,-12,5],[7,-12,5]])model('nature/tree_plateau',[x,.1,z],h,x*.2,props);
 for(let i=0;i<6;i++)model('nature/plant_bush',[-12+i*4.8,.1,-9],1,i,props);
 const question=sign('WAS DENKT EURE CREW?',[0,10,-11.5],23,1.15,'#f0e4c0','#42675b');
 const outcome=sign('GEDANKEN BLEIBEN ZUERST VERSCHLOSSEN',[0,8.8,-11.5],23,.8,'#f0e4c0','#42675b');
 const seats=Array.from({length:count},(_,i)=>{const p=herdSeat(i,count);return new T.Vector3(p.x,.25,p.z);});
 const thoughts=seats.map((p,i)=>{const note=sign('…',[p.x,2.15,p.z],1.1,.65,'#355648','#eee5cb');note.userData.pick='herdAnswer';return note;});
 const cloudGeometry=new T.SphereGeometry(1,8,6);k.geometries.add(cloudGeometry);
 const cloudLobes=[[0,0,.75,.5],[-.35,.2,.35,.28],[.3,.22,.34,.25],[.5,-.03,.26,.3],[-.24,-.57,.08,.08]],clouds=new T.InstancedMesh(cloudGeometry,new T.MeshBasicMaterial({color:'#eee5cb'}),count*cloudLobes.length),cloudPose=new T.Object3D();clouds.name='sealed-thought-clouds';
 seats.forEach((p,i)=>cloudLobes.forEach(([x,y,sx,sy],j)=>{cloudPose.position.set(p.x+x,2.15+y,p.z-.25);cloudPose.scale.set(sx,sy,.1);cloudPose.updateMatrix();clouds.setMatrixAt(i*cloudLobes.length+j,cloudPose.matrix);}));clouds.computeBoundingSphere();root.add(clouds);
 const thoughtHitGeometry=new T.PlaneGeometry(1.6,1.3);k.geometries.add(thoughtHitGeometry);
 const thoughtTargets=seats.map(p=>{const hit=new T.Mesh(thoughtHitGeometry,new T.MeshBasicMaterial({visible:false}));hit.name='herd-thought-hit';hit.position.set(p.x,2.15,p.z+.03);hit.userData.pick='herdAnswer';root.add(hit);return hit;});
 const ownRingGeometry=new T.TorusGeometry(1,.035,5,32);k.geometries.add(ownRingGeometry);const ownRing=new T.Mesh(ownRingGeometry,k.mat('#ead19a'));ownRing.name='herd-own-thought-ring';ownRing.rotation.x=-Math.PI/2;root.add(ownRing);
 const markerGeometry=new T.CylinderGeometry(2.9,2.9,.035,32);k.geometries.add(markerGeometry);const groupColors=['#dac68f','#b6cbd7','#c9b5d2','#a8c7a1','#d3a8a0','#adc8bb'];
 const markers=Array.from({length:count},(_,i)=>{const marker=new T.Mesh(markerGeometry,k.mat(groupColors[i%6]));marker.name=`herd-group-${i}`;root.add(marker);const caption=sign('',[0,4.5,0],6.2,2.3,'#233f3e','#f0e0b6');caption.name=`herd-group-caption-${i}`;
  const texture=(caption.material as T.MeshBasicMaterial).map,canvas=typeof document!=='undefined'?document.createElement('canvas'):null;if(canvas&&texture){canvas.width=1024;canvas.height=384;texture.image=canvas;texture.needsUpdate=true;}let previous='';
  const paint=(group:{answer:string;ids:string[];score:number;winner:boolean})=>{const key=JSON.stringify(group);if(key===previous)return;previous=key;caption.userData.group=group;if(!canvas)return;const c=canvas.getContext('2d')!;c.fillStyle=group.winner?'#fff0bb':'#f0e7d0';c.fillRect(0,0,1024,384);c.strokeStyle=group.winner?'#a77b26':'#66837a';c.lineWidth=12;c.strokeRect(6,6,1012,372);c.textAlign='left';c.textBaseline='middle';c.fillStyle='#31574e';c.font='700 32px sans-serif';c.fillText(`GRUPPE ${i+1} · ${group.ids.length} ${group.ids.length===1?'GEDANKE':'GEDANKEN'}`,42,46);c.font='700 46px sans-serif';const lines=herdWrap(group.answer,940,s=>c.measureText(s).width);lines.forEach((line,n)=>c.fillText(line,42,117+n*54));c.font='700 30px sans-serif';c.fillText(group.winner?`★ JE +${group.score} PUNKTE`:'KEINE GRUPPENPUNKTE',42,342);texture!.needsUpdate=true;};
  const overview=sign('',[0,.7,0],3.2,.55,'#24483e','#f0e7d0');overview.name=`herd-group-plaque-${i}`;
  return {marker,caption,overview,paint};});
 const missing=sign('OHNE ANTWORT',[0,1.1,9.7],12,.6,'#f0e4c0','#42675b');missing.visible=false;
 let frame=herdFrame({},[],0),disposed=false,release=()=>{};const ready=k.ready().then(()=>{if(!disposed)release=batchStaticMeshes(props,{mergeUnique:true});});
 return {...k,seats,thoughts,pickables:thoughtTargets,ready,position(index:number,id:string){const p=frame.rows.find(r=>r.id===id);return p?new T.Vector3(p.x,.25,p.z):seats[index];},follow(actors:{root:T.Group}[]){thoughts.forEach((note,i)=>{note.position.copy(actors[i].root.position);note.position.y+=1.9;thoughtTargets[i].position.copy(note.position);thoughtTargets[i].position.z+=.03;});},
 update(now:number,game:any,crew:{id?:string}[],me:string,reduced=false,selected=-1){frame=herdFrame(game,crew,now,reduced);const {revealed,groups}=frame;
  clouds.visible=!revealed;
  question.visible=outcome.visible=selected<0||!revealed;
  const ownIndex=crew.findIndex(c=>c.id===me);ownRing.visible=!revealed&&ownIndex>=0;if(ownIndex>=0){ownRing.position.copy(seats[ownIndex]);ownRing.position.y=.3;}
  question.userData.setText(frame.question??'WAS DENKT EURE CREW?');outcome.userData.setText(!revealed?'GEDANKEN BLEIBEN ZUERST VERSCHLOSSEN':groups.length===0?'KEINE ANTWORTEN · KEINE GRUPPENPUNKTE':(groups[0]?.ids.length??0)<2?'ALLE GEDANKEN SIND EINZELN · KEINE GRUPPENPUNKTE':!frame.winners?'GLEICHSTAND · KEINE EINZIGE GRÖSSTE GRUPPE':`${groups.find(g=>g.winner)?.ids.length??0} GEDANKEN TREFFEN SICH · JE 100 PUNKTE`);
  thoughts.forEach((note,i)=>{note.visible=thoughtTargets[i].visible=!revealed;note.userData.pickDisabled=thoughtTargets[i].userData.pickDisabled=game.mine?.submitted||game.stage!=='answer'||crew[i]?.id!==me;note.userData.setText(game.submitted?.[crew[i]?.id??'']?'✓':crew[i]?.id===me?'✎':'…');});
  markers.forEach(({marker,caption,overview,paint},i)=>{const group=groups[i];marker.visible=!!group;caption.visible=!!group&&selected===i;overview.visible=!!group&&selected<0;if(!group){delete caption.userData.group;return;}const center=herdGroupCenter(i,groups.length);marker.position.set(center.x,.2,center.z);marker.scale.setScalar((group.ids.length>6?1.15:group.ids.length===1?.38:.75)*(.85+.15*frame.progress));caption.position.set(center.x,4.65,center.z-2.8);overview.position.set(center.x,.7,center.z+2);overview.userData.setText(`${i+1} · ${group.ids.length} ${group.ids.length===1?'GEDANKE':'GEDANKEN'}${group.winner?' · +100':''}`);paint(group);});missing.visible=frame.missing>0&&selected<0;root.userData.groups=groups.map(g=>({answer:g.answer,ids:g.ids}));root.userData.frame=frame;
 },dispose(){if(disposed)return;disposed=true;release();clouds.dispose();k.dispose();}};
}
