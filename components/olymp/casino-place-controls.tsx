'use client';
import {tableCardText} from './card-table-presentation';
import type {casinoPlaceFrame} from '@/lib/casino-place';
export function CasinoPlaceControls({frame,bet,pending,error,onPick,showCards=false}:{frame:ReturnType<typeof casinoPlaceFrame>;bet:number;pending:boolean;error?:string;onPick?:(key:string)=>void;showCards?:boolean}){
 return <div className="casino-place-controls" data-casino-controls aria-label="Dein Casinoplatz">
  <div className="casino-place-status"><strong>{frame.mode==='dealer'?`Dealer · ${frame.dealerValue??'—'}${frame.dealerHidden?' + ?':''}`:frame.bet?`Deine Hand · ${frame.value}`:'Dein Platz am Filz'}</strong><span>{frame.own?`${frame.chips.toLocaleString('de-DE')} Chips · Einsatz ${frame.bet||'—'}`:'Zuschauer'}</span></div>
  <p role="status">{pending?'Wird bestätigt …':frame.status}</p>
  <span className={`casino-accessible-cards ${showCards?'casino-visible-cards':''}`}>{frame.mode==='dealer'?`Gezeigt: ${frame.dealerShown.map(tableCardText).join(', ')}${frame.dealerHidden?', weitere Dealerkarte verdeckt':''}`:`Deine Karten: ${frame.hand.map(tableCardText).join(', ')||'noch keine'}`}</span>
  {frame.canBet&&<div className="casino-place-bets" aria-label="Einsatz wählen">{[10,25,50,75,100].map(value=><button type="button" key={value} disabled={pending||value>frame.chips} aria-pressed={bet===value} onClick={()=>onPick?.(`casinoBetChoice:${value}`)}>{value}</button>)}<button type="button" className="casino-place-confirm" disabled={pending||bet>frame.chips} onClick={()=>onPick?.('casino:bet')}>Mit {bet} Chips starten</button></div>}
  {frame.bet>0&&!frame.revealing&&frame.own&&<div className="casino-place-actions"><button type="button" disabled={pending||!frame.canPlay} onClick={()=>onPick?.('casino:hit')}>Karte ziehen</button><button type="button" disabled={pending||!frame.canPlay} onClick={()=>onPick?.('casino:stand')}>Stehen bleiben</button></div>}
  {frame.result&&<p className="casino-place-result">{frame.result.payout>frame.result.bet?`Gewinn +${frame.result.payout-frame.result.bet}`:frame.result.payout===frame.result.bet?'Gleichstand':`Verlust ${frame.result.bet-frame.result.payout}`} · {frame.result.payout} Chips zurück</p>}
  {error&&<p role="alert">{error}</p>}
 </div>;
}
