"use client";

import {Pause, Play, SkipForward} from 'lucide-react';
import {useGameSubmission} from './use-game-submission';

// Temporary testing control, rendered only for the host.
export function HostTestSkip({room,act}:{room:any;act:(action:any)=>Promise<boolean>}) {
  const {pending,error,submit}=useGameSubmission(async action=>{
    const accepted=await act(action);
    if(!accepted)throw new Error('Überspringen nicht bestätigt. Bitte erneut versuchen.');
    return accepted;
  },JSON.stringify([room.code,room.startedAt,room.phaseKey]));
  return <div className="host-test-skip">
    <button type="button" className="secondary" disabled={pending} onClick={()=>void submit({type:'testSkip',phase:room.phaseKey})}>
      <SkipForward size={16}/>{pending?'Wird übersprungen …':'Test: Disziplin überspringen'}
    </button>
    <small>Temporärer Host-Test · Ohne Punkte direkt {room.index+1>=room.selection.length?'zur Siegerehrung':'zur nächsten Disziplin'}.</small>
    {error&&<p role="alert">{error}</p>}
  </div>;
}

export function HostProgressControls({room,act}:{room:any;act:(action:any)=>Promise<boolean>}) {
  const {pending,error,submit}=useGameSubmission(async action=>{
    const accepted=await act(action);
    if(!accepted)throw new Error('Aktion noch nicht bestätigt. Prüfe den aktuellen Stand und versuche es erneut.');
    return accepted;
  },JSON.stringify([room.code,room.startedAt,room.phaseKey]));
  const send=(type:'pause'|'continue')=>void submit({type,phase:room.phaseKey});
  return <>
    <div className="action-row" role="group" aria-label="Olympiade steuern" aria-busy={pending}>
      {room.phase==='standings'&&<button type="button" disabled={pending} onClick={()=>send('pause')}><Pause size={16}/>Pause</button>}
      <button type="button" className="primary" disabled={pending} onClick={()=>send('continue')}><Play size={17}/>{room.index+1>=room.selection.length?'Zur Siegerehrung':'Zum nächsten Spiel'}</button>
    </div>
    {pending&&<p className="host-progress-feedback" role="status">Aktion wird bestätigt …</p>}
    {error&&<p className="host-progress-feedback" role="alert">{error}</p>}
  </>;
}
