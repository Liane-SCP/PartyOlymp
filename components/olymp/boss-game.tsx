"use client";
import {flushSync} from "react-dom";
import {useDeadlineInput} from "./deadline-input";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Shield,
  Swords,
  Crosshair,
  Coins,
  Check,
  LockKeyhole,
  RotateCcw,
  Flame,
  Volume2,
} from "lucide-react";
import { sound } from "@/lib/audio";
import {krakenFireAt} from '@/lib/kraken-salvo';
import {dragonShot} from '@/lib/dragon-salvo';
import {dragonChoices,dragonEstimate,dragonOwnDraft,dragonDraftKey,isDragonRisk,type DragonRisk} from '@/lib/dragon-altar';
import {
  bossPhaseNames,
  colossusScore,
  krakenGauge,
  type BossId,
} from "@/lib/game/boss-rules";
import { Avatar, GameIcon } from "./art";
import { BossDie } from "./boss-die";
import { BossScene } from "./boss-scene";
import { BossFrameClock } from "@/lib/boss-performance";

const stories = {
  colossus: {
    title: "Der Würfelkoloss",
    realm: "DER RUNENTEMPEL",
    call: "Erweckt den Wächter.",
    intro: "Fünf Würfel. Drei Würfe. Ein gewaltiger Einschlag.",
    ready: "Runen geladen",
    verb: "Runenschlag",
    victory: "Der letzte Stein fällt.",
    loss: "Der Wächter hält stand.",
    instruction:
      "Würfle, halte passende Würfel und lade deinen Angriff. Die angezeigte Schwäche gibt Bonuspunkte.",
  },
  kraken: {
    title: "Krakensturm",
    realm: "DAS STURMMEER",
    call: "Alle Mann an die Kanonen.",
    intro: "Halten. Zielen. Loslassen. Gemeinsam die Welle brechen.",
    ready: "Kanone bereit",
    verb: "Kanonensalve",
    victory: "Die See gehört euch.",
    loss: "Die Crew entkommt dem Sturm.",
    instruction:
      "Halte den Auslöser und lass los, wenn der Zeiger mitten im leuchtenden Zielbereich steht.",
  },
  dragon: {
    title: "Der Münzdrache",
    realm: "DIE GOLDENE KAMMER",
    call: "Der Hort erwacht.",
    intro: "Schätze den Preis. Wähle dein Risiko. Lass Gold regnen.",
    ready: "Schatz versiegelt",
    verb: "Münzsalve",
    victory: "Der Schatz ist euer.",
    loss: "Der Drache behält seinen Hort.",
    instruction:
      "Schätze den Artikelpreis in Euro. Wähle dein Risiko und versiegle deinen Tipp bis zur gemeinsamen Enthüllung.",
  },
};
const euro = (cents: number) =>
  (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const number = (value: number) => Math.round(value).toLocaleString("de-DE");
const productCategories: Record<string, string> = {
  beauty: "Beauty & Pflege",
  "ce-de": "Technik",
  computers: "Computer & Zubehör",
  diy: "Werkzeug & Heimwerken",
  garden: "Garten",
  grocery: "Lebensmittel",
  kitchen: "Küche & Haushalt",
  officeproduct: "Büro",
  "pet-supplies": "Haustierbedarf",
  sports: "Sport & Freizeit",
  toys: "Spielzeug",
};
const priceDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date ?? "")
    ? date.split("-").reverse().join(".")
    : date;

export function BossGame({
  room,
  me,
  now,
  act,
}: {
  room: any;
  me: string;
  now: number;
  act: (a: any) => void | Promise<boolean>;
}) {
  const g = room.game,
    kind = g.id as BossId,
    story = stories[kind],
    boss = g.boss;
  const revealing = g.stage === "roundReveal" || g.stage === "done";
  const elapsed = revealing ? Math.max(0, now - g.revealStartedAt) : 0;
  const players = room.players.filter((p: any) =>
    room.participantIds.includes(p.id),
  );
  const [worldView,setWorldView]=useState(false);
  const [stationFocus,setStationFocus]=useState(false);
  const [crewOverview,setCrewOverview]=useState(false);
  const [selectedDice,setSelectedDice]=useState<boolean[]|undefined>();
  const [selectedDragon,setSelectedDragon]=useState<{owner:string;round:number;risk:DragonRisk;guess?:number}>();
  useEffect(()=>setWorldView(false),[kind]);
  const [pending, setPending] = useState("");
  const [actionError,setActionError]=useState("");
  const inFlight=useRef(new Map<string,{token:number;rolls:number;startedAt:number|null}>());
  const battleRoot=useRef<HTMLElement>(null);
  const pendingRequest = useRef(0);
  const seenCues = useRef(new Set<string>());
  const canPlay = !!g.mine && !g.mine.abandoned;
  const active =
    canPlay && g.stage === "answer" && !g.mine.submitted && now < g.deadline;
  const ownDragonDraft=kind==='dragon'?dragonOwnDraft(room):undefined;
  const dragonPreview=kind==='dragon'?(selectedDragon?.owner===me&&selectedDragon.round===g.round&&g.stage==='answer'&&!g.mine?.submitted?selectedDragon:{risk:ownDragonDraft!.risk,guess:dragonEstimate(ownDragonDraft!.price)}):undefined;
  useEffect(() => {
    pendingRequest.current++;
    inFlight.current.clear();
    setPending("");
    setActionError("");
  }, [g.round, g.stage]);
  useEffect(()=>{
    let confirmed=false;
    for(const [type,request] of inFlight.current){
      const resolved = g.mine?.submitted ||
        (type==='roll' && (g.mine?.rolls??0)>request.rolls) ||
        (type==='start' && g.mine?.chargingStartedAt!=null && g.mine.chargingStartedAt!==request.startedAt);
      if(resolved){inFlight.current.delete(type);confirmed=true;}
    }
    if(confirmed){setPending([...inFlight.current.keys()].at(-1)??'');setActionError('');}
  },[g.mine?.submitted,g.mine?.rolls,g.mine?.chargingStartedAt]);
  useEffect(
    () => () => {
      pendingRequest.current++;
      inFlight.current.clear();
      sound.boss(null);
    },
    [],
  );
  useEffect(() => {
    sound.boss(kind, boss.phase, g.stage);
  }, [kind, boss.phase, g.stage]);
  const cue = (name: string, key: string, strength = 1) => {
    const id = `${kind}:${g.round}:${key}`;
    if (seenCues.current.has(id)) return;
    seenCues.current.add(id);
    sound.bossCue(kind, name, strength);
  };
  useEffect(() => {
    if (g.stage === "intro") cue("intro", "intro");
    if (!revealing) return;
    // A returning tab never replays every impact it missed.
    const at = (time: number, name: string, key = name, strength = 1) => {
      if (elapsed >= time) {
        if (elapsed - time < 650) cue(name, key, strength);
        else seenCues.current.add(`${kind}:${g.round}:${key}`);
      }
    };
    if (kind === "dragon") {
      at(1800, "suspense");
      at(2800, "price");
    }
    if(kind==='dragon')(g.reveal?.outcomes??[]).forEach((o:any,i:number,all:any[])=>{const shot=dragonShot(o,i,all.length);if(shot.earned)at(shot.fireAt*1000,'coin',`coins:${o.id}`,Math.min(.65,1.3/Math.sqrt(all.length)));});
    else if(kind!=='kraken')at(3800, "fire");
    else (g.reveal?.outcomes??[]).forEach((o:any,i:number,all:any[])=>{if(o.submitted)at(krakenFireAt(i,all.length)*1000,'fire',`fire:${o.id}`,Math.min(.7,1.4/Math.sqrt(all.length)));});
    if (
      kind === "kraken" &&
      (g.reveal?.outcomes ?? []).filter((o: any) => o.accuracy >= 0.95)
        .length >= 2
    )
      at(4200, "perfect");
    (g.reveal?.outcomes ?? []).forEach((o: any, i: number, all: any[]) => {
      if(kind==='kraken'&&!o.submitted)return;
      if(kind==='dragon'&&!dragonShot(o,i,all.length).earned)return;
      at(
        4200 + (2700 * i) / Math.max(1, all.length - 1),
        kind==='kraken'&&!(o.score>0)?'splash':"impact",
        `impact:${o.id}`,
        Math.min(1.5, 0.4 + o.score / 1000),
      );
    });
    if (g.reveal?.phaseBroken) at(8000, "break");
    if (g.reveal?.victory) at(9500, "victory");
    else if (g.reveal?.finalAttack) at(9500, "retreat");
  }, [g.stage, g.round, elapsed, kind]);
  const send = async (a: any) => {
    if(!active)return false;
    // Releasing the cannon must not wait for the start acknowledgement.
    const releaseWhileStarting = kind==='kraken' && a.type==='fire' &&
      [...inFlight.current.keys()].every(type=>type==='start');
    if(inFlight.current.size && !releaseWhileStarting)return false;
    const request = ++pendingRequest.current;
    inFlight.current.set(a.type,{token:request,rolls:g.mine?.rolls??0,startedAt:g.mine?.chargingStartedAt??null});
    setPending(a.type);
    setActionError("");
    const currentRequest=()=>inFlight.current.get(a.type)?.token===request && pendingRequest.current===request;
    try {
      const accepted=await act({ ...a, round: g.round });
      if(accepted===false && currentRequest())setActionError(a.type==='fire'
        ? 'Dein Schuss wurde noch nicht bestätigt. Deine lokale Messung bleibt erhalten.'
        : 'Die Aktion wurde noch nicht bestätigt. Deine Auswahl bleibt erhalten. Bitte versuche es erneut.');
      return accepted!==false;
    } catch(cause) {
      if(currentRequest())setActionError(cause instanceof Error?cause.message:'Die Aktion konnte nicht übertragen werden. Deine Auswahl bleibt erhalten.');
      return false;
    } finally {
      if(inFlight.current.get(a.type)?.token===request){inFlight.current.delete(a.type);setPending([...inFlight.current.keys()].at(-1)??'');}
    }
  };
  const outcomes: any[] = g.reveal?.outcomes ?? [];
  const revealed = revealing
    ? outcomes.filter(
        (_, i) =>
          elapsed >= 4200 + (2700 * i) / Math.max(1, outcomes.length - 1),
      )
    : [];
  const contribution = outcomes.reduce((sum, o) => sum + o.damage, 0);
  const shownHp = revealing
    ? Math.max(
        g.reveal.hpAfter,
        g.reveal.hpBefore -
          g.reveal.totalDamage *
            (contribution
              ? revealed.reduce((sum, o) => sum + o.damage, 0) / contribution
              : elapsed >= 7000
                ? 1
                : 0),
      )
    : boss.hp;
  const finale =
    revealing &&
    elapsed >= 9500 &&
    (g.reveal?.victory || g.reveal?.finalAttack);
  const readyCount = (g.roster ?? []).filter((p: any) => p.submitted).length;
  return (
    <section
      ref={battleRoot}
      className={`boss-game boss-${kind} boss-stage-${g.stage}${kind==='kraken'&&crewOverview?" boss-ship-view":""}${kind==='dragon'&&crewOverview?" boss-hort-view":""}${kind==='colossus'&&crewOverview?" boss-temple-view":""}${worldView?" boss-world-view":""}${worldView&&stationFocus&&g.stage==='answer'?" boss-station-view":""}`}
      aria-label={story.title}
    >
      <div className="boss-battle-layout">
        <div className={`boss-arena ${finale ? "boss-finale" : ""}`}>
          <BossScene
            kind={kind}
            phase={boss.phase}
            stage={g.stage}
            startedAt={revealing ? g.revealStartedAt : g.introStartedAt}
            now={now}
            reveal={g.reveal}
            players={players}
            emotes={(room.emotes ?? []).filter(
              (e: any) => !sound.settings.mutedPlayers.includes(e.player),
            )}
            me={me}
            submitted={g.submitted}
            mineDice={kind==="colossus"&&g.mine?{dice:g.mine.dice,held:selectedDice??g.mine.held,rolls:g.mine.rolls,rollId:g.mine.rollId,rollStartedAt:g.mine.rollStartedAt}:undefined}
            mineDragon={dragonPreview?{risk:dragonPreview.risk,guess:dragonPreview.guess,sealed:!!g.mine?.submitted||revealing}:undefined}
            stationFocus={worldView&&stationFocus&&canPlay}
            crewOverview={crewOverview}
            product={kind==="dragon"?g.product:undefined}
            active={active}
            onInteraction={action=>{
              const root=battleRoot.current;if(!root)return;
              if(action==="cannonStart"||action==="cannonFire"){root.querySelector('.boss-kraken-control')?.dispatchEvent(new CustomEvent('olymp-cannon',{detail:{action:action==="cannonStart"?'start':'fire'}}));return;}
              if(action==="price"){flushSync(()=>{setWorldView(true);setStationFocus(true);});const input=root.querySelector<HTMLInputElement>('.boss-price-input input');input?.focus({preventScroll:true});return;}
              if(action.startsWith('risk:')){const risk=action.slice(5);if(isDragonRisk(risk)){flushSync(()=>{setWorldView(true);setStationFocus(true);});root.querySelector('.boss-dragon-control')?.dispatchEvent(new CustomEvent('olymp-dragon-risk',{detail:risk}));}return;}
              if(action==='estimate'){root.querySelector<HTMLButtonElement>('.boss-dragon-control .boss-primary')?.click();return;}
              if(/^hold[0-4]$/.test(action)){const button=root.querySelectorAll<HTMLButtonElement>('.boss-dice-tray > button')[Number(action.slice(4))];if(button&&!button.disabled)button.click();return;}
              const button=root.querySelector<HTMLButtonElement>(action==="roll"?'.boss-action-pair .boss-secondary':'.boss-action-pair .boss-primary');if(button&&!button.disabled)button.click();
            }}
            reducedMotion={sound.settings.motion}
            intense={sound.settings.intense}
          />
          <div className="boss-arena-shade" />
          <header className="boss-health-panel">
            <div>
              <span className="boss-realm">{story.realm}</span>
              <h2>{story.title}</h2>
            </div>
            <span className="boss-health-number">
              <Shield size={13} />
              {number(shownHp)} <small>/ {number(boss.maxHp)}</small>
            </span>
            <div
              className="boss-health-track"
              role="progressbar"
              aria-label="Verbleibende Boss-Rüstung"
              aria-valuemin={0}
              aria-valuemax={boss.maxHp}
              aria-valuenow={Math.round(shownHp)}
            >
              <i style={{ width: `${(100 * shownHp) / boss.maxHp}%` }} />
              <b />
              <b />
            </div>
            <div className="boss-phase-labels">
              {bossPhaseNames[kind].map((name, i) => (
                <span
                  key={name}
                  title={name}
                  className={
                    i === boss.phase
                      ? "current"
                      : i < boss.phase
                        ? "broken"
                        : ""
                  }
                >
                  {i < boss.phase ? <Check size={10} /> : <span>{i + 1}</span>}
                  <em>{name}</em>
                </span>
              ))}
            </div>
          </header>
          {g.stage === "intro" && (
            <div className="boss-intro-title" key={`${kind}:${boss.phase}`}>
              <span>
                {boss.phase ? `PHASE ${boss.phase + 1}` : "BOSSKAMPF"}
              </span>
              <h3>
                {boss.phase ? bossPhaseNames[kind][boss.phase] : story.call}
              </h3>
              <p>
                {boss.phase
                  ? "Neue Schwäche. Neue Chance. Macht euch bereit."
                  : story.intro}
              </p>
            </div>
          )}
          {revealing && !finale && (
            <div
              className="boss-cinematic-caption"
              key={`${g.round}:${elapsed >= 8000 ? 2 : elapsed >= 4000 ? 1 : 0}`}
            >
              <span>
                {elapsed < 4000
                  ? "DIE CREW HOLT AUS"
                  : elapsed < 8000
                    ? kind === "kraken" &&
                      outcomes.filter((o) => o.accuracy >= 0.95).length >= 2
                      ? "PERFEKTE CREW-SALVE"
                      : story.verb.toUpperCase()
                    : g.reveal.phaseBroken
                      ? "PHASE DURCHBROCHEN"
                      : "TREFFER BESTÄTIGT"}
              </span>
              <strong>
                {elapsed < 4000
                  ? kind === "dragon"
                    ? elapsed >= 2800
                      ? euro(g.reveal.price)
                      : "Was ist der Schatz wert?"
                    : "Zusammen. Jetzt."
                  : elapsed < 8000
                    ? `${number(g.reveal.totalDamage)} Schaden`
                    : g.reveal.phaseBroken
                      ? bossPhaseNames[kind][boss.phase] + " besiegt"
                      : "Der nächste Angriff wartet."}
              </strong>
            </div>
          )}
          {worldView&&stationFocus&&kind==='dragon'&&g.stage==='answer'&&<div className="dragon-altar-product-heading" title={g.product.name}>{g.product.name}</div>}
          {finale && (
            <div
              className={`boss-victory ${g.reveal.victory && elapsed < 15400 ? "boss-defeating" : ""}`}
            >
              <span>{g.reveal.victory ? "BOSS BESIEGT" : "KAMPF BEENDET"}</span>
              <h3>{g.reveal.victory ? story.victory : story.loss}</h3>
              <p>Eure persönlichen Punkte zählen für die Olympiade.</p>
            </div>
          )}
          {g.stage === "answer" && (
            <div className="boss-arena-footer">
              <span>
                <Swords size={14} /> Angriff {g.round} von höchstens{" "}
                {g.totalRounds}
              </span>
              <span>
                {readyCount}/{players.length} bereit
              </span>
            </div>
          )}
        </div>
        <aside className="boss-command">
          <button className="boss-world-toggle" type="button" aria-expanded={!worldView} aria-controls="boss-control-panel" onClick={()=>setWorldView(value=>!value)}>{worldView?"Spielpult \u00f6ffnen":"Welt ansehen"}</button>
          {worldView&&canPlay&&g.stage==="answer"&&<button className="boss-station-toggle" type="button" aria-pressed={stationFocus} onClick={()=>setStationFocus(value=>!value)}>{stationFocus?"Zur Übersicht":kind==="colossus"?"Dein Runenplatz":kind==="kraken"?"Deine Kanone":"Zum Preisaltar"}</button>}
          {worldView&&kind==='kraken'&&(!stationFocus||g.stage!=='answer')&&<button className="boss-panorama-toggle" type="button" aria-pressed={crewOverview} onClick={()=>setCrewOverview(value=>!value)}>{crewOverview?'Zur Action':'Ganzes Schiff'}</button>}
          {worldView&&kind==='dragon'&&(!stationFocus||g.stage!=='answer')&&<button className="boss-panorama-toggle" type="button" aria-pressed={crewOverview} onClick={()=>setCrewOverview(value=>!value)}>{crewOverview?'Zur Action':'Ganzer Hort'}</button>}
          {worldView&&kind==='colossus'&&(!stationFocus||g.stage!=='answer')&&<button className="boss-panorama-toggle" type="button" aria-pressed={crewOverview} onClick={()=>setCrewOverview(value=>!value)}>{crewOverview?'Zur Action':'Ganzer Tempel'}</button>}
          {worldView&&active&&<p className="boss-world-hint">{kind==="kraken"?"Halte die Kanone vor deiner Figur gedrückt. Loslassen feuert!":kind==="dragon"?"Am Preisaltar gibst du deinen Tipp und dein Risiko ab.":g.mine?.rolls?"Würfel antippen: halten. Goldene Rune: würfeln. Grüne Rune: Angriff.":"Tippe auf die goldene Wurf-Rune vor deiner Figur."}</p>}
          {actionError&&active&&<p className="boss-action-error" role="alert">{actionError}</p>}
          <div id="boss-control-panel" hidden={worldView&&!(kind==="kraken"&&active||kind==='dragon'&&stationFocus&&canPlay&&g.stage==='answer')}>
          {revealing ? (
            <BossVolley
              g={g}
              kind={kind}
              me={me}
              elapsed={elapsed}
              players={players}
            />
          ) : (
            <>
              <div className="boss-command-heading">
                {kind !== "dragon" && <GameIcon id={kind} />}
                <div>
                  <span>DEIN BEITRAG</span>
                  <h3>
                    {kind === "colossus"
                      ? "Lade die Runen"
                      : kind === "kraken"
                        ? "An die Kanone"
                        : "Knack den Schatzpreis"}
                  </h3>
                </div>
              </div>
              <p className="boss-instruction">{story.instruction}</p>
              {!canPlay ? (
                <div className="boss-sealed">
                  <Crosshair />
                  <strong>Du schaust der Crew zu.</strong>
                  <span>
                    Die persönlichen Ergebnisse erscheinen bei jeder Salve.
                  </span>
                </div>
              ) : g.mine.submitted ? (
                <div className="boss-sealed">
                  <LockKeyhole />
                  <strong>{story.ready}</strong>
                  <span>
                    {kind === "dragon"
                      ? `${euro(g.mine.guess ?? 0)} · ${({ safe: "Sicher", bold: "Mutig", risky: "Riskant" } as any)[g.mine.risk] ?? "Ausgesetzt"}`
                      : "Dein Angriff ist gespeichert."}
                  </span>
                  <p>
                    {readyCount}/{players.length} bereit. Die Crew feuert
                    gemeinsam.
                  </p>
                </div>
              ) : kind === "colossus" ? (
                <ColossusControl
                  key={g.round}
                  g={g}
                  active={active}
                  pending={pending}
                  send={send}
                  onSelection={setSelectedDice}
                />
              ) : kind === "kraken" ? (
                <KrakenControl
                  key={g.round}
                  g={g}
                  now={now}
                  active={active}
                  pending={pending}
                  send={send}
                  inWorld={worldView}
                />
              ) : (
                <DragonControl
                  room={room}
                  me={me}
                  onSelection={setSelectedDragon}
                  draftAct={act}
                  key={`${me}:${g.round}`}
                  g={g}
                  active={active}
                  pending={pending}
                  send={send}
                />
              )}
              {g.stage === "intro" && (
                <p className="boss-prepare">
                  <Volume2 size={13} /> Macht euch bereit · gleich geht es los
                </p>
              )}
              <details className="boss-rules">
                <summary>Punktewertung & Bildnachweise</summary>
                <p>
                  {kind === "colossus"
                    ? "Kombination plus Schwächenbonus ergeben deine Angriffspunkte. Du hast höchstens drei Würfe und kannst einzelne Würfel halten. Erst »Angriff laden« legt deinen Wurf fest."
                    : kind === "kraken"
                      ? "Die Mitte des Zielbereichs gibt die meisten Punkte. Präzise Treffer in Folge bringen einen Serienbonus. Der Zeiger wird direkt auf deinem Gerät gemessen. Die Kanone feuert erst mit der ganzen Crew."
                      : "Die Abweichung zählt prozentual: Sicher = Genauigkeit × 1.000; Mutig = Genauigkeit² × 1.250; Riskant = Genauigkeit⁴ × 1.600. Höheres Risiko belohnt sehr genaue Tipps, große Abweichungen kosten mehr Punkte."}
                </p>
                <p>
                  Gemeinsam brecht ihr drei Boss-Phasen in höchstens{" "}
                  {g.totalRounds} Angriffen. Schaden über der verbleibenden
                  Phasenrüstung zählt trotzdem voll für deine persönliche
                  Wertung. Ein nicht abgeschickter Angriff gibt 0 Punkte.
                </p>
                <p className="boss-asset-credits">
                  <strong>3D-Figur:</strong>{" "}
                  {kind === "colossus" ? (
                    <>
                      <a
                        href="https://opengameart.org/content/rock-golem"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Rock Golem
                      </a>{" "}
                      von hendori-sama, umask007 und Dm3d ·{" "}
                      <a
                        href="https://creativecommons.org/licenses/by/3.0/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        CC BY 3.0
                      </a>
                      . Für dieses Spiel konvertiert und angepasst.{" "}
                      <a
                        href="/boss-models/colossus-license.txt"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Bearbeitung & Nachweise
                      </a>
                      .
                    </>
                  ) : kind === "kraken" ? (
                    <>
                      <a
                        href="https://www.blenderkit.com/asset-gallery-detail/85c9bbbe-b4ab-4247-b17d-31be195132a8/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Octopus vulgaris
                      </a>{" "}
                      von Joachim Bornemann ·{" "}
                      <a
                        href="https://creativecommons.org/publicdomain/zero/1.0/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        CC0
                      </a>
                      .{" "}
                      <a
                        href="/boss-models/kraken-license.txt"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Anpassungen & Nachweise
                      </a>
                      . Kanonen: <a href="https://kenney.nl/assets/pirate-kit" target="_blank" rel="noreferrer">Kenney Pirate Kit</a> · CC0. <a href="/adventure-models/props/ship-cannon-source.json" target="_blank" rel="noreferrer">Modellbearbeitung</a>.
                    </>
                  ) : (
                    <>
                      <a
                        href="https://literock-studios.itch.io/ashwing-drake-lite"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ashwing Drake Lite
                      </a>{" "}
                      von Literock Studios ·{" "}
                      <a
                        href="/boss-models/dragon-license.txt"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Nutzungslizenz
                      </a>
                      . Truhen: <a href="https://kenney.nl/assets/pirate-kit" target="_blank" rel="noreferrer">Kenney Pirate Kit</a> · CC0. <a href="/adventure-models/props/treasure-chest-source.json" target="_blank" rel="noreferrer">Modellbearbeitung</a>.
                    </>
                  )}
                  <br />
                  Umgebung:{" "}
                  <a
                    href="https://polyhaven.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Poly Haven
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://creativecommons.org/publicdomain/zero/1.0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CC0
                  </a>{" "}
                  ·{" "}
                  <a
                    href="/boss-environment/license.txt"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Quellen & Künstler
                  </a>
                  .
                </p>
              </details>
            </>
          )}
          </div>
        </aside>
      </div>
      <div className="boss-crew-heading">
        <strong>EURE CREW</strong>
        <span>
          {revealing
            ? "Persönliche Angriffspunkte"
            : "Alle entscheiden gleichzeitig"}
        </span>
      </div>
      <div className="boss-crew">
        {players.map((p: any, index: number) => {
          const state = g.roster?.find((r: any) => r.id === p.id),
            outcome = revealed.find((o) => o.id === p.id);
          return (
            <div
              key={p.id}
              className={`boss-crew-member ${p.id === me ? "self" : ""} ${state?.submitted ? "ready" : ""} ${outcome ? "struck" : ""}`}
              style={
                {
                  "--crew-color": p.color,
                  "--crew-delay": `${index * 60}ms`,
                } as CSSProperties
              }
            >
              <Avatar avatar={p.avatar} color={p.color} look={p.look} />
              <div>
                <strong>
                  {p.name}
                  {p.id === me ? " · du" : ""}
                </strong>
                <span>
                  {outcome
                    ? `+${number(outcome.score)} · ${outcome.label}`
                    : revealing
                      ? "Angriff im Anflug …"
                      : state?.abandoned
                        ? "Nicht verbunden"
                        : state?.submitted
                          ? "✓ " + story.ready
                          : state?.charging
                            ? "Lädt die Kanone …"
                            : kind === "colossus" && state?.rolls
                              ? `${state.rolls}/3 Würfe`
                              : "Bereitet Angriff vor"}
                </span>
              </div>
              <b>
                {number(
                  (g.scores?.[p.id] ?? 0) -
                    (revealing && !outcome
                      ? (outcomes.find((o) => o.id === p.id)?.score ?? 0)
                      : 0),
                )}
                <small>GESAMT</small>
              </b>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ColossusControl({ g, active, pending, send, onSelection }: any) {
  const p = g.mine,
    result = p.rolls ? colossusScore(p.dice, g.weakness) : null;
  const [held, setHeld] = useState<boolean[]>(() => [...p.held]);
  const selection = useRef(held);
  const rolling = pending === "roll";
  useEffect(()=>{onSelection?.(held);},[held,onSelection]);
  return (
    <div className="boss-colossus-control">
      <div className="boss-weakness">
        <Shield size={19} />
        <div>
          <span>AKTUELLE SCHWÄCHE</span>
          <strong>{g.weakness.label}</strong>
          <small>{g.weakness.description}</small>
        </div>
      </div>
      <small>Die Augen auf der Oberseite zählen.</small>
      <div
        className={`boss-dice-tray ${result?.weaknessMatched ? "runes-linked" : ""}`}
      >
        {result?.weaknessMatched && (
          <svg
            className="boss-dice-link"
            viewBox="0 0 100 60"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M10 30 H90" />
            {[10, 30, 50, 70, 90].map((x) => (
              <circle key={x} cx={x} cy="30" r="2" />
            ))}
          </svg>
        )}
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            className={held[i] ? "held" : ""}
            disabled={!active || pending || !p.rolls || p.rolls >= 3}
            aria-pressed={held[i]}
            aria-label={`Würfel ${i + 1}: ${p.rolls ? p.dice[i] : "noch nicht gewürfelt"}, ${held[i] ? "freigeben" : "halten"}`}
            onClick={() => {
              sound.bossCue("colossus", "hold");
              const next = selection.current.map((v, index) =>
                index === i ? !v : v,
              );
              selection.current = next;
              setHeld(next);
            }}
          >
            <BossDie
              value={p.rolls ? p.dice[i] : 0}
              held={held[i]}
              roll={p.rolls ?? 0}
              rolling={rolling && !held[i]}
              index={i}
            />
            <small>{held[i] ? "GEHALTEN" : "HALTEN"}</small>
          </button>
        ))}
      </div>
      <div
        className={`boss-combo-preview ${result?.weaknessMatched ? "matched" : ""}`}
      >
        <span>{result?.label ?? "Dein erster Wurf wartet"}</span>
        <strong>
          {result ? number(result.score) : "—"}
          <small> PUNKTE</small>
        </strong>
        {result?.weaknessMatched && (
          <small>Schwäche getroffen! +{result.weaknessBonus}</small>
        )}
      </div>
      <div className="boss-action-pair">
        <button
          className="boss-secondary"
          disabled={!active || !!pending || p.rolls >= 3 || held.every(Boolean)}
          onClick={() => {
            sound.bossCue("colossus", "roll");
            send({ type: "roll", held: selection.current });
          }}
        >
          <RotateCcw size={15} />
          {rolling
            ? "Würfelt …"
            : p.rolls
              ? `Noch mal (${3 - p.rolls})`
              : "Würfeln"}
        </button>
        <button
          className="boss-primary"
          disabled={!active || pending || !p.rolls}
          onClick={() => send({ type: "strike" })}
        >
          <Swords size={15} />
          {pending === "strike" ? "Angriff wird geladen …" : "Angriff laden"}
        </button>
      </div>
    </div>
  );
}

function KrakenControl({ g, now, active, pending, send, inWorld }: any) {
  const [holding, setHolding] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [shot, setShot] = useState<number | null>(null);
  const started = useRef<number | null>(null),
    button = useRef<HTMLButtonElement>(null),
    band = useRef<HTMLDivElement>(null),
    needle = useRef<HTMLDivElement>(null),
    fireRef = useRef<() => void>(() => {});
  const gauge = krakenGauge(elapsed, g.boss.phase, g.seed);
  const start = () => {
    if (!active || pending || started.current !== null || shot !== null) return;
    sound.init();
    sound.bossCue("kraken", "charge");
    started.current = performance.now();
    setElapsed(0);
    setHolding(true);
    send({ type: "start" });
  };
  const fire = () => {
    if (started.current === null) return;
    const measured = Math.min(
      15000,
      Math.round(performance.now() - started.current),
    );
    started.current = null;
    setHolding(false);
    setElapsed(measured);
    setShot(measured);
    if (active) send({ type: "fire", elapsed: measured });
  };
  fireRef.current = fire;
  const control=useRef<HTMLDivElement>(null),worldInput=useRef({start,fire});worldInput.current={start,fire};
  useEffect(()=>{const node=control.current;if(!node)return;const handler=(event:Event)=>{const action=(event as CustomEvent).detail?.action;if(action==='start')worldInput.current.start();else if(action==='fire')worldInput.current.fire();};node.addEventListener('olymp-cannon',handler);return()=>node.removeEventListener('olymp-cannon',handler);},[g.round]);
  useEffect(() => {
    if (!holding) return;
    let frame = 0;
    const clock = new BossFrameClock();
    const update = (stamp: number) => {
      frame = requestAnimationFrame(update);
      if (!clock.ready(stamp)) return;
      if (started.current !== null) {
        const duration = performance.now() - started.current;
        // The gauge runs independently of React; typing/buttons keep the main
        // thread available even on high-refresh displays.
        const current = krakenGauge(
          Math.min(15000, duration),
          g.boss.phase,
          g.seed,
        );
        if (band.current) {
          band.current.style.left = `${(current.target - current.width / 2) * 100}%`;
          band.current.style.width = `${current.width * 100}%`;
        }
        if (needle.current)
          needle.current.style.left = `${current.position * 100}%`;
        if (duration >= 15000) {
          fireRef.current();
          return;
        }
      }
    };
    frame = requestAnimationFrame(update);
    const release = () => fireRef.current();
    window.addEventListener("blur", release);
    const visibility = () => {
      if (document.hidden) release();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [holding]);
  useEffect(() => {
    if (!active) {
      started.current = null;
      setHolding(false);
    }
  }, [active]);
  // A reload during charging gets a fresh local attempt instead of a frozen trigger.
  return (
    <div className="boss-kraken-control" ref={control}>
      <div className="boss-crosshair">
        <Crosshair size={31} />
        <span>
          {g.boss.phase === 0
            ? "Ruhige See im Zielbereich"
            : g.boss.phase === 1
              ? "Der Zielbereich wandert"
              : "Das Auge des Sturms treffen"}
        </span>
      </div>
      <div
        className={`boss-charge ${holding ? "charging" : ""}`}
        role="img"
        aria-label="Zielanzeige: beim Zeiger in der leuchtenden Mitte loslassen"
      >
        <div
          ref={band}
          className="boss-charge-band"
          style={{
            left: `${(gauge.target - gauge.width / 2) * 100}%`,
            width: `${gauge.width * 100}%`,
          }}
        >
          <i />
        </div>
        <div
          ref={needle}
          className="boss-charge-needle"
          style={{ left: `${gauge.position * 100}%` }}
        />
        <span>0</span>
        <span>100</span>
      </div>
      <p className="boss-charge-tip">
        {shot !== null
          ? "Dein Schuss wird übertragen …"
          : holding
            ? "Jetzt in der Mitte loslassen!"
            : inWorld?"Halte deine Kanone gedrückt.":"Halte den Knopf oder die Leertaste gedrückt."}
      </p>
      <button
        ref={button}
        className={`boss-primary boss-trigger ${holding ? "holding" : ""}`}
        disabled={!active || shot !== null || (pending && !holding)}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.currentTarget.focus();
          e.currentTarget.setPointerCapture(e.pointerId);
          start();
        }}
        onPointerUp={fire}
        onPointerCancel={fire}
        onLostPointerCapture={fire}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            start();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            fire();
          }
        }}
        onBlur={fire}
      >
        <Crosshair size={22} />
        {holding
          ? "LOSLASSEN · SCHUSS FESTLEGEN"
          : shot !== null
            ? "KANONE GELADEN"
            : "GEDRÜCKT HALTEN"}
      </button>
      {shot !== null && !pending && !g.mine.submitted && (
        <button
          className="boss-secondary"
          disabled={!active}
          onClick={() => {
            if(g.mine.chargingStartedAt==null){setShot(null);setElapsed(0);}
            else send({ type: "fire", elapsed: shot });
          }}
        >
          {g.mine.chargingStartedAt==null?'Zurück zum Laden':'Treffer erneut übertragen'}
        </button>
      )}
      <div className="boss-streak">
        <Flame size={16} />
        <strong>{g.mine.streak ?? 0}</strong>
        <span>präzise Treffer in Folge</span>
      </div>
      {g.mine.chargingStartedAt != null && !holding && shot === null && (
        <small>Bereit für einen neuen Ladeversuch.</small>
      )}
    </div>
  );
}

function DragonControl({ g, active, pending, send, room, draftAct,me,onSelection }: any) {
  const [price, setPrice] = useState(()=>dragonOwnDraft(room).price),
    [risk, setRisk] = useState<DragonRisk>(()=>dragonOwnDraft(room).risk),[restored,setRestored]=useState(false),form=useRef<HTMLFormElement>(null);
  const guess=dragonEstimate(price),valid=guess!==undefined,cacheKey=dragonDraftKey(room,me),choice=dragonChoices.find(c=>c.id===risk)!;
  useEffect(()=>{if(!g.mine){setRestored(true);return;}try{const cached=JSON.parse(sessionStorage.getItem(cacheKey)??'null');if(!g.mine.submitted&&cached?.phase===room.phaseKey&&cached.round===g.round&&typeof cached.price==='string'&&cached.price.length<=32&&isDragonRisk(cached.risk)){setPrice(cached.price);setRisk(cached.risk);}}catch{}setRestored(true);},[cacheKey,room.phaseKey,g.round]);
  useEffect(()=>{if(!restored||!g.mine)return;try{if(g.mine.submitted)sessionStorage.removeItem(cacheKey);else sessionStorage.setItem(cacheKey,JSON.stringify({phase:room.phaseKey,round:g.round,price,risk}));}catch{}},[restored,price,risk,cacheKey,room.phaseKey,g.round,g.mine?.submitted]);
  useEffect(()=>{onSelection?.({owner:me,round:g.round,risk,guess});},[price,risk,me,g.round]);
  useEffect(()=>{if(g.mine?.submitted){const confirmed=dragonOwnDraft(room);setPrice(confirmed.price);setRisk(confirmed.risk);}},[g.mine?.submitted,g.mine?.guess,g.mine?.risk]);
  const choose=(value:DragonRisk)=>{if(!active||pending)return;setRisk(value);sound.bossCue('dragon','coin',.35);};
  useEffect(()=>{const node=form.current;if(!node)return;const listener=(event:Event)=>{const value=(event as CustomEvent).detail;if(isDragonRisk(value))choose(value);};node.addEventListener('olymp-dragon-risk',listener);return()=>node.removeEventListener('olymp-dragon-risk',listener);},[active,pending]);
  useDeadlineInput(room,draftAct,active && valid ? {type:"estimate",guess,risk,round:g.round} : null,!!g.mine?.timeoutInput&&g.mine.timeoutInput.phase===room.phaseKey);
  return (
    <form
      className="boss-dragon-control"
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        if (active && valid && !pending)
          send({ type: "estimate", guess, risk });
      }}
    >
      <div className="boss-treasure-product">
        <div>
          <img
            src={g.product.image}
            alt={g.product.name}
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        </div>
        <span>
          {productCategories[g.product.category] ?? g.product.category}
        </span>
        <strong>{g.product.name}</strong>
      </div>
      <label className="boss-price-input">
        <span>Deine Preisschätzung</span>
        <div>
          <input
            aria-label="Preisschätzung in Euro"
            inputMode="decimal"
            enterKeyHint="done"
            maxLength={10}
            autoComplete="off"
            placeholder="0,00"
            value={price}
            disabled={!active || pending}
            onChange={(e) => setPrice(e.target.value)}
          />
          <b>€</b>
        </div>
      </label>
      <label className="dragon-altar-risk-select"><span>Deine Risikotruhe</span><select aria-label="Risiko am Preisaltar" value={risk} disabled={!active||!!pending} onChange={e=>{if(isDragonRisk(e.target.value))choose(e.target.value);}}>{dragonChoices.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
      <fieldset className="boss-risk" disabled={!active || pending}>
        <legend>Wie sicher bist du?</legend>
        {dragonChoices.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={risk === r.id}
            className={risk === r.id ? "selected" : ""}
            onClick={() => {
              choose(r.id);
            }}
          >
            <strong>{r.title}</strong>
            <small>bis {r.max} Punkte</small>
            <span>{r.hint}</span>
          </button>
        ))}
      </fieldset>
      <button type="submit" className="boss-primary" disabled={!active || pending || !valid}>
        <LockKeyhole size={16} />
        {pending ? "Tipp wird versiegelt …" : "Tipp versiegeln"}
      </button>
      <small className="dragon-altar-risk-hint" role="status">{g.mine?.submitted?(guess!==undefined?'Dein Tipp ist versiegelt.':'Kein Tipp abgegeben.'):price&&!valid?'Betrag über 0 und bis 1.000.000 Euro, höchstens zwei Nachkommastellen.':`${choice.title} · bis ${choice.max} Punkte. ${choice.hint}. Bei Zeitablauf zählt dein gültiger Entwurf.`}</small>
      <small className="boss-price-note">
        Amazon-Referenzpreis vom {priceDate(g.product.priceDate)} · Auflösung
        nach allen Tipps. Ein gültiger Entwurf wird bei Zeitablauf übernommen.
      </small>
    </form>
  );
}

function BossVolley({ g, kind, me, elapsed, players }: any) {
  const rows: any[] = g.reveal.outcomes;
  return (
    <div className="boss-volley">
      <span className="boss-realm">ANGRIFF {g.round} · AUSWERTUNG</span>
      <h3>{elapsed < 4000 ? "Spannung halten …" : "Jeder Treffer zählt."}</h3>
      {kind === "dragon" && (
        <div className={`boss-price-reveal ${elapsed >= 2800 ? "open" : ""}`}>
          <Coins size={24} />
          <span>DER REFERENZPREIS</span>
          <strong>{elapsed >= 2800 ? euro(g.reveal.price) : "?,?? €"}</strong>
          <small>{g.product.name}</small>
        </div>
      )}
      <div className="boss-volley-list">
        {rows.map((o: any, i: number) => {
          const open =
              elapsed >= 4200 + (2700 * i) / Math.max(1, rows.length - 1),
            player = players.find((p: any) => p.id === o.id);
          return (
            <div
              key={o.id}
              className={`boss-volley-row ${open ? "open" : ""} ${o.id === me ? "self" : ""}`}
            >
              <Avatar
                avatar={player?.avatar}
                look={player?.look}
                color={player?.color}
              />
              <div>
                <strong>{player?.name ?? "Spieler"}</strong>
                <small>
                  {!open
                    ? "Angriff im Anflug"
                    : kind === "dragon" && o.submitted
                      ? `${euro(o.guess)} · ${Math.round(o.accuracy * 100)} % genau`
                      : o.label}
                </small>
              </div>
              <b>{open ? `+${number(o.score)}` : "···"}</b>
              {open && (
                <i style={{ width: `${Math.min(100, o.score / 16)}%` }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="boss-volley-total">
        <span>Gemeinsamer Boss-Schaden</span>
        <strong>
          {elapsed >= 7000 ? number(g.reveal.totalDamage) : "···"}
        </strong>
        <small>
          {elapsed >= 8000 && g.reveal.phaseBroken
            ? "Rüstung gebrochen · eure Punkte zählen vollständig"
            : "Jeder erhält seine eigenen Angriffspunkte"}
        </small>
      </div>
    </div>
  );
}
