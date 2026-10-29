import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Vector3} from 'three';
import {prepareBossHull} from './prepare-boss-hull.mjs';

function mesh(file){
 const b=fs.readFileSync(file),n=b.readUInt32LE(12),json=JSON.parse(b.subarray(20,20+n)),bin=b.subarray(28+n),primitive=json.meshes[0].primitives[0];
 function read(index){const a=json.accessors[index],v=json.bufferViews[a.bufferView],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],bytes=a.componentType===5126?4:2;return Array.from({length:a.count},(_,i)=>Array.from({length:size},(_,c)=>{const at=(v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??size*bytes)+c*bytes;return a.componentType===5126?bin.readFloatLE(at):bin.readUInt16LE(at);}));}
 const rows=Object.fromEntries(Object.entries(primitive.attributes).map(([key,index])=>[key,read(index)])),indices=read(primitive.indices).flat();
 return {b,json,triangles:Array.from({length:indices.length/3},(_,i)=>indices.slice(i*3,i*3+3).map(index=>Object.fromEntries(Object.entries(rows).map(([key,values])=>[key,values[index]]))))};
}
const derived=mesh('public/adventure-models/watercraft/ship-hull.glb'),source=mesh('assets/source-models/watercraft/ship-large.glb');
function plane(triangle){const points=triangle.map(v=>new Vector3(...v.POSITION)),n=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));if(n.length()<1e-9)return null;n.normalize();const axis=[0,1,2].sort((a,b)=>Math.abs(n.getComponent(b))-Math.abs(n.getComponent(a)))[0];if(n.getComponent(axis)<0)n.negate();return {normal:n,distance:n.dot(points[0]),axis};}
function area(points){return points.reduce((s,p,i)=>{const next=points[(i+1)%points.length];return s+p[0]*next[1]-p[1]*next[0];},0)/2;}
function overlap(a,b,axis){
 const project=t=>t.map(v=>v.POSITION.filter((_,i)=>i!==axis));let poly=project(a),boundary=project(b);if(area(boundary)<0)boundary.reverse();
 for(let i=0;i<3&&poly.length;i++){const a=boundary[i],b=boundary[(i+1)%3],side=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]),next=[];let p=poly.at(-1),pd=side(p);for(const q of poly){const qd=side(q);if((qd>=0)!==(pd>=0)){const t=pd/(pd-qd);next.push(p.map((x,k)=>x+(q[k]-x)*t));}if(qd>=0)next.push(q);p=q;pd=qd;}poly=next;}
 return Math.abs(area(poly));
}
function barycentric(point,t){
 const [a,b,c]=t.map(v=>new Vector3(...v.POSITION)),p=new Vector3(...point),v0=c.clone().sub(a),v1=b.clone().sub(a),v2=p.sub(a),normal=v0.clone().cross(v1);
 if(normal.length()<1e-9||Math.abs(normal.clone().normalize().dot(v2))>3e-6)return null;
 const d00=v0.dot(v0),d01=v0.dot(v1),d11=v1.dot(v1),d20=v2.dot(v0),d21=v2.dot(v1),den=d00*d11-d01*d01;
 const u=(d11*d20-d01*d21)/den,v=(d00*d21-d01*d20)/den,w=1-u-v;
 return Math.min(u,v,w)>=-2e-5?[w,v,u]:null;
}
test('Repaired hull is licensed, source-bound, reproducible and registered',async()=>{
 const metadata=JSON.parse(fs.readFileSync('assets/source-models/watercraft/hull-source.json')),hash=b=>createHash('sha256').update(b).digest('hex');
 assert.equal(metadata.sourceSha256,hash(source.b));assert.equal(metadata.paletteSha256,hash(fs.readFileSync('assets/source-models/watercraft/Textures/colormap.png')));assert.match(fs.readFileSync('assets/source-models/watercraft/LICENSE.txt','utf8'),/CC0/);
 const entry=await prepareBossHull();assert.equal(hash(derived.b),entry.sha256);assert.deepEqual(fs.readFileSync('public/adventure-models/watercraft/ship-hull.glb'),derived.b);
 assert.deepEqual(JSON.parse(fs.readFileSync('public/adventure-models/manifest.json')).assets.find(a=>a.id===entry.id),entry);assert.ok(entry.bytes<65000);assert.ok(entry.triangles<900);assert.ok(entry.surfaceRepair.affectedTriangles>0);
});
test('No non-degenerate coplanar hull surfaces overlap with positive area',()=>{
 const triangles=derived.triangles.map(t=>({t,p:plane(t)}));assert.ok(triangles.every(r=>r.p));
 for(let i=0;i<triangles.length;i++)for(let k=i+1;k<triangles.length;k++){
  const a=triangles[i],b=triangles[k];if(a.p.normal.dot(b.p.normal)<1-1e-10||Math.abs(a.p.distance-b.p.distance)>2e-6)continue;
  assert.ok(overlap(a.t,b.t,a.p.axis)<2e-6,`Overlapping triangles ${i}/${k}`);
 }
});
test('Hull silhouette, covered surfaces and authored attribute fields survive subtraction',()=>{
 // Each new triangle must lie on one source face with that face's UVs/normals.
 for(const t of derived.triangles){assert.ok(t.every(v=>v.POSITION[1]<=2.45001));
  assert.ok(source.triangles.some(original=>t.every(v=>{const weights=barycentric(v.POSITION,original);return weights&&['NORMAL','TEXCOORD_0'].every(key=>v[key].every((x,c)=>Math.abs(x-weights.reduce((s,w,i)=>s+w*original[i][key][c],0))<3e-5));})),'New triangle must retain a source attribute field');
 }
 // Sample every original retained triangle's interior and visible cut boundary.
 // This checks coverage independently of the subtraction implementation.
 const lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
 for(const original of source.triangles){const clipped=[];let previous=original.at(-1).POSITION;for(const v of original){const current=v.POSITION;if((current[1]<=2.45)!==(previous[1]<=2.45))clipped.push(lerp(previous,current,(2.45-previous[1])/(current[1]-previous[1])));if(current[1]<=2.45)clipped.push(current);previous=current;}
  if(clipped.length<3)continue;
  for(let i=1;i+1<clipped.length;i++){const tri=[clipped[0],clipped[i],clipped[i+1]];if(!plane(tri.map(POSITION=>({POSITION}))))continue;for(const w of[[1/3,1/3,1/3],[.8,.1,.1],[.1,.8,.1],[.1,.1,.8]]){const point=[0,1,2].map(c=>w.reduce((s,x,k)=>s+x*tri[k][c],0));assert.ok(derived.triangles.some(t=>barycentric(point,t)),'A previously covered point became a hole');}}
 }
});
