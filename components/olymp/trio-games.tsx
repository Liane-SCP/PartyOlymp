"use client";
import { useContext, useEffect, useRef, useState } from "react";
import {createPortal} from 'react-dom';
import {BombConsoleMount} from './bomb-console-context';
import {AuctionJury} from './auction-jury';
import { Avatar, GameIcon } from "./art";
import { Particles, AnimatedNumber } from "./showtime";
import { sound } from "@/lib/audio";
import {timingRevealCount,timingSeconds as seconds} from "@/lib/timing-presentation";
import {useAdventureDraft} from "./adventure-context";
import {useDeadlineInput} from "./deadline-input";
import {useGameSubmission} from "./use-game-submission";
type Props = { room: any; me: string; now: number; act: (a: any) => void|Promise<boolean> };
function PlayerName({ room, id }: { room: any; id: string }) {
  const p = room.players.find((p: any) => p.id === id);
  return (
    <span className="trio-person">
      {p && <Avatar avatar={p.avatar} color={p.color} look={p.look} />}
      <b>{p?.name ?? "Spieler"}</b>
    </span>
  );
}
function Words({ words }: { words: any[] }) {
  return (
    <ol className="trio-words">
      {words.map((a: any, i: number) => (
        <li key={`${i}:${a.word}`}>
          <small>{i + 1}</small>
          <span>{a.word}</span>
        </li>
      ))}
    </ol>
  );
}
function AuctionBookNav({total}:{total:number}){
 const [auctionPage,setAuctionPage]=useState(-1);useAdventureDraft({auctionPage},[auctionPage]);
 const pages=Math.max(1,Math.ceil(total/6)),page=auctionPage<0?pages-1:Math.min(pages-1,auctionPage);
 return <nav className="auction-book-nav" aria-label="Seiten im 3D-Bühnenbuch"><button type="button" disabled={page===0} onClick={()=>setAuctionPage(page-1)} aria-label="Vorherige Begriffe auf der Bühne">←</button><span>Seite {page+1} / {pages}</span><button type="button" disabled={page===pages-1} onClick={()=>setAuctionPage(page+1)} aria-label="Nächste Begriffe auf der Bühne">→</button><button type="button" aria-pressed={auctionPage<0} onClick={()=>setAuctionPage(-1)}>Neueste</button></nav>;
}
export function AuctionGame({ room, me, act }: Props) {
  const g = room.game,
    p = g.mine;
  const {pending,error,clearError,submit}=useGameSubmission(act,`${room.code}:${room.phaseKey}:${g.round}:${g.bid}:${g.leader}:${g.answers.length}:${me}`);
  const send=(a:any)=>submit({...a,round:g.round});
  const [custom, setCustom] = useState(""),
    [bid, setBid] = useState(1),
    [word, setWord] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [bidChanged,setBidChanged]=useState(false);
  useDeadlineInput(room,act,
    g.stage==="topic" && g.setter===me && custom.trim().length>=3 ? {type:"topic",name:custom,round:g.round} :
    g.stage==="bid" && !!p && bidChanged && !p.passed && g.leader!==me && Number.isInteger(bid) && bid>g.bid && bid<=50 ? {type:"bid",value:bid,round:g.round} :
    g.stage==="perform" && g.leader===me && word.trim() ? {type:"word",word,round:g.round} : null);
  useEffect(() => {
    if(bid<=g.bid){setBidChanged(false);setBid(g.bid+1);}
  }, [g.bid]);
  useEffect(() => {
    setWord("");
    if (g.stage === "perform") input.current?.focus({preventScroll:true});
  }, [g.answers.length, g.stage]);
  const mine = g.leader === me,
    judging = g.stage === "judge";
  return (
    <section className="trio-arena auction-arena" data-stage={g.stage}>
      <header className="trio-heading">
        <span className="eyebrow">
          KOPF-AUKTION ·{" "}
          {g.stage === "topic"
            ? "DIE AUFGABE"
            : g.stage === "bid"
              ? "WER BIETET MEHR?"
              : judging
                ? "DAS URTEIL"
                : "JETZT LIEFERN"}
        </span>
        <h2>{g.topic?.name ?? "Worauf wettet ihr heute?"}</h2>
        <p>
          {g.topic?.hint ??
            "Drei Ideen oder eure eigene Kategorie. Die Aufgabenwahl wechselt jede Runde."}
        </p>
      </header>
      {g.stage === "topic" ? (
        <div className="auction-topic">
          <PlayerName room={room} id={g.setter} />
          {g.setter === me ? (
            <>
              <div className="auction-choices">
                {g.choices.map((t: any) => (
                  <button
                    key={t.id}
                    disabled={pending}
                    onClick={() => send({ type: "topic", choice: t.id })}
                  >
                    <strong>{t.name}</strong>
                    <small>{t.hint}</small>
                  </button>
                ))}
              </div>
              <form
                className="trio-entry"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (custom.trim().length >= 3)
                    send({ type: "topic", name: custom });
                }}
              >
                <input
                  aria-label="Eigene Kategorie"
                  maxLength={80}
                  placeholder="Eigene Kategorie, z. B. Pokémon"
                  value={custom}
                  disabled={pending}
                  onChange={(e) => {clearError();setCustom(e.target.value);}}
                />
                <button className="primary" disabled={pending || custom.trim().length < 3}>
                  {pending?"Wird bestätigt \u2026":"Eigene Aufgabe wählen"}
                </button>
              </form>
            </>
          ) : (
            <p>
              Wählt gerade die Kategorie. Überlege dir schon deine Strategie.
            </p>
          )}
        </div>
      ) : (
        <div className="trio-columns">
          <div className="trio-focus">
            {g.stage === "bid" ? (
              <>
                <GameIcon id="auction" />
                <div className="auction-bid" key={g.bid}>
                  <strong>{g.bid || "–"}</strong>
                  <span>
                    BEGRIFFE IN {room.selection[room.index].seconds} SEKUNDEN
                  </span>
                </div>
                {g.leader ? (
                  <PlayerName room={room} id={g.leader} />
                ) : (
                  <p>Das erste Gebot gehört dir.</p>
                )}
                <p className="auction-stake">
                  {g.bid
                    ? `Einsatz: +${g.bid * 10} bei Erfolg · −${g.bid * 10} bei Fehlschlag`
                    : "Jeder gebotene Begriff ist 10 Punkte wert."}
                </p>
                {!p ? (
                  <div className="trio-sealed">Du schaust der Auktion zu.</div>
                ) : p.passed ? (
                  <div className="trio-sealed">
                    Du hast gepasst. Gleich prüfst du mit.
                  </div>
                ) : mine ? (
                  <div className="trio-sealed">
                    Du führst. Dein Gebot ist verbindlich.
                  </div>
                ) : (
                  <form
                    className="auction-controls"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send({ type: "bid", value: bid });
                    }}
                  >
                    <label>
                      Dein Gebot
                      <input
                        aria-label="Dein Gebot"
                        type="number"
                        min={g.bid + 1}
                        max={50}
                        value={bid}
                        disabled={pending}
                        onChange={(e) => {clearError();setBidChanged(true);setBid(Number(e.target.value));}}
                      />
                    </label>
                    <button
                      className="primary"
                      disabled={pending || !Number.isInteger(bid) || bid <= g.bid || bid > 50}
                    >
                      {pending?"Wird bestätigt \u2026":`🔨 ${bid} bieten`}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => send({ type: "pass" })}
                    >
                      Passen
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <PlayerName room={room} id={g.leader} />
                <div className="auction-counter">
                  <strong>{g.answers.length}</strong>
                  <span>/ {g.bid} versprochen</span>
                </div>
                <p>
                  {judging
                    ? "Welche Begriffe passen? Jeder zählt nur einmal."
                    : mine
                      ? "Ein Begriff pro Eingabe. Zusätzliche Antworten sichern dein Gebot ab."
                      : "Die Begriffe erscheinen live. Nach Ablauf prüft ihr gemeinsam."}
                </p>
                {g.stage === "perform" && mine && (
                  <>
                    <form
                      className="trio-entry"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (word.trim()) send({ type: "word", word });
                      }}
                    >
                      <input
                        ref={input}
                        autoFocus
                        aria-label="Nächster Begriff"
                        autoComplete="off"
                        value={word}
                        disabled={pending}
                        maxLength={60}
                        onChange={(e) => {clearError();setWord(e.target.value);}}
                        placeholder="Begriff eingeben …"
                      />
                      <button
                        className="primary"
                        disabled={pending || !word.trim() || g.answers.length >= 50}
                      >
                        {pending?"Wird bestätigt \u2026":"Hinzufügen ↵"}
                      </button>
                    </form>
                    <button
                      className="trio-finish"
                      disabled={pending}
                      onClick={() => send({ type: "finish" })}
                    >
                      Fertig – Antworten prüfen lassen
                    </button>
                  </>
                )}
                {judging &&
                  (mine ? (
                    <div className="trio-sealed">
                      Deine Crew bewertet. Du stimmst bei deinem Versuch nicht
                      mit.
                    </div>
                  ) : !p ? (
                    <div className="trio-sealed">Die Crew prüft die Begriffe. Du schaust zu.</div>
                  ) : (
                    <AuctionJury key={room.phaseKey} room={room} me={me} act={act}/>
                  ))}
              </>
            )}
          </div>
          <aside className="trio-sidebar">
            <h3>
              {g.stage === "bid" ? "Der Bieterverlauf" : "Genannte Begriffe"}
            </h3>
            {g.stage === "bid" ? (
              <>
                <p>
                  Höher bieten oder aussteigen. Die höchste Zahl muss erfüllt
                  werden.
                </p>
                <ol className="auction-history">
                  {[...g.bids].reverse().map((b: any, i: number) => (
                    <li key={i}>
                      <PlayerName room={room} id={b.id} />
                      <b>{b.bid}</b>
                    </li>
                  ))}
                </ol>
                {!g.bids.length && <p>Noch kein Gebot.</p>}
              </>
            ) : (
              <>
                {judging&&p&&!mine?<><p className="auction-jury-seals" role="status">{Object.entries(g.roster??{}).filter(([id,v]:[string,any])=>id!==g.leader&&v.submitted).length} / {room.participantIds.filter((id:string)=>id!==g.leader).length} Bewertungen versiegelt</p><p>Nur der Abgabestatus ist öffentlich. Stimmen und Mehrheiten erscheinen gemeinsam bei der Auflösung.</p><details><summary>Alle {g.answers.length} genannten Begriffe</summary><Words words={g.answers}/></details></>:<><AuctionBookNav total={g.answers.length}/><Words words={g.answers}/></>}
              </>
            )}
            <div className="trio-rule">
              {judging
                ? "Mehr Ja als Nein = gültig. Gleichstand und keine Stimmen = ungültig. Zu zweit entscheidet der andere Spieler."
                : "Erfolg: +10 × Gebot. Fehlschlag: −10 × Gebot. Alle anderen: 0 Rundenpunkte."}
            </div>
          </aside>
        </div>
      )}
      {error&&<p className="submission-error" role="alert">{error}</p>}
    </section>
  );
}
export function TimingGame({ room, me, now, act }: Props) {
  const g = room.game,
    p = g.mine;
  const storageKey = `olymp.clock:${room.code}:${g.round}:${me}:${room.phaseKey.split(":").slice(0, 2).join(":")}`;
  const start = useRef<number | null>(null),
    stopValue = useRef<number|null>(null),
    currentMine = useRef(p),
    [localRunning, setLocalRunning] = useState(false),
    [decoy, setDecoy] = useState(""),
    [submitted, setSubmitted] = useState(false);
  currentMine.current=p;
  const {error:startError,clearError:clearStartError,submit:sendStart}=useGameSubmission(act,`${storageKey}:start`);
  const {pending:stopSending,error:stopError,clearError:clearStopError,submit:sendStop}=useGameSubmission(act,`${storageKey}:stop`);
  useAdventureDraft({timingDecoy:decoy},[decoy]);
  useEffect(() => {
    let stored=0;try{stored=Number(sessionStorage.getItem(storageKey));}catch{}
    if (p.startedAt !== null && !p.submitted) {
      start.current ??=
        stored > 0
          ? stored
          : performance.timeOrigin + performance.now() - (now - p.startedAt);
      setLocalRunning(stopValue.current===null);
    }
    if (p.submitted) {
      setSubmitted(true);
      setLocalRunning(false);
      try{sessionStorage.removeItem(storageKey);}catch{}
    }
  }, [p.startedAt, p.submitted]);
  const running =
    (localRunning || p.startedAt !== null) && !p.submitted && !submitted;
  useEffect(()=>{sound.quietClock(running);return()=>sound.quietClock(false);},[running,g.mode]);
  const toggle = () => {
    if (p.submitted || submitted) return;
    if (!running) {
      clearStartError();clearStopError();
      const t = performance.timeOrigin + performance.now();
      start.current = t;
      try{sessionStorage.setItem(storageKey, String(t));}catch{}
      setLocalRunning(true);
      void sendStart({ type: "start", round:g.round }).then(ok=>{if(!ok&&currentMine.current.startedAt===null&&stopValue.current===null)setLocalRunning(false);});
      sound.play("clockOn");
    } else if (start.current !== null) {
      const elapsed =
        performance.timeOrigin + performance.now() - start.current;
      stopValue.current=elapsed;
      void sendStop({ type: "stop", elapsed, round:g.round });
      setSubmitted(true);
      setLocalRunning(false);
      sound.play("clockOff");
    }
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !e.repeat && !e.isComposing && !e.defaultPrevented &&
        !(e.target instanceof HTMLElement && e.target.closest('textarea,select,[contenteditable=true],[role=dialog]')) &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLButtonElement)
      ) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  useEffect(() => {
    if (!running || g.mode === "calm") return;
    let stopped = false,
      timer: ReturnType<typeof setTimeout>;
    let step = 0;
    const next = () => {
      if (stopped) return;
      step++;
      if (g.mode === "echo") sound.play("clockDecoy");
      else setDecoy(String((g.seed + step * 7) % 10));
      timer = setTimeout(next, 650 + ((g.seed + step * 431) % 1600));
    };
    timer = setTimeout(next, 950);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [running, g.mode, g.seed]);
  return (
    <section
      className={`trio-arena timing-arena ${running ? "clock-running" : ""}`}
    >
      <header className="trio-heading">
        <span className="eyebrow">
          ZEITGEFÜHL ·{" "}
          {g.mode === "calm"
            ? "RUHIGE HAND"
            : g.mode === "echo"
              ? "FALSCHE TAKTE"
              : "ZAHLENNEBEL"}
        </span>
        <h2>
          {p.submitted
            ? "Dein Moment ist festgehalten."
            : submitted ? "Dein Stopp ist noch nicht bestätigt." : running
              ? "Vertrau deinem Gefühl."
              : "Präge dir deine Zielzeit ein."}
        </h2>
        <p>
          {g.mode === "calm"
            ? "Starte selbst. Stoppe genau im richtigen Moment."
            : g.mode === "echo"
              ? "Die unregelmäßigen Töne wollen dich ablenken. Zähle in deinem eigenen Tempo."
              : "Die auftauchenden Zahlen sind Ablenkung – kein Countdown."}
        </p>
      </header>
      <div className="clock-stage">
        <div className="clock-orbit" aria-hidden="true" />
        <div className="clock-face">
          {p.submitted || submitted ? (
            <>
              <span className="clock-lock">{p.submitted?"✓":"…"}</span>
              <strong>{p.submitted?"Versiegelt":stopSending?"Wird bestätigt":"Noch nicht bestätigt"}</strong>
              <small>Ergebnis erst bei der Auflösung</small>
            </>
          ) : running ? (
            <>
              <span className="clock-mystery" aria-hidden="true">
                {g.mode === "decoy" ? decoy || "?" : "?"}
              </span>
              <strong>Die Uhr bleibt unsichtbar.</strong>
            </>
          ) : (
            <>
              <GameIcon id="timing" />
              <strong className="clock-target">
                {seconds(g.target)}
                <small>Sekunden</small>
              </strong>
            </>
          )}
        </div>
      </div>
      <button
        className={`clock-button ${running ? "stopping" : "primary"}`}
        onPointerDown={(e) => {
          if (running) {
            e.preventDefault();
            toggle();
          }
        }}
        onKeyDown={(e) => {
          if (running && (e.code === "Space" || e.code === "Enter")) {
            e.preventDefault();
            if (!e.repeat) toggle();
          }
        }}
        onClick={() => {
          if (!running) toggle();
        }}
        disabled={
          p.submitted ||
          submitted ||
          (!running && g.deadline - now < g.target + 3000)
        }
      >
        {p.submitted
          ? "Auf die Crew warten"
          : submitted ? stopSending ? "Stopp wird bestätigt \u2026" : "Stopp nicht bestätigt"
          : running
            ? "STOPP"
            : "Meine Uhr starten"}
      </button>
      {!running&&!p.submitted&&(submitted?stopError:startError)&&<p className="submission-error" role="alert">{submitted?stopError:startError}</p>}
      {submitted&&!p.submitted&&!stopSending&&stopError&&<div className="timing-recovery"><button type="button" className="secondary" onClick={()=>{if(stopValue.current!==null)void sendStop({type:"stop",elapsed:stopValue.current,round:g.round});}}>Stopp erneut übertragen</button>{p.startedAt!==null&&<button type="button" className="secondary" onClick={()=>{stopValue.current=null;clearStopError();setSubmitted(false);setLocalRunning(true);}}>Weiter messen und neu stoppen</button>}{p.startedAt===null&&<button type="button" className="secondary" onClick={()=>{stopValue.current=null;start.current=null;clearStartError();clearStopError();setSubmitted(false);setLocalRunning(false);try{sessionStorage.removeItem(storageKey);}catch{}}}>Zurück zum Start</button>}</div>}
      <p className="clock-hint">
        {running
          ? "Klicken oder Leertaste · Keine laufende Zeit sichtbar."
          : submitted&&!p.submitted ? "Dein Stopp zählt erst nach der Bestätigung." : "Jeder startet unabhängig. Alle Zeiten werden gemeinsam aufgedeckt."}
      </p>
    </section>
  );
}
export function BombGame({ room, me, act }: Props) {
  const dock=useContext(BombConsoleMount);
  const g = room.game,
    p = g.mine,
    [word, setWord] = useState(""),
    input = useRef<HTMLInputElement>(null),
    mine = g.turnId === me;
  const {pending:sending,error,clearError,submit}=useGameSubmission(act,`${room.code}:${room.phaseKey}:${g.round}:${g.turn}:${g.stage}:${me}`);
  const send = (a:any) => submit({...a,round:g.round,turn:g.turn});
  useDeadlineInput(room,act,g.stage==="word" && mine && word.trim() ? {type:"word",word,round:g.round,turn:g.turn} : null);
  useEffect(() => {
    setWord("");
    if (mine && g.stage === "word") input.current?.focus({preventScroll:true});
  }, [g.turn, g.stage, mine,dock?.element]);
  useEffect(()=>{
    if(g.stage!=='judge'||!dock?.element)return;
    const frame=requestAnimationFrame(()=>{const panel=dock.element?.querySelector<HTMLElement>('[data-bomb-review]');(panel?.querySelector<HTMLButtonElement>('button')??panel)?.focus({preventScroll:true});});
    return()=>cancelAnimationFrame(frame);
  },[g.stage,g.turn,p.ballot,dock?.element]);
  useEffect(() => {
    if (g.stage !== "word") return;
    let timer: ReturnType<typeof setTimeout>,
      stopped = false;
    const beat = () => {
      if (stopped) return;
      sound.play("fuse");
      timer = setTimeout(beat, 750 + Math.random() * 500);
    };
    timer = setTimeout(beat, 900);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [g.stage]);
  const entry=<form className="bomb-world-entry" data-bomb-entry onSubmit={e=>{e.preventDefault();if(word.trim())send({type:'word',word});}}><label><span><b>{g.fragment}</b> · Dein Wort · Lunte geheim</span><input ref={input} autoFocus aria-label="Wort mit Buchstabenfolge" autoComplete="off" autoCorrect="off" spellCheck={false} maxLength={24} value={word} onFocus={()=>dock?.enter()} disabled={sending} onChange={e=>{setWord(e.target.value);clearError();}} placeholder={`Wort mit ${g.fragment} …`}/></label><button className="primary" disabled={sending||!word.trim()}>{sending?'Wird weitergegeben \u2026':'Weitergeben →'}</button>{error&&<p role="alert" className="submission-error">{error}</p>}{g.verdict?.valid===false&&g.outcome?.reason&&<p className="bomb-entry-feedback" role="status">{g.outcome.reason}</p>}</form>;
  const review=<section className="bomb-world-review" aria-label="Gemeinsame Wortprüfung" tabIndex={-1} data-bomb-review>
    <strong>{g.candidate?.word}</strong>
    <p>Nicht im Wörterbuch. Echtes deutsches Wort? Die Lunte pausiert.</p>
    {mine?<div role="status">Die Crew entscheidet über dein Wort.</div>:p.ballot!==null?<div role="status">Stimme versiegelt ✓</div>:<div className="bomb-review-actions"><button className="primary" disabled={sending} onClick={()=>send({type:'judge',valid:true})}>✓ Gültiges Wort</button><button disabled={sending} onClick={()=>send({type:'judge',valid:false})}>✕ Ungültig</button></div>}
    {sending&&<p role="status">Deine Stimme wird gesendet …</p>}
    {error&&<p role="alert" className="submission-error">{error}</p>}
    <small>Mehr Ja als Nein nötig · Der Autor stimmt nicht mit.</small>
  </section>;
  return (
    <section
      className={`trio-arena bomb-arena ${g.stage === "explosion" ? "bomb-exploded" : ""}`}
      data-stage={g.stage}
    >
      <header className="trio-heading">
        <span className="eyebrow">
          BOMBENWORT ·{" "}
          {Object.values(g.roster).filter((p: any) => p.alive).length} NOCH
          DABEI
        </span>
        <h2>
          {g.stage === "explosion"
            ? "Zu lange gezögert!"
            : g.stage === "judge"
              ? "Ein Wort für die Crew."
              : mine
                ? "Die Bombe ist bei dir!"
                : "Schnell weitergeben!"}
        </h2>
        <p>
          Die Folge muss irgendwo im Wort stehen. Jedes Wort nur einmal pro
          Runde.
        </p>
      </header>
      <div className="trio-columns">
        <div
          className="trio-focus bomb-focus"
          key={g.stage === "word" ? g.turn : g.stage}
        >
          <PlayerName room={room} id={g.turnId} />
          <div
            className="bomb-device"
            aria-label={`Buchstabenfolge ${g.fragment}`}
          >
            <span className="bomb-spark" />
            <span className="bomb-neck" />
            <strong>{g.fragment}</strong>
            {g.stage === "explosion" && (
              <Particles seed={`bomb-${g.turn}`} burst />
            )}
          </div>
          {g.stage === "explosion" ? (
            <div className="bomb-message">
              <strong>BOOM!</strong>
              <p>Ausgeschieden. Du darfst weiter Wörter mitprüfen.</p>
            </div>
          ) : g.stage === "judge" ? (
            dock?.element?createPortal(review,dock.element):review
          ) : (
            <>
              {mine ? (
                dock?.element?createPortal(entry,dock.element):entry
              ) : (
                <p>
                  {p.alive
                    ? "Überlege schon dein nächstes Wort."
                    : "Du bist raus, kannst unbekannte Wörter aber weiter prüfen."}
                </p>
              )}
              {g.verdict?.valid === false && mine && (
                <p role="status" className="bomb-rejected">
                  {g.outcome?.reason}
                </p>
              )}
              <small>
                Unbekannte Restzeit · Die Lunte läuft über alle Übergaben
                weiter.
              </small>
            </>
          )}
        </div>
        <details className="party-bomb-history"><summary>Genannte Wörter · {g.history.length}</summary><aside className="trio-sidebar">
          <h3>Schon benutzt · {g.history.length}</h3>
          <Words words={[...g.history].reverse()} />
          {!g.history.length && <p>Das erste Wort startet eure Kette.</p>}
          <div className="trio-rule">
            Wiederholung oder falsche Buchstaben? Die Bombe bleibt bei dir. Nach
            einer Explosion kommt eine neue Folge.
          </div>
          <a
            href="/wordbook/source.txt"
            target="_blank"
            rel="noreferrer"
            className="trio-source"
          >
            Wörterbuch & Lizenz
          </a>
        </aside></details>
      </div>
      <div className="bomb-order">
        {room.participantIds.map((id: string) => (
          <div
            key={id}
            className={
              !g.roster[id].alive ? "out" : id === g.turnId ? "current" : ""
            }
          >
            <PlayerName room={room} id={id} />
            <small>
              {!g.roster[id].alive
                ? "Ausgeschieden"
                : id === g.turnId
                  ? "💣 Am Zug"
                  : `${g.roster[id].words} Wörter`}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}
export function TrioReveal({
  g,
  players,
  me,
  now,
}: {
  g: any;
  players: any[];
  me?: string;
  now: number;
}) {
  const r = g.reveal,
    rows = [...r.players].sort((a: any, b: any) => b.score - a.score),
    room = { players };
  const revealCount =
    g.id === "timing"
      ? timingRevealCount(g,now)
      : rows.length;
  const ownIndex=rows.findIndex((row:any)=>row.id===me),ownResult=rows[ownIndex];
  const heardTiming=useRef({key:g.id+':'+g.round,count:revealCount});
  useEffect(()=>{const key=g.id+':'+g.round,old=heardTiming.current;if(old.key===key&&g.id==='timing'&&revealCount>old.count)sound.play(revealCount===rows.length?'clockPerfect':'clockReveal');heardTiming.current={key,count:old.key===key?Math.max(old.count,revealCount):revealCount};},[g.id,g.round,revealCount]);

  return (
    <section className={`round-reveal trio-results results-${g.id}`}>
      <Particles seed={`${g.id}:${g.round}`} burst />
      <span className="eyebrow">RUNDE {g.round} · DIE AUFLÖSUNG</span>
      <h2>
        {g.id === "timing"
          ? "Wie nah war dein Moment?"
          : g.id === "auction"
            ? !r.leader
              ? "Kein Gebot, kein Risiko."
              : r.success
                ? "Versprochen. Geliefert!"
                : "Zu hoch gepokert!"
            : "Die letzte Lunte ist erloschen."}
      </h2>
      {g.id === "timing" ? (
        <p className="trio-result-summary">
          Zielzeit <strong>{seconds(r.target)} s</strong> · Je näher, desto mehr
          Punkte.
        </p>
      ) : g.id === "auction" ? (
        <>
          <p className="trio-result-summary">
            {r.topic?.name} ·{" "}
            <strong>
              {r.count} gültig / {r.bid} geboten
            </strong>
          </p>
          {r.leader && (
            <div className={`auction-payoff ${r.success ? "good" : "bad"}`}>
              <PlayerName room={room} id={r.leader} />
              <strong>
                {r.success ? "+" : "−"}
                {r.stake} Punkte
              </strong>
            </div>
          )}
          <AuctionBookNav total={r.answers.length}/>
          <div className="auction-verdicts">
            {r.answers.map((a: any, i: number) => (
              <span key={i} className={a.valid ? "valid" : "invalid"}>
                {a.valid ? "✓" : "✕"} {a.word}
                <small>
                  {a.yes} Ja · {a.no} Nein
                </small>
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="trio-result-summary">
          <PlayerName room={room} id={r.winner} /> bleibt übrig!
        </p>
      )}
      {ownResult&&<p className="party-own-result"><span>Dein Rundenergebnis</span><strong>{ownIndex<revealCount?`${Number(ownResult.score).toLocaleString('de-DE',{maximumFractionDigits:1,signDisplay:'exceptZero'})} Punkte`:'Wird gleich aufgedeckt'}</strong></p>}
      <div className="trio-result-grid">
        {rows.map((p: any, i: number) => (
          <article
            key={p.id}
            className={`${p.id === me ? "is-me" : ""} ${i < revealCount ? "revealed" : "sealed"}`}
            style={{ "--delay": `${i * 80}ms` } as any}
          >
            <PlayerName room={room} id={p.id} />
            {i < revealCount ? (
              <>
                <strong>
                  {g.id === "timing"
                    ? p.elapsed === null
                      ? "Kein Stopp"
                      : `${seconds(p.elapsed)} s`
                    : g.id === "bomb"
                      ? `Platz ${p.place}`
                      : p.id === r.leader
                        ? "Das Gebot"
                        : "Mitgeprüft"}
                </strong>
                <small>
                  {g.id === "timing"
                    ? p.error === null
                      ? "0 Punkte"
                      : `${Math.abs(p.error)} ms ${p.error < 0 ? "zu früh" : p.error > 0 ? "zu spät" : "· exakt!"}`
                    : g.id === "bomb"
                      ? `${p.words} Wörter weitergegeben`
                      : "Rundenergebnis"}
                </small>
                <b className={p.score < 0 ? "negative" : ""}>
                  {p.score > 0 ? "+" : ""}
                  <AnimatedNumber value={p.score} /> Punkte
                </b>
              </>
            ) : (
              <strong>Versiegelt …</strong>
            )}
          </article>
        ))}
      </div>
      <p className="trio-result-foot">
        {g.id === "timing"
          ? "1.000 Punkte bei einem exakten Treffer. Die absolute Abweichung entscheidet."
          : g.id === "auction"
            ? "Erfolg oder Fehlschlag zählt für den Bieter. Die Summe aller Runden entscheidet."
            : "Rundenplätze bringen 0–100 Punkte. Die Summe entscheidet die Disziplin."}
      </p>
    </section>
  );
}
