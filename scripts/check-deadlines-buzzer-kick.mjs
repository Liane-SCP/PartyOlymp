import fs from "node:fs";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {chromium} from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({entryPoints:["tests/deadline-browser-engine.ts"],outfile:"outputs/deadline-engine.mjs",bundle:true,platform:"node",format:"esm"});
const {match,modeWheel,roomAction,tickRoom,phaseKey,publicRoom,context,games}=await import("../outputs/deadline-engine.mjs");
const browser=await chromium.launch({headless:true,args:["--autoplay-policy=no-user-gesture-required"]});const errors=[];
fs.mkdirSync("outputs/qa",{recursive:true});
async function open(m,width=1440,muted=true) {
 const page=await browser.newPage({viewport:{width,height:1100}});
 page.on("pageerror",e=>errors.push(e.message));
 await page.routeWebSocket("**/api/live",ws=>ws.close());
 await page.addInitScript(({id,muted})=>{
  localStorage.setItem("olymp.session",JSON.stringify({code:"QA1234",playerId:id,token:"fixture"}));localStorage.setItem("olymp.settings",JSON.stringify({muted,music:0}));
  window.__tones=[];
  const original=AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator=function(){const osc=original.call(this),originalSet=osc.frequency.setValueAtTime.bind(osc.frequency);osc.frequency.setValueAtTime=(frequency,time)=>{window.__tones.push({frequency,time,type:osc.type});return originalSet(frequency,time);};return osc;};
 },{id:m.first,muted});
 await page.route("**/api/room",async route=>{
  const body=route.request().postDataJSON();const r=m.room;
  r.players.filter(p=>!p.kicked).forEach(p=>p.lastSeen=Date.now());
  tickRoom(r,Date.now());
  try {if(body.action)roomAction(r,r.players.find(p=>p.id===m.first),body.action,Date.now());}
  catch(e){errors.push(e.message);}
  await route.fulfill({json:{playerId:m.first,room:publicRoom(r,m.first,Date.now())}});
 });
 await page.goto("http://127.0.0.1:5173");await page.locator(".crew-list").waitFor({state:"attached"});return page;
}
async function draft(m,page,input,expected) {
 await input();
 await page.waitForFunction(()=>true);
 for(let i=0;i<40&&!m.room.game.players[m.first].timeoutInput;i++)await page.waitForTimeout(50);
 if(!m.room.game.players[m.first].timeoutInput){await page.screenshot({path:"outputs/qa/deadline-failure.png"});console.log(await page.locator("input").evaluateAll(xs=>xs.map(x=>({label:x.getAttribute('aria-label'),value:x.value}))),await page.locator(".error").allTextContents());}
 assert.equal(m.room.game.players[m.first].timeoutInput?.action.type,expected,JSON.stringify({game:m.room.game.id,errors}));
 assert.ok(!m.room.game.players[m.first].submitted);
}
try {
 for(const [id,fill,type] of [
  ["herd",p=>p.getByLabel("Deine geheime Antwort").fill("Mango"),"answer"],
  ["size",p=>p.locator('.size-slider input').fill("5"),"answer"],
  ["blackjack",p=>p.getByRole("button",{name:"75 Chips",exact:true}).click(),"bet"],
  ["auction",p=>p.getByLabel("Eigene Kategorie").fill("Computerspiele"),"topic"],
  ["chain",p=>p.getByLabel("Deine Kategorie").fill("Computerspiele"),"suggestTopic"],
  ["dragon",p=>p.getByLabel("Preisschätzung in Euro").fill("125,50"),"estimate"],
 ]) {
  const m=match(id,3);
  if(id==="dragon")games[id].tick(m.room.game,context(m.room,m.room.game.deadline));
  if(id==="auction")m.room.game.public.setter=m.first;
  const page=await open(m,390);await draft(m,page,()=>fill(page),type);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.screenshot({path:`outputs/qa/deadline-${id}.png`});await page.close();
 }
 const pixel=match("picture",3),p=await open(pixel);
 assert.equal(await p.getByLabel("Deine Antwort").count(),0);
 await p.getByRole("button",{name:"BUZZERN!"}).click();
 await draft(pixel,p,()=>p.getByLabel("Deine Antwort").fill(pixel.room.game.secret.item.answer),"answer");
 pixel.room.game.public.buzzDeadline=Date.now()+1000;
 await p.locator(".deadline-warning").waitFor();await p.locator(".round-reveal").waitFor({timeout:15000});
 assert.ok(pixel.room.game.players[pixel.first].correct);await p.close();
 const dice=match("dice",3),r=dice.room;
 r.game.players[r.players[1].id].sheet[0]=3;r.game.players[r.players[2].id].sheet[1]=10;
 const d=await open(dice);
 await d.getByRole("button",{name:"Crew & Ton",exact:true}).click();
 const boxes=await d.locator(".score-sheet > button").evaluateAll(bs=>bs.map(b=>({x:b.getBoundingClientRect().x,y:b.getBoundingClientRect().y})));
 assert.equal(boxes.length,13);assert.ok(boxes.every(b=>Math.abs(b.x-boxes[0].x)<1));assert.ok(boxes.every((b,i)=>!i||b.y>boxes[i-1].y));
 const names=(await d.locator(".crew-list .player-info strong").allTextContents()).map(n=>n.trim().replace(/\s+DU$/,""));
 assert.deepEqual(names,["Crew 2","Crew 1","Nova"]);
 await d.getByRole("button",{name:"Crew 1 aus dem Raum entfernen"}).click();
 await d.waitForFunction(()=>document.querySelectorAll('.player-kick').length===1);
 assert.ok(r.players[1].kicked);await d.screenshot({path:"outputs/qa/deadline-dice.png"});await d.close();
 const w=modeWheel(21),wp=await open(w);
 await wp.locator(".wheel-disc").waitFor();
 const frames=await wp.locator(".wheel-disc").evaluate(el=>new Promise(resolve=>{
  const values=[];const start=performance.now();
  function sample(){values.push(el.style.transform);if(performance.now()-start<600)requestAnimationFrame(sample);else resolve(values);}
  requestAnimationFrame(sample);
 }));
 assert.ok(new Set(frames).size>=15,`Only ${new Set(frames).size} distinct animation frames`);
 await wp.locator(".wheel-show.is-settled").waitFor();
 assert.equal(await wp.locator(".wheel-result strong").innerText(),w.room.draw.entries[w.room.draw.selected].name);await wp.close();
 const audio=match("herd",3);audio.room.game.deadline=Date.now()+11500;
 const ap=await open(audio,390,false);
 await draft(audio,ap,()=>ap.getByLabel("Deine geheime Antwort").fill("Mango"),"answer");
 await ap.locator(".round-reveal").waitFor({timeout:16000});
 const tones=await ap.evaluate(()=>window.__tones.filter(t=>t.type==="triangle"));
 assert.ok(tones.some(t=>t.frequency===980),"Urgent countdown sound did not play");
 assert.ok(tones.some((t,i)=>t.frequency===880&&tones[i+1]?.frequency===660&&tones[i+2]?.frequency===440),"Deadline ending chord did not play");
 assert.equal(audio.room.game.players[audio.first].answer,"Mango");await ap.close();
 assert.deepEqual(errors,[]);console.log("PASS: mobile draft controls, buzzer timeout, sorted Kniffel crew, single-row categories, host kick, smooth wheel frames, audible warnings and ending chord.");
} finally {await browser.close();}
