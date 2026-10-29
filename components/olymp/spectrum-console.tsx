"use client";
import {useContext,useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {SpectrumConsoleMount} from './spectrum-console-context';
import {useAdventureDraft} from './adventure-context';
import {useDeadlineInput} from './deadline-input';
import {spectrumClueError} from '@/lib/game/spectrum-clue';
import {sound} from '@/lib/audio';
import {useGameSubmission} from './use-game-submission';

export function SpectrumConsole({room,me,now,act}:{room:any;me:string;now:number;act:(a:any)=>void|Promise<boolean>}){
 const g=room.game,mine=g.mine,dock=useContext(SpectrumConsoleMount),help=useId(),input=useRef<HTMLInputElement>(null),dialInput=useRef<HTMLInputElement>(null),dragging=useRef(false),latest=useRef(act);latest.current=act;
 const [clue,setClue]=useState(''),[dial,setDial]=useState<number>(mine.dial??50),[changed,setChanged]=useState(false),[error,setError]=useState(''),[restored,setRestored]=useState(false);
 const psychic=g.psychic===me,canClue=g.stage==='clue'&&psychic&&!mine.abandoned,canDial=g.stage==='guess'&&!psychic&&!mine.submitted&&!mine.abandoned,key=`olymp.spectrum:${room.code}:${room.phaseKey.split(':')[0]}:${room.index}:${g.round}:${me}`;
 const {pending:sending,error:submissionError,clearError:clearSubmissionError,submit:submitAction}=useGameSubmission(act,`${key}:${g.stage}`);
 const enter=()=>dock?.dispatchEvent(new Event('olymp-spectrum-focus'));
 useAdventureDraft({spectrum:dial},[dial]);
 useEffect(()=>{try{const saved=JSON.parse(sessionStorage.getItem(key)??'null');if(saved){if(canClue&&typeof saved.clue==='string'&&saved.clue.length<=80)setClue(saved.clue);if(canDial&&saved.changed&&Number.isInteger(saved.dial)&&saved.dial>=0&&saved.dial<=100){setDial(saved.dial);setChanged(true);}}}catch{}setRestored(true);},[key]);
 useEffect(()=>{if(!restored)return;try{if(mine.submitted||mine.abandoned||!['clue','guess'].includes(g.stage))sessionStorage.removeItem(key);else sessionStorage.setItem(key,JSON.stringify({clue:canClue?clue:'',dial,changed}));}catch{}},[restored,key,clue,dial,changed,canClue,mine.submitted,mine.abandoned,g.stage]);
 useEffect(()=>{if(!dragging.current&&!changed)setDial(mine.dial??50);},[mine.dial,changed]);
 useEffect(()=>{if(mine.submitted)setDial(mine.guess??mine.dial??50);},[mine.submitted,mine.guess,mine.dial]);
 const send=(a:any)=>latest.current({...a,round:g.round});
 const commit=(value:number)=>{if(sending||!canDial)return;sound.play('spectrumDial');void send({type:'dial',value});};
 useDeadlineInput(room,act,restored&&canClue&&clue.trim()&&!spectrumClueError(clue)?{type:'clue',clue:clue.trim(),round:g.round}:restored&&canDial&&changed?{type:'lock',value:dial,round:g.round}:null);
 useEffect(()=>{const node=dialInput.current;if(!node||!canDial||sending)return;const choose=(event:Event)=>{const d=(event as CustomEvent<{value:number;commit:boolean}>).detail;if(!Number.isFinite(d?.value))return;const value=Math.max(0,Math.min(100,Math.round(d.value)));dragging.current=!d.commit;setChanged(true);setDial(value);if(d.commit){sound.play('spectrumDial');void latest.current({type:'dial',value,round:g.round});}};node.addEventListener('olymp-spectrum',choose);return()=>{node.removeEventListener('olymp-spectrum',choose);dragging.current=false;};},[canDial,g.round,dock,sending]);
 const submit=async()=>{if(sending||!restored)return;if(canClue){const problem=spectrumClueError(clue);setError(problem);if(problem)return;}else if(!canDial)return;await submitAction({...(canClue?{type:'clue',clue:clue.trim()}:{type:'lock',value:dial}),round:g.round});};
 const giver=room.players.find((p:any)=>p.id===g.psychic)?.name??'Der Hinweisgeber',ready=room.participantIds.filter((id:string)=>g.submitted?.[id]).length;
 const panel=<section className="spectrum-entry spectrum-arena" data-spectrum-entry data-restored={restored} aria-label="Dein Spectrum-Pult">
  <header><strong>{psychic?'Dein Hinweisplatz':'Dein geheimer Zeiger'}</strong><span role="timer" aria-label="Verbleibende Spectrum-Zeit">{Math.max(0,Math.ceil((g.deadline-now)/1000))} s</span></header>
  <h2>{g.clue?`„${g.clue}“`:psychic?'Welcher Begriff passt zum Ziel?':`${giver} sucht einen Hinweis …`}</h2>
  <p className="spectrum-entry-axis"><span>A · {g.axis.left}</span><span>B · {g.axis.right}</span></p>
  {g.axis.context&&<p className="spectrum-context">Thema: <strong>{g.axis.context}</strong></p>}
  {psychic&&typeof g.target==='number'&&<p className="spectrum-entry-target">Dein privates Ziel: <strong>{g.target}</strong> / 100</p>}
  {canClue?<form onSubmit={e=>{e.preventDefault();void submit();}}><label>Ein passender Begriff<input ref={input} value={clue} onFocus={enter} onChange={e=>{setClue(e.target.value);setError('');clearSubmissionError();}} maxLength={80} aria-describedby={help} aria-invalid={!!error} disabled={sending} autoComplete="off" enterKeyHint="done" placeholder="Zum Beispiel: Kaffee von gestern"/></label><small id={help} role={error?'alert':undefined}>{error||'Ein Begriff statt einer Zahl. Nur du siehst das Ziel.'}</small><button className="primary" disabled={!restored||sending||!clue.trim()}>{sending?'Wird geteilt …':'Hinweis teilen'}</button></form>:canDial?<div className="spectrum-controls"><label>Dein geheimer Zeiger · {dial}<input ref={dialInput} type="range" min={0} max={100} value={dial} disabled={sending} aria-label="Dein geheimer Zeiger" onFocus={enter} onPointerDown={()=>{dragging.current=true;}} onChange={e=>{clearSubmissionError();setChanged(true);setDial(Number(e.target.value));}} onPointerUp={e=>{dragging.current=false;commit(Number(e.currentTarget.value));}} onPointerCancel={()=>{dragging.current=false;}} onKeyUp={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))commit(Number(e.currentTarget.value));}}/></label><button className="primary" disabled={!restored||sending} onClick={()=>void submit()}>{sending?'Wird versiegelt …':'Meinen Tipp versiegeln'}</button></div>:<p className="spectrum-locked" role="status">{mine.abandoned?'Du schaust dieser Runde zu.':mine.submitted?`✓ Dein Tipp: ${mine.guess} · Noch geheim`:psychic?'Dein Hinweis ist geteilt. Die anderen ordnen ihn unabhängig ein.':'Das Ziel bleibt geheim. Gleich ordnest du den Hinweis ein.'}</p>}
  {submissionError&&(canClue||canDial)&&<p role="alert" className="submission-error">{submissionError}</p>}
  <footer>{g.stage==='guess'?`${ready} / ${Math.max(0,room.participantIds.length-1)} Tipps versiegelt`:'Ein gemeinsamer Hinweis · unabhängige Tipps'}<small>Abstand ≤ 2: 4 Punkte · ≤ 6: 3 · ≤ 10: 2</small></footer>
 </section>;
 return dock?createPortal(panel,dock):panel;
}
