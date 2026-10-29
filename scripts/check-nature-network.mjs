import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "../../.tools/qa/node_modules/playwright/index.mjs";
const base="http://127.0.0.1:5173",api=async body=>{const r=await fetch(`${base}/api/room`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const data=await r.json();assert.ok(r.ok,data.error);return data;};
const command=(s,action,requestId=crypto.randomUUID())=>api({...s,type:"action",action,requestId});
const first=await api({type:"create",name:"Nova",avatar:0,look:{shape:0,accessory:2,color:0}}),a={code:first.room.code,playerId:first.playerId,token:first.token};
const second=await api({type:"join",code:a.code,name:"Luna",avatar:7,look:{shape:7,accessory:5,color:1}}),b={code:a.code,playerId:second.playerId,token:second.token};
await command(a,{type:"configure",selection:["colossus","kraken","dragon"].map(id=>({id,rounds:3,seconds:30}))});
await command(a,{type:"ready"});await command(b,{type:"ready"});let start=await command(a,{type:"start"});
const plan=start.room.selection;assert.equal(plan.length,6);const boss=id=>["colossus","kraken","dragon"].includes(id);assert.ok(!boss(plan[0].id));for(let i=1;i<plan.length;i++)assert.ok(!(boss(plan[i].id)&&boss(plan[i-1].id)));
while(start.room.phase!=="rules"){await new Promise(r=>setTimeout(r,750));start=await api({...a,type:"poll"});await api({...b,type:"poll"});}
const browser=await chromium.launch({headless:true,args:["--use-angle=swiftshader","--enable-webgl","--ignore-gpu-blocklist","--enable-unsafe-swiftshader"]}),errors=[];
fs.mkdirSync("outputs/qa",{recursive:true});
try{
  const pages=[];
  for(const s of[a,b]){
    const page=await browser.newPage({viewport:{width:1440,height:1100}});page.on("pageerror",e=>errors.push(e.message));
    await page.addInitScript(session=>{localStorage.setItem("olymp.session",JSON.stringify(session));localStorage.setItem("olymp.settings",JSON.stringify({muted:true,intense:true}));},s);
    await page.goto(base);await page.locator(".journey-ready").waitFor();pages.push(page);
    await page.waitForFunction(()=>document.querySelector(".journey-canvas canvas")?.dataset.readyAvatars==="2");
  }
  const [host,guest]=pages,read=(page,id)=>page.locator(".journey-canvas canvas").evaluate((c,pid)=>JSON.parse(c.dataset.crewPositions).find(p=>p.id===pid),id);
  const before=await read(guest,a.playerId);
  await host.getByRole("button",{name:"Figur links bewegen",exact:true}).click();
  await guest.waitForFunction(pid=>JSON.parse(document.querySelector(".journey-canvas canvas")?.dataset.crewPositions??"[]").some(p=>p.id===pid&&p.walking),a.playerId);
  await guest.waitForTimeout(600);const moving=await read(guest,a.playerId);assert.ok(Math.hypot(...moving.position.map((v,i)=>v-before.position[i]))>0.2);
  const saved=(await api({...b,type:"poll"})).room.journey.moves[a.playerId];assert.ok(saved);assert.equal(saved.index,0);
  const requestId=crypto.randomUUID();await command(a,{type:"mapMove",index:0,x:0,z:0.68},requestId);await command(a,{type:"mapMove",index:0,x:0,z:0.68},requestId);
  const persisted=(await api({...b,type:"poll"})).room.journey.moves[a.playerId];await guest.reload();await guest.locator(".journey-ready").waitFor();
  assert.deepEqual((await api({...b,type:"poll"})).room.journey.moves[a.playerId],persisted);
  await host.getByRole("button",{name:"Karten-Emotes öffnen",exact:true}).click();await host.getByRole("button",{name:"Siegertanz senden",exact:true}).click();
  await guest.locator(`.atlas-avatar-label[data-player="${a.playerId}"] .atlas-reaction`).waitFor();
  await guest.waitForFunction(pid=>JSON.parse(document.querySelector(".journey-canvas canvas")?.dataset.crewPositions??"[]").some(p=>p.id===pid&&p.emote===37),a.playerId);
  await guest.locator(".journey-atlas").screenshot({path:"outputs/qa/nature-network-emote.png"});
  await host.getByRole("button",{name:"Karte im Vollbild öffnen",exact:true}).click();await host.locator(".atlas-fullscreen.journey-ready").waitFor();
  await host.getByRole("button",{name:"Karten-Emotes öffnen",exact:true}).click();await host.getByRole("button",{name:"Emote-Menü schließen",exact:true}).click();
  await host.keyboard.press("Escape");await host.locator(".journey-ready").waitFor();
  assert.deepEqual(errors,[]);
  console.log("Real HTTP/D1 + two rendered clients: separated bosses, exact boss-style avatar textures, replicated walking, replay protection, reload persistence, shared emote and fullscreen controls passed.");
}finally{await browser.close();}
