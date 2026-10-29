"use client";

import { useState, useId, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  Minus,
  Plus,
  Search,
  Shuffle,
  Trash2,
  Undo2,
  Info,
} from "lucide-react";
import { catalog, byId, duration, preset } from "@/lib/game/catalog";
import { isBoss, minimumRounds } from "@/lib/game/boss-rules";
import type { Selection, GameId } from "@/lib/game/types";
import { GameIcon } from "./art";

function GameHelp({ game }: { game: (typeof catalog)[number] }) {
  const id = useId();
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const show = (button: HTMLButtonElement) => {
    const r = button.getBoundingClientRect();
    setPosition({
      left: Math.max(12, Math.min(r.left, window.innerWidth - 352)),
      top: Math.max(12, Math.min(r.bottom + 8, window.innerHeight - 300)),
    });
  };
  return (
    <>
      <button
        className="planner-help"
        aria-label={`${game.name}: Spielinfo`}
        aria-describedby={position ? id : undefined}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={(e) => {
          if (document.activeElement !== e.currentTarget) setPosition(null);
        }}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={() => setPosition(null)}
        onClick={(e) => show(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setPosition(null);
            e.stopPropagation();
          }
        }}
      >
        <Info size={17} />
      </button>
      {position &&
        createPortal(
          <aside
            id={id}
            role="tooltip"
            className="planner-tooltip"
            style={position}
          >
            <strong>{game.name}</strong>
            <p>{game.description}</p>
            <p>{game.controls}</p>
            <small>{game.win}</small>
          </aside>,
          document.body,
        )}
    </>
  );
}

const groups = [
  "Alle",
  "Schätzen",
  "Wörter & Wissen",
  "Karten & Würfel",
  "Geschick",
  "Bosse",
];
function group(id: GameId) {
  if (isBoss(id)) return "Bosse";
  if (["budget", "size", "color", "geo"].includes(id)) return "Schätzen";
  if (["cards", "dice", "blackjack", "code"].includes(id))
    return "Karten & Würfel";
  if (["timing", "typer"].includes(id)) return "Geschick";
  return "Wörter & Wissen";
}
function timerLabel(id: GameId) {
  return isBoss(id)
    ? "Zeit pro Angriff"
    : id === "bomb"
      ? "Kürzeste Lunte"
      : id === "auction"
        ? "Zeit zum Aufzählen"
        : id === "timing"
          ? "Antwortfenster"
          : id === "spectrum"
            ? "Zeit pro Phase"
            : ["cards", "dice", "chain"].includes(id)
              ? "Zeit pro Zug"
              : "Zeit pro Antwort";
}

export function OlympiadPlanner({
  selection,
  host,
  players,
  configure,
}: {
  selection: Selection[];
  host: boolean;
  players: number;
  configure: (selection: Selection[]) => Promise<boolean>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Alle");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [undo, setUndo] = useState<Selection[] | null>(null);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<{
    name: string;
    list: Selection[];
  } | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const count = Math.max(2, players);
  async function change(list: Selection[], message: string, restore = false) {
    if (saving.current || !host) return;
    saving.current = true;
    setBusy(true);
    try {
      const ok = await configure(list);
      if (ok) {
        setUndo(restore ? null : selection.map((s) => ({ ...s })));
        setNotice(message);
        setPreview(null);
      } else setNotice("Änderung noch nicht bestätigt. Prüfe den aktuellen Spielplan und versuche es erneut.");
    } catch {
      setNotice("Änderung noch nicht bestätigt. Prüfe den aktuellen Spielplan und versuche es erneut.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  function patch(index: number, data: Partial<Selection>) {
    void change(
      selection.map((s, i) => (i === index ? { ...s, ...data } : s)),
      "Spielplan aktualisiert.",
    );
  }
  function move(index: number, offset: number) {
    const next = [...selection];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setExpanded(null);
    void change(next, "Reihenfolge geändert.");
  }
  const visible = catalog.filter(
    (g) =>
      (filter === "Alle" || group(g.id) === filter) &&
      `${g.name} ${g.tag} ${g.description}`
        .toLocaleLowerCase("de")
        .includes(query.trim().toLocaleLowerCase("de")),
  );
  return (
    <div className="olympiad-planner">
      <div className="planner-toolbar">
        <header className="planner-heading">
          <div>
            <h2>Eure Olympiade</h2>
          </div>
          <div
            className="planner-total"
            title={`Geschätzte Dauer für ${count} Spieler. Euer Tempo kann abweichen.`}
          >
            <Clock size={19} />
            <strong>ca. {duration(selection, count)} Min.</strong>
            <small>
              {selection.length} Spiele · {players} Spieler
            </small>
          </div>
        </header>
        {host && (
          <div className="planner-presets">
            <span>Vorlagen</span>
            {[20, 60, 120].map((minutes, i) => (
              <button
                key={minutes}
                disabled={busy}
                onClick={() =>
                  setPreview({
                    name: ["Kurze Runde", "Spieleabend", "Große Olympiade"][i],
                    list: preset(minutes),
                  })
                }
              >
                <strong>
                  {["Kurze Runde", "Spieleabend", "Große Olympiade"][i]}
                </strong>
                <small>Vorlage ansehen</small>
              </button>
            ))}
            <button
              disabled={busy}
              onClick={() => {
                const pool = [...catalog];
                for (let i = pool.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [pool[i], pool[j]] = [pool[j], pool[i]];
                }
                setPreview({
                  name: "Überraschungsmix",
                  list: pool.slice(0, 6).map((g) => ({
                    id: g.id,
                    rounds: Math.max(
                      minimumRounds(g.id),
                      Math.min(3, g.defaultRounds),
                    ),
                    seconds: g.defaultSeconds,
                  })),
                });
              }}
            >
              <Shuffle size={17} />
              <strong>Überrasch mich</strong>
            </button>
          </div>
        )}
      </div>
      {preview && (
        <section className="planner-preview" aria-label="Vorlagenvorschau">
          <div>
            <strong>
              {preview.name} · {preview.list.length} Spiele · ca.{" "}
              {duration(preview.list, count)} Min.
            </strong>
            <p>{preview.list.map((s) => byId(s.id).name).join(" → ")}</p>
            <small>
              Ersetzt euren aktuellen Spielplan. Danach kannst du alles
              anpassen.
            </small>
          </div>
          <button
            className="primary"
            disabled={busy}
            onClick={() => {
              setExpanded(null);
              void change(preview.list, "Vorlage übernommen.");
            }}
          >
            Diesen Spielplan nehmen
          </button>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => setPreview(null)}
          >
            Abbrechen
          </button>
        </section>
      )}
      <div className="planner-feedback">
        <span role="status">{busy ? "Wird gespeichert …" : notice}</span>
        {host && undo && (
          <button
            disabled={busy}
            onClick={() => {
              setExpanded(null);
              void change(undo, "Letzte Änderung rückgängig gemacht.", true);
            }}
          >
            <Undo2 size={14} /> Rückgängig
          </button>
        )}
      </div>
      <div className="planner-columns">
        <section className="planner-library" aria-label="Spiele auswählen">
          <h3>
            <span>1</span> Spiele entdecken
          </h3>
          <label className="planner-search">
            <Search size={18} />
            <input
              aria-label="Spiele suchen"
              placeholder="Spiel suchen …"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button aria-label="Suche leeren" onClick={() => setQuery("")}>
                ×
              </button>
            )}
          </label>
          <div className="planner-filters" aria-label="Spielkategorien">
            {groups.map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="planner-game-grid">
            {visible.map((g) => {
              const selected = selection.filter((s) => s.id === g.id).length;
              return (
                <article
                  className={`planner-game ${selected ? "is-selected" : ""}`}
                  key={g.id}
                >
                  <div className="planner-game-title">
                    <GameIcon id={g.id} />
                    <div>
                      <small>{group(g.id)}</small>
                      <h4>{g.name}</h4>
                    </div>
                    {selected > 0 && (
                      <span className="planner-picked">
                        <Check size={13} />
                        {selected > 1 ? `${selected}×` : "Im Plan"}
                      </span>
                    )}
                  </div>
                  <GameHelp game={g} />
                  {host && (
                    <button
                      className="planner-add"
                      disabled={busy || selection.length >= 40}
                      aria-label={`${g.name} hinzufügen`}
                      onClick={() =>
                        void change(
                          [
                            ...selection,
                            {
                              id: g.id,
                              rounds: g.defaultRounds,
                              seconds: g.defaultSeconds,
                            },
                          ],
                          `${g.name} hinzugefügt.`,
                        )
                      }
                    >
                      <Plus size={16} />
                      <span>{selected ? "Noch einmal" : "Hinzufügen"}</span>
                    </button>
                  )}
                </article>
              );
            })}
          </div>
          {!visible.length && (
            <div className="planner-empty">
              <strong>Kein passendes Spiel gefunden.</strong>
              <p>Versuche einen anderen Namen oder zeige alle Spiele.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setFilter("Alle");
                }}
              >
                Alle Spiele anzeigen
              </button>
            </div>
          )}
        </section>
        <section className="planner-plan" aria-label="Euer Spielplan">
          <div className="planner-plan-heading">
            <h3>
              <span>2</span> Eure Spielreihenfolge
            </h3>
            <small>{selection.length}/40 Spiele</small>
          </div>
          <p className="planner-hint">Ihr spielt von oben nach unten. Verschiebe Spiele an die gewünschte Stelle. Es werden keine Spiele automatisch ergänzt oder ausgelost. Änderungen setzen die Bereitschaft der Crew zurück.</p>
          {!host && (
            <p className="planner-hint">Der Gastgeber bearbeitet den Plan.</p>
          )}
          <ol className="planner-order">
            {selection.map((s, i) => {
              const g = byId(s.id),
                unit = isBoss(s.id) ? "Angriffe" : "Runden";
              return (
                <li key={`${s.id}-${i}`} className="planner-stop">
                  <div className="planner-stop-title">
                    <span className="planner-number">{i + 1}</span>
                    <GameIcon id={s.id} />
                    <strong>{g.name}</strong>
                    {host && (
                      <button
                        className="planner-remove"
                        disabled={busy || selection.length === 1}
                        aria-label={`${g.name} an Position ${i + 1} entfernen`}
                        title={
                          selection.length === 1
                            ? "Mindestens ein Spiel bleibt im Plan"
                            : "Spiel entfernen"
                        }
                        onClick={() => {
                          setExpanded(null);
                          void change(
                            selection.filter((_, k) => k !== i),
                            `${g.name} entfernt.`,
                          );
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="planner-stop-controls">
                    <div className="planner-stepper">
                      <button
                        disabled={
                          !host || busy || s.rounds <= minimumRounds(s.id)
                        }
                        aria-label={`Weniger ${unit} Spiel ${i + 1}`}
                        onClick={() => patch(i, { rounds: s.rounds - 1 })}
                      >
                        <Minus size={14} />
                      </button>
                      <span>
                        <strong>{s.rounds}</strong> {unit}
                      </span>
                      <button
                        disabled={!host || busy || s.rounds >= 30}
                        aria-label={`Mehr ${unit} Spiel ${i + 1}`}
                        onClick={() => patch(i, { rounds: s.rounds + 1 })}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {host && (
                      <div className="planner-move">
                        <button
                          disabled={busy || i === 0}
                          aria-label={`Spiel ${i + 1} nach oben`}
                          onClick={() => move(i, -1)}
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          disabled={busy || i === selection.length - 1}
                          aria-label={`Spiel ${i + 1} nach unten`}
                          onClick={() => move(i, 1)}
                        >
                          <ArrowDown size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    className="planner-options-toggle"
                    aria-expanded={expanded === i}
                    onClick={() => setExpanded(expanded === i ? null : i)}
                  >
                    {s.id === "code"
                      ? "Ohne Timer"
                      : `${timerLabel(s.id)}: ${s.seconds} Sek.`}{" "}
                    <span>{expanded === i ? "Schließen" : "Details"}</span>
                  </button>
                  {expanded === i && (
                    <div className="planner-options">
                      {s.id === "code" ? (
                        <p>
                          Alle lösen oder geben auf. Es gibt keinen Zugtimer.
                        </p>
                      ) : (
                        <>
                          <label>
                            {timerLabel(s.id)}
                            <select
                              aria-label={`Zeit für Spiel ${i + 1}`}
                              disabled={!host || busy}
                              value={s.seconds}
                              onChange={(e) =>
                                patch(i, { seconds: Number(e.target.value) })
                              }
                            >
                              {[
                                ...new Set([
                                  8,
                                  10,
                                  12,
                                  15,
                                  20,
                                  25,
                                  30,
                                  35,
                                  45,
                                  60,
                                  90,
                                  120,
                                  180,
                                  s.seconds,
                                ]),
                              ]
                                .sort((a, b) => a - b)
                                .filter((t) => !isBoss(s.id) || t >= 20)
                                .map((t) => (
                                  <option key={t} value={t}>
                                    {t} Sekunden
                                    {t === g.defaultSeconds
                                      ? " · empfohlen"
                                      : ""}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <p>
                            {s.id === "bomb"
                              ? "Die genaue Lunte bleibt geheim und kann länger brennen."
                              : s.id === "timing"
                                ? "Mindestens 45 Sekunden zum Antworten. Die zu messende Zeit bleibt im Spiel verborgen."
                                : "Dieser Timer gilt für einzelne Antworten oder Züge. Er bricht nicht die ganze Olympiade ab."}
                          </p>
                        </>
                      )}
                      <p>
                        {isBoss(s.id)
                          ? `Mindestens ${minimumRounds(s.id)} Angriffe für die Bossphasen.`
                          : s.id === "dice"
                            ? "Eine Runde ist ein vollständiger Würfelwerk-Durchlauf mit allen Kategorien."
                            : s.id === "cards"
                              ? "Eine Runde endet, wenn jemand seine letzte Karte ablegt."
                              : "Mehr Runden bedeuten mehr Gelegenheiten, Punkte zu sammeln."}
                      </p>
                      <details>
                        <summary>Alle Spielregeln</summary>
                        <p>{g.rules}</p>
                      </details>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          {selection.length >= 40 && (
            <p role="status">
              Der Spielplan ist voll. Entferne ein Spiel, um ein anderes
              hinzuzufügen.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
