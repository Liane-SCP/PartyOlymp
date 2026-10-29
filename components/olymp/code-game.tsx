"use client";
import { useAdventureDraft } from "./adventure-context";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Avatar } from "./art";
import { Particles } from "./showtime";
import { sound } from "@/lib/audio";
import { useGameSubmission } from "./use-game-submission";
const colors = [
  { name: "Rot", hex: "#f35d70" },
  { name: "Blau", hex: "#448fff" },
  { name: "Gelb", hex: "#ffd657" },
  { name: "Grün", hex: "#60d49a" },
  { name: "Violett", hex: "#b685ff" },
  { name: "Orange", hex: "#ff9b43" },
];
function Peg({ value }: { value: number | null }) {
  return (
    <span
      className={`code-peg ${value === null ? "empty" : ""}`}
      style={
        {
          "--peg": value === null ? "#182234" : colors[value].hex,
        } as CSSProperties
      }
      aria-label={value === null ? "Leer" : colors[value].name}
    />
  );
}
function Pins({ exact, misplaced }: { exact: number; misplaced: number }) {
  return (
    <span
      className="code-pins"
      role="img"
      aria-label={`${exact} rote Punkte: Farbe und Position richtig; ${misplaced} weiße Punkte: Farbe am falschen Platz`}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <i
          key={i}
          className={
            i < exact ? "exact" : i < exact + misplaced ? "misplaced" : "miss"
          }
        />
      ))}
    </span>
  );
}
function Legend() {
  return (
    <div className="code-legend">
      <span>
        <i className="exact" /> Farbe + Position richtig
      </span>
      <span>
        <i className="misplaced" /> Farbe am falschen Platz
      </span>
      <small>
        Jeder Stein zählt nur einmal. Die Punkte verraten keine Position.
      </small>
    </div>
  );
}
export function CodeGame({
  room,
  me,
  act,
}: {
  room: any;
  me: string;
  act: (a: any) => void | Promise<boolean>;
}) {
  const g = room.game,
    p = g.mine;
  const [draft, setDraft] = useState<(number | null)[]>(
      () => p?.pending ?? p?.guesses.at(-1)?.colors ?? [null, null, null, null],
    ),
    [slot, setSlot] = useState(0),
    [watch, setWatch] = useState(me),
    [confirm, setConfirm] = useState(false),
    [restored, setRestored] = useState(false);
  const key = `olymp.code:${room.code}:${room.phaseKey.split(":")[0]}:${room.index}:${g.round}:${me}`;
  const { pending: busy, error, clearError, submit } = useGameSubmission(act, `${key}:${g.turn}`);
  const heard = useRef(p?.guesses.length ?? 0);
  useAdventureDraft({code:draft,codeSlot:slot},[draft,slot]);
  useEffect(() => {
    try {
      if (p && !p.submitted && !g.canSpectate) {
        const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
        if (Array.isArray(saved?.colors) && saved.colors.length === 4 && saved.colors.every((value: unknown) => value === null || Number.isInteger(value) && Number(value) >= 0 && Number(value) < colors.length)) {
          setDraft(saved.colors);
          if (Number.isInteger(saved.slot) && saved.slot >= 0 && saved.slot < 4) setSlot(saved.slot);
        }
      }
    } catch {}
    setRestored(true);
  }, [key]);
  useEffect(() => {
    if (!restored || !p) return;
    try {
      if (p.submitted || g.canSpectate) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify({ colors: draft, slot }));
    } catch {}
  }, [key, restored, draft, slot, p?.submitted, g.canSpectate]);
  useEffect(() => {
    setConfirm(false);
    if ((p?.guesses.length ?? 0) > heard.current) {
      heard.current = p.guesses.length;
      if(p.solved)sound.play("win");
    }
  }, [g.turn, p?.submitted, p?.guesses.length]);
  const selected =
    g.canSpectate && watch !== me && g.roster[watch] ? watch : me;
  const rows =
    selected === me ? (p?.guesses ?? []) : (g.roster[selected]?.guesses ?? []);
  const pending = selected === me ? p?.pending : g.roster[selected]?.pending;
  const canPlay = restored && !!p && !p.submitted && !g.canSpectate && !busy;
  const duplicate = p?.guesses.some((r: any) =>
    r.colors.every((v: number, i: number) => v === draft[i]),
  );
  const players = room.players.filter((q: any) =>
    room.participantIds.includes(q.id),
  );
  const chosen = players.find((q: any) => q.id === selected);
  const waitingNames = players.filter((player: any) => !g.roster[player.id]?.ready)
    .map((player: any) => player.id === me ? "du" : player.name);
  const send = (a: any) => {
    return submit({ ...a, round: g.round, turn: g.turn });
  };
  const choose = (value: number) => {
    if (!canPlay) return;
    clearError();
    setDraft((previous) => previous.map((v, i) => (i === slot ? value : v)));
    setSlot((slot + 1) % 4);
    sound.play("codeSelect");
  };
  return (
    <section className="code-arena">
      <header className="code-heading">
        <div>
          <span className="eyebrow">
            GEHEIMER FARBCODE · GEMEINSAMER ZUG {g.turn}
          </span>
          <h2>
            {g.canSpectate
              ? p?.solved
                ? "Code geknackt. Jetzt zuschauen!"
                : "Schau der Crew über die Schulter."
              : "Vier Plätze. Dein nächster Schluss."}
          </h2>
          <p>
            {g.canSpectate
              ? "Wähle ein fremdes Brett. Du siehst abgegebene Tipps und ihre Rückmeldungen."
              : "Alle bekommen denselben Code. Farben dürfen mehrfach vorkommen."}
          </p>
        </div>
        <div className="code-seal" aria-label="Der geheime Code ist verborgen">
          {[0, 1, 2, 3].map((i) => (
            <span key={i}>?</span>
          ))}
        </div>
      </header>
      <Legend />
      <div className="code-layout">
        <section className="code-workbench" aria-label="Farbenbrett">
          <header>
            <strong>
              {selected === me ? "Dein Brett" : `${chosen?.name} · Live-Brett`}
            </strong>
            <span>
              {rows.length} {rows.length === 1 ? "Versuch" : "Versuche"}
            </span>
            {selected !== me && (
              <button onClick={() => setWatch(me)}>Mein Brett</button>
            )}
          </header>
          {g.canSpectate && (
            <p className="code-state" role="status">
              {p?.solved
                ? `Gelöst in ${p.guesses.length} ${p.guesses.length === 1 ? "Versuch" : "Versuchen"}.`
                : "Du schaust zu."}{" "}
              Die wenigsten Versuche gewinnen; Tempo entscheidet nicht.
            </p>
          )}
          <div className="code-history" aria-label="Bisherige Farbversuche">
            {rows.length === 0 ? (
              <div className="code-empty">
                <div>
                  {[0, 1, 2, 3].map((i) => (
                    <Peg key={i} value={null} />
                  ))}
                </div>
                <p>Noch kein ausgewerteter Versuch.</p>
                <small>Vier Farbsteine setzen und gemeinsam aufdecken.</small>
              </div>
            ) : (
              [...rows].reverse().map((r: any) => (
                <div className="code-guess-row" key={r.turn}>
                  <span className="code-attempt">#{r.turn}</span>
                  <div className="code-four">
                    {r.colors.map((v: number, i: number) => (
                      <Peg value={v} key={i} />
                    ))}
                  </div>
                  <Pins exact={r.exact} misplaced={r.misplaced} />
                  {selected === me && canPlay && (
                    <button
                      className="code-copy"
                      title="Diesen Versuch als Vorlage nehmen"
                      onClick={() => {
                        clearError();
                        setDraft([...r.colors]);
                        setSlot(0);
                      }}
                    >
                      ↶
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          {pending && (
            <div className="code-pending">
              <span>Verdeckt abgegeben · wartet auf die Crew</span>
              <div className="code-four">
                {pending.map((v: number, i: number) => (
                  <Peg key={i} value={v} />
                ))}
              </div>
              <p className="code-waiting" role="status" title={waitingNames.join(", ")}>{waitingNames.length
                ? `Noch offen: ${waitingNames.slice(0, 2).join(", ")}${waitingNames.length > 2 ? ` und ${waitingNames.length - 2} weitere` : ""}.`
                : "Alle Tipps sind eingegangen. Die gemeinsame Aufdeckung beginnt."}</p>
            </div>
          )}
          {!g.canSpectate && p && (
            <div className={`code-editor ${p.submitted ? "is-locked" : ""}`}>
              <p>
                {p.submitted
                  ? "Dein Tipp ist versiegelt. Die Crew ist noch dran."
                  : `Versuch ${g.turn} · Platz anklicken, dann Farbe wählen`}
              </p>
              {!p.submitted && (
                <>
                  <div className="code-slots">
                    {draft.map((v, i) => (
                      <button
                        key={i}
                        className={slot === i ? "selected" : ""}
                        disabled={!canPlay}
                        aria-label={`Position ${i + 1}: ${v === null ? "leer" : colors[v].name}`}
                        aria-pressed={slot === i}
                        onClick={() => setSlot(i)}
                      >
                        <Peg value={v} />
                      </button>
                    ))}
                  </div>
                  <div className="code-palette" aria-label="Farbauswahl">
                    {colors.map((c, i) => (
                      <button
                        key={c.name}
                        disabled={!canPlay}
                        title={c.name}
                        aria-label={`Farbe ${c.name}`}
                        onClick={() => choose(i)}
                      >
                        <Peg value={i} />
                      </button>
                    ))}
                  </div>
                  <button
                    className="primary code-submit"
                    disabled={!canPlay || draft.includes(null) || duplicate}
                    onClick={() => send({ type: "guess", colors: draft })}
                  >
                    {busy ? "Wird bestätigt …" : "Tipp verdeckt festlegen"}
                  </button>
                  <small className="code-hint">
                    {duplicate
                      ? "Schon geprüft — ändere mindestens einen Farbstein."
                      : "Rückmeldung erst, wenn alle aktiven Spieler abgegeben haben."}
                  </small>
                  {error && <p className="submission-error" role="alert">{error}</p>}
                  {confirm ? (
                    <div className="code-giveup">
                      <p>
                        Für diesen Code aufgeben und fremde Bretter ansehen?
                      </p>
                      <button
                        disabled={!canPlay}
                        onClick={() => send({ type: "giveUp" })}
                      >
                        {busy ? "Wird bestätigt …" : "Ja, aufgeben & zuschauen"}
                      </button>
                      <button disabled={busy} onClick={() => setConfirm(false)}>
                        Weiter rätseln
                      </button>
                    </div>
                  ) : (
                    <button
                      className="code-giveup-link"
                      disabled={!canPlay}
                      onClick={() => setConfirm(true)}
                    >
                      Aufgeben & zuschauen
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </section>
        <section
          className="code-crew"
          aria-label="Trefferverlauf der Mitspieler"
        >
          <details className="party-code-crew"><summary>Versuche der Crew ansehen</summary>
          <header>
            <strong>Die Crew · Zug für Zug</strong>
            <span>
              {players.filter((q: any) => g.roster[q.id].ready).length}/
              {players.length} bereit
            </span>
          </header>
          <p>
            {g.canSpectate
              ? "Brett auswählen zum Zuschauen."
              : "Du siehst ihre Trefferpunkte, niemals ihre Farbsteine."}
          </p>
          <div className="code-crew-grid">
            {players
              .filter((q: any) => q.id !== me)
              .map((q: any) => {
                const r = g.roster[q.id];
                return (
                  <article
                    key={q.id}
                    className={`code-rival ${r.solved ? "solved" : ""} ${selected === q.id ? "watching" : ""}`}
                  >
                    <header>
                      <Avatar avatar={q.avatar} look={q.look} color={q.color} />
                      <strong>{q.name}</strong>
                      <span>
                        {r.solved
                          ? "✓ Gelöst"
                          : r.gaveUp
                            ? "Schaut zu"
                            : r.ready
                              ? "✓ Versiegelt"
                              : "Denkt nach"}
                      </span>
                    </header>
                    <div className="code-rival-history">
                      {r.feedback.length ? (
                        [...r.feedback].reverse().map((f: any) => (
                          <div key={f.turn}>
                            <span>#{f.turn}</span>
                            <Pins exact={f.exact} misplaced={f.misplaced} />
                          </div>
                        ))
                      ) : (
                        <small>Noch kein Versuch</small>
                      )}
                    </div>
                    {g.canSpectate && (
                      <button
                        aria-pressed={selected === q.id}
                        onClick={() => setWatch(q.id)}
                      >
                        {selected === q.id ? "Du schaust zu" : "Brett ansehen"}
                      </button>
                    )}
                  </article>
                );
              })}
          </div>
          </details>
        </section>
      </div>
    </section>
  );
}
export function CodeReveal({
  g,
  players,
  me,
}: {
  g: any;
  players: any[];
  me?: string;
}) {
  const rows = [...(g.reveal?.players ?? [])].sort(
    (a, b) => Number(b.solved) - Number(a.solved) || a.attempts - b.attempts,
  );
  return (
    <section className="round-reveal code-reveal">
      <Particles seed={`code:${g.round}`} burst />
      <span className="eyebrow">CODEKNACKER · RUNDE {g.round}</span>
      <h2>Der Code ist offen.</h2>
      <div className="code-solution">
        {(g.reveal?.code ?? []).map((v: number, i: number) => (
          <Peg key={i} value={v} />
        ))}
      </div>
      <p>Weniger Versuche gewinnen. Gleiche Versuchszahl, gleicher Platz.</p>
      <div className="code-results">
        {rows.map((r: any) => {
          const q = players.find((p) => p.id === r.id),
            rank = r.solved
              ? rows.filter((p) => p.solved && p.attempts < r.attempts).length +
                1
              : null;
          return (
            <article key={r.id} className={r.id === me ? "self" : ""}>
              <strong>
                {rank ? `${rank}. ` : ""}
                {q?.name}
                {r.id === me ? " · du" : ""}
              </strong>
              <b>
                {r.solved
                  ? `${r.attempts} ${r.attempts === 1 ? "Versuch" : "Versuche"}`
                  : "Nicht gelöst"}
              </b>
              <span>
                {r.solvedRounds} Codes gelöst · {r.totalGuesses} Versuche gesamt
              </span>
            </article>
          );
        })}
      </div>
      <p className="muted">
        Über mehrere Runden: zuerst mehr gelöste Codes, dann weniger Versuche in
        diesen Runden.
      </p>
    </section>
  );
}
