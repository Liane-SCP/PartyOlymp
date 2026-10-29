import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {spectrumFrame,spectrumX,spectrumWrap} from '@/lib/spectrum-presentation';
import {createSpectrumPavilion} from './spectrum-pavilion';

export function createSpectrumStation(scene:T.Scene,colors:string[]){
 const k=locationKit(scene,'spectrum-measuring-station'),{root,block:primitive,model,sign}=k,props=new T.Group();props.name='spectrum-instruments';root.add(props);
 const block=(name:string,color:string,p:[number,number,number],size:[number,number,number],parent:T.Object3D=props)=>primitive(name,color,p,size,parent);
 createSpectrumPavilion(k,props);
 block('measurement-pylon','#78a9b0',[-10,3,-2],[2.7,5.4,3]);
 for(const side of[-1,1]){model('props/vault-gear',[side*10,5.8,-2],1.6,0,props);model('furniture/lampRoundFloor',[side*12,.3,3.5],4.6,0,props);}
 const left=sign('A',[-4.25,1.95,1.1],8.2,.65,'#f4e2b9','#365c64'),right=sign('B',[4.25,1.95,1.1],8.2,.65,'#f4e2b9','#725651');
 const clue=sign('DER HINWEIS ENTSTEHT …',[0,8,.9],17.4,1.05,'#f4e2b9','#345a62');clue.name='spectrum-clue-banner';
 const panel=block('interactive-measurement-scale','#d6d2ba',[0,3.3,0],[17.4,1.3,.35]);panel.userData.dynamic=true;panel.userData.pick='spectrumScale';
 block('scale-base','#45616a',[0,1.8,0],[18,1.7,2]);
 for(let i=0;i<=20;i++){const x=-8+i*.8;block('scale-tick','#496069',[x,3.18,.21],[.04,i%2?.28:.55,.035]);if(i%2===0)sign(String(i*5),[x,2.8,.25],.75,.4,'#2a444b','#d6d2ba');}
 const stemGeometry=new T.BoxGeometry(.08,1.3,.08).translate(0,3.7,.5),tipGeometry=new T.ConeGeometry(.18,.38,8).rotateZ(Math.PI).translate(0,3.02,.5),needleGeometry=mergeGeometries([stemGeometry,tipGeometry],false)!;stemGeometry.dispose();tipGeometry.dispose();k.geometries.add(needleGeometry);
 function needle(color:string,name:string){const group=new T.Group();group.name=name;root.add(group);const mesh=new T.Mesh(needleGeometry,k.mat(color));mesh.name='measurement-needle';group.add(mesh);return group;}
 const own=needle('#344a5f','own-spectrum-needle'),others=colors.map((color,i)=>needle(color,`revealed-spectrum-${i}`));
 const overlapLabels=colors.map((_,i)=>sign('',[0,4.6,.7],.85,.4,'#243f46','#f0dfb9'));
 const target=new T.Group();target.name='private-spectrum-target';root.add(target);
 for(const [range,color,z]of[[10,'#b8c9a9',.3],[6,'#d1cf9e',.34],[2,'#e6bd76',.38]] as const)block('target-score-band',color,[0,3.35,z],[range*.32,.85,.025],target);
 const targetCaption=sign('ZIEL',[0,4.8,.6],2.6,.6,'#263f46','#ead4a5');
 const value=sign('DEIN ZEIGER BLEIBT GEHEIM',[0,5.45,-.5],13,.7,'#e9dfbe','#345a62');
 const confirm=block('spectrum-lock-button','#b7c998',[0,1.5,4.3],[5,.3,1.3]);confirm.userData.dynamic=true;confirm.userData.pick='spectrumLock';const lockText=sign('TIPP VERSIEGELN',[0,1.67,4.3],4.7,.65,'#2b4646','#d9dbb6');lockText.rotation.x=-Math.PI/2;
 model('furniture/kitchenBar',[-11,.3,5],1.3,0,props);model('furniture/pottedPlant',[11.2,.3,-5.8],3.3,0,props);
 const seats=colors.map((_,i)=>new T.Vector3((i-(colors.length-1)/2)*Math.min(1.8,20/Math.max(1,colors.length-1)),.3,7));
 const crewSigns=colors.map((_,i)=>sign('',[seats[i].x,.8,6.8],1.55,.45,'#e7ddba','#345a62'));
 const cards=Array.from({length:3},(_,i)=>{const card=sign('',[0,6.4,.85],1,1);card.name=`spectrum-result-card-${i}`;const texture=(card.material as T.MeshBasicMaterial).map,canvas=typeof document!=='undefined'?document.createElement('canvas'):null;if(canvas&&texture){canvas.width=1024;canvas.height=300;texture.image=canvas;texture.needsUpdate=true;}let previous='';
  return {card,paint(row:any,me:string){const key=JSON.stringify([row,me]);card.userData.card=row;if(key===previous)return;previous=key;if(!canvas)return;const c=canvas.getContext('2d')!;c.fillStyle=row.id===me?'#fff0c4':'#f1e8d1';c.fillRect(0,0,1024,300);c.fillStyle=row.color;c.fillRect(0,0,16,300);c.strokeStyle='#829886';c.lineWidth=8;c.strokeRect(4,4,1016,292);c.textAlign='left';c.textBaseline='middle';c.fillStyle='#31574e';c.font='700 26px sans-serif';c.fillText(`${String(row.index).padStart(2,'0')} · ${row.id===me?'DU':'CREW'}`,36,27);c.font='700 54px sans-serif';spectrumWrap(row.name,944,s=>c.measureText(s).width).forEach((line,n)=>c.fillText(line,36,85+n*56));c.font='700 65px sans-serif';c.fillText(row.excluded?(row.psychic?'HINWEISGEBER':'KEIN HINWEIS'):row.guess===null?'KEIN TIPP':`${row.guess} · ${row.score} PUNKTE`,36,211);c.font='500 30px sans-serif';c.fillText(row.status,36,274);texture!.needsUpdate=true;}};
 });
 let disposed=false,release=()=>{};const ready=k.ready().then(()=>{if(!disposed)release=batchStaticMeshes(props,{mergeUnique:true});});
 return {...k,seats,pickables:[panel,confirm],own,target,ready,position(index:number,game:any,id:string){return game.psychic===id?new T.Vector3(-10,.3,3.1):seats[index];},follow(actors:{root:T.Group}[]){crewSigns.forEach((note,i)=>{note.position.copy(actors[i].root.position);note.position.y+=.45;note.position.z+=.4;});},update(now:number,game:any,draft:any,crew:{id?:string;name?:string;color?:string}[],me:string,reduced=false){
  const frame=spectrumFrame(game,crew,me,now,draft.spectrumPage??0,!!draft.spectrumCompact),{revealed:reveal,psychic,canDial}=frame;
  const estimate=game.mine?.submitted?frame.estimate??50:Math.max(0,Math.min(100,Number(draft.spectrum??frame.estimate??50)));own.position.x=spectrumX(estimate);own.visible=!psychic&&game.stage==='guess';panel.userData.pickDisabled=!canDial;confirm.userData.pickDisabled=!canDial;confirm.visible=lockText.visible=canDial;
  left.userData.setText(`A · ${game.axis?.left??'LINKER POL'}`);right.userData.setText(`B · ${game.axis?.right??'RECHTER POL'}`);clue.userData.setText(game.clue?`HINWEIS: ${game.clue}`:'DER HINWEIS ENTSTEHT …');
  const known=frame.known;target.visible=targetCaption.visible=known;if(known){target.position.x=spectrumX(frame.target!);target.scale.x=reveal&&!reduced?Math.max(.001,frame.progress):1;targetCaption.position.x=target.position.x;targetCaption.userData.setText(reveal?`ZIEL ${frame.target}`:'DEIN PRIVATES ZIEL');}
  others.forEach((marker,i)=>{const row=frame.rows[i],selected=frame.cards.findIndex(r=>r.id===row?.id);marker.visible=reveal&&row?.guess!==null&&row?.guess!==undefined;if(marker.visible){marker.position.x=spectrumX(row.guess!);marker.position.z=i*.025;marker.traverse(o=>{if(o instanceof T.Mesh)o.material=k.mat(selected>=0?row.color:'#7b9391');});}const label=overlapLabels[i];label.visible=marker.visible&&selected>=0;if(label.visible){label.position.set(marker.position.x,4.6+selected*.28,.9);label.userData.setText(String(row.index).padStart(2,'0'));}});
  cards.forEach(({card,paint},i)=>{const row=frame.cards[i];card.visible=!!row;if(!row){delete card.userData.card;return;}card.position.set(frame.compact?0:(i-(frame.cards.length-1)/2)*5.7,frame.compact?7.25:6.4,.85);card.scale.set(frame.compact?14.4:5.4,frame.compact?14.4*300/1024:5.4*300/1024,1);paint(row,me);});clue.position.y=frame.compact&&reveal?10.15:8;
  crewSigns.forEach((note,i)=>{const r=frame.rows[i];note.userData.setText(`${String(i+1).padStart(2,'0')} · ${r?.psychic?'HINWEIS':reveal?r?.excluded?'KEINE WERTUNG':`${r?.score??0} PUNKTE`:r?.submitted?'✓':'…'}`);});
  value.visible=!reveal;value.userData.setText(psychic?'DEIN ZIEL IST NUR FÜR DICH SICHTBAR':game.stage==='guess'?`DEIN GEHEIMER ZEIGER: ${estimate}${game.mine?.submitted?' · VERSIEGELT':''}`:'WARTE AUF DEN HINWEIS');root.userData.targetVisible=known;root.userData.estimate=psychic?null:estimate;root.userData.frame={...frame,estimate:psychic?null:estimate};
 },dispose(){disposed=true;release();k.dispose();}};
}
