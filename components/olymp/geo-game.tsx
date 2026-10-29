"use client";
import { useAdventureDraft } from "./adventure-context";
import { useEffect, useRef, useState } from "react";
import { Panorama } from "./panorama";
import { WorldMap, type MapPin } from "./world-map";
import { sound } from "@/lib/audio";
import { useDeadlineInput } from "./deadline-input";
import {geoPrivatePin} from '@/lib/geo-presentation';
import {useGameSubmission} from './use-game-submission';
export function GeoGame({ room, me, act }: { room: any; me: string; act: (a: any) => void|Promise<boolean> }) {
  const g = room.game,
    [pin, setPin] = useState<MapPin | null>(()=>geoPrivatePin(g,room.phaseKey));
  const [view,setView]=useState<'photo'|'map'>('photo');
  const [restored,setRestored]=useState(false);
  const key=`olymp.geo:${room.code}:${room.phaseKey}:${me}`;
  const {pending,error,clearError,submit}=useGameSubmission(act,key);
  const canPin=restored&&!g.mine.submitted&&!g.mine.abandoned&&!pending;
  const authoritative=geoPrivatePin(g,room.phaseKey);
  const root=useRef<HTMLElement>(null);
  useEffect(()=>{
    try {
      const saved=JSON.parse(sessionStorage.getItem(key)??'null');
      if(!g.mine.submitted&&saved?.pin&&Number.isFinite(saved.pin.lat)&&Number.isFinite(saved.pin.lon)&&Math.abs(saved.pin.lat)<=90&&Math.abs(saved.pin.lon)<=180)setPin({lat:saved.pin.lat,lon:saved.pin.lon});
      if(saved?.view==='map'||saved?.view==='photo')setView(saved.view);
    }catch{}
    setRestored(true);
  },[key]);
  useEffect(()=>{
    if(!restored)return;
    try {if(g.mine.submitted)sessionStorage.removeItem(key);else sessionStorage.setItem(key,JSON.stringify({pin,view}));}catch{}
  },[restored,key,pin,view,g.mine.submitted]);
  useEffect(()=>{if(g.mine.submitted&&authoritative)setPin(previous=>previous!==null&&previous.lat===authoritative.lat&&previous.lon===authoritative.lon?previous:authoritative);},[g.mine.submitted,authoritative?.lat,authoritative?.lon]);
  useEffect(()=>{const node=root.current;if(!node)return;const choose=(event:Event)=>setView((event as CustomEvent).detail==='map'?'map':'photo');node.addEventListener('olymp-geo-view',choose);return()=>node.removeEventListener('olymp-geo-view',choose);},[]);
  useEffect(()=>{const node=root.current;if(!node||!canPin)return;const pick=(event:Event)=>{const p=(event as CustomEvent).detail;if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||Math.abs(p.lat)>90||Math.abs(p.lon)>180)return;clearError();setPin({lat:p.lat,lon:p.lon});sound.play('mapPin');};node.addEventListener('olymp-geopin',pick);return()=>node.removeEventListener('olymp-geopin',pick);},[g.round,canPin]);
  useAdventureDraft({pin,geoPending:pending},[pin,pending]);
  useDeadlineInput(room,act,restored&&pin&&!g.mine.submitted&&!g.mine.abandoned ? {type:"pin",lat:pin.lat,lon:pin.lon,round:g.round} : null);
  return (
    <section className="geo-arena" data-panel-view={view} ref={root}>
      <nav className="geo-panel-tabs" aria-label="Weltreise bedienen"><button className="secondary" aria-pressed={view==='photo'} onClick={()=>setView('photo')}>Panorama ansehen</button><button className="secondary" aria-pressed={view==='map'} onClick={()=>setView('map')}>Karte & Tipp</button></nav>
      <div className="geo-explore">
        <Panorama image={g.image} />
        <small className="geo-credit">
          Foto: {g.credit.author} ·{" "}
          <a href={g.credit.licenseUrl} target="_blank" rel="noreferrer">
            {g.credit.license}
          </a>{" "}
        </small>
      </div>
      <div className="geo-guess">
        <div className="new-mode-heading">
          <span className="eyebrow">EIN ORT. TAUSEND HINWEISE.</span>
          <h2>{g.mine.submitted?'Dein Ort ist festgelegt':pending?'Dein Ort wird bestätigt':'Wo auf der Welt bist du?'}</h2>
          <p>
            {g.mine.submitted?'Dein Pin bleibt bis zur gemeinsamen Auflösung geheim. Du kannst dich weiter im Panorama umsehen.':'Schau auf Schilder, Gebäude und Landschaft. Setze deinen Pin, zoome für mehr Genauigkeit.'}
          </p>
        </div>
        <WorldMap
          pin={pin}
          onPin={
            !canPin
              ? undefined
              : (p) => {
                  clearError();
                  setPin(p);
                  sound.play("mapPin");
                }
          }
        />
        <div className="geo-confirm">
          <span>
            {pin
              ? `${Math.abs(pin.lat).toFixed(2)}° ${pin.lat >= 0 ? "N" : "S"} · ${Math.abs(pin.lon).toFixed(2)}° ${pin.lon >= 0 ? "O" : "W"}`
              : "Noch kein Pin gesetzt"}
          </span>
          <button
            className="primary"
            disabled={!pin || !canPin}
            onClick={() => {if(pin&&canPin)void submit({ type: "pin", lat: pin.lat, lon: pin.lon, round:g.round });}}
          >
            {g.mine.submitted ? "Tipp gesichert ✓" : pending ? "Ort wird festgelegt …" : "Hier bin ich · Festlegen"}
          </button>
          {!g.mine.submitted&&error&&<p className="submission-error" role="alert">{error}</p>}
          <small>Näher dran = mehr Punkte · Bis zu 5.000 pro Ort</small>
        </div>
      </div>
    </section>
  );
}
