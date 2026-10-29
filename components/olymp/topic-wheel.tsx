"use client";
import { useState } from "react";
import { chainTopics } from "@/lib/game/chain-content";
import { WheelSpin } from "./wheel-spin";
import { sound } from "@/lib/audio";
import { useDeadlineInput } from "./deadline-input";

export function TopicWheel({room, me, act, now}: {room:any; me:string; act:(a:any)=>void; now:number}) {
  const [name, setName] = useState(""), [hint, setHint] = useState("");
  const g=room.game, p=g.mine;
  useDeadlineInput(room,act,g.stage==="topicSuggest" && !p?.topicSubmitted && name.trim().length>=2 ? {type:"suggestTopic",name:name.trim(),hint:hint.trim(),round:g.round,turn:g.turn} : null);
  if(g.stage === "topicSpin") return <WheelSpin key={g.topicWheel.id} draw={g.topicWheel} now={now} reduced={sound.settings.motion}
    title="Welche Kategorie wird’s?" subtitle="Ein Los pro Spieler. Eure Vorschläge entscheiden diese Runde." />;
  const remaining=Math.max(0, Math.ceil((g.deadline-now)/1000));
  return <section className="topic-proposals">
    <span className="eyebrow">KATEGORIEN-KETTE · RUNDE {g.round}</span>
    <h2>Ihr füllt das Glücksrad.</h2><p>Jeder schlägt eine Kategorie vor. Danach entscheidet das Rad, zu welchem Thema ihr Begriffe nennt.</p>
    <div className="topic-proposal-count"><strong>{g.suggestions.length}/{room.participantIds.length} Vorschläge</strong><span>{remaining} Sek.</span></div>
    {!p ? <p>Du schaust bei der Kategorienwahl zu.</p> : p.topicSubmitted ? <div className="topic-confirmed">✦ Dein Vorschlag ist im Rad. Wir warten auf die Crew.</div> :
      <form onSubmit={e=>{e.preventDefault();act({type:"suggestTopic", name:name.trim(), hint:hint.trim(), round:g.round, turn:g.turn});}}>
        <label>Deine Kategorie<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={48} list="chain-topic-ideas" placeholder="Zum Beispiel: Videospiel-Charaktere" required /></label>
        <datalist id="chain-topic-ideas">{chainTopics.map(t=><option key={t.id} value={t.name} />)}</datalist>
        <label>Was zählt dazu? <small>(optional)</small><input value={hint} onChange={e=>setHint(e.target.value)} maxLength={140} placeholder="Kurze Erklärung für die Gruppe" /></label>
        <button className="primary" type="submit" disabled={name.trim().length<2}>Ins Glücksrad werfen ✦</button>
      </form>}
    <div className="topic-proposal-list">{g.suggestions.map((s:any)=><article key={s.player}><small>{room.players.find((p:any)=>p.id===s.player)?.name ?? "Spieler"}</small><strong>{s.name}</strong></article>)}</div>
    <p className="wheel-note">Bei Zeitablauf bekommt jeder fehlende Vorschlag eine Kategorie aus dem Ideenpool. Jedes Spieler-Los hat die gleiche Chance.</p>
  </section>;
}
