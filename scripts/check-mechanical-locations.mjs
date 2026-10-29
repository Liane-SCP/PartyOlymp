import assert from 'node:assert/strict';
import sharp from 'sharp';
import * as T from 'three';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/mechanical-fixture.mjs',bundle:true,platform:'node',format:'esm'});const {fixture}=await import('../outputs/mechanical-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
try{for(const width of(process.env.MECHANICAL_WIDTHS?.split(",").map(Number)??[1440,390]))for(const id of(process.env.GAMES?process.env.GAMES.split(','):['code','auction','timing'])){
 const m=fixture(id,12),p=await browser.newPage({viewport:{width,height:1100},hasTouch:width<600}),errors=[];
 if(id==='code')m.room.game.secret.code=[0,1,2,3];if(id==='auction')m.command(m.first,{type:'game',action:{type:'topic',choice:m.room.game.public.choices[0].id,round:1}});
 p.on('pageerror',e=>errors.push(e.message));p.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});await p.routeWebSocket('**/api/live',w=>w.close());
 await p.addInitScript(pid=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true}));localStorage.setItem('olymp.graphics','low');},m.first);
 await p.route('**/api/room',route=>{const body=route.request().postDataJSON();if(body.type==='action')m.act(body.action);return route.fulfill({json:m.view()});});await p.goto('http://127.0.0.1:5173');await p.locator('.adventure-ready').waitFor();await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForFunction(()=>Number(document.querySelector('.adventure-canvas canvas')?.dataset.readyAvatars)===12);
 const canvas=p.locator('.adventure-canvas canvas');
 async function pick(x,y,z,hold=false){const r=await canvas.boundingBox(),c=new T.PerspectiveCamera(42,r.width/r.height,.1,180);c.position.fromArray((await canvas.getAttribute('data-camera')).split(',').map(Number));c.lookAt(new T.Vector3(...JSON.parse(await canvas.getAttribute('data-camera-target'))));c.updateMatrixWorld();const q=new T.Vector3(x,y,z).project(c),sx=r.x+(q.x+1)*r.width/2,sy=r.y+(1-q.y)*r.height/2;if(width<600)await p.touchscreen.tap(sx,sy);else if(hold){await p.mouse.move(sx,sy);await p.mouse.down();}else await p.mouse.click(sx,sy);await p.waitForTimeout(120);}
 if(id==='code'){
  await p.getByRole('button',{name:'Meine Werkbank',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.vaultPersonal==='true');
  await p.locator('.adventure-stage').screenshot({path:`outputs/qa/vault-workbench-${width}.png`});
  for(let i=0;i<4;i++){await pick((i-1.5)*2.55,3.45,.88);assert.equal(await p.locator('.code-slots > button').nth(i).getAttribute('aria-pressed'),'true',`Slot ${i} was not selected`);await pick((i%3-1)*2.4,2.01,i<3?3.4:5.3);assert.ok(!(await p.locator('.code-slots > button').nth(i).getAttribute('aria-label')).includes('leer'),`Color ${i} was not selected`);}await pick(0,1.65,7.2);await p.waitForFunction(()=>document.querySelector('.code-pending')!==null);
  assert.deepEqual(m.view().room.game.mine.pending,[0,1,2,3]);const guest=m.room.players[1].id;assert.equal(m.view().room.game.roster[guest].pending,undefined);
  for(const other of m.room.players.slice(1))m.command(other.id,{type:'game',action:{type:'guess',colors:[0,1,2,3],round:1,turn:1}});await p.locator('.round-reveal').waitFor();assert.equal(m.view().room.game.mine.solved,true);
 }else if(id==='auction'){
  await pick(-5.25,2.7,.8);assert.equal(m.view().room.game.leader,m.first);for(const other of m.room.players.slice(1))m.command(other.id,{type:'game',action:{type:'pass',round:1}});
  await p.waitForFunction(()=>document.querySelector('.auction-arena')?.getAttribute('data-stage')==='perform');await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForFunction(()=>{const pos=JSON.parse(document.querySelector('.adventure-canvas canvas').dataset.position);return Math.hypot(pos[0]+2.5,pos[2]+3.5)<.25;});
 }else{
  await pick(0,3.63,.5);await p.getByRole('button',{name:'STOPP',exact:true}).waitFor();await p.waitForTimeout(1000);const first=await canvas.screenshot({path:'outputs/qa/calm-first.png'});await p.waitForTimeout(1200);const second=await canvas.screenshot({path:'outputs/qa/calm-second.png'});const meta=await sharp(first).metadata(),crop={left:4,top:4,width:meta.width-8,height:meta.height-8},a=await sharp(first).extract(crop).raw().toBuffer(),b=await sharp(second).extract(crop).raw().toBuffer();assert.ok(a.equals(b),'Calm measurement must produce identical interior pixels (4px rounded border excluded)');
  await pick(0,3.63,.5,width===1440);await p.getByRole('button',{name:'Auf die Crew warten',exact:true}).waitFor();assert.equal(m.view().room.game.mine.submitted,true);if(width===1440)await p.mouse.up();
 }
 await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.locator('.adventure-stage').screenshot({path:`outputs/qa/mechanical-${id}-${width}.png`});assert.deepEqual(errors,[]);await p.close();console.log(`${id}/${width}: 12 players, real 3D interactions, public/private state and scene transition passed`);
}}finally{await browser.close();}




