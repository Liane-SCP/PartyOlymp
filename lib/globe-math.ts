export interface GlobePin {lat:number;lon:number}
export interface GlobeVector {x:number;y:number;z:number}
const rad=Math.PI/180;
/** Matches Three SphereGeometry and the equirectangular country texture exactly. */
export function globePoint(pin:GlobePin,radius=1):GlobeVector{
 const lat=pin.lat*rad,lon=pin.lon*rad;return {x:Math.cos(lat)*Math.cos(lon)*radius,y:Math.sin(lat)*radius,z:-Math.cos(lat)*Math.sin(lon)*radius};
}
export function globeLocation(point:GlobeVector):GlobePin{
 const length=Math.hypot(point.x,point.y,point.z);return {lat:Math.asin(Math.max(-1,Math.min(1,point.y/(length||1))))/rad,lon:Math.atan2(-point.z,point.x)/rad};
}
/** A stable shortest great circle, including coincident and antipodal endpoints. */
export function globeRoute(a:GlobePin,b:GlobePin,progress:number,radius=1):GlobeVector{
 const p=globePoint(a),q=globePoint(b),dot=Math.max(-1,Math.min(1,p.x*q.x+p.y*q.y+p.z*q.z)),angle=Math.acos(dot),t=Math.max(0,Math.min(1,progress));
 let x:number,y:number,z:number;
 if(angle<1e-7){x=p.x;y=p.y;z=p.z;}
 else if(Math.PI-angle<1e-6){const up=Math.abs(p.y)<.9?{x:0,y:1,z:0}:{x:1,y:0,z:0},cx=p.y*up.z-p.z*up.y,cy=p.z*up.x-p.x*up.z,cz=p.x*up.y-p.y*up.x,length=Math.hypot(cx,cy,cz),c=Math.cos(Math.PI*t),s=Math.sin(Math.PI*t);x=p.x*c+cx/length*s;y=p.y*c+cy/length*s;z=p.z*c+cz/length*s;}
 else{const v=Math.sin((1-t)*angle)/Math.sin(angle),w=Math.sin(t*angle)/Math.sin(angle);x=p.x*v+q.x*w;y=p.y*v+q.y*w;z=p.z*v+q.z*w;}
 return {x:x*radius,y:y*radius,z:z*radius};
}
