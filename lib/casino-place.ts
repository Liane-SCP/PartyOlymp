import {casinoPresentation} from './casino-presentation';
import {handValue} from './game/games/blackjack';
export type CasinoView='table'|'hand'|'dealer';
export const casinoPageSize=3;
export function casinoDraftState(game:any,phase:string|undefined,draft:any={}){
 const current=draft.casinoPhase===phase;
 return {bet:current?draft.casinoBet??50:50,pending:game.stage==='answer'&&(!current||!!draft.casinoPending),error:game.stage==='answer'&&current?draft.casinoError:undefined};
}
export function casinoPlaceFrame(game:any,now:number,mode:CasinoView,handPage=0,dealerPage:number|null=null,me=''){
 const frame=casinoPresentation(game,now),own=game.mine,hand=own?.hand??[];
 const dealerCount=frame.visible+(frame.revealing?(frame.visible<(game.reveal?.dealer??game.dealer??[]).length?1:0):1);
 const effective=mode==='hand'&&!own?'dealer':mode,count=effective==='dealer'?dealerCount:hand.length,pages=Math.max(1,Math.ceil(count/casinoPageSize));
 const desired=effective==='dealer'?(dealerPage??Math.floor(Math.max(0,frame.visible-1)/casinoPageSize)):handPage,page=Math.max(0,Math.min(pages-1,Math.trunc(desired)||0));
 const value=handValue(hand),result=frame.ready?frame.rows.find((r:any)=>r.id===me):null;
 // Settlement credits chips immediately. Present the previous balance until
 // the shared dealer clock releases the payout, including after reconnecting.
 const unrevealedPayout=own&&frame.revealing&&!frame.ready?Number(game.reveal?.players?.find((r:any)=>r.id===me)?.payout??0):0;
 return {mode:effective,page,pages,count,hand,value,chips:(own?.chips??0)-unrevealedPayout,bet:own?.bet??0,canBet:!!own&&!own.abandoned&&!own.stood&&game.stage==='answer'&&!own.bet,canPlay:!!own&&!own.abandoned&&game.stage==='answer'&&!!own.bet&&!own.stood,own:!!own,dealerValue:frame.value,dealerHidden:frame.revealing?frame.visible<(game.reveal?.dealer??game.dealer??[]).length:true,dealerShown:frame.shown,ready:frame.ready,revealing:frame.revealing,result,status:frame.revealing?(frame.ready?'Die Hand ist ausgewertet':'Der Dealer deckt auf'):!own?'Du schaust der Crew zu':!own.bet?'Einsatz wählen und bestätigen':value>21?'Über 21 · warte auf den Dealer':own.stood?'Du bleibst stehen · die Crew spielt weiter':'Karte ziehen oder stehen bleiben'};
}

/** Fixed top-down work areas use the actual card and action coordinates. */
export function casinoPlaceCamera(mode:CasinoView,aspect:number){
 if(mode==='table')return null;
 const target:[number,number,number]=mode==='hand'?[0,1.75,4.5]:[0,2.1,-3.4],pitch=mode==='hand'?1.18:.88;
 const distance=Math.max(mode==='hand'?6.6:8.5,(mode==='hand'?3.35:3)/(Math.tan(21*Math.PI/180)*Math.max(.2,aspect)));
 return {target,pitch,yaw:0,distance};
}

export function casinoActionPosition(key:string,personal:boolean):[number,number,number]{
 return key==='casino:bet'?[0,1.75,3.8]:[personal?(key==='casino:hit'?-1.5:1.5):(key==='casino:hit'?-5.25:5.25),1.75,personal?5.55:.2];
}
