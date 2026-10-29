import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {colorFrame,colorPlates} from '@/lib/color-presentation';
import {createPigmentManufactory} from './pigment-manufactory';

/** Scored samples are unlit sRGB plates with identical neutral surroundings. */
export function createColorLaboratory(scene:T.Scene,crew:{id?:string;name?:string;color?:string}[],me:string){
 const k=locationKit(scene,'color-neutral-laboratory'),{root,block:primitive,model,sign}=k,mechanism=new T.Group(),props=new T.Group();root.add(mechanism);mechanism.add(props);
 const block=(name:string,color:string,p:[number,number,number],size:[number,number,number],parent:T.Object3D=mechanism)=>primitive(name,color,p,size,parent);
 block('laboratory-floor','#acb8b3',[0,.08,0],[29,.3,25],root);block('laboratory-wall','#536d78',[0,6.8,-10.8],[29,13.6,.4],root);
 createPigmentManufactory(k,props);
 for(const x of[-12,12]){block('service-column','#d0c6a8',[x,4.4,-7.5],[1.2,8.2,2]);model('factory/pipe-large-valve',[x,.3,-4.6],3.4,0,props);model('furniture/bookcaseOpen',[x,.3,0],4.3,x<0?Math.PI/2:-Math.PI/2,props);for(let j=0;j<3;j++)model('food/bottle-oil',[x,1.2+j*.95,0],.7,0,props);model('factory/machine',[x,.3,6.8],2.1,x<0?Math.PI/2:-Math.PI/2,props);}
 const title=sign('DAS LABOR DER FARBERINNERUNG',[0,9.7,-10.5],19,.9,'#ede4c7','#345562');
 const phase=sign('MERKE DIR DIE PROBE',[0,8.35,-8.8],16,.8,'#ede4c7','#345562');
 const surrounds:T.Mesh[]=[],labels:T.Mesh[]=[],plates=[0,1].map(i=>{
  const surround=block('neutral-color-surround','#777777',[0,0,0],[7.2,5.5,.4],root);surround.userData.dynamic=true;surround.material=new T.MeshBasicMaterial({color:'#777777',toneMapped:false}) as any;surrounds.push(surround);
  const material=new T.MeshBasicMaterial({color:'#808080',toneMapped:false}),geometry=new T.PlaneGeometry(6.2,4.4);k.geometries.add(geometry);
  const mesh=new T.Mesh(geometry,material);mesh.name=i?'own-neutral-color':'target-neutral-color';root.add(mesh);
  labels.push(sign(i?'DEINE MISCHUNG':'DIE ZIELPROBE',[0,0,0],6.5,.65,'#e4e4dc','#4d565a'));return mesh;
 });
 const cover=block('sealed-target-sample','#777777',[-4,5.1,-6.50],[6.3,4.5,.025],root);cover.userData.dynamic=true;
 const sealed=sign('PROBE VERSCHLOSSEN',[-4,5.1,-6.46],5.8,.7,'#e5e5dc','#777777');
 const shutters=[-1,1].map(()=>{const b=block('sample-reveal-shutter','#777777',[0,0,-6.49],[3.1,4.4,.025],root);b.userData.dynamic=true;return b;});
 block('mixing-console','#556871',[0,1,4.4],[15,1.6,5.7]);block('console-top','#b8c1b7',[0,1.85,4.4],[15.3,.18,5.9]);
 const pickables:T.Object3D[]=[],knobs:T.Mesh[]=[],readouts:T.Mesh[]=[],fills:T.Mesh[]=[];
 const cylinder=new T.CylinderGeometry(.58,.58,1,12);k.geometries.add(cylinder);
 const mixer=new T.Group();mixer.position.set(6,2,7.5);mixer.userData.dynamic=true;mechanism.add(mixer);
 block('sample-mixer-base','#506872',[0,0,0],[2.2,.3,2.2],mixer);
 const stirring=block('sample-agitator','#e6d8ae',[0,1.15,0],[1.5,.12,.18],mixer);
 const mixed=new T.Mesh(cylinder,k.mat('#808080'));mixed.name='decorative-mixing-vessel';mixed.position.y=.65;mixed.scale.set(1.4,.9,1.4);mixer.add(mixed);
 for(let i=0;i<3;i++){
  const z=2.6+i*1.65,color=['#c98986','#8ab091','#819fb8'][i],rail=block('rgb-control-track',color,[0,2,z],[12.2,.14,1.2]);rail.userData.dynamic=true;rail.userData.pick=`colorScale:${i}`;pickables.push(rail);
  const knob=block('rgb-control-handle','#ece5cc',[0,2.2,z],[.28,.35,.85]);knob.userData.dynamic=true;knobs.push(knob);
  const label=sign(['ROT','GRÜN','BLAU'][i],[-6.8,2.04,z],1.1,.65,'#29444c','#d9dcc8');label.rotation.x=-Math.PI/2;
  const number=sign('128',[6.8,2.04,z],1.1,.65,'#29444c','#d9dcc8');number.rotation.x=-Math.PI/2;mechanism.add(label,number);readouts.push(number);
  const x=-4.7+i*4.7;for(const y of[.55,2.95])block('pigment-vessel-rim','#627b81',[x,y,-8.7],[1.7,.18,1.7]);
  const fill=new T.Mesh(cylinder,k.mat(color));fill.name='private-pigment-level';fill.position.set(x,1,-8.7);fill.userData.dynamic=true;mechanism.add(fill);fills.push(fill);
  model('factory/pipe-large-bend',[x,.3,-9.7],1.1,0,props);
 }
 const confirm=block('color-seal-button','#d0bc8c',[0,1.9,8.4],[5,.3,1.2]);confirm.userData.dynamic=true;confirm.userData.pick='colorConfirm';pickables.push(confirm);const confirmText=sign('MISCHUNG VERSIEGELN',[0,2.06,8.4],4.8,.65,'#2e454d','#ead8ac');confirmText.rotation.x=-Math.PI/2;mechanism.add(confirmText);
 const seats=crew.map((_,i)=>new T.Vector3((i%2?1:-1)*10,1.1,-3+Math.floor(i/2)*2.05));
 const notes=seats.map((p,i)=>{model('furniture/cabinetBedDrawerTable',[p.x,.3,p.z-1],1.1,0,props);return sign(`${i+1} · ${crew[i].name??'CREW'}`,[p.x,.8,p.z+.35],3.2,.55,'#e8e4d1','#405d68');});
 model('furniture/kitchenFridge',[-12,.3,9.8],3.6,0,props);model('furniture/pottedPlant',[12,.3,9.8],3.6,0,props);
 mechanism.add(title,phase,...notes);
 let disposed=false,release=()=>{},previousRgb='',mixedAt=-Infinity;const ready=k.ready().then(()=>{if(!disposed){const was=mechanism.visible;mechanism.visible=true;const a=batchStaticMeshes(props,{mergeUnique:true}),b=batchStaticMeshes(mechanism,{mergeUnique:true});mechanism.visible=was;release=()=>{a();b();};}});
 return {...k,seats,plates,pickables,ready,update(now:number,game:any,draft:any,reduced=false){
  const f=colorFrame(game,crew,me,now,draft),layout=colorPlates(f.compact,f.revealed),rgb=f.own??[128,128,128],comparison=f.comparison;
  const panelsVisible=draft.view!=='machine',focused=draft.view==='sample',focusIndex=f.memorizing?0:1;mechanism.visible=draft.view!=='sample'&&draft.view!=='results';
  plates.forEach((plate,i)=>{surrounds[i].visible=labels[i].visible=panelsVisible&&(!focused||i===focusIndex);plate.position.set(...layout[i]);surrounds[i].position.copy(plate.position).add(new T.Vector3(0,0,-.24));labels[i].position.copy(plate.position).add(new T.Vector3(0,-3,.06));});
  plates[0].visible=panelsVisible&&!!f.target&&(!focused||focusIndex===0);cover.visible=sealed.visible=panelsVisible&&!f.target&&(!focused||focusIndex===0);cover.position.set(...layout[0]).add(new T.Vector3(0,0,.06));sealed.position.copy(cover.position).add(new T.Vector3(0,0,.04));
  if(f.target)(plates[0].material as T.MeshBasicMaterial).color.setRGB(f.target[0]/255,f.target[1]/255,f.target[2]/255,T.SRGBColorSpace);
  plates[1].visible=panelsVisible&&!f.memorizing&&!!comparison&&(!focused||focusIndex===1);if(comparison)(plates[1].material as T.MeshBasicMaterial).color.setRGB(comparison[0]/255,comparison[1]/255,comparison[2]/255,T.SRGBColorSpace);
  labels[1].userData.setText(f.revealed?(f.selected?.name??'CREW')+(comparison?` · ${Number(f.selected?.score??0).toFixed(1)} PUNKTE`:' · KEINE MISCHUNG'):'DEINE MISCHUNG');
  shutters.forEach((s,i)=>{s.visible=f.revealed&&!reduced&&f.progress<1;s.position.set(layout[0][0]+(i?1:-1)*(1.55+4*f.progress),layout[0][1],-6.49);});
  knobs.forEach((knob,i)=>{knob.position.x=-6+rgb[i]/255*12;readouts[i].userData.setText(f.memorizing?'—':String(rgb[i]));fills[i].visible=!!f.own&&!f.memorizing;fills[i].scale.y=Math.max(.015,rgb[i]/255*2.2);fills[i].position.y=.65+fills[i].scale.y/2;});
  const signature=rgb.join(',');if(signature!==previousRgb){if(previousRgb&&f.canMix)mixedAt=now;previousRgb=signature;}stirring.rotation.y=reduced?0:Math.max(0,Math.min(1,(now-mixedAt)/550))*Math.PI*2;
  if(f.own)(mixed.material as T.MeshStandardMaterial).color.setRGB(rgb[0]/255,rgb[1]/255,rgb[2]/255,T.SRGBColorSpace);mixed.visible=!!f.own&&!f.memorizing;
  pickables.forEach(o=>o.userData.pickDisabled=!f.canMix);confirm.visible=confirmText.visible=f.canMix;
  phase.userData.setText(f.revealed?'ZIEL UND MISCHUNG · GLEICHE BEDINGUNGEN':f.memorizing?'MERKE DIR DIE PROBE':game.mine?.submitted?'DEINE MISCHUNG IST VERSIEGELT':'MISCH AUS DEINER ERINNERUNG');
  title.visible=phase.visible=draft.view==='group'||!draft.view;
  notes.forEach((note,i)=>{const row=f.rows[i];note.userData.setText(`${row.index} · ${row.name} · ${f.revealed?Number(row.score).toFixed(1)+' P':row.submitted?'VERSIEGELT':'MISCHT'}`);});
  root.userData.targetVisible=!!f.target;root.userData.rgb=f.memorizing?null:rgb;root.userData.phase=f.phase;root.userData.frame=f;
 },dispose(){disposed=true;release();k.dispose();}};
}
