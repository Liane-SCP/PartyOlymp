"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Mic2, Volume2 } from "lucide-react";
import { Avatar } from "./art";
import { sound } from "@/lib/audio";
import type { ShowMoment } from "@/lib/game/gameshow";
import {PARTY_FLOW} from '@/lib/game/party-flow';

export function GameShow({room,now,mode}: {room:any; now:number; mode:"preview"|"recap"}) {
  const [manual,setManual]=useState<number|null>(null),[voice,setVoice]=useState(false),[speaking,setSpeaking]=useState(false);
  const utterance=useRef<SpeechSynthesisUtterance|null>(null);
  const moments:ShowMoment[]=room.gameShow?.[mode] ?? [];
  const start=room.deadline-(mode==="preview"?PARTY_FLOW.rules:PARTY_FLOW.standings);
  const elapsed=Math.max(0,now-start-(mode==="recap"?7800:0));
  const ready=mode==="preview"||room.phase==="paused"||now>=start+7800;
  const index=manual===null ? Math.min(moments.length-1,Math.floor(elapsed/5000)) : Math.min(manual,moments.length-1);
  const moment=moments[index];
  useEffect(()=>setVoice("speechSynthesis" in window && "SpeechSynthesisUtterance" in window),[]);
  useEffect(()=>{setManual(null);},[mode,room.history.at(-1)?.id,room.index]);
  useEffect(()=>{
    return ()=>{if(utterance.current){speechSynthesis.cancel();utterance.current=null;setSpeaking(false);}};
  },[moment?.id]);
  useEffect(()=>{
    if(sound.settings.muted && utterance.current){speechSynthesis.cancel();utterance.current=null;setSpeaking(false);}
  },[sound.settings.muted]);
  const announce=()=>{
    if(!moment||sound.settings.muted||!voice)return;
    speechSynthesis.cancel();
    const speech=new SpeechSynthesisUtterance(`${moment.title} ${moment.text}`);
    speech.lang="de-DE";speech.rate=1.04;speech.volume=Math.min(1,sound.settings.master*sound.settings.effects);
    const german=speechSynthesis.getVoices().find(v=>v.lang.startsWith("de"));if(german)speech.voice=german;
    speech.onend=speech.onerror=()=>{setSpeaking(false);utterance.current=null;};
    utterance.current=speech;setSpeaking(true);speechSynthesis.speak(speech);
  };
  if(!moment)return null;
  const featured=moment.players.map(id=>room.players.find((p:any)=>p.id===id)).filter(Boolean).slice(0,2);
  return <section className={`gameshow gameshow-${ready?moment.kind:"opening"}`} aria-label={mode==="preview"?"Eure Rivalitäten":"Show-Rückblick"}>
    <div className="gameshow-top"><span><Mic2 size={15}/>{ready?moment.label:"LIVE AUS DER WERTUNG"}</span><small>OLYMP LIVE</small></div>
    {!ready ? <div className="gameshow-wait"><strong>Die Punkte rollen. Die Plätze wackeln.</strong><p>Gleich kommen die Geschichten hinter eurer neuen Wertung.</p></div> :
      <div className="gameshow-scene" key={moment.id}>
        {featured.length>0 && <div className={`gameshow-faces ${featured.length===1?"solo":""}`}>
          {featured.map((p:any,i:number)=><div className="gameshow-contender" key={p.id}>
            <div className="gameshow-avatar"><Avatar avatar={p.avatar} look={p.look} color={p.color}/></div>
            <strong>{p.name}</strong><span>{p.points.toLocaleString("de-DE",{maximumFractionDigits:1})} Punkte · Platz {room.standings.find((s:any)=>s.id===p.id)?.rank ?? "–"}</span>
            {i===0&&featured.length===2&&<b className="gameshow-versus" aria-hidden="true">VS</b>}
          </div>)}
        </div>}
        <div className="gameshow-comment" role="status" aria-live="polite"><h3>{moment.title}</h3><p>{moment.text}</p></div>
        {moment.headToHead && <div className="gameshow-duel-record"><span>DIREKTER VERGLEICH · DISZIPLINEN</span><strong>{moment.headToHead.left} : {moment.headToHead.right}</strong><small>{moment.headToHead.ties} {moment.headToHead.ties===1?"Gleichstand":"Gleichstände"} · Reihenfolge wie oben</small></div>}
        {moment.metric&&<span className="gameshow-metric">{moment.metric}</span>}
      </div>}
    <div className="gameshow-bottom">
      <div className="gameshow-pages">
        <button aria-label="Vorheriger Show-Moment" disabled={!ready||index<=0} onClick={()=>setManual(index-1)}><ChevronLeft size={16}/></button>
        <span>{ready?index+1:"–"}/{moments.length} MOMENTE</span>
        <button aria-label="Nächster Show-Moment" disabled={!ready||index>=moments.length-1} onClick={()=>setManual(index+1)}><ChevronRight size={16}/></button>
      </div>
      {voice&&<button className="gameshow-voice" disabled={!ready||sound.settings.muted} onClick={announce}><Volume2 size={15}/>{speaking?"Ansage läuft …":"Ansage anhören"}</button>}
    </div>
  </section>;
}
