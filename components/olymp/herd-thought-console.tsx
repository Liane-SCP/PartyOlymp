"use client";
import {focusPlayInput} from "./focus-play-input";
import {useContext,useEffect,useRef,useState,useId} from 'react';
import {createPortal} from 'react-dom';
import {HerdThoughtMount} from './herd-thought-context';
import {useDeadlineInput} from './deadline-input';
import {herdKey} from '@/lib/game/herd-rules';
import {herdDraftKey} from '@/lib/herd-draft';

import {useGameSubmission} from './use-game-submission';
export function HerdThoughtConsole({room,me,now,act}:{room:any;me:string;now:number;act:(a:any)=>void|Promise<boolean>}){
 const g=room.game,mine=g.mine,dock=useContext(HerdThoughtMount),input=useRef<HTMLInputElement>(null),hint=useId(),[answer,setAnswer]=useState<string>(mine.answer??''),[restored,setRestored]=useState(false);
 const cacheKey=herdDraftKey(room,me),valid=!!herdKey(answer),sealed=!!mine.submitted,submitted=room.participantIds.filter((id:string)=>g.submitted?.[id]).length;
 const {pending:sending,error,clearError,submit:send}=useGameSubmission(act,`${cacheKey}:${g.round}`);
 useEffect(()=>{if(!sealed)try{const saved=JSON.parse(sessionStorage.getItem(cacheKey)??'null');if(saved?.round===g.round&&typeof saved.answer==='string'&&saved.answer.length<=60)setAnswer(saved.answer);}catch{}setRestored(true);},[cacheKey,g.round]);
 useEffect(()=>{if(!restored)return;try{if(sealed){sessionStorage.removeItem(cacheKey);setAnswer(mine.answer??'');}else sessionStorage.setItem(cacheKey,JSON.stringify({round:g.round,answer}));}catch{}},[answer,sealed,mine.answer,cacheKey,g.round,restored]);
 useEffect(()=>{if(!sealed&&(!dock||dock.element)&&matchMedia('(min-width:1000px) and (min-height:640px)').matches)focusPlayInput(input.current);},[dock?.element]);
 useDeadlineInput(room,act,!sealed&&valid?{type:'answer',answer,round:g.round}:null);
 const submit=async()=>{if(sealed||sending||!valid)return;await send({type:'answer',answer,round:g.round});};
 const panel=<section className="herd-thought-console herd-arena" data-herd-entry data-restored={restored} aria-label="Dein Gedankenplatz" onKeyDown={e=>{if(e.key==='Escape'&&!e.defaultPrevented&&!e.nativeEvent.isComposing){e.preventDefault();e.stopPropagation();input.current?.blur();dock?.leave();}}}>
  <header><div><strong>{sealed?'Dein Gedanke ist versiegelt':'Dein geheimer Gedanke'}</strong><small>{submitted} / {room.participantIds.length} Gedanken versiegelt</small></div><span role="timer" aria-label="Verbleibende Denkzeit">{Math.max(0,Math.ceil((g.deadline-now)/1000))} s</span>{dock&&<button type="button" disabled={sealed&&!dock.focused} onClick={()=>{if(dock.focused){input.current?.blur();dock.leave();}else{dock.enter();input.current?.focus({preventScroll:true});}}}>{dock.focused?'Park ansehen':'Mein Gedankenplatz'}</button>}</header>
  <h2>{g.question}</h2>
  <p className="herd-thought-hint">Welche Antwort werden die meisten anderen schreiben?</p>
  <form onSubmit={e=>{e.preventDefault();void submit();}}>
   <label>Deine geheime Antwort<input ref={input} value={answer} onFocus={()=>{if(!sealed)dock?.enter();}} onChange={e=>{setAnswer(e.target.value);clearError();}} aria-describedby={hint} maxLength={60} disabled={sealed||sending} autoComplete="off" enterKeyHint="done" placeholder="Dein erster Gedanke …"/></label>
   <button className="primary" disabled={sealed||sending||!valid}>{sealed?'Antwort versiegelt ✓':sending?'Wird versiegelt …':'Geheim festlegen'}</button>
  </form>
  {error&&!sealed&&<p role="alert" className="submission-error">{error}</p>}
  <small id={hint} role="status">{sealed?'Die Crew sieht deine Antwort erst bei der Aufdeckung.':answer&&!valid?'Schreibe eine Antwort mit Buchstaben oder Ziffern.':'Nur du siehst deinen Gedanken. Enter legt ihn verbindlich fest.'}</small>
  <details><summary>So findet ihr die Mehrheit</summary><p>Die einzige größte Antwortgruppe erhält je 100 Punkte, wenn mindestens zwei gleich denken. Gleich große Spitzengruppen und Einzelantworten erhalten 0 Punkte.</p></details>
 </section>;
 return dock?.element?createPortal(panel,dock.element):panel;
}
