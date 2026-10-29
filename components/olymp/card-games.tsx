"use client";
import { turnOrder } from "@/lib/game/presentation";
import { useContext, useEffect, useRef, useState } from "react";
import {createPortal} from 'react-dom';
import { handValue } from "@/lib/game/games/blackjack";
import { playable } from "@/lib/game/games/cards";
import { Avatar } from "./art";
import { sound } from "@/lib/audio";
import { CardActionTheatre,describeMove } from "./card-action-theatre";
import {useDeadlineInput} from "./deadline-input";
import {useAdventureDraft} from './adventure-context';
import {colorHandPageSize,colorHandClosePageSize,colorCardMarks,colorCardNames} from '@/lib/color-table-presentation';
import {CardTableView} from './card-view-context';
import {useGameSubmission} from './use-game-submission';
export const cardColors = [
  "#ff7b9d",
  "#56d9ff",
  "#bcff5c",
  "#ffb85c",
  "#9b8aff",
];
const labels = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "⊘",
  "⇄",
  "+2",
  "✦",
  "+4",
];
const actions = [
  "Aussetzen",
  "Richtung wechseln",
  "Zwei ziehen",
  "Farbe wählen",
  "Vier ziehen + Farbe wählen",
];
export function PlayingCard({
  card,
  onClick,
  disabled = false,
  match = false,
  handIndex,
}: {
  card: any;
  onClick?: () => void;
  disabled?: boolean;
  match?: boolean;
  handIndex?:number;
}) {
  const number = card.rank
    ? ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][
        card.rank - 1
      ]
    : labels[card.value];
  const suit = card.rank ? ["♠", "♥", "♦", "♣"][card.suit] : number;
  const wild = card.color === 4;
  return (
    <button
      type="button"
      data-card-index={handIndex}
      className={`playing-card ${wild ? "wild-card" : ""} ${match ? "playable-card" : ""}`}
      style={{ "--card": cardColors[card.color ?? card.suit % 4] } as any}
      disabled={disabled}
      onClick={onClick}
      aria-label={
        card.rank
          ? `${number} ${["Pik", "Herz", "Karo", "Kreuz"][card.suit]}`
          : wild
            ? `Joker${card.value === 14 ? " +4" : ""}`
            : `${card.value < 10 ? number : actions[card.value - 10]}, ${["Koralle", "Blau", "Limette", "Orange"][card.color]}`
      }
    >
      <span>{number}</span>
      <strong>{suit}</strong>
      <small>
        {!card.rank ? `${card.color<4?colorCardMarks[card.color]+' ':''}${card.value>=10?actions[card.value-10]:''}` : ""}
      </small>
    </button>
  );
}
const playerName = (players: any[], id: string) =>
  players.find((p) => p.id === id)?.name ?? "Spieler";
export function Club21({
  room,
  g,
  players,
  me,
  act,
}: {
  room: any;
  g: any;
  players: any[];
  me: string;
  act: (a: any) => void | Promise<boolean>;
}) {
  const p = g.mine,
    [bet, setBet] = useState(50),
    value = handValue(p.hand),
    bust = value > 21;
  const [betChanged,setBetChanged]=useState(false);
  const {pending,error,clearError,submit}=useGameSubmission(act,`${room.code}:${room.phaseKey}:${g.round}:${me}`);
  useAdventureDraft({casinoPhase:room.phaseKey,casinoBet:bet,casinoPending:pending,casinoError:error},[room.phaseKey,bet,pending,error]);
  useEffect(()=>{setBetChanged(false);},[g.round]);
  async function send(action:any){if(g.stage!=='answer'||p.stood||p.abandoned)return false;return submit(action);}
  useDeadlineInput(room,act,!p.bet && !p.stood && !p.abandoned && betChanged && bet<=p.chips ? {type:"bet",value:bet} : null);
  const status = pending ? "Deine Aktion wird bestätigt …" : !p.bet
    ? "Wähle deinen Einsatz"
    : bust
      ? "Über 21 · diese Hand ist vorbei"
      : p.stood
        ? value === 21
          ? "21! · jetzt entscheidet der Dealer"
          : "Du bleibst stehen · warte auf den Dealer"
        : "Ziehen oder stehen bleiben?";
  return (
    <div className="club21">
      <div className="club-metrics">
        <div>
          <small>Deine Chips</small>
          <strong>{p.chips.toLocaleString("de-DE")}</strong>
        </div>
        <div>
          <small>Dein Einsatz</small>
          <strong>{p.bet || "—"}</strong>
        </div>
        <div>
          <small>Ziel</small>
          <strong>21</strong>
        </div>
      </div>
      <div className="felt-table">
        <div className="dealer-zone">
          <span className="eyebrow">
            DEALER · {g.dealer.length ? handValue(g.dealer) : "—"} + ?
          </span>
          <div className="card-hand">
            {g.dealer.map((c: any, i: number) => (
              <PlayingCard key={i} card={c} disabled />
            ))}
            <div className="card-back" aria-label="Verdeckte Dealerkarte">
              ✦
            </div>
          </div>
          <small>Zieht bis 16 · bleibt ab 17 stehen</small>
        </div>
        <div className="felt-divider">CLUB 21</div>
        <div className="your-zone">
          <div
            className={`hand-total ${bust ? "bust" : value === 21 ? "perfect" : ""}`}
          >
            <small>DEINE HAND</small>
            <strong key={value}>{p.bet ? value : "—"}</strong>
            <span>{status}</span>
          </div>
          <div className="card-hand">
            {p.hand.map((c: any, i: number) => (
              <PlayingCard key={`${i}:${c.rank}:${c.suit}`} card={c} disabled />
            ))}
          </div>
          {p.bet > 0 && (
            <div className={`twenty-one-meter ${bust ? "busted" : ""}`}>
              <i style={{ width: `${Math.min(100, (value / 21) * 100)}%` }} />
              <span>{bust ? "Über dem Limit" : `${21 - value} bis 21`}</span>
            </div>
          )}
          {!p.bet && (
            <p className="muted">
              Zwei Startkarten erscheinen nach deinem Einsatz.
            </p>
          )}
        </div>
      </div>
      {!p.bet ? (
        <div className="bet-panel">
          <span className="field-label">Wie viel setzt du?</span>
          <div className="bet-options">
            {[10, 25, 50, 75, 100].map((v) => (
              <button
                key={v}
                data-casino-bet={v}
                disabled={pending || v > p.chips}
                className={bet === v ? "selected" : ""}
                onClick={() => {
                  clearError();
                  setBetChanged(true);
                  setBet(v);
                  sound.play("click");
                }}
              >
                {v}
                <small>Chips</small>
              </button>
            ))}
          </div>
          <button
            className="primary wide"
            disabled={pending || bet > p.chips}
            onClick={() => void send({ type: "bet", value: bet })}
          >
            Mit {bet} Chips starten →
          </button>
        </div>
      ) : (
        <div className="club-actions">
          <button
            className="primary"
            disabled={pending || p.stood}
            onClick={() => void send({ type: "hit" })}
          >
            <strong>+ Karte ziehen</strong>
            <small>Eine weitere Karte · über 21 verlierst du</small>
          </button>
          <button disabled={pending || p.stood} onClick={() => void send({ type: "stand" })}>
            <strong>✓ Stehen bleiben</strong>
            <small>Deine {value} sichern · Dealer abwarten</small>
          </button>
        </div>
      )}
      <div className="game-help">
        <span>Ass = 1 oder 11</span>
        <span>Bildkarte = 10</span>
        <span>Blackjack zahlt 3:2</span>
      </div>
      {error&&!p.stood&&<p role="alert">{error}</p>}
    </div>
  );
}
export function ColorCards({
  room,
  g,
  players,
  me,
  now,
  act,
}: {
  room: any;
  g: any;
  players: any[];
  me: string;
  now: number;
  act: (a: any) => void|Promise<boolean>;
}) {
  const [wild, setWild] = useState<any>(null);
  const [wish, setWish] = useState<number | null>(null);
  const picker = useRef<HTMLElement>(null);
  const {pending,error,clearError,submit}=useGameSubmission(act,`${room.code}:${room.phaseKey}:${me}`);
  const pendingRef=useRef(false);pendingRef.current=pending;
  const send=(action:any)=>g.stage==='answer'&&g.turnId===me&&!g.mine.abandoned?submit(action):Promise.resolve(false);
  const view=useContext(CardTableView),focused=view.focused&&!!view.mount,pageSize=focused?colorHandClosePageSize:colorHandPageSize,focusControls=useRef<HTMLElement>(null);
  const [page,setPage]=useState(0),pages=Math.max(1,Math.ceil(g.mine.hand.length/pageSize));
  useEffect(()=>setPage(0),[g.round,pageSize]);
  useEffect(()=>setPage(p=>Math.min(p,pages-1)),[pages]);
  useAdventureDraft({cardPage:page,cardFocused:focused,cardExpanded:view.expanded,cardWild:wild?.id??null,cardWish:wish,cardPending:pending},[page,focused,view.expanded,wild?.id,wish,pending]);
  useEffect(()=>{if(focused)focusControls.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();},[focused]);
  const mine = g.turnId === me;
  useEffect(() => setWild(null), [g.turnId, g.round, g.stage,g.lastMove?.id,room.phase]);
  useEffect(() => {
    if (!wild) return;
    const last = document.activeElement as HTMLElement | null;
    const stage=focused?view.mount?.closest<HTMLElement>('.adventure-stage'):null,wasInert=stage?.inert??false;
    picker.current?.querySelector<HTMLButtonElement>("button")?.focus();
    if(stage)stage.inert=true;
    const key = (e: KeyboardEvent) => {
      if(e.defaultPrevented||e.isComposing)return;
      if (e.key === "Escape") {
        if(pendingRef.current){e.preventDefault();return;}
        e.preventDefault();
        setWild(null);
      }
      if (e.key === "Tab") {
        const buttons = Array.from(
          picker.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
        ).filter(button=>!button.disabled);
        if(!buttons.length){e.preventDefault();picker.current?.focus();return;}
        const current = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        if (e.shiftKey && current <= 0) {
          e.preventDefault();
          buttons.at(-1)?.focus();
        } else if (!e.shiftKey && current === buttons.length - 1) {
          e.preventDefault();
          buttons[0]?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      if(stage)stage.inert=wasInert;
      last?.focus();
    };
  }, [wild]);
  const play = (card: any) => {
    if(pending||!mine||g.stage!=='answer')return;
    clearError();
    if (card.color === 4) {
      setWish(null);
      setWild(card);
      sound.play("click");
    } else void send({ type: "play", card: card.id });
  };
  const ownCards=<div className="card-hand own-hand">{g.mine.hand.map((c:any,index:number)=>focused&&(index<page*pageSize||index>=(page+1)*pageSize)?null:<PlayingCard key={c.id} card={c} handIndex={index} match={mine&&playable(c,g.top,g.color)} disabled={pending||!mine||!playable(c,g.top,g.color)||!!wild} onClick={()=>play(c)}/>)}</div>;
  return (
    <div className={`color-card-game ${mine ? "your-turn" : ""}`}>
      <div className="turn-banner">
        <span className="turn-light" />
        <strong>
          {mine ? "Du bist dran" : `${playerName(players, g.turnId)} ist dran`}
        </strong>
        <span>{Math.max(0, Math.ceil((g.deadline - now) / 1000))} s</span>
      </div>
      <CardActionTheatre key={g.round} g={g} players={players} now={now} />
      <details className="party-card-order"><summary>Zugfolge & Kartenanzahl</summary>
      <div className="turn-order-heading">
        <strong>{g.direction === 1 ? "↻" : "↺"} Zugfolge</strong>
        <span>Von links nach rechts · nach dem letzten wieder zum ersten</span>
      </div>
      <div className="card-opponents turn-order" aria-label="Zugfolge">
        {turnOrder(g.order ?? Object.keys(g.counts), g.turnId, g.direction).map(
          (id, index) => {
            const x = players.find((p) => p.id === id);
            return (
              <div
                key={id}
                className={id === g.turnId ? "active" : ""}
                aria-current={index === 0 ? "step" : undefined}
              >
                <small className="turn-position">
                  {index === 0
                    ? "JETZT"
                    : index === 1
                      ? "DANACH"
                      : index + 1 + ". DANACH"}
                </small>
                <Avatar avatar={x?.avatar} look={x?.look} color={x?.color} />
                <strong>{id === me ? "Du" : (x?.name ?? "Spieler")}</strong>
                <span className="hand-count" key={g.counts[id]}>
                  <b>{g.counts[id]}</b>{" "}
                  {g.counts[id] === 1 ? "Karte" : "Karten"}
                </span>
                {g.counts[id] === 1 && (
                  <small className="last-card-alert">LETZTE KARTE!</small>
                )}
              </div>
            );
          },
        )}
      </div>
      </details>
      {!focused&&<div className="color-table">
        <div className="draw-pile">
          <button
            className="card-back"
            data-card-draw
            aria-label="Eine Karte ziehen"
            disabled={pending || !mine || !!wild}
            onClick={() => void send({ type: "draw" })}
          >
            ✦<small>Ziehen</small>
          </button>
          <span>Keine passende Karte?</span>
        </div>
        <div
          className="discard-pile"
          style={{ "--chosen-color": cardColors[g.color] } as any}
        >
          <PlayingCard key={g.top.id} card={g.top} disabled />
          <span>{g.top.color === 4 ? "GEWÜNSCHTE FARBE" : "Ablage"}</span>
          {g.top.color === 4 && (
            <i
              className="discard-wish"
              style={{ background: cardColors[g.color] }}
              aria-label={`Gewünschte Farbe: ${["Koralle", "Blau", "Limette", "Orange"][g.color]}`}
            >
              ✓
            </i>
          )}
        </div>
        <div className="active-color">
          <span>AKTUELLE FARBE</span>
          <i
            style={{ background: cardColors[g.color] }}
            aria-label={["Koralle", "Blau", "Limette", "Orange"][g.color]}
          />
          <small>{g.direction === 1 ? "↻" : "↺"} Spielrichtung</small>
        </div>
      </div>}
      <p className="hand-instruction">
        {pending ? "Deine Kartenaktion wird bestätigt …" : mine
          ? g.mine.hand.some((c: any) => playable(c, g.top, g.color))
            ? "Leuchtende Karten passen. Klicke eine Karte zum Spielen."
            : "Keine Karte passt. Klicke auf den Ziehstapel."
          : "Deine Hand · du kannst sie in Ruhe ansehen."}
      </p>
      {!focused&&error&&!wild&&<p className="submission-error" role="alert">{error}</p>}
      {!focused&&ownCards}
      {!focused&&pages>1&&<nav className="card-scene-pages" aria-label="Karten am 3D-Tisch durchblättern"><button className="card-scene-previous" disabled={page===0||!!wild} onClick={()=>setPage(p=>p-1)}>← Vorige Tischkarten</button><span>Tischkarten {page*pageSize+1}–{Math.min(g.mine.hand.length,(page+1)*pageSize)} von {g.mine.hand.length}</span><button className="card-scene-next" disabled={page===pages-1||!!wild} onClick={()=>setPage(p=>p+1)}>Weitere Tischkarten →</button></nav>}
      <div className="game-help">
        <span>Gleiche Farbe oder gleiche Zahl</span>
        <span>Joker passt immer</span>
        <span>Ziehen beendet den Zug</span>
      </div>
      {focused&&createPortal(<section ref={focusControls} className="card-focus-controls" aria-label="Deine Tischkarten"><header><strong>{mine?'Du bist dran':`${playerName(players,g.turnId)} ist dran`}</strong><span>{colorCardMarks[g.color]} {colorCardNames[g.color]} · {g.direction===1?'↻':'↺'}</span></header><p className="card-focus-event" role="status" title={describeMove(g.lastMove,id=>playerName(players,id))}>{pending?'Deine Kartenaktion wird bestätigt \u2026':describeMove(g.lastMove,id=>playerName(players,id))}</p>{ownCards}{error&&!wild&&<p className="submission-error" role="alert">{error}</p>}<nav className="card-focus-navigation" aria-label="Tischkarten bedienen"><button className="card-scene-previous" aria-label="Vorige Tischkarten" disabled={page===0||!!wild} onClick={()=>setPage(p=>p-1)}>←</button><label>Karten<select aria-label="Tischkartenseite" value={page} disabled={!!wild} onChange={e=>setPage(Number(e.target.value))}>{Array.from({length:pages},(_,i)=><option key={i} value={i}>{i*pageSize+1}–{Math.min(g.mine.hand.length,(i+1)*pageSize)} / {g.mine.hand.length}</option>)}</select></label><button data-card-draw className="card-focus-draw" disabled={pending||!mine||!!wild} onClick={()=>void send({type:'draw'})}>Eine Karte ziehen</button><button className="card-scene-next" aria-label="Weitere Tischkarten" disabled={page===pages-1||!!wild} onClick={()=>setPage(p=>p+1)}>→</button></nav></section>,view.mount!)}
      {wild && mine && createPortal(
        <div className="wild-picker-overlay" data-reduced-motion={sound.settings.motion||undefined}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Jokerfarbe wählen"
            className="wild-picker"
            ref={picker}
            aria-busy={pending}
            tabIndex={-1}
          >
            <span className="eyebrow">
              JOKER{wild.value === 14 ? " +4" : ""}
            </span>
            <h2>Welche Farbe geht weiter?</h2>
            <p>Wähle ein Farbfeld. Bestätige danach deinen Joker.</p>
            <div className="wild-swatches">
              {cardColors.slice(0, 4).map((color, i) => (
                <button
                  key={color}
                  style={{ background: color }}
                  aria-label={`Jokerfarbe ${["Koralle", "Blau", "Limette", "Orange"][i]}`}
                  aria-pressed={wish === i}
                  disabled={pending}
                  onClick={() => {
                    clearError();
                    setWish(i);
                    sound.play("click");
                  }}
                >
                  <b>{wish === i ? "✓" : ["◆", "●", "▲", "■"][i]}</b>
                  <small>
                    {g.mine.hand.filter((c: any) => c.color === i).length} auf
                    deiner Hand
                  </small>
                </button>
              ))}
            </div>
            <button
              className="wish-confirm"
              disabled={pending || wish === null}
              style={{
                background: wish === null ? undefined : cardColors[wish],
              }}
              onClick={() => {
                if (wish === null || pending) return;
                void send({ type: "play", card: wild.id, color: wish });
              }}
            >
              {pending ? "Wird bestätigt \u2026" : wish === null
                ? "Erst ein Farbfeld auswählen"
                : "✓ Diese Farbe bestätigen"}
            </button>
            {error&&<p className="submission-error" role="alert">{error}</p>}
            <button className="text-button" disabled={pending} onClick={() => setWild(null)}>
              Andere Karte wählen
            </button>
          </section>
        </div>,document.body
      )}
    </div>
  );
}
