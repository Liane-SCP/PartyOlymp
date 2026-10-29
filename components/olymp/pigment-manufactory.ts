import * as T from 'three';import type {locationKit} from './location-kit';

/** Immutable room dressing. It belongs to the mechanism so neutral sample and
 * result views can hide it as one subtree, without altering the scored plates. */
export function createPigmentManufactory(k:ReturnType<typeof locationKit>,parent:T.Group){
 const root=new T.Group();root.name='pigment-manufactory';parent.add(root);const {block,model}=k;
 const cream='#d9d5bd',wood='#a88b67',teal='#476974',brass='#b8a77d';
 block('manufactory-left-wall',teal,[-14.35,6.6,0],[.3,13.2,24.8],root);
 block('manufactory-right-return',teal,[14.35,6.6,-7],[.3,13.2,7.2],root);
 for(const x of[-13.7,-7.7,0,7.7,13.7]){
  block('rear-ivory-pilaster',cream,[x,6.5,-10.48],[.22,12.5,.18],root);
  block('pilaster-cap',brass,[x,12.75,-10.35],[.65,.22,.35],root);
 }
 for(const y of[.45,3.15,12.65])block('rear-wall-moulding',y===3.15?wood:cream,[0,y,-10.36],[28.5,.16,.2],root);
 // Pale opaque panes suggest a daylight workshop; no extra lights or refraction.
 for(const side of[-1,1]){
  const x=side*10.7;
  block('clerestory-frame',cream,[x,9.25,-10.18],[4.65,5.25,.25],root);
  block('clerestory-pane','#a4c6c3',[x,9.25,-10.02],[4.25,4.85,.08],root);
  for(const dx of[-1.08,0,1.08])block('clerestory-mullion',cream,[x+dx,9.25,-9.95],[.07,4.9,.08],root);
  for(const y of[8.05,9.25,10.45])block('clerestory-crossbar',cream,[x,y,-9.94],[4.3,.06,.09],root);
  block('window-sill',wood,[x,6.55,-9.96],[4.9,.2,.7],root);
  block('pigment-preparation-bench',teal,[x,1.43,-8.7],[5.2,2.3,2.35],root);
  block('preparation-bench-top',cream,[x,2.66,-8.7],[5.45,.18,2.55],root);
  for(const dx of[-1.7,0,1.7]){
   block('bench-drawer',wood,[x+dx,1.7,-7.48],[1.5,.95,.08],root);
   block('bench-drawer-pull',brass,[x+dx,1.8,-7.4],[.45,.06,.1],root);
   model('props/laboratory-flask',[x+dx,2.76,-8.6],dx===0?1.6:1.15,side*.25,root);
   block('pigment-bottle-coaster',['#aa7470','#779c84','#7797aa'][Math.round(dx/1.7)+1],[x+dx,2.77,-8.6],[1.1,.035,1],root);
  }
  for(const z of[-3.8,3.2,9.8]){
   block('floor-side-border',wood,[side*13.65,.246,z],[.1,.018,5.8],root);
   block('floor-brass-marker',brass,[side*13.65,.26,z],[.55,.016,.55],root);
  }
 }
 for(const z of[-5.5,1.5,8.5]){
  block('side-window-frame',cream,[-14.12,8.7,z],[.18,4.7,4.6],root);
  block('side-window-pane','#a4c6c3',[-14,8.7,z],[.08,4.3,4.2],root);
  block('side-window-post',cream,[-13.93,8.7,z],[.08,4.35,.07],root);
  for(const y of[7.6,8.7,9.8])block('side-window-bar',cream,[-13.92,y,z],[.09,.06,4.25],root);
 }
 // A wall rack gives the station a purpose without placing props in the controls.
 for(const side of[-1,1])for(const y of[4.7,5.75]){
  block('sample-shelf',wood,[side*12.3,y,-3.1],[2.6,.14,1.1],root);
  for(const dx of[-.75,0,.75]){
   block('sealed-pigment-jar',cream,[side*12.3+dx,y+.37,-3.1],[.48,.6,.48],root);
   block('jar-stopper',brass,[side*12.3+dx,y+.71,-3.1],[.5,.1,.5],root);
  }
 }
 root.userData.design={kind:'pigment-manufactory',flask:'props/laboratory-flask',additionalRealtimeLights:0};return root;
}
