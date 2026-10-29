import { match } from "./browser-game-engine";
import { catalog } from "../lib/game/catalog";
import { roomAction, publicRoom } from "../lib/game/room";
export { match };
export function modeWheel(count=21) {
  const m=match("chain",3),r=m.room;
  r.phase="lobby";r.game=null;
  r.selection=Array.from({length:count},(_,i)=>({id:catalog[i%catalog.length].id,rounds:3,seconds:20}));
  roomAction(r,r.players[0],{type:"start"},Date.now());
  r.draw!.startedAt=Date.now()-3000;
  return {...m,view:(id=m.first)=>({playerId:id,room:publicRoom(r,id,Date.now())})};
}
