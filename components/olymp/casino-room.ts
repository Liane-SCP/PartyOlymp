import * as T from 'three';
import type {locationKit} from './location-kit';

/** The club's rear windows, refreshment bar and quiet side lounge stay outside
 * the occupied table envelope. All geometry belongs to the existing room kit. */
export function createCasinoRoom(k:ReturnType<typeof locationKit>,furnishings:T.Group){
 const {block,model}=k;
 function arch(width:number,height:number){
  const shape=new T.Shape(),r=width/2;
  shape.moveTo(-r,0);shape.lineTo(r,0);shape.lineTo(r,height-r);
  shape.absarc(0,height-r,r,0,Math.PI,false);shape.lineTo(-r,0);
  const geometry=new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false,curveSegments:12});k.geometries.add(geometry);return geometry;
 }
 const frame=arch(3.7,5.6),glass=arch(3.22,5.13);
 const brass=k.mat('#ba9765'),jade=k.mat('#6f9d93');jade.emissive.set('#3c6d65');jade.emissiveIntensity=.35;
 function mesh(name:string,geometry:T.BufferGeometry,material:T.Material,x:number,y:number,z:number){const o=new T.Mesh(geometry,material);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;furnishings.add(o);return o;}
 const diamond=new T.Shape();diamond.moveTo(0,.7);diamond.lineTo(.47,0);diamond.lineTo(0,-.7);diamond.lineTo(-.47,0);diamond.closePath();
 const heart=new T.Shape();heart.moveTo(0,-.58);heart.bezierCurveTo(-1,.12,-.55,.9,0,.42);heart.bezierCurveTo(.55,.9,1,.12,0,-.58);
 function flat(g:T.BufferGeometry){const result=g.index?g.toNonIndexed():g;if(result!==g)g.dispose();k.geometries.add(result);return result;}
 const diamondGeometry=flat(new T.ShapeGeometry(diamond,12)),heartGeometry=flat(new T.ShapeGeometry(heart,12)),circle=flat(new T.CircleGeometry(.32,12));
 const ink=k.mat('#254b46'),rose=k.mat('#a65e59');
 for(const side of[-1,1]){
  const x=side*8.7;
  mesh('club-arched-window-frame',frame,brass,x,1.8,-9.43);
  mesh('club-jade-glass',glass,jade,x,2.03,-9.27);
  block('window-mullion','#ba9765',[x,4.25,-9.08],[.07,4.35,.12]);
  block('window-transom','#ba9765',[x,4.25,-9.07],[3.16,.07,.13]);
  block('window-sill','#ba9765',[x,1.98,-9.12],[4.1,.16,.65]);
  mesh('window-card-diamond',diamondGeometry,rose,x,5.45,-8.99);
  mesh('window-card-heart',heartGeometry,ink,x,3.1,-8.99).scale.setScalar(.65);
  for(const edge of[-1,1]){
   block('velvet-curtain-edge','#794e50',[x+edge*2.17,4.4,-9.15],[.58,5.7,.4]);
   block('velvet-curtain-fold','#67434a',[x+edge*2.43,4.4,-9.12],[.16,5.7,.43]);
   block('curtain-tie','#ba9765',[x+edge*2.2,3.65,-8.88],[.62,.15,.13]);
  }
 }
 // Four suits form a restrained wall crest above the actual dealer.
 mesh('crest-diamond',diamondGeometry,brass,-1.2,5.05,-9.36);
 mesh('crest-heart',heartGeometry,rose,1.2,5.05,-9.36);
 const spade=mesh('crest-spade',heartGeometry,jade,-1.2,3.5,-9.36);spade.rotation.z=Math.PI;
 block('spade-stem','#6f9d93',[-1.2,2.94,-9.3],[.17,.4,.12]);
 for(const[dx,dy]of[[0,.32],[-.27,-.08],[.27,-.08]])mesh('crest-club',circle,brass,1.2+dx,3.5+dy,-9.36);
 block('club-stem','#ba9765',[1.2,2.94,-9.3],[.17,.4,.12]);
 // Wainscot and a stepped skirting give the cutaway walls a finished base.
 block('casino-wainscot','#293f3c',[0,1,-9.66],[26.8,1.45,.3]);
 block('wainscot-cap','#ba9765',[0,1.76,-9.4],[26.8,.11,.4]);
 for(const x of[-12.6,-5,5,12.6]){block('club-pilaster','#ba9765',[x,4.15,-9.42],[.13,7.9,.22]);block('pilaster-foot','#ba9765',[x,.58,-9.3],[.45,.6,.42]);}
 for(const z of[-10.4,9.9])block('floor-perimeter-inlay','#bca06a',[0,.265,z],[25.9,.018,.055]);
 for(const x of[-12.9,12.9])block('floor-perimeter-inlay','#bca06a',[x,.265,-.25],[.055,.018,20.4]);
 // Existing downloaded Kenney furnishings, composed as a quiet conversation nook.
 model('furniture/rugRound',[10.1,.29,-4.1],.06,0,furnishings).then(o=>{if(o){const s=new T.Box3().setFromObject(o).getSize(new T.Vector3());o.scale.x*=5.1/s.x;o.scale.z*=5.5/s.z;}});
 model('furniture/chairCushion',[9.1,.3,-6.8],2.15,.18,furnishings);
 model('furniture/chairCushion',[11.6,.3,-3.6],2.15,-Math.PI/2,furnishings);
 model('furniture/tableRound',[9.8,.3,-4.3],1.25,0,furnishings);
 model('food/cup',[9.55,1.55,-4.35],.23,0,furnishings);
 model('food/mug',[10.15,1.55,-4.15],.23,.3,furnishings);
 model('furniture/cabinetBedDrawerTable',[11.6,.3,-7.6],1.6,0,furnishings);
 model('furniture/lampRoundTable',[11.6,1.9,-7.6],1.1,0,furnishings);
 model('furniture/bookcaseOpen',[-11.5,.3,-8.25],2.8,0,furnishings);
 model('furniture/books',[-11.5,1.48,-8.15],.45,0,furnishings);
 for(const x of[-4.1,4.1])model('furniture/lampWall',[x,5.2,-9.25],.85,0,furnishings);
}
