import * as T from 'three';
import type {locationKit} from './location-kit';

/** Static reading hall around the real article portals. The rear alcove has a
 * real open-book model; its decoration never supplies an alternative link. */
export function createLibraryReadingHall(k:ReturnType<typeof locationKit>,parent:T.Group){
 const {block,model}=k,room=new T.Group();room.name='library-reading-hall';parent.add(room);
 const brass='#c4a570',walnut='#66503e',teal='#3d515f',cream='#d7c7a4';
 function own(g:T.BufferGeometry){k.geometries.add(g);return g;}
 function arch(w:number,h:number){const r=w/2,s=new T.Shape();s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);s.closePath();return own(new T.ExtrudeGeometry(s,{depth:.12,bevelEnabled:false,curveSegments:12}));}
 function mesh(name:string,g:T.BufferGeometry,color:string,p:[number,number,number]){const o=new T.Mesh(g,k.mat(color));o.name=name;o.position.set(...p);o.castShadow=o.receiveShadow=true;room.add(o);return o;}
 block('library-clerestory-wall','#7b776b',[0,11.1,-11.8],[31,3.8,.4],room);
 block('walnut-wainscot',walnut,[0,1.6,-11.5],[31,2.5,.2],room);
 for(const y of[2.95,6.9,12.8])block('library-cornice',brass,[0,y,-11.4],[31,.16,.4],room);
 for(const x of[-15,-5.3,5.3,15]){
  block('library-pilaster',walnut,[x,6.55,-11.25],[.5,12.5,.5],room);
  for(const y of[.5,6.9,12.6])block('library-pilaster-cap',brass,[x,y,-11.12],[.85,.25,.7],room);
 }
 const frame=arch(5.4,4.6),pane=arch(4.94,4.17);
 for(const side of[-1,1]){
  mesh('reading-hall-arched-window-frame',frame,'#b69762',[side*9.5,7.65,-11.31]);
  const glass=mesh('reading-hall-opaque-window',pane,'#9ab9b5',[side*9.5,7.83,-11.14]);(glass.material as T.MeshStandardMaterial).emissive.set('#6f9896');(glass.material as T.MeshStandardMaterial).emissiveIntensity=.2;
  block('window-mullion',cream,[side*9.5,9.65,-10.96],[.075,3.7,.12],room);
  block('window-crossbar',cream,[side*9.5,9.35,-10.94],[4.9,.075,.12],room);
  block('window-deep-sill',brass,[side*9.5,7.6,-10.95],[5.8,.18,.8],room);
  model('furniture/bookcaseClosedWide',[side*13.1,7.55,-10.7],2.75,0,room);
  model('furniture/lampWall',[side*5.95,5.8,-11.1],1.0,0,room);
 }
 // An upper walkway with a low rail; the middle stays open above the goal.
 for(const side of[-1,1]){
  block('upper-reading-gallery',walnut,[side*10.4,7.35,-10.9],[9.5,.26,1.5],room);
  for(const x of[6.2,8.1,10,11.9,13.8])block('gallery-railing-post',brass,[side*x,7.95,-10.08],[.08,1.1,.08],room);
  block('gallery-handrail',brass,[side*10,8.52,-10.08],[7.9,.09,.12],room);
 }
 // Floor runner leaves the physical link portals and the crew's aisle clear.
 block('reading-hall-runner',teal,[0,.259,3],[8.5,.025,13],room);
 for(const side of[-1,1])block('runner-gold-edge',brass,[side*4.05,.275,3],[.045,.015,12.5],room);
 for(const z of[-3.1,9.1])block('runner-end-border',brass,[0,.275,z],[8.1,.015,.045],room);
 for(const side of[-1,1])for(const z of[-8,0,8]){
  block('side-aisle-pier',walnut,[side*14.9,3.25,z],[.35,6.1,.45],room);
  block('side-aisle-base',brass,[side*14.9,.55,z],[.62,.5,.7],room);
 }
 // Deep archival niche behind the existing, public-clock book-cover doors.
 block('archive-niche-back',teal,[0,3.4,-11.3],[8.2,6.2,.2],room);
 for(const x of[-4.3,4.3])block('archive-niche-jamb',brass,[x,3.4,-10.7],[.32,6.3,1.1],room);
 block('archive-niche-lintel',brass,[0,6.6,-10.7],[8.9,.24,1.1],room);
 block('archive-book-pedestal',walnut,[0,2,-10],[2.2,3.4,1.7],room);
 block('archive-book-lectern',brass,[0,3.78,-10],[3.6,.16,2.4],room);
 model('props/library-open-book',[0,3.88,-10],.55,0,room);
 model('furniture/books',[-2.8,.3,-10.4],1.0,0,room);
 model('furniture/books',[2.8,.3,-10.4],.8,.15,room);
 // Reading stations use the same curated models as the wider world.
 model('furniture/chairCushion',[-10,.3,7.6],1.7,Math.PI,room);
 model('furniture/lampRoundTable',[-11.35,1.9,5.2],.9,0,room);
 model('props/library-open-book',[-9.8,1.9,5.4],.17,.1,room);
 model('furniture/rugRound',[11,.26,8.8],.08,0,room);
 model('furniture/tableRound',[11,.3,8.8],1.1,0,room);
 model('furniture/chairCushion',[13,.3,8.8],1.7,-Math.PI/2,room);
 model('furniture/pottedPlant',[14,.3,-8.8],2.8,0,room);
 room.userData.design={type:'clerestory-reading-hall',goalBook:'props/library-open-book',decorativeLinks:false};
 return room;
}
