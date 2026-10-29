import * as T from 'three';import {dragonChoices,type DragonRisk} from '@/lib/dragon-altar';import type {locationKit} from './location-kit';

export function createDragonAltar(k:ReturnType<typeof locationKit>){
 const root=new T.Group();root.name='private-dragon-risk-altar';root.userData.dynamic=true;k.root.add(root);
 const pickables:T.Object3D[]=[],chests:{id:DragonRisk;body:T.Group;mixer:T.AnimationMixer;action:T.AnimationAction;progress:number;sampled:number}[]=[],markers:T.Mesh[]=[];
 const choices=dragonChoices.map((choice,i)=>{const x=-4.65+(i-1)*.82;
  const base=k.block(`risk-pedestal-${choice.id}`,choice.color,[x,1.43,1.8],[.78,.12,.82],root);base.userData.pick=`risk:${choice.id}`;pickables.push(base);markers.push(base);
  const title=k.sign(choice.title.toUpperCase(),[x,1.22,2.23],.78,.17,'#fff0cd','#35444a',.65);root.attach(title);
  const points=k.sign(`BIS ${choice.max} PKT`,[x,1.04,2.23],.78,.17,'#e8cf98','#35444a',.65);root.attach(points);
  return k.model('props/treasure-chest',[x,1.5,1.8],.48,0,root).then(body=>{if(!body)return;const clip=(body.userData.animationClips as T.AnimationClip[]).find(c=>c.name==='open');if(!clip)throw Error('Missing authored chest opening');const mixer=new T.AnimationMixer(body),action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;chests.push({id:choice.id,body,mixer,action,progress:0,sampled:-1});body.traverse(object=>{if(object instanceof T.Mesh){object.userData.pick=`risk:${choice.id}`;pickables.push(object);}});});
 });
 const own=k.sign('DEIN TIPP: NOCH OFFEN',[-5.1,.77,2.35],1.45,.24,'#f3ddb2','#35444a',.65);root.attach(own);
 const seal=k.block('seal-own-dragon-estimate','#d2b57d',[-3.82,.78,2.04],[.72,.24,.5],root);seal.userData.pick='estimate';pickables.push(seal);const label=k.sign('VERSIEGELN',[-3.82,.78,2.305],.66,.15,'#24373f','#e6cc8b');root.attach(label);
 let last=0,displayed=false,lastGuess:number|undefined,lastSealed=false,displayText='DEIN TIPP: NOCH OFFEN';
 return {root,pickables,ready:Promise.all(choices),update(f:{now:number;risk:DragonRisk;guess?:number;active:boolean;motion:boolean;sealed:boolean}){
  const delta=Math.min(.1,Math.max(0,(f.now-last)/1000));last=f.now;
  chests.forEach(chest=>{const target=Number(chest.id===f.risk&&!f.sealed);chest.progress=f.motion?chest.progress+(target-chest.progress)*(1-Math.exp(-delta*10)):target;if(Math.abs(chest.progress-target)<.001)chest.progress=target;if(chest.sampled!==chest.progress){chest.action.reset().play();chest.mixer.setTime(chest.progress*chest.action.getClip().duration);chest.sampled=chest.progress;}});
  markers.forEach((marker,i)=>{marker.scale.y=dragonChoices[i].id===f.risk&&(!f.sealed||f.guess!==undefined)?.18:.12;});
  if(!displayed||f.guess!==lastGuess||f.sealed!==lastSealed){displayText=f.sealed?(f.guess!==undefined?'DEIN TIPP IST VERSIEGELT':'KEIN TIPP ABGEGEBEN'):f.guess!==undefined?`DEIN TIPP: ${(f.guess/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'})}`:'DEIN TIPP: NOCH OFFEN';own.userData.setText(displayText);displayed=true;lastGuess=f.guess;lastSealed=f.sealed;}
  pickables.forEach(p=>p.userData.pickDisabled=!f.active||(p.userData.pick==='estimate'&&f.guess===undefined));
  root.userData.risk=f.risk;root.userData.guess=f.guess;root.userData.sealed=f.sealed;
 },snapshot(){return {risk:root.userData.risk,guess:root.userData.guess,sealed:root.userData.sealed,status:displayText,chests:chests.map(c=>({id:c.id,progress:c.progress,lid:c.body.getObjectByName('lid')?.quaternion.toArray(),asset:c.body.userData.asset}))};},dispose(){chests.forEach(c=>{c.mixer.stopAllAction();c.mixer.uncacheRoot(c.body);});}};
}
