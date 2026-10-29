"use client";
import {useEffect,useRef} from "react";
import {sound} from "@/lib/audio";
import {personalActionDeadline} from "@/lib/game/presentation";
export function TimeSignals({room,now,me}: {room:any;now:number;me:string}) {
  const last=useRef({key:"",seconds:-1,deadline:0,active:false}),g=room.game;
  const resume=useRef(false);
  useEffect(()=>{
    const changed=()=>{resume.current=true;};
    document.addEventListener('visibilitychange',changed);
    return()=>document.removeEventListener('visibilitychange',changed);
  },[]);
  const deadline=personalActionDeadline(g,me);
  const active=room.phase==="playing" && deadline>0;
  const seconds=Math.max(0,Math.ceil((deadline-now)/1000));
  useEffect(()=>{
    const key=`${room.phaseKey}:${deadline}`;
    if(document.hidden||resume.current){
      last.current={key,seconds,deadline,active};
      if(!document.hidden)resume.current=false;
      return;
    }
    if(last.current.key!==key){
      if(last.current.active && last.current.seconds>0 && now>=last.current.deadline)sound.play("timeUp");
      else if(active && seconds>0 && seconds<=5)sound.play("timeUrgent");
      last.current={key,seconds,deadline,active};return;
    }
    if(active && seconds!==last.current.seconds) {
      if(seconds===10)sound.play("timeWarning");
      else if(seconds>0&&seconds<=5)sound.play("timeUrgent");
      else if(seconds===0)sound.play("timeUp");
    }
    last.current.seconds=seconds;
    last.current.active=active;
  },[room.phaseKey,deadline,seconds,active]);
  return active&&seconds<=10 ? <div className="deadline-warning" role="status">{seconds>0?`Noch ${seconds} Sekunden für deine Aktion.`:"Zeit abgelaufen."}</div> : null;
}
