"use client";

import { raceFinishes } from "@/lib/race-presentation";

export function RaceFinishBoard({ room, me }: { room: any; me: string }) {
  const game = room.game;
  const finishes = raceFinishes(game);
  const own = finishes.find((finish) => finish.id === me);
  if (!own) return null;
  const tied = finishes.filter((finish) => finish.at === own.at).length > 1;
  const seconds = (stamp: number) => Math.max(0, (stamp - game.startedAt) / 1000)
    .toLocaleString("de-DE", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  return (
    <section className="race-finish-board" aria-label="Bestätigte Zieleinläufe">
      <header role="status" aria-atomic="true">
        <span>DEIN ZIELEINLAUF IST BESTÄTIGT</span>
        <strong>{tied ? "Gemeinsam auf " : ""}Platz {own.place}</strong>
        <p>{seconds(own.at)} s · {own.wpm} WPM</p>
      </header>
      <p>Schau der Crew beim Rennen zu.</p>
      <ol aria-label="Reihenfolge der Zieleinläufe" tabIndex={0}>
        {finishes.map((finish) => {
          const player = room.players.find((candidate: any) => candidate.id === finish.id);
          return (
            <li key={finish.id} className={finish.id === me ? "is-me" : undefined} value={finish.place}>
              <span className="race-finish-place" aria-label={`Platz ${finish.place}`}>{finish.place}</span>
              <strong title={player?.name ?? "Spieler"}>{player?.name ?? "Spieler"}{finish.id === me ? " · Du" : ""}</strong>
              <span>{seconds(finish.at)} s</span>
            </li>
          );
        })}
      </ol>
      <footer>{finishes.length} / {room.participantIds.length} Zieleinläufe bestätigt</footer>
    </section>
  );
}
