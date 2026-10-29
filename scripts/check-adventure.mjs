import fs from 'node:fs';import * as T from 'three';import assert from 'node:assert/strict';import {build} from 'esbuild';import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/adventure-browser-engine.mjs',bundle:true,platform:'node',format:'esm'});const {ids,fixture}=await import('../outputs/adventure-browser-engine.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}),errors=[];fs.mkdirSync('outputs/qa',{recursive:true});
try{
for(const width of[1440,390])for(const id of ids.filter(id=>!['colossus','kraken','dragon'].includes(id)&&(!process.env.GAMES||process.env.GAMES.split(',').includes(id)))){const m=fixture(id,Number(process.env.PLAYERS)||(width===1440?3:2)),actions=[];
const page=await browser.newPage({viewport:{width,height:1100}});page.on('pageerror',e=>errors.push(`${width}/${id}: ${e.message}`));await page.routeWebSocket('**/api/live',ws=>ws.close());await page.addInitScript(pid=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,intense:true}));},m.first);
await page.route('**/api/room',route=>{const b=route.request().postDataJSON();if(b.type==='action'){actions.push(b.action);try{m.act(b.action);}catch(e){console.log('action rejected',id,e.message);return route.fulfill({status:400,json:{error:e.message}});}}return route.fulfill({json:m.view()});});
await page.goto('http://127.0.0.1:5173');await page.locator('.adventure-ready').waitFor();await page.locator('.adventure-stage').scrollIntoViewIfNeeded();await page.waitForFunction(n=>Number(document.querySelector('.adventure-canvas canvas')?.dataset.readyAvatars)===n,Number(process.env.PLAYERS)||(width===1440?3:2));
const canvas=page.locator('.adventure-canvas canvas');assert.equal(await canvas.getAttribute('data-stage'),id);assert.ok(Number(await canvas.getAttribute('data-draw-calls'))<280,`${id}: draw budget`);
const camera=await canvas.getAttribute('data-camera');const rect=await canvas.boundingBox();await page.mouse.move(rect.x+rect.width*.12,rect.y+rect.height*.25);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.12+50,rect.y+rect.height*.25+10,{steps:5});await page.mouse.up();await page.waitForFunction(previous=>document.querySelector('.adventure-canvas canvas')?.dataset.camera!==previous,camera);assert.notEqual(await canvas.getAttribute('data-camera'),camera);await page.getByRole('button',{name:'Bühnenkamera zurücksetzen',exact:true}).click();
await page.locator('.adventure-stage').screenshot({path:`outputs/qa/adventure-${width}-${id}.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${id}: overflow`);
if(id==='dice'){await page.getByRole('button',{name:'Erster Wurf →',exact:true}).click();await page.waitForTimeout(200);assert.ok(actions.some(a=>a.type==='game'&&a.action?.type==='roll'));}
if(id==='color'){m.room.game.public.previewUntil=Date.now()-1;await page.waitForTimeout(900);const slider=page.getByRole('slider').first();await slider.fill('210');}
await page.screenshot({path:`outputs/qa/adventure-page-${width}-${id}.png`});console.log(`${width} ${id}: scene, avatars, camera and controls passed`);await page.close();
}
assert.deepEqual(errors,[]);
}finally{await browser.close();}

