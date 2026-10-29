import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolveHullSurfaces} from './lib/resolve-hull-surfaces.mjs';

/** Retain the authored hull/deck and palette; omit sails and high superstructure. */
export async function prepareBossHull(){
 const source='assets/source-models/watercraft',metadata=JSON.parse(await readFile(`${source}/hull-source.json`,'utf8')),license=await readFile(`${source}/LICENSE.txt`,'utf8'),buffer=await readFile(`${source}/ship-large.glb`),palette=await readFile(`${source}/Textures/colormap.png`);
 const sha=b=>createHash('sha256').update(b).digest('hex');
 if(metadata.source!=='https://kenney.nl/assets/watercraft-kit'||metadata.license!=='CC0-1.0'||!license.includes('CC0')||sha(buffer)!==metadata.sourceSha256||sha(palette)!==metadata.paletteSha256)throw Error('Hull source or license mismatch');
 const jsonLength=buffer.readUInt32LE(12),original=JSON.parse(buffer.subarray(20,20+jsonLength)),binary=buffer.subarray(28+jsonLength),primitive=original.meshes[0].primitives[0];
 function read(index){const accessor=original.accessors[index],view=original.bufferViews[accessor.bufferView],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[accessor.type],bytes={5126:4,5123:2,5125:4}[accessor.componentType],offset=(view.byteOffset??0)+(accessor.byteOffset??0);if(!size||!bytes)throw Error('Unsupported hull accessor');return Array.from({length:accessor.count},(_,i)=>Array.from({length:size},(_,c)=>{const at=offset+i*(view.byteStride??size*bytes)+c*bytes;return accessor.componentType===5126?binary.readFloatLE(at):accessor.componentType===5123?binary.readUInt16LE(at):binary.readUInt32LE(at);}));}
 const rows=Object.fromEntries(Object.entries(primitive.attributes).map(([key,index])=>[key,read(index)])),indices=read(primitive.indices).flat(),used=new Map(),vertices=[],kept=[],cut=2.45,cropped=[];
 function lerp(a,b,t){return Object.fromEntries(Object.keys(rows).map(key=>[key,a[key].map((value,c)=>value+(b[key][c]-value)*t)]));}
 for(let i=0;i<indices.length;i+=3){const polygon=indices.slice(i,i+3).map(index=>Object.fromEntries(Object.keys(rows).map(key=>[key,rows[key][index]]))),clipped=[];let previous=polygon.at(-1),wasInside=previous.POSITION[1]<=cut;
  for(const current of polygon){const inside=current.POSITION[1]<=cut;if(inside!==wasInside)clipped.push(lerp(previous,current,(cut-previous.POSITION[1])/(current.POSITION[1]-previous.POSITION[1])));if(inside)clipped.push(current);previous=current;wasInside=inside;}
  for(let j=1;j+1<clipped.length;j++)cropped.push([clipped[0],clipped[j],clipped[j+1]]);
 }
 const resolved=resolveHullSurfaces(cropped);
 for(const triangle of resolved.triangles){
  const chosen=triangle.map(vertex=>Object.fromEntries(Object.entries(vertex).map(([key,values])=>[key,values.map(Math.fround)]))),[a,b,c]=chosen.map(v=>v.POSITION),u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);
  if(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])<1e-9)continue;
  for(const vertex of chosen){const key=JSON.stringify(vertex);if(!used.has(key)){used.set(key,vertices.length);vertices.push(vertex);}kept.push(used.get(key));}
 }
 if(kept.length<300)throw Error('Unexpected hull crop');
 const parts=[],views=[],accessors=[];let length=0;
 function append(data,type,componentType,count,min,max){const padded=Buffer.alloc(Math.ceil(data.length/4)*4);data.copy(padded);views.push({buffer:0,byteOffset:length,byteLength:data.length});parts.push(padded);length+=padded.length;accessors.push({bufferView:views.length-1,componentType,count,type,...(min?{min,max}:{})});return accessors.length-1;}
 const attributes={};
 for(const [name,index]of Object.entries(primitive.attributes)){const old=original.accessors[index],chosen=vertices.map(vertex=>vertex[name]),data=Buffer.alloc(chosen.length*chosen[0].length*4);chosen.flat().forEach((value,i)=>data.writeFloatLE(value,i*4));const min=chosen[0].map((_,c)=>Math.min(...chosen.map(row=>row[c]))),max=chosen[0].map((_,c)=>Math.max(...chosen.map(row=>row[c])));attributes[name]=append(data,old.type,5126,chosen.length,name==='POSITION'?min:undefined,name==='POSITION'?max:undefined);}
 const indexData=Buffer.alloc(kept.length*2);kept.forEach((value,i)=>indexData.writeUInt16LE(value,i*2));const index=append(indexData,'SCALAR',5123,kept.length);
 const json={asset:{version:'2.0',generator:'Olymparty hull curation from Kenney Watercraft Kit 2.1'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'authored-ship-hull',mesh:0}],meshes:[{name:'authored-ship-hull',primitives:[{attributes,indices:index,material:0}]}],accessors,bufferViews:views,buffers:[{byteLength:length}],materials:original.materials,images:original.images,textures:original.textures,samplers:original.samplers,extensionsUsed:original.extensionsUsed};
 const text=Buffer.from(JSON.stringify(json)),jsonChunk=Buffer.alloc(Math.ceil(text.length/4)*4,0x20);text.copy(jsonChunk);const bin=Buffer.concat(parts),result=Buffer.alloc(12+8+jsonChunk.length+8+bin.length);result.writeUInt32LE(0x46546c67,0);result.writeUInt32LE(2,4);result.writeUInt32LE(result.length,8);result.writeUInt32LE(jsonChunk.length,12);result.writeUInt32LE(0x4e4f534a,16);jsonChunk.copy(result,20);const at=20+jsonChunk.length;result.writeUInt32LE(bin.length,at);result.writeUInt32LE(0x004e4942,at+4);bin.copy(result,at+8);
 await mkdir('public/adventure-models/watercraft/Textures',{recursive:true});await writeFile('public/adventure-models/watercraft/ship-hull.glb',result);await copyFile(`${source}/Textures/colormap.png`,'public/adventure-models/watercraft/Textures/colormap.png');
 const entry={...metadata,id:'watercraft/ship-hull',file:'/adventure-models/watercraft/ship-hull.glb',sha256:sha(result),bytes:result.length,triangles:kept.length/3,surfaceRepair:{croppedTriangles:cropped.length,affectedTriangles:resolved.affected},changes:'Derived from ship-large: sails/flags removed; clipped at Y=2.45; coplanar overlapping faces resolved by planar subtraction, retaining the first authored surface and interpolating attributes at new boundaries. Lower hull/deck silhouette, normal directions, UV field, palette and material retained. Native main deck Y=2.1.'};
 await writeFile('public/adventure-models/watercraft/ship-hull-source.json',JSON.stringify(entry,null,2)+'\n');await copyFile(`${source}/LICENSE.txt`,'public/adventure-models/watercraft/ship-hull-LICENSE.txt');
 return entry;
}
