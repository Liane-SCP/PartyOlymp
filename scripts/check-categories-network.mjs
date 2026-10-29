import assert from "node:assert/strict";
const url="http://127.0.0.1:5173/api/room";
async function api(body){const res=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const data=await res.json();assert.ok(res.ok,data.error);return data;}
const command=(s,action)=>api({...s,type:"action",requestId:crypto.randomUUID(),action});
const first=await api({type:"create",name:"Alpha",avatar:0}),a={code:first.room.code,playerId:first.playerId,token:first.token};
const second=await api({type:"join",code:a.code,name:"Beta",avatar:1}),b={code:a.code,playerId:second.playerId,token:second.token};
await command(a,{type:"configure",selection:[{id:"categories",rounds:1,seconds:90}]});
await command(a,{type:"ready"});await command(b,{type:"ready"});await command(a,{type:"start"});await command(a,{type:"ready"});await command(b,{type:"ready"});
await api({...a,type:"poll"});await new Promise(r=>setTimeout(r,3200));
const poll=async s=>(await api({...s,type:"poll"})).room;
const play=async(s,action)=>{const room=await poll(s);return command(s,{type:"game",phase:room.phaseKey,action});};
let room=await poll(a);assert.equal(room.game.id,"categories");
const answers=Array.from({length:7},(_,i)=>`${room.game.letter} Testbegriff ${i}`);
await play(a,{type:"draft",round:1,seq:0,answers});
const other=await poll(b);assert.ok(!JSON.stringify(other.game).includes(answers[0]));assert.equal(other.game.progress[a.playerId].filled,7);
await play(a,{type:"answer",round:1,seq:1,answers});await play(b,{type:"answer",round:1,seq:1,answers});
for(let index=0;index<7;index++){
  room=await poll(a);assert.equal(room.game.stage,"vote");assert.equal(room.game.categoryIndex,index);
  const ballot=Object.fromEntries(room.game.options.map(o=>[o.key,true]));
  await play(a,{type:"vote",round:1,categoryIndex:index,ballot});
  const hidden=await poll(b);assert.equal(hidden.game.options[0].yes,undefined);assert.equal(hidden.game.mine.ballot,null);
  await play(b,{type:"vote",round:1,categoryIndex:index,ballot});
  room=await poll(a);assert.equal(room.game.stage,"voteReveal");assert.equal(room.game.lastReview.options[0].points,5);
  await new Promise(r=>setTimeout(r,5100));await poll(a);await poll(b);
}
room=await poll(a);assert.equal(room.game.stage,"roundReveal");assert.equal(room.game.reveal.reviews.length,7);assert.equal(room.game.scores[a.playerId],35);assert.equal(room.game.scores[b.playerId],35);
console.log("PASS: two separate sessions, saved private drafts, all seven ballots, shared-answer scoring and complete round reveal.");
