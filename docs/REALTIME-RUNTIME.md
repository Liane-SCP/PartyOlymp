# WebSocket-Abschluss: lokaler Runtime-Befund

Historischer Ausgangsbefund vom 18.10.2026. Das anschließende gezielte lokale Runtime-Update besteht die wiederholten Abschlussfälle und eine vollständige Zweier-Würfelpartie; siehe [REALTIME-RUNTIME-UPDATE.md](REALTIME-RUNTIME-UPDATE.md). Die folgenden Fehlernachweise beschreiben den vorherigen Paketstand. Gehostete und vollständige 21-Spiele-Abnahme bleiben offen.

Beim Schließen der Reise-Vorschau erschienen Meldungen über hängende Worker-Anfragen. Der Fehler tritt auch während des laufenden Servers nach einzelnen vom Client geschlossenen Verbindungen auf. Erfolgreiche Browseraktionen und ein sauberer WebSocket-Close beim Client belegen daher keine fehlerfrei abgeschlossene Worker-Anfrage.

## Isolierter Nachweis

`scripts/check-realtime-runtime.mjs` startet einen eigenen Miniflare mit zufälligem Port. Sein winziger Worker verwendet nur WebSocketPair, accept, eine Echo-Antwort und close. Party Olymp, Vinext, Authentifizierung, Timer, D1 und die Reiselogik sind nicht beteiligt. Die tatsächliche Runtime-Standardfehlerausgabe wird separat erfasst.

Lokal installiert: workerd `1.20260515.1`, Wrangler `4.92.0`, Kompatibilitätsdatum `2026-05-15`.

`outputs/qa/realtime-minimal-close.json` zeigt:

| Handler | Initiator | Client-Code / sauber | Hängende Runtime-Anfragen |
| --- | --- | --- | --- |
| automatischer Abschluss | Client | 1000 / ja | 1 |
| automatischer Abschluss | Server | 1000 / ja | 0 |
| zusätzlicher Close bei CLOSING | Client | 1000 / ja | 1 |
| zusätzlicher Close bei CLOSING | Server | 1000 / ja | 0 |

Der zusätzliche Close wurde auch im Anwendungscode erprobt. Er beseitigte die Meldungen nicht. Die Änderung wurde zurückgenommen. `lib/realtime.ts` behält seinen bisherigen Close-Handler; sein Diff ist leer. Es wurde keine unbelegte Laufzeitkorrektur übernommen und keine neue Infrastruktur eingeführt.

Der Anwendungsablauf lässt sich mit `scripts/check-realtime-close.mjs` prüfen: Abschluss vor Anmeldung, nach Snapshot, unmittelbar nach Frame-Anfrage, ungültige Anmeldung und Ablauf des Anmeldefensters. Mit `QA_WORKER_LOG` prüft das Skript zusätzlich neue Hang-Meldungen und schlägt bei diesen ausdrücklich fehl. Der Bericht des erfolglosen manuellen Versuchs liegt in `realtime-close-manual-attempt.json`; er ist kein grüner Nachweis.

Die abschließende Wiederholung mit unverändertem Anwendungscode liegt in `outputs/qa/realtime-close.json`: fünf von sieben Client-Abschlüssen sind sauber (normal 1000 beziehungsweise serverseitig 1008). Beide unmittelbar auf eine zusätzliche Frame-Anfrage folgenden Abschlüsse sind unsauber, Code 1006; die Runtime-Ausgabe enthält acht neue Hang-Meldungen. Derselbe Befund trat im manuellen Versuch auf. Dieser strenge Anwendungscheck bleibt ausdrücklich rot. Die isolierte Reproduktion beweist einen Runtime-Fehler bereits ohne Anwendung; sie beweist nicht, dass jeder zusätzliche Fehlerpfad der Anwendung damit vollständig erklärt oder behoben wäre.

## Einordnung und Grenze

Cloudflare dokumentiert den automatischen Close-Abschluss ab dem entsprechenden Kompatibilitätsdatum im [Changelog](https://developers.cloudflare.com/changelog/post/2026-04-07-websocket-auto-reply-to-close/). Im [workerd-Issue 2569](https://github.com/cloudflare/workerd/issues/2569) wird derselbe Request-Hang bei clientseitigem Abschluss auch mit automatischer Antwort berichtet. Das unterstützt die Einordnung als Runtime-Problem; entscheidend für unseren lokalen Befund bleibt die eigene isolierte Reproduktion.

Eine vollständige Lösung, Fehlerfreiheit auf der gehosteten Runtime und Langzeitstabilität sind damit nicht nachgewiesen. Der Punkt bleibt vor der abschließenden Mehrbrowser-/Gesamtabnahme offen. Die vorhandenen Teilstrecken-Nachweise in [JOURNEY-TRANSPORT.md](JOURNEY-TRANSPORT.md) bleiben gültig für dargestellte Reise, Zustand und Wiedereintritt, umfassen aber keinen sauberen Runtime-Abschluss.
