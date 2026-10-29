import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {jurySheet,jurySummary,juryBallot,restoreJurySheet,serverJurySheet,nextOpenJuryPage} from '../lib/auction-jury';
import {createRoom,player,context,roomAction,phaseKey,publicRoom,tickRoom} from '../lib/game/room';
import {games} from '../lib/game/games';
import {createAdventureScene} from '../components/olymp/adventure-scene';
function fixture(count=3,wordCount=7){
 const now=1000000,host=player('Nova',0,now,0),r=createRoom('QA1234',host,now);
 for(let i=1;i<count;i++)r.players.push(player(`Crew ${i}`,i,now,i));
 r.phase='playing';r.startedAt=now-5000;r.participantIds=r.players.map(p=>p.id);r.selection=[{id:'auction',rounds:2,seconds:45}];r.game=games.auction.init(context(r,now));
 const g=r.game;g.stage='judge';g.public.leader=host.id;g.public.bid=3;g.public.answers=Array.from({length:wordCount},(_,i)=>({word:`Begriff ${i+1}`}));g.deadline=now+30000;
 const act=(i:number,action:any)=>roomAction(r,r.players[i],{type:'game',phase:phaseKey(r),action:{...action,round:1}},now);
 return {r,g,now,act,view:(i:number)=>publicRoom(r,r.players[i].id,now)};
}
test('open, explicit abstention, yes and no remain distinct through JSON storage and ballot conversion',()=>{
 const marks=['open',null,true,false] as const;assert.deepEqual(jurySummary([...marks]),{yes:1,no:1,abstain:1,open:1,reviewed:3});assert.deepEqual(juryBallot([...marks]),[null,null,true,false]);
 const words=['A','B','C','D'];assert.deepEqual(restoreJurySheet(JSON.parse(JSON.stringify({version:1,words,marks,page:0,active:2})),words),{marks,page:0,active:2});
 for(const bad of [{version:0,words,marks},{version:1,words:['wrong'],marks},{version:1,words,marks:[true]},{version:1,words,marks:[0,null,true,false]},null])assert.equal(restoreJurySheet(bad,words),null);
 assert.deepEqual(jurySheet(50).marks,Array(50).fill('open'));
});
test('paging finds the next unresolved page, wraps incomplete last pages and bounds restored selection',()=>{
 const marks=Array(50).fill(true);marks[49]='open';assert.equal(nextOpenJuryPage(marks,0),8);marks[49]=false;marks[0]='open';assert.equal(nextOpenJuryPage(marks,8),0);assert.equal(nextOpenJuryPage([true,true],0),0);
 const words=Array(7).fill('A'),s=restoreJurySheet({version:1,words,marks:Array(7).fill(null),page:999,active:-2},words)!;assert.equal(s.page,1);assert.equal(s.active,0);
});
test('private server draft restores explicit abstentions and legacy drafts without leaking into other views',()=>{
 const {r,act,view}=fixture(),votes=[true,false,null,null,null,null,null],reviewed=[true,true,true,false,false,false,false];
 act(1,{type:'timeoutDraft',action:{type:'judge',round:1,votes,reviewed}});
 const mine=view(1).game!,other=view(2).game!,performer=view(0).game!;
 assert.deepEqual(serverJurySheet(mine,phaseKey(r)).marks,[true,false,null,'open','open','open','open']);
 assert.ok(!JSON.stringify(other).includes('reviewed'));assert.ok(!JSON.stringify(performer).includes('reviewed'));assert.equal(other.roster[r.players[1].id].ballot,undefined);
 assert.equal(other.roster[r.players[1].id].submitted,false);assert.equal(other.answers.every((a:any)=>a.valid===undefined),true);
 assert.deepEqual(serverJurySheet(mine,'old').marks,Array(7).fill('open'));
 mine.mine.timeoutInput.action.reviewed=undefined;assert.deepEqual(serverJurySheet(mine,phaseKey(r)).marks,[true,false,'open','open','open','open','open']);
});
test('confirmed ballots are immutable and readable by their owner while waiting for the other judges',()=>{
 const {act,view}=fixture();act(1,{type:'judge',votes:[true,false,null,true,false,null,true]});
 assert.deepEqual(serverJurySheet(view(1).game,'unused').marks,[true,false,null,true,false,null,true]);
 assert.throws(()=>act(1,{type:'judge',votes:Array(7).fill(true)}));assert.equal(view(2).game!.mine.ballot,null);
});
test('partial saved ballots commit at the real room deadline; open and explicit abstentions add no vote',()=>{
 const {r,g,act,now,view}=fixture();
 act(1,{type:'timeoutDraft',action:{type:'judge',round:1,votes:[true,false,null,null,null,null,null],reviewed:[true,true,true,false,false,false,false]}});
 act(2,{type:'judge',votes:[true,true,null,null,null,null,null]});
 tickRoom(r,g.deadline);assert.equal(g.stage,'roundReveal');assert.deepEqual(g.public.reveal.answers.slice(0,3).map((a:any)=>[a.yes,a.no,a.valid]),[[2,0,true],[1,1,false],[0,0,false]]);
 assert.equal(g.public.reveal.count,1);assert.equal(g.public.reveal.success,false);assert.equal(g.public.reveal.players[0].score,-30);
 assert.equal(r.game!.players[r.players[1].id].timeoutInput,undefined);
});
test('book picking and local selection follow the current page, never reveal private verdicts, and disable after sealing',()=>{
 const {r,view}=fixture(12,50),crew=r.players.map(p=>({id:p.id,name:p.name,color:p.color})),world=createAdventureScene(T,'auction',crew,r.players[1].id);
 const game=view(1).game!;world.update(1,1000000,game,{auctionPage:8,auctionReview:49,auctionBookFocused:true});
 const picks=world.pickables.filter(o=>o.userData.pick?.startsWith('auctionReview:'));
 assert.equal(picks.length,6);assert.deepEqual(picks.filter(o=>!o.userData.pickDisabled).map(o=>o.userData.pick),['auctionReview:48','auctionReview:49']);
 assert.equal(world.scene.getObjectByName('auction-private-review-highlight')!.visible,true);
 assert.ok(world.scene.userData.auction.words.every((a:any)=>a.valid===null));
 world.update(1,1000000,{...game,mine:{...game.mine,submitted:true}},{auctionPage:8,auctionReview:49});assert.ok(picks.every(o=>o.userData.pickDisabled));assert.equal(world.scene.getObjectByName('auction-private-review-highlight')!.visible,false);
 world.update(1,1000000,{...game,mine:null},{auctionPage:0});assert.ok(picks.every(o=>o.userData.pickDisabled));
 world.dispose();
});
