# Würfelwerk: gemeinsam besetzte Spielplätze

Die nachfolgende Anpassung der Tischgröße und Kameras an kleine Gruppen sowie aktuelle gezielte Nachweise stehen in [DICE-GROUP-SIZING.md](DICE-GROUP-SIZING.md). Die folgenden Messungen dokumentieren den vorherigen Ausbaustand.

Jeder der 2–12 Teilnehmer besitzt jetzt eine eigene Filzfläche, einen tatsächlich geladenen Würfelbecher, fünf bestätigte Augenwürfel, eine Halteablage und eine beschriftete Platzkarte. Die Plätze folgen der vorhandenen Sitzordnung. Der eigene Platz liegt für jeden Teilnehmer vorne; Zuschauer erhalten eine reine öffentliche Tischansicht. Stühle richten sich radial zum Tisch aus.

Die frühere große persönliche Würfelfläche in der Tischmitte wurde ersetzt. „Mein Würfelplatz“ vergrößert denselben Platz, der auch in der Tischübersicht sichtbar ist. Beim Kamerawechsel bleiben Würfel, Becher und fremde Ausrüstung an ihren tatsächlichen Orten. Nur die eigene Figur wird in der Nahansicht ausgeblendet. Dieselbe Szene und derselbe Renderer bleiben erhalten.

## Spielhandlung und gemeinsame Information

Alle Augen und Haltezustände stammen aus dem vorhandenen öffentlichen `opponents`-Zustand. Die aktuelle Spiellogik veröffentlicht diese Werte bereits; neue geheime Informationen werden nicht eingeführt. Der eigene Becher und die eigenen Würfel lösen dieselben autoritativen Roll-/Hold-Aktionen wie das Spielpult aus. Fremde Becher und Würfel besitzen keine Aktionsflächen. Zuschauer erhalten keine eigenen Aktionsflächen.

Gehaltene Würfel stehen in der helleren Ablage und erhalten einen goldenen Farbton. Beim Neuwurf bleiben ihre Position und Orientierung unverändert. Andere Würfel bewegen sich vom Becher in ihre Fläche. Nach dem Wurf liegt stets der bestätigte Wert oben; die sechs Flächen verwenden gegensätzliche Werte mit Summe sieben. Das Augenatlas wird von allen 60 Würfeln geteilt.

Die Platzkarte zeigt Name, Wurfstatus beziehungsweise gesicherten Eintrag und öffentliche Gesamtsumme. Die eigene Karte öffnet das vollständige vorhandene Wertungsblatt. Dessen Null-Bestätigung, Bonusanzeige, Eingabesicherung, Escape/Fokusrückgabe und Wiederbeitritt bleiben erhalten. Die zusätzliche HTML-Tischrunde bietet die vollständigen öffentlichen Blätter und gut lesbare Würfel auf kleinen Bildschirmen.

In der Mitte liegen der gemeinsame Zug und die Zahl gesicherter Einträge als Tischanzeige. Die Darstellung verwendet ausschließlich öffentliche Abgaben. Die Regeln, Würfelzufälle, maximal drei Würfe, Wertungen und 13 gemeinsamen Züge wurden nicht verändert.

## Wurfzeit und Klang

`rollStartedAt` wird beim tatsächlichen serverseitigen Wurf gesetzt und mit den öffentlichen Würfelwerten veröffentlicht. Das nächste gemeinsame Zugfenster setzt es auf `null`. Animationen hängen von dieser Uhr statt vom Zeitpunkt einer lokalen Zustandsbeobachtung ab. Ein später Beitritt zeigt einen alten Wurf ruhig; während eines frischen Wurfs nimmt er die aktuelle Pose ein. Alte gespeicherte Räume ohne diesen Zeitstempel bleiben spielbar und zeigen ihre bestätigte Ruhepose. Reduzierte Bewegung hält die Würfel ruhig.

Jeder Spieler besitzt einen eigenen räumlichen `dice:<id>`-Anker am tatsächlichen Becher. Neue Würfelereignisse nutzen den zugehörigen Anker. Die vorhandene Begrenzung gleichzeitiger Geräusche bleibt bestehen. Historische oder aus einem anderen Spiel übernommene Würfelereignisse werden nicht neu abgespielt. Weitere individuelle Aufprall-/Becherbewegungen und die abschließende Hörabnahme bleiben offen.

## Modelle und Ressourcen

- Die Becher verwenden die vorhandenen echten GLB-Dateien des [Kenney Food Kit](https://kenney.nl/assets/food-kit), CC0. Originale Paketlizenz: `public/adventure-models/food/License.txt`; Quelle, Datei und Prüfsumme stehen im Modellmanifest. Es wurden keine neuen externen Downloads benötigt.
- Tisch, Stühle und Raumdekoration verwenden weiterhin die tatsächlich geladenen Möbel des [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit), CC0.
- Filzflächen, Ablagen und Augenwürfel sind gezielt angepasste Spielgeometrie. Zwölf Würfelplätze passen durch eine begrenzte Skalierung der kleinen Arbeitsflächen um den gemeinsamen Tisch.
- Ein InstancedMesh zeichnet alle Augenwürfel. Statische Becher und Platzrahmen werden zusammengefasst. Namen, Status und Tischmitte verwenden einen gemeinsamen Canvasatlas und eine gemeinsame Zeichenfläche.
- Beide Ansichten werden für die Shader-Kompilierung vorbereitet. Ein Wechsel benötigt keinen neuen Renderer.
- Unveränderte, ausgerollte Würfel laden ihre Instanzmatrizen nicht in jedem Bild erneut hoch. Änderungen an Werten, Haltezuständen, Abgaben und Ansicht sowie laufende Würfe aktualisieren sie wieder.
- Instanzpuffer, Atlastexturen, Materialien und zusätzlich zusammengefasste Geometrien werden beim Szenenabbau freigegeben. Die importierten Modelle verbleiben beim gemeinsamen Szenenbesitzer.

## Prüfung

Sieben Tests in `scripts/test-dice-place.mjs` prüfen die Zuordnung von Ausrüstung und Sitzfiguren für jede Gruppengröße von zwei bis zwölf einschließlich Zuschauerrechten, tatsächliche Wurfzeit-Veröffentlichung/Zugreset, erhaltene gehaltene Werte, die nach oben gerichteten Atlasflächen aller 60 realen Instanzen, identische öffentliche Wurfposen bei unterschiedlichen Renderer-Laufzeiten, ruhigen späten Beitritt, reduzierte Bewegung, Kameraausschnitte, eigene Gesamtsumme mit Bonus/Null/Reset und die vorhandene Avatar-Ressourcenfreigabe. Der Instanztest kontrolliert außerdem, dass wiederholte unveränderte Ruheframes keinen erneuten Matrixupload erzeugen.

`scripts/check-dice-crew-table.mjs` bedient in zwei koordinierten Browseransichten den letzten Teilnehmer der Sitzordnung. Es prüft tatsächliche Becher-/Würfelklicks und Touchaktionen, gemeinsame Wurfphase, Halten, Wiederbeitritt während und nach dem Wurf, alle öffentlichen Würfel, eigene Sitzzuordnung, Kamerawechsel mit erhaltenem Canvas, nächsten Zug und mobile Zuschauerrolle.

`scripts/check-dice-place.mjs` verwendet weiterhin die vollständige Bedienung von Becher, Würfeln und physischer Platzkarte einschließlich großem Blatt, Null-Abbruch, positivem Eintrag, Wiederbeitritt, nächstem Zug, Reset und dem WebGL-Verlust-Fallback. Seine 3D-Aktionen verwenden jetzt die tatsächlichen neuen Tischpositionen.

## Ergebnisse und verbleibende Grenzen

- Die sieben Würfeltests, 17 allgemeinen Szenentests, zwei Audioframe-Tests, drei Batching-/Ressourcentests, TypeScript und der Produktionsbuild bestehen. Die vorhandene Clientchunk-Warnung bleibt bestehen.
- Die sechs öffentlichen Tischabläufe für 2/8/12 Teilnehmer bei 1440/390 Pixeln bestehen mit jeweils zwei Browseransichten. Der mobile Zweierfall enthält zusätzlich einen Zuschauer. Bericht: `outputs/qa/dice-crew-low.json`.
- Die sechs vollständigen persönlichen Blattabläufe für dieselben Größen bestehen einschließlich tatsächlichem WebGL-Kontextverlust im Desktop-Zweierfall. Bericht: `outputs/qa/dice-place.json`.
- Zwei weitere Zwölfspieler-Tischabläufe bei 1440/390 Pixeln in Hoch bestehen. Bericht: `outputs/qa/dice-crew-high.json`.

| Teilnehmer | Sparsame Tischrunde: Zeichenaufrufe | Dreiecke | Texturen | Geometrien |
|---|---:|---:|---:|---:|
| 2 | 37 | 2.432 | 7 | 18 |
| 8 | 43 | 5.036 | 13 | 18 |
| 12 | 47 | 6.772 | 17 | 18 |

Die hohe Zwölfspieler-Tischrunde benötigt 69 Zeichenaufrufe, 12.758 Dreiecke, 19 Texturen und 18 Geometrien. Die Nahansichten sind durch Frustum-Culling kleiner: Sparsam 28/32 Zeichenaufrufe, Hoch 50/54. Die frühere vollständig geladene sparsame Zwölfspieler-Szene lag bei 97 Zeichenaufrufen, 38 Texturen und 38 Geometrien; ihr historischer Nachweis steht in `outputs/qa/auction-hall-lifecycle.json`. Diese Zahlen belegen Renderbudgets, keine Geräte-FPS.

Zwölf Wechsel zwischen Würfelsalon und Auktionshaus bestehen mit zwölf geladenen Figuren pro Messpunkt, einem Canvas, stabilen Textur-/Geometriezählern und ohne WebGL-Fehler. Der Salon bleibt bei 47 Zeichenaufrufen, 17 Texturen und 18 Geometrien. Bericht: `outputs/qa/dice-crew-lifecycle.json`. Die abschließende Ergänzung der Ereigniszeitmarke ändert keine dieser Ressourcen.

Die räumliche Audioprüfung besteht bei 1440 und 390 Pixeln mit erstmaliger Nutzerfreigabe, eigenem und fremdem tatsächlichem Becheranker, Kamerahörer, einem Kontext, stiller verspäteter Ereignishistorie im gleichen Spiel und nach Szenenremount sowie Freigabe aller Quellen und Umgebungsschleifen. Dabei wurde eine fehlende `at`-Zeitmarke im Würfelereignis entdeckt und korrigiert: Das Ereignis verwendet jetzt nachweislich denselben `c.now`-Wert wie `rollStartedAt`. Bericht: `outputs/qa/spatial-scenes-dice.json`. Der Nachweis ist eine Web-Audio-Signalprüfung und keine Hörabnahme.

Vier zusätzliche kurze Hardwareproben verwenden die tatsächliche NVIDIA GeForce RTX 4080 SUPER über D3D11, hohe Grafik, zwölf Figuren, 60 bestätigte ausgerollte Würfel und je einen gehaltenen Würfel pro Spieler. Native Seitenlayouts bei 1920 und 390 Pixeln werden jeweils als Tischrunde und Nahansicht gemessen. Die vier warmen Fenster enthalten je 241 rAF-Proben; rAF-p95 liegt bei 16,7–16,8 ms und die gemeldete App-Bildzeit ebenfalls bei 16,7–16,8 ms. Die Szenenpuffer sind 1040×485, 364×320 beziehungsweise in der schmalen Nahansicht 388×536 Pixel groß. Berichte: `outputs/qa/dice-crew-hardware-group.json` und `dice-crew-hardware-personal.json`. Die schmale Ansicht läuft auf derselben Desktop-GPU. Das sind weder Mobilgeräte-FPS noch eine vollständige GPU-Zeitanalyse, Kaltstart-, Wurfspitzen-, Latenz- oder Langzeitabnahme.

Die tatsächlichen Renderbilder der Tischrunde, Nahansicht und Blattbedienung wurden in kleinen und vollen Gruppen sowie breiten und schmalen Ansichten betrachtet. Die zunächst beim Kamerawechsel verschwindende fremde Ausrüstung wurde durch den einheitlichen Tisch ersetzt. Der verbliebene große freie Tisch bei kleinen Gruppen, weitere Kamerakomposition, Gruppen-/Endauswertung und Raumgestaltung benötigen weiteren Feinschliff.

Die Browserabläufe verwenden koordinierte reale Spiel-Engine-Fixtures. Sie ersetzen keine vollständige 13-Züge-Partie über reale Netzwerkverbindungen. Native Geräte-/Tastatur-/Hör-/Referenzgeräte-/Prozessspeicher-/Langzeitprüfung, der bekannte lokale WebSocket-Runtime-Abschlussfehler, die gesamte Abnahme aller 21 Disziplinen und Veröffentlichung bleiben offen.
