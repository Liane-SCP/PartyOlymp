import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {vaultFrame} from '@/lib/vault-presentation';
import {createVaultWorkshop} from './vault-workshop';
import {batchVaultDialGears} from './vault-dial-gears';

const colors=['#f35d70','#448fff','#ffd657','#60d49a','#b685ff','#ff9b43'];
export function createVaultLocation(scene:T.Scene,count:number){
 const k=locationKit(scene,'code-mechanical-vault'),{root,block:primitive,model,sign}=k,props=new T.Group();props.name='vault-workstations';root.add(props);
 const block=(name:string,color:string,p:[number,number,number],s:[number,number,number],parent:T.Object3D=props)=>primitive(name,color,p,s,parent);
 createVaultWorkshop(k,props);
 block('steel-floor','#6b7c7c',[0,.08,0],[26,.3,23]);
 block('vault-back-wall','#3e555c',[0,4,-9],[26,8,.6]);
 block('workshop-wall','#45646a',[-12.8,3.4,0],[.35,6.8,19]);
 for(let i=-12;i<=12;i+=2){block('wall-rib','#7a9696',[i,4,-8.6],[.08,7.7,.15]);block('floor-joint','#b7a57c',[i,.24,0],[.025,.01,23]);}
 sign('WERKSTATT DER GEHEIMNISSE',[0,7.6,-8.2],14,1,'#f4e0b6','#2a434b');
 for(const x of[-4.5,4.5])block('vault-door-frame','#baa171',[x,3.65,-6.7],[.7,6.9,.85]);
 block('vault-lintel','#baa171',[0,7.05,-6.7],[9.7,.7,.85]);
 block('treasure-chamber','#153d40',[0,3.5,-7.5],[8.4,6.3,.15]);
 const door=new T.Group();door.name='vault-hinged-door';door.position.set(-4.12,.3,-6.2);root.add(door);
 block('reinforced-door','#607d83',[4.12,3.25,0],[8.2,6.5,.5],door);
 block('door-face-inset','#415f69',[4.12,3.25,.29],[7.4,5.7,.13],door);
 const wheelRoot=new T.Group();wheelRoot.position.set(4.12,3.5,.5);door.add(wheelRoot);
 model('props/vault-gear',[0,-1.5,-.08],3,0,wheelRoot);
 const wheelGeometry=new T.TorusGeometry(1.2,.12,6,32);k.geometries.add(wheelGeometry);const wheel=new T.Mesh(wheelGeometry,k.mat('#d5bc86'));wheelRoot.add(wheel);
 for(let i=0;i<4;i++){const spoke=block('wheel-spoke','#cbb181',[0,0,.01],[2.3,.12,.12],wheelRoot);spoke.rotation.z=i*Math.PI/4;}
 for(const x of [.5,7.7])for(let i=0;i<6;i++)block('door-bolt','#d8c794',[x,.7+i*1.02,.39],[.17,.17,.17],door);
 for(const y of[1.4,5.5])block('vault-hinge','#cfb173',[.05,y,.15],[.45,.9,.85],door);
 block('control-console','#30474f',[0,1.5,.5],[11,2.5,1.8]);
 block('console-face','#a6b7ad',[0,2.84,.5],[11.4,.18,2]);
 const pickables:T.Object3D[]=[],dials:T.Group[]=[],gears:T.Group[]=[];
 const faceGeometry=new T.CylinderGeometry(.72,.72,.15,24);faceGeometry.rotateX(Math.PI/2);k.geometries.add(faceGeometry);
 const faceBatch=new T.InstancedMesh(faceGeometry,k.mat('#ffffff'),4);faceBatch.name='code-color-dials';root.add(faceBatch);
 const hitGeometry=new T.BoxGeometry(1,1,1),hitMaterial=new T.MeshBasicMaterial({visible:false});k.geometries.add(hitGeometry);
 function pick(o:T.Object3D,key:string,size:[number,number,number]){const hit=new T.Mesh(hitGeometry,hitMaterial);hit.position.copy(o.position);hit.scale.set(...size);hit.userData.pick=key;hit.userData.dynamic=true;o.parent!.add(hit);pickables.push(hit);}
 for(let i=0;i<4;i++){const dial=new T.Group();dial.name=`code-dial-${i}`;dial.position.set((i-1.5)*2.55,3.45,.5);root.add(dial);dials.push(dial);
  block('dial-socket','#cdb27a',[0,0,0],[2.1,1.4,.6],dial);
  const gear=new T.Group();gear.name=`code-dial-gear-${i}`;dial.add(gear);gears.push(gear);model('props/vault-gear',[0,-1.02,.36],2.04,0,gear);
  const face=new T.Object3D();face.position.set(0,0,.65);dial.add(face);pick(face,`codeSlot:${i}`,[2.3,2,1.2]);
  const number=sign(String(i+1),[(i-1.5)*2.55,4.45,.9],1,.6);number.name=`code-position-${i}`;
 }
 for(let i=0;i<6;i++){const button=block('color-cartridge',colors[i],[(i%3-1)*2.4,1.7,i<3?3.4:5.3],[1.8,.6,1.1]);pick(button,`codeColor:${i}`,[2.2,1.5,1.6]);const n=sign(String(i+1),[(i%3-1)*2.4,2.01,i<3?3.4:5.3],.8,.65,'#152f37',colors[i]);n.rotation.x=-Math.PI/2;}
 const confirm=block('code-confirm-lever','#b3c98c',[0,1.45,7.2],[4.8,.35,1],root);pick(confirm,'codeConfirm',[4.8,1.2,1.4]);const caption=sign('KOMBINATION VERSIEGELN',[0,1.65,7.2],4.5,.6);caption.rotation.x=-Math.PI/2;
 const feedback=sign('VIER POSITIONEN · EIN GEHEIMNIS',[0,5.55,-1],11,.8,'#f4e0b1','#2c4852');
 sign('ROT: FARBE + PLATZ · WEISS: NUR FARBE · KEINE REIHENFOLGE',[0,6.25,-1],11,.5,'#f4e0b1','#2c4852');
 const seats=Array.from({length:count},(_,i)=>i===0?new T.Vector3(0,.3,9.2):new T.Vector3(i%2?-9.5:9.5,.3,-5+Math.floor((i-1)/2)*2.15));
 seats.slice(1).forEach(p=>{model('furniture/cabinetBedDrawerTable',[p.x,.3,p.z-.6],1.3,0,props);model('furniture/stoolBar',[p.x,.3,p.z+.4],1.3,0,props);});
 model('furniture/bookcaseOpen',[-10.8,.3,-7],4.2,0,props);model('furniture/books',[-10.8,2.1,-6.8],.5,0,props);model('furniture/lampRoundFloor',[10.8,.3,-7],4.6,0,props);
 const statusRoot=new T.Group();statusRoot.name='vault-crew-progress';root.add(statusRoot);
 const sphere=new T.SphereGeometry(.11,8,6);k.geometries.add(sphere);const lamps=new T.InstancedMesh(sphere,k.mat('#ffffff'),count*5),pose=new T.Object3D(),tint=new T.Color();lamps.name='vault-feedback-lamps';for(let i=0;i<count*5;i++)lamps.setColorAt(i,tint.set('#50656c'));statusRoot.add(lamps);
 const dialPips=new T.InstancedMesh(sphere,k.mat('#203742'),24);dialPips.name='code-dial-color-pips';dialPips.count=0;root.add(dialPips);
 const pipLayout=[[[0,0]],[[-1,-1],[1,1]],[[-1,-1],[0,0],[1,1]],[[-1,-1],[-1,1],[1,-1],[1,1]],[[-1,-1],[-1,1],[0,0],[1,-1],[1,1]],[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]];
 const statusPositions=seats.map((p,i)=>i?p:new T.Vector3(-6,.3,6.6));
 const labels=statusPositions.map((p,i)=>{block('station-status-post','#baa171',[p.x,.85,p.z-.8],[.12,1.4,.12]);block('station-status-board','#29434a',[p.x,1.4,p.z-.79],[i===0?3.6:2.8,.9,.12]);const note=sign('',[p.x,1.55,p.z-.7],i===0?3.6:2.8,.6,'#f1ddb5','#29434a');note.name='vault-status-'+i;return note;});
 wheelRoot.userData.dynamic=true;
 let disposed=false,release=()=>{},releaseWheel=()=>{},releaseDoor=()=>{},dialGears:ReturnType<typeof batchVaultDialGears>=null;const ready=k.ready().then(()=>{if(!disposed){release=batchStaticMeshes(props,{mergeUnique:true});wheelRoot.userData.dynamic=false;releaseWheel=batchStaticMeshes(wheelRoot,{mergeUnique:true});wheelRoot.userData.dynamic=true;releaseDoor=batchStaticMeshes(door,{mergeUnique:true});dialGears=batchVaultDialGears(root,gears,k.geometries);}});
 return {...k,seats:seats.map((p,i)=>p.clone().add(new T.Vector3(0,i?1:0,0))),dials,pickables,ready,update(now:number,game:any,draft:any,reduced:boolean,crew:any[]=[],me=""){const own=game.mine??{},guess=own.submitted?(own.pending??own.guesses?.at(-1)?.colors??[]):draft.code??own.pending??[];const frame=vaultFrame(game,now);pickables.forEach(o=>o.userData.pickDisabled=!frame.canUse);confirm.material=k.mat(own.submitted?'#939f92':'#b3c98c');let pipCount=0;dials.forEach((dial,i)=>{
   const value=guess?.[i],scale=draft.codeSlot===i&&!own.submitted?1.08:1;dial.scale.setScalar(scale);gears[i].rotation.z=Number.isInteger(value)?value*Math.PI/3:0;
   pose.position.copy(dial.position).add(new T.Vector3(0,0,.65*scale));pose.scale.setScalar(scale);pose.updateMatrix();faceBatch.setMatrixAt(i,pose.matrix);faceBatch.setColorAt(i,tint.set(colors[value]??'#718a96'));
   for(const[x,y]of pipLayout[value]??[]){pose.position.set(dial.position.x+x*.23*scale,dial.position.y+y*.23*scale,dial.position.z+.75*scale);pose.scale.set(scale,scale,.35*scale);pose.updateMatrix();dialPips.setMatrixAt(pipCount++,pose.matrix);}
  });dialGears?.update();faceBatch.instanceMatrix.needsUpdate=true;faceBatch.instanceColor!.needsUpdate=true;faceBatch.computeBoundingSphere();dialPips.count=pipCount;dialPips.instanceMatrix.needsUpdate=true;dialPips.computeBoundingSphere();pose.scale.setScalar(1);door.rotation.y=reduced&&frame.solved?-Math.PI*.72:frame.angle;wheelRoot.rotation.z=reduced&&frame.solved?Math.PI*1.5:frame.wheel;const last=own.guesses?.at(-1);feedback.userData.setText(own.solved?'TRESOR GEÖFFNET!':last?`${last.exact} EXAKT · ${last.misplaced} FARBE AM FALSCHEN PLATZ`:own.submitted?'VERSIEGELT · DIE CREW IST NOCH DRAN':'VIER POSITIONEN · EIN GEHEIMNIS');root.userData.solved=frame.solved>0;
  const local=Math.max(0,crew.findIndex(p=>p.id===me));crew.forEach((person,i)=>{const seat=(i-local+crew.length)%crew.length,p=statusPositions[seat],row=frame.roster.find(r=>r.id===person.id),last=row?.feedback,status=row?.solved?'GEL\u00d6ST':row?.gaveUp?'ZUSCHAUER':row?.ready?'VERSIEGELT':'R\u00c4TSELT';labels[seat].userData.setText((person.name??'Crew').slice(0,10)+' - '+status+' - '+(row?.attempts??0));for(let j=0;j<5;j++){pose.position.set(p.x+(j-2)*.26,1.08,p.z-.62);pose.updateMatrix();lamps.setMatrixAt(seat*5+j,pose.matrix);const color=j===0?(row?.solved?'#d6c580':row?.ready?'#e5ac6b':'#8dcad6'):j<=Number(last?.exact??0)?'#f35d70':j<=Number(last?.exact??0)+Number(last?.misplaced??0)?'#fff2dc':'#50656c';lamps.setColorAt(seat*5+j,tint.set(color));}});lamps.instanceMatrix.needsUpdate=true;lamps.instanceColor!.needsUpdate=true;lamps.computeBoundingSphere();root.userData.progress={...frame,roster:frame.roster.map(p=>({...p})),doorAngle:door.rotation.y,wheelAngle:wheelRoot.rotation.z};},dispose(){if(disposed)return;disposed=true;release();releaseDoor();releaseWheel();dialGears?.dispose();lamps.dispose();faceBatch.dispose();dialPips.dispose();pickables.forEach(o=>o.removeFromParent());hitMaterial.dispose();k.dispose();}};
}


