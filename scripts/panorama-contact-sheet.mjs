import sharp from 'sharp';
import fs from 'node:fs/promises';
const photos=JSON.parse(await fs.readFile('lib/game/data/world-panoramas.json'));
const cells=await Promise.all(photos.map(async(p,i)=>({input:await sharp('public'+p.image).resize(250,125).extend({bottom:25,background:'#fff'}).composite([{input:Buffer.from(`<svg width="250" height="25"><text x="8" y="19" font-size="16">${p.id}</text></svg>`),top:125,left:0}]).png().toBuffer(),left:i%5*250,top:Math.floor(i/5)*150})));
await sharp({create:{width:1250,height:Math.ceil(photos.length/5)*150,channels:3,background:'#fff'}}).composite(cells).png().toFile('outputs/qa/panorama-sheet.png');
