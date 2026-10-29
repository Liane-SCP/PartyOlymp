import assert from "node:assert/strict";
import fs from "node:fs";
import {build} from "esbuild";
import {chromium} from "../../.tools/qa/node_modules/playwright/index.mjs";
const bundle=await build({stdin:{contents:`export {MusicController} from './lib/music-controller'; export {musicProfiles} from './lib/game-music'; export {BossAudioController} from './lib/boss-audio'; export {sound,defaults} from './lib/audio';`,resolveDir:process.cwd()},bundle:true,format:"iife",globalName:"MusicQA",platform:"browser",write:false});
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage();await page.goto("about:blank");await page.addScriptTag({content:bundle.outputFiles[0].text});
  const result=await page.evaluate(async()=>{
    const rows=[];
    async function render(key,variant,muted=false,volume=0.6,boss=false) {
      const ctx=new OfflineAudioContext(2,48000*4,48000);
      Object.defineProperty(ctx,"state",{get:()=>"running"});
      const mix={music:boss?0:volume,effects:0,muted,ducked:false};
      const controller=boss?new MusicQA.BossAudioController(ctx,ctx.destination,key,()=>mix)
        :new MusicQA.MusicController(ctx,ctx.destination,key,()=>mix,false);
      if(boss){clearInterval(controller.timer);controller.timer=null;mix.music=volume;controller.refresh();}
      const stride=key==="colossus"?128:96;
      const p=MusicQA.musicProfiles[key];
      const base=boss?variant*stride:p.ambient?Math.ceil(variant*128/37)*37:variant*128;
      const e=boss?30/(key==="colossus"?84:key==="kraken"?94:108):30/p.bpm;
      for(let i=0;i<4;i++) {
        if(boss) controller[key](0.04+i*e,base+i,e);
        else controller.renderStep(0.04+i*e,base+i);
      }
      const rendered=await ctx.startRendering();
      const data=rendered.getChannelData(0);
      let energy=0,peak=0,hash=0;
      for(let i=0;i<data.length;i++){const x=data[i];energy+=x*x;peak=Math.max(peak,Math.abs(x));if(i%200===0)hash+=Math.round(x*1e6)*(i%31+1);}
      controller.stop();return {key,variant,muted,volume,energy,peak,hash};
    }
    for(const key of [...Object.keys(MusicQA.musicProfiles),"colossus","kraken","dragon"])
      for(let variant=0;variant<3;variant++)rows.push(await render(key,variant,false,0.6,["colossus","kraken","dragon"].includes(key)));
    for(const key of ["dice","timing","colossus","kraken","dragon"]) {
      const boss=["colossus","kraken","dragon"].includes(key);
      rows.push(await render(key,0,true,0.6,boss));rows.push(await render(key,0,false,0,boss));
    }
    // Repeated room snapshots keep the same score; game changes replace it.
    const s=MusicQA.sound;const ctx=new AudioContext();await ctx.resume();s.ctx=ctx;s.master=ctx.createGain();s.master.connect(ctx.destination);
    s.settings={...MusicQA.defaults,muted:false,music:0.2};
    s.music("playing","dice");const first=s.musicController;
    for(let i=0;i<20;i++)s.music("playing","dice");
    const stable=first===s.musicController;
    s.quietClock(true);await new Promise(r=>setTimeout(r,1200));const clockMuted=s.musicController.mix().muted&&s.musicController.output.gain.value<.001;s.quietClock(false);await new Promise(r=>setTimeout(r,600));const clockRestored=!s.musicController.mix().muted&&s.musicController.output.gain.value>.1;const clockQuiet=clockMuted&&clockRestored&&s.musicController===first;
    s.music("playing","cards");const switched=s.musicController.key==="cards"&&first.stopped;
    s.boss("colossus");const exclusive=s.musicController===null&&!!s.bossController;
    s.music("podium");s.boss(null);const returned=s.musicController.key==="podium";
    s.music("");const stopped=s.musicController===null;
    await new Promise(r=>setTimeout(r,500));await ctx.close();
    return {rows,stable,clockQuiet,switched,exclusive,returned,stopped};
  });
  for(const row of result.rows)assert.ok(row.muted||row.volume===0?row.energy===0:row.energy>0.01,JSON.stringify(row));
  for(const row of result.rows)assert.ok(row.peak<0.95,JSON.stringify(row));
  const audible=result.rows.filter(r=>!r.muted&&r.volume>0);
  for(const key of new Set(audible.map(r=>r.key)))assert.equal(new Set(audible.filter(r=>r.key===key).map(r=>r.hash)).size,3,key);
  for(const key of ["stable","clockQuiet","switched","exclusive","returned","stopped"])assert.equal(result[key],true,key);
  fs.mkdirSync("outputs/qa",{recursive:true});fs.writeFileSync("outputs/qa/music.json",JSON.stringify(result,null,2));
  console.log(`PASS: ${audible.length} rendered musical sections, mute/zero levels, bounded peaks, mode switching and boss exclusivity`);
} finally {await browser.close();}
