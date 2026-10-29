"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Wifi } from "lucide-react";

export function ConnectionStatus({ connection, updatedAt, rejoinUntil, now, error, reconnect }: {
  connection: string;
  updatedAt: number;
  rejoinUntil?: number;
  now: number;
  error: string;
  reconnect: () => void;
}) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  const fresh = updatedAt > 0 && Date.now() - updatedAt < 6000;
  const online = !offline && connection === "online" && fresh;
  const remaining = rejoinUntil === undefined ? null : Math.max(0, Math.ceil((rejoinUntil - now) / 1000));
  const label = online ? "Verbunden" : offline ? "Du bist offline" : "Verbindung wird wiederhergestellt";
  return (
    <details className="party-connection" data-connected={online} onKeyDown={(event) => {
      if (event.key !== "Escape" || event.nativeEvent.isComposing || !event.currentTarget.open) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.open = false;
      event.currentTarget.querySelector("summary")?.focus({ preventScroll: true });
    }} onBlur={(event) => {
      if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
    }}>
      <summary aria-label={label} title={label}>
        <Wifi size={15} aria-hidden="true" />
        <span>{label}</span>
      </summary>
      <div className="party-connection-detail">
        <strong>{label}</strong>
        <p>{online
          ? "Dein Spielstand ist aktuell."
          : offline
            ? "Sobald dein Gerät wieder online ist, verbindet sich die Seite automatisch."
            : "Die Seite verbindet sich automatisch und lädt den aktuellen Spielstand nach."}</p>
        {!online && remaining !== null && <p>{remaining > 0
          ? <>Verbleibende Wiederbeitrittsfrist: <strong>{remaining} s</strong>.</>
          : "Die angezeigte Wiederbeitrittsfrist ist abgelaufen. Nach der Verbindung zeigt der Server deinen aktuellen Platz."}</p>}
        {!online && error && <p className="party-connection-error">{error}</p>}
        {!online && <button type="button" className="secondary" disabled={offline} onClick={reconnect}><RotateCcw size={15} /> Erneut verbinden</button>}
        {!online && <small>Die Partie und ihre Zeitlimits laufen weiter.</small>}
      </div>
    </details>
  );
}
