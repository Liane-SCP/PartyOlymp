'use client';
import {JourneyMap} from './journey-map';
import {byId} from '@/lib/game/catalog';
import {useEffect,useState} from 'react';
import {PARTY_FLOW} from '@/lib/game/party-flow';

/** The route belongs between minigames. Only a paused room offers exploration. */
export function PartyJourney({room,me,now,reduced,act}:{room:any;me:string;now:number;reduced:boolean;act:(a:any)=>Promise<unknown>}) {
  const [selected,setSelected]=useState(room.index);
  useEffect(()=>setSelected(room.index),[room.index,room.phase]);
  const travelling=['travel','wheel'].includes(room.phase);
  const game=byId(room.selection[room.index].id);
  const duration=room.journey?.travel?.duration??PARTY_FLOW.arrival;
  const progress=Math.max(0,Math.min(1,1-(room.deadline-now)/duration));
  return <div className={`party-journey ${travelling?'is-travelling':''}`}>
    <JourneyMap selection={room.selection} selected={selected} current={room.index}
      crew={room.players.filter((p:any)=>room.participantIds.includes(p.id))}
      completed={room.history.length} trophies={room.journey?.trophies??[]}
      reduced={reduced} onSelect={setSelected} me={me} cinematic={room.phase!=='paused'}
      canMove={false} moves={room.journey?.moves} travel={room.phase==='travel'?room.journey?.travel:undefined}
      emotes={room.emotes??[]} serverTime={now} act={act}/>
    {travelling&&<div className="party-arrival" role="status">
      <span className="eyebrow">{room.index===0?'EURE REISE BEGINNT':`ETAPPE ${room.index+1} VON ${room.selection.length}`}</span>
      <h1>{game.name}</h1>
      <p>{room.index===0?'Die Crew trifft sich am ersten Spielort.':'Gemeinsam zum nächsten Spielort.'}</p>
      <div className="party-arrival-progress" aria-hidden="true"><i style={{transform:`scaleX(${progress})`}}/></div>
      <small>Danach: Regeln ansehen und bereit melden.</small>
    </div>}
  </div>;
}
