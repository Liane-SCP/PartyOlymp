"use client";
import {useContext,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useDeadlineInput} from './deadline-input';
import {ChainConsoleMount} from './chain-console-context';
import {useGameSubmission} from './use-game-submission';

export function ChainGame({room,me,act,now=Date.now()}:{room:any;me:string;act:(a:any)=>void|Promise<boolean>;now?:number}){
 const g=room.game,p=g.mine,dock=useContext(ChainConsoleMount),input=useRef<HTMLInputElement>(null),[answer,setAnswer]=useState(''),[historyPage,setHistoryPage]=useState(0),mine=g.turnId===me,name=(id:string)=>room.players.find((p:any)=>p.id===id)?.name??'Spieler';
 const {pending:sending,error,clearError,submit}=useGameSubmission(act,`${room.code}:${room.phaseKey}:${g.round}:${g.turn}:${g.stage}:${me}`);
 const action=(a:any)=>submit({...a,round:g.round,turn:g.turn});
 const waiting=g.stage==='answer',checking=g.stage==='review',voting=g.stage==='challenge',result=g.stage==='turnReveal',pages=Math.max(1,Math.ceil(g.history.length/20)),page=Math.min(historyPage,pages-1),history=[...g.history].reverse().slice(page*20,page*20+20);
 const checked=room.participantIds.filter((id:string)=>id!==g.turnId&&(voting?g.roster[id]?.voted:g.roster[id]?.approved)).length,judges=Math.max(0,room.participantIds.length-1);
 useDeadlineInput(room,act,waiting&&mine&&answer.trim()?{type:'answer',answer,round:g.round,turn:g.turn}:null);
 useEffect(()=>{setAnswer('');if(mine&&waiting)input.current?.focus({preventScroll:true});},[g.turn,waiting,mine,dock?.element]);
 useEffect(()=>{if(!dock?.element||waiting)return;const frame=requestAnimationFrame(()=>{const panel=dock.element?.querySelector<HTMLElement>('[data-chain-console]');(panel?.querySelector<HTMLButtonElement>('button:not(:disabled)')??panel)?.focus({preventScroll:true});});return()=>cancelAnimationFrame(frame);},[g.stage,g.turn,p.approved,p.ballot,dock?.element,waiting]);
 const panel=<section className="chain-world-console" data-chain-console data-stage={g.stage} aria-label="Expeditionspult" tabIndex={-1}>
  <header><strong>{g.topic.name}</strong><span>{mine?'Du':name(g.turnId)} · {waiting?'am Zug':voting?'Begriff angefochten':checking?'Crew prüft':'Ergebnis'}{g.deadline>0&&<b className="chain-clock" role="timer" aria-label="Verbleibende Zeit">{Math.max(0,Math.ceil((g.deadline-now)/1000))} s</b>}</span></header>
  {waiting?mine?<form onSubmit={e=>{e.preventDefault();if(answer.trim())action({type:'answer',answer});}}><input ref={input} autoFocus aria-label="Dein Begriff" value={answer} onFocus={()=>dock?.enter()} disabled={sending} onChange={e=>{setAnswer(e.target.value);clearError();}} maxLength={60} autoComplete="off" placeholder={`Etwas aus: ${g.topic.name}`}/><button className="primary" disabled={sending||!answer.trim()}>{sending?'Wird genannt \u2026':'Begriff nennen'}</button></form>:<p role="status">{p.alive?`${name(g.turnId)} sucht den nächsten Begriff.`:'Du fährst auf der Prüferfähre mit und darfst weiter mitprüfen.'}</p>:<>
   <div className="chain-world-word">{g.candidate?.answer||'Keine Antwort'}</div>
   {checking&&<>{mine?<p role="status">Die Crew prüft deinen Begriff.</p>:<div className="chain-world-actions"><button className="primary" disabled={sending||p.approved} onClick={()=>action({type:'approve'})}>{p.approved?'Bestätigt ✓':'✓ Passt'}</button><button disabled={sending} onClick={()=>action({type:'challenge'})}>⚑ Anfechten</button></div>}<small>{checked} / {judges} geprüft · 7 Sekunden · Ein Einwand öffnet die Abstimmung.</small></>}
   {voting&&<>{mine?<p role="status">Die anderen stimmen ab.</p>:p.ballot!==null?<p role="status">Deine Stimme ist versiegelt ✓</p>:<div className="chain-world-actions"><button className="primary" disabled={sending} onClick={()=>action({type:'vote',valid:true})}>✓ Gültig</button><button disabled={sending} onClick={()=>action({type:'vote',valid:false})}>✕ Ungültig</button></div>}<small>{checked} / {judges} versiegelt · {name(g.challengeBy)} fechtet an · Gleichstand: Begriff bleibt gültig.</small></>}
   {result&&<div role="status"><strong>{g.lastOutcome.valid?'Die Kette hält!':`${mine?'Du bist':name(g.turnId)+' ist'} raus!`}</strong><p>{g.lastOutcome.reason}</p>{g.verdict&&<small>{g.verdict.yes} gültig · {g.verdict.no} ungültig</small>}</div>}
  </>}
  {sending&&!waiting&&<p role="status">Deine Entscheidung wird gesendet …</p>}
  {error&&<p role="alert" className="submission-error">{error}</p>}
 </section>;
 return <section className="chain-arena">
  <header className="chain-heading"><span className="eyebrow">KATEGORIEN-KETTE · {Object.values(g.roster).filter((x:any)=>x.alive).length} NOCH DABEI</span><h2>{g.topic.name}</h2><p>{g.topic.hint}</p></header>
  <div className="chain-layout">{dock?.element?createPortal(panel,dock.element):panel}<details className="party-chain-history"><summary>Expeditionstagebuch · {g.history.length} Begriffe</summary><aside className="chain-history"><header><strong>Schon genannt</strong><span>{g.history.length} Begriffe / Züge</span></header><p>Gleiche Begriffe sind tabu. Inhaltliche Doppelungen könnt ihr anfechten.</p>
   <nav className="chain-history-pages" aria-label="Expeditionstagebuch"><button disabled={page===0} onClick={()=>setHistoryPage(page-1)} aria-label="Neuere Begriffe">←</button><span>{page+1} / {pages}</span><button disabled={page===pages-1} onClick={()=>setHistoryPage(page+1)} aria-label="Ältere Begriffe">→</button><button disabled={page===0} onClick={()=>setHistoryPage(0)}>Neueste</button></nav>
   <ol>{history.map((entry:any)=><li key={entry.id} className={entry.valid?'':'invalid'}><span>{entry.answer||'Zeit abgelaufen'}<small>{name(entry.player)} · {entry.reason}</small></span><b>{entry.valid?'✓':'✕'}</b></li>)}</ol>{!g.history.length&&<div className="chain-empty">Die Kette beginnt mit dem ersten Begriff.</div>}
  </aside></details></div>
  <div className="chain-order">{room.participantIds.map((id:string,i:number)=><span key={id} className={!g.roster[id].alive?'out':id===g.turnId?'current':''}><b>{g.roster[id].alive?i+1:'✕'}</b>{id===me?'Du':name(id)}{id===g.turnId&&g.roster[id].alive?' ◀':''}</span>)}</div>
 </section>;
}
