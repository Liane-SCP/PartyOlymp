import {createRoom,player,context,publicRoom,roomAction,phaseKey,tickRoom} from '../lib/game/room';
import {games} from '../lib/game/games';
import {beginJourney} from '../lib/game/journey';
import {catalog} from '../lib/game/catalog';
import type {GameId} from '../lib/game/types';
import {bots} from './party-bots';
export const ids=catalog.map(g=>g.id);
export function fixture(id:GameId,count=3){const now=Date.now(),first=player('Nova',0,now,0),r=createRoom('ADV234',first,now);for(let i=1;i<count;i++)r.players.push(player(`Crew ${i}`,i,now,i));r.participantIds=r.players.map(p=>p.id);r.startedAt=now;r.selection=[{id,rounds:3,seconds:120}];r.phase='playing';beginJourney(r);r.game=games[id].init(context(r,now));r.deadline=0;
return {room:r,first:first.id,view(pid=first.id){return {playerId:pid,room:publicRoom(r,pid,Date.now())};},act(a:any){roomAction(r,first,a,Date.now());},
expire(at:number){for(const p of r.players)p.lastSeen=at;tickRoom(r,at);},
tick(){games[id].tick(r.game!,context(r,Date.now()));},
switchGame(nextId:GameId){id=nextId;r.selection=[{id,rounds:3,seconds:120}];r.game=games[id].init(context(r,Date.now()));r.deadline=0;},
command(pid:string,action:any){roomAction(r,r.players.find(p=>p.id===pid)!,{...action,phase:action.phase??phaseKey(r)},Date.now());},
resolve(){const g=r.game!,c=context(r,Date.now());if(id==="color")g.public.previewUntil=c.now-1;if(id==="picture"){games[id].action(g,first.id,{type:"buzz"},c);games[id].action(g,first.id,{type:"answer",value:g.secret.item.answer},c);}else for(const pid of r.participantIds)games[id].action(g,pid,id==="herd"?{type:"answer",answer:"Pizza"}:{type:"answer",value:id==="color"?g.secret.target:id==="size"?g.secret.item.cm:[g.public.items[0].id]},c);games[id].tick(g,c);},
next(){r.game!.deadline=Date.now()-1;games[id].tick(r.game!,context(r,Date.now()));}
};}

/** Real game actions and ticks, rebased to the browser's clock at the first result. */
export function resultFixture(id:GameId,count=12){
 const model=fixture(id,count),r=model.room,start=Date.now();let now=start,steps=0;
 while(!['roundReveal','done'].includes(r.game!.stage)&&steps++<10000){
  bots(r,now);r.players.forEach(p=>p.lastSeen=now);games[id].tick(r.game!,context(r,now));now+=200;
 }
 if(!['roundReveal','done'].includes(r.game!.stage))throw Error(`${id}: no result after ${steps} steps`);
 if(r.game!.stage==='done')tickRoom(r,now);
 const delta=Date.now()-now;
 const rebase=(obj:any)=>{for(const key of Object.keys(obj)){const value=obj[key];if(typeof value==='number'&&value>=start-1000&&value<=now+180000)obj[key]=value+delta;else if(value&&typeof value==='object')rebase(value);}};
 rebase(r);return model;
}

/** Controlled review scenes; only the deadline is held for native UI inspection. */
export function reviewFixture(kind:'categories'|'bomb'|'chain-review'|'chain-challenge'|'auction',count=12){
 const id:GameId=kind.startsWith('chain')?'chain':kind as GameId,m=fixture(id,count),r=m.room,g=r.game!,ids=r.participantIds;
 const act=(pid:string,action:any)=>m.command(pid,{type:'game',action:{round:g.round+1,...action}});
 if(id==='categories'){
  ids.forEach((pid,i)=>act(pid,{type:'answer',seq:1,answers:Array(7).fill(`${g.public.letter}begriff${i}`)}));m.tick();
 }else if(id==='bomb'){
  act(g.public.turnId,{type:'word',turn:g.public.turn,word:g.public.fragment.toLowerCase()+'qzx'});
 }else if(id==='chain'){
  m.next();m.next();act(g.public.turnId,{type:'answer',turn:g.public.turn,answer:'Weltraumbanane'});
  if(kind==='chain-challenge')act(ids.find(pid=>pid!==g.public.turnId)!,{type:'challenge',turn:g.public.turn});
 }else if(id==='auction'){
  act(g.public.setter,{type:'topic',choice:g.public.choices[0].id});act(ids[0],{type:'bid',value:1});
  ids.slice(1).forEach(pid=>act(pid,{type:'pass'}));
  for(let i=0;i<12;i++)act(ids[0],{type:'word',word:`Testbegriff ${i+1}`});act(ids[0],{type:'finish'});
 }
 g.deadline=Date.now()+60000;return {...m,viewer:ids.find(pid=>pid!==(id==='auction'?g.public.leader:g.public.turnId)&&(kind!=='chain-challenge'||pid!==g.public.challengeBy))!};
}
