import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/size-audio-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/size-audio-fixture.mjs');
const point=(actual,expected)=>assert.ok(actual.every((n,i)=>Math.abs(n-expected[i])<1e-5),JSON.stringify({actual,expected}));
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}),rows=[],errors=[];
const cases=[{width:1440},{width:390},{width:1440,reduced:true},{width:390,reduced:true},{width:1440,muted:true},{width:390,effects:0},{width:1440,live:true}];
try{for(const config of cases){
 const {width,reduced=false,muted=false,effects=.8}=config,m=fixture('size',12),g=m.room.game,at=Date.now()+1000;
 g.public.item={name:'Container',measure:'Außenlänge'};g.secret.item={name:'Container',measure:'Außenlänge',cm:605.8,source:'https://example.invalid/test'};g.public.reference={name:'Kreditkarte',icon:'Kreditkarte',cm:8.56};if(!config.live)m.resolve();g.public.revealStartedAt=at;g.deadline=at+600000;
 const p=await browser.newPage({viewport:{width,height:1100},hasTouch:width<600});p.qaNow=at;p.on('pageerror',e=>errors.push(e.message));await p.routeWebSocket('**/api/live',w=>w.close());
 await p.addInitScript(({pid,at,reduced,muted,effects})=>{
  localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:pid,token:'fixture'}));
  if(!sessionStorage.getItem('__sizeVisited'))localStorage.setItem('olymp.settings',JSON.stringify({muted,music:0,effects,motion:reduced}));sessionStorage.setItem('__sizeVisited','1');localStorage.setItem('olymp.graphics','low');
  window.__sizeNow=Number(sessionStorage.getItem('__sizeNow'))||at;Date.now=()=>window.__sizeNow;window.__sizeContexts=[];window.__sizePanners=[];window.__sizeOsc=[];window.__sizeGains=[];window.__sizeSources=[];
  const Native=AudioContext;window.AudioContext=class extends Native{
   constructor(...a){super(...a);window.__sizeContexts.push(this);}
   createGain(){const node=super.createGain();window.__sizeGains.push(node);return node;}
   createOscillator(){const node=super.createOscillator(),row={node,frequencies:[],ended:false},set=node.frequency.setValueAtTime.bind(node.frequency);node.frequency.setValueAtTime=(v,...a)=>{row.frequencies.push(v);return set(v,...a);};node.addEventListener('ended',()=>row.ended=true);window.__sizeOsc.push(row);return node;}
   createBufferSource(){const node=super.createBufferSource(),row={node,ended:false};node.addEventListener('ended',()=>row.ended=true);window.__sizeSources.push(row);return node;}
   createPanner(){const node=super.createPanner(),row={node,position:null,connected:false},connect=node.connect.bind(node),disconnect=node.disconnect.bind(node);node.connect=(...a)=>{row.position=[node.positionX.value,node.positionY.value,node.positionZ.value];row.connected=true;return connect(...a);};node.disconnect=(...a)=>{row.connected=false;return disconnect(...a);};window.__sizePanners.push(row);return node;}
  };
 },{pid:m.first,at,reduced,muted,effects});
 await p.route('**/api/room',r=>{const v=m.view();v.room.serverTime=p.qaNow;return r.fulfill({json:v});});
 async function ready(){await p.locator('.adventure-ready').waitFor({timeout:60000});await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('.adventure-canvas canvas')?.dataset.readyAvatars==='12');}
 async function time(t){p.qaNow=t;await p.evaluate(t=>{window.__sizeNow=t;sessionStorage.setItem('__sizeNow',String(t));},t);await p.locator('.adventure-stage').scrollIntoViewIfNeeded();await p.waitForFunction(age=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.sizeMuseum??'null')?.age===age,Math.max(0,t-at));}
 async function visible(value){await p.waitForFunction(value=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.sizeComparison??'null')?.actualVisible===value,value);}
 async function warm(silent=muted){await p.locator('.adventure-canvas canvas').click({position:{x:20,y:150}});if(!silent)await p.waitForFunction(()=>window.__sizeContexts[0]?.state==='running');}
 async function fx(value){await p.getByRole('button',{name:'Einstellungen',exact:true}).click();const dialog=p.getByRole('dialog',{name:'Einstellungen',exact:true}),slider=dialog.getByRole('slider',{name:'Spieleffekte',exact:true});await slider.focus();await slider.press(value===0?'Home':'End');await dialog.getByRole('button',{name:'Schließen',exact:true}).click();}
 async function selected(index){const before=await p.evaluate(()=>window.__sizePanners.length);await p.getByRole('combobox',{name:'Öffentlichen Größentipp auswählen',exact:true}).selectOption(m.room.players[index].id);await p.waitForFunction(index=>JSON.parse(document.querySelector('.adventure-canvas canvas').dataset.sizeMuseum).selectedIndex===index,index);return before;}
 await p.goto('http://127.0.0.1:5173');await ready();assert.equal(await p.evaluate(()=>window.__sizeContexts.length),0);await visible(false);await warm();if(muted)assert.equal(await p.evaluate(()=>window.__sizeContexts.length),0);if(config.live){m.resolve();g.public.revealStartedAt=at;g.deadline=at+600000;await p.locator('.round-reveal').waitFor();await visible(false);}
 await time(at+474);await visible(false);assert.equal(await p.evaluate(()=>window.__sizePanners.length),0);assert.equal(await p.evaluate(()=>window.__sizeOsc.some(row=>row.frequencies.some(f=>[392,587.33,783.99,98,55].includes(f)))),false,'No generic or early reveal fanfare');
 const suffix=`${width}-${config.live?'live':reduced?'reduced':muted?'muted':effects===0?'fx0':'normal'}`;
 await p.locator('.adventure-stage').screenshot({path:`outputs/qa/size-reveal-before-${suffix}.png`});
 await time(at+475);await visible(true);const audible=!muted&&effects>0;
 if(audible){await p.waitForFunction(()=>window.__sizePanners.length===1);point(await p.evaluate(()=>window.__sizePanners[0].position),[0,3,-1.4]);const frequencies=await p.evaluate(()=>window.__sizeOsc.flatMap(row=>row.frequencies));assert.ok(frequencies.includes(392)&&frequencies.includes(587.33));}
 else assert.equal(await p.evaluate(()=>window.__sizePanners.length),0);
 await p.locator('.adventure-stage').screenshot({path:`outputs/qa/size-reveal-after-${suffix}.png`});
 await time(at+300);await visible(false);await time(at+600);await visible(true);assert.equal(await p.evaluate(()=>window.__sizePanners.length),audible?1:0,'Clock correction must not replay the museum cue');
 await time(at+5000);await visible(true);
 if(muted){await p.getByRole('button',{name:'Ton einschalten',exact:true}).click();await p.waitForFunction(()=>window.__sizeContexts[0]?.state==='running');}
 if(effects===0)await fx(1);
 await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>window.__sizePanners.length),audible?1:0,'Enabling sound after the boundary must not replay it');
 const count=await selected(1);await p.waitForFunction(count=>window.__sizePanners.length===count+1,count);point(await p.evaluate(()=>window.__sizePanners.at(-1).position),[0,.82,-1.4]);
 await p.getByRole('button',{name:'Stummschalten',exact:true}).click();await p.waitForFunction(()=>window.__sizeGains[0].gain.value<.0001);await time(at+5200);const mutedCount=await selected(2);assert.equal(await p.evaluate(()=>window.__sizePanners.length),mutedCount);
 await p.getByRole('button',{name:'Ton einschalten',exact:true}).click();await fx(0);await time(at+5400);const silentCount=await selected(3);assert.equal(await p.evaluate(()=>window.__sizePanners.length),silentCount);await fx(1);
 await time(at+5600);const finalCount=await p.evaluate(()=>window.__sizePanners.length);const wasConnected=await p.getByRole('combobox',{name:'\u00d6ffentlichen Gr\u00f6\u00dfentipp ausw\u00e4hlen',exact:true}).evaluate((node,id)=>{node.value=id;node.dispatchEvent(new Event('change',{bubbles:true}));const connected=window.__sizePanners.at(-1)?.connected;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));return connected;},m.room.players[4].id);assert.equal(wasConnected,true,'Hide must interrupt an active cue');assert.equal(await p.evaluate(()=>window.__sizePanners.length),finalCount+1);assert.equal(await p.evaluate(()=>window.__sizeContexts.length),1);
 await p.waitForFunction(()=>window.__sizePanners.every(row=>!row.connected)&&window.__sizeSources.every(row=>row.ended)&&window.__sizeOsc.every(row=>row.ended));
 await p.reload();await ready();await visible(true);assert.equal(await p.evaluate(()=>window.__sizeContexts.length),0);await warm(false);await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>window.__sizePanners.length),0,'A rejoined museum cannot replay a historical reveal');assert.equal(await p.evaluate(()=>window.__sizeOsc.length),0,'No unpositioned historical fanfare on rejoin');
 rows.push({width,reduced,live:!!config.live,initialMuted:muted,initialEffects:effects,boundary:475,audible,clockCorrection:true,selectionAnchor:[0,.82,-1.4],liveMute:true,liveEffectsZero:true,oneContext:true,activeCueCancellation:true,hiddenCleanup:true,rejoinNoReplay:true});
 console.log(`PASS size audio ${suffix}: shared model/audio boundary, clock correction, live mute/effects, spatial selection, cleanup and silent rejoin`);await p.close();
}assert.deepEqual(errors,[]);fs.writeFileSync('outputs/qa/size-audio.json',JSON.stringify({rows,errors,limit:'Instrumented Chromium Web Audio with controlled public reveal clock; no physical-device, speaker or hearing acceptance'},null,2));}finally{await browser.close();}
