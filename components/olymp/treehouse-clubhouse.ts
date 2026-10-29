import * as T from 'three';import type {locationKit} from './location-kit';

/** The rear club terrace and side bridge never occupy the private hand arc. */
export function createTreehouseClubhouse(k:ReturnType<typeof locationKit>,parent:T.Group){
 const root=new T.Group();root.name='treehouse-club-terrace';parent.add(root);const {block,model}=k,wood='#99704e',rope='#e7d5a1';
 block('rear-clubhouse-deck',wood,[0,.13,-13.9],[12,.35,7.8],root);
 for(let x=-5;x<=5;x++)block('rear-deck-seam','#5c4b3e',[x,.315,-13.9],[.026,.015,7.8],root);
 model('props/treehouse-clubhouse',[0,.32,-13.5],7.2,0,root);
 for(const side of[-1,1]){
  for(const z of[-11,-14,-17.4])block('rear-terrace-post','#c7a36c',[side*5.8,1.1,z],[.13,1.65,.13],root);
  for(const y of[.85,1.85])block('rear-terrace-rail',rope,[side*5.8,y,-14.1],[.08,.08,6.6],root);
 }
 const cableGeometry=(x:number)=>{const curve=new T.CatmullRomCurve3([new T.Vector3(x,1.45,9.8),new T.Vector3(x,1.05,12.6),new T.Vector3(x,1.2,15.1)]),g=new T.TubeGeometry(curve,18,.04,5,false);k.geometries.add(g);const cable=new T.Mesh(g,k.mat(rope));cable.name='bridge-rope';root.add(cable);};
 for(const x of[8.3,10.7]){for(const z of[9.8,15.1])block('bridge-rope-post','#c7a36c',[x,.65,z],[.13,1.8,.13],root);cableGeometry(x);}
 // Hanging rope strands and diagonal under-deck braces describe the structure.
 for(const x of[-10.5,10.5])for(const side of[-1,1]){const brace=block('deck-support-brace','#746044',[x+side*.6,-1.1,-5.8],[.25,3.2,.25],root);brace.rotation.z=side*.45;}
 root.userData.design={kind:'canopy-card-clubhouse',model:'props/treehouse-clubhouse',additionalRealtimeLights:0};return root;
}
