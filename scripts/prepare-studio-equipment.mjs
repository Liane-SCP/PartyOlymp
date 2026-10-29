import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import {Color} from 'three';
const sources=JSON.parse(await fs.readFile('assets/source-models/studio/sources.json','utf8')),path='public/adventure-models/manifest.json',manifest=JSON.parse(await fs.readFile(path,'utf8')),credits=[];
for(const source of sources){
 if(![['spotlight','CC0-1.0','https://poly.pizza/m/Thhuwj9HCg'],['camera','CC-BY-3.0','https://poly.pizza/m/3-paG1j-iYS']].some(([name,license,url])=>source.name===name&&source.license===license&&source.source===url))throw Error('Unverified equipment source');
 const original=await fs.readFile(`assets/source-models/studio/${source.name}.glb`),length=original.readUInt32LE(12),j=JSON.parse(original.subarray(20,20+length));
 if(original.readUInt32LE(0)!==0x46546c67||original.readUInt32LE(8)!==original.length||j.buffers.some(b=>b.uri)||j.images?.some(i=>i.uri)||j.animations?.length)throw Error('Equipment must be self-contained and still');
 let data=original;
 if(source.name==='camera'){
  if(j.materials.length!==2)throw Error('Camera palette changed');
  for(const[i,m]of j.materials.entries()){m.pbrMetallicRoughness.baseColorFactor=[...new Color(i?'#263441':'#526e82').toArray(),1];m.pbrMetallicRoughness.roughnessFactor=.82;m.pbrMetallicRoughness.metallicFactor=.05;}
  const json=Buffer.from(JSON.stringify(j)),chunk=Buffer.alloc(Math.ceil(json.length/4)*4,0x20);json.copy(chunk);const rest=original.subarray(20+length);data=Buffer.alloc(20+chunk.length+rest.length);original.copy(data,0,0,20);data.writeUInt32LE(data.length,8);data.writeUInt32LE(chunk.length,12);chunk.copy(data,20);rest.copy(data,20+chunk.length);
 }
 const triangles=j.meshes.reduce((n,m)=>n+m.primitives.reduce((n,p)=>{if(p.mode!==undefined&&p.mode!==4)throw Error('Unexpected topology');return n+j.accessors[p.indices].count/3;},0),0),entry={...source,file:`/adventure-models/${source.id}.glb`,bytes:data.length,triangles,sourceSha256:createHash('sha256').update(original).digest('hex'),sha256:createHash('sha256').update(data).digest('hex')};
 await fs.writeFile(`public${entry.file}`,data);manifest.assets=manifest.assets.filter(a=>a.id!==source.id);manifest.assets.push(entry);
 const text=`${source.title} by ${source.author}\nSource: ${source.source}\nDownload: ${source.download}\nLicense: ${source.license} — ${source.licenseUrl}\nVerified: ${source.verified}\nChanges: ${source.changes}\nSource SHA-256: ${entry.sourceSha256}\nPrepared SHA-256: ${entry.sha256}\n`;
 await fs.writeFile(`public/adventure-models/props/studio-${source.name}-LICENSE.txt`,text);credits.push(text);console.log(JSON.stringify({id:entry.id,bytes:entry.bytes,triangles}));
}
await fs.writeFile(path,JSON.stringify(manifest,null,2)+'\n');await fs.writeFile('assets/source-models/studio/LICENSE.txt',credits.join('\n'));
