import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {pictureFrame,PICTURE_WIDTH,PICTURE_HEIGHT} from '@/lib/picture-presentation';
import {createPictureStageSet} from './picture-stage-set';

export function createPictureStudio(scene:T.Scene,crew:{id?:string;color:string;name?:string}[],me:string){
 const k=locationKit(scene,'picture-reveal-studio'),{root,block:primitive,model,sign}=k,props=new T.Group();root.add(props);
 const block=(name:string,color:string,p:[number,number,number],size:[number,number,number],parent:T.Object3D=props)=>primitive(name,color,p,size,parent);
 createPictureStageSet(k,props);
 block('studio-floor','#35465a',[0,.08,0],[31,.3,27]);block('studio-backdrop','#344b66',[0,5.8,-11],[31,11.6,.4]);
 block('screen-frame','#d1b789',[0,6.3,-8.9],[12.3,8.2,.5]);block('screen-mat','#29363f',[0,6.3,-8.6],[11.6,7.5,.15]);
 const material=new T.MeshBasicMaterial({color:'#e2d2b2',toneMapped:false}),geometry=new T.PlaneGeometry(10.6,10.6*PICTURE_HEIGHT/PICTURE_WIDTH);k.geometries.add(geometry);const screen=new T.Mesh(geometry,material);screen.name='live-picture-screen';screen.position.set(0,6.3,-8.48);root.add(screen);
 sign('PIXELBLITZ · DIE GROSSE ENTHÜLLUNG',[0,11,-10.6],20,.8,'#eedbb3','#34536a');
 const status=sign('WER ERKENNT ES ZUERST?',[0,1.8,-8.3],11,.75,'#efdfbc','#344f60');
 for(const side of[-1,1]){
  model('furniture/kitchenBar',[side*12,.3,10],1.5,side*Math.PI/2,props);
 }
 for(const side of[-1,1]){block('buzzer-bank-platform','#263c54',[side*9.6,.25,2.6],[5,.35,17]);for(let i=0;i<8;i++)block('bank-light-inlay','#bcab78',[side*6.9,.46,-5+i*2.1],[.1,.04,.6]);model('furniture/computerScreen',[side*12,1.85,10],.85,Math.PI,props);}
 const wash=new T.PointLight('#ffd99b',0,22,2);wash.name='active-contestant-wash';root.add(wash);
 const curtains=[-1,1].map(side=>{const g=new T.Group();g.position.set(side*2.65,6.3,-8.05);root.add(g);block('reveal-curtain','#30445f',[0,0,0],[5.3,7.1,.08],g);for(let i=0;i<5;i++)block('curtain-fold','#47556e',[-2.1+i*1.05,0,.05],[.08,7,.06],g);return g;});
 const seats:T.Vector3[]=[],pickables:T.Object3D[]=[],buttons:T.Mesh[]=[],labels:T.Mesh[]=[],strips:T.Mesh[]=[];
 crew.forEach((player,i)=>{
  const side=i%2?1:-1,z=-4+Math.floor(i/2)*2.5,x=side*9.6;seats.push(new T.Vector3(x,1.35,z-.9));
  model('furniture/cabinetBedDrawerTable',[x,.3,z],1.4,0,props);
  const rim=block('personal-buzzer-rim','#d4c39d',[x,1.78,z],[1.7,.15,1.15]);
  const button=block('personal-studio-buzzer',player.color,[x,1.96,z],[1.25,.24,.8],root);button.userData.dynamic=true;button.userData.pick='buzz';button.userData.pickDisabled=player.id!==me;buttons.push(button);if(player.id===me)pickables.push(button);
  const label=sign(player.name??`CREW ${i+1}`,[x,1.17,z+.75],2.8,.5,'#f0dfbc','#354e5e');labels.push(label);
  const strip=block('buzzer-state-light','#809795',[x,.5,z+.8],[2.2,.13,.06],root);strip.userData.dynamic=true;strips.push(strip);
 });
 model('furniture/pottedPlant',[-13,.3,7.5],3.3,0,props);model('furniture/pottedPlant',[13,.3,7.5],3.3,0,props);
 const releaseCurtains=curtains.map(g=>batchStaticMeshes(g,{mergeUnique:true}));
 let disposed=false,release=()=>{};const ready=k.ready().then(()=>{if(!disposed)release=batchStaticMeshes(props,{mergeUnique:true});});
 return {...k,seats,screen,pickables,buttons,ready,update(now:number,game:any,reduced=false){
  const f=pictureFrame(game,crew,me,now),owner=crew.find(p=>p.id===f.owner),winner=f.rows.find(r=>r.solved),featured=f.rows.find(r=>r.active)??(f.revealed?winner:null);
  crew.forEach((p,i)=>{const r=f.rows[i];buttons[i].userData.pickDisabled=p.id!==me||!f.canBuzz;buttons[i].position.y=r.active?1.83:1.96;strips[i].material=k.mat(r.solved?'#b6dca2':r.out?'#bb8c83':r.active?'#eed19a':'#809795');labels[i].userData.setText(String(i+1).padStart(2,'0')+' · '+r.name+(f.revealed?' · '+r.score+' PUNKTE':r.active?' · AM BUZZER':r.out?' · AUSGESETZT':''));});
  wash.intensity=featured?(reduced?28:28+2*Math.sin((now-Number(game.buzzStartedAt??now))/450)):0;if(featured){const p=seats[featured.index-1];wash.position.set(p.x,4.6,p.z+.9);wash.color.set(f.revealed?'#c8efb3':'#ffdc9f');}
  const u=f.revealed?(reduced?1:Math.max(0,Math.min(1,(now-Number(game.revealStartedAt??now-700))/650))):0;curtains.forEach((curtain,i)=>{curtain.visible=f.revealed&&u<1;curtain.position.x=(i?1:-1)*(2.65+6*u*u*(3-2*u));});
  status.userData.setText(f.revealed?'DIE LÖSUNG: '+f.solution:owner?(owner.name??'CREW')+' ANTWORTET · '+Math.ceil(f.remaining/1000)+' s':'WER ERKENNT ES ZUERST?');root.userData.buzzer=f.owner??'';root.userData.frame=f;
 },dispose(){disposed=true;release();releaseCurtains.forEach(release=>release());k.dispose();}};
}
