"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { useGameSubmission } from "./use-game-submission";
import { PartyRelics } from "./party-relics";

type Props = {
  room: any;
  me: any;
  now: number;
  act: (action: any) => Promise<boolean>;
};

export function GamePreparation(props:Props){
  const [relicPending,setRelicPending]=useState(false);
  return <><PartyRelics room={props.room} me={props.me} act={props.act} onPending={setRelicPending}/><BriefingReady {...props} blocked={relicPending}/></>;
}

export function BriefingReady({ room, me, now, act, blocked=false }: Props&{blocked?:boolean}) {
  const { pending, error, submit } = useGameSubmission(act, room.phaseKey);
  const crew = room.players.filter((player: any) => room.participantIds.includes(player.id) && player.rejoinUntil >= room.serverTime);
  const waiting = crew.filter((player: any) => !player.ready);
  const names = waiting.map((player: any) => player.id === me?.id ? "du" : player.name);
  const canParticipate = me && !me.spectator && room.participantIds.includes(me.id);
  const seconds = Math.max(0, Math.ceil((room.deadline - now) / 1000));
  const fullWaiting = names.length ? `Lesen noch: ${names.join(", ")}` : "Die Crew ist bereit. Der Countdown beginnt gleich.";
  return (
    <section className="briefing-ready" aria-label="Gemeinsamer Spielstart">
      {canParticipate ? <button
        type="button"
        className={me.ready ? "ready-button" : "primary"}
        disabled={me.ready || blocked || pending || seconds === 0}
        onClick={() => {if(!blocked)void submit({ type: "ready", phase: room.phaseKey });}}
      >
        {me.ready && <Check size={18} />}
        {me.ready ? "Bereit für den Start" : blocked ? "Reliktauswahl wird bestätigt …" : pending ? "Wird bestätigt …" : seconds === 0 ? "Start wird vorbereitet …" : "Verstanden – ich bin bereit"}
      </button> : <p className="party-spectator-note">Du schaust zu und reist mit der Crew weiter.</p>}
      <div className="briefing-ready-status" role="status" aria-atomic="true">
        <strong>{crew.length - waiting.length} / {crew.length} bereit</strong>
        <p title={fullWaiting}>{names.length
          ? `Lesen noch: ${names.slice(0, 2).join(", ")}${names.length > 2 ? ` und ${names.length - 2} weitere` : ""}.`
          : "Die Crew ist bereit. Der Countdown beginnt gleich."}</p>
      </div>
      <small>{seconds > 0 ? <>Countdown spätestens in <span role="timer">{seconds} s</span>.</> : "Der gemeinsame Start wird vorbereitet."}</small>
      {!me?.ready && error && <p className="submission-error" role="alert">{error}</p>}
    </section>
  );
}
