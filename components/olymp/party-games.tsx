"use client";
import { useContext, useEffect, useRef, useState } from "react";
import {createPortal} from 'react-dom';
import {HerdThoughtConsole} from './herd-thought-console';
import {RaceFinishBoard} from './race-finish-board';
import {RaceConsoleMount} from './race-console-context';
import { sound } from "@/lib/audio";
import { Avatar } from "./art";
import {SpectrumConsole} from "./spectrum-console";
import {focusPlayInput} from './focus-play-input';
import {
  normalizeRaceText,
  racePrefix,
  raceFinished,
  raceMetrics,
} from "@/lib/game/typing";
type Props = { room: any; me: string; now: number; act: (a: any) => void };
export function Typeracer({ room, me, now, act }: Props) {
  const dock=useContext(RaceConsoleMount),copy=useRef<HTMLDivElement>(null),entry=useRef<HTMLTextAreaElement>(null);
  const g = room.game,
    p = g.mine;
  const [text, setText] = useState(p.text ?? "");
  const [localFinishAt, setLocalFinishAt] = useState<number | null>(
    p.finishedAt ?? null,
  );
  const sequence = useRef(p.seq ?? 0),
    sentAt = useRef(0),
    currentMine = useRef(p),
    latestAct = useRef(act),
    latestText = useRef(text);
  latestAct.current = act;
  currentMine.current = p;
  sequence.current = Math.max(sequence.current, p.seq ?? 0);
  const normalized = normalizeRaceText(text),
    prefix = racePrefix(text, g.text),
    complete = raceFinished(text, g.text);
  const send = (value: string) => {
    sentAt.current = Date.now();
    latestAct.current({
      type: "type",
      text: value,
      seq: ++sequence.current,
      round: g.round,
    });
  };
  useEffect(() => {
    // Coalesce rapid typing behind the last acknowledgement. Retry the newest
    // draft after a lost packet, even when the player has stopped typing.
    const flush = setInterval(() => {
      const mine = currentMine.current;
      if (mine.submitted || latestText.current === (mine.text ?? "")) return;
      if (
        sequence.current > (mine.seq ?? 0) &&
        Date.now() - sentAt.current < 900
      )
        return;
      send(latestText.current);
    }, 120);
    return () => clearInterval(flush);
  }, [g.round]);
  function change(value: string) {
    latestText.current = value;
    setText(value);
    sound.play(normalizeRaceText(value).length>racePrefix(value,g.text)?"typeError":"typeKey");
    if (raceFinished(value, g.text)) {
      setLocalFinishAt(now);
      send(value);
    }
  }
  const metrics = raceMetrics(
    prefix,
    g.text.length,
    g.startedAt,
    Math.min(now, g.deadline),
    p.finishedAt ?? localFinishAt,
  );
  useEffect(()=>{
    if(!p.submitted&&(!dock||dock.element)&&matchMedia('(min-width:1000px) and (min-height:640px)').matches)focusPlayInput(entry.current);
  },[dock?.element]);
  useEffect(()=>{const el=copy.current,cursor=el?.querySelector<HTMLElement>('.cursor');if(el&&cursor)el.scrollTop=Math.max(0,cursor.getBoundingClientRect().top-el.getBoundingClientRect().top+el.scrollTop-parseFloat(getComputedStyle(el).paddingTop));},[prefix,dock?.element]);
  const drivingConsole=(<div className="race-driving-console">
      {p.submitted&&typeof p.finishedAt==='number'?<RaceFinishBoard room={room} me={me}/>:<>
      <div className="type-copy" ref={copy} aria-label="Abzutippender Text">
        {Array.from(g.text as string).map((ch,i)=><span key={i} className={i<prefix?'correct':i<normalized.length?'incorrect':i===prefix?'cursor':''}>{ch}</span>)}
      </div>
      <label className="type-entry">
        {p.submitted?'Im Ziel! Schau der Crew beim Rennen zu.':complete?'Zieleinlauf wird bestätigt …':'Hier abtippen'}
        <textarea ref={entry} value={text} disabled={p.submitted||complete} onFocus={()=>dock?.enter()} onChange={e=>change(e.target.value)} onPaste={e=>e.preventDefault()} onDrop={e=>e.preventDefault()} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" aria-label="Renntext abtippen" maxLength={g.text.length+10}/>
      </label>
      <div className="type-stats"><strong>{p.finishedWpm??metrics.wpm} WPM</strong><span>{prefix} / {g.text.length} Zeichen</span><span>{p.submitted?'Zieleinlauf bestätigt ✓':complete?'Zieleinlauf wird übertragen …':normalized.length>prefix?'Fehler korrigieren ↶':'Saubere Spur ✓'}</span></div>
      </> }
    </div>);
  return (
    <section className="type-arena">
      <div className="new-mode-heading">
        <span className="eyebrow">TASTEN BEREIT · LOS GEHT’S</span>
        <h2>Jedes Zeichen bringt dich weiter.</h2>
        <p>
          Korrigiere rote Zeichen mit der Rücktaste. Dein Wagen folgt dem
          fehlerfreien Text.
        </p>
      </div>
      <div className="type-tracks">
        {room.participantIds.map((id: string) => {
          const player = room.players.find((x: any) => x.id === id);
          const racer = g.racers[id] ?? {};
          const progress = id === me ? prefix : (racer.progress ?? 0);
          const status = raceMetrics(
            progress,
            g.text.length,
            g.startedAt,
            Math.min(now, g.deadline),
            racer.finishedAt ?? (id === me ? localFinishAt : null),
          );
          return (
            <div
              className={`type-lane ${id === me ? "self" : ""} ${status.finished ? "finished" : ""}`}
              key={id}
            >
              <span>{player.name}</span>
              <div
                className="type-road"
                role="progressbar"
                aria-label={`Fortschritt ${player.name}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={status.percent}
              >
                <i
                  style={{
                    width: `${status.percent}%`,
                    background: player.color,
                  }}
                />
                <b
                  className="type-car"
                  style={{
                    left: `calc(${status.percent}% - var(--race-car-size) * ${status.percent / 100})`,
                  }}
                >
                  <Avatar
                    avatar={player.avatar}
                    look={player.look}
                    color={player.color}
                  />
                </b>
                <strong className="type-finish">⚑</strong>
              </div>
              <small
                title={`${status.wpm} WPM · ${progress} / ${g.text.length} Zeichen`}
              >
                {status.finished ? "Ziel!" : `${status.percent} %`}
              </small>
            </div>
          );
        })}
      </div>
      {dock===undefined?drivingConsole:dock.element?createPortal(drivingConsole,dock.element):<p role="status">Dein Rennpult wird vorbereitet …</p>}
    </section>
  );
}
export function Hivemind(props:Props){return <HerdThoughtConsole {...props}/>;}
export function Spectrum(props:Props){return <SpectrumConsole {...props}/>;}
