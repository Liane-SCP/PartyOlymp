# Stadt Land Fluss: Miniaturstadt und gemeinsame Präsentation

Der nachfolgende Raumausbau, die tatsächlich importierte Staffelei und die freie persönliche Sicht der hinteren Schreibplätze sind in [IDEAS-WORKSHOP-ROOM.md](IDEAS-WORKSHOP-ROOM.md) dokumentiert.

Das Atelier besitzt jetzt eine eigene Schreib- und Bewertungsdarstellung. Die kleine Stadt steht auf einem skalierten, tatsächlich geladenen Kenney-Tisch. Jeder Teilnehmer behält seinen persönlichen Tisch und Sitzplatz. Die ursprünglichen Figurenformen, Gesichter und Accessoires bleiben erhalten. Die frühere Einzeilenanzeige mit höchstens vier Antworten ist durch eine blätterbare Präsentationswand ersetzt.

## Schreiben und öffentliche Fortschritte

Nur die eigenen Eingaben beleben die sieben Bezirke der Miniaturstadt. Gefüllte Bereiche werden leicht angehoben und erhalten zusätzlich ein Häkchen. Die Zuordnung folgt den vorhandenen Kategorien und direkt bedienbaren Bezirksflächen. Fremde Antworten bleiben bis zur Bewertung im privaten Spielzustand. An den fremden Plätzen werden nur bereits öffentliche Ausfüll- und Abgabestände angezeigt. Die Namensleiste markiert ein abgegebenes Blatt beziehungsweise eine versiegelte Stimme, ohne die Abstimmungsrichtung zu zeigen.

Die vorhandene HTML-Schreibfläche, automatische Entwurfssicherung und serverseitige Sequenzprüfung bleiben bestehen. Ein Neuladen stellt den gespeicherten eigenen Entwurf wieder her. Ein neues Blatt setzt die Darstellung zurück. Das anschließend integrierte persönliche Schreibblatt, seine Sitzplatzkamera und gezielte Eingabeprüfungen stehen in [ATELIER-NOTEBOOK.md](ATELIER-NOTEBOOK.md). Physische Smartphone-Tastaturen bleiben ungeprüft.

## Bewertungswand und Ergebnis

Während der Bewertung wird die Miniaturstadt ausgeblendet, damit ihre Modelle die Antwortkarten nicht verdecken. Auf Desktop zeigen drei feste Karten eine Seite. Schmale Ansichten zeigen eine einzelne größere Karte mit größerer Schrift. Alle bis zu zwölf unterschiedlichen Antworten bleiben über die Seitenauswahl erreichbar; beim Breitenwechsel wird die Seite in die entsprechende Kartengruppe umgerechnet. Gleiche Antworten werden als gemeinsame Option dargestellt. Falscher Anfangsbuchstabe, ausstehende Crewprüfung, angenommene/abgelehnte Antworten und tatsächliche Punkte besitzen beschriftete Zustände und Symbole. Die Karten übernehmen ausschließlich öffentliche Optionen beziehungsweise das bestätigte `lastReview`.

Die Karte verwendet eine zur Ebene passende Canvasauflösung von 1024 × 144 beziehungsweise 1024 × 256 in der mobilen Einzelansicht. Dieselbe Textur und Geometrie werden dafür wiederverwendet. Lange Antworten werden nach gemessenen Glyphenbreiten umgebrochen. Auch ein 60 Zeichen langes Wort wird vollständig übernommen. Die ausführliche, mit Tastatur und Touch bedienbare HTML-Bewertung bleibt zusätzlich verfügbar. Karten nennen bis zu zwei Autoren und die Anzahl weiterer Autoren; die vollständige Zuordnung bleibt in der HTML-Liste sichtbar.

Eine eigene Frontkamera zeigt die Präsentationswand. Der Schalter „Atelier ansehen“ führt zur Gruppenübersicht; die Rückkehr zur Präsentation und Seitenwechsel sind jederzeit möglich. Seiten- und Kameraschalter holen die Bühne ins Sichtfeld; Kategorie und Seitennummer stehen zusätzlich lesbar in der Navigation. Beim Wechsel der Kategorie beginnt eine neue Seite. Die gewählte Seite bleibt beim Übergang von Abstimmung zu Urteil erhalten. Beim Rundenabschluss zeigt dieselbe Wand alle Teilnehmer mit ihren tatsächlichen Rundensummen und der Zahl gültiger Kategorien. Der neue Rundenname stammt aus der Auflösung und nicht aus einem überlaufenden Kategorieindex.

`atelier-presentation.ts` berechnet diese Zustände getrennt vom Renderer. Er liest keine fremden Entwürfe oder geheimen Stimmzettel. Die Kamera berücksichtigt die tatsächlichen Sitzpositionen für 2–12 Personen sowie die Wandgrenzen auf breiten und schmalen Ansichten. Die 3D-Fläche hat eigenen Platz zwischen Überschrift und Navigation. Allgemeine schwebende Kristalle und die alte Bühnenfußzeile sind für diesen Innenraum entfernt.

## Modelle, Klang und Ressourcen

Die Tisch-, Stuhl-, Bücherregal-, Pflanzen-, Gebäude-, Lebensmittel-, Bären- und Rennwagenmodelle stammen aus dem vorhandenen lokal gespeicherten Kenney-Bestand. Quelle, CC0-Lizenz und Hash stehen in `public/adventure-models/manifest.json`. Für diesen Ausbau wurden keine zusätzlichen externen Assets heruntergeladen. Der zentrale Tisch wird in Breite und Tiefe angepasst; die Möbel werden nach Material zusammengefasst. Die beweglichen privaten Bezirke bleiben getrennt.

Ein eigener leiser Raum-/Fensterklang ersetzt den allgemeinen Grundton. Papier-/Hinweisklang beim Beginn der Bewertung und Stempel-/Intervallklang bei der Auflösung liegen räumlich an der Wand. Die eigene Blattabgabe hat ihre Quelle am eigenen Platz. Die tatsächliche Kamera steuert den Audiohörer. Die beiden Kategorieereignisse tragen Serverzeitstempel; neue Ereignisse unter drei Sekunden Alter spielen, nachträglich empfangene ältere Ereignisse bleiben stumm. Die bisherigen Klangaufrufe beim bloßen Einblenden der Bedienkomponente entfallen.

Es gibt drei wiederverwendete Karten, eine gemeinsame Kartengeometrie und drei feste Canvastexturen. Seitenwechsel erzeugen keine neuen Meshes oder Texturen. Beim Wechsel werden Modell-, Batch-, Karten- und Klangressourcen freigegeben. Eine begrenzte Kartenansicht entfernt keine Optionen oder Bewertungen aus dem tatsächlichen Spiel.

## Nachweise und verbleibende Grenzen

- Sechs Node-Prüfungen: private Entwürfe/alte Optionen, tatsächliche Gruppierung/Mehrheiten/Punkte/versiegelte Stimmen, tatsächliche Sichtbarkeit und Kartenwechsel der Szene, Kamera für 2–12 sowie vollständiger Umbruch langer Wörter und alle zwölf Optionen in der Einzelkartenansicht.
- `check-atelier-presentation.mjs`: tatsächliche Spielbefehle, eigener gespeicherter Entwurf und Neuladen, vollständige Seitenwahl, lange/gleiche/formal falsche Antworten, native Abstimmung, öffentliche Abgabemarken, geheime Stimmen, Rundenergebnis und neues Blatt.
- `check-atelier-picking.mjs`: alle sieben tatsächlichen Bezirksflächen mit Maus und Touch, passender Eingabefokus nach dem Scrollen und Sperre abgegebener Blätter. Die Kamera wird vor der Projektion tatsächlich eingeschwungen; das Feld wird ohne automatisches Scrollen fokussiert und erst im folgenden Bild ins Sichtfeld geholt.
- `check-word-locations.mjs` mit `GAMES=categories`: ursprüngliche Bezirkswahl, Abgabe, Privatheit und Phasenwechsel auf Desktop/Touch.
- `check-spatial-scenes.mjs` mit `SPATIAL_GAMES=categories,chain`: erste Geste, eigener Platz, neue Bewertungs-/Urteilsklänge, Kamerahörer, ein AudioContext, kein Nachspielen eines unbekannten zehn Sekunden alten Ergebnisses im laufenden Spiel und nach einem erneuten Szenenbesuch und Freigabe aller räumlichen Quellen/Umgebungsschleifen.

Die sechs Sparfälle (2/8/12 Teilnehmer × 1440/390 Pixel) und beide hohen Grafikfälle mit zwölf Teilnehmern bestehen. Jede Bewertungsoption und jeder Rundenergebnisplatz werden tatsächlich durchgeblättert. Die zwölfköpfige schmale Ansicht wechselt zusätzlich zwischen Einzelkarte und Dreiergruppe und prüft die zugehörige Zuordnung. Berichte: `outputs/qa/atelier-low.json`, `atelier-high.json` und `atelier-picking.json`.

| Grafik | Spieler | Breite | Zeichenaufrufe | Dreiecke | Texturen | Geometrien |
|---|---:|---:|---:|---:|---:|---:|
| low | 2 | 1440 | 26 | 1327 | 22 | 38 |
| low | 2 | 390 | 29 | 1377 | 22 | 38 |
| low | 8 | 1440 | 32 | 3411 | 31 | 50 |
| low | 8 | 390 | 35 | 3461 | 30 | 50 |
| low | 12 | 1440 | 35 | 4737 | 35 | 58 |
| low | 12 | 390 | 39 | 4789 | 35 | 58 |
| high | 12 | 1440 | 50 | 9343 | 37 | 58 |
| high | 12 | 390 | 54 | 9395 | 37 | 58 |

Die Tabellenwerte stammen jeweils von der letzten Ergebnisseite nach der vorherigen Schreibphase. Es handelt sich um unterschiedliche Sichtausschnitte, nicht um einen allgemeinen Höchststand der ganzen Disziplin.

`scene-lifecycle-atelier-18.json` belegt 18 Besuche in Atelier, langer Kategorien-Expedition und Kaufhaus, jeweils sechs pro Ort. Jeder Atelierbesuch rendert zuerst die Schreibphase mit zwölf geladenen Figuren und der Miniaturstadt, danach das tatsächliche Rundenergebnis mit zwölf Spielern auf der letzten Seite. Zusätzlich erfolgen je Besuch vier Breitenwechsel (insgesamt 24), einschließlich Wechsel der Texturhöhe und Kartenanzahl. Schreiben: 89 Zeichenaufrufe/10.910 Dreiecke/41 Texturen/57 Geometrien. Ergebnis nach den Breitenwechseln: 35/4.737/36/58. Die erste schmale Ansicht erhöht den Texturzähler in diesem Test von 35 auf 36; anschließend bleiben Texturen und Geometrien über die weiteren Wechsel und sechs Besuche identisch. Der Test prüft die ersten zwei Ansichten als Aufwärmzyklus und verbietet danach weitere Zunahme. Eine Canvasfläche bleibt aktiv; es gibt keine gemeldeten WebGL-Fehler. Das beweist keine Prozessspeichergrenze.

Vier native Web-Audio-Fälle für Atelier und Kategorien-Kette bestehen in `spatial-scenes-categories-chain.json`. Neben erneutem Szenenbesuch wird ein zunächst unbekanntes altes Ereignis in derselben laufenden Disziplin injiziert und seine tatsächliche Auslieferung abgewartet. Weder zusätzliche Klangquellen noch Kamerastöße entstehen. Ein AudioContext und die Freigabe aller räumlichen Quellen/Schleifen werden geprüft.

Zwei zusätzliche warme D3D11-Proben mit zwölf Figuren und hoher Grafik auf der RTX 4080 SUPER stehen in `hardware-atelier-writing.json` und `hardware-atelier-review.json`. Schreiben: 241 rAF-Abstände, p95 16,7 ms, p99 16,8 ms, 124 Zeichenaufrufe und 21.162 Dreiecke. Bewertungswand mit tatsächlicher Abstimmungsauflösung während des Messfensters: 239 Abstände, p95/p99 16,8 ms, 58 Zeichenaufrufe und 9.498 Dreiecke im Endzustand. In beiden Messfenstern liegt kein Abstand über 33,5 ms. Der tatsächliche Renderpuffer beträgt 1918 × 876 Pixel im 1920 × 1080 Fenster. CPU-Renderaufruf-p95: 0,9 beziehungsweise 0,6 ms, keine GPU-Zeitspur. Die erzwungene Benchmark-Vergrößerung ist kein Nachweis des normalen Seitenlayouts.

Renderbilder von Schreibphase, kurzen und langen Antworten, letzter Seite, Urteilen und Ergebnissen auf Desktop/Touch sowie die beiden Hardwarebilder wurden kontrolliert. Quellen-/CC0-Einträge und SHA-256 der zwölf verwendeten Kenney-GLBs stimmen mit den Dateien überein. TypeScript, sechs Node-Prüfungen und Produktionsbuild bestehen. Die Warnung zu großen Clientchunks bleibt offen.

Diese gezielten Prüfungen sind keine vollständige Abnahme von Stadt Land Fluss oder aller 21 Disziplinen. Weitere Architektur-/Sitzplatz-/Schreibblattgestaltung, längere reale Gruppenpartien, native Tastaturen, Mittelklasse-Referenzgeräte, Hörabnahme, kalte Ladephasen, echte Netzwerkunterbrechungen, gesamte Olympiade und Anforderung-für-Anforderung-Abnahme bleiben offen. Der Stand ist lokal und nicht veröffentlicht.
