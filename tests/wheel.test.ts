import test from "node:test";
import assert from "node:assert/strict";
import { spacedBosses, wheelDraw, wheelAngle, wheelSettled } from "../lib/game/wheel";
import { createRoom, player, roomAction, publicRoom, tickRoom } from "../lib/game/room";
import { chain } from "../lib/game/games/chain";
import { isBoss } from "../lib/game/boss-rules";
import type { Context, Selection } from "../lib/game/types";

test("Bosses divide every pool size into even blocks, preserve settings and finish the Olympiad", () => {
  for(let size=1;size<=40;size++) for(let count=0;count<=size;count++) {
    const pool:Selection[]=Array.from({length:size},(_,i)=>({id:i<count?"dragon":"picture",rounds:i+1,seconds:20+i}));
    const plan=spacedBosses(pool), slots=plan.flatMap((s,i)=>isBoss(s.id)?[i]:[]);
    assert.equal(plan.length,Math.max(size,count*2));assert.equal(slots.length,count);
    assert.deepEqual(plan.filter(s=>isBoss(s.id)),pool.slice(0,count));
    assert.deepEqual(plan.filter(s=>!isBoss(s.id)).slice(0,size-count),pool.slice(count));
    if(count) {
      assert.equal(slots.at(-1),plan.length-1);
      const gaps=slots.map((slot,i)=>slot-(slots[i-1]??-1));
      assert.ok(Math.max(...gaps)-Math.min(...gaps)<=1);
      assert.ok(Math.min(...gaps)>=2,"A warm-up and minigames separate every boss");
    }
  }
});

test("Wheel pointer settles exactly on every possible authoritative result",()=>{
  for(let n=1;n<=40;n++) for(let i=0;i<n;i++) {
    const draw=wheelDraw("test",Array.from({length:n},(_,k)=>({id:`${k}`,name:`Choice ${k}`})),1000,()=>(i+0.5)/n);
    assert.equal(draw.selected,i);assert.equal(wheelAngle(draw,1000),0);
    assert.equal(wheelSettled(draw,8599),false);assert.equal(wheelSettled(draw,8600),true);
    const angle=wheelAngle(draw,11000);
    const pointer=((Math.round(-angle/(360/n))%n)+n)%n;
    assert.equal(pointer,i);
  }
});

test("Confirmed room routes survive persistence and reconnects without any redraw",()=>{
 const now=1000000,host=player("Host",0,now,0),room=createRoom("ORDER",host,now);
 room.players.push(player("Crew",1,now,1));
 const plan:Selection[]=[{id:"colossus",rounds:3,seconds:20},{id:"color",rounds:1,seconds:15},{id:"dragon",rounds:3,seconds:30}];
 room.selection=structuredClone(plan);room.players.forEach(p=>p.ready=true);roomAction(room,host,{type:"start"},now);
 assert.equal(room.phase,"travel");assert.equal(room.draw,undefined);assert.deepEqual(room.selection,plan);
 const loaded=JSON.parse(JSON.stringify(room));tickRoom(loaded,now+500);assert.deepEqual(loaded.selection,plan);
 for(let i=0;i<plan.length;i++){tickRoom(room,room.deadline);assert.equal(room.phase,"rules");room.phase="standings";room.deadline=now+20000*(i+1);tickRoom(room,room.deadline);}
 assert.equal(room.phase,"podium");assert.deepEqual(room.selection,plan);
});

const ctx=(count=3):Context=>({ids:Array.from({length:count},(_,i)=>`p${i}`),now:1000,settings:{id:"chain",rounds:2,seconds:20},used:[],random:()=>0.9});
test("Category proposals: one equal-weight ticket each, custom boundaries, shared winner and no premature answers",()=>{
  const c=ctx(),g=chain.init(c);
  assert.equal(g.stage,"topicSuggest");assert.equal(g.public.topic,null);
  const propose=(id:string,name:string,hint?:string)=>chain.action(g,id,{type:"suggestTopic",round:1,turn:0,name,hint},c);
  assert.throws(()=>chain.action(g,"p0",{type:"answer",round:1,turn:0,answer:"BMW"},c));
  assert.throws(()=>propose("observer","Spiele"));
  assert.throws(()=>propose("p0"," "));assert.throws(()=>propose("p0","!@#"));
  propose("p0","Automarken");assert.throws(()=>propose("p0","Länder"));
  propose("p1","Automarken");propose("p2","Videospiel-Charaktere","Nur spielbare Figuren.");
  assert.equal(g.stage,"topicSpin");assert.equal(g.public.topicWheel.entries.length,3);
  assert.equal(g.public.topicWheel.selected,2);assert.equal(g.public.topic,null);
  const draw=structuredClone(g.public.topicWheel);
  assert.deepEqual(chain.view(g,"p0",false).topicWheel,chain.view(g,"observer",false).topicWheel);
  c.now=g.deadline-1;chain.tick(g,c);assert.deepEqual(g.public.topicWheel,draw);
  assert.throws(()=>propose("p1","Tiere"));
  c.now=g.deadline;chain.tick(g,c);
  const topic=chain.view(g,"p0",false).topic;
  assert.equal(g.stage,"answer");assert.equal(topic.name,"Videospiel-Charaktere");
  assert.equal(topic.hint,"Nur spielbare Figuren.");assert.equal(g.public.turnId,"p0");
  assert.equal(g.deadline,c.now+20000);
  // A new round collects new proposals rather than reusing the previous wheel.
  g.stage="roundReveal";g.deadline=c.now;chain.tick(g,c);
  assert.equal(g.stage,"topicSuggest");assert.deepEqual(g.public.suggestions,[]);assert.equal(g.public.topic,null);
  assert.ok(c.ids.every(id=>!g.players[id].topicSubmitted));
});

test("Category timeout fills only missing tickets from the ideas pool and preserves submitted proposals",()=>{
  for(const count of [2,12]) {
    const c=ctx(count),g=chain.init(c);
    chain.action(g,"p0",{type:"suggestTopic",round:1,turn:0,name:"Eigene Kategorie"},c);
    c.now=g.deadline;chain.tick(g,c);
    assert.equal(g.stage,"topicSpin");assert.equal(g.public.topicWheel.entries.length,count);
    assert.equal(g.public.topicWheel.entries[0].name,"Eigene Kategorie");
    assert.equal(new Set(g.public.topicWheel.entries.map((s:any)=>s.player)).size,count);
    c.now=g.deadline;chain.tick(g,c);assert.equal(g.stage,"answer");assert.ok(g.public.topic.name);
  }
});
