"use client";

import { useId, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { Selection } from "@/lib/game/types";
import { partyPlanKey } from "@/lib/game/party-flow";

type Player = {
  id: string;
  name: string;
  spectator: boolean;
  ready: boolean;
  rejoinUntil: number;
};

type Props = {
  room: { players: Player[]; serverTime: number; phaseKey: string; selection: Selection[] };
  me?: Player;
  host: boolean;
  act: (action: { type: "ready" | "start"; phase: string; plan: string }) => Promise<boolean>;
};

export function LobbyLaunch({ room, me, host, act }: Props) {
  const statusId = useId();
  const sending = useRef(false);
  const [pending, setPending] = useState<"ready" | "start" | null>(null);
  const players = room.players.filter(
    (player) => !player.spectator && player.rejoinUntil > room.serverTime,
  );
  const waiting = players.filter((player) => !player.ready);
  const canStart = players.length >= 2 && players.length <= 12 && waiting.length === 0;
  const waitingNames = waiting.map((player) => player.id === me?.id ? "du" : player.name);
  const shortNames = waitingNames.slice(0, 2).join(", ");
  const nextStep = players.length < 2
    ? "Zum Start braucht ihr mindestens zwei Mitspieler."
    : waiting.length > 0
      ? `Noch nicht bereit: ${shortNames}${waiting.length > 2 ? ` und ${waiting.length - 2} weitere` : ""}.`
      : host
        ? "Die Crew ist bereit. Starte eure gemeinsame Reise."
        : "Die Crew ist bereit. Der Gastgeber kann jetzt starten.";

  async function send(type: "ready" | "start") {
    if (sending.current) return;
    sending.current = true;
    setPending(type);
    try {
      await act({ type, phase: room.phaseKey, plan: partyPlanKey(room.selection) });
    } finally {
      sending.current = false;
      setPending(null);
    }
  }

  return (
    <div className="lobby-launch">
      <div className="planner-ready-summary" id={statusId} role="status" aria-atomic="true">
        <strong>{me?.spectator ? "Du schaust zu" : canStart ? "Alle bereit für die Reise" : me?.ready ? "Du bist bereit" : "Passt der Spielplan für dich?"}</strong>
        <span>{players.length - waiting.length} / {players.length} bereit</span>
        <span className="lobby-next-step" title={waiting.length ? `Noch nicht bereit: ${waitingNames.join(", ")}` : undefined}>{nextStep}</span>
      </div>
      {me && !me.spectator && (
        <button
          className={me.ready ? "ready-button" : "primary"}
          aria-pressed={me.ready}
          aria-describedby={statusId}
          disabled={pending !== null}
          onClick={() => send("ready")}
        >
          {me.ready && <Check size={18} />}
          {pending === "ready" ? "Wird übernommen …" : me.ready ? "Bereit zurücknehmen" : "Ich bin bereit"}
        </button>
      )}
      {host && (
        <button
          className={canStart ? "primary" : "secondary"}
          disabled={!canStart || pending !== null}
          aria-describedby={statusId}
          onClick={() => send("start")}
        >
          {pending === "start" ? "Reise startet …" : "Olympiade starten"} <ArrowRight size={20} />
        </button>
      )}
    </div>
  );
}
