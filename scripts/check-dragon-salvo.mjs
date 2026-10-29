import fs from 'node:fs';import assert from 'node:assert/strict';import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/browser-game-engine.ts'],outfile:'outputs/dragon-salvo-fixture.mjs',bundle:true,platform:'node',format:'esm'});const {match}=await import('../outputs/dragon-salvo-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-webgl']}),results=[],errors=[];
const configs=[{count:2,width:1440},{count:2,width:320},{count:12,width:1440},{count:12,width:390},{count:12,width:390,reduced:true}];
try{for(const {count,width,reduced=false}of configs){
 const m=match('dragon',count),g=m.room.game,ids=m.room.participantIds;g.deadline=Date.now()-1;m.view();g.deadline=Date.now()+600000;
 let cursor=0;const page=await browser.newPage({viewport:{width,height:width===320?700:width===390?844:1000}});page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket('**/api/live',s=>s.close());
 await page.addInitScript(({id,reduced})=>{localStorage.setItem('olymp.session',JSON.stringify({code:'QA1234',playerId:id,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:reduced,intense:true}));},{id:ids[0],reduced});
 await page.route('**/api/room',route=>{if(g.stage==='roundReveal')g.public.revealStartedAt=Date.now()-cursor;g.deadline=Date.now()+600000;return route.fulfill({json:m.view()});});
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>document.querySelector('canvas.boss-scene-canvas')?.dataset.venueReady==='true',null,{timeout:60000});await page.getByRole('button',{name:'Welt ansehen',exact:true}).click();
 const canvas=page.locator('canvas.boss-scene-canvas'),snapshot=async()=>JSON.parse(await canvas.getAttribute('data-dragon-salvo'));
 await page.waitForFunction(()=>!!document.querySelector('canvas.boss-scene-canvas')?.dataset.dragonSalvo);assert.equal((await snapshot()).draws,0);
 for(const [i,id]of ids.entries()){
  if(count>2&&i===count-1)continue;
  m.command(id,{type:'game',phase:m.view(id).room.phaseKey,action:{type:'estimate',round:g.round+1,guess:i===0?100000000:g.secret.product.price,risk:i%2?'risky':'safe'}});
 }
 if(g.stage==='answer'){g.deadline=Date.now()-1;m.view();}assert.equal(g.stage,'roundReveal');g.deadline=Date.now()+600000;
 const outcomes=g.public.reveal.outcomes;assert.equal(outcomes[0].score,0);assert.ok(outcomes[1].score>0);
 const fireAt=3.45+2.7/Math.max(1,outcomes.length-1);cursor=(fireAt+.22)*1000;
 await page.waitForFunction(({id,reduced})=>{const s=JSON.parse(document.querySelector('canvas.boss-scene-canvas').dataset.dragonSalvo);return reduced?s.shots.find(p=>p.id===id)?.earned&&s.draws===0:s.shots.find(p=>p.id===id)?.visibleCoins>=3;},{id:ids[1],reduced},{timeout:15000});
 const flight=await snapshot();assert.equal(flight.shots[0].earned,false);assert.equal(flight.shots[0].visibleCoins,0);assert.equal(flight.shots[1].coins,9);assert.ok(flight.draws<=2);if(count>2)assert.equal(flight.shots.at(-1).earned,false);
 const suffix=`${count}-${width}${reduced?'-reduced':''}`;await page.screenshot({path:`outputs/qa/dragon-salvo-flight-${suffix}.png`});
 cursor=(fireAt+.82)*1000;
 await page.waitForFunction(id=>JSON.parse(document.querySelector('canvas.boss-scene-canvas').dataset.dragonSalvo).shots.find(p=>p.id===id)?.impact,ids[1],{timeout:15000});
 const impact=await snapshot();if(reduced)assert.equal(impact.draws,0);await page.screenshot({path:`outputs/qa/dragon-salvo-impact-${suffix}.png`});
 cursor=11000;await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas.boss-scene-canvas').dataset.dragonSalvo).draws===0);
 g.deadline=Date.now()-1;m.view();if(g.stage==='intro'){g.deadline=Date.now()-1;m.view();}g.deadline=Date.now()+600000;assert.equal(g.stage,'answer');
 await page.waitForFunction(()=>{const s=JSON.parse(document.querySelector('canvas.boss-scene-canvas').dataset.dragonSalvo);return s.draws===0&&s.shots.every(p=>!p.earned);});
 results.push({count,width,reduced,flight,impact,nextRound:g.round});await page.close();console.log(`PASS dragon salvo ${suffix}`);
}assert.deepEqual(errors,[]);fs.writeFileSync('outputs/qa/dragon-salvo.json',JSON.stringify({results,errors,scope:'Real engine submissions and outcomes with coordinated HTTP fixtures; desktop D3D11 rendering at wide and narrow viewports, muted. Not physical phone, hearing or live network acceptance.'},null,2));}finally{await browser.close();}
