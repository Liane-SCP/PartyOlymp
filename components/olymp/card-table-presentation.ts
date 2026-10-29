import type * as T from 'three';
import {handValue} from '@/lib/game/games/blackjack';
import {playable} from '@/lib/game/games/cards';
import {casinoPresentation} from '@/lib/casino-presentation';
import {dealerInterval} from '@/lib/game/presentation';
import {casinoPageSize,type CasinoView} from '@/lib/casino-place';

type TableCard={root:T.Group;plate:T.Mesh;face:{set:(text:string)=>void}};
export function tableCardText(c:any){return c?.rank?`${['','A','2','3','4','5','6','7','8','9','10','J','Q','K'][c.rank]} ${['♠','♥','♦','♣'][c.suit]}`:c?(['0','1','2','3','4','5','6','7','8','9','⊘','⇄','+2','✦','+4'][c.value]??'?'):'✦';}
export function createCardTablePresentation(id:'cards'|'blackjack',cards:TableCard[],me:string,material:(color:string,metal?:boolean,emissive?:boolean)=>T.Material){
 let initialized=false,round:unknown;
 const colors=['#ed9caa','#8bcde4','#bedb99','#ebc187','#b9a6e5'];
 return {update(t:number,game:any,reduced:boolean,now=t*1000,view?:{mode:CasinoView;page:number}){
  if(round!==game.round){round=game.round;initialized=false;cards.forEach(c=>delete c.root.userData.cardKey);}
  const casino=id==='blackjack'?casinoPresentation(game,now):null,reveal=['roundReveal','done'].includes(game.stage),hand=game.mine?.hand??[],dealer=id==='cards'?[game.top]:(casino?.revealing?game.reveal?.dealer??game.dealer??[]:game.dealer??[]);
  const count=casino?casino.visible:dealer.length;
  cards.forEach((c,i)=>{
   const own=i<40,index=own?i:i-40,list=own?hand:dealer,back=!own&&id==='blackjack'&&(reveal?index===count&&count<dealer.length:index===dealer.length);
   const close=!!view&&(own?view.mode==='hand':view.mode==='dealer'),start=close?view!.page*casinoPageSize:0;
   c.root.visible=own?index<hand.length:index<count||back;if(!c.root.visible){c.face.set('');c.root.userData.displayedCard=null;return;}
   if(!own&&view?.mode==='hand'){c.root.visible=false;c.face.set('');c.root.userData.displayedCard=null;return;}
   if(close&&(index<start||index>=start+casinoPageSize)){c.root.visible=false;c.face.set('');c.root.userData.displayedCard=null;return;}
   const card=list[index],key=back?'back':JSON.stringify(card),changed=key!==c.root.userData.cardKey;
   if(changed){c.root.userData.cardKey=key;c.root.userData.dealtAt=initialized?t:-100;}
   c.root.userData.hidden=back;c.root.userData.displayedCard=back?null:card;c.face.set(back?'✦':tableCardText(card));
   const canPlay=own&&id==='cards'&&game.stage==='answer'&&game.turnId===me&&game.top&&playable(card,game.top,game.color);
   const color=back?'#2b5559':id==='cards'?colors[card?.color??4]:(card?.suit===1||card?.suit===2?'#f2b0b0':'#f1e6cd');
   c.plate.material=material(color,false,!!canPlay);c.root.userData.playable=!!canPlay;
   const total=own?hand.length:count+(id==='blackjack'&&(!reveal||count<dealer.length)?1:0),length=close?Math.min(casinoPageSize,total-start):total,x=(index-start-(length-1)/2)*(close?1.6:Math.min(1.45,10.5/Math.max(1,length-1)));
   const age=t-(c.root.userData.dealtAt??-100),travel=reduced||casino?.revealing?1:Math.min(1,Math.max(0,age/.4)),z=own?(casino?(close?3.95:4.35):3.3):-2;
   c.root.position.set((casino?-2.8:0)+(x-(casino?-2.8:0))*travel,(casino?1.645:1.72)+Math.sin(travel*Math.PI)*.55+(canPlay?.08:0),(casino?-1.8:-2)+(z-(casino?-1.8:-2))*travel);
   // Seek the flip from the public clock: reconnecting cannot restart or finish it early.
   const flip=casino?.revealing&&!own&&!back&&index>0&&!reduced?Math.min(1,Math.max(0,(now-casino.start-index*dealerInterval)/350)):1;
   if(flip<1)c.root.position.y+=Math.sin(flip*Math.PI)*.7;
   c.root.rotation.set(-Math.PI/2+(casino?0:.08),casino&&!reduced?(1-travel)*Math.PI+(1-flip)*Math.PI:0,(own?index-start-(length-1)/2:0)*.022);
  });initialized=true;
  return id==='cards'?`FARBE ${['KORALLE','BLAU','LIMETTE','ORANGE'][game.color]??'JOKER'} · ${game.direction===-1?'↶':'↷'}`:casino?.revealing?`DEALER ${casino.value??'—'} · ${casino.ready?'AUSZAHLUNG':'DECKT AUF'}`:!game.mine?'DEALER · CLUB 21':`DEIN BLATT ${hand.length?handValue(hand):'—'} · EINSATZ ${game.mine?.bet??0}`;
 }};
}
