import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/shopping-tour-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/shopping-tour-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-webgl']}),results=[],errors=[];
try{
 for(const players of[2,12])for(const width of[1440,390]){
  const m=fixture('budget',players),page=await browser.newPage({viewport:{width,height:1000},hasTouch:width===390}),requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).pathname.endsWith('.glb'))requests.push(r.url());});
  await page.routeWebSocket('**/api/live',s=>s.close());
  await page.addInitScript(pid=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');},m.first);
  await page.route('**/api/room',route=>{const body=route.request().postDataJSON();if(body.type==='action')m.act(body.action);return route.fulfill({json:m.view()});});
  await page.goto('http://127.0.0.1:5173');await page.locator('.adventure-ready').waitFor({timeout:60000});
  const stage=page.locator('.adventure-stage'),canvas=page.locator('.adventure-canvas canvas');
  await stage.scrollIntoViewIfNeeded();await page.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.productImages??'null')?.ready===10);
  assert.equal(await stage.getAttribute('data-shopping-view'),width===390?'offer':'overview','Narrow screens start at the first real offer');
  await page.evaluate(()=>{window.__shoppingTourCanvas=document.querySelector('.adventure-canvas canvas');});
  const modelRequests=requests.length,measurements=[];
  const items=m.room.game.public.items;
  for(const index of[0,5,9]){
   await page.getByRole('combobox',{name:'Angebot auswählen'}).selectOption(String(index));
   await page.waitForFunction(i=>{const c=document.querySelector('.adventure-canvas canvas');return c?.dataset.shoppingView==='offer'&&Number(c.dataset.shoppingIndex)===i;},index);
   assert.equal(await page.locator('.shopping-offer-description strong').textContent(),items[index].name??items[index].title);
   const box=await canvas.boundingBox(),camera=new T.PerspectiveCamera(42,box.width/box.height,.1,180);
   camera.position.fromArray((await canvas.getAttribute('data-camera')).split(',').map(Number));camera.lookAt(new T.Vector3(...JSON.parse(await canvas.getAttribute('data-camera-target'))));camera.updateMatrixWorld();
   const position=[(index%4-1.5)*3.9,2.25,Math.floor(index/4)*2.9-1.4+.15];
   const project=p=>{const q=new T.Vector3(...p).project(camera);return{x:box.x+(q.x+1)*box.width/2,y:box.y+(1-q.y)*box.height/2};};
   const point=project(position),left=project([position[0]-1,...position.slice(1)]),right=project([position[0]+1,...position.slice(1)]),top=project([position[0],position[1]+.65,position[2]]),bottom=project([position[0],position[1]-.65,position[2]]);
   const photo={width:Math.abs(right.x-left.x),height:Math.abs(bottom.y-top.y)};assert.ok(photo.width>=70&&photo.height>=44,JSON.stringify(photo));
   assert.ok(left.x>box.x&&right.x<box.x+box.width&&top.y>box.y&&bottom.y<box.y+box.height,'The actual product photo fits inside the native canvas');
   assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,point),'CANVAS','No navigation covers the product');
   if(width===390)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
   await page.waitForFunction(i=>document.querySelectorAll('.product-grid>button')[i]?.getAttribute('aria-pressed')==='true',index);
   await page.getByRole('button',{name:'Zurücklegen',exact:true}).waitFor();
   await page.getByRole('button',{name:'Zurücklegen',exact:true}).focus();await page.keyboard.press('Enter');
   await page.waitForFunction(i=>document.querySelectorAll('.product-grid>button')[i]?.getAttribute('aria-pressed')==='false',index);
   measurements.push({index,photo});
  }
  const layout=await page.evaluate(()=>{const c=document.querySelector('.adventure-canvas canvas').getBoundingClientRect(),n=document.querySelector('.shopping-tour').getBoundingClientRect();return{canvasBottom:c.bottom,navTop:n.top,targets:[...document.querySelectorAll('.shopping-tour button,.shopping-tour select')].map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}))};});
  await page.screenshot({path:`outputs/qa/shopping-tour-layout-${players}-${width}.png`});
  assert.ok(layout.navTop>=layout.canvasBottom,`Navigation has its own space outside the world: ${JSON.stringify(layout)}`);assert.ok(layout.targets.every(t=>t.w>=44&&t.h>=44),'All browsing controls have at least 44px touch targets');
  await page.getByRole('button',{name:'Übersicht',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.shoppingView==='overview');
  await page.getByRole('button',{name:'Angebot ansehen',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.shoppingView==='offer');
  await page.getByRole('button',{name:'Vorheriges Angebot'}).click();assert.equal(await page.getByRole('combobox',{name:'Angebot auswählen'}).inputValue(),'8');
  await page.setViewportSize({width:width===390?700:390,height:850});await page.waitForTimeout(700);
  assert.equal(await page.evaluate(()=>window.__shoppingTourCanvas===document.querySelector('.adventure-canvas canvas')),true,'Browsing and resize retain the renderer');assert.equal(requests.length,modelRequests,'No browsing/resize model reload');
  await page.setViewportSize({width,height:1000});await stage.scrollIntoViewIfNeeded();await page.screenshot({path:`outputs/qa/shopping-tour-${players}-${width}.png`});
  m.resolve();await page.locator('.round-reveal').waitFor();await page.waitForFunction(()=>!document.querySelector('.shopping-tour'),'Checkout owns its original camera and controls');
  m.next();await page.getByRole('combobox',{name:'Angebot auswählen'}).waitFor();await page.waitForFunction(()=>document.querySelector('.adventure-stage')?.dataset.shoppingIndex==='0');
  assert.equal(await page.getByRole('combobox',{name:'Angebot auswählen'}).inputValue(),'0');
  results.push({players,width,measurements,layout,rendererRetained:true,reset:true});await page.close();console.log(`PASS shopping tour ${players}/${width}: actual first/middle/last product, native selection, keyboard removal, clear controls, renderer/round lifecycle`);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('outputs/qa/shopping-tour.json',JSON.stringify({results,errors,scope:'Real-engine coordinated HTTP snapshots, native mouse/CDP touch and keyboard, D3D11 desktop renderer. Narrow viewports are not physical phones; no live multiplayer, FPS or long memory acceptance.'},null,2));
}finally{await browser.close();}
