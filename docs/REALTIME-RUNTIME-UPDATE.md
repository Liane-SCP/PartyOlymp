# Gezieltes Update der lokalen Multiplayer-Runtime

Die lokale Vorschau verwendet jetzt `workerd 1.20261012.1`. `package.json` legt die Version über einen Override fest; `package-lock.json` pinnt die Runtime und ihre fünf Plattformpakete einschließlich Integritätswerten. Wrangler 4.92.0, Cloudflare-Vite-Plugin 1.37.1, Workers-Typen 4.20260515.1 und alle übrigen bisherigen Paketversionen bleiben erhalten. Das Kompatibilitätsdatum bleibt `2026-05-15` mit `nodejs_compat`.

Der Ausgangsbefund steht in [REALTIME-RUNTIME.md](REALTIME-RUNTIME.md). Dort reagierten Clients teilweise sauber auf Close, während workerd trotzdem die zugehörigen Anfragen als hängend meldete. Die Bewertung muss deshalb Client-Abschluss und Runtime-Ausgabe gemeinsam prüfen.

## Versionsvergleich und Auswahl

`scripts/check-realtime-half-open.mjs` untersucht eine isolierte Echo-Anwendung ohne Party Olymp, D1 oder Framework. Pro Variante laufen zwölf Fälle: clientseitiger Abschluss, Abschluss ohne angegebenen Code, serverseitiger Abschluss sowie Abschluss bei noch ausstehender Antwort, jeweils dreifach. Getestet werden automatische Antwort, expliziter Half-open-Modus mit manueller Antwort und das ältere Kompatibilitätsdatum mit manueller Antwort. Die Runtime-Ausgabe wird direkt aus stdout und stderr erfasst.

| Kombination | Abschlussfälle | Hängende Anfragen | Asset-Auslieferung |
|---|---:|---:|---|
| Bisherige Runtime 1.20260515.1 | 36 | 18 | bisheriger funktionierender Stand |
| Separat geprüfte Runtime 1.20261018.1 | 36 | 0 | CSS, JavaScript und Modelle teilweise HTTP 500; verworfen |
| Gezielte Runtime 1.20261012.1 mit bisheriger SDK | 36 | 0 | 19 geprüfte Dateien mit HTTP 200 und identischen Build-Bytes |

Die erste Zeile stammt aus `outputs/qa/realtime-half-open.json`; die finale dritte Zeile aus `outputs/qa/realtime-targeted-minimal.json`. Der vollständige Versionsvergleich schließt saubere Client-Codes allein ausdrücklich als ausreichenden Beleg aus. Die vier zusätzlichen Fälle des ursprünglichen Diagnoseskripts bestehen ebenfalls ohne Hang-Meldungen (`outputs/qa/realtime-targeted-legacy-probe.json`).

Die Dokumentation beschreibt die automatische Close-Antwort ab dem entsprechenden Kompatibilitätsdatum sowie den [Half-open-Modus](https://developers.cloudflare.com/changelog/post/2026-04-07-websocket-auto-reply-to-close/). Beide wurden explizit geprüft. Das ältere [workerd-Issue 2569](https://github.com/cloudflare/workerd/issues/2569) liefert den Kontext für den ursprünglichen Fehler; für diese Änderung sind die eigenen Vorher-/Nachher-Ergebnisse maßgeblich.

Ein zwischenzeitlicher größerer SDK-Versuch wurde zurückgenommen. Der finale Lockfile-Diff verändert nur die sechs workerd-Pakete. Auch die bei diesem Versuch mitaufgelösten esbuild-/Hilfspaket-Updates wurden entfernt. Es gibt keine Änderung an `lib/realtime.ts`, dem WebSocket-Protokoll, der Raumauthentifizierung oder der Wertungslogik.

## Asset- und Anwendungsprüfungen

Der Asset-Check prüft die tatsächliche lokale HTTP-Auslieferung aller im Einstieg referenzierten CSS-/JavaScript-Dateien sowie ausgewählter Modelle und des Favicons. Er vergleicht SHA-256-Werte mit `dist/client` und prüft erwartete MIME-Typen. Alle 19 Dateien bestehen (`outputs/qa/realtime-targeted-assets.json`). Damit reicht weder ein erfolgreiches HTML-Dokument noch ein stilles Runtime-Protokoll als vermeintlicher Beleg für eine funktionierende Seite.

Der strenge Anwendungscheck besteht mit 21 Verbindungen über die echte lokale HTTP-/D1-/WebSocket-Strecke: Abschluss vor Anmeldung, nach Snapshot, unmittelbar nach zusätzlicher Frame-Anfrage, ungültige Anmeldung und Anmeldefrist. Alle Client-Abschlüsse sind sauber. Normale Verbindungen enden mit Code 1000, die vorgesehenen Anmeldeabbrüche mit 1008. Der gleichzeitig ausgewertete Runtime-Log weist null neue Hang-Meldungen aus. Bericht: `outputs/qa/realtime-targeted-close.json`.

Die vollständige Zweierpartie mit dreizehn Zügen, Wiederbeitritt in Zug 6, Aktionswiederholung, Zurückweisung alter Züge, interaktivem Blattvergleich und Gesamtwertung besteht über echte Browser-WebSockets in 109,102 Sekunden. Die Endwerte betragen 26/43; ein Historieneintrag wird gespeichert. Die Browser bei 1440 und 390 Pixeln bestätigen alle 72 beziehungsweise 65 Aktionen und melden keine Fehler. Bericht: `outputs/qa/realtime-targeted-dice-live.json`. Dies ist eine lokale Zweierprüfung, keine vollständige Spiel- oder Gesamtabnahme.

## Fehlerüberwachung und Grenzen

Nach Browserabbau und Beendigung der Vorschau besteht die abschließende Protokollprüfung ohne Fehlermarker (`outputs/qa/realtime-targeted-runtime-audit.json`). Build, Typprüfung und alle 22 Engine-Tests bestehen ebenfalls auf dem finalen Paketstand.

`scripts/audit-runtime-log.mjs` wertet die tatsächlich gespeicherte Ausgabe auf Request-Hangs, verlorene Netzwerkverbindungen, ungefangene Fehler und Fehlermarker aus. Die historische Log-Gegenprobe mit sechs tatsächlichen Hang-Meldungen wird korrekt abgewiesen (`outputs/qa/realtime-runtime-audit-baseline.json`). Die finale Ausgabe muss nach Browserabbau und Vorschauende separat geprüft werden. Eine leere Logdatei allein beweist keine funktionierende Anwendung; HTTP-, Socket- und Browsernachweise bleiben erforderlich.

Ein zusätzlich erprobter nie aufgelöster HTTP-Handler wurde nicht als WebSocket-Kontrollfall verwendet: Sein Fehler wurde als HTTP-500-Antwort abgefangen und besitzt einen anderen Fehlerpfad. Die wiederholten ursprünglichen WebSocket-Fälle und die historische tatsächliche Runtime-Ausgabe bilden den Vergleich.

Build, Typprüfung und Engine-Tests werden auf dem finalen Paketstand durchgeführt. Geprüft wird Windows x64 mit Node 22.16.0. Die anderen Plattform-Binärpakete, physische Mobilgeräte, Prozessspeicher über lange Sitzungen, Paketverlust, alle echten Gruppengrößen und die komplette gemischte Olympiade sind hiermit nicht abgenommen. Die gehostete Cloudflare-Runtime wird nicht durch das lokale npm-Paket festgelegt. Gehostete Schlussabnahme und Veröffentlichung bleiben offen. Der Gesamtauftrag umfasst weiterhin alle 21 Disziplinen, Reise, Figuren, Sound und Performance.
