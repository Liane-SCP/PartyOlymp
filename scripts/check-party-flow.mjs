import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/party-flow-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture,ids}=await import('../outputs/party-flow-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const results=[],errors=[];
const detailsOnly=process.env.PARTY_CHECK==='details';
fs.mkdirSync('outputs/qa/party-flow',{recursive:true});
let model=fixture('dice',4);
const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
page.on('pageerror',e=>errors.push(e.message));
await page.routeWebSocket('**/api/live',w=>w.close());
await page.addInitScript(()=>{localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');});
await page.route('**/api/room',r=>{model.room.players.forEach(p=>p.lastSeen=Date.now());const body=r.request().postDataJSON();if(body.type==='action')model.act(body.action);return r.fulfill({json:model.view()});});
async function open(){
 await page.goto('http://127.0.0.1:5173');
 await page.evaluate(pid=>localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'})),model.first);
 await page.reload();await page.locator('.in-room').waitFor();
}
async function inspect(name){
 const measured=await page.evaluate(()=>{
  const scene=[...document.querySelectorAll('.adventure-stage,.journey-atlas,.boss-arena,.victory-ceremony')].find(e=>e.getBoundingClientRect().width>0);
  const bounds=scene?.getBoundingClientRect();
  return {scroll:document.documentElement.scrollHeight>innerHeight,width:bounds?.width,height:bounds?.height,map:!!document.querySelector('.journey-atlas'),viewport:{width:innerWidth,height:innerHeight}};
 });
 assert.equal(measured.scroll,false,`${name}: page scrolls`);
 assert.equal(Math.round(measured.width),measured.viewport.width,`${name}: scene width`);
 assert.equal(Math.round(measured.height),measured.viewport.height,`${name}: scene height`);
 if(name.startsWith('game-'))assert.equal(measured.map,false,`${name}: map during game`);
 await page.screenshot({path:`outputs/qa/party-flow/${name}.png`});results.push({name,...measured});console.log('PASS',name);
}
try{
 for(const width of detailsOnly||process.env.PARTY_CHECK==='games'?[]:[1366,1920]){
  await page.setViewportSize({width,height:Math.round(width*9/16)});
  for(const phase of ['lobby','travel','rules','standings','paused','podium']){
   model=fixture('dice',4);model.room.selection.push({id:'picture',rounds:1,seconds:20});model.room.phase=phase;
   if(['lobby','travel','rules'].includes(phase))model.room.game=null;
   model.room.deadline=Date.now()+45000;
   await open();
   await page.locator(phase==='podium'?'.victory-ceremony':phase==='lobby'?'.adventure-ready':'.journey-ready').waitFor();
   if(phase==='rules'){
    const ready=page.getByRole('button',{name:'Bereit zum Spielen',exact:true});assert.ok(await ready.isVisible());
    const b=await ready.boundingBox();assert.ok(b.y+b.height<=Math.round(width*9/16),'Ready button outside screen');
    await page.getByText('Relikt wählen · optional',{exact:true}).click();
    assert.ok(await page.locator('.party-relic-options').isVisible());
    await page.getByText('Relikt wählen · optional',{exact:true}).click();
   }
   await inspect(`${phase}-${width}`);
  }
 }
 for(const width of process.env.PARTY_WIDTHS?.split(',').map(Number)??[1366]){
 await page.setViewportSize({width,height:Math.round(width*9/16)});
 for(const id of process.env.PARTY_GAMES?process.env.PARTY_GAMES.split(','):ids){
  model=fixture(id,4);await open();await page.locator(id==='colossus'||id==='kraken'||id==='dragon'?'.boss-scene-wrapper.is-ready':'.adventure-ready').waitFor();
  await inspect(`game-${id}-${width}`);
  if(id==='herd'){
    const input=page.locator('[data-herd-entry] input');await input.fill('Wasser');await input.press('Enter');
    assert.equal(model.room.game.players[model.first].answer,'Wasser','Thought not received');
  }
  if(id==='size'){
    const input=page.getByRole('spinbutton',{name:'Größe in Zentimetern'}),commit=page.locator('[data-action=confirm-size]');await input.fill('321');
    assert.ok(await commit.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Size confirmation obscured');
    await commit.click();assert.equal(model.room.game.players[model.first].answer,321,'Size estimate not received');
  }
  if(id==='categories'){
    const commit=page.getByRole('button',{name:'Antworten festlegen',exact:true});
    assert.equal(await commit.evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom<=innerHeight-75&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,'Notebook submit obscured');
    const fields=page.locator('[data-atelier-notebook] input');assert.ok(await fields.evaluateAll(nodes=>nodes.every(el=>{const a=el.getBoundingClientRect(),b=el.closest('.words-sheet').getBoundingClientRect();return a.top>=b.top&&a.bottom<=b.bottom;})),'Notebook fields require unnecessary scrolling');await fields.first().fill(model.room.game.public.letter+'anfang');await fields.last().fill(model.room.game.public.letter+'ende');await commit.click();assert.equal(model.room.game.players[model.first].submitted,true,'Notebook submission not received');
  }
  if(id==='dice'){
    await page.getByRole('button',{name:'Erster Wurf',exact:false}).click();assert.equal(model.room.game.players[model.first].rolls,1);await page.getByRole('button',{name:'Wertungsblatt',exact:false}).click();const ledger=page.getByRole('dialog',{name:/Würfelwerk/});assert.ok(await ledger.isVisible());await page.keyboard.press('Escape');
  }
  if(id==='geo'){
    await page.getByRole('button',{name:'Karte & Tipp',exact:true}).click();
    const confirm=page.getByRole('button',{name:'Hier bin ich · Festlegen',exact:true}),bounds=await confirm.boundingBox();
    const consoleBounds=await page.locator('.adventure-console').boundingBox();
    assert.ok(bounds&&bounds.y+bounds.height<=consoleBounds.y+consoleBounds.height,'Geo confirm below the console fold');await inspect(`game-geo-map-${width}`);
    const map=page.locator('.geo-arena .street-map'),mapBounds=await map.boundingBox();
    await map.click({position:{x:mapBounds.width/2,y:mapBounds.height/2}});
    await confirm.click();assert.equal(model.room.game.players[model.first].submitted,true,'Geo guess not received by engine');
  }
  if(id==='code'){
    const bounds=await page.locator('.code-submit').boundingBox();assert.ok(bounds&&bounds.y+bounds.height<=Math.round(width*9/16),'Code confirm below the fold');
    for(let slot=0;slot<4;slot++){await page.locator('.code-slots button').nth(slot).click();await page.locator('.code-palette button').nth(slot).click();}
    await page.locator('.code-submit').click();assert.equal(model.room.game.players[model.first].submitted,true,'Code guess not received by engine');
  }
 }
 }
 for(const id of ['dice','picture','colossus']){
  model=fixture(id,4);model.room.phase='reveal';model.room.deadline=Date.now()+12000;
  model.room.game.results=model.room.players.map((p,i)=>({id:p.id,raw:100-i*20,valid:true,detail:null}));
  await open();await page.locator(id==='colossus'?'.boss-scene-wrapper.is-ready':'.adventure-ready').waitFor();await inspect(`reveal-${id}`);
 }
 model=fixture('cards',4);await open();await page.locator('.adventure-ready').waitFor();
 await page.evaluate(()=>{window.__partyCanvas=document.querySelector('.adventure-canvas canvas');});
 model.room.phase='reveal';model.room.deadline=Date.now()+12000;
 model.room.game.results=model.room.players.map((p,i)=>({id:p.id,raw:100-i*20,valid:true,detail:null}));
 await page.locator('.platform[data-phase=reveal]').waitFor();
 assert.ok(await page.evaluate(()=>window.__partyCanvas===document.querySelector('.adventure-canvas canvas')),'Results rebuilt the game renderer');
 results.push({name:'stable-world-on-result',sameCanvas:true});
 await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
 const settings=page.getByRole('dialog',{name:'Einstellungen',exact:true});
 await settings.getByLabel('Grafikqualität',{exact:true}).selectOption('medium');
 await settings.getByText('Modelle & Künstler',{exact:true}).click();
 await settings.locator('.party-credits p').nth(2).waitFor();
 assert.ok(await settings.getByRole('button',{name:'Raum verlassen',exact:true}).isVisible());
 await page.screenshot({path:'outputs/qa/party-flow/settings.png'});
 await page.keyboard.press('Escape');assert.equal(await settings.isVisible(),false,'Escape did not close the settings');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(process.env.PARTY_REPORT??`outputs/qa/party-flow/report${process.env.PARTY_WIDTHS?'-16x9':detailsOnly?'-details':''}.json`,JSON.stringify({results,errors,scope:'Chromium desktop layout and game-engine fixtures; full network matches and physical-device acceptance remain separate.'},null,2));
}finally{await browser.close();}
