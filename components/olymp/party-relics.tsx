'use client';
import {useEffect,useState} from 'react';
import {relics,relicInfo} from '@/lib/game/journey';
import {useGameSubmission} from './use-game-submission';

export function PartyRelics({room,me,act,onPending}:{room:any;me:any;act:(a:any)=>Promise<boolean>;onPending?:(pending:boolean)=>void}) {
  const {pending,error,submit}=useGameSubmission(act,`${room.phaseKey}:${me?.id}`);
  const [requested,setRequested]=useState<{phase:string;item?:string;kind?:string}|null>(null);
  useEffect(()=>{onPending?.(pending);return()=>onPending?.(false);},[pending,onPending]);
  const journey=room.journey;
  if(!journey||!me||me.spectator)return null;
  const equipped=journey.equipped.find((e:any)=>e.player===me.id);
  const send=(a:any)=>{setRequested({phase:room.phaseKey,item:a.item,kind:a.kind});return submit({...a,phase:room.phaseKey});};
  return <details className="party-relics">
    <summary>{equipped?`${relicInfo(equipped.kind)?.symbol} ${relicInfo(equipped.kind)?.name} eingesetzt`:`Relikt wählen · optional${journey.chests?' · Schatztruhe wartet':''}`}</summary>
    <div className="party-relic-options">
      <p role="status">{pending?'Deine Auswahl wird bestätigt …':equipped?'Dein Bonus ist für dieses Spiel gesichert.':me.ready?'Du bist bereit. Relikte wählst du vor deiner Bereitschaft.':'Ein Relikt gibt dir einen Punktebonus. Du kannst auch ohne Relikt starten.'}</p>
      {relics.map(info=>{
        const items=journey.inventory.filter((item:any)=>item.kind===info.id);
        return <div className="party-relic-choice" key={info.id}>
          <span aria-hidden="true">{info.symbol}</span><div><strong>{info.name} · {items.length}</strong><p>{info.description}</p></div>
          <button type="button" className="secondary" disabled={pending||!!equipped||me.ready||!items.length} onClick={()=>void send({type:'relic',item:items[0].id})}>{error&&requested!==null&&requested.phase===room.phaseKey&&requested.item&&items.some((item:any)=>item.id===requested?.item)?'Erneut versuchen':'Einsetzen'}</button>
        </div>;
      })}
      {journey.chests>0&&<fieldset disabled={pending||me.ready||journey.inventory.length>=5}>
        <legend>Schatztruhe · Wähle ein neues Relikt</legend>
        {relics.map(info=><button type="button" key={info.id} className="secondary" onClick={()=>void send({type:'chest',kind:info.id})}>{info.symbol} {info.name}{pending&&requested?.kind===info.id?' …':''}</button>)}
        {journey.inventory.length>=5&&<p>{equipped||me.ready?'Rucksack voll. Beim nächsten Spiel kannst du wieder ein Relikt einsetzen.':'Rucksack voll. Setze zuerst ein Relikt ein.'}</p>}
      </fieldset>}
      {error&&!(requested?.item&&equipped)&&<p className="submission-error" role="alert">{error}</p>}
    </div>
  </details>;
}
