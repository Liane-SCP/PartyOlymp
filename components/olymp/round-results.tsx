"use client";
import { useEffect, useRef } from "react";
import {casinoPresentation} from '@/lib/casino-presentation';
import { handValue } from "@/lib/game/games/blackjack";
import { Avatar } from "./art";
import { AnimatedNumber, Particles } from "./showtime";
import { PlayingCard } from "./card-games";
import { SizeSilhouette, formatLength } from "./size-art";
import { CategoriesResults } from "./categories-game";
import { sound } from "@/lib/audio";
import { GeoResultsMap } from "./geo-results-map";
import { TrioReveal } from "./trio-games";
import { CodeReveal } from "./code-game";
import {DiceResults} from './dice-results';
const money = (cents: number) =>
  (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const decimal = (n: number) =>
  (n ?? 0).toLocaleString("de-DE", { maximumFractionDigits: 1 });
const color = (value: number[] | undefined) =>
  value ? `rgb(${value.join(",")})` : "#25334d";
export function RoundReveal({
  g,
  name,
  now,
  me,
  players = [],
}: {
  g: any;
  name: (id: string) => string;
  now: number;
  me?: string;
  players?: any[];
}) {
  const r = g.reveal ?? {};
  const itemCount = r.items?.length ?? 0;
  const dealerCount = r.dealer?.length ?? 0;
  const casino=casinoPresentation(g,now),dealerStart=casino.start,visible=casino.visible,dealerDone=casino.ready;
  const heard = useRef("");
  const resultRoot=useRef<HTMLElement>(null);
  const step =
    g.id === "budget"
      ? Math.min(
          itemCount,
          Math.max(
            0,
            Math.floor(
              (now - (g.revealStartedAt ?? g.deadline - 19000)) / 1100,
            ),
          ),
        )
      : 0;
  useEffect(() => {
    if (g.id === "budget" && step > 0) sound.play("price");
  }, [step, g.id]);
  const full =
    g.id === "blackjack" ? dealerDone : g.id !== "budget" || step >= itemCount;
  useEffect(() => {
    const cue = `${g.id}:${g.round}:${g.id === "blackjack" ? visible : step}:${full}`;
    if (heard.current === cue) return;
    const initial=heard.current==='';
    heard.current = cue;
    if (g.id === "blackjack") {
      if(initial&&now-dealerStart>200)return;
      if (!full) sound.play(visible > 1 ? "dealer" : "suspense");
      else {
        const own = r.players?.find((p: any) => p.id === me);
        if(r.players?.some((p:any)=>p.payout>0))sound.play('casinoPayout');
        if(own)sound.play(
          own?.payout > own?.bet
              ? "win"
              : own?.payout < own?.bet
                ? "loss"
                : "stand",
        );
      }
    } else if (g.id === "budget" && full) {
      const own = r.players?.find((p: any) => p.id === me);
      sound.play(own?.over ? "loss" : "coins");
    }
  }, [g.id, g.round, visible, step, full, me, r.dealerValue]);
  useEffect(() => {
    if (g.id !== "blackjack" || full) return;
    const beat = setInterval(() => sound.play("suspense"), 1100);
    return () => clearInterval(beat);
  }, [g.id, full]);
  const knownItems = (r.items ?? []).slice(0, step);
  if (g.id === "code") return <CodeReveal g={g} players={players} me={me} />;
  if (["auction", "timing", "bomb"].includes(g.id))
    return <TrioReveal g={g} players={players} me={me} now={now} />;
  const currentItem = knownItems.at(-1);
  const metric = (p: any) =>
    g.id === "blackjack"
      ? (p.payout ?? 0) - (p.bet ?? 0)
      : g.id === "fleet"
        ? (g.scores[p.id] ?? 0)
        : g.id === "cards"
          ? p.id === r.winner
            ? 100000
            : -(p.penalty ?? 0)
          : g.id === "wiki"
            ? p.arrival !== null && p.arrival !== undefined
              ? 1e9 - p.arrival
              : -1
            : (p.score ?? p.points ?? p.total ?? 0);
  const rows = [...(r.players ?? [])].sort((a, b) => metric(b) - metric(a));
  const displayRows = full ? rows : (r.players ?? []);
  const titles: Record<string, string> = {
    chain: `${name(r.winner)} hält die Kette am längsten!`,
    categories: `Buchstabe ${r.letter} · Das Urteil eurer Crew`,
    geo: r.place?.name ?? "Hier wart ihr!",
    blocks: r.winner
      ? `${name(r.winner)} bleibt stehen!`
      : "Das Block-Duell ist entschieden.",
    typer: "Zielfoto! So schnell war eure Crew.",
    herd: r.tied ? "Die Crew ist sich uneinig." : "So denkt eure Crew!",
    spectrum: r.missingClue
      ? "Diesmal fehlte der Hinweis."
      : "Eure eigenen Zeiger – wer liegt am nächsten?",
    picture: r.answer ?? "Erkannt!",
    size: r.item?.name ?? "Das richtige Maß",
    color: "Wie nah wart ihr dran?",
    budget: full ? "Hat das Budget gereicht?" : "Jetzt fallen die Preise.",
    blackjack: "Der Dealer deckt auf.",
    cards: r.winner
      ? `${name(r.winner)} hat die Hand geleert!`
      : "Die Resthand entscheidet.",
    dice: "Eure Wertungsblätter sind voll.",
    fleet: "Die Beute ist verteilt.",
    wiki: "Eure Wege zum Ziel.",
  };
  return (
    <section ref={resultRoot} className={`round-reveal round-cinema cinema-${g.id}`}>
      {full && <Particles seed={`${g.id}:${g.round}:reveal`} burst />}
      <span className="eyebrow">RUNDE {g.round} · DIE AUFLÖSUNG</span>
      <h2>{titles[g.id]}</h2>
      {full&&g.id!=='dice'&&rows.length>3&&rows.some(row=>row.id===me)&&<button type="button" className="party-result-jump" onClick={()=>{const own=resultRoot.current?.querySelector<HTMLElement>('.round-player-result.self');if(own){own.scrollIntoView({block:'nearest',behavior:'instant'});own.tabIndex=-1;own.focus({preventScroll:true});}}}>Dein Ergebnis ansehen</button>}
      {g.id === "chain" && (
        <p className="chain-final-topic">
          {r.topic?.name} · {r.topic?.hint}
        </p>
      )}
      {g.id === "categories" && <CategoriesResults g={g} room={{ players }} />}
      {g.id === "dice" && <DiceResults game={g} players={players} me={me}/>}
      {g.id === "geo" && r.place && (
        <div className="geo-reveal">
          <GeoResultsMap game={g} players={players} name={name}/>
          <p>„Gesuchter Ort“ = Ziel · Farbige Pins = eure Tipps</p>
          <a href={r.place.source} target="_blank" rel="noreferrer">
            Originalfoto & Aufnahmeort ↗
          </a>
        </div>
      )}
      {g.id === "herd" && (
        <div className="herd-groups">
          {(r.groups ?? []).map((group: any, i: number) => (
            <div
              key={i}
              style={{ animationDelay: `${i * 220}ms` }}
              className={i === 0 && !r.tied ? "majority" : ""}
            >
              <strong>„{group.answer}“</strong>
              <span>{group.ids.map(name).join(" · ")}</span>
              <b>
                {group.ids.length}{" "}
                {group.ids.length === 1 ? "Stimme" : "Stimmen"}
                {i === 0 && !r.tied ? " · je +100" : ""}
              </b>
            </div>
          ))}
        </div>
      )}
      {g.id === "spectrum" && (
        <div className="spectrum-reveal">
          <h3>„{g.clue || "Kein Hinweis"}“</h3>
          {g.axis.context && (
            <p className="spectrum-context">
              Thema: <strong>{g.axis.context}</strong>
            </p>
          )}
          <div className="spectrum-scale">
            <span>{g.axis.left}</span>
            <span>{g.axis.right}</span>
            <div className="spectrum-ruler">
              <i className="spectrum-target" style={{ left: `${r.target}%` }}>
                <b>ZIEL</b>
              </i>
              {(r.players ?? [])
                .filter((p: any) => p.guess !== null && !p.psychic)
                .map((p: any) => (
                  <i
                    key={p.id}
                    className="spectrum-needle individual-needle"
                    style={{
                      left: `${p.guess}%`,
                      background: players.find((x) => x.id === p.id)?.color,
                    }}
                    title={`${name(p.id)}: ${p.guess}`}
                  />
                ))}
            </div>
          </div>
          <p>
            Ziel: {r.target} · Jede Farbe gehört zu einem eigenen Tipp.
            Hinweisrunden zählen nicht zum persönlichen Schnitt.
          </p>
        </div>
      )}
      <p className="reveal-countdown">
        Nächste Phase in{" "}
        <strong>{Math.max(0, Math.ceil((g.deadline - now) / 1000))} s</strong>
      </p>
      {g.id === "picture" &&
        (g.image?.startsWith("/") ? (
          <figure className="revealed-photo">
            <img src={g.image} alt={r.answer ?? "Aufgelöstes Motiv"} />
            {r.photoCredit && (
              <figcaption>
                Foto: {r.photoCredit.author} ·{" "}
                <a
                  href={r.photoCredit.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.photoCredit.license}
                </a>{" "}
                ·{" "}
                <a href={r.photoCredit.source} target="_blank" rel="noreferrer">
                  Original & Quelle
                </a>
                {
                  " · Verkleinert, als WebP gespeichert und im Rätsel verpixelt. "
                }
                <a
                  href="/pixel-photos/credits.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Alle Bildnachweise
                </a>
              </figcaption>
            )}
          </figure>
        ) : (
          <div
            className="revealed-image"
            dangerouslySetInnerHTML={{ __html: g.image }}
          />
        ))}
      {g.id === "color" && (
        <div
          className="target-color-reveal"
          style={{ background: color(r.target) }}
        >
          <span>Das war die gesuchte Farbe</span>
          <strong>Jetzt vergleichen</strong>
        </div>
      )}
      {g.id === "size" && r.item && (
        <div className="actual-size-reveal">
          <span className="actual-size-art">
            <SizeSilhouette
              name={r.item.name}
              measure={r.item.measure}
              kind={r.item.kind}
            />
          </span>
          <div>
            <small>{r.item.measure}</small>
            <strong>{formatLength(r.item.cm)}</strong>
            <a href={r.item.source} target="_blank" rel="noreferrer">
              Referenzquelle ↗
            </a>
          </div>
        </div>
      )}
      {g.id === "blackjack" && (
        <div
          className={`dealer-reveal ${full ? "dealer-finished" : "dealer-suspense"}`}
          aria-live="polite"
        >
          <strong key={visible}>
            Dealer: {handValue((r.dealer ?? []).slice(0, visible))}
            {full && r.dealerValue > 21
              ? " · überkauft!"
              : full && r.dealerValue === 21
                ? " · 21!"
                : ""}
          </strong>
          <div className="card-hand">
            {r.dealer?.slice(0, visible).map((c: any, i: number) => (
              <span
                key={i}
                className="dealer-card-flip"
                style={{ "--deal-index": 0 } as any}
              >
                <PlayingCard card={c} disabled />
              </span>
            ))}
            {!full && visible < dealerCount && (
              <span
                className="dealer-hidden-card"
                aria-label="Nächste Karte verdeckt"
              >
                ✦
              </span>
            )}
          </div>
          <p>
            {full
              ? "Auszahlung enthält deinen Einsatz. Gewinn = Auszahlung minus Einsatz."
              : visible === 1
                ? "Die verdeckte Karte … gleich wissen wir mehr."
                : visible < dealerCount
                  ? "Unter 17: Der Dealer muss noch ziehen …"
                  : "Der Dealer steht. Jetzt entscheidet sich eure Hand …"}
          </p>
        </div>
      )}
      {g.id === "budget" && (
        <>
          <div className="price-stage" aria-live="polite">
            {currentItem ? (
              <div key={currentItem.id} className="price-spotlight">
                <img src={currentItem.image} alt="" />
                <div>
                  <span>
                    PREIS {step} / {itemCount}
                  </span>
                  <strong>{currentItem.name}</strong>
                  <b>{money(currentItem.price)}</b>
                </div>
              </div>
            ) : (
              <div className="price-suspense">
                <span>✦</span>
                <strong>Was steckt in euren Körben?</strong>
              </div>
            )}
          </div>
          <div className="price-count">
            <progress max={itemCount || 1} value={step} />
            <span>
              {step} von {itemCount} Preisen aufgedeckt · Budget{" "}
              {money(g.budget)}
            </span>
          </div>
        </>
      )}
      {g.id === "blackjack" && !full && (
        <div className="dealer-waiting">
          <span className="suspense-orbit">✦</span>
          <strong>Hält deine Hand gegen den Dealer?</strong>
          <p>
            Gewinne und Auszahlungen werden nach der letzten Karte aufgedeckt.
          </p>
        </div>
      )}
      <div className="round-player-results">
        {(g.id === "dice" || g.id === "blackjack" && !full ? [] : displayRows).map(
          (p: any, i: number) => {
            const profile = players.find((x: any) => x.id === p.id);
            const rank = rows.findIndex((x) => metric(x) === metric(p)) + 1;
            const known = knownItems.filter((x: any) =>
              p.items?.includes(x.id),
            );
            const subtotal = known.reduce(
              (s: number, x: any) => s + x.price,
              0,
            );
            const over = subtotal > g.budget;
            return (
              <article
                key={p.id}
                className={`round-player-result ${p.id === me ? "self" : ""} ${full && rank === 1 && metric(p) > 0 ? "round-best" : ""}`}
                style={
                  {
                    "--row": i,
                    "--player-color": profile?.color ?? "#bcff5c",
                  } as any
                }
              >
                <header>
                  <span className="round-rank">{full ? `${rank}.` : "?"}</span>
                  <Avatar
                    avatar={profile?.avatar ?? 0}
                    look={profile?.look}
                    color={profile?.color}
                  />
                  <strong>
                    {name(p.id)}
                    {p.id === me ? " · du" : ""}
                  </strong>
                  <b>
                    {g.id === "budget" ? (
                      full ? (
                        p.over ? (
                          "0 Punkte"
                        ) : (
                          `${p.count ?? 0} Produkte`
                        )
                      ) : (
                        "•••"
                      )
                    ) : g.id === "blackjack" ? (
                      `${metric(p) > 0 ? "+" : ""}${decimal(metric(p))} Chips`
                    ) : g.id === "wiki" ? (
                      p.arrival !== null && p.arrival !== undefined ? (
                        `${(p.arrival / 1000).toFixed(1)} s`
                      ) : (
                        "Nicht im Ziel"
                      )
                    ) : g.id === "cards" ? (
                      `${p.penalty} Restpunkte`
                    ) : (
                      <>
                        <AnimatedNumber
                          value={
                            g.id === "fleet" ? (g.scores[p.id] ?? 0) : metric(p)
                          }
                          delay={i * 90}
                        />{" "}
                        {g.id === "fleet" ? "Beute" : "Punkte"}
                      </>
                    )}
                  </b>
                </header>
                {g.id === "geo" && (
                  <p>
                    {p.distance === null
                      ? "Kein Tipp abgegeben"
                      : `${p.distance < 1 ? "Unter 1" : Math.round(p.distance).toLocaleString("de-DE")} km vom Ziel entfernt`}
                  </p>
                )}
                {g.id === "blocks" && (
                  <p>
                    Platz {p.place} · {p.lines} Reihen abgebaut · {p.sent}{" "}
                    Strafreihen gesendet
                  </p>
                )}
                {g.id === "typer" && (
                  <p>
                    {p.finished
                      ? `Ziel in ${p.seconds} s`
                      : `${p.progress} / ${p.length} Zeichen`}{" "}
                    · {p.wpm} WPM · {p.accuracy}% Genauigkeit
                  </p>
                )}
                {g.id === "herd" && (
                  <p>{p.answer ? `„${p.answer}“` : "Keine Antwort"}</p>
                )}
                {g.id === "chain" && (
                  <p>
                    Platz {p.place} · {p.words} gültige Begriffe
                    <br />
                    {p.reason ?? "Bis zum Schluss dabei"}
                  </p>
                )}
                {g.id === "spectrum" && (
                  <p>
                    {p.psychic
                      ? "Hinweisgeber · ohne Wertung"
                      : p.guess === null
                        ? "Kein Tipp"
                        : `Tipp ${p.guess} · Abstand ${p.distance}`}
                    <br />Ø{" "}
                    {(p.average ?? 0).toLocaleString("de-DE", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    Punkte
                  </p>
                )}
                {g.id === "budget" && (
                  <div className={`basket-result ${over ? "over-budget" : ""}`}>
                    <div className="basket-tally">
                      <strong key={subtotal}>{money(subtotal)}</strong>
                      <span>
                        {over
                          ? "Budget überschritten!"
                          : full
                            ? `Noch ${money(g.budget - subtotal)} Luft`
                            : `${known.length} / ${p.count ?? 0} Produkte aufgedeckt`}
                      </span>
                    </div>
                    <div className="budget-meter">
                      <i
                        style={{
                          width: `${Math.min(100, (subtotal / g.budget) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="basket-reveal-items">
                      {(r.items ?? [])
                        .filter((x: any) => p.items?.includes(x.id))
                        .map((x: any) => (
                          <span
                            key={x.id}
                            className={
                              knownItems.some((k: any) => k.id === x.id)
                                ? "revealed"
                                : ""
                            }
                            title={x.name}
                          >
                            <img src={x.image} alt={x.name} />
                            <small>
                              {knownItems.some((k: any) => k.id === x.id)
                                ? money(x.price)
                                : "?"}
                            </small>
                          </span>
                        ))}
                    </div>
                    {!p.count && <small>Kein Warenkorb abgegeben</small>}
                  </div>
                )}
                {g.id === "picture" && (
                  <p>
                    {p.correct
                      ? `✓ „${p.answer}“ richtig erkannt`
                      : p.answer
                        ? `„${p.answer}“ war leider nicht richtig`
                        : "Keine Antwort abgegeben"}
                  </p>
                )}
                {g.id === "color" && (
                  <div className="color-result-pair">
                    <div style={{ background: color(p.estimate) }}>
                      <span>
                        {p.id === me ? "Deine Mischung" : "Schätzung"}
                      </span>
                    </div>
                    <b>→</b>
                    <div style={{ background: color(r.target) }}>
                      <span>Gesuchte Farbe</span>
                    </div>
                    <small>
                      {p.estimate
                        ? `Farbabweichung ${decimal(p.error)} · kleiner ist besser`
                        : "Keine Farbe abgegeben"}
                    </small>
                  </div>
                )}
                {g.id === "size" && (
                  <div className="size-result-detail">
                    <span>
                      {p.estimate
                        ? formatLength(p.estimate)
                        : "Keine Schätzung"}
                    </span>
                    <strong>
                      {p.estimate
                        ? `${decimal(p.estimate / r.item.cm)}× so groß wie das Original`
                        : "—"}
                    </strong>
                    <div className="size-comparison-track">
                      <i
                        style={{
                          width: `${Math.min(100, (50 * (p.estimate ?? 0)) / r.item.cm)}%`,
                        }}
                      />
                      <b />
                    </div>
                    <small>
                      Mittellinie = richtiges Maß ·{" "}
                      {p.estimate
                        ? Math.abs(p.estimate - r.item.cm) < r.item.cm * 0.01
                          ? "Fast auf den Punkt!"
                          : p.estimate > r.item.cm
                            ? "Zu groß geschätzt"
                            : "Zu klein geschätzt"
                        : "0 Punkte"}
                    </small>
                  </div>
                )}
                {g.id === "blackjack" && (
                  <>
                    <div className="result-hand">
                      {p.hand?.map((c: any, k: number) => (
                        <span key={k}>
                          {
                            [
                              "A",
                              "2",
                              "3",
                              "4",
                              "5",
                              "6",
                              "7",
                              "8",
                              "9",
                              "10",
                              "J",
                              "Q",
                              "K",
                            ][c.rank - 1]
                          }
                          {["♠", "♥", "♦", "♣"][c.suit]}
                        </span>
                      ))}
                    </div>
                    <p>
                      {!p.bet
                        ? "Kein Einsatz"
                        : p.value > 21
                          ? `${p.value} · überkauft`
                          : p.payout === p.bet
                            ? `${p.value} · Gleichstand, Einsatz zurück`
                            : `Handwert ${p.value} · ${p.bet} Einsatz → ${p.payout} Auszahlung`}{" "}
                      · insgesamt {p.chips} Chips
                    </p>
                  </>
                )}
                {g.id === "cards" && (
                  <>
                    <div className="result-hand color-rest-hand">
                      {p.hand?.map((c: any, k: number) => (
                        <span
                          key={k}
                          style={{
                            background: [
                              "#ff7b9d",
                              "#56d9ff",
                              "#bcff5c",
                              "#ffb85c",
                              "#9b8aff",
                            ][c.color],
                          }}
                        >
                          {c.value < 10
                            ? c.value
                            : ["⊘", "⇄", "+2", "✦", "+4"][c.value - 10]}
                        </span>
                      ))}
                    </div>
                    <p>
                      {p.id === r.winner
                        ? "✓ Keine Karte übrig – Runde gewonnen!"
                        : "Weniger Restpunkte sind besser. Aktionen zählen 20, Joker 50."}
                    </p>
                  </>
                )}
                {g.id === "dice" && (
                  <p>
                    {p.sheet?.filter((v: any) => v !== null).length ?? 13}{" "}
                    Kategorien eingetragen · Bonus{" "}
                    {p.bonus ??
                      (p.sheet
                        ?.slice(0, 6)
                        .reduce((s: number, v: number) => s + (v ?? 0), 0) >= 63
                        ? 35
                        : 0)}
                  </p>
                )}
                {g.id === "fleet" && (
                  <p>
                    Letzte Salve:{" "}
                    {p.missed ? "kein Schuss" : `${p.hits} Treffer`} ·{" "}
                    {p.sunk ?? 0} versenkt · +{decimal(p.loot)} Beute
                  </p>
                )}
                {g.id === "wiki" && (
                  <>
                    <p>
                      {p.clicks} Klicks{" "}
                      {p.arrival !== null && p.arrival !== undefined
                        ? "· Ziel erreicht!"
                        : "· Diese Runde: 0 Punkte; frühere Erfolge bleiben erhalten"}
                      {p.arrival !== null &&
                        p.arrival !== undefined &&
                        ` · +${p.score ?? 0} Spielpunkte`}
                    </p>
                    <div className="wiki-result-path">
                      {p.path?.map((title: string, k: number) => (
                        <span key={k}>
                          {k > 0 && <b>→</b>}
                          {title}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </article>
            );
          },
        )}
      </div>
      {g.id === "budget" && full && (
        <details className="all-prices">
          <summary>Alle Preise & Quellen</summary>
          <div className="price-reveal">
            {r.items?.map((x: any) => (
              <div key={x.id}>
                <span>{x.name}</span>
                <strong>{money(x.price)}</strong>
                <a href={x.source} target="_blank" rel="noreferrer">
                  Quelle ↗
                </a>
              </div>
            ))}
          </div>
        </details>
      )}
      <p className="round-note">
        {g.id === "categories"
          ? "Eure Crew hat entschieden. Gleiche gültige Antworten geben jedem 5 Punkte; die Rundensummen zählen zur Disziplinwertung."
          : g.id === "spectrum"
            ? "Dein persönlicher Punkteschnitt entscheidet. Hinweisgeberrunden zählen für dich nicht; verpasste eigene Tipps zählen 0."
            : g.id === "chain"
              ? "Je länger ihr in der Runde bleibt, desto mehr Punkte gibt es. Eure Rundenpunkte werden zur Disziplinwertung addiert."
              : full
                ? "Das sind eure Rundenergebnisse. Nach der Disziplin entscheidet die Gesamtsumme über eure Olympiadenpunkte."
                : g.id === "blackjack"
                  ? "Der Dealer zieht bis mindestens 17. Asse zählen als 1 oder 11."
                  : "Die Summen wachsen mit jedem aufgedeckten Preis. Bleibt euer Korb im Budget?"}
      </p>
    </section>
  );
}
