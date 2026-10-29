import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {prepareAuctionGavel} from './prepare-auction-gavel.mjs';
import {prepareBossHull} from './prepare-boss-hull.mjs';
import {prepareShipCannon} from './prepare-ship-cannon.mjs';
import {prepareTreasureChest} from './prepare-treasure-chest.mjs';
const packs={
 furniture:{format:'GLTF format',files:['tableRound','table','chairCushion','bookcaseOpen','books','lampRoundFloor','lampRoundTable','pottedPlant','rugRound','kitchenBar','kitchenFridge','stoolBar','cabinetBedDrawerTable','bear','computerScreen','computerKeyboard','desk','lampWall','bookcaseClosedWide']},
 food:{format:'GLB format',files:['apple','banana','bread','bottle-oil','carton','can-open','mug','cup','bag','pizza-box']},
 car:{format:'GLB format',files:['race','race-future','cone','box','wheel-racing']},
 nature:{format:'GLTF format',files:['tree_plateau','tree_small','rock_largeA','rock_largeC','plant_bush']},
 racing:{format:'GLTF format',files:['grandStandCovered','flagCheckers','tentLong','barrierRed']},
 factory:{format:'GLB format',files:['machine','pipe-large-valve','pipe-large-bend','pipe-large-long','cog-a','box-large','conveyor-bars-fence']},
 city:{format:'GLB format',source:'https://kenney.nl/assets/city-kit-suburban',files:['building-type-a','building-type-c','building-type-f','building-type-h']},
 watercraft:{format:'GLB format',source:'https://kenney.nl/assets/watercraft-kit',files:['ship-ocean-liner','cargo-container-a']},
 roads:{format:'GLB format',source:'https://kenney.nl/assets/city-kit-roads',files:['road-bridge']}
};
const assets=[];
for(const [pack,spec] of Object.entries(packs)){
 const root=path.join('outputs/asset-sources',pack),out=path.join('public/adventure-models',pack);await mkdir(out,{recursive:true});
 const license=await readFile(path.join(root,'License.txt'),'utf8');if(!license.includes('CC0'))throw Error(`License not verified: ${pack}`);
 await writeFile(path.join(out,'LICENSE.txt'),license);
 for(const name of spec.files){
  const source=path.join(root,'Models',spec.format,`${name}.glb`),buffer=await readFile(source);
  if(buffer.readUInt32LE(0)!==0x46546c67)throw Error(`Invalid GLB: ${source}`);
  const json=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
  const external=(json.images??[]).filter(x=>x.uri&&!x.uri.startsWith('data:'));
  for(const img of external){const dest=path.join(out,img.uri);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.join(root,'Models',spec.format,img.uri),dest);}
  await writeFile(path.join(out,`${name}.glb`),buffer);
  assets.push({id:`${pack}/${name}`,file:`/adventure-models/${pack}/${name}.glb`,author:'Kenney',source:spec.source??`https://kenney.nl/assets/${pack}-kit`,license:'CC0-1.0',sha256:createHash('sha256').update(buffer).digest('hex'),bytes:buffer.length,triangles:(json.meshes??[]).flatMap(m=>m.primitives).reduce((n,p)=>n+(json.accessors[p.indices??p.attributes.POSITION]?.count??0)/3,0),changes:'Curated original GLB; scale, placement and material roughness normalized at runtime. External palette textures preserved locally.'});
 }
}
assets.push(await prepareBossHull());
assets.push(await prepareShipCannon());
assets.push(await prepareTreasureChest());
assets.push(await prepareAuctionGavel());
const giraffeSource=JSON.parse(await readFile('outputs/asset-sources/animals/giraffe-source.json','utf8'));
if(giraffeSource.license!=='CC-BY-3.0'||giraffeSource.source!=='https://poly.pizza/m/80w8kwQU0QH')throw Error('Giraffe attribution not verified');
const giraffe=await readFile('outputs/asset-sources/animals/Giraffe.glb'),giraffeJson=JSON.parse(giraffe.subarray(20,20+giraffe.readUInt32LE(12)));
if(giraffe.readUInt32LE(0)!==0x46546c67||(giraffeJson.images??[]).some(i=>i.uri&&!i.uri.startsWith('data:')))throw Error('Giraffe must be a self-contained GLB');
await mkdir('public/adventure-models/animals',{recursive:true});
await writeFile('public/adventure-models/animals/giraffe.glb',giraffe);
await writeFile('public/adventure-models/animals/giraffe-source.json',JSON.stringify(giraffeSource,null,2)+'\n');
await writeFile('public/adventure-models/animals/LICENSE.txt',`"Giraffe" by ${giraffeSource.author}\nSource: ${giraffeSource.source}\nLicense: Creative Commons Attribution 3.0 Unported (${giraffeSource.licenseUrl})\nChanges: ${giraffeSource.changes}\n`);
assets.push({...giraffeSource,id:'animals/giraffe',file:'/adventure-models/animals/giraffe.glb',sha256:createHash('sha256').update(giraffe).digest('hex'),bytes:giraffe.length,triangles:giraffeJson.meshes.flatMap(m=>m.primitives).reduce((n,p)=>n+(giraffeJson.accessors[p.indices??p.attributes.POSITION]?.count??0)/3,0)});
await writeFile('public/adventure-models/manifest.json',JSON.stringify({version:1,assets},null,2)+'\n');
await import('./prepare-scene-preloads.mjs');
console.log(JSON.stringify({models:assets.length,bytes:assets.reduce((n,a)=>n+a.bytes,0),maxTriangles:Math.max(...assets.map(a=>a.triangles))}));


