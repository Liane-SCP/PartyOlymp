import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {createCasinoRoom} from './casino-room';

export function createCasinoLocation(scene:T.Scene,count:number){
 const k=locationKit(scene,'club21-casino'),{root,block,model,sign}=k;
 const furnishings=new T.Group();furnishings.name='casino-furnishings';root.add(furnishings);
 block('marble-floor','#41484b',[0,.1,0],[27,.3,23]);
 for(let i=-12;i<=12;i+=3)block('brass-floor-inlay','#bca06a',[i,.26,0],[.03,.015,22]);
 block('velvet-wall','#354d49',[0,4.3,-10],[27,8.6,.4]);
 block('left-wall','#334d48',[-13.2,3.6,0],[.3,7.2,20]);
 block('cornice','#b79662',[0,8.4,-9.5],[27,.22,.5]);
 sign('CLUB 21',[0,7,-9.4],7,1.2,'#f4dc9e','#243e39');
 // Separate dealer bar and spectator lounge make the room readable beyond the table.
 model('furniture/kitchenBar',[-9.5,.3,-5.6],2.3,Math.PI/2,furnishings);
 model('furniture/kitchenBar',[-9.5,.3,-2.7],2.3,Math.PI/2,furnishings);
 for(let i=0;i<3;i++){model('furniture/stoolBar',[-7.4,.3,-5.5+i*1.7],1.6,Math.PI/2,furnishings);model('food/cup',[-9.5,2.6,-5.5+i*1.1],.3,0,furnishings);}
 createCasinoRoom(k,furnishings);
 model('furniture/pottedPlant',[-11.4,.3,6.5],3.3,0,furnishings);
 model('furniture/pottedPlant',[10.5,.3,4.5],3.1,0,furnishings);
 const center=Math.floor(count/2),span=Math.PI*Math.min(.35,.12+count*.02);
 const seats=Array.from({length:count},(_,i)=>{const side=i<center?Math.max(1,center):Math.max(1,count-center-1),a=Math.PI/2+(i-center)/side*span;return new T.Vector3(Math.cos(a)*8,1.3,Math.sin(a)*6.4);});
 // Low, backless casino stools keep every original portrait visible at the felt.
 seats.forEach(p=>model('furniture/stoolBar',[p.x,.3,p.z],1.03,-Math.atan2(p.x,p.z),furnishings));
 model('furniture/chairCushion',[0,.3,-5.6],2.3,0,furnishings);
 sign('DEALER',[0,3.5,-5.5],3,.6,'#e8d5a5','#24473e');
 const readyBase=k.ready();let disposed=false,release=()=>{};
 const ready=readyBase.then(()=>{if(!disposed)release=batchStaticMeshes(furnishings,{mergeUnique:true});});
 return {...k,seats,ready,dispose(){disposed=true;release();k.dispose();}};
}
