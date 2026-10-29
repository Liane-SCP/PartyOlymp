"use client";
import {useContext,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {categories,diceScore,diceTotal} from '@/lib/game/games/dice';
import {DiceConsoleMount} from './dice-console-context';
import {Die,DiceCrew} from './showtime';
import {useGameSubmission} from './use-game-submission';

const explanations=['Summe aller Einsen','Summe aller Zweien','Summe aller Dreien','Summe aller Vieren','Summe aller Fünfen','Summe aller Sechsen','3 gleiche → alle Augen','4 gleiche → alle Augen','3 + 2 gleiche → 25','4 in Folge → 30','5 in Folge → 40','5 gleiche → 50','Alle Augen zählen'];

export function DiceTableControls({room,me,now,act,zeroCategory,setZeroCategory}:{room:any;me:string;now:number;act:(a:any)=>void|Promise<boolean>;zeroCategory:number|null;setZeroCategory:(index:number|null)=>void}){
 const mount=useContext(DiceConsoleMount),g=room.game,p=g.mine;
 const controller=useRef<HTMLDivElement>(null),ledger=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false);
 const {pending,error,submit}=useGameSubmission(act,`${room.code}:${room.phaseKey}:${g.round}:${g.turn}:${me}`);
 const upper=p.sheet.slice(0,6).reduce((a:number,b:number|null)=>a+(b??0),0),total=diceTotal(p.sheet),locked=p.done||p.submitted||g.stage!=='answer';
 const best=Math.max(0,...p.sheet.map((v:number|null,i:number)=>v===null&&p.rolls?diceScore(p.dice,i):0));
 function close(){setOpen(false);setZeroCategory(null);}
 useEffect(()=>{const node=controller.current;if(!node)return;const show=()=>setOpen(true);node.addEventListener('olymp-dice-sheet',show);return()=>node.removeEventListener('olymp-dice-sheet',show);},[mount]);
 useEffect(()=>{const dialog=ledger.current;if(!dialog)return;if(open&&!dialog.open)dialog.showModal();else if(!open&&dialog.open)dialog.close();},[open,mount]);
 useEffect(()=>{setOpen(false);},[g.round,g.turn,p.submitted]);
 async function send(action:any){
  if(locked)return false;
  return submit(action);
 }
 function choose(index:number){if(diceScore(p.dice,index)===0)setZeroCategory(index);else void send({type:'category',index});}
 const controls=<div className="dice-table-controls" ref={controller} aria-label="Dein Würfelplatz">
  <div className="dice-place-status"><strong>{pending?'Aktion wird bestätigt \u2026':p.submitted?'Eintrag gesichert':`Wurf ${p.rolls} von 3`}</strong><span>{p.submitted?`${p.lastEntry?.category??'Blatt'} · ${p.lastEntry?.value??0} Punkte`:`Zug ${g.turn??1}/13 · ${Math.max(0,Math.ceil((g.turnDeadline-now)/1000))} s`}</span></div>
  <div className="dice-tray">{p.dice.map((value:number,i:number)=><button key={i} type="button" className={`die ${p.held[i]?'held':''}`} disabled={!p.rolls||locked||pending} onClick={()=>void send({type:'hold',index:i})} aria-pressed={!!p.held[i]} aria-label={`Würfel ${i+1}: ${value}${p.held[i]?', gehalten':''}`}><Die value={value} held={p.held[i]} roll={p.rollId??0}/><small>{p.held[i]?'Gehalten':'Halten'}</small></button>)}</div>
  <div className="action-row"><button type="button" className="primary" disabled={p.rolls>=3||locked||pending} onClick={()=>void send({type:'roll'})}>{p.submitted?'✓ Eingetragen':p.rolls===0?'Erster Wurf →':p.rolls<3?`Becher werfen · ${3-p.rolls} übrig`:'Alle Würfe genutzt'}</button><button type="button" className="dice-ledger-open" ref={opener} onClick={()=>setOpen(true)} aria-haspopup="dialog">Wertungsblatt <span>{total} P.</span></button></div>
  {error&&!locked&&!open&&<p className="dice-action-error" role="alert">{error}</p>}
  <dialog ref={ledger} className="dice-ledger-dialog" aria-labelledby="dice-ledger-title" onCancel={close} onClose={()=>{setOpen(false);setZeroCategory(null);opener.current?.focus({preventScroll:true});}}>
   <header><div><span>DEIN PERSÖNLICHES BLATT</span><h2 id="dice-ledger-title">{room.players.find((x:any)=>x.id===me)?.name??'Dein'}s Würfelwerk</h2><p>{p.submitted?'Dein Eintrag steht. Die Crew spielt weiter.':p.rolls?'Wähle eine freie Zeile. Der Eintrag ist endgültig.':'Würfle zuerst, um Punkte einzutragen.'}</p></div><button type="button" onClick={close} aria-label="Wertungsblatt schließen">×</button></header>
   <div className="dice-ledger-scroll">
    <div className="dice-bonus"><span>Einser–Sechser <strong>{upper} / 63</strong></span><progress max="63" value={upper}/><small>{upper>=63?'Bonus erreicht: +35 Punkte':`Noch ${63-upper} Punkte bis zum Bonus von 35`}</small></div>
    <div className="score-sheet">{categories.map((name,index)=>{const used=p.sheet[index]!==null,value=used?p.sheet[index]:p.rolls?diceScore(p.dice,index):null;return <button type="button" key={name} className={used?'category-used':value>0&&value===best?'category-best':''} disabled={used||!p.rolls||locked||pending||zeroCategory!==null} onClick={()=>choose(index)} aria-label={`${name}: ${value??'noch kein Wurf'}${used?' Punkte, eingetragen':' Punkte möglich'}`}><span>{name}<small>{used?'✓ Eingetragen':explanations[index]}</small></span><strong>{value??'—'}{!used&&value===best&&value>0&&<small>BESTER WERT</small>}</strong></button>;})}</div>
   </div>
   <footer>{zeroCategory!==null&&!p.submitted?<div className="zero-choice" role="status"><strong>{categories[zeroCategory]} mit 0 Punkten streichen?</strong><span>Diese Kategorie ist danach für dieses Blatt belegt.</span><div><button type="button" className="primary" disabled={pending} onClick={()=>void send({type:'category',index:zeroCategory})}>Ja, 0 eintragen</button><button type="button" disabled={pending} onClick={()=>setZeroCategory(null)}>Zurück zur Auswahl</button></div></div>:<div className="dice-ledger-total"><span>{p.sheet.filter((v:any)=>v!==null).length}/13 Einträge · inklusive erreichtem Bonus</span><strong>{total} Punkte</strong></div>}{error&&!locked&&<p className="dice-action-error" role="alert">{error}</p>}</footer>
  </dialog>
 </div>;
 return <>{mount===undefined?controls:mount?createPortal(controls,mount):<p role="status">Dein Würfelplatz wird vorbereitet …</p>}<details className="dice-table-details" open><summary>Würfel und Wertungsblätter der Crew ansehen</summary><DiceCrew g={g} players={room.players} me={me}/></details>{g.best&&<p className="notice">Bester Zug: {room.players.find((x:any)=>x.id===g.best.id)?.name??'Crew'} · {g.best.category} · {g.best.value}</p>}</>;
}
