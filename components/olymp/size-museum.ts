import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {createSizeModelLibrary} from './size-model-library';
import {measureAxis,sizeComparison,sizeMuseumFrame,sizeMuseumPosition,createSizeRevealCue,SIZE_REVEAL_AT} from '@/lib/size-presentation';
type Crew={id?:string;name?:string;color:string};
const length=(cm:number|null)=>cm===null?'KEIN TIPP':`${cm.toLocaleString('de-DE',{maximumFractionDigits:2})} CM`;

export function createSizeMuseum(scene:T.Scene,crew:Crew[],me:string){
 const count=crew.length,k=locationKit(scene,'size-measurement-museum'),{root,block,sign,model}=k,props=new T.Group();root.add(props);
 const floor=block('museum-floor','#adab95',[0,.12,5],[31,.3,64]);floor.userData.dynamic=true;
 const wall=block('museum-back-wall','#6d8586',[0,5.5,-15],[31,11,.4]);wall.userData.dynamic=true;
 for(let i=-14;i<=14;i+=2)block('floor-grid-inlay','#c9c3a5',[i,.28,5],[.025,.016,64]);
 for(const x of[-13,-6.5,6.5,13]){block('gallery-pilaster','#c6b795',[x,5.1,-14.5],[.6,10,.6]);block('gallery-crown','#d9c69e',[x,9.8,-14.3],[1.2,.3,.9]);}
 const title=sign('DAS MUSEUM DER MASSSTÄBE',[0,10.2,-14.1],20,.9,'#ede2bd','#3d5c66');
 const task=sign('EIN MODELL · EIN GEMEINSAMER MASSSTAB',[0,9,-8],23,.8,'#f0e0bc','#385764');
 const scaleCaption=sign('ALLE OBJEKTE IM SELBEN MASSSTAB',[0,8,-8],21,.65,'#e6dbbc','#385764');
 const library=createSizeModelLibrary(k),slots=[-8,0,8].map((x,i)=>{
  const pedestal=block('exhibit-pedestal','#7f8980',[x,.5,-1.4],[7.4,.45,5.5]),cap=block('pedestal-cap','#d2c09a',[x,.76,-1.4],[7.6,.08,5.7]);pedestal.userData.dynamic=cap.userData.dynamic=true;
  const holder=new T.Group();holder.name=['reference-measurement-model','own-measurement-model','revealed-measurement-model'][i];holder.position.set(x,.82,-1.4);root.add(holder);
  const caption=sign(['REFERENZ','DEIN MODELL','TATSÄCHLICHE GRÖSSE'][i],[x,.34,1.55],7.1,.65,'#e7dfc6','#3f5b64');
  const ruler=block('measurement-guide','#e4ce97',[x,.86,-1.4],[1,.025,.025]);ruler.userData.dynamic=true;
  const endA=block('measurement-endpoint','#e4ce97',[x,.86,-1.4],[.025,.25,.025]),endB=endA.clone();endA.userData.dynamic=true;endB.userData.dynamic=true;root.add(endB);
  return {holder,caption,ruler,endA,endB,pedestal,cap,x,width:7.6,unitBounds:new T.Box3()};
 });
 const grip=block('size-measurement-grip','#eed6a0',[0,1,0],[.38,.38,.28]);grip.userData.dynamic=true;
 const tipGeometry=new T.ConeGeometry(.14,.28,4);k.geometries.add(tipGeometry);
 const tips=[-1,1].map(()=>{const tip=new T.Mesh(tipGeometry,k.mat('#eed6a0'));root.add(tip);return tip;});
 const pickLayer=3,hitGeometry=new T.PlaneGeometry(1,1),bodyGeometry=new T.BoxGeometry(1,1,1);k.geometries.add(hitGeometry);k.geometries.add(bodyGeometry);
 const hitMaterial=new T.MeshBasicMaterial({side:T.DoubleSide});
 const handle=new T.Mesh(hitGeometry,hitMaterial),body=new T.Mesh(bodyGeometry,hitMaterial);handle.name='size-drag-handle-target';body.name='size-drag-model-target';
 for(const target of [handle,body]){target.layers.set(pickLayer);target.userData.pick='sizeModel';root.add(target);}
 handle.userData.minHitPixels=44;
 const seats=crew.map((_,i)=>new T.Vector3(...sizeMuseumPosition(i,count,0)));
 const results=[-8,0,8].map((x,i)=>{
  const board=sign('DEINE CREW',[x,4.1,-14.1],7.4,.8,'#eee2bd','#3b5962'),detail=sign('DIE TIPPS BLEIBEN VERDECKT',[x,3.25,-14.1],7.4,.65,'#d9e0cb','#3b5962');
  const button=block(`museum-result-${i}`,'#3b5962',[x,3.7,-14.18],[7.4,1.8,.15]);button.userData.dynamic=true;button.userData.pick=`sizeResult:${i}`;
  return {board,detail,button};
 });
 const marker=new T.Mesh(new T.RingGeometry(.5,.63,32),new T.MeshBasicMaterial({color:'#edd6a0',transparent:true,opacity:.6,depthWrite:false}));k.geometries.add(marker.geometry);marker.rotation.x=-Math.PI/2;root.add(marker);
 for(const side of[-1,1]){model('furniture/bookcaseOpen',[side*13,.3,-11.6],4.5,0,props);model('furniture/pottedPlant',[side*14,.3,9.5],3.2,0,props);model('furniture/lampRoundFloor',[side*13,.3,1],3.8,0,props);}
 let key='',layoutKey='',physicalKey='',disposed=false,release=()=>{},frame:ReturnType<typeof sizeMuseumFrame>|null=null,cueId=0;const revealCue=createSizeRevealCue();
 const ready=Promise.all([k.ready(),library.ready]).then(()=>{if(!disposed){release=batchStaticMeshes(props);root.userData.assetsReady=root.userData.assetsReady&&library.failures.length===0;root.userData.assetErrors=[...(root.userData.assetErrors??[]),...library.failures];}});
 return {...k,seats,slots,ready,pickLayer,pickables:[handle,body,...results.map(r=>r.button)],
  position(index:number){return frame?.view==='gallery'?new T.Vector3(...sizeMuseumPosition(index,count,frame.progress)):new T.Vector3(-8,.35,7.7);},
  visible(id:string){return frame?.view==='gallery'||id===(frame?.revealed?frame.selected?.id:me);},
  update(game:any,draft:any,now:number,reduced:boolean){
   frame=sizeMuseumFrame(game,crew,me,now,draft);if(reduced&&frame.revealed)frame={...frame,progress:1};const f=frame,item=game.item??{},reference=game.reference??{name:'Referenz',cm:100},axis=measureAxis(item.measure),referenceAxis=measureAxis(reference.name),displayed=f.view==='gallery'?[0,1,2]:f.referenceMode?[0,1]:[1,2],comparison=sizeComparison(f.reference,f.estimate??f.reference,f.actual??undefined,displayed.filter(i=>i!==1||f.estimate!==null)),nextKey=`${game.round}:${reference.name}:${item.name}:${item.measure}`;
   if(key!==nextKey){key=nextKey;layoutKey='';slots.forEach(slot=>slot.holder.clear());const models=[library.get(reference.icon??reference.name.split(' · ')[0],'',referenceAxis,reference.name),library.get(item.name??'',item.kind??'',axis,item.measure??''),library.get(item.name??'',item.kind??'',axis,item.measure??'')];slots.forEach((slot,i)=>{models[i].updateMatrixWorld(true);slot.unitBounds.setFromObject(models[i]);slot.holder.add(models[i]);});}
   const nextLayout=nextKey+':'+displayed.join();
   if(layoutKey!==nextLayout){layoutKey=nextLayout;const widths=displayed.map(i=>Math.max(7.3,slots[i].unitBounds.getSize(new T.Vector3()).x*6.4+1.2)),total=widths.reduce((a,b)=>a+b,0)+1.3*(widths.length-1);let cursor=-total/2;const bounds=new T.Box3();
    displayed.forEach((i,j)=>{const slot=slots[i];slot.width=widths[j];slot.x=cursor+widths[j]/2;cursor+=widths[j]+1.3;slot.holder.position.x=slot.pedestal.position.x=slot.cap.position.x=slot.caption.position.x=slot.x;slot.pedestal.scale.x=slot.width;slot.cap.scale.x=slot.width+.2;const b=slot.unitBounds.clone();b.min.multiplyScalar(6.4).add(slot.holder.position);b.max.multiplyScalar(6.4).add(slot.holder.position);bounds.union(b);bounds.expandByPoint(new T.Vector3(slot.x-slot.width/2,.1,1.8));bounds.expandByPoint(new T.Vector3(slot.x+slot.width/2,.8,1.8));});
    if(f.view==='gallery'){bounds.expandByPoint(new T.Vector3(-14,.2,-14.3));bounds.expandByPoint(new T.Vector3(14,10.7,13));}
    else{bounds.expandByPoint(new T.Vector3(-8.8,.1,8.9));bounds.expandByPoint(new T.Vector3(7.3,2.5,8.9));}
    const own=slots[1],maxGrip=own.unitBounds.clone();maxGrip.min.multiplyScalar(6.4).add(own.holder.position);maxGrip.max.multiplyScalar(6.4).add(own.holder.position);maxGrip.expandByScalar(.9);bounds.union(maxGrip);
    root.userData.cameraBounds={min:bounds.min.toArray(),max:bounds.max.toArray()};floor.scale.x=wall.scale.x=Math.max(31,total+4);
   }
   slots.forEach((slot,i)=>{
    const slotAxis=i===0?referenceAxis:axis,number=i===0?f.reference:i===1?f.estimate:f.actual,visible=displayed.includes(i)&&(i!==2||f.actual!==null&&f.age>=SIZE_REVEAL_AT),span=comparison.spans[i]??0;
    slot.holder.scale.setScalar(span);slot.pedestal.visible=slot.cap.visible=slot.caption.visible=visible;slot.holder.visible=slot.ruler.visible=slot.endA.visible=slot.endB.visible=visible&&number!==null;if(!visible)return;
    const edge=slot.x+slot.width/2-.25,front=Math.max(1.35,-1.4+slot.unitBounds.max.z*6.4+.25);
    slot.ruler.position.set(slotAxis==='x'?slot.x:edge,slotAxis==='x'?.86:.82+span/2,slotAxis==='x'?front:-1.4);slot.ruler.scale.set(slotAxis==='x'?span:.025,slotAxis==='y'?span:.025,.025);
    slot.endA.position.set(slotAxis==='x'?slot.x-span/2:edge,slotAxis==='x'?.86:.82,slot.ruler.position.z);slot.endB.position.set(slotAxis==='x'?slot.x+span/2:edge,slotAxis==='x'?.86:.82+span,slot.ruler.position.z);slot.endA.scale.set(slotAxis==='x'?.025:.3,slotAxis==='x'?.3:.025,.025);slot.endB.scale.copy(slot.endA.scale);
    slot.caption.userData.setText(`${i===0?reference.name:i===1?(f.revealed?f.selected?.name??'CREW':'DEIN TIPP'):'ECHTER WERT'} · ${length(number)}`);
   });
   const own=slots[1],editable=f.canChange&&f.view==='compare',span=comparison.spans[1],front=Math.max(1.35,-1.4+own.unitBounds.max.z*6.4+.25);
   grip.visible=handle.visible=body.visible=editable;tips.forEach(tip=>tip.visible=editable);
   grip.position.set(axis==='x'?own.x+span/2+.4:own.x+own.width/2-.25,axis==='x'?.98:.82+span+.4,axis==='x'?front:-1.4);
   handle.position.copy(grip.position);
   tips.forEach((tip,i)=>{const direction=i===0?-1:1;tip.position.copy(grip.position);tip.position[axis]+=direction*.43;tip.rotation.z=axis==='x'?-direction*Math.PI/2:direction===1?0:Math.PI;});
   const bodySize=own.unitBounds.getSize(new T.Vector3()).multiplyScalar(span),bodyCenter=own.unitBounds.getCenter(new T.Vector3()).multiplyScalar(span).add(own.holder.position);body.position.copy(bodyCenter);body.scale.set(Math.max(.02,bodySize.x),Math.max(.02,bodySize.y),Math.max(.02,bodySize.z));
   for(const target of [handle,body]){target.userData.pickDisabled=!editable;target.userData.cm=f.estimate;target.userData.axis=axis;}
   title.visible=task.visible=scaleCaption.visible=f.view==='gallery';task.userData.setText(`${item.name??'DEIN OBJEKT'} · ${item.measure??'MESSRICHTUNG'}`);scaleCaption.userData.setText(`${slots[1].holder.children[0]?.userData.symbolic?'KATEGORIE-MODELL · ':''}GEMEINSAMER MASSSTAB · ${axis==='x'?'HORIZONTALE':'VERTIKALE'} MESSUNG`);
   results.forEach((panel,i)=>{const row=f.visibleRows[i],show=f.view==='gallery'&&!!row;panel.board.visible=panel.detail.visible=panel.button.visible=show;panel.button.userData.pickDisabled=!show||!f.revealed;panel.button.userData.playerId=row?.id;if(row){panel.board.userData.setText(`${row.index+1} · ${row.name}`);panel.detail.userData.setText(f.revealed?`${length(row.estimate)} · ${row.score.toFixed(1)} PUNKTE`:row.submitted?'VERDECKT VERSIEGELT':'SCHÄTZT NOCH');}});
   marker.visible=f.revealed&&f.view==='gallery'&&!!f.selected;if(f.selected)marker.position.copy(new T.Vector3(...sizeMuseumPosition(f.selected.index,count,reduced?1:f.progress))).add(new T.Vector3(0,.018,0));
   const nextPhysical=`${nextKey}:${f.estimate}:${f.actual}:${f.selected?.id}:${displayed.join()}`;if(nextPhysical!==physicalKey){physicalKey=nextPhysical;root.userData.renderedSpans=slots.map((slot,i)=>{if(i===1&&f.estimate===null||i===2&&f.actual===null)return null;slot.holder.updateWorldMatrix(true,true);const model=slot.holder.children[0],a=new T.Vector3().fromArray(model.userData.measureFrom),b=new T.Vector3().fromArray(model.userData.measureTo);model.localToWorld(a);model.localToWorld(b);return a.distanceTo(b);});}
   if(revealCue(game,now)){root.userData.cue='sizeReveal';root.userData.cueId=++cueId;}
   root.userData.frame={...f,progress:reduced&&f.revealed?1:f.progress};root.userData.comparison={renderedSpans:root.userData.renderedSpans,assetsReady:root.userData.assetsReady,actualVisible:slots[2].holder.visible,axis,referenceAxis,reference:f.reference,estimate:f.estimate,actual:f.actual,spans:comparison.spans,model:slots[1].holder.children[0]?.userData.modelKey,interaction:{editable,handle:grip.position.toArray(),body:body.position.toArray(),minHitPixels:44}};
  },dispose(){disposed=true;release();k.dispose();}
 };
}
