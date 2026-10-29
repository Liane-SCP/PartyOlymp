import assert from "node:assert/strict";
import test from "node:test";
import {createRoom,player,context,roomAction,tickRoom,phaseKey,publicRoom} from "../lib/game/room";
import {games} from "../lib/game/games";
import type {GameId} from "../lib/game/types";
import bombWords from "../lib/game/data/bomb-words.json";
function match(id:GameId) {
  const now=Date.now(),host=player("Host",0,now,0),r=createRoom("QA1234",host,now);
  r.players.push(player("Guest",1,now,1),player("Third",2,now,2));
  r.participantIds=r.players.map(p=>p.id);r.phase="playing";r.startedAt=now;
  r.selection=[{id,rounds:2,seconds:30}];r.game=games[id].init(context(r,now));
  const g=r.game;
  const act=(pid:string,action:any,time=now)=>roomAction(r,r.players.find(p=>p.id===pid)!,{type:"game",phase:phaseKey(r),action},time);
  const tick=(time:number)=>{r.players.filter(p=>!p.kicked).forEach(p=>p.lastSeen=time);tickRoom(r,time);};
  return {r,g,now,act,tick,host:host.id,guest:r.players[1].id};
}
for(const id of ["herd","geo","size","budget","color","blackjack"] as const) test(`${id}: latest private input submits before server timeout, without another client request`,()=>{
  const {r,g,now,act,tick,host,guest}=match(id);
  const first=id==="herd"?{type:"answer",answer:"Secret kiwi"}:id==="geo"?{type:"pin",lat:10,lon:20}:id==="budget"?{type:"answer",value:[g.secret.items[0].id]}:id==="color"?{type:"answer",value:[1,2,3]}:id==="blackjack"?{type:"bet",value:25}:{type:"answer",value:45};
  const second=id==="herd"?{...first,answer:"Secret mango"}:id==="geo"?{...first,lat:30}:id==="budget"?{...first,value:[g.secret.items[1].id]}:id==="color"?{...first,value:[4,5,6]}:id==="blackjack"?{...first,value:75}:{...first,value:123};
  const time=id==="color"?g.public.previewUntil:now;
  act(host,{type:"timeoutDraft",action:first},time);act(host,{type:"timeoutDraft",action:second},time);
  assert.equal(g.players[host].submitted,false);
  assert.ok(!JSON.stringify(publicRoom(r,guest,time)).includes('"timeoutInput"'));
  tick(g.deadline+200);
  assert.equal(g.players[host].timeoutInput,undefined);
  if(id==="blackjack")assert.equal(g.players[host].bet,75);
  else assert.deepEqual(g.players[host].answer,id==="geo"?{lat:30,lon:20}:id==="herd"?second.answer:second.value);
});
test("Drafts can be erased, invalid edits clear the pending input and stale phases cannot submit",()=>{
  const {r,g,now,act,tick,host}=match("herd");
  act(host,{type:"timeoutDraft",action:{type:"answer",answer:"kiwi"}});
  act(host,{type:"timeoutDraft",action:null});assert.equal(g.players[host].timeoutInput,undefined);
  act(host,{type:"timeoutDraft",action:{type:"answer",answer:"kiwi"}});
  act(host,{type:"timeoutDraft",action:{type:"answer",answer:""}});assert.equal(g.players[host].timeoutInput,undefined);
  act(host,{type:"timeoutDraft",action:{type:"answer",answer:"kiwi"}});
  g.round++;tick(now+1);assert.equal(g.players[host].timeoutInput,undefined);
  assert.equal(g.players[host].answer,null);
  roomAction(r,r.players[0],{type:"game",phase:"old",action:{type:"timeoutDraft",action:{type:"answer",answer:"kiwi"}}},now);
  assert.equal(g.players[host].timeoutInput,undefined);
});
test("Pixelblitz: first buzzer owns the answer; wrong answers lock out, correct answers end the round",()=>{
  const {g,act,host,guest}=match("picture");
  assert.throws(()=>act(host,{type:"answer",value:g.secret.item.answer}));
  act(host,{type:"buzz"});assert.equal(g.public.buzzer,host);
  assert.throws(()=>act(guest,{type:"buzz"}));assert.throws(()=>act(guest,{type:"answer",value:g.secret.item.answer}));
  act(host,{type:"answer",value:"surelywrong987654"});assert.equal(g.players[host].buzzedOut,true);
  assert.equal(g.public.buzzer,null);assert.throws(()=>act(host,{type:"buzz"}));
  act(guest,{type:"buzz"});act(guest,{type:"answer",value:g.secret.item.answer});
  assert.equal(g.stage,"roundReveal");assert.equal(g.public.reveal.players.find((p:any)=>p.id===guest).correct,true);
});
test("Pixelblitz: buzzer input submits at its eight second deadline; an empty buzzer times out",()=>{
  const m=match("picture");m.act(m.host,{type:"buzz"});
  assert.equal(m.g.public.buzzDeadline,m.now+8000);
  m.act(m.host,{type:"timeoutDraft",action:{type:"answer",value:m.g.secret.item.answer}});
  m.tick(m.g.public.buzzDeadline+100);assert.equal(m.g.stage,"roundReveal");assert.ok(m.g.players[m.host].correct);
  const n=match("picture");n.act(n.host,{type:"buzz"});n.tick(n.g.public.buzzDeadline);
  assert.equal(n.g.public.buzzer,null);assert.equal(n.g.players[n.host].buzzedOut,true);
  n.act(n.guest,{type:"buzz"},n.now+8001);assert.equal(n.g.public.buzzer,n.guest);
});
test("Auction: pending custom category and final typed word advance the right phase",()=>{
  const {g,now,act,tick,host}=match("auction");
  const setter=g.public.setter;
  act(setter,{type:"timeoutDraft",action:{type:"topic",round:1,name:"Unsere eigene Kategorie"}});
  tick(g.deadline);assert.equal(g.public.topic.name,"Unsere eigene Kategorie");
  act(host,{type:"bid",round:1,value:1},g.deadline-1000);tick(g.deadline);
  assert.equal(g.stage,"perform");
  act(host,{type:"timeoutDraft",action:{type:"word",round:1,word:"Kiwi"}},g.deadline-1000);
  tick(g.deadline);assert.equal(g.public.answers[0].word,"Kiwi");assert.equal(g.stage,"judge");
});
test("Spectrum: unfinished clue and dial are submitted at their own deadlines",()=>{
  const {g,act,tick,now,host,guest}=match("spectrum");
  act(g.public.psychic,{type:"timeoutDraft",action:{type:"clue",round:1,clue:"Ein warmes Sommerbad"}});
  tick(g.deadline);assert.equal(g.stage,"guess");assert.equal(g.public.clue,"Ein warmes Sommerbad");
  const guesser=g.public.psychic===host?guest:host;
  act(guesser,{type:"timeoutDraft",action:{type:"lock",round:1,value:77}},g.deadline-1000);
  tick(g.deadline);assert.equal(g.players[guesser].guess,77);
});
test("Bosses: unfinished rolls, charge and price become attacks on timeout",()=>{
  for(const id of ["colossus","kraken","dragon"] as const) {
    const {g,act,tick,host}=match(id);tick(g.deadline);const deadline=g.deadline;
    if(id==="colossus")act(host,{type:"roll",round:1},deadline-10000);
    else if(id==="kraken")act(host,{type:"start",round:1},deadline-5000);
    else act(host,{type:"timeoutDraft",action:{type:"estimate",round:1,guess:g.secret.product.price,risk:"safe"}},deadline-1000);
    tick(deadline);assert.equal(g.players[host].submitted,true);assert.equal(g.public.reveal.outcomes.find((p:any)=>p.id===host).submitted,true);
  }
});
test("Host can kick a participant without losing history; guest/self kicks and further actions are rejected",()=>{
  const {r,g,now,host,guest,tick}=match("picture");
  assert.throws(()=>roomAction(r,r.players[1],{type:"kick",player:host},now),/Gastgeber/);
  assert.throws(()=>roomAction(r,r.players[0],{type:"kick",player:host},now),/selbst/);
  roomAction(r,r.players[0],{type:"kick",player:guest},now);
  assert.equal(g.players[guest].abandoned,true);assert.equal(r.players[1].kicked,true);
  assert.ok(r.participantIds.includes(guest));
  assert.throws(()=>roomAction(r,r.players[1],{type:"heartbeat"},now),/entfernt/);
  tick(g.deadline);assert.equal(g.stage,"roundReveal");
});
test("Chain: typed category and turn answer submit before timeout instead of eliminating the player",()=>{
  const {g,act,tick,host}=match("chain");
  act(host,{type:"timeoutDraft",action:{type:"suggestTopic",round:1,turn:0,name:"Obst"}});
  tick(g.deadline);assert.ok(g.public.suggestions.some((s:any)=>s.player===host&&s.name==="Obst"));
  tick(g.deadline);assert.equal(g.stage,"answer");const owner=g.public.turnId;
  act(owner,{type:"timeoutDraft",action:{type:"answer",round:1,turn:g.public.turn,answer:"Mango"}},g.deadline-1000);
  tick(g.deadline);assert.equal(g.stage,"review");assert.equal(g.public.candidate.answer,"Mango");assert.equal(g.players[owner].alive,true);
});
test("Bomb: a typed matching word passes the bomb at the hidden fuse deadline",()=>{
  const {g,act,tick}=match("bomb"),owner=g.public.turnId;
  const word=bombWords.find(w=>w.includes(g.public.fragment.toLowerCase()))!;
  assert.ok(word);
  act(owner,{type:"timeoutDraft",action:{type:"word",round:1,turn:g.public.turn,word}});
  const turn=g.public.turn;tick(g.deadline);
  assert.ok(g.public.turn>turn);assert.equal(g.players[owner].alive,true);
});
test("Categories: saved answer sheet counts on expiry and partial ballot sends selected votes with abstentions",()=>{
  const {g,act,tick,host}=match("categories");
  const answers=g.players[host].answers.map(()=>g.public.letter+"wort");
  act(host,{type:"draft",round:1,seq:1,answers});tick(g.deadline);
  assert.equal(g.stage,"vote");const options=g.public.options.filter((o:any)=>o.formatValid);
  assert.ok(options.length);
  const ballot=Object.fromEntries(options.map((o:any)=>[o.key,true]));
  act(host,{type:"timeoutDraft",action:{type:"vote",round:1,categoryIndex:g.public.categoryIndex,ballot}},g.deadline-1000);
  tick(g.deadline);assert.equal(g.players[host].voteCommitted,true);assert.equal(g.stage,"voteReveal");
});
test("Cards: selected joker and color play at timeout instead of drawing a penalty card",()=>{
  const {g,act,tick}=match("cards"),owner=g.public.turnId;
  const card={id:"qa-joker",color:4,value:13};g.players[owner].hand.push(card);
  act(owner,{type:"timeoutDraft",action:{type:"play",card:card.id,color:2}});
  tick(g.deadline);assert.equal(g.public.top.id,card.id);assert.equal(g.public.color,2);
  assert.ok(!g.players[owner].hand.some((c:any)=>c.id===card.id));
});
test("Timing: a running measurement stops at the server deadline rather than losing its elapsed time",()=>{
  const {g,act,tick,host,now}=match("timing");
  act(host,{type:"start",round:1});const elapsed=g.deadline-now;
  tick(g.deadline+1000);assert.equal(g.players[host].elapsed,elapsed);assert.equal(g.players[host].submitted,true);
});
test("Kick stays abandoned even when fresh presence from the former socket is merged",()=>{
  const {r,g,now,guest,tick}=match("herd");
  roomAction(r,r.players[0],{type:"kick",player:guest},now);
  g.players[guest].abandoned=false;r.players[1].lastSeen=now;
  tick(now+1);assert.equal(g.players[guest].abandoned,true);
});
test("Dice: the selected zero category is recorded on timeout, rather than a different category",()=>{
  const {g,act,tick,host}=match("dice");
  act(host,{type:"roll"});g.players[host].dice=[1,1,1,1,1];
  act(host,{type:"timeoutDraft",action:{type:"category",index:5}});
  tick(g.public.turnDeadline);assert.equal(g.players[host].sheet[5],0);assert.equal(g.players[host].sheet[0],null);
});

test('Dragon: the last valid private estimate is committed at its deadline with its chosen risk',()=>{
 const m=match('dragon');m.tick(m.g.deadline+1);
 m.act(m.host,{type:'timeoutDraft',action:{type:'estimate',guess:12345,risk:'safe',round:m.g.round+1}},m.now+7000);
 m.act(m.host,{type:'timeoutDraft',action:{type:'estimate',guess:12500,risk:'risky',round:m.g.round+1}},m.now+7100);
 assert.equal(m.g.players[m.host].submitted,false);assert.equal(publicRoom(m.r,m.guest,m.now+7200).game!.mine.timeoutInput,undefined);
 m.tick(m.g.deadline+1);assert.equal(m.g.players[m.host].submitted,true);assert.equal(m.g.players[m.host].guess,12500);assert.equal(m.g.players[m.host].risk,'risky');assert.equal(m.g.players[m.host].passed,false);assert.equal(m.g.players[m.host].timeoutInput,undefined);
});
test('Dragon: clearing a resumed estimate leaves no invented guess at the deadline',()=>{
 const m=match('dragon');m.tick(m.g.deadline+1);
 m.act(m.host,{type:'timeoutDraft',action:{type:'estimate',guess:12345,risk:'bold',round:m.g.round+1}},m.now+7000);
 m.act(m.host,{type:'timeoutDraft',action:null},m.now+7100);m.tick(m.g.deadline+1);
 assert.equal(m.g.players[m.host].guess,null);assert.equal(m.g.players[m.host].submitted,false);assert.equal(m.g.public.reveal.outcomes.find((o:any)=>o.id===m.host).submitted,false);assert.equal(m.g.public.reveal.totalScore,0);assert.equal(m.g.players[m.host].timeoutInput,undefined);
});
