import {player,createRoom,context,publicRoom} from '../lib/game/room';
import {games} from '../lib/game/games';
export function diceResultsFixture(count=12,tied=true){
 let now=Date.now();const host=player('Nova',0,now,0),room=createRoom('QA1234',host,now);
 for(let i=1;i<count;i++)room.players.push(player(`Crew ${i}`,i,now,i));
 room.participantIds=room.players.map(p=>p.id);room.phase='playing';room.startedAt=now;room.selection=[{id:'dice',rounds:1,seconds:45}];room.game=games.dice.init(context(room,now));const g=room.game;
 for(let category=0;category<13;category++){
  for(let i=0;i<count;i++){
   const top=i===0||tied&&i===count-1,value=category<6?category+1:top?6:2+i%3;
   let dice=Array(5).fill(value);if(category<6&&!top)dice=[value,value,value,value===6?1:6,value===6?1:6];
   if(top&&category===8)dice=[2,2,2,3,3];if(top&&(category===9||category===10))dice=[1,2,3,4,5];
   let n=0;const ctx={...context(room,now),random:()=>((dice[n++]-1)+.1)/6};
   games.dice.action(g,room.players[i].id,{type:'roll'},ctx);games.dice.action(g,room.players[i].id,{type:'category',index:category},ctx);
  }
  games.dice.tick(g,context(room,now));if(category<12){now=g.public.turnDeadline;games.dice.tick(g,context(room,now));}
 }
 return {room,now,archive(){room.history=[{id:`${room.startedAt}:0`,game:'dice',results:games.dice.results(g,context(room,now))}];room.phase='paused';},view:(id=host.id)=>({playerId:id,room:publicRoom(room,id,now)})};
}
