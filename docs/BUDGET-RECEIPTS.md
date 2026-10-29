# Budget-Bande: gemeinsame Bonwand und Leseansicht

Die veröffentlichte Auflösung besitzt jetzt eine Bonwand im vorderen Kaufhausbereich. Bis zu drei wiederverwendete Papierflächen zeigen die Einkäufe der Crew; im schmalen Layout steht ein Bon pro Seite. Die übrigen Bons sind über Seitenwahl und Teilnehmerauswahl erreichbar. Unvollständige Seiten stehen mittig. Die vorhandenen Figuren bleiben Teil der Kaufhausszene.

Ein Bon zeigt Name, bestätigten Platz, Artikelzahl, Artikel und Einzelpreise, Summe, Budget und Abstand. Leere Körbe und Überschreitungen bleiben unterscheidbar. Plätze entstehen ausschließlich aus den veröffentlichten serverseitigen Punkten; gleiche Punkte erhalten denselben Platz. Es werden keine Steuern, Kaufbestätigungen oder zusätzlichen Wertungen erfunden. Die Fläche ist ausdrücklich als Spielbon mit Referenzpreisen beschriftet.

## Öffentliche Daten und unabhängige Kamera

`budgetReceiptFrame` liest ausschließlich `game.reveal.players` und `game.reveal.items` in `roundReveal` oder `done`. Ein altes `reveal` während `answer` liefert keine Bons, Summen oder Artikel. Eigene geheime Warenkörbe und unveröffentlichte Produktpreise werden nicht als Bonquelle verwendet.

Während des gemeinsamen Scans öffnen „Bons vergleichen“ und „Mein Bon“ die lokale Betrachtung. Eine andere Person kann gleichzeitig weiter den gemeinsamen Kassenscan sehen. Zeitbasis, Kundenbewegung, Summenfolge und Serverzustand werden durch die Kamera nicht verändert. Standardmäßig öffnet die Zusammenfassung die Bonübersicht. Eine bewusst gewählte Lese- oder Kassenansicht bleibt erhalten.

Ein physischer Bon öffnet seine Einzelansicht per Maus oder Touch. Teilnehmerauswahl und Seitenknöpfe bieten denselben Zugang per Tastatur. Beim Wechsel zwischen schmalem und breitem Layout bleibt die gewählte Person erhalten; derselbe Canvas und Renderer werden weiterverwendet. Zuschauer dürfen veröffentlichte Bons lesen und bekommen keinen „Mein Bon“-Zugang.

Die bestehende öffentliche Phasendauer wird nicht verlängert. Ein neuer gemeinsamer Zug beziehungsweise eine neue Runde schließt die Leseansicht und entfernt alte Bons. Die bisherigen Diagramm-/Bonlisten der Auflösung bleiben als ergänzender Zugang erhalten. Eine dauerhafte Bonhistorie über mehrere Runden ist mit diesem Ausbau nicht eingeführt.

## Lesbarkeit und Tastatur

Die Einzelansicht verwendet eine eigene, ruhige Kamera auf den gewählten Papierbon und einen gedämpften Hintergrund. Sie öffnet als Vollbilddialog, damit feste Raumleisten keine Texte verdecken. Summe, Budget und Budgetabstand bleiben oberhalb der Navigation. Escape kehrt zur Übersicht zurück. Die Fokusfolge bleibt im Leser; geschlossene Textdetails zählen nicht als Fokusziel. Bei automatischem Rundenwechsel wird der Dialog ebenfalls entfernt.

Die physische Papierdarstellung kürzt sehr lange Namen nach zwei Zeilen. „Bon als Text“ bietet dieselben Artikel vollständig, mit lesbaren Preisen und einer eigenen scrollbaren Fläche. Der Textbereich ist per Tastatur erreichbar. Die wesentlichen Knöpfe, Auswahl und Zusammenfassung besitzen mindestens 44 Pixel große Ziele.

## Geometrie, Modelle und Ressourcen

Die Bons sind eigens gesetzte Papierflächen in der tatsächlichen 3D-Szene. Ein gemeinsamer 1536×1024-Canvasatlas und eine Zeichenfläche bedienen drei Papierslots. Blättern ersetzt Inhalte und UV-Zuordnung innerhalb dieses festen Bestands; es entstehen keine neuen Papiertexturen pro Teilnehmer. Die Papierflächen umgehen Licht- und Tonemapping-Verfälschung.

Rahmen und Standfuß gehören zur Kaufhausarchitektur und werden statisch zusammengefasst. Die bereits integrierten tatsächlichen Kenney-Möbel, Terminalmodelle, Warenmodelle und Paketlizenzen bleiben die Grundlage des Schauplatzes; dieser Ausbau benötigt keinen zusätzlichen Modelldownload. Die Papiergestaltung ist passende, eigens erzeugte Spielgeometrie.

Private Auswahl und gemeinsame Kassentokens bleiben erhalten. In einer Bonansicht werden die gerade ausgepackten Kassentokens und die Packtüte ausgeblendet, damit nicht gleichzeitig ein anderer Korb als Ergebnis des gelesenen Bons erscheint. Der gemeinsame Scan läuft im Hintergrund weiter. Papier-, Beschriftungs- und Hintergrundmaterialien, Atlastexturen, Trefferflächen und zusätzlich gebündelte Geometrien werden mit ihrem Szenenbesitzer freigegeben.

## Prüfungen und Grenzen

Vier Tests in `scripts/test-budget-receipts.mjs` prüfen tatsächliche Spiellogik/Summen/Plätze/Einzelpreise, Geheimhaltung auch bei altem Reveal, jede Gruppengröße von zwei bis zwölf mit erhaltener Identität bei Layoutwechsel, die Papier-/Galeriekameras sowie tatsächliche Geometrie und Aktionsflächen mit Reset. Die betroffenen Kassen-, allgemeinen Szenen-, Batching- und Referenzmoment-Prüfungen werden ebenfalls ausgeführt.

`scripts/check-budget-receipts.mjs` verwendet zwei koordinierte Ansichten der tatsächlichen Spiel-Engine-Fixture. Es kontrolliert physische Papierwahl, alle Teilnehmerbons, volle Produktnamen und Summen, lokale Kamerawahl bei unverändertem gemeinsamem Scan, Layoutwechsel ohne neuen Canvas, Zuschauerrolle, automatische Zusammenfassung und Rundenwechsel aus einem offenen Leser. Die Fokusfolge wird mit geschlossenem und geöffnetem Textbon geprüft. Projektionspunkte am oberen und unteren Bonende müssen tatsächlich auf dem freien Canvas liegen.

## Ergebnisse

- Vier Bon-Tests, drei Kassenlayout-Tests, 17 allgemeine Szenentests, sechs Referenzmoment-Tests und drei Batching-/Ressourcentests bestehen. TypeScript und der Produktionsbuild bestehen; die vorhandene Warnung zu großen Clientchunks bleibt sichtbar.
- Sechs Bonabläufe mit 2/8/12 Teilnehmern bei 1440/390 Pixeln und je zwei Browsersichten bestanden auf diesem damaligen Stand. Der mobile Zweierfall enthält zusätzlich einen Zuschauer. Der vor dem späteren Abteilungsausbau gesicherte Bericht liegt unter `outputs/qa/budget-receipts-low-before-store-departments.json`; die gezielten aktuellen Wiederholungen stehen in [STORE-DEPARTMENTS.md](STORE-DEPARTMENTS.md).
- Zwei Zwölfspieler-Bonabläufe in hoher Grafik bestehen. Bericht: `outputs/qa/budget-receipts-high.json`.
- Zwei zusätzliche finale Zwölfspieler-Dialogabläufe prüfen nach der letzten Dialogkorrektur auch Escape bei geöffnetem Textbon. Bericht: `outputs/qa/budget-receipts-final-dialog.json`. Alle Bonläufe prüfen freie Canvaspunkte an Kopf und Fuß des Papiers, ausreichend große Aktionsflächen und den Rundenwechsel aus dem offenen Leser.
- Auf dem damaligen Stand bestanden sechs Kassenabläufe mit 2/8/12 Teilnehmern bei 1440/390 Pixeln, einschließlich gemeinsamer Waren-/Kundenpositionen, zehn gepackter Artikel, Wiederbeitritt und Reset; die gepackten niedrigen Kassenansichten lagen bei 67–70 Zeichenaufrufen. `outputs/qa/checkout-layout.json` enthält inzwischen die vier gezielten Wiederholungen mit 2/12 Teilnehmern nach dem Abteilungsausbau, keine erneute Achtspieler-Abnahme. Siehe [STORE-DEPARTMENTS.md](STORE-DEPARTMENTS.md).

| Teilnehmer | Galerie Sparsam, 1440 / 390 | Leser Sparsam, 1440 / 390 |
|---|---:|---:|
| 2 | 65 / 55 | 46 / 39 |
| 8 | 77 / 67 | 48 / 41 |
| 12 | 85 / 75 | 48 / 41 |

Die hohe Zwölfspieler-Galerie liegt bei 121/111 Zeichenaufrufen, der Leser bei 84/77. Die jeweiligen Budgets von 100 beziehungsweise 180 werden eingehalten. Bei zwölf Spielern verwendet die Galerie Sparsam 34 Texturen und 55 Renderer-Geometrien, der Leser 34 Texturen und 56 Geometrien. Renderbudgets allein belegen keine Geräte-FPS.

Zwölf Wechsel zwischen Bonleser und Würfelsalon bestehen mit jeweils zwölf geladenen Figuren und einem Canvas ohne WebGL-Fehler. Sechs Budget-Besuche zeigen 57–58 Zeichenaufrufe, 31–32 Texturen und 54–55 Geometrien ohne fortlaufendes Wachstum. Dabei werden tatsächlich alle zehn Artikel pro Spieler veröffentlicht und eine andere Bonseite geöffnet. Bericht: `outputs/qa/budget-receipts-lifecycle.json`. Das ist eine begrenzte Prüfung je Renderer; vollständiger Prozessspeicher und lange reale Spielsitzungen sind damit nicht abgenommen.

Vier kurze warme Hardwareproben verwenden hohe Grafik, zwölf veröffentlichte Einkäufe mit je zehn Artikeln und tatsächliche Produktbilder auf einer NVIDIA GeForce RTX 4080 SUPER über D3D11. Galerie und Leser werden jeweils im nativen Seitenlayout bei 1920 und 390 Pixeln geprüft. Die vier Fenster enthalten jeweils 240–241 rAF-Proben mit p95 16,7–16,8 ms; die gemeldete App-Bildzeit liegt bei 16,7 ms. Puffergrößen: Galerie 1040×473/364×670, Leser 1886×887/388×643. Die Hardware-Leser benötigen wegen der anderen Ausschnitte 86/80 Zeichenaufrufe. Berichte: `outputs/qa/budget-receipts-hardware-gallery.json` und `budget-receipts-hardware-reader.json`. Auch die schmale Ansicht läuft auf der Desktop-GPU; diese Daten sind keine physische Mobilgeräte-, Kaltstart-, Eingabelatenz-, UI-Wechselspitzen- oder vollständige GPU-Zeitanalyse.

Die tatsächlichen Galerie-, Leser- und Textbilder wurden betrachtet. Dabei wurden die zunächst zu kleine Bonansicht, eine Überdeckung durch feste Raumleisten und Navigation sowie ein verstecktes Fokusziel korrigiert. Die finale Papieransicht hält Name, Summe und Budgetabstand auf schmalen wie breiten Bildern frei.

Die Browsernachweise verwenden koordinierte Spiel-Engine-Fixtures mit kontrollierter öffentlicher Zeit. Sie ersetzen keine vollständige Live-Mehrbrowser-Olympiade, native Mobilgeräte-/Screenreader-/Hörabnahme, Zielgeräte-FPS oder Langzeit-Prozessspeicherprüfung. Der bekannte lokale WebSocket-Runtime-Abschlussfehler bleibt offen. Weitere Kaufhaus-/Gruppen-/Klanggestaltung und die Abnahme aller 21 Disziplinen einschließlich Veröffentlichung bleiben Teil des unveränderten Gesamtziels.
