import * as T from 'three';import type {locationKit} from './location-kit';

/** The permanent A/B forms denote the two ends, never their secret position or
 * the meaning of a particular word pair. All scored geometry stays in front. */
export function createSpectrumPavilion(k:ReturnType<typeof locationKit>,parent:T.Group){
 const root=new T.Group();root.name='spectrum-open-pavilion';parent.add(root);const {block}=k;
 const ivory='#d2c9ad',bronze='#ae9470',teal='#567d83';
 const cylinder=new T.CylinderGeometry(1,1,1,48);k.geometries.add(cylinder);
 function drum(name:string,color:string,p:[number,number,number],scale:[number,number,number]){const o=new T.Mesh(cylinder,k.mat(color));o.name=name;o.position.set(...p);o.scale.set(...scale);o.castShadow=o.receiveShadow=true;root.add(o);return o;}
 drum('round-pavilion-foundation','#708c8c',[0,-.19,0],[14.25,.5,11.75]);
 drum('station-floor','#9ba9a0',[0,.08,0],[14,.3,11.5]);
 const rear=new T.CylinderGeometry(13.4,13.4,.35,48,1,false,Math.PI/2,Math.PI);k.geometries.add(rear);
 for(const [y,s,color]of[[.42,1,teal],[.77,.95,ivory]] as const){const tier=new T.Mesh(rear,k.mat(color));tier.name='rear-exhibition-tier';tier.position.set(0,y,-2.3);tier.scale.set(s,1,.38*s);tier.castShadow=tier.receiveShadow=true;root.add(tier);}
 const outer=new T.TorusGeometry(7.3,.18,6,48,Math.PI),inner=new T.TorusGeometry(6.7,.1,6,48,Math.PI);k.geometries.add(outer);k.geometries.add(inner);
 for(const [geometry,color]of[[outer,bronze],[inner,ivory]] as const){const arch=new T.Mesh(geometry,k.mat(color));arch.name='measurement-arch';arch.position.set(0,3.5,-5.25);arch.castShadow=arch.receiveShadow=true;root.add(arch);}
 const rodGeometry=new T.CylinderGeometry(1,1,1,8);k.geometries.add(rodGeometry);
 function rod(a:number[],b:number[],r=.08,color=teal){const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from),o=new T.Mesh(rodGeometry,k.mat(color));o.name='pavilion-structural-link';o.position.copy(from).add(to).multiplyScalar(.5);o.scale.set(r,delta.length(),r);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());o.castShadow=o.receiveShadow=true;root.add(o);}
 for(let i=1;i<6;i++){const a=i*Math.PI/6;rod([Math.cos(a)*6.7,3.5+Math.sin(a)*6.7,-5.25],[Math.cos(a)*7.3,3.5+Math.sin(a)*7.3,-5.25],.065,bronze);}
 for(const side of[-1,1]){
  rod([side*10,5.7,-2],[side*7.3,3.5,-5.25],.16);
  rod([side*10,2.8,-.55],[side*8.85,2.8,-.55],.12,side<0?teal:bronze);
  rod([side*8.85,2.8,-.55],[side*8.85,2.8,0],.12,side<0?teal:bronze);
 }
 block('angular-pole-pedestal',teal,[-10,.45,-2],[3.8,.45,4],root);
 for(const y of[.8,5.5])block('angular-pole-trim',ivory,[-10,y,-2],[3.05,.15,3.35],root);
 drum('round-pole-pedestal',bronze,[10,.45,-2],[2.15,.45,2.2]);
 drum('round-pole-body','#ba9287',[10,3,-2],[1.55,5.4,1.55]);
 for(const y of[.8,5.5])drum('round-pole-trim',ivory,[10,y,-2],[1.7,.15,1.7]);
 const ring=new T.RingGeometry(10.9,11.03,64);k.geometries.add(ring);const border=new T.Mesh(ring,k.mat(bronze));border.name='pavilion-floor-inlay';border.rotation.x=-Math.PI/2;border.scale.set(1, .78,1);border.position.y=.245;root.add(border);
 // Fixed end badges associate the permanent forms with the actual A/B labels.
 for(const side of[-1,1]){const badge=k.sign(side<0?'A':'B',[side*10,4.25,-.37],1.2,1.2,'#f2e2bd',side<0?'#365c64':'#725651');root.add(badge);}
 root.userData.design={kind:'open-measurement-pavilion',poles:['angular A','round B'],additionalRealtimeLights:0};return root;
}
