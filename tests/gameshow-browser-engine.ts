import {match} from "./browser-game-engine";
import {publicRoom} from "../lib/game/room";
import type {Result} from "../lib/game/types";
export function showFixture(count=3,phase:"rules"|"standings"|"paused"="standings",tied=false) {
  const m=match("color",count),r=m.room,now=Date.now();
  r.selection=[{id:"color",rounds:1,seconds:20},{id:"picture",rounds:1,seconds:20}];
  r.index=phase==="rules"?1:0;r.phase=phase;r.deadline=phase==="rules"?now+45000:now+24000;
  r.players.forEach((p,i)=>{
    p.name=i===0?"Lena":i===1?"Max":i===2?"Nova":"Crew mit langem Namen";
    const prior=i===0?220:i===1?200:i===2?150:Math.max(0,100-i*8);
    p.points=tied?100:prior+(i===1?40:i===2?100:0);p.lastPoints=tied?100:(i===1?40:i===2?100:0);
    p.wins=tied?i:i===2?2:i===0?1:0;p.seconds=i%3;p.previousRank=tied?1:i+1;
  });
  r.previousStandings=r.players.map((p,i)=>({id:p.id,points:tied?0:p.points-p.lastPoints,rank:tied?1:i+1,wins:0,seconds:0}));
  const results:Result[]=r.players.map((p,i)=>({id:p.id,raw:100-i*10,valid:true,rank:tied?1:i===2?1:i===1?2:i===0?3:i+1,points:p.lastPoints,detail:null}));
  r.history=[{id:"previous",game:"color",results:[{...results[2],raw:80}]},
    {id:"current",game:"color",results,recordBreaks:tied?[]:[{player:r.players[2].id,game:"color",previous:80,raw:100}]}];
  r.game=null;
  return {...m,view:(id=m.first)=>({playerId:id,room:publicRoom(r,id,Date.now())})};
}
