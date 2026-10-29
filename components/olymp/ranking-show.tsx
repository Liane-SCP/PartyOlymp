"use client";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./art";
import { Particles } from "./showtime";
import { sound } from "@/lib/audio";
import {PARTY_FLOW} from '@/lib/game/party-flow';
export function RankingShow({ room, me }: { room: any; me: string }) {
  const list = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0),
    [moment, setMoment] = useState<{
      text: string;
      id: number;
      leader: boolean;
      player: string;
    } | null>(null),
    previous = useRef<string[]>([]),
    serial = useRef(0),
    animated = useRef(false),
    celebrated = useRef(new Set<string>());
  const players = room.standings,
    before =
      room.previousStandings ??
      players.map((p: any) => ({
        ...p,
        points: p.points - p.lastPoints,
        rank: p.previousRank || p.rank,
      }));
  useEffect(() => {
    previous.current = [...before]
      .sort((a: any, b: any) => a.rank - b.rank)
      .map((p: any) => p.id);
    celebrated.current.clear();
    animated.current = false;
    setMoment(null);
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const reduced =
      preference.matches ||
      document.documentElement.dataset.motion === "reduced";
    if (reduced || room.phase === "paused") {
      setProgress(1);
      return;
    }
    const elapsed = Math.max(0, PARTY_FLOW.standings - (room.deadline - room.serverTime)),
      start = performance.now() - elapsed;
    animated.current = elapsed < 7500;
    let frame = 0;
    const animate = (now: number) => {
      if (preference.matches || document.documentElement.dataset.motion === "reduced") {
        animated.current = false;
        setMoment(null);
        setProgress(1);
        return;
      }
      const t = Math.max(0, Math.min(1, (now - start - 900) / 6500));
      setProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [room.history.at(-1)?.id, room.phase]);
  const rows = players
    .map((p: any) => {
      const old = before.find((x: any) => x.id === p.id);
      return {
        ...p,
        displayPoints:
          (old?.points ?? p.points - p.lastPoints) + p.lastPoints * progress,
        old,
      };
    })
    .sort((a: any, b: any) => {
      const diff = b.displayPoints - a.displayPoints;
      if (Math.abs(diff) > 0.000001) return diff;
      return progress === 1
        ? players.findIndex((p: any) => p.id === a.id) -
              players.findIndex((p: any) => p.id === b.id)
        : (a.old?.rank ?? a.previousRank) - (b.old?.rank ?? b.previousRank) ||
            before.findIndex((p: any) => p.id === a.id) -
              before.findIndex((p: any) => p.id === b.id);
    });
  useEffect(() => {
    const order = rows.map((p: any) => p.id),
      old = previous.current;
    if (old.length && order.some((id: string, i: number) => old[i] !== id)) {
      const rising = rows.find((p: any, i: number) => old.indexOf(p.id) > i &&
        p.old?.rank > p.rank && !celebrated.current.has(`${p.id}:${i}`) &&
        old.slice(i, old.indexOf(p.id)).some((id: string) => {
          const passed = players.find((x:any)=>x.id===id), prior=before.find((x:any)=>x.id===id);
          return prior && passed && p.old.rank>prior.rank && p.rank<passed.rank;
        }));
      if (rising && animated.current) {
        const pos = order.indexOf(rising.id),
          passed = players.find((p: any) => old.slice(pos,old.indexOf(rising.id)).includes(p.id) &&
            rising.old.rank > before.find((x:any)=>x.id===p.id)?.rank && rising.rank<p.rank),
          leader = pos === 0 && rising.rank === 1 && players.filter((p:any)=>p.rank===1).length===1;
        celebrated.current.add(`${rising.id}:${pos}`);
        setMoment({
          text: leader
            ? `${rising.name} übernimmt die Führung!`
            : `${rising.name} zieht an ${passed?.name ?? "der Crew"} vorbei!`,
          id: ++serial.current,
          leader,
          player: rising.id,
        });
        sound.play(leader ? "lead" : "overtake");
      }
    }
    previous.current = order;
  }, [rows.map((p: any) => p.id).join(":")]);
  const max = Math.max(100, ...players.map((p: any) => p.points));
  return (
    <div className={`ranking-show ${progress === 1 ? "settled" : ""}`}>
      <div
        className={`ranking-moment ${moment ? "has-moment" : ""}`}
        role="status"
        key={moment?.id ?? "begin"}
      >
        {moment ? (
          <>
            <span>
              {moment.leader ? "♛ NEUE NUMMER EINS" : "↗ ÜBERHOLMANÖVER"}
            </span>
            <strong>{moment.text}</strong>
            {moment.leader && <Particles seed={String(moment.id)} />}
          </>
        ) : (
          <>
            <span>JETZT ZÄHLT’S</span>
            <strong>
              {progress === 1
                ? "Die neue Reihenfolge steht."
                : "Die Punkte laufen ein …"}
            </strong>
          </>
        )}
      </div>
      {players.some((player:any)=>player.id===me)&&<button type="button" className="ranking-find-self" onClick={()=>{
        const own=[...(list.current?.querySelectorAll<HTMLElement>('[data-ranking-player]')??[])].find(node=>node.dataset.rankingPlayer===me);
        if(own&&list.current){list.current.scrollTop+=own.getBoundingClientRect().top-list.current.getBoundingClientRect().top-(list.current.clientHeight-own.clientHeight)/2;list.current.focus({preventScroll:true});}
      }}>Meine Position</button>}
      <div className="ranking-list" ref={list} tabIndex={0} role="region" aria-label="Gesamtwertung der Crew">
      <div className="ranking-track" style={{ height: `calc(${players.length} * var(--ranking-step, 90px))` }}>
        {rows.map((p: any, index: number) => {
          const delta = (p.old?.rank ?? p.previousRank) - p.rank;
          const currentRank = progress === 1 ? p.rank : rows.findIndex((other:any)=>
            Math.abs(other.displayPoints-p.displayPoints)<=Number.EPSILON*32*Math.max(1,Math.abs(p.displayPoints),Math.abs(other.displayPoints)))+1;
          return (
            <div
              key={p.id}
              data-ranking-player={p.id}
              className={`ranking-rider ${p.id === me ? "self" : ""} ${currentRank === 1 ? "leader" : ""} ${delta > 0 ? "rising" : ""} ${moment?.player === p.id ? "show-passing" : ""}`}
              style={
                {
                  transform: `translateY(calc(${index} * var(--ranking-step, 90px)))`,
                  "--rider-color": p.color,
                } as any
              }
            >
              <span className="ranking-place">
                {String(currentRank).padStart(2, "0")}
              </span>
              <Avatar avatar={p.avatar} look={p.look} color={p.color} />
              <div className="ranking-name">
                <strong>
                  {p.name}
                  {p.id === me && <small> DU</small>}
                </strong>
                <span>
                  {progress === 1
                    ? delta > 0
                      ? `↑ ${delta} ${delta === 1 ? "Platz" : "Plätze"}`
                      : delta < 0
                        ? `↓ ${-delta} ${delta === -1 ? "Platz" : "Plätze"}`
                        : "Platz gehalten"
                    : "Punkte werden addiert"}
                </span>
              </div>
              <span className="ranking-award">
                +{p.lastPoints.toFixed(1)}
                <small>dieses Spiel</small>
              </span>
              <b>
                {p.displayPoints.toFixed(1)}
                <small>Gesamt</small>
              </b>
              <div className="ranking-meter">
                <i style={{ width: `${(p.displayPoints / max) * 100}%` }} />
              </div>
              {moment?.player === p.id && <span className="ranking-pass-badge">{moment?.leader ? "NEUE FÜHRUNG" : "VORBEIGEZOGEN"} ↗</span>}
            </div>
          );
        })}
      </div>
      </div>
      <p className="ranking-caption">
        {progress === 1
          ? "Gleiche Gesamtpunkte ergeben denselben Platz – auch auf dem Siegerpodest."
          : "Die Punkte laufen ein. Bosskämpfe zählen dreifach – beobachtet, wer die Plätze tauscht."}
      </p>
    </div>
  );
}
