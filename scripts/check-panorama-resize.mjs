import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';

await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/panorama-resize-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/panorama-resize-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}),results=[],errors=[];
try{
 for(const width of [1440,390]){
  const m=fixture('geo',12),page=await browser.newPage({viewport:{width,height:1000},hasTouch:width===390});let browserActions=0;
  page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket('**/api/live',ws=>ws.close());
  await page.addInitScript(pid=>{
   localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');
   window.__panoramaWrites=[];
   for(const key of ['width','height']){const descriptor=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,key);Object.defineProperty(HTMLCanvasElement.prototype,key,{...descriptor,set(value){if(this.closest('.geo-panorama'))window.__panoramaWrites.push({key,before:descriptor.get.call(this),value,at:performance.now()});descriptor.set.call(this,value);}});}
  },m.first);
  await page.route('**/api/room',route=>{if(route.request().postDataJSON()?.type==='action')browserActions++;return route.fulfill({json:m.view()});});await page.goto('http://127.0.0.1:5173');await page.locator('.adventure-ready').waitFor({timeout:60000});
  const panorama=page.locator('.geo-panorama canvas');await page.waitForFunction(()=>!!document.querySelector('.geo-panorama canvas')?.dataset.panoramaView);
  await panorama.scrollIntoViewIfNeeded();await panorama.focus();await page.evaluate(()=>window.__panoramaWrites=[]);
  for(const key of ['ArrowRight','ArrowUp','+','-'])await panorama.press(key);
  const box=await panorama.boundingBox();
  if(width===390){const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+50,y:box.y+80}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+50+i*4,y:box.y+80+i}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.mouse.move(box.x+50,box.y+80);await page.mouse.down();await page.mouse.move(box.x+82,box.y+88,{steps:8});await page.mouse.up();}
  const afterInput=await panorama.evaluate(c=>({view:JSON.parse(c.dataset.panoramaView),buffer:[c.width,c.height],writes:window.__panoramaWrites}));
  assert.ok(Math.abs(afterInput.view.yaw-.12)>.05);assert.ok(Math.abs(afterInput.view.pitch)>.05);assert.equal(afterInput.view.fov,75);
  assert.deepEqual(afterInput.writes,[],'Looking and zooming at a fixed size must reuse the panorama drawing buffer');
  await page.evaluate(()=>{window.__panoramaWrites=[];document.querySelector('.geo-panorama').style.display='none';});await page.waitForTimeout(120);
  const hidden=await page.evaluate(()=>{const c=document.querySelector('.geo-panorama canvas');return {buffer:[c.width,c.height],writes:window.__panoramaWrites};});assert.deepEqual(hidden.buffer,afterInput.buffer);assert.deepEqual(hidden.writes,[],'A zero-sized hidden panorama must not reset its GPU buffer');
  await page.evaluate(()=>document.querySelector('.geo-panorama').style.removeProperty('display'));await panorama.scrollIntoViewIfNeeded();await page.waitForTimeout(120);
  const resizedWidth=width===390?430:1280;await page.evaluate(()=>window.__panoramaWrites=[]);await page.setViewportSize({width:resizedWidth,height:900});
  await page.waitForFunction(()=>{const c=document.querySelector('.geo-panorama canvas'),r=c?.getBoundingClientRect();return c&&r.width>0&&c.width===Math.round(r.width)&&c.height===Math.round(r.height);});
  const resized=await panorama.evaluate(c=>({buffer:[c.width,c.height],writes:window.__panoramaWrites}));assert.ok(resized.writes.length>0&&resized.writes.every(w=>w.value>0&&w.before!==w.value));
  await page.evaluate(()=>window.__panoramaWrites=[]);for(const [i,pid]of m.room.participantIds.entries())m.command(pid,{type:'game',action:{type:'pin',lat:i*3,lon:179-i}});await page.locator('.round-reveal').waitFor();await page.waitForTimeout(150);
  const unmountWrites=await page.evaluate(()=>window.__panoramaWrites);assert.ok(unmountWrites.every(w=>w.value>0),'Removed panoramas never allocate zero-sized buffers');
  // Initial fitting must use the measured result-map width, not a guessed desktop width.
  await page.waitForFunction(()=>{const map=document.querySelector('.geo-reveal .street-map'),svg=map?.querySelector('svg');return svg&&Number(svg.getAttribute('width'))>0;});
  await page.waitForTimeout(200);
  const mapFit=await page.locator('.geo-reveal .street-map').evaluate(map=>{const svg=map.querySelector('svg'),w=Number(svg.getAttribute('width')),h=Number(svg.getAttribute('height'));return {w,h,pins:[...svg.querySelectorAll('g[transform]')].map(g=>g.getAttribute('transform').match(/[-\d.]+/g).map(Number))};});
  assert.equal(mapFit.pins.length,13);for(const [x,y]of mapFit.pins)assert.ok(x>=0&&x<=mapFit.w&&y>=0&&y<=mapFit.h,'Initial result fit keeps the actual target and all 12 guesses inside the measured map');
  const resultMap=page.locator('.geo-reveal .world-map'),picker=resultMap.getByLabel('Tipp auf der Karte hervorheben', {exact:true});
  assert.equal(await resultMap.locator('svg text').count(),1,'Only the destination label is painted above the public pins');
  const positionsBefore=await resultMap.locator('svg g[data-map-pin]').evaluateAll(gs=>gs.map(g=>g.getAttribute('transform')));
  for(let i=0;i<12;i++){await picker.selectOption(String(i));await page.waitForFunction(i=>document.querySelector(`.geo-reveal [data-map-pin="${i}"]`)?.getAttribute('data-highlighted')==='true',i);assert.equal(await resultMap.locator('svg [data-highlighted="true"]').count(),1);assert.equal(await resultMap.locator(`line[data-guess-route="${i}"]`).getAttribute('opacity'),'1');assert.equal(await resultMap.locator(`line[data-guess-route="${(i+1)%12}"]`).getAttribute('opacity'),'0.2');assert.ok((await resultMap.locator('.map-guess-picker [role=status]').innerText()).includes(i===0?'Nova':`Crew ${i}`));}
  assert.deepEqual(await resultMap.locator('svg g[data-map-pin]').evaluateAll(gs=>gs.map(g=>g.getAttribute('transform'))),positionsBefore,'Highlighting keeps the map viewpoint and all public pins');
  await picker.focus();await picker.press('Home');await picker.press('ArrowDown');assert.equal(await picker.inputValue(),'0','The native selector works with keyboard');
  await resultMap.getByRole('button',{name:'Alle Tipps',exact:true}).click();assert.equal(await picker.inputValue(),'all');assert.equal(await resultMap.locator('svg [data-highlighted="true"]').count(),0);
  const map=page.locator('.geo-reveal .street-map');await map.scrollIntoViewIfNeeded();const mapBounds=await map.boundingBox(),point=await resultMap.locator('g[data-map-pin="6"]').getAttribute('transform').then(s=>s.match(/[-\d.]+/g).map(Number));
  if(width===390)await page.touchscreen.tap(mapBounds.x+point[0],mapBounds.y+point[1]);else await page.mouse.click(mapBounds.x+point[0],mapBounds.y+point[1]);
  assert.equal(await picker.inputValue(),'6','A real mouse/touch tap highlights the actual nearby pin');
  await picker.scrollIntoViewIfNeeded();await page.screenshot({path:`outputs/qa/panorama-result-selected-${resizedWidth}.png`});
  await resultMap.getByRole('button',{name:'Welt',exact:true}).click();assert.equal(await resultMap.getByRole('button',{name:'Karte verkleinern',exact:true}).isDisabled(),true,'Global zoom zero is reachable and the lower limit is respected');
  await resultMap.getByRole('button',{name:'Alle Tipps',exact:true}).click();assert.equal(browserActions,0,'Result selection never sends a new pin or changes a submitted answer');
  await page.evaluate(()=>{const console=document.querySelector('.adventure-console');if(console)console.scrollTop=0;window.scrollTo(0,0);});await page.screenshot({path:`outputs/qa/panorama-result-fit-${resizedWidth}.png`});
  await page.locator('.round-player-result').last().scrollIntoViewIfNeeded();await page.screenshot({path:`outputs/qa/panorama-result-ranks-${resizedWidth}.png`});
  results.push({width,players:12,inputBufferReused:true,hiddenBufferPreserved:true,positiveActualResize:true,unmountWithoutZeroBuffer:true,mapFit,resizeWrites:resized.writes.length,allTwelveSelectable:true,selectionKeepsView:true,nativeKeyboard:true,nativePinTap:true,noAnswerMutation:true,worldZoomZero:true});await page.close();console.log(`PASS panorama ${width}: buffer reuse/hide/resize/unmount, measured map fit, all 12 public tips selectable with keyboard and native pointer, no answer mutation`);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(process.env.PANORAMA_REPORT??'outputs/qa/panorama-resize.json',JSON.stringify({results,errors,scope:'Native Chromium mouse/keyboard and CDP touch events, real-engine controlled HTTP fixture. SwiftShader; not a physical phone, live-network or FPS acceptance.'},null,2));
}finally{await browser.close();}
