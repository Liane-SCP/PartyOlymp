import * as T from 'three';import type {locationKit} from './location-kit';

/** Equipment frames the unlit puzzle screen. No beam, camera, light fitting or
 * decorative animation is allowed in the image's actual viewing rectangle. */
export function createPictureStageSet(k:ReturnType<typeof locationKit>,parent:T.Group){
 const{block,model}=k,root=new T.Group();root.name='picture-gameshow-set';parent.add(root);
 const steel='#8298a2',navy='#263c54',gold='#bcab78';
 const cylinder=new T.CylinderGeometry(1,1,1,8);k.geometries.add(cylinder);
 function rod(a:number[],b:number[],r=.06,color=steel){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start),o=new T.Mesh(cylinder,k.mat(color));o.name='studio-truss-member';o.position.copy(start).add(end).multiplyScalar(.5);o.scale.set(r,delta.length(),r);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());o.castShadow=o.receiveShadow=true;root.add(o);return o;}
 for(const side of[-1,1]){
  const x=side*13.5;
  block('truss-foot',navy,[x,.45,-7],[1.5,.4,1.3],root);
  for(const dx of[-.28,.28])for(const dz of[-.28,.28])rod([x+dx,.6,-7+dz],[x+dx,10.95,-7+dz]);
  for(let i=0;i<5;i++)for(const z of[-7.28,-6.72]){rod([x-.28,.7+i*2,z],[x+.28,2.7+i*2,z],.045);rod([x+.28,.7+i*2,z],[x-.28,2.7+i*2,z],.045);}
  rod([x,10.95,-7],[x,11.1,-10.7]);
  block('studio-acoustic-panel','#293c54',[side*10.1,5.85,-10.68],[6.3,10.4,.15],root);
  for(let i=0;i<5;i++)block('acoustic-panel-divider','#47566c',[side*10.1,1.8+i*1.9,-10.56],[6.1,.035,.05],root);
  block('side-velvet-drape','#70515e',[side*11.1,5.85,-10.25],[2.3,10,.18],root);
  for(let i=0;i<5;i++)block('velvet-drape-fold','#865f69',[side*11.1-.94+i*.47,5.85,-10.1],[.09,9.95,.13],root);
  block('drape-gold-tie',gold,[side*11.1,3.8,-9.98],[2.3,.16,.12],root);
  // Fixed pixel border remains unrelated to the actual image or buzzer timer.
  for(let i=0;i<8;i++)block('fixed-pixel-border',i%3===0?'#bcab78':i%3===1?'#6b969e':'#687991',[side*7.35,2.75+i*.95,-9.05],[.6,.6,.14],root);
  for(const y of[1.4,3.5]){
   block('studio-speaker-cabinet',navy,[side*14.2,y,-9.2],[1.3,1.9,1],root);
   for(const oy of[-.42,.42]){const driver=new T.Mesh(cylinder,k.mat('#17293b'));driver.name='studio-speaker-driver';driver.position.set(side*14.2,y+oy,-8.64);driver.scale.set(.42,.08,.42);driver.rotation.x=Math.PI/2;root.add(driver);}
  }
  model('props/studio-camera',[side*13.4,.3,5.6],3.2,-Math.PI/2+side*.76,root);
 }
 // Header truss sits behind the original show title, above the screen.
 for(const y of[10.85,11.35])rod([-13.5,y,-10.7],[13.5,y,-10.7]);
 for(let i=0;i<18;i++)rod([-13.5+i*1.5,10.85,-10.7],[-12+i*1.5,11.35,-10.7],.045);
 for(const x of[-11.6,-8.3,8.3,11.6]){
  const mount=new T.Group();mount.name='overhead-spotlight-mount';mount.position.set(x,10.4,-8.25);mount.rotation.x=Math.PI*.72;root.add(mount);
  model('props/studio-spotlight',[0,0,0],1.45,0,mount);
  rod([x,10.4,-8.25],[x,11.05,-10.7],.055);
 }
 block('screen-stage-deck',navy,[0,.52,-7.5],[13.8,.55,4.2],root);
 block('screen-stage-front-edge',gold,[0,.81,-5.42],[13.8,.07,.09],root);
 block('studio-center-floor','#304459',[0,.246,2],[12,.025,19],root);
 for(const side of[-1,1])block('studio-floor-guide',gold,[side*5.6,.265,2],[.035,.014,18.4],root);
 for(const z of[-2.8,6.8])block('camera-floor-mark',gold,[0,.265,z],[1.3,.014,.035],root);
 root.userData.design={type:'pixel-gameshow-studio',camera:'props/studio-camera',spotlight:'props/studio-spotlight',additionalRealtimeLights:0};return root;
}
