import {geoCrewSeat} from './geo-presentation';
export type GeoView='crew'|'globe'|'desk';
type Point=[number,number,number];
function box(points:Point[],xs:number[],ys:number[],zs:number[]){for(const x of xs)for(const y of ys)for(const z of zs)points.push([x,y,z]);}

/** Fit physical interaction bounds below the heading and above the measured controls. */
export function geoCamera(width:number,height:number,count:number,index:number,requested:GeoView='crew',bottom=98){
 const view=requested==='desk'&&(index<0||index>=count)?'crew':requested,w=Math.max(1,width),h=Math.max(1,height),top=view==='crew'?106:80,lower=Math.min(Math.max(76,bottom),h*.4),upper=Math.min(top,h*.3),safe=Math.max(.2,1-(upper+lower)/h),high=1-2*upper/h,low=-1+2*lower/h;
 const points:Point[]=[],seat=geoCrewSeat(Math.max(0,index),count),center:Point=view==='globe'?[-5,4.1,0]:view==='desk'?[seat[0],1.7,seat[2]-.35]:[0,3.7,1.2],yaw=view==='desk'?Math.PI:0,pitch=view==='globe'?.12:view==='desk'?.7:.4;
 if(view==='globe')box(points,[-8.6,-1.4],[.5,7.7],[-3.6,3.6]);
 else if(view==='desk'){box(points,[seat[0]-1.4,seat[0]+1.4],[1.08,1.32],[seat[2]-1.28,seat[2]-.03]);box(points,[seat[0]-.72,seat[0]+.72],[1.1,2.6],[seat[2]-.5,seat[2]+.5]);}
 else{box(points,[-8.6,-1.4],[.5,7.7],[-3.6,3.6]);box(points,[.65,9.75],[1.6,8.3],[-4.65,-4.2]);box(points,[-2.3,7.8],[1,1.5],[2.2,4.6]);for(let i=0;i<count;i++){const s=geoCrewSeat(i,count);box(points,[s[0]-1.4,s[0]+1.4],[1.08,2.6],[s[2]-1.3,s[2]+.6]);}}
 const direction=view==='desk'?-1:1,axis=[0,Math.sin(pitch),direction*Math.cos(pitch)],up=[0,Math.cos(pitch),-direction*Math.sin(pitch)],tan=Math.tan(21*Math.PI/180),horizontal=Math.max(.25,1-32/w),shift=(upper-lower)/h;let distance=2;
 for(const p of points){const v=p.map((n,i)=>n-center[i]),along=v[1]*axis[1]+v[2]*axis[2],vertical=v[1]*up[1]+v[2]*up[2];distance=Math.max(distance,along+Math.abs(v[0])/(tan*(w/h)*horizontal),(vertical/tan+high*along)/safe,(-vertical/tan-low*along)/safe);}
 distance+=.35;const offset=distance*tan*shift,target=center.map((n,i)=>n+up[i]*offset) as Point;
 return {view,target,yaw,pitch,distance,points,safe:{left:16,right:w-16,top:upper,bottom:h-lower}};
}
