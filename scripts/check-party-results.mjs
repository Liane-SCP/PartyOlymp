import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/results-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {ids,resultFixture}=await import('../outputs/results-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']}),results=[],errors=[];
fs.mkdirSync('outputs/qa/party-results',{recursive:true});
try{
 for(const width of process.env.RESULT_WIDTHS?.split(',').map(Number)??[1280,1920])for(const id of process.env.RESULT_GAMES?.split(',')??ids){
  const m=resultFixture(id,12),pid=process.env.RESULT_VIEWER==='last'?m.room.participantIds.at(-1):m.first,p=await browser.newPage({viewport:{width,height:Math.round(width*9/16)},reducedMotion:'reduce'});
  p.on('pageerror',e=>errors.push({id,width,message:e.message}));await p.routeWebSocket('**/api/live',w=>w.close());
  await p.addInitScript(pid=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');},pid);
  await p.route('**/api/room',r=>{const b=r.request().postDataJSON();if(b.type==='action')m.command(pid,b.action);return r.fulfill({json:m.view(pid)});});
  await p.goto('http://127.0.0.1:5173');await p.locator(['colossus','kraken','dragon'].includes(id)?'.boss-scene-wrapper.is-ready':'.adventure-ready').waitFor({timeout:60000});
  await p.waitForTimeout(1000);
  const measured=await p.evaluate(()=>{
   const scene=document.querySelector('.adventure-stage,.boss-arena'),b=scene.getBoundingClientRect();
   const panel=document.querySelector('.adventure-console');const c=panel?.getBoundingClientRect();
   return {scroll:document.documentElement.scrollHeight>innerHeight,scene:{x:b.x,y:b.y,width:b.width,height:b.height},console:c&&c.width>0?{x:c.x,y:c.y,width:c.width,height:c.height,overflow:panel.scrollWidth-panel.clientWidth}:null,bodyText:document.querySelector('.room-stage')?.textContent?.slice(0,200)};
  });
  assert.equal(measured.scroll,false,`${id}/${width}: result scrolls the page`);assert.equal(Math.round(measured.scene.width),width);assert.equal(Math.round(measured.scene.height),Math.round(width*9/16));
  if(measured.console)assert.ok(measured.console.overflow<=2,`${id}/${width}: result overflows sideways by ${measured.console.overflow}px`);
  if(id==='wiki'){
   const next=p.getByRole('button',{name:'Nächste Bibliotheksbücher',exact:true});await next.click();
   await p.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.wiki??'{}').page===1);
   await next.click();await next.click();await p.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.wiki??'{}').page===3);assert.ok(await next.isDisabled());
  }
  if(['categories','spectrum','timing'].includes(id)){
   const label=id==='categories'?'Nächste Atelierkarten':id==='spectrum'?'Nächste Spectrum-Ergebnisse':'Nächste Zeitmomente',field=id==='categories'?'atelier':id;
   const next=p.getByRole('button',{name:label,exact:true});let clicks=0;while(!await next.isDisabled()&&clicks++<12)await next.click();
   await p.waitForFunction(({field,last})=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset[field]??'{}').page===last,{field,last:id==='timing'?2:3});
   if(id==='categories'){
    assert.equal(await p.locator('.adventure-console').isVisible(),false,'Result table hides a stage card');
    await p.getByRole('button',{name:'Tabelle & Wertung',exact:true}).click();assert.ok(await p.locator('.adventure-console').isVisible(),'Result table cannot be reopened');
   }
  }
  if(id==='color'){
   const next=p.getByRole('button',{name:'Nächste Mischung',exact:true});for(let i=0;i<11;i++)await next.click();
   assert.match(await p.locator('.color-lab-result strong').textContent(),/12 \/ 12/);
  }
  if(id==='size'){
   const select=p.getByRole('combobox',{name:'Öffentlichen Größentipp auswählen',exact:true});
   assert.ok(await select.evaluate(el=>{const b=el.getBoundingClientRect();return el.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));}),'Museum result selection is obscured');
   await select.selectOption(m.room.participantIds.at(-1));await p.waitForFunction(pid=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.sizeMuseum??'{}').selected?.id===pid,m.room.participantIds.at(-1));
  }
  if(process.env.RESULT_VIEWER==='last'&&['chain','herd','typer','cards'].includes(id)){
   await p.getByRole('button',{name:'Dein Ergebnis ansehen',exact:true}).click();
   assert.ok(await p.locator('.round-player-result.self').evaluate(el=>el===document.activeElement),'Own result did not receive focus');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollTop),0,'Result jump moved the page');
  }
  const g=m.view().room.game,rows=g.reveal.players??g.reveal.outcomes;assert.equal(rows.length,12,`${id}: engine result missed participants`);
  await p.screenshot({path:`outputs/qa/party-results/${id}-${width}.png`});results.push({id,width,count:12,stage:g.stage,...measured});await p.close();console.log('PASS',id,width);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(process.env.RESULT_REPORT??'outputs/qa/party-results/report.json',JSON.stringify({results,errors,scope:'Real engine actions to first round result, 12 participants, local Chromium rendering. Controlled polling holds the result state; no full network or physical-hardware acceptance.'},null,2));
}finally{await browser.close();}
