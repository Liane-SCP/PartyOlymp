"use client";
import {useState} from 'react';
import {Avatar} from './art';
import {sound} from '@/lib/audio';

type Props={room:any;me:any;act:(a:any)=>Promise<boolean>};
function useChoice(room:any,act:Props['act'],type:string){
 const [busy,setBusy]=useState(false);
 async function send(choice:string){
  setBusy(true);
  try {if(await act({type,choice,phase:room.phaseKey}))sound.play('confirm');}
  finally {setBusy(false);}
 }
 return {busy,send};
}
export function RematchBoard({room,me,act}:Props){
 const view=room.rematch,{busy,send}=useChoice(room,act,'rematchIntent');
 const [preparing,setPreparing]=useState(false);
 if(!view)return null;
 const own=view.mine,full=view.free===0&&!own?.reserved;
 async function prepare(){setPreparing(true);try{await act({type:'rematch',phase:room.phaseKey});}finally{setPreparing(false);}}
 return <section className="rematch-board" aria-label="Gemeinsame Revanche">
  <div className="rematch-heading"><div><span className="rematch-eyebrow">Eure nächste Olympiade</span><h2>Noch eine Reise?</h2><p>Die Trophäe ist vergeben. Jetzt stellt ihr eure nächste Crew zusammen.</p></div><span className="rematch-ticket">{view.seats} / 12 Plätze</span></div>
  {view.champions.length>0&&<p className="rematch-champions">Titelverteidigung für {view.champions.map((p:any)=>p.name).join(' & ')}?</p>}
  <div className="rematch-choice" role="group" aria-label="Deine Revanche-Rolle">
   <button className="secondary" aria-pressed={own?.choice==='play'} disabled={busy||preparing||full} onClick={()=>send('play')}>Mitspielen</button>
   <button className="secondary" aria-pressed={own?.choice==='watch'} disabled={busy||preparing} onClick={()=>send('watch')}>Zuschauen</button>
  </div>
  <p className="rematch-help">{full?'Alle Spielplätze sind reserviert. Wenn jemand Zuschauen wählt, wird ein Platz frei.':own?.choice==='play'?'Dein Platz ist reserviert. In der Lobby bestätigst du anschließend deine Bereitschaft.':own?.choice==='watch'?'Du bleibst als Zuschauer bei der Crew. Bei freien Plätzen kannst du später wieder mitspielen.':own?.reserved?'Dein bisheriger Spielplatz ist noch reserviert. Wähle deine Rolle für die nächste Reise.':'Wähle, wie du die nächste Reise begleiten möchtest.'}</p>
  <p className="rematch-tally" role="status">{view.playing} dabei · {view.watching} schauen zu · {view.pending} noch offen</p>
  <ul className="rematch-crew" aria-label="Rückmeldungen der Crew">{view.rows.map((row:any)=>{const p=room.players.find((p:any)=>p.id===row.id);return <li key={row.id} data-choice={row.choice??'pending'} data-player={row.id} className={!row.eligible?'is-away':''}><Avatar avatar={p?.avatar} color={p?.color} look={p?.look}/><div><strong>{row.name}{row.id===me?.id?' · Du':''}</strong><span>{!row.eligible?'Derzeit abwesend':row.choice==='play'?'Spielt mit':row.choice==='watch'?'Schaut zu':'Noch offen'}{row.eligible&&!row.connected?' · Verbindung wird erwartet':''}</span></div></li>;})}</ul>
  <div className="rematch-departure"><p>Eure Spielauswahl bleibt erhalten. Der Gastgeber öffnet die Lobby; gestartet wird, sobald alle aktiven Spieler bereit sind.</p>{room.host===me?.id?<button className="primary" disabled={preparing||busy} onClick={prepare}>{preparing?'Lobby wird vorbereitet …':'Revanche vorbereiten'}</button>:<span className="muted">Der Gastgeber bereitet die nächste Reise vor.</span>}</div>
 </section>;
}
export function LobbyParticipation({room,me,act}:Props){
 const {busy,send}=useChoice(room,act,'participation');
 const seats=room.players.filter((p:any)=>!p.spectator&&p.rejoinUntil>room.serverTime).length;
 return <div className="lobby-participation"><div><strong>Dein Platz in der Crew</strong><p>{me?.spectator?'Du schaust zu. Wähle Mitspielen, um einen freien Platz zu übernehmen.':'Du spielst mit. Melde dich bereit, wenn die Auswahl für dich passt.'}</p></div><div role="group" aria-label="Deine Lobby-Rolle"><button className="secondary" aria-pressed={!me?.spectator} disabled={busy||(me?.spectator&&seats>=12)} onClick={()=>send('play')}>Mitspielen</button><button className="secondary" aria-pressed={!!me?.spectator} disabled={busy} onClick={()=>send('watch')}>Zuschauen</button></div><span>{seats} / 12 Spielplätze reserviert</span></div>;
}
