import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {atelierFrame,atelierSeat,atelierWrap} from '@/lib/atelier-presentation';
import {createIdeasWorkshopRoom} from './ideas-workshop-room';

export function createIdeasAtelier(scene:T.Scene,count:number){
 const k=locationKit(scene,'categories-ideas-atelier'),{root,block:primitive,model,sign}=k,furniture=new T.Group(),miniature=new T.Group(),board=new T.Group(),floor=new T.Group(),backdrop=new T.Group();
 floor.name='atelier-floor-details';backdrop.name='atelier-room-backdrop';root.add(floor,backdrop);
 const block=(name:string,color:string,p:[number,number,number],s:[number,number,number],parent:T.Object3D=backdrop)=>primitive(name,color,p,s,parent);
 furniture.name='atelier-writing-desks';miniature.name='atelier-private-idea-city';board.name='atelier-review-wall';root.add(furniture,miniature,board);
 block('atelier-floor','#bba584',[0,.08,0],[28,.3,25],floor);block('atelier-back-wall','#92aca0',[0,4.5,-11],[28,9,.4]);
 for(const x of[-10,-5,5,10]){block('studio-window-frame','#e7d7b5',[x,5.8,-10.7],[3.7,4.6,.2]);block('studio-window','#b5d7d6',[x,5.8,-10.56],[3.35,4.25,.1]);block('window-cross','#e7d7b5',[x,5.8,-10.4],[.1,4.3,.1]);}
 block('roof-beam','#947b58',[0,8.9,-10.5],[28,.35,.5]);
 const room=createIdeasWorkshopRoom(k,floor,backdrop,miniature);
 model('furniture/table',[0,.3,-.7],1.3,0,miniature).then(table=>{if(!table)return;const size=new T.Box3().setFromObject(table).getSize(new T.Vector3());table.scale.x*=13.3/size.x;table.scale.z*=8.1/size.z;});block('miniature-tabletop','#ddcba4',[0,1.6,-.7],[13.8,.16,8.5],miniature);
 const pickables:T.Object3D[]=[],pads:T.Mesh[]=[],labels:T.Mesh[]=[],districts:T.Group[]=[];
 const districtModels=['city/building-type-a','city/building-type-c','food/bread','furniture/bear','food/cup','city/building-type-h','car/race'],placeholder=['LAND','YOUTUBER','ESSEN','TIER','GETRÄNK','BERUF','GAME'];
 for(let i=0;i<7;i++){const x=(i%4-1.5)*3.3,z=i<4?-2.7:1.1,group=new T.Group();group.userData.dynamic=true;miniature.add(group);districts.push(group);
  const pad=block('idea-district','#9aa98b',[x,1.78,z],[2.9,.18,2.9],group);pad.userData.dynamic=true;pad.userData.pick=`category:${i}`;pickables.push(pad);pads.push(pad);
  model(districtModels[i],[x,1.9,z],i===6?.65:i===2||i===4?.9:1.65,0,group);
  const label=sign(placeholder[i],[x,3.85,z+.6],3,.55,'#2b4a4a','#f1deb4');miniature.add(label);labels.push(label);
 }
 const heading=sign('DAS ATELIER DER SIEBEN IDEEN',[0,8.5,-6.7],15,.65,'#f2e3c3','#385e61');
 const status=sign('DEINE IDEEN BLEIBEN PRIVAT',[0,.9,-6.65],15,.5,'#ebdcbb','#385e61');
 block('presentation-frame','#785e45',[0,4.8,-7.1],[15.7,7.7,.4],board);block('presentation-felt','#355451',[0,4.8,-6.86],[15.2,7.3,.09],board);
 const empty=sign('KEINE ANTWORT EINGETRAGEN · 0 PUNKTE',[0,4.8,-6.65],13,.7,'#f2e3c3','#385e61');board.add(empty);
 const textures:T.Texture[]=[],cardGeometry=new T.PlaneGeometry(14.6,2.05);k.geometries.add(cardGeometry);
 // Keep GPU storage dimensions fixed; scale the 144/256 logical layouts when drawing.
 const cards=Array.from({length:3},(_,i)=>{const canvas=typeof document==='undefined'?null:document.createElement('canvas');if(canvas){canvas.width=1024;canvas.height=256;}const texture=canvas?new T.CanvasTexture(canvas):null;if(texture){texture.colorSpace=T.SRGBColorSpace;textures.push(texture);}const material=new T.MeshBasicMaterial({color:canvas?'#ffffff':'#f5e9ce',map:texture,toneMapped:false}),mesh=new T.Mesh(cardGeometry,material);mesh.name=`atelier-answer-card-${i}`;mesh.userData.dynamic=true;mesh.position.set(0,7-i*2.25,-6.75);board.add(mesh);let previous='';return {mesh,draw(row:any,summary:boolean,compact:boolean){mesh.position.y=compact?4.8:7-i*2.25;mesh.scale.y=compact?256/144:1;mesh.visible=!!row;if(!row){delete mesh.userData.card;return;}mesh.userData.card=row;const key=JSON.stringify([row,summary,compact]);if(previous===key)return;previous=key;if(!canvas||!texture)return;const h=compact?256:144;const c=canvas.getContext('2d')!;c.setTransform(1,0,0,compact?1:256/144,0,0);c.fillStyle=summary?'#e6d5a5':row.accepted===true?'#d4e6bb':row.accepted===false||!row.formatValid?'#f0cebd':'#f5e9ce';c.fillRect(0,0,1024,h);c.fillStyle='#294a49';c.textAlign='left';c.textBaseline='top';c.font=compact?'700 30px sans-serif':'700 17px sans-serif';c.fillText(summary?'RUNDENWERTUNG':row.same?`${row.owners.length} × GLEICHE ANTWORT`:'EINZIGARTIG EINGETRAGEN',18,7,988);c.font=compact?'700 48px sans-serif':'700 32px sans-serif';const lines=atelierWrap(row.answer,988,s=>c.measureText(s).width);lines.forEach((line,j)=>c.fillText(line,18,(compact?44:29)+j*(compact?53:37)));c.font=compact?'32px sans-serif':'17px sans-serif';c.fillText(summary?row.reason:(row.names.length>2?row.names.slice(0,2).join(' · ')+' +'+(row.names.length-2):row.names.join(' · ')),18,compact?218:116,480);c.font=compact?'700 32px sans-serif':'700 17px sans-serif';c.textAlign='right';c.fillText(summary?`${row.points} PUNKTE`:!row.formatValid?'✕ FALSCHER BUCHSTABE · 0 P':row.accepted!==null?`${row.accepted?'✓':'✕'} ${row.points??0} P · ${row.yes??0} JA / ${row.no??0} NEIN`:row.formatValid?'CREW PRÜFT':'✕ FALSCHER BUCHSTABE',1006,compact?226:116,470);texture.needsUpdate=true;}};});
 const seats=Array.from({length:count},(_,i)=>new T.Vector3(...atelierSeat(i,count))),progress:T.Mesh[]=[];
 seats.forEach(p=>{const desk=p.clone().multiplyScalar(.87);model('furniture/table',[desk.x,.3,desk.z],1.1,0,furniture);model('furniture/chairCushion',[p.x,.3,p.z],1.9,-Math.atan2(p.x,p.z),furniture);block('private-writing-sheet','#eee8d0',[desk.x,1.43,desk.z],[1.1,.025,.75],furniture);const pencil=block('atelier-writing-pencil','#c89a5a',[desk.x+.35,1.47,desk.z-.3],[.6,.045,.045],furniture);pencil.rotation.y=-.3;const label=sign('0 / 7',[desk.x,1.48,desk.z],1.4,.5,'#315459','#eee8d0');label.rotation.x=-Math.PI/2;progress.push(label);});
 model('furniture/bookcaseOpen',[-12.2,.3,-8.2],4.1,0,backdrop);model('furniture/books',[-12.1,2,-8],.7,0,backdrop);model('furniture/pottedPlant',[-12.2,.3,-3.4],3.7,0,backdrop);
 let disposed=false;const releases:(()=>void)[]=[];const ready=k.ready().then(()=>{if(!disposed){const visible=backdrop.visible;backdrop.visible=true;for(const group of[floor,backdrop,furniture,miniature])releases.push(batchStaticMeshes(group,{mergeUnique:true}));backdrop.visible=visible;}});
 return {...k,seats,pads,pickables,ready,update(game:any,draft:any,crew:{id?:string;name?:string}[],me:string){
  const frame=atelierFrame(game,crew,me,draft,draft.atelierPage??0);miniature.visible=frame.writing;board.visible=!frame.writing;empty.visible=frame.total===0;
  room.setPersonal(frame.writing&&frame.canWrite&&draft.atelierWritingFocused===true);
  pads.forEach((pad,i)=>{const filled=!!frame.filled[i];pad.material=k.mat(filled?'#c4d7a0':'#9aa98b');pad.userData.pickDisabled=!frame.canWrite;districts[i].position.y=filled?.18:0;labels[i].userData.setText(`${game.categories?.[i]??placeholder[i]}${filled?' ✓':''}`);});
  frame.rows.forEach((row,i)=>progress[i].userData.setText(frame.writing?`${row.filled} / 7${row.ready?' ✓':''}`:frame.summary?`${row.score??0} P`:row.ready?'VERSIEGELT ✓':'PRÜFT …'));
  heading.userData.setText(frame.writing?`${frame.category} · DEINE IDEEN BLEIBEN PRIVAT`:frame.category);
  status.userData.setText(frame.writing?`${frame.ready} / ${crew.length} BLÄTTER ABGEGEBEN`:frame.summary?`${frame.total} CREWMITGLIEDER · SEITE ${frame.page+1} / ${frame.pages}`:frame.resolved?'DIE CREW HAT ENTSCHIEDEN':`${frame.ready} / ${crew.length} STIMMEN VERSIEGELT · SEITE ${frame.page+1} / ${frame.pages}`);
  cards.forEach((card,i)=>card.draw(frame.cards[i],frame.summary,frame.compact));root.userData.phase=game.stage;root.userData.frame={...frame,roomCutaway:!backdrop.visible};
 },dispose(){disposed=true;releases.forEach(release=>release());textures.forEach(t=>t.dispose());k.dispose();}};
}
