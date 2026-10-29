"use client";
import { useEffect, useState } from "react";
import { Avatar } from "./art";
import { sound } from "@/lib/audio";
import { award, olympiadMultiplier } from "@/lib/game/scoring";
import { relicBonus, relicInfo } from "@/lib/game/journey";
import {PARTY_FLOW} from '@/lib/game/party-flow';
export function AnimatedNumber({
  value,
  delay = 0,
}: {
  value: number;
  delay?: number;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (
      preference.matches ||
      document.documentElement.dataset.motion === "reduced"
    ) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now() + delay;
    const draw = (now: number) => {
      if (preference.matches || document.documentElement.dataset.motion === "reduced") {
        setShown(value);
        return;
      }
      const t = Math.max(0, Math.min(1, (now - start) / 2100));
      setShown(value * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [value, delay]);
  return (
    <>
      {shown.toLocaleString("de-DE", {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      })}
    </>
  );
}
export function Particles({
  seed,
  burst = false,
}: {
  seed: string;
  burst?: boolean;
}) {
  return (
    <div
      key={seed}
      className={`show-particles ${burst ? "burst" : ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: burst ? 48 : 22 }, (_, i) => (
        <i
          key={i}
          style={
            {
              "--x": `${(i * 37 + 11) % 100}%`,
              "--dx": `${Math.sin(i * 3) * 260}px`,
              "--dy": `${-80 - ((i * 29) % 330)}px`,
              "--delay": `${(i % 7) * 0.09}s`,
              "--spin": `${i * 53}deg`,
              "--color": [
                "#bcff5c",
                "#9b8aff",
                "#56d9ff",
                "#ff7b9d",
                "#ffb85c",
              ][i % 5],
            } as any
          }
        />
      ))}
    </div>
  );
}
export function ScoreShow({
  room,
  me,
  now,
}: {
  room: any;
  me: string;
  now: number;
}) {
  const multiplier = olympiadMultiplier(room.game.id);
  const rows = award(room.game.results, room.participantIds.length, multiplier).map(row => {
    const equipped=room.journey?.equipped.find((e:any)=>e.player===row.id);
    const bonus=equipped?relicBonus(equipped.kind,row,room.participantIds.length,multiplier):0;
    return {...row,points:(row.points??0)+bonus,relic:equipped?.kind,bonus};
  }).sort(
    (a, b) => (a.rank ?? 999) - (b.rank ?? 999),
  );
  const elapsed=Math.max(0,PARTY_FLOW.reveal-(room.deadline-now));
  useEffect(() => {
    if(elapsed>=4200)return;
    const wait=4200-elapsed,due=performance.now()+wait;
    const chime = setTimeout(() => {
      if(!document.hidden&&performance.now()-due<600)sound.play("score");
    }, wait);
    return () => {
      clearTimeout(chime);
    };
  }, [room.index, room.startedAt]);
  const awarded = elapsed > 4200;
  return (
    <div className={`score-show ${awarded ? "awarded" : ""}`}>
      <Particles seed={`${room.index}:${awarded}`} burst={awarded} />
      <span className="eyebrow">
        {awarded ? "JETZT ZÄHLT DER PLATZ" : "DAS DISZIPLINERGEBNIS"}
      </span>
      <h2>{awarded ? "Eure Olympiadenpunkte." : "Wer hat die Nase vorn?"}</h2>
      <p className="score-explainer">
        {awarded
          ? multiplier === 3
            ? "Bosskämpfe zählen dreifach. Dein Platz wird in 0–300 Olympiadenpunkte umgerechnet."
            : "Dein Platz wird in 0–100 Olympiadenpunkte umgerechnet. Bosskämpfe zählen dreifach."
          : "Zuerst vergleichen wir die Ergebnisse dieses Spiels. Gleichstände bleiben Gleichstände."}
      </p>
      <div className="score-show-rows">
        {rows.map((row: any, i: number) => {
          const p = room.players.find((p: any) => p.id === row.id);
          const tied = rows.filter(
            (r: any) => r.rank === row.rank && r.valid,
          ).length;
          return (
            <div
              key={row.id}
              className={`show-result ${row.id === me ? "self" : ""}`}
              style={{ "--row": i } as any}
            >
              <span className="show-place">
                {row.valid ? `${row.rank}.` : "—"}
              </span>
              <Avatar avatar={p?.avatar} look={p?.look} color={p?.color} />
              <div className="show-player">
                <strong>{p?.name}</strong>
                <small>
                  {room.game.id === "code"
                    ? `${row.detail?.solvedRounds ?? 0} Codes gelöst · ${row.detail?.totalGuesses ?? 0} Versuche${!row.valid ? " · 0 Punkte" : tied > 1 ? ` · ${tied} Spieler teilen den Platz` : ""}`
                    : row.valid
                      ? `${row.raw.toLocaleString("de-DE", { maximumFractionDigits: 2 })} Spielpunkte${tied > 1 ? ` · ${tied} Spieler teilen den Platz` : ""}`
                      : room.game.id === "wiki"
                        ? "Kein Ziel erreicht · 0 Punkte"
                        : "Keine gültige Teilnahme · 0 Punkte"}
                  {room.game.id === "wiki" &&
                    row.valid &&
                    ` · ${row.detail?.filter((h: any) => h.arrival !== null).length ?? 0}/${row.detail?.length ?? 0} Ziele erreicht`}
                </small>
              </div>
              <div className="show-award">
                {awarded ? (
                  <>
                    <strong>
                      +
                      <AnimatedNumber value={row.points ?? 0} delay={i * 180} />
                    </strong>
                    <small>Olympiadenpunkte</small>
                    {row.relic && <small className="show-relic-bonus">{relicInfo(row.relic)?.name}: +{row.bonus.toLocaleString("de-DE",{maximumFractionDigits:1})}</small>}
                  </>
                ) : (
                  <span className="show-suspense">•••</span>
                )}
              </div>
              <div className="show-meter">
                <i
                  style={{
                    width: awarded ? `${Math.min(100, (row.points ?? 0) / (multiplier * 1.25))}%` : "0%",
                    transitionDelay: `${i * 180}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="score-rule-strip">
        <strong>Grundwertung: 1. Platz {100*multiplier} · letzter Platz 0</strong>
        <span>
          100 × ({room.participantIds.length} − Platz) ÷{" "}
          {room.participantIds.length - 1}
        </span>
        <small>
          Gleichstände teilen die Punkte der belegten Plätze. Reliktboni kommen dazu. Gesamtwertung
          folgt in {Math.max(0, Math.ceil((room.deadline - now) / 1000))} s.
        </small>
      </div>
    </div>
  );
}
const dots: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
export function Die({
  value,
  held,
  roll,
  mini = false,
}: {
  value: number;
  held?: boolean;
  roll: number;
  mini?: boolean;
}) {
  return (
    <span
      key={roll}
      className={`dice-cube ${roll > 0 && !held ? "rolling" : ""} ${mini ? "mini" : ""}`}
    >
      <span className="dice-face">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} className={dots[value]?.includes(i) ? "pip" : ""} />
        ))}
      </span>
    </span>
  );
}
export function DiceCrew({
  g,
  players,
  me,
}: {
  g: any;
  players: any[];
  me: string;
}) {
  return (
    <div className="dice-crew">
      <div className="dice-turn-heading">
        <strong>Gemeinsamer Zug {g.turn} / 13</strong>
        <span>
          {g.stage === "turnReveal"
            ? "Alle eingetragen · nächster Zug gleich"
            : "Würfeln → halten → Kategorie wählen"}
        </span>
      </div>
      {players
        .filter((p) => g.opponents?.[p.id])
        .sort((a,b)=>g.opponents[b.id].total-g.opponents[a.id].total)
        .map((p) => {
          const d = g.opponents[p.id];
          return (
            <details
              key={p.id}
              className={`crew-dice-card ${p.id === me ? "self" : ""}`}
            >
              <summary>
                <Avatar avatar={p.avatar} look={p.look} color={p.color} />
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {d.submitted
                      ? `✓ ${d.lastEntry?.category}: ${d.lastEntry?.value}`
                      : `${d.rolls}/3 Würfe · ${d.total} Punkte`}
                  </small>
                </span>
                <div className="mini-dice">
                  {d.dice.map((v: number, i: number) => (
                    <Die
                      key={i}
                      value={v}
                      held={d.held[i]}
                      roll={d.rollId ?? 0}
                      mini
                    />
                  ))}
                </div>
              </summary>
              <div className="crew-sheet">
                {d.sheet.map((v: any, i: number) => (
                  <span key={i}>
                    {g.categories[i]}
                    <b>{v ?? "—"}</b>
                  </span>
                ))}
              </div>
            </details>
          );
        })}
    </div>
  );
}
