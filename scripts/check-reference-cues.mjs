import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';
const bundle=await build({stdin:{contents:"export {sound,defaults} from './lib/audio';",resolveDir:process.cwd()},bundle:true,format:'iife',globalName:'CueQA',platform:'browser',write:false});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();await page.goto('about:blank');await page.addScriptTag({content:bundle.outputFiles[0].text});
 const rows=await page.evaluate(async()=>{
  const result=[];
  for(const cue of['diceCombo','raceOvertake','checkoutScan','checkoutClose','checkoutOver','checkoutSuccess','checkoutComplete','raceFinish'])for(const mode of['audible','muted','zero-effects']){
   const ctx=new OfflineAudioContext(2,96000,48000);Object.defineProperty(ctx,'state',{get:()=> 'running'});
   const s=CueQA.sound;s.ctx=ctx;s.master=ctx.createGain();s.master.connect(ctx.destination);s.last={};s.active=0;s.settings={...CueQA.defaults,master:.5,effects:mode==='zero-effects'?0:.7,muted:mode==='muted'};s.play(cue);
   const rendered=await ctx.startRendering(),data=rendered.getChannelData(0);let peak=0,energy=0,hash=0;for(let i=0;i<data.length;i++){peak=Math.max(peak,Math.abs(data[i]));energy+=data[i]*data[i];if(i%23===0)hash=((hash*31)^(Math.round(data[i]*32767)))>>>0;}
   result.push({cue,mode,peak,rms:Math.sqrt(energy/data.length),hash});
  }
  return result;
 });
 for(const row of rows){assert.ok(row.peak<.9,`${row.cue}: clipping`);if(row.mode==='audible')assert.ok(row.rms>.0001,`${row.cue}: silent`);else assert.equal(row.peak,0,`${row.cue}/${row.mode}: not silent`);}
 assert.equal(new Set(rows.filter(r=>r.mode==='audible').map(r=>r.hash)).size,8,'Each mechanism needs a distinct cue');
 fs.writeFileSync('outputs/qa/reference-cues.json',JSON.stringify({rows,limit:'Offline signal/mute checks; not a listening or spatial-mix acceptance'},null,2));console.log('PASS 8 distinct cues, bounded peaks, complete mute and zero-effects silence');
}finally{await browser.close();}
