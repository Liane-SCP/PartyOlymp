// Offline planar subtraction: retain the first authored surface where faces overlap.
// Interpolate every attribute at new edges; runtime geometry needs no depth bias.
const EPS=1e-7;
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const lerp=(a,b,t)=>Object.fromEntries(Object.keys(a).map(key=>[key,a[key].map((x,i)=>x+(b[key][i]-x)*t)]));
function area(poly,axis){let s=0;const axes=[0,1,2].filter(i=>i!==axis);for(let i=0;i<poly.length;i++){const a=poly[i].POSITION,b=poly[(i+1)%poly.length].POSITION;s+=a[axes[0]]*b[axes[1]]-a[axes[1]]*b[axes[0]];}return s/2;}
function half(poly,a,b,axis,inside){
 const axes=[0,1,2].filter(i=>i!==axis),[x,y]=axes;
 const side=v=>(b[x]-a[x])*(v.POSITION[y]-a[y])-(b[y]-a[y])*(v.POSITION[x]-a[x]);
 const output=[];let previous=poly.at(-1),pd=side(previous),pi=inside?pd>=-EPS:pd<=EPS;
 for(const current of poly){const cd=side(current),ci=inside?cd>=-EPS:cd<=EPS;
  if(ci!==pi){const t=Math.max(0,Math.min(1,pd/(pd-cd)));output.push(lerp(previous,current,t));}
  if(ci)output.push(current);previous=current;pd=cd;pi=ci;
 }
 return output;
}
function subtract(poly,occluder,axis){
 if(area(occluder,axis)<0)occluder=[...occluder].reverse();
 let intersection=poly;
 for(let i=0;i<occluder.length&&intersection.length>=3;i++)intersection=half(intersection,occluder[i].POSITION,occluder[(i+1)%occluder.length].POSITION,axis,true);
 if(intersection.length<3||Math.abs(area(intersection,axis))<1e-10)return [poly];
 const fragments=[];let remaining=poly;
 for(let i=0;i<occluder.length&&remaining.length>=3;i++){
  const a=occluder[i].POSITION,b=occluder[(i+1)%occluder.length].POSITION;
  const outside=half(remaining,a,b,axis,false);
  if(outside.length>=3&&Math.abs(area(outside,axis))>1e-10)fragments.push(outside);
  remaining=half(remaining,a,b,axis,true);
 }
 return fragments;
}
export function resolveHullSurfaces(triangles){
 const planes=[],output=[];let affected=0;
 for(const triangle of triangles){
  const p=triangle.map(v=>v.POSITION),n=cross(sub(p[1],p[0]),sub(p[2],p[0])),length=Math.hypot(...n);
  if(length<1e-9)continue;for(let i=0;i<3;i++)n[i]/=length;
  const axis=[0,1,2].sort((a,b)=>Math.abs(n[b])-Math.abs(n[a]))[0];if(n[axis]<0)for(let i=0;i<3;i++)n[i]=-n[i];
  const d=dot(n,p[0]);let plane=planes.find(g=>dot(n,g.normal)>1-1e-10&&Math.abs(d-g.distance)<2e-6);
  if(!plane){plane={normal:n,distance:d,axis,triangles:[]};planes.push(plane);}
  let fragments=[triangle];
  for(const occupied of plane.triangles){fragments=fragments.flatMap(poly=>subtract(poly,occupied,axis));if(!fragments.length)break;}
  const originalArea=Math.abs(area(triangle,axis)),remainingArea=fragments.reduce((s,p)=>s+Math.abs(area(p,axis)),0);
  if(remainingArea<originalArea-1e-8)affected++;
  for(const polygon of fragments)for(let i=1;i+1<polygon.length;i++){
   const tri=[polygon[0],polygon[i],polygon[i+1]];
   if(Math.abs(area(tri,axis))>1e-10)output.push(tri);
  }
  // Using original triangles represents the exact same occupied union and avoids
  // accumulating the triangulation fragments in subsequent clipping passes.
  plane.triangles.push(triangle);
 }
 return {triangles:output,affected};
}
