import assert from "node:assert/strict";
const url="http://127.0.0.1:5173/api/room";
async function api(body){const res=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const data=await res.json();assert.ok(res.ok,data.error);return data;}
const command=(s,action)=>api({...s,type:"action",requestId:crypto.randomUUID(),action});
const first=await api({type:"create",name:"Alpha",avatar:0}),a={code:first.room.code,playerId:first.playerId,token:first.token};
const members=[a];for(const name of ["Beta","Gamma"]){const p=await api({type:"join",code:a.code,name,avatar:1});members.push({code:a.code,playerId:p.playerId,token:p.token});}
const [_,b,c]=members;
await command(a,{type:"configure",selection:[{id:"chain",rounds:1,seconds:20}]});for(const s of members)await command(s,{type:"ready"});await command(a,{type:"start"});
await new Promise(r=>setTimeout(r,10100));
for(const s of members)await command(s,{type:"ready"});
const poll=async s=>(await api({...s,type:"poll"})).room;
const play=async(s,action)=>{const room=await poll(s);return command(s,{type:"game",phase:room.phaseKey,action:{...action,round:room.game.round,turn:room.game.turn}});};
await poll(a);await new Promise(r=>setTimeout(r,3200));
for(const s of members)await play(s,{type:"suggestTopic",name:"Automarken"});
const wheel=(await poll(a)).game.topicWheel;
for(const s of members)assert.deepEqual((await poll(s)).game.topicWheel,wheel);
await new Promise(r=>setTimeout(r,10100));
for(const s of members)assert.equal((await poll(s)).game.topic.name,"Automarken");
await play(a,{type:"answer",answer:"BMW"});await play(b,{type:"approve"});await play(c,{type:"approve"});
await new Promise(r=>setTimeout(r,3100));await play(b,{type:"answer",answer:"B.M.W."});
assert.equal((await poll(a)).game.roster[b.playerId].alive,false);
await new Promise(r=>setTimeout(r,3100));await play(c,{type:"answer",answer:"Banane"});await play(a,{type:"challenge"});
let room=await poll(b);assert.equal(room.game.stage,"challenge");assert.equal(room.game.verdict,null);assert.equal(room.game.mine.ballot,null);
await play(b,{type:"vote",valid:false});assert.equal((await poll(a)).game.roster[c.playerId].alive,false);
await new Promise(r=>setTimeout(r,3100));room=await poll(a);
assert.equal(room.game.stage,"roundReveal");assert.equal(room.game.reveal.winner,a.playerId);assert.equal(room.game.scores[a.playerId],100);
console.log("PASS: three sessions, ordered turns, automatic duplicate elimination, secret challenge vote by eliminated player, correct winner.");
