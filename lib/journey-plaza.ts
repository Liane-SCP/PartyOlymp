import type {JourneyIsland} from './journey-world';

/** Floor shared by the terrain paths, docks and public crew positions. */
export function journeyWalkHeight(_node: Pick<JourneyIsland, 'boss'>) {
  return .16;
}

/** Atlas miniatures leave the surrounding promenade and its sightlines clear. */
export function journeyLandmarkScale(node: Pick<JourneyIsland, 'boss' | 'game'>) {
  if(node.game==='colossus')return .4;
  if(node.game==='dragon')return .46;
  if(node.game==='timing')return .39;
  if(node.game==='blackjack')return .38;
  if(node.game==='picture')return .5;
  if(['spectrum','wiki','cards'].includes(node.game))return .5;
  return node.boss ? .5 : .55;
}

type Point=[number,number,number];
const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
/** Bridge boards and walkers sample the same curve, from promenade to promenade. */
export function journeyBridgePoint(from:JourneyIsland,to:JourneyIsland,progress:number):Point{
  const f=Math.max(0,Math.min(1,progress)),dx=to.position[0]-from.position[0],dz=to.position[2]-from.position[2],distance=Math.max(.001,Math.hypot(dx,dz)),ux=dx/distance,uz=dz/distance;
  const bend=Math.sin(f*Math.PI)*(from.index%2?1:-1)*3;
  return [mix(from.position[0]+ux*from.radius*.72,to.position[0]-ux*to.radius*.72,f)-uz*bend,mix(from.position[1]+journeyWalkHeight(from)+.05,to.position[1]+journeyWalkHeight(to)+.05,f)+Math.sin(f*Math.PI)*1.25,mix(from.position[2]+uz*from.radius*.72,to.position[2]-uz*to.radius*.72,f)+ux*bend];
}
export function journeyBridgePassenger(from:JourneyIsland,to:JourneyIsland,progress:number,start:{x:number;z:number},finish:{x:number;z:number},slot:number):Point{
  const f=Math.max(0,Math.min(1,progress)),row=Math.floor(slot/2),leave=.2+row*.018,arrive=.78+row*.018,dx=to.position[0]-from.position[0],dz=to.position[2]-from.position[2],distance=Math.max(.001,Math.hypot(dx,dz)),lane=(slot%2-.5)*.9;
  const port=(node:JourneyIsland,end:number)=>{const p=journeyBridgePoint(from,to,end);return {x:(p[0]+dz/distance*lane-node.position[0])/node.radius,z:(p[2]-dx/distance*lane-node.position[2])/node.radius};};
  const arc=(node:JourneyIsland,a:{x:number;z:number},b:{x:number;z:number},t:number):Point=>{const angle=Math.atan2(a.z,a.x),target=Math.atan2(b.z,b.x),delta=Math.atan2(Math.sin(target-angle),Math.cos(target-angle)),s=smooth(t),r=mix(Math.hypot(a.x,a.z),Math.hypot(b.x,b.z),s)*node.radius;return [node.position[0]+Math.cos(angle+delta*s)*r,node.position[1]+journeyWalkHeight(node)+.05,node.position[2]+Math.sin(angle+delta*s)*r];};
  if(f<leave)return arc(from,start,port(from,0),f/leave);
  if(f>arrive)return arc(to,port(to,1),finish,(f-arrive)/(1-arrive));
  const p=journeyBridgePoint(from,to,smooth((f-leave)/(arrive-leave)));p[0]+=dz/distance*lane;p[2]-=dx/distance*lane;return p;
}
