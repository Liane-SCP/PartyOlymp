import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/size-console-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/size-console-fixture.mjs');
async function until(predicate){const deadline=Date.now()+5000;while(!predicate()){if(Date.now()>deadline)throw Error('Authoritative room state did not converge');await new Promise(resolve=>setTimeout(resolve,40));}}
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
try{for(const width of (process.env.SIZE_CONSOLE_WIDTHS?.split(',').map(Number)??[1440,390])){
 const m=fixture('size',12),page=await browser.newPage({viewport:{width,height:1100},hasTouch:width===390}),errors=[];
 m.room.game.public.item={name:'Container',measure:'Au\u00dfenl\u00e4nge'};m.room.game.secret.item={name:'Container',measure:'Au\u00dfenl\u00e4nge',cm:605.8,source:'https://example.invalid/test'};m.room.game.public.reference={name:'Giraffe \u00b7 H\u00f6he',icon:'Giraffe',cm:550};
 page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket('**/api/live',ws=>ws.close());
 await page.addInitScript(pid=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');},m.first);
 await page.route('**/api/room',route=>{const body=route.request().postDataJSON();if(body.type==='action')m.act(body.action);return route.fulfill({json:m.view()});});
 await page.goto('http://127.0.0.1:5173');await page.locator('.adventure-ready').waitFor();
 const panel=page.locator('.size-entry-dock [data-size-controls][data-restored=true]'),input=page.getByRole('spinbutton',{name:'Größe in Zentimetern',exact:true}),button=page.getByRole('button',{name:'Größe festlegen',exact:true});
 await panel.waitFor();await page.locator('.adventure-stage').scrollIntoViewIfNeeded();assert.equal(await page.locator('[data-size-controls]').count(),1);assert.equal(await page.locator('.size-stage').count(),0);assert.equal(await page.locator('.adventure-console').isVisible(),false);
 async function model(cm){await page.waitForFunction(cm=>{const f=JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.sizeComparison??'null');return f&&Math.abs(f.estimate-cm)<Math.max(1e-10,cm*1e-10);},cm);}
 await page.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.sizeComparison??'null')?.referenceAxis==='y');assert.equal(JSON.parse(await page.locator('.adventure-canvas canvas').getAttribute('data-size-comparison')).axis,'x');
 await input.fill('123.456');await model(123.456);await page.waitForFunction(()=>document.querySelector('[data-size-controls]')?.dataset.restored==='true');
 await until(()=>m.room.game.players[m.first].timeoutInput?.action?.value===123.456);
 assert.equal(m.room.game.players[m.first].timeoutInput.action.value,123.456);assert.equal(m.room.game.players[m.first].answer,null);
 const node=await input.elementHandle(),canvas=await page.locator('.adventure-canvas canvas').elementHandle();await input.focus();
 for(const nextWidth of [390,1440,width]){await page.setViewportSize({width:nextWidth,height:1100});assert.equal(await node.evaluate(n=>n===document.querySelector('[data-size-controls] input[type=number]')),true);assert.equal(await node.evaluate(n=>document.activeElement===n),true);assert.equal(await canvas.evaluate(n=>n===document.querySelector('.adventure-canvas canvas')),true);assert.equal(await input.inputValue(),'123.456');}
 await page.getByRole('button',{name:'Ruhige B\u00fchnenansicht',exact:true}).evaluate(n=>n.click());await page.waitForFunction(n=>!n.isConnected,canvas);await page.locator('.adventure-ready').waitFor();assert.equal(await node.evaluate(n=>n===document.querySelector('[data-size-controls] input[type=number]')),true);assert.equal(await node.evaluate(n=>document.activeElement===n),true);
 await page.reload();await panel.waitFor();await model(123.456);assert.equal(await input.inputValue(),'123.456');assert.equal(await page.locator('[data-size-controls]').count(),1);
 await input.fill('0');assert.equal(await button.isDisabled(),true);await page.getByRole('alert').filter({hasText:'Gib eine Größe'}).waitFor();
 await until(()=>m.room.game.players[m.first].timeoutInput===undefined);
 assert.equal(m.room.game.players[m.first].timeoutInput,undefined);await model(123.456);
 await page.locator('.adventure-stage').screenshot({path:`outputs/qa/size-console-invalid-${width}.png`});
 await input.fill('0.00001');await model(.00001);assert.equal(await page.getByLabel('Deine Modellgröße',{exact:true}).innerText(),'0,0001 mm');
 await input.fill('0.01');await model(.01);await page.getByRole('button',{name:'Doppelt so groß',exact:true}).click();await model(.02);
 await page.getByRole('button',{name:'Zehn Prozent kleiner',exact:true}).click();await model(.018);
 await input.fill('100000001');assert.equal(await button.isDisabled(),true);await input.fill('100000000');await model(1e8);assert.equal(await button.isEnabled(),true);
 await page.locator('.adventure-stage').screenshot({path:`outputs/qa/size-console-extreme-${width}.png`});
 await input.press('Enter');await page.getByRole('button',{name:'\u2713 Gr\u00f6\u00dfe abgegeben',exact:true}).waitFor();assert.equal(m.room.game.players[m.first].answer,1e8);assert.equal(await input.isDisabled(),true);
 const saved=await page.evaluate(()=>Object.keys(sessionStorage).filter(k=>k.startsWith('olymp.size:')));assert.deepEqual(saved,[]);
 m.next();await page.locator('.round-reveal').waitFor();m.next();const round=m.view().room.game.round;await page.locator(`[data-size-controls][data-round="${round}"][data-restored=true]`).waitFor();await model(m.view().room.game.reference.cm);
 assert.equal(await input.inputValue(),String(m.view().room.game.reference.cm));assert.equal(await input.isEnabled(),true);
 const data=await page.locator('.adventure-canvas canvas').evaluate(c=>({...c.dataset}));assert.ok(Number(data.drawCalls)<=100);assert.ok(Number(data.triangles)<=100000);assert.deepEqual(errors,[]);
 await page.locator('.adventure-stage').screenshot({path:`outputs/qa/size-console-next-round-${width}.png`});
 console.log(`PASS size-console/${width}: one integrated input, stable focus/canvas across resize, private restore, invalid draft clearing, tiny/large exact values, semantic nudges, keyboard confirmation and round reset`);
 await page.close();
}}finally{await browser.close();}
