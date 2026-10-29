# Würfelwerk: vollständige lokale Netzwerkpartie

`scripts/check-dice-live-session.mjs` spielt ein vollständiges Blatt mit 13 gemeinsamen Zügen in zwei getrennten Browserkontexten. Ein Teilnehmer verwendet 1440×1100 Pixel, der andere 390×844 mit Touch-Unterstützung. Raum, Authentifizierung, D1-Speicherung, WebSocket-Anmeldung, Zustandsübertragung und Aktionen laufen durch die tatsächliche lokale Anwendung. Es gibt keine abgefangenen Routen, ausgetauschte Spiel-Engine, Datenbankmanipulation oder ersetzte Uhr.

Die Raumkonfiguration und Bereitschaft werden über die echte HTTP-Schnittstelle vorbereitet. Die eigentlichen Würfe, Halteaktionen, Neuwürfe, Kategorieauswahl und gegebenenfalls Null-Bestätigungen erfolgen per Playwright-Klick an den normalen Browserbedienelementen, auch im schmalen Touch-fähigen Kontext. Dieser Ablauf behauptet keine durchgehende Touch-Ereignisfolge; tatsächliche räumliche Touchaktionen sind separat in [DICE-GROUP-SIZING.md](DICE-GROUP-SIZING.md) dokumentiert. Die Standardauswertung jedes Zuges dauert tatsächlich 3,5 Sekunden. Die abschließende Blattenthüllung und Disziplinwertung verwenden ebenfalls die normalen Serverfristen.

## Geprüfter Ablauf

- In allen 13 Zügen werfen beide Teilnehmer, halten den ersten Würfel, würfeln erneut und tragen die nächste freie Kategorie ein.
- Der gehaltene Wert bleibt unverändert. Bisherige Blatteinträge ändern sich nicht, während genau eine neue Zeile belegt wird.
- Beide authentifizierten Ansichten veröffentlichen dieselben gegnerischen Blätter wie die jeweiligen eigenen Ansichten.
- Eine tatsächlich bestätigte Wurfaktion wird mit derselben Aktionskennung erneut über HTTP gesendet. Sie erzeugt keinen zweiten Wurf.
- Derselbe Befehl mit einer neuen Aktionskennung aus dem alten Zug wird im nächsten Zug abgewiesen und verändert dessen Würfelzahl nicht.
- Der schmale Browser lädt in Zug sechs nach dem zweiten Wurf vollständig neu. Identität, bestätigte Würfel, Haltezustand und fünf bisherige Einträge bleiben erhalten; ein neuer WebSocket verbindet sich.
- Beide vollständigen Blätter werden mit der gemeinsamen Enthüllung verglichen. Die Gesamtsumme enthält den tatsächlich erreichten oberen Bonus.
- Die abschließenden rohen Spielwerte, Platzierungen und vergebenen Olympiadenpunkte müssen mit Blättern und Gesamtwertung übereinstimmen. Genau ein Disziplinverlauf wird gespeichert.
- Sämtliche im Browser beobachteten Aktionen benötigen eine erfolgreiche WebSocket-Bestätigung.

## Gefundene Bedienüberdeckung

Das tatsächliche mobile Wiedereintrittsbild zeigte die Grafikauswahl teilweise über dem Wertungsblattknopf. `app/dice-adventure.css` platziert diese Auswahl jetzt neben „Mein Würfelplatz“ in der Kamerazeile. Sie bleibt mindestens 44 Pixel hoch; in der persönlichen Vollbildansicht bleibt sie wie bisher ausgeblendet.

`scripts/check-dice-graphics-layout.mjs` prüft 320, 390 und 600 Pixel mit Touch-Unterstützung. Die Auswahl darf weder den Würfelbereich noch Überschrift, Kamera- oder Werkzeugknöpfe schneiden. Der Test prüft außerdem den tatsächlichen Trefferpunkt, hohe/niedrige Grafik, gespeicherte Auswahl, Vollbild-Rückkehr und denselben Canvas. Alle drei Fälle bestehen. Die tatsächliche schmale 320-Pixel-Aufnahme wurde visuell kontrolliert.

## Ergebnisse

Der erste vollständige Durchlauf vor der Layoutkorrektur besteht: 13 Züge, 102,1 Sekunden vom Beginn der Browserhandlung bis zur Disziplinwertung, bestätigte Blattsummen 82/111, genau ein Verlaufseintrag, 64/61 erfolgreich bestätigte Browseraktionen und keine erfassten Browser-/Spielprotokollfehler. Bericht: `outputs/qa/dice-live-session-before-layout.json`.

Der finale Durchlauf nach Layoutkorrektur besteht ebenfalls und ergänzt die ausdrückliche Prüfung von Ergebniswerten, Platzierungen und Gesamtpunkten: 13 Züge, 102,6 Sekunden, Blattsummen 41/27, Platz eins/zwei und 100/0 Olympiadenpunkte. Alle 66/63 beobachteten Browseraktionen erhalten eine erfolgreiche Bestätigung; beide Clients empfangen 292/286 Snapshots. Es existiert genau ein Verlaufseintrag. Bericht: `outputs/qa/dice-live-session.json`. Beide Berichte enthalten je 13 geprüfte Züge, keine erfassten Browser-/Spielprotokollfehler und keinen Testabbruch.

Der Produktionsbuild und TypeScript bestehen. Die vorhandene Warnung zu großen Clientchunks bleibt bestehen. Die drei separaten Layoutfälle stehen in `outputs/qa/dice-graphics-layout.json`.

## Grenzen und offener Runtime-Befund

Beim Neuladen beider Durchläufe protokolliert der lokale workerd jeweils zwei „Worker's code had hung“-Meldungen. Der Wiedereintritt und die restliche Partie funktionieren trotzdem. Nach dem finalen Browserabbau sind insgesamt sechs solche Meldungen protokolliert; diese Beobachtung steht in `outputs/qa/dice-live-runtime-observation.json`. Dieser Nachweis behebt oder entkräftet den separat reproduzierten WebSocket-Abschlussfehler in [REALTIME-RUNTIME.md](REALTIME-RUNTIME.md) nicht. Browserfehler und Runtime-Protokoll werden bewusst getrennt ausgewiesen.

Die Standings-Aufnahmen zeigen den normalen Einstieg in den Reisebereich; sie sind keine visuelle Abnahme aller darunterliegenden Ergebnisanzeigen. Der Ergebniszustand wird über die authentifizierte Schnittstelle geprüft. Chromium SwiftShader und ein schmales Desktop-Browserfenster ersetzen keine physische Mobilgeräte-, native Bildschirmtastatur-, FPS-, Latenz- oder Hörabnahme.

Eine lokale Zweierpartie belegt nicht alle Gruppengrößen, lange Sitzungen, automatische Wiedereintrittsversuche unter Paketverlust oder eine komplette gemischte 21-Spiele-Olympiade. Weitere Würfelraum-/Gruppen-/Endauswertungs-/Klanggestaltung und die unveränderten Gesamtanforderungen bleiben offen.
