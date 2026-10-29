import * as T from 'three';
import {shopPath,shopWalkable,type ShopPoint} from '@/lib/shop-navigation';

export function createShopWalk(actor:T.Object3D|undefined){
 let path:ShopPoint[]=[],last=0,walking=false;
 return {
  stop(){path=[];walking=false;},
  go(x:number,z:number){if(actor)path=shopPath(actor.position,{x,z});},
  step(dx:number,dz:number){if(!actor)return;path=[];const p={x:actor.position.x+dx,z:actor.position.z+dz};if(shopWalkable(p)){actor.position.x=p.x;actor.position.z=p.z;}},
  update(t:number,reduced:boolean){const dt=Math.min(.08,Math.max(0,t-last));last=t;walking=false;if(!actor||!path.length)return false;
   if(reduced){const target=path.at(-1)!;actor.position.set(target.x,.3,target.z);path=[];return false;}
   let travel=dt*5;while(path.length&&travel>0){const p=path[0],distance=Math.hypot(p.x-actor.position.x,p.z-actor.position.z);if(distance<=travel){actor.position.set(p.x,.3,p.z);travel-=distance;path.shift();}else{actor.position.x+=(p.x-actor.position.x)/distance*travel;actor.position.z+=(p.z-actor.position.z)/distance*travel;travel=0;}walking=true;}return walking;
  },
  get walking(){return walking;}
 };
}
