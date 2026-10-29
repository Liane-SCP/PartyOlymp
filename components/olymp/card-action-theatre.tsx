"use client";
import { Avatar } from "./art";

const colors = ["#ff7b9d", "#56d9ff", "#bcff5c", "#ffb85c", "#9b8aff"];
export const cardSymbol = (card: any) =>
  !card
    ? "✦"
    : card.value < 10
      ? String(card.value)
      : ["⊘", "⇄", "+2", "✦", "+4"][card.value - 10];
export function describeMove(move: any, name: (id: string) => string) {
  if (!move) return "Die erste Karte liegt. Los geht’s!";
  const actor = name(move.player),
    target = name(move.target);
  if (move.kind !== "play")
    return `${actor} zieht eine Karte${move.kind === "timeout" ? " (Zeit abgelaufen)" : ""}.`;
  if (move.card?.value === 10) return `${actor} setzt ${target} aus.`;
  if (move.card?.value === 11)
    return `${actor} dreht die Spielrichtung um${move.target ? " · " + target + " setzt aus" : ""}.`;
  if (move.card?.value === 12 || move.card?.value === 14)
    return `${actor} spielt ${cardSymbol(move.card)} · ${target} zieht ${move.count} und setzt aus.`;
  return move.card?.color === 4
    ? `${actor} wünscht sich diese Farbe:`
    : `${actor} legt eine ${cardSymbol(move.card)}.`;
}
export function CardActionTheatre({
  g,
  players,
  now,
}: {
  g: any;
  players: any[];
  now: number;
}) {
  const name = (id:string) => players.find((p:any)=>p.id===id)?.name??'Spieler';
  const recent=g.lastMove??g.moves?.at(-1),age=now-Number(recent?.at??-Infinity),current=age>=0&&age<1200?recent:null;
  const move = current ?? g.lastMove,
    actor = players.find((p) => p.id === move?.player),
    target = players.find(
      (p) =>
        p.id ===
        (move?.target ?? (move?.kind !== "play" ? move?.player : move?.next)),
    );
  return (
    <section
      className={`card-action-theatre ${current ? "is-replaying" : ""}`}
      aria-label="Letzte Kartenaktion"
    >
      <div className="card-action-scene" key={move?.id ?? "start"}>
        <div className="card-action-person">
          <Avatar
            avatar={actor?.avatar}
            look={actor?.look}
            color={actor?.color}
          />
          <strong>{actor?.name ?? "Bereit?"}</strong>
          <small>{move?.kind === "play" ? "spielt" : "zieht"}</small>
        </div>
        <div
          className={`card-flight-lane ${move?.kind !== "play" ? "drawing" : ""}`}
        >
          <span className="flight-track">➜</span>
          <i
            className="flying-color-card"
            style={{ "--flying-color": colors[move?.card?.color ?? 4] } as any}
          >
            {cardSymbol(move?.card)}
          </i>
          {!!move?.count && move?.target && (
            <span className="draw-burst">+{move.count}</span>
          )}
        </div>
        <div className="card-action-person">
          {move?.target ? (
            <Avatar
              avatar={target?.avatar}
              look={target?.look}
              color={target?.color}
            />
          ) : (
            <span className="action-destination">
              {move?.card?.value === 11
                ? "⇄"
                : move?.kind === "play"
                  ? "▰"
                  : "✦"}
            </span>
          )}
          <strong>
            {move?.target
              ? target?.name
              : move?.kind === "play"
                ? "Ablage"
                : "Ziehstapel"}
          </strong>
          <small>
            {move?.target
              ? "setzt aus"
              : move?.card?.value === 11
                ? "Richtung gedreht"
                : "Kartenbewegung"}
          </small>
        </div>
      </div>
      <p role="status">
        {describeMove(move, name)}{" "}
        {move?.card?.color === 4 && (
          <i
            className="chosen-color-dot"
            style={{ background: colors[move.color] }}
            aria-label={["Koralle", "Blau", "Limette", "Orange"][move.color]}
          />
        )}
      </p>
      {!!g.moves?.length && (
        <details className="card-action-history">
          <summary>Die letzten {g.moves.length} Züge ansehen</summary>
          <ol>
            {[...g.moves].reverse().map((m: any) => (
              <li key={m.id}>
                <i
                  className="history-card"
                  style={{ background: colors[m.color ?? 4] }}
                >
                  {m.kind === "play" ? cardSymbol(m.card) : "+1"}
                </i>
                <span>
                  {describeMove(m, name)}{" "}
                  {m.card?.color === 4 && (
                    <i
                      className="chosen-color-dot"
                      style={{ background: colors[m.color] }}
                      aria-label={
                        ["Koralle", "Blau", "Limette", "Orange"][m.color]
                      }
                    />
                  )}
                  <small>Danach: {name(m.next)}</small>
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
