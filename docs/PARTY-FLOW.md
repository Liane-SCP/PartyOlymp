# Gemeinsamer Party-Ablauf

Stand: 22.10.2026. Diese Überarbeitung betrifft die Spielregie und Bedienung der gesamten Olympiade. Die eigenständigen Minispiele, Wertungsregeln und Schauplätze bleiben erhalten.

## Verbindlicher Rhythmus

| Phase | Aufgabe | Sichtbare Bedienung |
| --- | --- | --- |
| Lobby | Freunde sammeln, Auswahl verstehen | Reihenfolge, Einladungslink, Teilnahme, Bereitschaft; Gastgeber ändert den Plan und startet |
| Reise | Gemeinsam am nächsten Spielort ankommen | Automatische Kamerafahrt, Spielname und knapper Hinweis; keine Werkzeugsammlung |
| Einführung | Ziel und eigene Aktion verstehen | So spielst du, so gewinnst du, Format, optionale vollständige Regeln und Relikte, Bereitschaft |
| Countdown | Gemeinsamer Start | Spielname und 3–2–1 |
| Minispiel | Aktuelle Entscheidung treffen | Spielname, Runde, relevante Zeit, eigene Aktion; zusätzliche Spielstände aufklappbar |
| Spielergebnis | Leistung und verdiente Punkte verstehen | Ergebnis am zugehörigen Spielort, anschließend Olympiadenpunkte |
| Gesamtwertung | Folgen für die gemeinsame Reise erkennen | Rangfolge, nächstes Spiel; Gastgeber kann weitergehen oder pausieren |
| Pause | Durchatmen und Welt ansehen | Erkundbare Karte, Wertung, Fortsetzen durch den Gastgeber |
| Finale | Gemeinsamen Abschluss feiern | 3D-Siegerehrung; Ergebnisse und Revanche auf Wunsch einblenden |

## Entscheidungen

- Der sichtbare Spielplan ist verbindlich. Keine Disziplin-Roulette, keine nachträgliche Umsortierung und keine heimlich ergänzten Spiele. Vorlagen werden vor der Anzeige kuratiert; manuelle Reihenfolgen bleiben exakt erhalten. Tatsächliche zufällige Themenentscheidungen innerhalb eines Minispiels bleiben Teil dessen Regeln.
- Änderungen an einer bestätigten Auswahl setzen die Bereitschaft aller Spieler zurück. Ein identisches erneutes Speichern tut das nicht.
- Die Inselkarte gehört zur Reise und zur Pause. Im Minispiel gibt es weder einen Kartenknopf noch einen versteckten Karten-Renderer; auch der Server lehnt dort Laufaktionen ab.
- Relikte sind eine bewusste optionale Entscheidung vor dem Spiel. Vorrat, Bonus und ausstehende Schatztruhen stehen gemeinsam bei der Einführung, ohne eine zusätzliche Pflichtphase.
- Die Welt bleibt auf Desktop bildschirmfüllend. Texte liegen direkt darüber; nur Formulare, längere Inhalte und Menüs brauchen eigene Flächen. Nebensächliche Duplikate, permanente Emote-Leisten und technische Hinweise treten zurück.
- Grafik, Lautstärke, Bewegung, Credits, Wertungshilfe und Verlassen liegen zentral in den Einstellungen. Ein Settings-Menü pausiert kein laufendes Mehrspielerspiel.
- Weltreise trennt Panorama und präzise Kartenabgabe in zwei eindeutige Ansichten. Codeknacker priorisiert den aktuellen Versuch; vergangene Versuche und Mitspieler stehen dahinter. Bei Kartenspielen sind die eigene Hand und der aktuelle Zug wichtiger als wiederholte Ablage- und Replay-Ansichten.
- Reaktionen bleiben eine einzelne optionale Schaltfläche. Während Zeitgefühl sind sie auch serverseitig gesperrt.

## Gemeinsame Zeitbasis und bestehende Räume

`lib/game/party-flow.ts` enthält die Zeitvorgaben: erste Ankunft 3,5 Sekunden, weitere Reise 6,5 Sekunden, Einführung höchstens 45 Sekunden, Countdown 3 Sekunden, Ergebnis und Zwischenwertung jeweils 12 Sekunden. Alle bereiten Spieler verkürzen die Einführung; der Gastgeber kann die Zwischenwertung überspringen oder pausieren. Nach dem letzten Spiel folgt die Siegerehrung.

Gespeicherte Räume behalten ihre aktuelle Disziplin, sichtbare Reihenfolge, Historie und Punkte. Eine alte Disziplin-Roulette wird einmalig in eine Ankunft überführt. Wertung bleibt eine genau einmal ausgeführte Servertransaktion. Vorladen beginnt bereits auf der Reise. Ergebnisanimationen folgen der Serverzeit und beginnen nach Neuladen nicht erneut bei null.

## Nachweise und Grenzen

Gezielte Ablaufprüfungen: `node scripts/test-party-flow.mjs`. Bestehende vollständige Engine-Olympiaden mit 2/8/12 Teilnehmern: `node scripts/test-engine.mjs`. Reise-, Relikt-, Bosswertungs- und Revanche-Regressionsprüfungen: `node scripts/test-journey.mjs`. Desktop-Browserprüfung: `node scripts/check-party-flow.mjs`; Bilder und Messungen liegen unter `outputs/qa/party-flow`.

Die Browserprüfung verwendet echte Chromium-Darstellung mit kontrollierten Spielzuständen. Sie ersetzt keine vollständige Netzwerkpartie, physische Geräteprüfung oder Abnahme sämtlicher individuellen Spielmechaniken. Die weitergehenden Schauplatz-, Klang- und Performance-Aufgaben in der bisherigen Designmatrix bleiben davon getrennt.
