"use client";
import {focusPlayInput} from "./focus-play-input";
import {useContext,useEffect,useRef,useState} from 'react';import {createPortal} from 'react-dom';import {PictureConsoleMount} from './picture-console-context';import {pictureFrame} from '@/lib/picture-presentation';import {useDeadlineInput} from './deadline-input';import {sound} from '@/lib/audio';
import {useGameSubmission} from './use-game-submission';
export function PictureConsole({room,me,now,act}:{room:any;me:string;now:number;act:(a:any)=>void|Promise<boolean>}){
 const g=room.game,mine=g.mine,dock=useContext(PictureConsoleMount),f=pictureFrame(g,room.players.filter((p:any)=>room.participantIds.includes(p.id)),me,now),[answer,setAnswer]=useState(''),input=useRef<HTMLInputElement>(null),key=`olymp.picture:${room.code}:${room.phaseKey.split(':')[0]}:${room.index}:${g.round}:${g.buzzTurn??0}:${me}`;
 const {pending:sending,error,clearError,submit:send}=useGameSubmission(act,key);
 useEffect(()=>{setAnswer('');if(f.canAnswer)try{const saved=sessionStorage.getItem(key);if(saved&&saved.length<=100)setAnswer(saved);}catch{}},[key,f.canAnswer]);
 useEffect(()=>{try{if(f.canAnswer)sessionStorage.setItem(key,answer);else sessionStorage.removeItem(key);}catch{}},[answer,key,f.canAnswer]);
 useEffect(()=>{if(f.canAnswer&&matchMedia('(min-width:1000px) and (min-height:640px)').matches)focusPlayInput(input.current);},[f.canAnswer,dock]);
 useDeadlineInput(room,act,f.canAnswer&&answer.trim()?{type:'answer',value:answer,round:g.round}:null);
 const submit=async()=>{if(!f.canAnswer||sending||!answer.trim())return;sound.init();await send({type:'answer',value:answer.trim(),round:g.round});};
 const owner=f.rows.find(r=>r.id===f.owner),panel=<section className="picture-entry" data-picture-controls aria-label="Dein Pixelblitz-Pult"><header><strong>{f.canAnswer?'Du bist am Buzzer':f.owner?`${owner?.name??'Die Crew'} antwortet`:'Erkennst du das Bild?'}</strong>{f.owner&&<span role="timer">{Math.ceil(f.remaining/1000)} s</span>}</header>
 {f.canAnswer?<form className="answer-form" onSubmit={e=>{e.preventDefault();void submit();}}><input ref={input} value={answer} onChange={e=>{setAnswer(e.target.value);clearError();}} disabled={sending||f.remaining<=0} autoComplete="off" enterKeyHint="done" aria-label="Deine Antwort" placeholder="Was erkennst du?" maxLength={100}/><button className="primary" disabled={sending||f.remaining<=0||!answer.trim()}>{sending?'Wird geprüft …':'Antwort abschicken ↗'}</button></form>:<div className="pixel-buzzer"><button className="primary" disabled={!f.canBuzz||sending} onClick={()=>{sound.init();void send({type:'buzz',round:g.round});}}>{sending?'Buzzer wird angefragt \u2026':mine.buzzedOut?'Für dieses Bild ausgeschieden':f.owner?'Buzzer besetzt':'BUZZERN! ⚡'}</button><p>{mine.buzzedOut?'Du bleibst im Studio dabei. Beim nächsten Bild bist du wieder dran.':f.owner?'Das Bild hält an. Nur der erste Buzzer darf antworten.':'Eine Chance pro Bild. Buzzere, sobald du das Motiv erkennst.'}</p></div>}
 {error&&(f.canAnswer||f.canBuzz)&&<p role="alert" className="submission-error">{error}</p>}
 {mine.buzzedOut&&mine.answer&&<p role="status" className="guess-feedback">„{mine.answer}“ war nicht richtig.</p>}<footer><span>{Math.round(f.progress*100)} % aufgedeckt{f.owner?' · angehalten':''}</span><span>{f.rows.filter(r=>!r.out&&!r.abandoned).length} / {f.rows.length} noch im Rennen</span></footer></section>;
 return dock?createPortal(panel,dock):panel;
}
