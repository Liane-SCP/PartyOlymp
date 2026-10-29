import fs from 'node:fs';
import {build} from 'esbuild';
import sharp from 'sharp';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/browser-game-engine.ts'],outfile:'outputs/browser-boss-engine.mjs',bundle:true,platform:'node',format:'esm'});
const {match}=await import('../outputs/browser-boss-engine.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const errors=[], metrics=[];
try{
 for(const kind of process.argv.slice(2).length?process.argv.slice(2):['colossus','kraken','dragon']){
  const m=match(kind,12);m.room.game.deadline=Date.now()-1;m.view();m.room.game.deadline=Date.now()+600000;
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
  await page.routeWebSocket('**/api/live',ws=>ws.close());
  await page.addInitScript(({id})=>{localStorage.setItem('olymp.session',JSON.stringify({code:'QA1234',playerId:id,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:false,intense:true}));},{id:m.first});
  await page.route('**/api/room',route=>route.fulfill({json:m.view()}));
  await page.goto('http://127.0.0.1:5173');
  await page.locator('.boss-scene-wrapper.is-ready').waitFor({timeout:60000});
  await page.waitForTimeout(1800);
  await page.screenshot({path:`outputs/qa/rig-${kind}.png`,fullPage:true});
  metrics.push(await page.locator('canvas.boss-scene-canvas').evaluate(el=>({...el.dataset})));
  if(process.env.BOSS_POSTERS==='1'){
   await page.addStyleTag({content:'.boss-arena > :not(.boss-scene-wrapper){visibility:hidden!important} .boss-scene-wrapper {visibility:visible!important}'});
   const bytes=await page.locator('canvas.boss-scene-canvas').screenshot();
   const size = await sharp(bytes).metadata();
   // Keep the creature and environment; player figures are always shown live below the arena.
   await sharp(bytes).extract({left:0,top:0,width:size.width,height:Math.floor(size.height*.74)}).webp({quality:86}).toFile(`public/boss-models/${kind}-poster.webp`);
  }
  await page.close();
 }
 console.log(JSON.stringify({metrics,errors},null,2));
 fs.writeFileSync('outputs/qa/boss-rigs.json',JSON.stringify({metrics,errors},null,2));
}finally{await browser.close();}
