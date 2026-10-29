import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/modal-priority-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/modal-priority-fixture.mjs'),model=fixture('cards',4),errors=[];
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 await page.routeWebSocket('**/api/live',w=>w.close());
 await page.addInitScript(playerId=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');},model.first);
 await page.route('**/api/room',r=>{const b=r.request().postDataJSON();if(b.type==='action')model.act(b.action);return r.fulfill({json:model.view()});});
 await page.goto('http://127.0.0.1:5173');await page.locator('.adventure-ready').waitFor();
 await page.getByRole('button',{name:'Meine Karten',exact:true}).click();await page.locator('.adventure-card-focused').waitFor();
 const openSettings=async()=>{await page.getByRole('button',{name:'Einstellungen',exact:true}).click();await page.waitForFunction(()=>!!document.activeElement?.closest('.settings-modal'));};
 const inside=()=>page.evaluate(()=>!!document.activeElement?.closest('.settings-modal'));
 await openSettings();
 for(let i=0;i<8;i++){await page.keyboard.press('Tab');assert.ok(await inside(),'Game focus trap stole a settings key');}
 await page.locator('.adventure-card-camera button').first().evaluate(el=>el.focus());assert.ok(await inside(),'Background is focusable while settings are open');
 await page.keyboard.press('Escape');assert.equal(await page.locator('.settings-modal').count(),0);assert.equal(await page.locator('.adventure-card-focused').count(),1,'Escape also closed the hand view');
 await openSettings();model.switchGame('categories');await page.locator('[data-atelier-notebook]').waitFor();assert.ok(await inside(),'New game autofocus stole the modal focus');
 await page.keyboard.press('Escape');assert.equal(await page.locator('.settings-modal').count(),0);const input=page.locator('[data-atelier-notebook] input').first();await input.click();assert.ok(await input.evaluate(el=>el===document.activeElement),'Closing settings left the game inert');
 assert.deepEqual(errors,[]);fs.writeFileSync('outputs/qa/modal-priority.json',JSON.stringify({cardViewPreserved:true,settingsTabPriority:true,backgroundInert:true,phaseAutofocusBlocked:true,gameFocusRestored:true,errors},null,2));console.log('PASS modal priority and background phase change');
}finally{await browser.close();}
