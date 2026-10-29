import * as T from 'three';import type {locationKit} from './location-kit';

/** Fixed workshop architecture. No cue, dial or prop depends on the secret fuse. */
export function createInventorsHall(k:ReturnType<typeof locationKit>,parent:T.Group){
 const root=new T.Group();root.name='word-inventors-hall';parent.add(root);const {block,model}=k;
 const steel='#4a6265',ivory='#c6c5ac',copper='#ae8d67',brick='#7c7565';
 // Brick courses and jambs break up the old flat back wall without extra textures.
 for(const y of[1.1,2.1,3.1,7.2,8.2,9.2]){
  block('brick-course',brick,[0,y,-10.26],[26.5,.04,.05],root);
  for(let i=0;i<8;i++)block('brick-joint',brick,[-11.8+i*3.35+(y%2>.5?.6:0),y+.5,-10.25],[.035,.95,.06],root);
 }
 block('workshop-display-backing','#405757',[0,5.1,-10.12],[14.4,4.05,.16],root);
 for(const x of[-7.25,7.25])block('display-copper-frame',copper,[x,5.1,-10],[.12,4.25,.15],root);
 for(const y of[3,7.2])block('display-copper-frame',copper,[0,y,-10],[14.6,.12,.15],root);
 for(const side of[-1,1]){
  const x=side*9.9;
  block('industrial-window-frame',ivory,[x,7.7,-10.13],[4.5,2.6,.18],root);
  block('industrial-window-pane','#9cb7b0',[x,7.7,-10.01],[4.15,2.25,.07],root);
  for(const dx of[-1.05,0,1.05])block('industrial-window-mullion',steel,[x+dx,7.7,-9.95],[.065,2.3,.08],root);
  block('industrial-window-crossbar',steel,[x,7.7,-9.94],[4.2,.065,.08],root);
  block('window-sill',copper,[x,6.32,-10],[4.7,.16,.5],root);
  block('toolboard-frame',copper,[x,5.1,-10.06],[4.7,2.4,.22],root);
  block('toolboard','#465e60',[x,5.1,-9.9],[4.42,2.14,.1],root);
  for(const dx of[-1.35,0,1.35]){
   block('tool-hanging-peg',ivory,[x+dx,5.85,-9.76],[.09,.1,.2],root);
   const hanger=new T.Group();hanger.name='wrench-hanger';hanger.position.set(x+dx,4.18,-9.62);hanger.rotation.z=dx===0?0:dx*.12;root.add(hanger);
   model('props/workshop-wrench',[0,0,0],dx===0?1.65:1.35,0,hanger);
  }
  block('rear-workbench',steel,[x,1.2,-6.4],[4.5,1.8,1.1],root);
  block('workbench-wood-top',copper,[x,2.2,-6.4],[4.7,.17,1.3],root);
  for(const dx of[-1.25,0,1.25]){
   block('workbench-drawer',ivory,[x+dx,1.25,-5.8],[1.08,1.25,.08],root);
   block('drawer-pull',steel,[x+dx,1.55,-5.73],[.45,.07,.09],root);
  }
  block('workshop-border',copper,[side*12.6,.25,0],[.1,.02,21.8],root);
  for(let i=0;i<8;i++){const stripe=block('fixed-safety-stripe','#ccb376',[side*12.25,.265,-8+i*2.5],[.65,.02,.12],root);stripe.rotation.y=side*.6;}
 }
 for(const z of[-5.4,1.2,7.8]){
  block('side-window-frame',ivory,[-12.98,5.15,z],[.18,3.1,4.7],root);
  block('side-window-pane','#9cb7b0',[-12.85,5.15,z],[.06,2.77,4.35],root);
  for(const y of[4.45,5.15,5.85])block('side-window-crossbar',steel,[-12.79,y,z],[.08,.055,4.4],root);
  block('side-window-mullion',steel,[-12.78,5.15,z],[.08,2.8,.07],root);
 }
 block('rear-roof-beam',steel,[0,10.15,-10.08],[26.5,.28,.4],root);
 for(const x of[-12.2,12.2]){
  const brace=block('roof-knee-brace',steel,[x,9.55,-10.02],[1.8,.14,.2],root);brace.rotation.z=x<0?.65:-.65;
 }
 // Fixed service grating below the handoff path: no lights, spinning gears or clock.
 const ring=new T.RingGeometry(2.8,3,32);k.geometries.add(ring);const grate=new T.Mesh(ring,k.mat('#697875'));grate.name='central-repair-grate';grate.rotation.x=-Math.PI/2;grate.position.set(0,.252,0);grate.receiveShadow=true;root.add(grate);
 for(const x of[-2,-1,0,1,2])block('grate-bar',steel,[x,.255,0],[.045,.02,Math.sqrt(9-x*x)*2],root);
 root.userData.design={kind:'inventors-hall',tool:'props/workshop-wrench',additionalRealtimeLights:0};return root;
}
