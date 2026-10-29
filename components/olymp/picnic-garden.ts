import * as T from 'three';import type {locationKit} from './location-kit';

/** The empty central lawn belongs to every possible answer grouping. Decoration
 * stays at the perimeter and carries no information about sealed answers. */
export function createPicnicGarden(k:ReturnType<typeof locationKit>,parent:T.Group){
 const root=new T.Group();root.name='hivemind-festival-garden';parent.add(root);const {block,model}=k;
 const wood='#ad936b',cream='#dfd7b6',sage='#718d73';
 model('props/garden-gazebo',[0,.1,-11.7],5.2,0,root);
 // The public question and outcome banners hang in front of this real structure.
 for(const x of[-11.8,11.8]){block('festival-banner-post',wood,[x,5.4,-11.85],[.18,10.7,.18],root);block('banner-post-cap',cream,[x,10.8,-11.85],[.34,.14,.34],root);}
 block('festival-banner-header',wood,[0,10.7,-11.85],[24,.15,.2],root);
 for(const x of[-10,-5,0,5,10])block('banner-hanger',cream,[x,10.47,-11.72],[.035,.38,.035],root);
 for(const side of[-1,1]){
  // Furnish the existing real tables; all of these seats stay outside the game.
  for(const z of[6.8,9.2]){
   block('picnic-bench-seat',wood,[side*14,.55,z],[3.7,.18,.48],root);
   for(const dx of[-1.35,1.35])block('picnic-bench-leg',sage,[side*14+dx,.3,z],[.15,.5,.4],root);
  }
  for(let i=0;i<4;i++)for(let j=0;j<3;j++)if((i+j)%2===0)block('picnic-blanket-check',cream,[side*14.2-1.5+i,.221,4.07+j*.93],[.95,.012,.88],root);
  for(const z of[-4,1.3]){
   block('garden-flower-bed',wood,[side*14.7,.32,z],[1.4,.5,2.4],root);
   block('garden-bed-soil','#79846c',[side*14.7,.59,z],[1.22,.05,2.2],root);
  }
  for(const z of[-3.6,0,3.6]){
   block('side-fence-post',cream,[side*16,.8,z],[.12,1.4,.12],root);
   if(z<3.6)for(const y of[.55,1.05])block('side-fence-rail',wood,[side*16,y,z+1.8],[.07,.08,3.6],root);
  }
 }
 for(let i=0;i<9;i++){const x=-8+i*2;block('rear-fence-post',cream,[x,.8,-13],[.12,1.4,.12],root);if(i<8)for(const y of[.55,1.05])block('rear-fence-rail',wood,[x+1,y,-13],[2,.08,.07],root);}
 // Small flowers use shared low-poly geometry and become static material batches.
 const bud=new T.IcosahedronGeometry(.14,0);k.geometries.add(bud);
 for(const side of[-1,1])for(const z of[-4,1.3])for(let i=0;i<4;i++){
  const x=side*14.7+(i%2?-.35:.35),pz=z-.72+Math.floor(i/2)*1.4,h=.9+(i%2)*.12;
  block('flower-stem',sage,[x,.74,pz],[.035,.3,.035],root);
  for(let petal=0;petal<3;petal++){const a=petal*Math.PI*2/3,o=new T.Mesh(bud,k.mat(i%2?'#d6a99a':'#d9c78c'));o.name='garden-flower-petal';o.position.set(x+Math.cos(a)*.12,h,pz+Math.sin(a)*.12);o.scale.y=.45;root.add(o);}
  const center=new T.Mesh(bud,k.mat('#e3d3a0'));center.name='garden-flower-center';center.position.set(x,h+.025,pz);center.scale.setScalar(.55);root.add(center);
 }
 // A rear stepping path approaches the shelter without crossing the group lawn.
 for(let i=0;i<4;i++){const p=block('shelter-stepping-stone','#c5c6a8',[(i%2?-.12:.12),.18,-8.8-i*.64],[1.05,.08,.45],root);p.rotation.y=(i%2?1:-1)*.08;}
 root.userData.design={kind:'picnic-festival-garden',shelter:'props/garden-gazebo',additionalRealtimeLights:0};return root;
}
