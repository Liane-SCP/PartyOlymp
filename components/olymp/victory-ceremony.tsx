"use client";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, SkipForward, Trophy } from "lucide-react";
import type { Appearance } from "@/lib/appearance";
import { sound } from "@/lib/audio";
import { ceremonyLayout, ceremonyReveal, CEREMONY_DURATION } from "@/lib/ceremony";
import { Avatar } from "./art";
import {CeremonyWorld} from "./ceremony-world";
import {validQuality} from "@/lib/adventure-quality";
import {useGraphicsQuality} from './use-graphics-quality';

export interface CeremonyPlayer {
  id: string; name: string; rank: number; points: number;
  avatar: number; color: string; look?: Appearance;
}
export function VictoryCeremony({ players, reduced, intense, me }: {
  players: CeremonyPlayer[]; reduced: boolean; intense: boolean; me?:string;
}) {
  const time = useRef(0),timelineKey=useRef(''),heardRanks=useRef(new Set<number>());
  const [elapsed, setElapsed] = useState(0);
  const [replay, setReplay] = useState(0);
  const [worldRetry,setWorldRetry]=useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const top = players.filter(p=>p.rank<=3);
  const groups=ceremonyLayout(players).groups,availableRanks=groups.map(g=>g.rank);
  const ownId=players.find(p=>p.id===me)?.id??players[0]?.id??'';
  const [selected,setSelected]=useState(ownId),[quality,setQuality]=useGraphicsQuality();
  const selectedPlayer=players.find(p=>p.id===selected);
  useEffect(()=>{if(!players.some(p=>p.id===selected))setSelected(ownId);},[players,selected,ownId]);
  const signature = players.map(p => `${p.id}:${p.rank}:${p.color}:${JSON.stringify(p.look)}`).join("|");
  const winners = players.filter(p => p.rank === 1);
  const names = winners.map(p => p.name).join(" & ");
  const [systemReduced, setSystemReduced] = useState(false);
  const calm = reduced || systemReduced;
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(preference.matches);
    update(); preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const key=`${replay}:${signature}`;
    if(status!=="ready"){if(calm||status==='fallback')time.current=CEREMONY_DURATION;if(status==='fallback'){timelineKey.current=key;heardRanks.current=new Set([1,2,3]);}setElapsed(time.current);return;}
    if(timelineKey.current!==key){timelineKey.current=key;time.current=calm?CEREMONY_DURATION:0;heardRanks.current.clear();}
    if(calm)time.current=CEREMONY_DURATION;
    setElapsed(time.current);
    if(calm){heardRanks.current=new Set([1,2,3]);return;}
    let last = performance.now();

    const timer = window.setInterval(() => {
      const now = performance.now();
      if (!document.hidden) time.current += Math.min(0.25, (now - last) / 1000);
      last = now;
      setElapsed(time.current);
      for(const rank of [3,2,1]) if(time.current>=ceremonyReveal(rank,availableRanks)&&!heardRanks.current.has(rank)) {
        heardRanks.current.add(rank);
        if(top.some(p=>p.rank===rank)) sound.play(rank===1?"win":"lead");
      }
      if(time.current>=26) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [replay, calm, status, signature]);
  const crowned = elapsed >= ceremonyReveal(1,availableRanks) || calm || status === "fallback";
  const showAll = () => { heardRanks.current=new Set([1,2,3]);time.current=CEREMONY_DURATION; setElapsed(CEREMONY_DURATION);if(status==='ready'&&winners.length)sound.play('win'); };
  return (
    <section className={`victory-ceremony ${crowned?"is-crowned":""} ${calm?"is-calm":""} ${winners.length>3?"many-champions":""}`} aria-label="Siegerehrung">
      <CeremonyWorld players={players} time={time} calm={calm} intense={intense} selected={selected} quality={quality} onStatus={setStatus} retry={worldRetry}/>
      <div className="ceremony-vignette" />
      <header className="ceremony-title">
        <span>PARTY OLYMP · DAS GROSSE FINALE</span>
        <h2>{crowned ? winners.length>1?"Gemeinsam unbesiegbar.":"Der Olymp gehört dir." : "Euer Moment ist gekommen."}</h2>
        <p aria-live="polite">{crowned ? winners.length>3?`${winners.length} Champions`:names : "Eine Crew. Alles gegeben. Jetzt werden Legenden gekrönt."}</p>
      </header>
      {status !== "ready" && <div className="ceremony-fallback">
        <Trophy aria-hidden="true" />
        <span>{status==="loading"?"Die Bühne erwacht …":"Der Applaus gehört euch."}</span>
        {status==="fallback"&&<div>{players.map(p=><Avatar key={p.id} avatar={p.avatar} color={p.color} look={p.look} emote={4}/>)}</div>}
        {status==='fallback'&&<button className="scene-retry" type="button" onClick={()=>setWorldRetry(n=>n+1)}>3D erneut laden</button>}
      </div>}
      <div className="ceremony-places" style={{gridTemplateColumns:`repeat(${Math.max(1,groups.length)},minmax(0,1fr))`}}>
        {groups.map(group=>{const members=players.filter(p=>p.rank===group.rank),visible=calm||status==='fallback'||elapsed>=ceremonyReveal(group.rank,availableRanks);return <div key={group.rank} data-ceremony-rank={group.rank} className={`ceremony-place medal-${group.rank} ${visible?'is-revealed':''}`}>
          <span>{group.rank===1?(members.length>1?'CHAMPIONS':'CHAMPION'):`PLATZ ${group.rank}`}</span>
          <strong title={members.map(p=>p.name).join(' & ')}>{members.slice(0,2).map(p=>p.name).join(' & ')}{members.length>2?` +${members.length-2}`:''}</strong>
          <b>{members.length===1?members[0].points.toLocaleString('de-DE',{maximumFractionDigits:1}):members.length}<small>{members.length===1?' Punkte':' gemeinsam'}</small></b>
        </div>;})}
      </div>
      <div className="ceremony-participant"><label>Crew im Finale<select aria-label="Teilnehmer im Finale" value={selected} onChange={e=>setSelected(e.target.value)}>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><output aria-live="polite">{selectedPlayer&&<>Platz {selectedPlayer.rank} <b>{selectedPlayer.points.toLocaleString('de-DE',{maximumFractionDigits:1})} Punkte</b></>}</output></div>
      <footer className="ceremony-footer">
        <span>{crowned?"Für diesen Moment habt ihr gespielt.":"BRONZE · SILBER · GOLD"}</span>
        <label className="ceremony-quality">Grafik<select aria-label="Grafikqualität" value={quality} onChange={e=>{const value=validQuality(e.target.value);setQuality(value);try{localStorage.setItem('olymp.graphics',value);}catch{}}}><option value="auto">Automatisch</option><option value="high">Hoch</option><option value="medium">Mittel</option><option value="low">Sparsam</option></select></label>
        {!calm && status!=="fallback" && <button onClick={crowned?()=>setReplay(n=>n+1):showAll}>
          {crowned?<RotateCcw size={14}/>:<SkipForward size={14}/>}{crowned?"Noch einmal feiern":"Zum Siegerauftritt"}
        </button>}
      </footer>
    </section>
  );
}
