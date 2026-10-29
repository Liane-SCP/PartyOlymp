"use client";
import {useContext,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {ColorConsoleMount} from './color-console-context';
import {AdventureDraft} from './adventure-context';
import {useDeadlineInput} from './deadline-input';
import {colorFrame,colorRgb} from '@/lib/color-presentation';
import {sound} from '@/lib/audio';
import {useGameSubmission} from './use-game-submission';
export function ColorConsole({room,me,now,act}:{room:any;me:string;now:number;act:(a:any)=>void|Promise<boolean>}){
 const g=room.game,mine=g.mine,dock=useContext(ColorConsoleMount),update=useContext(AdventureDraft),node=useRef<HTMLElement>(null),[rgb,setRgb]=useState([128,128,128]),[changed,setChanged]=useState(false),[restored,setRestored]=useState(false),key=`olymp.color:${room.code}:${room.phaseKey.split(':')[0]}:${room.index}:${g.round}:${me}`;
 const {pending:sending,error,clearError,submit:send}=useGameSubmission(act,key);
 const f=colorFrame(g,room.players.filter((p:any)=>room.participantIds.includes(p.id)),me,now,{rgb});
 useEffect(()=>{let next=[128,128,128],dirty=false;try{const saved=JSON.parse(sessionStorage.getItem(key)??'null'),valid=colorRgb(saved?.rgb);if(valid){next=valid;dirty=!!saved.changed;}}catch{}setRgb(mine?.submitted?colorRgb(mine.answer)??next:next);setChanged(dirty);setRestored(true);},[key]);
 useEffect(()=>{if(!restored)return;update?.({rgb:mine?.submitted?mine.answer:rgb});try{if(mine?.submitted)sessionStorage.removeItem(key);else sessionStorage.setItem(key,JSON.stringify({rgb,changed}));}catch{}},[rgb,changed,restored,key,mine?.submitted,mine?.answer,update]);
 const previousPhase=useRef(f.memorizing);useEffect(()=>{if(previousPhase.current&&!f.memorizing&&g.stage==='answer'&&now-g.previewUntil>=0&&now-g.previewUntil<1200)sound.play('colorClose');previousPhase.current=f.memorizing;},[f.memorizing,g.stage]);
 const change=(channel:number,value:number)=>{if(!f.canMix||sending)return;clearError();setChanged(true);setRgb(previous=>previous.map((v,i)=>i===channel?Math.max(0,Math.min(255,Math.round(value))):v));sound.init();sound.play('colorMix');};
 useEffect(()=>{const el=node.current;if(!el)return;const pick=(e:Event)=>{const {channel,value}=(e as CustomEvent).detail??{};if(Number.isInteger(channel)&&channel>=0&&channel<3&&Number.isFinite(value))change(channel,value);};el.addEventListener('olymp-color',pick);return()=>el.removeEventListener('olymp-color',pick);},[f.canMix,sending,key]);
 useDeadlineInput(room,act,f.canMix&&changed?{type:'answer',value:rgb,round:g.round}:null);
 const submit=async()=>{if(!f.canMix||sending)return;sound.init();await send({type:'answer',value:rgb,round:g.round});};
 const panel=<section className="color-lab-console color-controls" ref={node} data-color-controls data-restored={restored} aria-label="Dein Farbmischpult"><header><strong>{f.memorizing?'Präge dir die Zielprobe ein.':mine?.submitted?'Deine Mischung ist versiegelt':'Mische aus deiner Erinnerung.'}</strong><span role="timer">{Math.ceil(f.remaining/1000)} s</span></header>{f.memorizing?<><div className="color-lab-preview" style={{background:f.target?`rgb(${f.target.join(',')})`:'#777'}} aria-label="Zielprobe zum Merken"/><p>Die Probe schließt gleich. Danach stellst du Rot, Grün und Blau selbst ein.</p></>:<><div className="color-lab-preview" style={{background:`rgb(${(mine?.submitted?mine.answer:rgb).join(',')})`}} aria-label="Deine aktuelle Mischung"/>{['Rot','Grün','Blau'].map((name,i)=><label key={name}>{name}<input type="range" min="0" max="255" step="1" value={(mine?.submitted?mine.answer:rgb)[i]} aria-label={`${name} mischen`} disabled={!f.canMix||sending} onChange={e=>change(i,Number(e.target.value))}/><output>{(mine?.submitted?mine.answer:rgb)[i]}</output></label>)}<button type="button" className="primary" data-action="confirm-color" disabled={!f.canMix||sending} onClick={()=>void submit()}>{mine?.submitted?'Mischung versiegelt ✓':sending?'Wird versiegelt …':'Mischung versiegeln'}</button></>}{error&&!mine?.submitted&&<p role="alert" className="submission-error">{error}</p>}<footer>{f.submitted} / {f.rows.length} Mischungen versiegelt · Deine Mischung bleibt bis zur Auflösung privat.</footer></section>;
 return dock?createPortal(panel,dock):panel;
}
