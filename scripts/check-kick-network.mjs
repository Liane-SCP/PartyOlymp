import assert from "node:assert/strict";
const url="http://127.0.0.1:5173/api/room";
async function api(body,ok=true){const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),data=await response.json();assert.equal(response.ok,ok,data.error);return data;}
const session=d=>({code:d.room.code,playerId:d.playerId,token:d.token});
const a=session(await api({type:"create",name:"Kick QA Host",avatar:0}));
const b=session(await api({type:"join",code:a.code,name:"Kick QA Guest",avatar:1}));
const command=(s,action,ok=true)=>api({...s,type:"action",requestId:crypto.randomUUID(),action},ok);
await command(b,{type:"kick",player:a.playerId},false);await command(a,{type:"kick",player:a.playerId},false);
const ws=new WebSocket("ws://127.0.0.1:5173/api/live");
const connected=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error("WebSocket did not connect")),10000);ws.addEventListener("open",()=>ws.send(JSON.stringify(b)));ws.addEventListener("message",event=>{if(JSON.parse(event.data).type==="connected"){clearTimeout(timer);resolve();}});});
await connected;
const frames=setInterval(()=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:"frame"}));},450);
const closed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.close();reject(Error("Kicked WebSocket remained open"));},10000);ws.addEventListener("close",event=>{clearTimeout(timer);resolve(event.code);});});
await command(a,{type:"kick",player:b.playerId});assert.equal(await closed,1008);clearInterval(frames);
await api({...b,type:"poll"},false);await command(b,{type:"ready"},false);
const host=await api({...a,type:"poll"});assert.ok(!host.room.players.some(p=>p.id===b.playerId));
console.log("PASS: host-only kick, self-kick rejected, WebSocket closed, kicked token rejected by HTTP and room remains usable.");
