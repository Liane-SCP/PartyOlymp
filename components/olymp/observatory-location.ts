import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {timingFrame,timingSeconds} from '@/lib/timing-presentation';
import {createObservatoryPavilion} from './observatory-pavilion';

/** No clockwork, looping light, particles, or time-dependent updates. */
export function createObservatoryLocation(scene:T.Scene,count:number){
 const k=locationKit(scene,'timing-still-observatory'),{root,block,model,sign}=k,props=new T.Group();props.name='observatory-garden';root.add(props);
 const pavilion=createObservatoryPavilion(k,props);
 const instrument=new T.Group();instrument.name='timing-instrument';root.add(instrument);
 block('instrument-console','#3e5965',[0,1.7,.3],[6,2.8,2.6],instrument);
 block('instrument-top','#d2c5a3',[0,3.2,.3],[6.5,.2,2.9],instrument);
 const buttonGeometry=new T.CylinderGeometry(1.2,1.2,.3,32);k.geometries.add(buttonGeometry);const button=new T.Mesh(buttonGeometry,k.mat('#92bcb4'));button.name='timing-start-stop-button';button.position.set(0,3.47,.5);button.userData.pick='clock';root.add(button);
 const caption=sign('DEIN MOMENT',[0,5.15,.4],8,1,'#f0dfb6','#304c59');
 const result=sign('STERNE ÜBER EUCH. ZEIT IN EUCH.',[0,6.8,-6.8],12,.85,'#e2e9d8','#344d60');
 const stationHint=sign('',[0,6.35,.4],8,.6,'#e2e9d8','#344d60',.66);stationHint.visible=false;
 const seats=Array.from({length:count},(_,i)=>{const row=Math.floor(i/6),columns=Math.min(6,count-row*6);return new T.Vector3((i%6-(columns-1)/2)*2.5,.35,5.5+row*2);});
 seats.forEach((p,i)=>model('furniture/stoolBar',[p.x,.3,p.z],1.1,0,props));
 for(const side of[-1,1]){model('nature/tree_small',[side*11,.2,3],3.6,side*.3,props);model('nature/plant_bush',[side*9.8,.2,-5],1.1,0,props);model('furniture/pottedPlant',[side*8.7,.2,-7],2.5,0,props);}
 const chart=new T.Group();chart.name='timing-constellation-results';chart.visible=false;root.add(chart);
 block('star-chart-frame','#c7b88f',[0,4.05,-6.07],[13.3,7.7,.25],chart);block('star-chart-board','#243e53',[0,4.05,-5.9],[13,7.4,.12],chart);
 function note(text:string,p:[number,number,number],w:number,h:number,scale=.72){const o=sign(text,p,w,h,'#f0e4c6','#243e53',scale);chart.add(o);return o;}
 const chartTitle=note('EURE MOMENTE',[0,7.45,-5.8],12,.65),legend=note('FRÜH −1,5 s       ZIEL       SPÄT +1,5 s',[0,6.9,-5.8],12,.4,.65),pageLabel=note('',[0,.7,-5.8],12,.35,.65);
 const lines=Array.from({length:4},(_,i)=>note('',[0,6.1-i*1.4,-5.76],12,.65,.78));
 const railGeometry=new T.BoxGeometry(10,.035,.035);k.geometries.add(railGeometry);const rails=new T.InstancedMesh(railGeometry,k.mat('#879fa9'),4),pose=new T.Object3D(),tint=new T.Color();chart.add(rails);
 for(let i=0;i<4;i++){pose.position.set(0,5.45-i*1.4,-5.72);pose.updateMatrix();rails.setMatrixAt(i,pose.matrix);}rails.computeBoundingSphere();
 block('target-meridian','#d5bd85',[0,3.35,-5.72],[.055,5.2,.07],chart);
 const starGeometry=new T.OctahedronGeometry(.19);k.geometries.add(starGeometry);const stars=new T.InstancedMesh(starGeometry,k.mat('#ffffff'),4);stars.name='timing-result-stars';for(let i=0;i<4;i++)stars.setColorAt(i,tint.set('#d5bd85'));chart.add(stars);
 let disposed=false,release=()=>{};const ready=k.ready().then(()=>{if(!disposed)release=batchStaticMeshes(props,{mergeUnique:true});});
 return {...k,seats:seats.map(p=>p.clone().add(new T.Vector3(0,.8,0))),button,pickables:[button],ready,update(now:number,game:any,me:string,crew:{id?:string;name?:string}[]=[],draft:any={}){const own=game.mine??{},frame=timingFrame(game,crew,me,now,draft.timingPage??-1),running=frame.running;button.userData.pickDisabled=!frame.canUse;instrument.visible=button.visible=caption.visible=result.visible=!frame.revealing;chart.visible=frame.revealing;
  stationHint.visible=!!draft.timingStation&&!frame.revealing;result.visible=!draft.timingStation&&!frame.revealing;stationHint.userData.setText(game.mode==='calm'?'RUHIG - DEIN GEF\u00dcHL ZÄHLT':game.mode==='echo'?'FALSCHE TAKTE - KEIN METRONOM':'ZAHLENNEBEL - KEIN COUNTDOWN');caption.userData.setText(own.submitted?'DEIN STOPP IST VERSIEGELT':running&&game.mode==='decoy'?`ZAHLENNEBEL: ${draft.timingDecoy||'?'}`:running?'VERTRAUE DEINEM GEFÜHL':`ZIEL: ${(frame.target/1000).toLocaleString('de-DE')} SEKUNDEN`);result.userData.setText(game.mode==='calm'?'RUHIGE RUNDE · STARTEN UND SELBST STOPPEN':game.mode==='echo'?'ABLENKUNG: UNREGELMÄSSIGE TÖNE':'ABLENKUNG: IRREFÜHRENDE ZAHLEN');button.material=k.mat(own.submitted?'#bdbe9f':running?'#c49384':'#92bcb4');
  if(frame.revealing){chartTitle.userData.setText(`EURE MOMENTE · ZIEL ${timingSeconds(frame.target)} s`);pageLabel.userData.setText(`${frame.shown} / ${frame.total} ENTHÜLLT · TAFEL ${frame.page+1} / ${frame.pages} · PFEIL = AUSSERHALB DER SKALA`);let n=0;rails.count=frame.rows.length;lines.forEach((line,i)=>{const row=frame.rows[i],y=frame.rows.length===1?4:6.1-i*(4.2/Math.max(1,frame.rows.length-1));line.visible=!!row;line.position.y=y;pose.position.set(0,y-.65,-5.72);pose.updateMatrix();if(row)rails.setMatrixAt(i,pose.matrix);line.userData.setText(!row?'':!row.revealed?`${row.name.slice(0,12)} · NOCH VERSIEGELT`:row.elapsed==null?`${row.name.slice(0,12)} · KEIN STOPP`:`${row.name.slice(0,12)} · ${timingSeconds(row.elapsed)} s · ${row.error!>0?'+':''}${timingSeconds(row.error!)} s${row.outside?(row.error!<0?' \u2190':' \u2192'):''}`);if(row?.revealed&&row.x!=null){pose.position.set(row.x,y-.65,-5.65);pose.updateMatrix();stars.setMatrixAt(n,pose.matrix);stars.setColorAt(n,tint.set(row.id===me?'#c2ea9d':'#ebc98f'));n++;}});rails.instanceMatrix.needsUpdate=true;rails.computeBoundingSphere();stars.count=n;stars.instanceMatrix.needsUpdate=true;stars.instanceColor!.needsUpdate=true;stars.computeBoundingSphere();}
  root.userData.running=running;root.userData.frame={...frame,visibleStars:frame.revealing?stars.count:0,decoy:running&&game.mode==='decoy'?String(draft.timingDecoy||'?'):null};
 },dispose(){if(disposed)return;disposed=true;release();rails.dispose();stars.dispose();k.dispose();}};
}


