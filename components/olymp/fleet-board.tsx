"use client";
import { useEffect, useState } from "react";
import { Avatar } from "./art";
import { sound } from "@/lib/audio";
const lengths = [3, 2, 1];
type Ship = { cell: number; vertical: boolean };
export function FleetBoard({
  g,
  players,
  me,
  act,
}: {
  g: any;
  players: any[];
  me: string;
  act: (a: any) => void;
}) {
  const [ships, setShips] = useState<Ship[]>([]),
    [vertical, setVertical] = useState(false),
    [hover, setHover] = useState<number | null>(null),
    [selected, setSelected] = useState<number | null>(null),
    [tab, setTab] = useState("target");
  const p = g.mine,
    size = g.size,
    placement = g.stage === "placement",
    locked = p.submitted,
    selectedLength = lengths[ships.length] ?? 0;
  useEffect(() => {
    setShips([]);
    setSelected(null);
    setHover(null);
    setTab("target");
  }, [g.round]);
  useEffect(() => setSelected(null), [g.volley]);
  const cells = (s: Ship, len: number) =>
    Array.from({ length: len }, (_, k) => s.cell + k * (s.vertical ? size : 1));
  const canPlace = (cell: number) =>
    selectedLength > 0 &&
    (vertical
      ? Math.floor(cell / size) + selectedLength <= size
      : (cell % size) + selectedLength <= size) &&
    !ships.some((s, i) =>
      cells(s, lengths[i]).some((x) =>
        cells({ cell, vertical }, selectedLength).includes(x),
      ),
    );
  const preview =
    hover !== null && placement && selectedLength
      ? cells({ cell: hover, vertical }, selectedLength)
      : [];
  const coordinate = (cell: number) =>
    `${String.fromCharCode(65 + (cell % size))}${Math.floor(cell / size) + 1}`;
  const ownCells = p.ships?.length
    ? p.ships.flatMap((s: any) => s.cells)
    : ships.flatMap((s, i) => cells(s, lengths[i]));
  const ownHits = p.ships?.flatMap((s: any) => s.hits) ?? [];
  const mineShots = g.shots.filter((s: any) => s.id === me),
    last = g.reveal?.players?.find((s: any) => s.id === me);
  const grid = (own: boolean) => (
    <div className="ocean-map" style={{ "--sea-size": size } as any}>
      <div className="ocean-corner" />
      {Array.from({ length: size }, (_, x) => (
        <span className="ocean-axis" key={`x${x}`}>
          {String.fromCharCode(65 + x)}
        </span>
      ))}
      {Array.from({ length: size }, (_, y) => (
        <div className="ocean-map-row" key={y}>
          <span className="ocean-axis">{y + 1}</span>
          {Array.from({ length: size }, (_, x) => {
            const cell = y * size + x,
              shot = mineShots.find((s: any) => s.cell === cell),
              ship = ownCells.includes(cell),
              hit = own ? ownHits.includes(cell) : shot?.hits > 0;
            const marker = own
              ? hit
                ? "✹"
                : ship
                  ? "▰"
                  : ""
              : shot
                ? hit
                  ? "✹"
                  : "·"
                : selected === cell
                  ? "⊕"
                  : "";
            return (
              <button
                type="button"
                key={`${cell}:${g.stage === "volleyReveal" ? g.volley : "aim"}`}
                aria-label={`${own ? "Eigene Flotte" : "Zielkarte"} ${coordinate(cell)}${ship && own ? ", Schiff" : ""}${shot && !own ? `, ${shot.hits ? "Treffer" : "Wasser"}` : ""}`}
                className={`ocean-cell ${own && ship ? "ship-cell" : ""} ${hit ? "hit-cell" : ""} ${shot && !own && !hit ? "water-cell" : ""} ${!own && selected === cell ? "target-cell" : ""} ${g.stage === "volleyReveal" && g.reveal?.players?.some((s: any) => s.cell === cell) ? "fresh-impact" : ""} ${placement && preview.includes(cell) ? (canPlace(hover!) ? "preview-valid" : "preview-invalid") : ""}`}
                disabled={
                  (own && !placement) ||
                  locked ||
                  g.stage === "volleyReveal" ||
                  (!placement && !!shot) ||
                  (placement && ships.length === 3)
                }
                onPointerEnter={() => placement && setHover(cell)}
                onPointerLeave={() => placement && setHover(null)}
                onFocus={() => placement && setHover(cell)}
                onClick={() => {
                  if (placement) {
                    if (canPlace(cell)) {
                      setShips([...ships, { cell, vertical }]);
                      sound.play("card");
                    } else {
                      setHover(cell);
                    }
                  } else setSelected(cell);
                }}
              >
                {marker}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
  return (
    <div
      className={`fleet-board ${g.stage === "volleyReveal" ? "salvo-impact" : ""}`}
    >
      <div className="fleet-heading">
        <span className="eyebrow">
          {placement
            ? "01 · DEINE GEHEIME FLOTTE"
            : `02 · SALVE ${g.volley} VON ${g.maxVolleys}`}
        </span>
        <h2>
          {placement
            ? "Bring deine Schiffe in Sicherheit."
            : g.stage === "volleyReveal"
              ? "Die Salve schlägt ein."
              : locked
                ? "Ziel gesichert."
                : "Wo versteckt sich die Beute?"}
        </h2>
        <p>
          {placement
            ? "Platziere drei Schiffe. Nur du siehst ihre Positionen."
            : "Ein Schuss trifft alle Gegner auf diesem Feld. Deine eigene Flotte bleibt sicher."}
        </p>
      </div>
      {placement ? (
        <>
          <div className="ship-dock">
            {lengths.map((len, i) => (
              <div
                key={len}
                className={
                  ships.length > i
                    ? "placed"
                    : ships.length === i
                      ? "current"
                      : ""
                }
              >
                <span>
                  {Array.from({ length: len }, (_, k) => (
                    <i key={k} />
                  ))}
                </span>
                <strong>{["Frachter", "Schnellboot", "Kutter"][i]}</strong>
                <small>
                  {ships.length > i
                    ? "✓ Platziert"
                    : `${len} ${len === 1 ? "Feld" : "Felder"}`}
                </small>
              </div>
            ))}
          </div>
          <div className="placement-tools">
            <button
              disabled={locked || ships.length === 3}
              onClick={() => setVertical(!vertical)}
            >
              {vertical ? "↕ Senkrecht" : "↔ Waagerecht"} <small>Drehen</small>
            </button>
            <button
              disabled={locked || !ships.length}
              onClick={() => setShips(ships.slice(0, -1))}
            >
              ↶ Letztes Schiff zurück
            </button>
            <button
              disabled={locked}
              onClick={() => {
                setShips([
                  { cell: 0, vertical: false },
                  { cell: size * 2 + 2, vertical: false },
                  { cell: size * 4 + 4, vertical: false },
                ]);
                sound.play("confirm");
              }}
            >
              Schnell platzieren
            </button>
          </div>
          {grid(true)}
          <p className="fleet-hint">
            {locked
              ? "✓ Flotte bestätigt · warte auf die Crew"
              : ships.length === 3
                ? "Alles an Bord! Bestätige deine Flotte."
                : `Jetzt: ${["Frachter", "Schnellboot", "Kutter"][ships.length]} · ${selectedLength} ${selectedLength === 1 ? "Feld" : "Felder"}. Klicke das erste Feld.`}
          </p>
          <button
            className="primary wide"
            disabled={locked || ships.length !== 3}
            onClick={() => act({ type: "place", ships })}
          >
            {locked
              ? "✓ Flotte startklar"
              : `Flotte bestätigen · ${ships.length}/3`}
          </button>
        </>
      ) : (
        <>
          <div className="fleet-tabs" role="tablist" aria-label="Seekarten">
            <button
              role="tab"
              aria-selected={tab === "target"}
              onClick={() => setTab("target")}
            >
              ⊕ Zielkarte
            </button>
            <button
              role="tab"
              aria-selected={tab === "own"}
              onClick={() => setTab("own")}
            >
              ▰ Meine Flotte <small>{g.remaining[me]} intakt</small>
            </button>
          </div>
          {g.stage === "volleyReveal" ? (
            <div className="salvo-result" key={g.volley}>
              <strong>
                {last?.hits
                  ? `${last.hits} Treffer${last.sunk ? ` · ${last.sunk} versenkt!` : "!"}`
                  : last?.missed
                    ? "Kein Schuss abgegeben."
                    : "Diesmal nur Wasser."}
              </strong>
              <span>
                {last?.hits
                  ? `+${(last.loot ?? 0).toLocaleString("de-DE")} Beute`
                  : "Nächste Salve, nächste Chance."}
              </span>
            </div>
          ) : (
            <div className="fire-panel">
              <span>
                {locked
                  ? `✓ Schuss auf ${coordinate(p.shot)} bereit`
                  : selected === null
                    ? "Wähle ein Feld auf der Zielkarte."
                    : `Ziel: ${coordinate(selected)}`}
              </span>
              <button
                className="primary"
                disabled={locked || selected === null || tab !== "target"}
                onClick={() =>
                  selected !== null && act({ type: "shoot", cell: selected })
                }
              >
                {locked ? "Warte auf die Crew" : "⊕ Schuss bestätigen"}
              </button>
            </div>
          )}
          {grid(tab === "own")}
          {g.stage === "volleyReveal" && (
            <div className="salvo-ledger" aria-label="Ergebnisse dieser Salve">
              <strong>Die Salve der Crew</strong>
              {g.reveal?.players?.map((row: any) => (
                <div key={row.id} className={row.hits ? "salvo-hit" : ""}>
                  <span>
                    {players.find((x) => x.id === row.id)?.name ?? "Spieler"}
                  </span>
                  <b>{row.missed ? "—" : coordinate(row.cell)}</b>
                  <span>
                    {row.hits
                      ? `${row.hits} Treffer${row.sunk ? ` · ${row.sunk} versenkt` : ""}`
                      : row.missed
                        ? "Kein Schuss"
                        : "Wasser"}
                  </span>
                  <strong>
                    +
                    {row.loot.toLocaleString("de-DE", {
                      maximumFractionDigits: 1,
                    })}
                  </strong>
                </div>
              ))}
            </div>
          )}
          <div className="sea-key">
            <span>
              <i className="key-ship" />
              Eigenes Schiff
            </span>
            <span>
              <i className="key-hit" />
              Treffer
            </span>
            <span>
              <i className="key-water" />
              Wasser
            </span>
            <span>
              <i className="key-target" />
              Dein Ziel
            </span>
          </div>
          <div className="fleet-crew">
            {players
              .filter((x) => g.remaining[x.id] !== undefined)
              .map((x) => (
                <div key={x.id}>
                  <Avatar avatar={x.avatar} look={x.look} color={x.color} />
                  <strong>{x.id === me ? "Du" : x.name}</strong>
                  <span>{g.remaining[x.id]} Schiffe</span>
                  <b>
                    {(g.scores[x.id] ?? 0).toLocaleString("de-DE", {
                      maximumFractionDigits: 1,
                    })}
                    <small> Beute</small>
                  </b>
                </div>
              ))}
          </div>
          <p className="muted fleet-scoring">
            Treffer: 10 Beute · versenktes Schiff: +25 · gleichzeitige Treffer
            teilen die Beute.
          </p>
        </>
      )}
    </div>
  );
}
