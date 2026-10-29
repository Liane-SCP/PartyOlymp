import fs from 'node:fs';
import sharp from 'sharp';
const file = 'public/boss-models/kraken.glb';
const input = fs.readFileSync(file);
const jsonLength = input.readUInt32LE(12);
const doc = JSON.parse(input.subarray(20, 20 + jsonLength));
const binary = input.subarray(28 + jsonLength);
console.log(JSON.stringify({images:doc.images,animations:doc.animations.map(a=>({name:a.name,channels:a.channels.length})),skins:doc.skins.map(s=>s.joints.length)}));
const replacements = new Map();
for (const image of doc.images ?? []) {
  if (image.mimeType !== 'image/png' || /normal/i.test(image.name)) continue;
  const view = doc.bufferViews[image.bufferView];
  const converted = await sharp(binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)).jpeg({quality:93,chromaSubsampling:'4:4:4'}).toBuffer();
  if (converted.length < view.byteLength) { replacements.set(image.bufferView,converted); image.mimeType = 'image/jpeg'; }
}
const parts=[];let offset=0;
for (const [index,view] of doc.bufferViews.entries()) {
  const bytes = replacements.get(index) ?? binary.subarray(view.byteOffset ?? 0,(view.byteOffset ?? 0)+view.byteLength);
  view.byteOffset=offset;view.byteLength=bytes.length;parts.push(bytes);offset+=bytes.length;
  const padding=(4-offset%4)%4;if(padding){parts.push(Buffer.alloc(padding));offset+=padding;}
}
doc.buffers[0].byteLength=offset;
const raw=Buffer.from(JSON.stringify(doc)), json=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,32)]), bin=Buffer.concat(parts);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);
const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(bin.length);binHeader.writeUInt32LE(0x004e4942,4);
const output=Buffer.concat([header,json,binHeader,bin]);
if (output.length >= 25*1024*1024) throw new Error('Model exceeds asset hosting size');
fs.writeFileSync(file,output);
console.log(JSON.stringify({before:input.length,after:output.length,converted:replacements.size}));
