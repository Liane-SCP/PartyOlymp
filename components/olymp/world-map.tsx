"use client";
import { useEffect, useId, useRef, useState } from "react";
import { mapPoint, mapLocation, wrappedDelta } from "@/lib/game/map-math";
export type MapPin = {
  playerId?: string;
  lat: number;
  lon: number;
  color?: string;
  label?: string;
};
export function WorldMap({
  pin,
  onPin,
  pins = [],
  target,
  onHighlight,
}: {
  pin?: MapPin | null;
  onPin?: (p: MapPin) => void;
  pins?: MapPin[];
  target?: MapPin;
  onHighlight?: (pin: MapPin | null) => void;
}) {
  const [view, setView] = useState({ lat: 20, lon: 0, zoom: 1 }),
    [size, setSize] = useState({ w: 0, h: 0 }),
    [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0),
    [selectedPin, setSelectedPin] = useState<number | null>(null);
  const pickerId = useId();
  const highlightCallback = useRef(onHighlight);
  highlightCallback.current = onHighlight;
  const highlightedPlayer = selectedPin === null ? null : pins[selectedPin]?.playerId;
  useEffect(() => { highlightCallback.current?.(selectedPin === null ? null : pins[selectedPin] ?? null); }, [selectedPin, highlightedPlayer, target?.lat, target?.lon]);
  const ref = useRef<HTMLDivElement>(null),
    live = useRef({ view, size, onPin }),
    drag = useRef<{
      x: number;
      y: number;
      center: { x: number; y: number };
      moved: boolean;
    } | null>(null);
  live.current = { view, size, onPin };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const resize = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      if (w <= 0 || h <= 0) return;
      setSize(previous => previous.w === w && previous.h === h ? previous : { w, h });
    });
    resize.observe(el);
    return () => resize.disconnect();
  }, []);
  const zoomAt = (delta: number, x = size.w / 2, y = size.h / 2) => {
    setView((v) => {
      const z = Math.max(0, Math.min(19, v.zoom + delta));
      const center = mapPoint(v.lat, v.lon, v.zoom),
        factor = 2 ** (z - v.zoom);
      return {
        ...mapLocation(
          (center.x + x - size.w / 2) * factor - x + size.w / 2,
          (center.y + y - size.h / 2) * factor - y + size.h / 2,
          z,
        ),
        zoom: z,
      };
    });
  };
  const zoomRef = useRef(zoomAt);
  zoomRef.current = zoomAt;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = 0;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Date.now() - last < 130) return;
      last = Date.now();
      const box = el.getBoundingClientRect();
      zoomRef.current(
        e.deltaY < 0 ? 1 : -1,
        e.clientX - box.left,
        e.clientY - box.top,
      );
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);
  function fit() {
    const points = [...(target ? [target] : []), ...pins];
    if (!points.length) {
      setView({ lat: 20, lon: 0, zoom: 1 });
      return;
    }
    const anchor = mapPoint(points[0].lat, points[0].lon, 0),
      projected = points.map((p) => {
        const q = mapPoint(p.lat, p.lon, 0);
        return { x: anchor.x + wrappedDelta(q.x, anchor.x, 256), y: q.y };
      });
    const xs = projected.map((p) => p.x),
      ys = projected.map((p) => p.y),
      minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const z = Math.max(
      0,
      Math.min(
        15,
        Math.floor(
          Math.log2(
            Math.min(
              (size.w - 80) / Math.max(0.008, maxX - minX),
              (size.h - 80) / Math.max(0.008, maxY - minY),
            ),
          ),
        ),
      ),
    );
    setView({
      ...mapLocation((minX + maxX) / 2, (minY + maxY) / 2, 0),
      zoom: z,
    });
  }
  const initialFit = useRef(false);
  useEffect(() => {
    if (target && !initialFit.current && size.w > 0) {
      initialFit.current = true;
      fit();
    }
  }, [target?.lat, target?.lon, size.w]);
  useEffect(() => setSelectedPin(null), [target?.lat, target?.lon]);
  const center = mapPoint(view.lat, view.lon, view.zoom),
    world = 256 * 2 ** view.zoom,
    left = center.x - size.w / 2,
    top = center.y - size.h / 2,
    tiles = [];
  for (
    let y = Math.max(0, Math.floor(top / 256));
    y <= Math.min(2 ** view.zoom - 1, Math.floor((top + size.h) / 256));
    y++
  )
    for (
      let x = Math.floor(left / 256);
      x <= Math.floor((left + size.w) / 256);
      x++
    ) {
      const wrapped = ((x % 2 ** view.zoom) + 2 ** view.zoom) % 2 ** view.zoom;
      tiles.push({ x, y, wrapped });
    }
  const position = (p: MapPin) => {
    const q = mapPoint(p.lat, p.lon, view.zoom);
    return {
      x: wrappedDelta(q.x, center.x, world) + size.w / 2,
      y: q.y - center.y + size.h / 2,
    };
  };
  const meters =
      (156543.03392 * Math.cos((view.lat * Math.PI) / 180)) / 2 ** view.zoom,
    base = 10 ** Math.floor(Math.log10(meters * 90)),
    distance =
      [1, 2, 5, 10]
        .map((n) => n * base)
        .filter((n) => n <= meters * 100)
        .at(-1) ?? base;
  return (
    <div className="world-map detailed-map">
      <div className="map-toolbar">
        <strong>
          {target
            ? "Eure Tipps im Vergleich"
            : pin && !onPin
              ? "Dein gesicherter Ort"
              : "Ort finden · Straßenkarte"}
        </strong>
        <button
          aria-label="Karte vergrößern"
          disabled={view.zoom === 19}
          onClick={() => zoomAt(1)}
        >
          +
        </button>
        <button
          aria-label="Karte verkleinern"
          disabled={view.zoom === 0}
          onClick={() => zoomAt(-1)}
        >
          −
        </button>
        <button onClick={() => setView({ lat: 20, lon: 0, zoom: 0 })}>
          Welt
        </button>
        {pin && (
          <button
            onClick={() => setView({ ...pin, zoom: Math.max(12, view.zoom) })}
          >
            Mein Pin
          </button>
        )}
        {target && <button onClick={() => { setSelectedPin(null); fit(); }}>Alle Tipps</button>}
      {target && pins.length > 0 && (
        <div className="map-guess-picker">
          <label htmlFor={pickerId}>Tipp auf der Karte hervorheben</label>
            <select id={pickerId} value={selectedPin ?? "all"} onChange={e => setSelectedPin(e.target.value === "all" ? null : Number(e.target.value))}>
              <option value="all">Alle Spieler</option>
              {pins.map((p, i) => <option key={i} value={i}>{p.label ?? `Tipp ${i + 1}`}</option>)}
            </select>
          {selectedPin !== null && pins[selectedPin] && <p role="status"><i style={{ background: pins[selectedPin].color ?? "#bcff5c" }} aria-hidden="true" />{pins[selectedPin].label ?? `Tipp ${selectedPin + 1}`}</p>}
        </div>
      )}
      </div>
      <div
        ref={ref}
        className="street-map"
        tabIndex={0}
        role="application"
        aria-label={onPin?"Detaillierte Weltkarte mit Straßen und Ortsnamen. Ziehen verschiebt, Mausrad oder Plus zoomt. Klicken setzt einen Pin. Pfeiltasten verschieben, Enter setzt einen Pin in der Mitte.":"Detaillierte Weltkarte mit Straßen und Ortsnamen. Ziehen oder Pfeiltasten verschieben, Mausrad oder Plus zoomt. Veröffentlichte Tipps lassen sich im Auswahlfeld hervorheben."}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            center: mapPoint(view.lat, view.lon, view.zoom),
            moved: false,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) d.moved = true;
          if (d.moved)
            setView((v) => ({
              ...mapLocation(
                d.center.x - e.clientX + d.x,
                d.center.y - e.clientY + d.y,
                v.zoom,
              ),
              zoom: v.zoom,
            }));
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          if (d && !d.moved && onPin) {
            const b = e.currentTarget.getBoundingClientRect();
            onPin(
              mapLocation(
                center.x + e.clientX - b.left - size.w / 2,
                center.y + e.clientY - b.top - size.h / 2,
                view.zoom,
              ),
            );
          } else if (d && !d.moved && target) {
            const b = e.currentTarget.getBoundingClientRect(),
              x = e.clientX - b.left, y = e.clientY - b.top,
              nearest = pins.map((p, index) => {
                const q = position(p);
                return { index, distance: Math.hypot(q.x - x, q.y - y) };
              }).sort((a, b) => a.distance - b.distance)[0];
            setSelectedPin(nearest && nearest.distance <= 14 ? nearest.index : null);
          }
          drag.current = null;
        }}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onPin) {
            e.preventDefault();
            onPin({ lat: view.lat, lon: view.lon });
          } else if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            zoomAt(1);
          } else if (e.key === "-") {
            e.preventDefault();
            zoomAt(-1);
          } else if (e.key.startsWith("Arrow")) {
            e.preventDefault();
            setView((v) => ({
              ...mapLocation(
                center.x +
                  (e.key === "ArrowLeft"
                    ? -100
                    : e.key === "ArrowRight"
                      ? 100
                      : 0),
                center.y +
                  (e.key === "ArrowUp"
                    ? -100
                    : e.key === "ArrowDown"
                      ? 100
                      : 0),
                v.zoom,
              ),
              zoom: v.zoom,
            }));
          }
        }}
      >
        <div className="map-tiles" aria-hidden="true">
          {tiles.map((t) => (
            <img
              draggable={false}
              key={`${view.zoom}:${t.x}:${t.y}:${retry}`}
              src={`https://tile.openstreetmap.org/${view.zoom}/${t.wrapped}/${t.y}.png`}
              referrerPolicy="strict-origin-when-cross-origin"
              alt=""
              width={256}
              height={256}
              onError={() => setFailed(true)}
              style={{ left: t.x * 256 - left, top: t.y * 256 - top }}
            />
          ))}
        </div>
        <svg
          className="map-pin-layer"
          width={size.w}
          height={size.h}
          aria-hidden="true"
        >
          {target &&
            pins.map((p, i) => {
              const a = position(p),
                b = position(target);
              return (
                <line
                  key={i}
                  data-guess-route={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={p.color ?? "#bcff5c"}
                  strokeWidth={selectedPin === i ? 3 : 2}
                  opacity={selectedPin === null || selectedPin === i ? 1 : 0.2}
                  strokeDasharray="5 5"
                />
              );
            })}
          {[
            ...pins,
            ...(pin ? [{ ...pin, color: "#bcff5c", label: "Dein Tipp" }] : []),
            ...(target
              ? [{ ...target, color: "#ff755e", label: "Gesuchter Ort" }]
              : []),
          ].map((p, i) => {
            const q = position(p);
            return (
              <g key={i} data-map-pin={i} data-highlighted={i === selectedPin} transform={`translate(${q.x},${q.y})`}>
                <circle
                  r={target && i === pins.length + (pin ? 1 : 0) ? 9 : i === selectedPin ? 10 : 7}
                  fill={p.color ?? "#bcff5c"}
                  stroke="#122037"
                  strokeWidth={2}
                />
                <title>{p.label ?? "Tipp"}</title>
                {p.label && (!target || i >= pins.length) && (
                  <text
                    y={-13}
                    textAnchor="middle"
                    stroke="#fff"
                    strokeWidth={3}
                    paintOrder="stroke"
                    fill="#15243a"
                    fontSize={11}
                    fontWeight={700}
                  >
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <span className="map-center" aria-hidden="true">
          +
        </span>
        <div className="map-scale-bar" style={{ width: distance / meters }}>
          {distance >= 1000 ? `${distance / 1000} km` : `${distance} m`}
        </div>
        <a
          className="map-attribution"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          © OpenStreetMap-Mitwirkende
        </a>
      </div>
      <div className="map-help">
        {failed ? (
          <span role="status">
            Einige Kartendetails fehlen.{" "}
            <button
              onClick={() => {
                setFailed(false);
                setRetry((n) => n + 1);
              }}
            >
              Erneut laden
            </button>
          </span>
        ) : (
          <span>
            {onPin ? 'Zoomen bis zur Straße · Ziehen zum Verschieben · Klick setzt den Pin' : 'Zoomen bis zur Straße · Ziehen zum Verschieben · Tipps ansehen'}
          </span>
        )}
        <span>Zoom {view.zoom}/19</span>
      </div>
    </div>
  );
}
