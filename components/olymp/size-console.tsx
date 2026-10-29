"use client";
import {useContext,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {SizeConsoleMount} from './size-console-context';
import {AdventureDraft} from './adventure-context';
import {useDeadlineInput} from './deadline-input';
import {formatLength,sizeKindLabel} from './size-art';
import {SIZE_DIAL_MIN,SIZE_DIAL_MAX,validSizeInput} from '@/lib/size-input';
import {sound} from '@/lib/audio';

export function SizeConsole({room,me,act}:{room:any;me:string;act:(a:any)=>void|Promise<boolean>}){
 const g=room.game,mine=g.mine,dock=useContext(SizeConsoleMount),update=useContext(AdventureDraft),node=useRef<HTMLElement>(null),inFlight=useRef(false);
 const key=`olymp.size:${room.code}:${room.phaseKey.split(':')[0]}:${room.index}:${g.round}:${me}`;
 const [entry,setEntry]=useState({key:'',cm:100,text:'100',changed:false}),[sending,setSending]=useState(false),[error,setError]=useState('');
 const restored=entry.key===key,locked=!!mine?.submitted,cm=locked?mine.answer:entry.cm,valid=validSizeInput(entry.text),canChange=g.stage==='answer'&&!!mine&&!mine.submitted&&!mine.abandoned&&restored&&!sending;
 useEffect(()=>{
  let cm=validSizeInput(g.reference?.cm)??100,changed=false;
  try{const saved=JSON.parse(sessionStorage.getItem(key)??'null'),value=validSizeInput(saved?.cm);if(value!==null&&saved.changed===true){cm=value;changed=true;}}catch{}
  if(mine?.submitted)cm=validSizeInput(mine.answer)??cm;
  setEntry({key,cm,text:String(cm),changed});setError('');
 },[key]);
 useEffect(()=>{
  if(!restored)return;
  update?.({size:cm});
  try{if(locked)sessionStorage.removeItem(key);else if(entry.changed&&valid!==null)sessionStorage.setItem(key,JSON.stringify({cm:valid,changed:true}));else sessionStorage.removeItem(key);}catch{}
 },[entry,restored,locked,cm,valid,key,update]);
 const change=(value:number)=>{if(!canChange)return;const candidate=validSizeInput(value);if(candidate===null)return;const cm=Number(candidate.toPrecision(12));setEntry(previous=>({...previous,cm,text:String(cm),changed:true}));setError('');sound.init();};
 useEffect(()=>{const el=node.current;if(!el)return;const pick=(event:Event)=>{const value=(event as CustomEvent).detail?.value;if(Number.isFinite(value))change(value);};el.addEventListener('olymp-size',pick);return()=>el.removeEventListener('olymp-size',pick);},[canChange]);
 useDeadlineInput(room,act,restored&&g.stage==='answer'&&!!mine&&!locked&&!mine.abandoned&&entry.changed&&valid!==null?{type:'answer',value:valid,round:g.round}:null);
 const submit=async()=>{
  if(!canChange||valid===null||inFlight.current)return;
  inFlight.current=true;setSending(true);setError('');sound.init();
  try{const accepted=await act({type:'answer',value:valid,round:g.round});if(accepted===false)setError('Noch nicht bestätigt. Bitte versuche es erneut.');}
  catch(e){setError(e instanceof Error?e.message:'Die Abgabe konnte nicht bestätigt werden.');}
  finally{inFlight.current=false;setSending(false);}
 };
 const crew=room.players.filter((p:any)=>room.participantIds.includes(p.id)),submitted=crew.filter((p:any)=>g.submitted?.[p.id]).length;
 const panel=<section ref={node} className="size-console" data-size-controls data-round={g.round} data-restored={restored} aria-label="Dein Messpult">
  <header className="size-task"><div><h2>{g.item.name}</h2><p>{g.item.measure}{g.item.kind?` · ${sizeKindLabel(g.item.kind)} · Kategoriemodell`:''}</p></div><output aria-label="Deine Modellgröße">{formatLength(cm)}</output></header>
  <form onSubmit={event=>{event.preventDefault();void submit();}}>
   <div className="size-console-entry"><label>Dein Tipp in cm<input type="number" inputMode="decimal" aria-label="Größe in Zentimetern" aria-invalid={!locked&&restored&&valid===null} aria-describedby={valid===null?'size-input-error':undefined} step="any" enterKeyHint="done" onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();void submit();}}} max={1e8} value={locked?String(cm):entry.text} disabled={!canChange} onChange={event=>{const text=event.target.value,value=validSizeInput(text);setEntry(previous=>({...previous,text,cm:value??previous.cm,changed:true}));setError('');sound.init();}}/></label><button type="submit" className="primary" data-action="confirm-size" disabled={!canChange||valid===null}>{locked?'✓ Größe abgegeben':sending?'Wird versiegelt …':'Größe festlegen'}</button></div>
   <label className="size-slider"><span>Modell kleiner / größer</span><input type="range" aria-label="Modellgröße einstellen" min={SIZE_DIAL_MIN} max={SIZE_DIAL_MAX} step="any" value={Math.max(SIZE_DIAL_MIN,Math.min(SIZE_DIAL_MAX,Math.log(cm)))} disabled={!canChange} onChange={event=>change(Number(Math.exp(Number(event.target.value)).toPrecision(6)))}/></label>
   <div className="size-console-nudges">{[[.5,'×½','Halb so groß'],[.9,'−10 %','Zehn Prozent kleiner'],[1.1,'+10 %','Zehn Prozent größer'],[2,'×2','Doppelt so groß']].map(([factor,label,title])=><button type="button" key={String(label)} aria-label={String(title)} disabled={!canChange||validSizeInput(cm*Number(factor))===null} onClick={()=>change(cm*Number(factor))}>{label}</button>)}</div>
  </form>
  {!locked&&restored&&valid===null&&<p id="size-input-error" role="alert">Gib eine Größe über 0 bis 100.000.000 cm ein. Das Modell zeigt deinen letzten gültigen Tipp.</p>}
  {error&&<p role="alert">{error}</p>}
  <footer><span>Referenz: {g.reference?.name} · {formatLength(g.reference?.cm??100)}</span><span>{submitted} / {crew.length} abgegeben · {locked?'Dein Tipp ist versiegelt.':'Dein Tipp bleibt privat.'}</span></footer>
 </section>;
 return dock?createPortal(panel,dock):panel;
}
