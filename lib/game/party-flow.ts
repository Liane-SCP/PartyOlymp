/** Shared pacing for the authoritative room and its presentation. */
import type {Selection} from './types';
import {isBoss} from './boss-rules';
export const PARTY_FLOW = {
  arrival: 3500,
  travel: 6500,
  rules: 45000,
  countdown: 3000,
  reveal: 12000,
  standings: 12000,
} as const;

export const mapAvailable = (phase: string) => ['travel', 'paused'].includes(phase);

/** Bind lobby approval to exactly the visible games, order and settings. */
export const partyPlanKey = (selection: readonly Selection[]) => selection
  .map(game => `${game.id}:${game.rounds}:${game.seconds}`).join('|');

/** Curate suggestions before they are shown; never change a room's confirmed route. */
export function suggestedPartyRoute(selection: Selection[]) {
  const bosses=selection.filter(s=>isBoss(s.id)),normal=selection.filter(s=>!isBoss(s.id));
  if(!bosses.length||!normal.length)return [...selection];
  const slots=new Map(bosses.map((game,i)=>[Math.floor((i+1)*selection.length/bosses.length)-1,game]));
  let next=0;
  return selection.map((_,i)=>slots.get(i)??normal[next++]);
}

export function briefingFormat(selection: Selection) {
  const rounds=`${selection.rounds} ${selection.rounds===1?'Runde':'Runden'}`;
  if(selection.id==='dice')return `${selection.rounds} ${selection.rounds===1?'Partie':'Partien'} · 13 gemeinsame Züge pro Partie · ${selection.seconds} s pro Zug`;
  if(selection.id==='code')return `${rounds} · Gemeinsame Züge ohne Zeitdruck`;
  if(selection.id==='bomb')return `${rounds} · Die Lunte bleibt geheim`;
  if(selection.id==='chain')return `${rounds} · ${selection.seconds} s pro Begriff`;
  if(selection.id==='auction')return `${rounds} · ${selection.seconds} s für deine Begriffe`;
  if(selection.id==='timing')return `${rounds} · Während der Messung bleibt die Uhr verborgen`;
  return `${rounds} · ${selection.seconds} s pro ${selection.id==='cards'?'Zug':'Antwortphase'}`;
}

export function partyStep(phase: string) {
  if (phase === 'lobby') return 'Crew & Spielplan';
  if (phase === 'travel' || phase === 'wheel') return 'Gemeinsam unterwegs';
  if (phase === 'rules') return 'So wird gespielt';
  if (phase === 'countdown') return 'Gleich geht’s los';
  if (phase === 'playing') return 'Minispiel';
  if (phase === 'reveal') return 'Spielergebnis';
  if (phase === 'standings') return 'Gesamtwertung';
  if (phase === 'paused') return 'Pause';
  return 'Siegerehrung';
}
