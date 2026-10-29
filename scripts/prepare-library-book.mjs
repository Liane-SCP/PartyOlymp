import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
const source=JSON.parse(await fs.readFile('assets/source-models/library/open-book-source.json','utf8'));
if(source.source!=='https://poly.pizza/m/FsCIGEfTEs'||source.license!=='CC0-1.0')throw Error('Unverified book source');
const data=await fs.readFile('assets/source-models/library/open-book.glb'),j=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)));
if(data.readUInt32LE(0)!==0x46546c67||data.readUInt32LE(8)!==data.length||j.buffers.some(b=>b.uri)||j.images?.length||j.animations?.length)throw Error('Book must be self-contained and still');
const triangles=j.meshes.reduce((n,m)=>n+m.primitives.reduce((n,p)=>n+j.accessors[p.indices].count/3,0),0),entry={...source,id:'props/library-open-book',file:'/adventure-models/props/library-open-book.glb',bytes:data.length,triangles,sha256:createHash('sha256').update(data).digest('hex')};
await fs.writeFile(`public${entry.file}`,data);const path='public/adventure-models/manifest.json',manifest=JSON.parse(await fs.readFile(path,'utf8'));manifest.assets=manifest.assets.filter(a=>a.id!==entry.id);manifest.assets.push(entry);await fs.writeFile(path,JSON.stringify(manifest,null,2)+'\n');
const credit=`${source.title} by ${source.author}\nSource: ${source.source}\nDownload: ${source.download}\nLicense: CC0 1.0 — ${source.licenseUrl}\nVerified: ${source.verified}\nChanges: ${source.changes}\nSHA-256: ${entry.sha256}\n`;
await fs.writeFile('assets/source-models/library/LICENSE.txt',credit);await fs.writeFile('public/adventure-models/props/library-open-book-LICENSE.txt',credit);console.log(JSON.stringify({id:entry.id,bytes:entry.bytes,triangles}));
