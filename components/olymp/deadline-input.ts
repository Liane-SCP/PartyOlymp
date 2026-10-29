"use client";
import {useEffect,useRef} from "react";
/** Persist the latest valid input; the server commits it when its deadline expires. */
export function useDeadlineInput(room:any,act:(a:any)=>void,action:any|null,hadInitialDraft=false) {
  const latest=useRef(act);latest.current=act;
  const sent=useRef(hadInitialDraft),phase=useRef(room.phaseKey);
  const serialized=JSON.stringify(action);
  useEffect(()=>{
    if(!room.game?.mine || room.phase!=="playing")return;
    if(phase.current!==room.phaseKey){sent.current=false;phase.current=room.phaseKey;}
    if(serialized==="null"&&!sent.current)return;
    const timer=setTimeout(()=>{sent.current=serialized!=="null";latest.current({type:"timeoutDraft",action:JSON.parse(serialized)});},120);
    return ()=>clearTimeout(timer);
  },[serialized,room.phaseKey]);
}
