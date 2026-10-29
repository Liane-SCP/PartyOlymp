import * as T from 'three';import type {locationKit} from './location-kit';

/** Rear scenery is a separate cutaway: every writer can see their actual desk. */
export function createIdeasWorkshopRoom(k:ReturnType<typeof locationKit>,floor:T.Group,backdrop:T.Group,city:T.Group){
 const {block,model}=k;
 for(let x=-13.5;x<14;x+=.9)block('atelier-floor-seam','#846e52',[x,.237,0],[.018,.008,25],floor);
 for(const z of[-5.25,4.05])block('atelier-floor-inlay','#dfcba3',[0,.244,z],[15,.012,.07],floor);
 for(const x of[-7.5,7.5])block('atelier-floor-inlay','#dfcba3',[x,.244,-.6],[.07,.012,9.3],floor);
 block('atelier-wainscot','#a18b67',[0,1.2,-10.55],[27,1.7,.18],backdrop);
 for(const y of[.4,2.1])block('atelier-wall-rail','#dbc89d',[0,y,-10.38],[27,.12,.16],backdrop);
 for(const x of[-13.4,-7.6,0,7.6,13.4])block('atelier-timber-pilaster','#a18b67',[x,4.5,-10.42],[.19,8.9,.18],backdrop);
 for(const x of[-8,8]){
  block('atelier-clerestory-frame','#dbc89d',[x,9.9,-10.6],[7,1.7,.22],backdrop);
  block('atelier-clerestory-glass','#b5d7d6',[x,9.9,-10.44],[6.65,1.4,.12],backdrop);
  for(const dx of[-1.7,0,1.7])block('atelier-clerestory-mullion','#dbc89d',[x+dx,9.9,-10.3],[.07,1.4,.1],backdrop);
 }
 for(const side of[-1,1]){const beam=block('atelier-open-roof-rib','#947b58',[side*6.7,11.05,-10.3],[13.8,.2,.28],backdrop);beam.rotation.z=side*-.13;}
 // Equipment lives in the rear corners, outside the ellipse of writing seats.
 block('atelier-material-bench','#947b58',[-10.1,1.12,-9.55],[3.3,.2,1.35],backdrop);
 for(const x of[-11.4,-8.8])block('atelier-bench-leg','#785f48',[x,.67,-9.55],[.18,.9,1.05],backdrop);
 for(let i=0;i<4;i++)block('atelier-paper-stack',i%2?'#e5d6ae':'#bfd2c4',[-11+i*.6,1.3,-9.55],[.48,.15,.8],backdrop);
 block('atelier-plan-rack','#947b58',[8.8,1.1,-9.8],[2.5,1.5,.8],backdrop);
 for(let i=0;i<4;i++){const sheet=block('atelier-stored-plan','#e9dbb9',[7.95+i*.55,2,-9.8],[.36,.9,.12],backdrop);sheet.rotation.z=(i-1.5)*.07;}
 // The authored canvas faces -X; turn it toward the shared front camera.
 model('props/atelier-easel',[11.7,.3,-8.2],3.7,Math.PI/2-.18,backdrop);
 // A model-maker's street grid links the seven existing interactive districts.
 block('idea-city-main-street','#678587',[0,1.704,-.8],[13.3,.02,.36],city);
 for(const x of[-3.3,0,3.3])block('idea-city-cross-street','#678587',[x,1.704,-.7],[.2,.02,7.7],city);
 for(let x=-6;x<=6;x+=.7)block('idea-city-street-mark','#eaddb7',[x,1.719,-.8],[.26,.008,.035],city);
 return {setPersonal(personal:boolean){backdrop.visible=!personal;},backdrop};
}
