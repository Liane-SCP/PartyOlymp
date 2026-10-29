import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
await build({stdin:{contents:"export {RaceMotorAudio} from './lib/race-motor-audio';export {Sound,defaults} from './lib/audio';",resolveDir:process.cwd(),loader:'ts'},outfile:'outputs/race-motor-browser.mjs',bundle:true,platform:'browser',format:'esm'});
await build({entryPoints:['tests/adventure-browser-engine.ts'],outfile:'outputs/race-motor-fixture.mjs',bundle:true,platform:'node',format:'esm'});
const {fixture}=await import('../outputs/race-motor-fixture.mjs');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const errors=[],results=[];
function instrumentation(){
 window.__motorContexts=[];window.__motorOsc=[];window.__motorPanners=[];const Native=AudioContext;
 window.AudioContext=class extends Native{
  constructor(...args){super(...args);window.__motorContexts.push(this);}
  createOscillator(){const source=super.createOscillator(),row={source,connected:false,ended:false},connect=source.connect.bind(source),disconnect=source.disconnect.bind(source);source.connect=(...args)=>{row.connected=true;return connect(...args);};source.disconnect=(...args)=>{row.connected=false;return disconnect(...args);};source.addEventListener('ended',()=>row.ended=true);window.__motorOsc.push(row);return source;}
  createPanner(){const panner=super.createPanner(),row={panner,connected:false},connect=panner.connect.bind(panner),disconnect=panner.disconnect.bind(panner);panner.connect=(...args)=>{row.connected=true;return connect(...args);};panner.disconnect=(...args)=>{row.connected=false;return disconnect(...args);};window.__motorPanners.push(row);return panner;}
 };
}
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(instrumentation);
 await page.route('**/__qa-motor-module.mjs',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('outputs/race-motor-browser.mjs','utf8')}));
 await page.route('**/__qa-motor',route=>route.fulfill({contentType:'text/html',body:'<button id="start">Motorprobe starten</button><script type="module">const {RaceMotorAudio,Sound,defaults}=await import("/__qa-motor-module.mjs");window.api={RaceMotorAudio,Sound,defaults};document.querySelector("button").onclick=()=>{window.ctx=new AudioContext();window.output=ctx.createGain();output.gain.value=.5;output.connect(ctx.destination);window.analyser=ctx.createAnalyser();analyser.fftSize=2048;output.connect(analyser);window.mix={effects:.7,muted:false};window.motor=new RaceMotorAudio(ctx,output,()=>mix);};</script>'}));
 await page.goto('http://127.0.0.1:5173/__qa-motor');await page.waitForFunction(()=>window.api);assert.equal(await page.evaluate(()=>window.__motorContexts.length),0);await page.getByRole('button',{name:'Motorprobe starten'}).click();await page.waitForFunction(()=>window.ctx?.state==='running');
 await page.evaluate(()=>{window.drivers=Array.from({length:12},(_,i)=>({id:'p'+i,position:[i*2,0,-5],power:0,own:i===11}));motor.update(drivers,[0,0,0]);});
 let stats=await page.evaluate(()=>motor.stats());assert.equal(stats.slots,4);assert.equal(stats.voices,8);assert.ok(stats.active.some(row=>row.id==='p11'));
 await page.waitForTimeout(180);const idle=await page.evaluate(()=>{const values=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(values);return Math.sqrt(values.reduce((sum,n)=>sum+n*n,0)/values.length);});assert.ok(idle>1e-5&&idle<.1,`Unexpected idle RMS ${idle}`);
 await page.evaluate(()=>{drivers.forEach(row=>row.power=1);motor.update(drivers,[0,0,0]);});await page.waitForTimeout(180);stats=await page.evaluate(()=>motor.stats());assert.ok(stats.active.every(row=>row.frequency>=143));
 const rev=await page.evaluate(()=>{const values=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(values);return Math.sqrt(values.reduce((sum,n)=>sum+n*n,0)/values.length);});assert.ok(rev>1e-5&&rev<.1);
 await page.evaluate(()=>{for(let i=0;i<200;i++)motor.update(drivers,[(i%12)*2,0,0]);});assert.equal(await page.evaluate(()=>window.__motorOsc.length),8,'Passing rivals must reuse the bounded pool');
 await page.evaluate(()=>{mix.muted=true;motor.refresh();});await page.waitForTimeout(140);const muted=await page.evaluate(()=>{const v=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(v);return Math.max(...v.map(Math.abs));});assert.ok(muted<1e-5,`Muted peak ${muted}`);
 await page.evaluate(()=>{mix.muted=false;mix.effects=0;motor.refresh();});assert.equal(await page.evaluate(()=>motor.stats().gain),0);
 await page.evaluate(()=>motor.stop());await page.waitForTimeout(120);assert.ok(await page.evaluate(()=>__motorOsc.every(row=>row.ended&&!row.connected)&&__motorPanners.every(row=>!row.connected)));
 // Same real context through repeated scene owners; effects mute must not create another context.
 await page.evaluate(()=>{window.sound=new api.Sound();sound.ctx=ctx;sound.master=output;sound.settings={...api.defaults,music:0,effects:.7,muted:false};window.frame={listener:[0,0,0],forward:[0,0,-1],up:[0,1,0],anchors:{},motors:drivers};});
 for(let i=0;i<12;i++){await page.evaluate(()=>{sound.adventure('typer');sound.sceneFrame('typer',frame);});assert.equal(await page.evaluate(()=>sound.raceAudioStats().voices),8);await page.evaluate(()=>sound.adventure('dice'));await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>sound.raceAudioStats().voices),0);}
 await page.evaluate(()=>{sound.adventure('typer');sound.sceneFrame('typer',frame);sound.settings={...sound.settings,effects:0};});assert.equal(await page.evaluate(()=>sound.raceAudioStats().gain),0);
 await page.evaluate(()=>{sound.settings={...sound.settings,effects:.7};sound.sceneFrame('typer',{...frame,motors:[]});sound.adventure(null);});await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>__motorContexts.length),1);assert.ok(await page.evaluate(()=>__motorOsc.every(row=>row.ended&&!row.connected)&&__motorPanners.every(row=>!row.connected)));
 results.push({case:'native synthesis',slots:4,voices:8,idleRms:idle,revRms:rev,mutedPeak:muted,rivalUpdates:200,ownerSwitches:12,contexts:1,allSourcesReleased:true});console.log('PASS native motor signal: idle/rev/mute, 8 reused voices, 12 owners and complete release');await page.close();

 for(const width of[1440,390]){
  const m=fixture('typer',12),g=m.room.game,page=await browser.newPage({viewport:{width,height:width===390?844:1100},hasTouch:width===390});page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(instrumentation);await page.routeWebSocket('**/api/live',socket=>socket.close());
  await page.addInitScript(id=>{localStorage.setItem('olymp.session',JSON.stringify({code:'ADV234',playerId:id,token:'fixture'}));localStorage.setItem('olymp.settings',JSON.stringify({muted:false,music:0,effects:.7}));localStorage.setItem('olymp.graphics','low');},m.first);
  await page.route('**/api/room',route=>{const body=route.request().postDataJSON();if(body.type==='action')m.act(body.action);return route.fulfill({json:m.view()});});
  await page.goto('http://127.0.0.1:5173');await page.locator('.adventure-ready').waitFor({timeout:60000});
  const input=page.getByRole('textbox',{name:'Renntext abtippen',exact:true});await input.click();await input.pressSequentially(g.public.text.slice(0,24),{delay:70});
  await page.waitForFunction(id=>{const c=document.querySelector('.adventure-canvas canvas'),audio=JSON.parse(c?.dataset.motorAudio??'null');return audio?.voices===8&&audio.active.some(row=>row.id===id&&row.frequency>65);},m.first);
  const audio=await page.locator('.adventure-canvas canvas').evaluate(c=>({stats:JSON.parse(c.dataset.motorAudio),motors:JSON.parse(c.dataset.raceMotors)}));assert.equal(audio.motors.length,12);assert.equal(audio.stats.active.length,4);
  for(const row of audio.stats.active){const actual=audio.motors.find(motor=>motor.id===row.id);assert.ok(actual);assert.ok(row.position.every((n,i)=>Math.abs(n-actual.position[i])<.001));}
  assert.equal(await page.evaluate(()=>__motorContexts.length),1);
  await page.locator('.adventure-canvas').evaluate(node=>node.style.display='none');
  await page.waitForFunction(()=>__motorPanners.filter(row=>row.connected&&row.panner.rolloffFactor===.8).length===0);
  await page.locator('.adventure-canvas').evaluate(node=>node.style.display='');
  await page.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.motorAudio??'null')?.voices===8&&__motorPanners.filter(row=>row.connected&&row.panner.rolloffFactor===.8).length===4);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>__motorPanners.filter(row=>row.connected&&row.panner.rolloffFactor===.8).length===0);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>__motorPanners.filter(row=>row.connected&&row.panner.rolloffFactor===.8).length===4);assert.equal(await page.evaluate(()=>__motorContexts.length),1);
  for(const id of m.room.participantIds)m.command(id,{type:'game',action:{type:'type',text:g.public.text,seq:10000,round:1}});
  await page.waitForFunction(()=>JSON.parse(document.querySelector('.adventure-canvas canvas')?.dataset.motorAudio??'null')?.voices===0);await page.waitForTimeout(120);
  // A legitimate finish fanfare can still own its cue panner. Motor panners use
  // the stricter .8 rolloff; one-shot cue panners use the existing .15 rolloff.
  assert.equal(await page.evaluate(()=>__motorPanners.filter(row=>row.connected&&row.panner.rolloffFactor===.8).length),0);
  await page.locator('.adventure-stage').screenshot({path:`outputs/qa/race-motor-${width}.png`});
  results.push({case:'rendered race',width,drivers:12,contexts:1,voices:audio.stats.voices,anchorsFollowVehicles:true,offscreenReleased:true,documentHiddenReleased:true,sameContextAfterResume:true,finishReleased:true});await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('outputs/qa/race-motor-audio.json',JSON.stringify({results,errors,limits:'Real native Web Audio signal/node tests and two actual rendered twelve-player engine fixtures. Browser audio output is programmatically measured, not a hearing or physical-device performance acceptance. No full live multiplayer race.'},null,2));console.log('PASS race motors: native signal/mute, bounded reused voices, 12 owner switches, rendered vehicle anchors, typing acceleration and finish release');
}finally{await browser.close();}
