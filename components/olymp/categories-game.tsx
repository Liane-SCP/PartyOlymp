"use client";
import { useAdventureDraft } from "./adventure-context";
import { useEffect, useRef, useState } from "react";
import { wordKey } from "@/lib/game/category-rules";
import { sound } from "@/lib/audio";
import {AtelierNotebook} from './atelier-notebook';
import {useDeadlineInput} from "./deadline-input";
import {useGameSubmission} from "./use-game-submission";

function restoredBallot(game:any,phase:string):Record<string,boolean|null>{
  const stored=game.mine.timeoutInput;
  const source=!game.mine.voteCommitted&&stored?.phase===phase&&stored.action?.type==='vote'&&stored.action.categoryIndex===game.categoryIndex?stored.action.ballot:game.mine.ballot;
  if(!source||typeof source!=='object'||Array.isArray(source))return {};
  return Object.fromEntries(Object.entries(source).filter(([key,value])=>(typeof value==='boolean'||value===null)&&game.options?.some((option:any)=>option.key===key&&option.formatValid))) as Record<string,boolean|null>;
}

export function CategoriesGame({
  room,
  me,
  act,
  now=Date.now(),
}: {
  room: any;
  me: string;
  act: (a: any) => void|Promise<boolean>;
  now?:number;
}) {
  const g = room.game,
    mine = g.mine;
  const {pending,error,clearError,submit}=useGameSubmission(act,`${room.code}:${room.phaseKey}:${g.categoryIndex}:${me}`);
  const [answers, setAnswers] = useState<string[]>(mine.answers);
  useAdventureDraft({categories:answers},[answers]);
  const seq = useRef(mine.seq),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    send = useRef(act);
  send.current = act;
  seq.current=Math.max(seq.current??0,mine.seq??0);
  const [ballot, setBallot] = useState<Record<string, boolean | null>>(
    ()=>restoredBallot(g,room.phaseKey),
  );
  useEffect(() => {
    setBallot(restoredBallot(g,room.phaseKey));
    if (g.stage !== "answer" && timer.current) clearTimeout(timer.current);
  }, [g.categoryIndex, g.stage]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function change(index: number, value: string) {
    if(pending||mine.submitted||g.stage!=='answer')return;
    clearError();
    const next = answers.map((v, i) => (i === index ? value : v));
    setAnswers(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () =>
        send.current({
          type: "draft",
          round: g.round,
          seq: ++seq.current,
          answers: next,
        }),
      180,
    );
  }
  const name = (id: string) =>
    room.players.find((p: any) => p.id === id)?.name ?? "Spieler";
  const options = g.stage === "voteReveal" ? g.lastReview.options : g.options;
  const votable = options.filter((o: any) => o.formatValid);
  const ready = votable.every((o: any) => Object.hasOwn(ballot, o.key));
  useDeadlineInput(room,act,g.stage==="answer"&&!mine.submitted&&answers.some(wordKey)?{type:"answer",round:g.round,seq:seq.current+1,answers}:g.stage==="vote" && !mine.voteCommitted && Object.keys(ballot).length ? {type:"vote",round:g.round,categoryIndex:g.categoryIndex,ballot:Object.fromEntries(votable.map((o:any)=>[o.key,ballot[o.key]??null]))} : null);
  if(g.stage==='answer')return <AtelierNotebook game={g} answers={answers} change={change} now={now} pending={pending} error={error} submit={()=>{if(pending||mine.submitted)return;if(timer.current)clearTimeout(timer.current);void submit({type:"answer",round:g.round,seq:++seq.current,answers});}}/>;
  return (
    <section className={`words-arena words-phase-${g.stage}`}>
      <header className="words-heading">
        <div className="words-letter" key={g.letter}>
          {g.letter}
        </div>
        <div>
          <span className="eyebrow">
            {g.stage === "answer"
              ? "EIN BUCHSTABE · SIEBEN IDEEN"
              : `KATEGORIE ${g.categoryIndex + 1} / 7 · CREW-VOTING`}
          </span>
          <h2>
            {g.stage === "answer"
              ? `Alles beginnt mit ${g.letter}`
              : g.category}
          </h2>
          <p>
            {g.stage === "answer"
              ? "Deine Antworten bleiben bis zur Abstimmung geheim. Der Timer stoppt nur das Schreiben."
              : g.stage === "voteReveal"
                ? "Die Stimmen sind gezählt. Gleich geht es zur nächsten Kategorie."
                : "Stimmt ehrlich ab – auch über eure eigenen Antworten. Eure Stimmen bleiben bis zur Auflösung geheim."}
          </p>
        </div>
      </header>
      {(
        <>
          <nav
            className="words-category-track"
            aria-label="Kategorienfortschritt"
          >
            {g.categories.map((category: string, i: number) => (
              <span
                className={
                  i === g.categoryIndex
                    ? "current"
                    : i < g.categoryIndex
                      ? "checked"
                      : ""
                }
                key={category}
              >
                {i < g.categoryIndex ? "✓ " : ""}
                {category}
              </span>
            ))}
          </nav>
          <div className="words-votes" key={`${g.categoryIndex}:${g.stage}`}>
            {options.map((o: any) => (
              <article
                key={o.key}
                className={`word-vote ${g.stage === "voteReveal" ? (o.accepted ? "accepted" : "rejected") : ""}`}
              >
                <span className="word-authors">
                  {o.owners
                    .map((id: string) => (id === me ? "Du" : name(id)))
                    .join(" · ")}
                </span>
                <strong>{o.answer}</strong>
                {o.owners.length>1&&<small>{o.owners.length} gleiche Antworten · gemeinsam bewertet</small>}
                {g.stage === "voteReveal" ? (
                  <div className="word-verdict">
                    <b>{o.accepted ? `+${o.points} Punkte` : "0 Punkte"}</b>
                    <span>
                      {o.yes} Ja · {o.no} Nein · {o.reason}
                    </span>
                  </div>
                ) : !o.formatValid ? (
                  <p className="word-invalid">
                    Falscher Anfangsbuchstabe · 0 Punkte
                  </p>
                ) : (
                  <div className="word-vote-actions">
                    {([true, false, null] as const).map((value, i) => (
                      <button
                        type="button"
                        key={i}
                        aria-pressed={
                          Object.hasOwn(ballot, o.key) &&
                          ballot[o.key] === value
                        }
                        disabled={pending||mine.voteCommitted}
                        className={
                          Object.hasOwn(ballot, o.key) &&
                          ballot[o.key] === value
                            ? "chosen"
                            : ""
                        }
                        onClick={() => {
                          clearError();
                          setBallot(previous=>({ ...previous, [o.key]: value }));
                          sound.play("click");
                        }}
                      >
                        {i === 0
                          ? "✓ Gültig"
                          : i === 1
                            ? "✕ Ungültig"
                            : "Enthalten"}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
          {!options.length && (
            <p className="words-empty">Hier wurde keine Antwort eingetragen.</p>
          )}
          {g.stage === "vote" && (
            <div className="words-vote-footer">
              <span>
                {Object.keys(ballot).length} / {votable.length} Antworten
                bewertet
              </span>
              <button
                className="primary"
                disabled={pending || !ready || mine.voteCommitted}
                onClick={() =>
                  submit({
                    type: "vote",
                    round: g.round,
                    categoryIndex: g.categoryIndex,
                    ballot,
                  })
                }
              >
                {mine.voteCommitted
                  ? "Stimmen versiegelt ✓"
                  : pending ? "Stimmen werden versiegelt …" : "Stimmen abgeben"}
              </button>
              {error&&!mine.voteCommitted&&<p className="submission-error" role="alert">{error}</p>}
              <small>Gleichstand oder keine Stimmen = ungültig.</small>
            </div>
          )}
        </>
      )}
      <footer className="words-scoring">
        <span>
          <b>20</b> allein gültig
        </span>
        <span>
          <b>10</b> einzigartige Antwort
        </span>
        <span>
          <b>5</b> gleiche Antwort
        </span>
        <span>
          <b>0</b> ungültig / leer
        </span>
      </footer>
    </section>
  );
}

export function CategoriesResults({ g, room }: { g: any; room: any }) {
  const r = g.reveal;
  return (
    <div className="words-results">
      <table>
        <thead>
          <tr>
            <th>Crew · {r.letter}</th>
            {g.categories.map((c: string) => (
              <th key={c}>{c}</th>
            ))}
            <th>Runde</th>
          </tr>
        </thead>
        <tbody>
          {[...r.players]
            .sort((a: any, b: any) => b.score - a.score)
            .map((p: any) => (
              <tr key={p.id}>
                <th>{room.players.find((x: any) => x.id === p.id)?.name}</th>
                {p.categories.map((c: any) => (
                  <td
                    className={c.accepted ? "accepted" : "rejected"}
                    key={c.category}
                    title={`${c.answer || "Leer"} · ${c.reason} · ${c.yes} Ja / ${c.no} Nein`}
                  >
                    <span>{c.answer || "—"}</span>
                    <b>+{c.score}</b>
                  </td>
                ))}
                <td>
                  <strong>{p.score}</strong>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <p>
        Über die Antworten hat eure Crew abgestimmt. Gleiche gültige Antworten
        geben jedem 5 Punkte.
      </p>
    </div>
  );
}
