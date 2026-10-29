import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {auctionFrame,auctionGavelAngle} from '@/lib/auction-presentation';
import {createAuctionPlacards} from './auction-placards';
import {auctionSeat,auctionRowLevel,auctionRowSpacing,auctionEntranceRoute,auctionEntranceFrame} from '@/lib/auction-entrance';

export function createAuctionLocation(scene:T.Scene,count:number){
 const k=locationKit(scene,'auction-theatre'),{root,block,model,sign}=k,props=new T.Group();props.name='auction-seating';root.add(props);
 block('theatre-floor','#80634e',[0,.08,0],[27,.3,24]);
 block('theatre-back-wall','#34545d',[0,4.5,-10.5],[27,9,.5]);
 for(const side of[-1,1]){
  block('theatre-side-wall','#34545d',[side*13.25,3.2,-2],[.4,6.4,17]);
  for(const z of[-8,-3,2]){block('wall-panel','#624f4b',[side*12.99,1.5,z],[.16,2.8,4.4]);block('wall-panel-crown','#d3b17c',[side*12.87,3,z],[.16,.12,4.4]);}
  model('furniture/bookcaseClosedWide',[side*11.6,.3,-7.6],3.7,side<0?Math.PI/2:-Math.PI/2,props);
  model('furniture/lampWall',[side*12.9,4.7,-4],1.3,side<0?Math.PI/2:-Math.PI/2,props);
 }
 for(let row=0;row<Math.ceil(count/4);row++){const level=auctionRowLevel(row),z=1+row*auctionRowSpacing;
  for(const side of[-1,1])block('audience-bank-tier','#a38c6e',[side*5.1,level/2,z],[7.9,level,auctionRowSpacing]);
  block('audience-aisle-tier','#a38c6e',[0,level/2,z],[2.3,level,auctionRowSpacing]);
  block('audience-aisle-carpet','#b36e64',[0,level+.008,z],[1.8,.015,auctionRowSpacing]);
  for(const x of[-.86,.86])block('aisle-carpet-edge','#d3b17c',[x,level+.013,z],[.035,.006,auctionRowSpacing]);
  if(row){const lower=auctionRowLevel(row-1),edge=z-auctionRowSpacing/2;block('audience-aisle-step','#b36e64',[0,lower+.125,edge-.15],[2.3,.25,.3]);}
 }
 block('stage','#624f4b',[0,.8,-5],[20,1.3,8]);
 block('stage-carpet','#b36e64',[0,1.47,-5],[17.5,.06,6]);
 for(let i=0;i<3;i++)block('stage-entry-step','#a38c6e',[0,.3+i*.4,.65-i*.6],[1.9-i*.12,.4,.8]);
 for(const x of[-10,10]){block('proscenium-pillar','#dcc49a',[x,4.9,-6.5],[.65,7,.7]);block('velvet-wing','#9b6467',[x*.86,4.5,-8.8],[2.6,6,.35]);}
 block('proscenium-arch','#d3b17c',[0,8.1,-6.5],[21,.5,.8]);
 const foldGeometry=new T.BoxGeometry(1,1,1);k.geometries.add(foldGeometry);const folds:T.InstancedMesh[]=[];
 const curtains=[-1,1].map(side=>{const curtain=block('opening-curtain','#a66e75',[side*4.3,4.6,-8.6],[8.5,5.9,.25]);curtain.userData.dynamic=true;const pleats=new T.InstancedMesh(foldGeometry,k.mat('#ffffff'),9),pose=new T.Object3D(),tint=new T.Color();for(let i=0;i<9;i++){pose.position.set((i-4)*.105,0,.66);pose.scale.set(.045,1.01,.58);pose.updateMatrix();pleats.setMatrixAt(i,pose.matrix);pleats.setColorAt(i,tint.set(i%2?'#b77980':'#925564'));}pleats.computeBoundingSphere();curtain.add(pleats);folds.push(pleats);return curtain;});
 sign('DAS AUKTIONSHAUS',[0,8.9,-10],13,1,'#f0dab0','#29434c');
 model('furniture/desk',[-7.3,1.5,-4.6],1.6,0,props);
 model('furniture/books',[-8.1,3.12,-4.35],.22,0,props);
 sign('MIRO · ZUM ERSTEN …',[-7.3,2.35,-3.75],3.5,.5,'#2a3f44','#e8d1a3');
 const gavelRig=new T.Group();gavelRig.name='auction-gavel';gavelRig.userData.dynamic=true;root.add(gavelRig);let hammer:T.Object3D|undefined;
 model('props/auction-gavel',[-6.3,3.1,-4.4],1.2,0,gavelRig).then(asset=>{hammer=asset?.getObjectByName('gavel-hammer-pivot');root.userData.gavelReady=!!hammer;});
 for(const x of[-8,-2])block('topic-banner-hanger','#d3b17c',[x,7.7,-5.95],[.08,.5,.08]);
 const board=sign('DIE CREW WÄHLT DAS THEMA',[-5,7.15,-5.95],7.5,.8,'#f7e6c4','#26454b');board.name='auction-topic-banner';
 const bookTopic=sign('',[3.8,6.85,-7.88],8.3,.65,'#f7e6c4','#26454b',.72);bookTopic.visible=false;
 const answers=sign('GROSSE WORTE · ECHTE BEGRIFFE',[0,2,-7.8],16,.65,'#edddb8','#26454b');
 block('stage-word-ledger','#26454b',[3.8,4.6,-8.05],[8.8,4.5,.22]);
 const ledger=Array.from({length:6},(_,i)=>{const line=sign('',[3.8,6.1-i*.58,-7.88],8.3,.55,'#f2e2bd','#26454b',.78);line.name='auction-word-'+i;return line;});
 const reviewHighlight=block('auction-private-review-highlight','#f1c66e',[3.8,6.1,-7.92],[8.55,.58,.025]);reviewHighlight.userData.dynamic=true;reviewHighlight.visible=false;
 const pageNote=sign('BEGRIFFE WERDEN HIER GESAMMELT',[3.8,2.9,-7.88],8.3,.35,'#d4c49f','#26454b');
 const seats=Array.from({length:count},(_,i)=>{const p=auctionSeat(i,count);return new T.Vector3(p[0],p[1]-.7,p[2]);});
 const placards=createAuctionPlacards(k,seats),paddles:T.Group[]=[],pickables:T.Object3D[]=[];
 ledger.forEach((line,i)=>{line.userData.pick=`auctionReview:${i}`;line.userData.pickDisabled=true;pickables.push(line);});
 const paddleGeometry=new T.CylinderGeometry(.48,.48,.12,24);paddleGeometry.rotateX(Math.PI/2);k.geometries.add(paddleGeometry);
 const handleGeometry=new T.BoxGeometry(.12,1,.12);k.geometries.add(handleGeometry);
 const handles=new T.InstancedMesh(handleGeometry,k.mat('#c5a57a'),count),faces=new T.InstancedMesh(paddleGeometry,k.mat('#ffffff'),count),pose=new T.Object3D(),matrix=new T.Matrix4(),tint=new T.Color();handles.name='auction-paddle-handles';faces.name='auction-paddle-faces';handles.castShadow=true;faces.castShadow=true;root.add(handles,faces);for(let i=0;i<count;i++)faces.setColorAt(i,tint.set('#e9d8ab'));
 const hitGeometry=new T.BoxGeometry(1.5,1.5,.4),hitMaterial=new T.MeshBasicMaterial({visible:false});k.geometries.add(hitGeometry);
 seats.forEach((p,i)=>{model('furniture/chairCushion',[p.x,p.y-.2,p.z],1.8,0,props);
  const paddle=new T.Group();paddle.name=`auction-paddle-${i}`;paddle.userData.dynamic=true;paddle.position.set(p.x+.75,p.y+.7,p.z-.2);root.add(paddle);paddles.push(paddle);
  const hit=new T.Mesh(hitGeometry,hitMaterial);hit.position.y=1;hit.userData.pick=`auctionBid:${i}`;paddle.add(hit);pickables.push(hit);
  const label=sign(String(i+1),[0,1,.075],.7,.55,'#24434a','#e9d8ab');paddle.add(label);
 });
 const stageSpot=new T.Group();stageSpot.position.set(-2.5,1.55,-3.5);root.add(stageSpot);model('furniture/pottedPlant',[11.5,.3,-7.7],3,0,props);model('furniture/lampRoundFloor',[-11.8,.3,-7.3],5,0,props);
 let disposed=false,release=()=>{},releaseArchitecture=()=>{};const ready=k.ready().then(()=>{if(!disposed){release=batchStaticMeshes(props,{mergeUnique:true});releaseArchitecture=batchStaticMeshes(root,{mergeUnique:true});}});
 let frame:ReturnType<typeof auctionFrame>|null=null,entrance:ReturnType<typeof auctionEntranceFrame>|null=null;
 const routes=seats.map((_,i)=>auctionEntranceRoute(i,count));
 const actorSeats=seats.map(p=>p.clone().add(new T.Vector3(0,.7,0)));
 return {...k,seats:actorSeats,stageSpot,gavelRig,pickables,ready,position(i:number,id:string){return frame?.onStage&&frame.rows[i]?.id===id&&frame.rows[i]?.leading&&entrance?new T.Vector3(...entrance.position):actorSeats[i].clone();},update(now:number,game:any,crew:{id?:string;name?:string}[],me:string,reduced:boolean,draft:any={}){
  frame=auctionFrame(game,crew,me,now,draft.auctionPage??-1);if(reduced&&frame.onStage){frame.entry=1;frame.ease=1;}const opening=4.3+4.3*frame.ease;curtains.forEach((o,i)=>{o.position.x=(i?1:-1)*opening;o.scale.x=8.5*(1-.72*frame!.ease);});
  const performer=frame.rows.findIndex(row=>row.leading);entrance=frame.onStage&&performer>=0?auctionEntranceFrame(game,now,routes[performer],reduced):null;
  if(entrance?.walking)frame.rows[performer].status='ZUR BÜHNE';else if(frame.onStage&&performer>=0&&game.stage==='perform')frame.rows[performer].status='AUF DER BÜHNE';
  const canReview=game.stage==='judge'&&!!game.mine&&!game.mine.submitted&&!game.mine.abandoned&&game.leader!==me;
  pickables.forEach(o=>o.userData.pickDisabled=o.userData.pick?.startsWith('auctionReview:')?!canReview:!frame!.canBid||!!draft.auctionBookFocused);[...paddles,placards.mesh,handles,faces,gavelRig].forEach(o=>o.visible=!draft.auctionBookFocused);
  placards.update(frame.rows);if(hammer)hammer.rotation.z=auctionGavelAngle(game,now,reduced);
  board.visible=answers.visible=!draft.auctionBookFocused;bookTopic.visible=!!draft.auctionBookFocused;bookTopic.userData.setText(game.topic?.name??'BÜHNENBUCH');
  board.userData.setText(game.topic?.name??'DIE CREW WÄHLT DAS THEMA');
  answers.userData.setText(frame.caption);
  reviewHighlight.visible=false;
  ledger.forEach((line,i)=>{const a=frame!.words[i],word=a?.word.length>25?a.word.slice(0,24)+'…':a?.word,selected=canReview&&a?.index===draft.auctionReview;line.userData.pick=`auctionReview:${a?.index??-1}`;line.userData.pickDisabled=!canReview||!a;if(selected){reviewHighlight.visible=true;reviewHighlight.position.y=line.position.y;}line.userData.setText(a?`${selected?'› ':''}${a.valid===null?'':a.valid?'✓ ':'× '}${a.index+1}. ${word}${a.valid===null?'':` (${a.yes}:${a.no})`}`:'');});
  pageNote.userData.setText(frame.total?`BÜHNENBUCH · ${frame.page+1} / ${frame.pages} · ${frame.total} BEGRIFFE`:'BEGRIFFE WERDEN HIER GESAMMELT');
  frame.rows.forEach((row,i)=>{paddles[i].rotation.z=row.leading&&!frame!.onStage?-.45:row.passed?.9:.3;paddles[i].updateMatrix();pose.position.set(0,.45,0);pose.updateMatrix();handles.setMatrixAt(i,matrix.multiplyMatrices(paddles[i].matrix,pose.matrix));pose.position.y=1;pose.updateMatrix();faces.setMatrixAt(i,matrix.multiplyMatrices(paddles[i].matrix,pose.matrix));faces.setColorAt(i,tint.set(row.leading?'#ffe3a2':row.passed?'#72858c':'#e9d8ab'));});handles.instanceMatrix.needsUpdate=true;faces.instanceMatrix.needsUpdate=true;faces.instanceColor!.needsUpdate=true;handles.computeBoundingSphere();faces.computeBoundingSphere();root.userData.frame={...frame,entrance:entrance?{...entrance,player:game.leader}:null,curtain:opening,gavelReady:root.userData.gavelReady===true,gavelAngle:hammer?.rotation.z??0,placards:placards.positions};
 },dispose(){if(disposed)return;disposed=true;releaseArchitecture();release();folds.forEach(mesh=>mesh.dispose());handles.dispose();faces.dispose();pickables.forEach(o=>o.removeFromParent());hitMaterial.dispose();k.dispose();}};
}

