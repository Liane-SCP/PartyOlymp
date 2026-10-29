import fs from 'node:fs';import assert from 'node:assert/strict';import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/browser-game-engine.ts'],outfile:'outputs/kraken-salvo-fixture.mjs',bundle:true,platform:'node',format:'esm'});const {match}=await import('../outputs/kraken-salvo-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']}),results=[],errors=[];
const reduced=process.env.SALVO_REDUCED==='1',counts=process.env.SALVO_COUNTS?.split(',').map(Number)??[2,12],widths=process.env.SALVO_WIDTHS?.split(',').map(Number)??[1440,390];
try{for(const count of counts)for(const width of widths){
 const m=match('kraken',count),g=m.room.game,ids=m.room.participantIds;g.deadline=Date.now()-1;m.view();g.deadline=Date.now()+600000;
 for(const [i,id]of ids.entries()){if(count>2&&i===count-1)continue;m.act(id,{type:'start',round:g.round+1});m.act(id,{type:'fire',round:g.round+1,elapsed:i===0?0:1020});}
 if(g.stage==='answer'){g.deadline=Date.now()-1;m.view();}assert.equal(g.stage,'roundReveal');g.deadline=Date.now()+600000;
 assert.equal(g.public.reveal.outcomes[0].score,0);assert.ok(g.public.reveal.outcomes[1].score>0);
 let cursor=0;const page=await browser.newPage({viewport:{width,height:width===390?844:1000}});page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket('**/api/live',s=>s.close());
 await page.addInitScript(({id,reduced})=>{localStorage.setItem('olymp.session',JSON.stringify({code:'QA1234',playerId:id,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:reduced,intense:true}));},{id:ids[0],reduced});
 await page.route('**/api/room',route=>{g.public.revealStartedAt=Date.now()-cursor;g.deadline=Date.now()+600000;return route.fulfill({json:m.view()});});
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')?.dataset.venueReady==='true',null,{timeout:60000});await page.getByRole('button',{name:'Welt ansehen',exact:true}).click();
 const canvas=page.locator('canvas.boss-scene-canvas'),snapshot=async()=>JSON.parse(await canvas.getAttribute('data-kraken-salvo'));
 await page.waitForFunction(()=>{const data=document.querySelector('canvas.boss-scene-canvas')?.dataset.krakenSalvo;return !!data&&JSON.parse(data).draws===0;});const initial=await snapshot();assert.equal(initial.draws,0);
 cursor=3480;
 if(!reduced){await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas').dataset.krakenSalvo).shots[0]?.flash,{},{timeout:15000});}else await page.waitForTimeout(600);
 const muzzle=await snapshot();assert.ok(muzzle.draws<=4);if(reduced)assert.equal(muzzle.draws,0);else{assert.equal(muzzle.shots[0].confirmed,true);assert.equal(muzzle.shots[0].hit,false);}
 const projectiles=JSON.parse(await canvas.getAttribute('data-kraken-projectiles'));if(!reduced){const first=projectiles.find(p=>p.id===ids[0]);assert.ok(first,'A zero-score confirmed shot has a visible projectile');assert.equal(first.end[1],.15);first.start.forEach((x,i)=>assert.ok(Math.abs(x-muzzle.shots[0].muzzle[i])<1e-5,'Projectile and flash share the actual moving muzzle'));}else assert.deepEqual(projectiles,[]);
 await page.screenshot({path:`outputs/qa/kraken-salvo-muzzle-${count}-${width}${reduced?'-reduced':''}.png`});
 cursor=4270;
 if(!reduced)await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas').dataset.krakenSalvo).shots[0]?.water,{},{timeout:15000});else await page.waitForTimeout(600);
 const water=await snapshot();if(!reduced){assert.equal(water.shots[0].target[1],.15);assert.equal(water.shots[1].hit,true);if(count>2)assert.equal(water.shots.at(-1).confirmed,false);}
 await page.screenshot({path:`outputs/qa/kraken-salvo-water-${count}-${width}${reduced?'-reduced':''}.png`});
 cursor=10500;await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas').dataset.krakenSalvo).draws===0);results.push({count,width,reduced,muzzle,projectiles,water,finished:await snapshot()});await page.close();console.log(`PASS salvo ${count}/${width}${reduced?' reduced':''}`);
}assert.deepEqual(errors,[]);fs.writeFileSync(`outputs/qa/kraken-salvo${reduced?'-reduced':''}.json`,JSON.stringify({results,errors,scope:'Confirmed real engine outcomes; coordinated HTTP fixture, SwiftShader visual/function check, muted; no live network or mobile GPU claim'},null,2));}finally{await browser.close();}
