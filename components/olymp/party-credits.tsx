'use client';
import {useEffect,useState} from 'react';
type Credit={id:string;title?:string;author:string;source:string;license:string;changes:string};

export function PartyCredits(){
  const [open,setOpen]=useState(false),[credited,setCredited]=useState<Credit[]>([]);
  useEffect(()=>{if(!open)return;let cancelled=false;void fetch('/adventure-models/manifest.json').then(response=>{if(!response.ok)throw Error('credits');return response.json();}).then(raw=>{const data=raw as {assets?:Credit[]};if(!cancelled&&Array.isArray(data.assets))setCredited(data.assets.filter(asset=>asset.license!=='CC0-1.0'));}).catch(()=>{});return()=>{cancelled=true;};},[open]);
  return <details className="party-credits" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Modelle & Künstler</summary>
    <p>Umgebungsmodelle von <a href="https://kenney.nl/assets" target="_blank" rel="noreferrer">Kenney</a> · CC0.</p>
    {credited.map(asset=><p key={asset.id}><a href={asset.source} target="_blank" rel="noreferrer">{asset.title??asset.id}</a> · {asset.author} · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">{asset.license}</a><small>{asset.changes}</small></p>)}
    <a href="/adventure-models/manifest.json" target="_blank" rel="noreferrer">Vollständiges Modellverzeichnis</a>
  </details>;
}
