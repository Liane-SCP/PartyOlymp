import type {JourneyIsland} from './journey-world';
import {journeyWalkHeight} from './journey-plaza';
export type TransitKind='bridge'|'ferry'|'airship';
export function journeyTransitCue(previous:string,current:string,frameGap:number){
 if(!previous||!current||frameGap<0||frameGap>450)return null;
 const [beforeKind,before]=previous.split(':'),[kind,phase]=current.split(':');if(kind!==beforeKind)return null;
 if(before==='gather'&&phase==='boarding')return 'journeyBoard';
 if(before==='boarding'&&phase==='travelling')return kind==='ferry'?'journeyFerry':'journeyAirship';
 return before==='travelling'&&phase==='landing'?'journeyLand':null;
}
type Point=[number,number,number];
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
export function journeyTransitKind(from:JourneyIsland,to:JourneyIsland):TransitKind{
 if(from.game==='kraken'||to.game==='kraken')return 'ferry';
 return from.chapter!==to.chapter||Math.hypot(to.position[0]-from.position[0],to.position[2]-from.position[2])>65?'airship':'bridge';
}
export function transitSeat(slot:number,count:number):Point{
 const columns=Math.min(3,Math.max(1,count)),rows=Math.ceil(count/columns),row=Math.floor(slot/columns),inRow=Math.min(columns,count-row*columns);
 return [(slot%columns-(inRow-1)/2)*1.35,.04,(row-(rows-1)/2)*1.65];
}
/** Public timestamp sampling: no timers, accumulated simulation or random state. */
export function journeyTransitFrame(from:JourneyIsland,to:JourneyIsland,progress:number){
 const f=Math.max(0,Math.min(1,progress)),kind=journeyTransitKind(from,to),dx=to.position[0]-from.position[0],dz=to.position[2]-from.position[2],length=Math.max(.001,Math.hypot(dx,dz)),ux=dx/length,uz=dz/length;
 const gap=Math.max(1,length-from.radius-to.radius),standOff=Math.min(7,gap*.25),s=smooth((f-.25)/.57);
 const start:Point=[from.position[0]+ux*(from.radius+standOff),from.position[1]+2.3,from.position[2]+uz*(from.radius+standOff)],end:Point=[to.position[0]-ux*(to.radius+standOff),to.position[1]+2.3,to.position[2]-uz*(to.radius+standOff)];
 const bend=Math.sin(s*Math.PI)*3,lift=Math.sin(s*Math.PI)*(kind==='airship'?7:2);
 const position:Point=[mix(start[0],end[0],s)-uz*bend,mix(start[1],end[1],s)+lift,mix(start[2],end[2],s)+ux*bend];
 const curve=Math.cos(s*Math.PI)*Math.PI*3,yaw=Math.atan2(-(end[0]-start[0]-uz*curve),-(end[2]-start[2]+ux*curve));
 return {kind,f,position,yaw,sourcePort:[from.position[0]+ux*from.radius*.72,from.position[1]+journeyWalkHeight(from)+.05,from.position[2]+uz*from.radius*.72] as Point,targetPort:[to.position[0]-ux*to.radius*.72,to.position[1]+journeyWalkHeight(to)+.05,to.position[2]-uz*to.radius*.72] as Point,direction:[ux,uz] as const,phase:f<.1?'gather':f<.25?'boarding':f<.82?'travelling':f<1?'landing':'arrived'};
}
export type TransitFrame=ReturnType<typeof journeyTransitFrame>;
export const VESSEL_BOUNDS={min:[-3,-2.2,-6.8],max:[3,11.2,6]} as const;
export function transitVesselPoints(frame:TransitFrame):Point[]{
 const points:Point[]=[],c=Math.cos(frame.yaw),s=Math.sin(frame.yaw);for(const x of[VESSEL_BOUNDS.min[0],VESSEL_BOUNDS.max[0]])for(const y of[VESSEL_BOUNDS.min[1],VESSEL_BOUNDS.max[1]])for(const z of[VESSEL_BOUNDS.min[2],VESSEL_BOUNDS.max[2]])points.push([frame.position[0]+x*c+z*s,frame.position[1]+y,frame.position[2]-x*s+z*c]);return points;
}
export function transitSeatWorld(frame:TransitFrame,slot:number,count:number):Point{
 const [x,y,z]=transitSeat(slot,count),c=Math.cos(frame.yaw),s=Math.sin(frame.yaw);
 return [frame.position[0]+x*c+z*s,frame.position[1]+y,frame.position[2]-x*s+z*c];
}
/** Board from the existing public start position and disembark to the normal ring. */
export function transitPassenger(from:JourneyIsland,to:JourneyIsland,frame:TransitFrame,start:{x:number;z:number},finish:{x:number;z:number},slot:number,count:number){
 const seat=transitSeatWorld(frame,slot,count),{f}=frame;
 const source:Point=[from.position[0]+start.x*from.radius,from.position[1]+journeyWalkHeight(from)+.05,from.position[2]+start.z*from.radius],target:Point=[to.position[0]+finish.x*to.radius,to.position[1]+journeyWalkHeight(to)+.05,to.position[2]+finish.z*to.radius];
 const delay=slot/Math.max(1,count),leaveAt=delay*.1,boardAt=leaveAt+.08,lane=transitSeat(slot,count)[0]/1.35*.12,sourceAngle=Math.atan2(frame.direction[1],frame.direction[0])+lane;
 const sourcePort:Point=[from.position[0]+Math.cos(sourceAngle)*from.radius*.72,source[1],from.position[2]+Math.sin(sourceAngle)*from.radius*.72];
 if(f<leaveAt)return source;
 if(f<boardAt){const a=Math.atan2(start.z,start.x),delta=Math.atan2(Math.sin(sourceAngle-a),Math.cos(sourceAngle-a)),t=smooth((f-leaveAt)/.08),angle=a+delta*t,r=mix(Math.hypot(start.x,start.z),.72,t)*from.radius;return [from.position[0]+Math.cos(angle)*r,source[1],from.position[2]+Math.sin(angle)*r] as Point;}
 if(f<.25){const t=smooth((f-boardAt)/(.25-boardAt));return sourcePort.map((v,i)=>mix(v,seat[i],t)) as Point;}
 if(f<.82)return seat;
 const landAt=.82+delay*.06,portAt=.9+delay*.04,a=Math.atan2(-frame.direction[1],-frame.direction[0])+lane,targetPort:Point=[to.position[0]+Math.cos(a)*to.radius*.72,target[1],to.position[2]+Math.sin(a)*to.radius*.72];
 if(f<landAt)return seat;
 if(f<portAt){const t=smooth((f-landAt)/(portAt-landAt));return seat.map((v,i)=>mix(v,targetPort[i],t)) as Point;}
 const t=smooth((f-portAt)/(1-portAt)),b=Math.atan2(finish.z,finish.x),delta=Math.atan2(Math.sin(b-a),Math.cos(b-a)),angle=a+delta*t,r=mix(.72,Math.hypot(finish.x,finish.z),t)*to.radius;
 return [to.position[0]+Math.cos(angle)*r,target[1],to.position[2]+Math.sin(angle)*r] as Point;
}
