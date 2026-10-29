import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/review-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {reviewFixture}=await import('../outputs/review-fixture.mjs'),results=[],errors=[];
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
fs.mkdirSync('outputs/qa/party-reviews',{recursive:true});
async function visibleControl(control){
 assert.equal(await control.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top>=100&&r.bottom<=innerHeight-80&&r.height>=44&&(hit===el||el.contains(hit));}),true,'Submission must remain visible and unobscured');
}
try{
 for(const width of process.env.REVIEW_WIDTHS?.split(',').map(Number)??[1280,1920])for(const kind of process.env.REVIEW_GAMES?.split(',')??['categories','bomb','chain-review','chain-challenge','auction']){
  const m=reviewFixture(kind),pid=m.viewer,p=await browser.newPage({viewport:{width,height:Math.round(width*9/16)},reducedMotion:'reduce'});
  p.on('pageerror',e=>errors.push({kind,width,message:e.message}));await p.routeWebSocket('**/api/live',w=>w.close());
  await p.addInitScript(pid=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:true,motion:true}));localStorage.setItem('olymp.graphics','low');},pid);
  await p.route('**/api/room',r=>{const b=r.request().postDataJSON();if(b.type==='action')m.command(pid,b.action);return r.fulfill({json:m.view(pid)});});
  await p.goto('http://127.0.0.1:5173');await p.locator('.adventure-ready').waitFor();await p.waitForTimeout(400);
  const layout=await p.evaluate(()=>({scroll:document.documentElement.scrollHeight>innerHeight,consoleOverflow:(()=>{const el=document.querySelector('.adventure-console');return el?.getBoundingClientRect().width?el.scrollWidth-el.clientWidth:0;})()}));
  await p.screenshot({path:`outputs/qa/party-reviews/${kind}-${width}.png`});assert.equal(layout.scroll,false);assert.ok(layout.consoleOverflow<=2,`${kind}: horizontal overflow ${layout.consoleOverflow}`);
  if(kind==='categories'){
   const submit=p.getByRole('button',{name:'Stimmen abgeben',exact:true});await visibleControl(submit);
   const choices=p.locator('.word-vote-actions>button:first-child');assert.equal(await choices.count(),12);
   for(const choice of await choices.all())await choice.click();await visibleControl(submit);await submit.click();assert.equal(m.room.game.players[pid].voteCommitted,true);
  }else if(kind==='bomb'){
   await p.getByRole('button',{name:'✓ Gültiges Wort',exact:true}).click();assert.equal(m.room.game.players[pid].ballot,true);
  }else if(kind==='chain-review'){
   await p.getByRole('button',{name:'✓ Passt',exact:true}).click();assert.equal(m.room.game.players[pid].approved,true);
  }else if(kind==='chain-challenge'){
   await p.getByRole('button',{name:'✓ Gültig',exact:true}).click();assert.equal(m.room.game.players[pid].ballot,true);
  }else{
   await visibleControl(p.getByRole('button',{name:'Bewertung festlegen',exact:true}));
   for(let page=0;page<2;page++){for(const row of await p.locator('[data-jury-word]').all())await row.getByRole('button',{name:'✓ Gültig',exact:true}).click();if(page===0)await p.getByRole('button',{name:'Nächste Begriffe auf der Bühne',exact:true}).click();}
   await p.getByRole('button',{name:'Bewertung festlegen',exact:true}).click();assert.equal(m.room.game.players[pid].submitted,true);
  }
  assert.equal(await p.evaluate(()=>document.documentElement.scrollTop),0);results.push({kind,width,count:12,...layout,nativeSubmit:true});await p.close();console.log('PASS',kind,width);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('outputs/qa/party-reviews/report.json',JSON.stringify({results,errors,scope:'Local Chromium, real engine review actions, 12 participants. Review deadlines held at 60 seconds for software rendering; no network timing acceptance.'},null,2));
}catch(error){for(const [i,p]of browser.contexts().flatMap(c=>c.pages()).entries())await p.screenshot({path:`outputs/qa/party-reviews/failure-${i}.png`}).catch(()=>{});throw error;}finally{await browser.close();}
