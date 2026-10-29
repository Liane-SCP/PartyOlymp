import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const source=JSON.parse(await fs.readFile('assets/source-models/vault/gear-source.json','utf8'));
if(source.source!=='https://poly.pizza/m/1tgrqxAQia'||source.license!=='CC0-1.0')throw Error('Unverified gear source');
const original=await fs.readFile('assets/source-models/vault/gear.glb'),length=original.readUInt32LE(12),json=JSON.parse(original.subarray(20,20+length));
if(original.readUInt32LE(0)!==0x46546c67||original.readUInt32LE(8)!==original.length||json.buffers.some(b=>b.uri)||json.images?.length||json.animations?.length)throw Error('Unexpected gear source');
const gltf=await new GLTFLoader().parseAsync(original.buffer.slice(original.byteOffset,original.byteOffset+original.length),'');gltf.scene.updateMatrixWorld(true);
const planes=new Map();let triangles=0;
gltf.scene.traverse(o=>{if(!(o instanceof T.Mesh))return;const geometry=o.geometry,p=geometry.attributes.position,indices=geometry.index;if(!indices)throw Error('Expected indexed gear');for(let i=0;i<indices.count;i+=3){triangles++;const a=new T.Vector3().fromBufferAttribute(p,indices.getX(i)).applyMatrix4(o.matrixWorld),b=new T.Vector3().fromBufferAttribute(p,indices.getX(i+1)).applyMatrix4(o.matrixWorld),c=new T.Vector3().fromBufferAttribute(p,indices.getX(i+2)).applyMatrix4(o.matrixWorld),n=b.sub(a).cross(c.sub(a)),area=n.length()/2;n.normalize();if(n.z<0)n.negate();const key=n.toArray().map(v=>v.toFixed(3)).join(),row=planes.get(key)??{normal:n.clone(),area:0};row.area+=area;planes.set(key,row);}});
const normal=[...planes.values()].sort((a,b)=>b.area-a.area)[0].normal,rotation=new T.Quaternion().setFromUnitVectors(normal,new T.Vector3(0,0,1));
const roots=json.scenes[json.scene??0].nodes;json.nodes.push({name:'front-aligned-gear',rotation:rotation.toArray(),children:roots});json.scenes[json.scene??0].nodes=[json.nodes.length-1];json.asset.generator+='; Olymparty front-aligned gear root';
const text=Buffer.from(JSON.stringify(json)),chunk=Buffer.alloc(Math.ceil(text.length/4)*4,0x20);text.copy(chunk);const remainder=original.subarray(20+length),result=Buffer.alloc(20+chunk.length+remainder.length);original.copy(result,0,0,20);result.writeUInt32LE(result.length,8);result.writeUInt32LE(chunk.length,12);chunk.copy(result,20);remainder.copy(result,20+chunk.length);
const entry={...source,id:'props/vault-gear',file:'/adventure-models/props/vault-gear.glb',bytes:result.length,triangles,sourceSha256:createHash('sha256').update(original).digest('hex'),sha256:createHash('sha256').update(result).digest('hex'),frontNormal:normal.toArray(),rootRotation:rotation.toArray()};
await fs.writeFile(`public${entry.file}`,result);const manifestPath='public/adventure-models/manifest.json',manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));manifest.assets=manifest.assets.filter(a=>a.id!==entry.id);manifest.assets.push(entry);await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
const credit=`${source.title} by ${source.author}\nSource: ${source.source}\nDownload: ${source.download}\nLicense: CC0 1.0 — ${source.licenseUrl}\nVerified: ${source.verified}\nChanges: ${source.changes}\nSource SHA-256: ${entry.sourceSha256}\nPrepared SHA-256: ${entry.sha256}\n`;
await fs.writeFile('assets/source-models/vault/LICENSE.txt',credit);await fs.writeFile('public/adventure-models/props/vault-gear-LICENSE.txt',credit);
console.log(JSON.stringify({id:entry.id,bytes:entry.bytes,triangles,frontNormal:entry.frontNormal}));
