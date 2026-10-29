# Kategorien-Kette: Flussschlucht, Lager und Ruinen

Die fortlaufende Kategorien-Kette erhält eine zusammenhängende Flusslandschaft. Facettierte, begrünte Ufer rahmen das Wasser beidseitig ein. Ein schmaler Wasserfall folgt der tatsächlichen hinteren Felsfläche; flache Schaum- und Strömungsmarken sowie geladene Uferfelsen unterbrechen die große Wasserfläche. Die frühere breite rechteckige dunkle Wasserbahn und die allgemeinen schwebenden Felsen entfallen an diesem Ort. Warmes Sonnenlicht, grünes Gegenlicht und der vorhandene entfernte Nebel verbinden Wald und Wasser. Zusätzliche Echtzeitlichter und transparente Effektflächen sind nicht erforderlich.

Das Basislager besitzt ein tatsächlich geladenes Zelt, einen Holzsteg mit Fugen, Vorratskisten und einen nach hinten versetzten Tisch mit Büchern. Die beiden anderen wiederverwendeten Inselgruppen tragen echte beschädigte Steinbögen, kleine Trümmer und Büsche. Die Konstruktion aus zwei einfachen Pfeilern und einem Querbalken entfällt. Die Pflanzen und der Eingang bleiben hinter dem spielbaren Korridor.

Die beiden inneren Farbringe und der Mittelpunkt der bestehenden Inselgeometrien erhalten einen ruhigen gemeinsamen Grünton. Dadurch wird das auffällige sternförmige Farbmuster reduziert. Positionen, Höhen, Indizes, Normalen und die äußere Küste bleiben erhalten. Der bestätigte Wortpfad, seine Bodenunterstützung und die gemeinsame Bewegungszeit werden dadurch nicht verändert.

## Begrenzte Landschaft für eine fortlaufende Reise

Der bestehende Weg wächst weiterhin ausschließlich durch bestätigte Begriffe. Drei Inselgruppen werden zyklisch weiterverwendet, die Schlucht bleibt ein festes örtliches Umfeld des sichtbaren Abschnitts. 24/48/48 instanzierte Bretter, Pfosten und Seile sowie zwölf Wortplaketten begrenzen die eigentlichen Spielobjekte. Die neuen Kulissen erzeugen keine Objekte pro Wort und keine zusätzlichen Canvastexturen.

Die Schlucht und jede Inselgruppe werden getrennt statisch zusammengefasst. Die Zusammenfassung bleibt innerhalb ihrer bewegten Gruppe; die Inseln können daher weiterhin gemeinsam verschoben werden. Figuren, Marker, Wortplaketten und Bewegungsinstanzen bleiben unabhängig. Die vorhandenen ursprünglichen Charaktere bewegen sich weiter anhand der veröffentlichten Uhr. Ausgeschiedene Teilnehmer fahren weiterhin auf der tatsächlich geladenen Prüferfähre mit.

Die vorhandene Fluss-/Blätterwind-Umgebung und die räumlichen Wort-, Bestätigungs-, Einspruchs- und Ausscheidensklänge bleiben erhalten. Ein dekorativer Wasserfall verrät keine geheime Frist. Eingabe, private Stimmen, Mehrheitsregeln, vollständige Historie, Ergebnis und Rundenreset folgen unverändert dem tatsächlichen Spielzustand.

## Tatsächlich heruntergeladene Modelle

Beide konkreten Originalseiten weisen Quaternius und CC0 1.0 aus; sie wurden am 18.10.2026 geprüft.

| Modell | Originalquelle | Originaldatei | Tatsächlich ausgelieferte Datei |
|---|---|---|---|
| `Wall_ArchRound_Broken` aus Modular Ruins Pack | https://poly.pizza/m/F2LAK03B0r | 7.965.364 Bytes, vollständiger Bausatz | 81.576 Bytes, 1.604 Dreiecke, nur gewählter beschädigter Torbogen |
| Tent | https://poly.pizza/m/5Q7qIrfDxA | 45.036 Bytes | 43.996 Bytes, 784 Dreiecke |

Lizenz: https://creativecommons.org/publicdomain/zero/1.0/

Die Originaldownloads sind `https://static.poly.pizza/fa6cf69d-a091-4eb7-b62e-56290d8b9097.glb` und `https://static.poly.pizza/fc8d560d-91b5-439c-88bf-4cbddb7eadbb.glb`. Originale, Quellenmetadaten und individuelle Lizenztexte liegen in `assets/source-models/expedition/`; vorbereitete Modelle und öffentliche Lizenztexte in `public/adventure-models/props/`.

`scripts/prepare-expedition-props.mjs` extrahiert die tatsächlichen gewählten Knoten einschließlich ihrer ursprünglichen Wurzeltransformation. Unbenutzte Paketobjekte, eingebettete Bilder, UVs und Binärbereiche werden entfernt. Die Aufbereitung erhält aktive Positionen, Normalen und Indizes und passt die opaken Stein-, Stoff-, Holz- und Seilmaterialien an die Welt an. Das Modellmanifest enthält Quell- und Ausgabedatei-Prüfsummen.

`expedition-props-verification.json` bestätigt den bytegenauen Vergleich aller sechs aktiven Attribut-/Indexarrays des Bogens und aller zwölf des Zelts mit der Quelle. Beide GLBs wurden zusätzlich tatsächlich mit GLTFLoader geladen. Bei Höhe 3,8 misst der Bogen ungefähr 3,81 × 3,8 × 0,30; das Zelt bei Höhe 1,8 ungefähr 2,54 × 1,8 × 4,34. Diese Abmessungen bestimmen die Platzierung hinter dem begehbaren Bereich. Die Quellenbilder zeigen nur die ursprünglichen Modelle; sie sind keine Nachweise für die Spielszene.

## Prüfung und verbleibende Arbeit

Neun Node-Tests, TypeScript und der Produktionsbuild bestehen. Dazu gehören weiterhin tatsächliche Fußunterstützung bei langen Wegen, gleicher Bewegungsstand nach Wiederbeitritt, Fährenbewegung, vollständige Historie und passende Kameragrenzen für alle Gruppengrößen. Der neue Strahlentest prüft, dass die konstruierten Schluchtufer weder Crew-/Prüfergesichter noch persönliche Aktionsmarker bei 2/8/12 Teilnehmern und 0/25/180 Wörtern verdecken. Tatsächlich geladene Pflanzen und Modelle werden zusätzlich visuell kontrolliert.

Die abschließenden nativen Abläufe verwenden echte Enginezustände, koordinierte öffentliche Uhren und native Maus-/Touchereignisse in Chromium mit SwiftShader. HTTP-Antworten liefern kontrollierte Ansichten, WebSocket-Verbindungen sind in diesen funktionalen Fällen geschlossen. Dies ist keine reale Netzwerkpartie.

- `river-gorge-low.json`: sechs Fälle für 2/8/12 Teilnehmer × 1440/390 Pixel mit getrennten Browseransichten, gemeinsamem Fortschritt über 25 bestätigte Wörter, Wiederbeitritt während einer Bewegung und beim Fährenwechsel, echter Eingabe/Enter, Zustimmung, Einspruch, privaten Stimmen, 60 Zeichen langem Kandidaten, vollständiger blätterbarer Historie, Crewleiste, Rundenreset und erhaltener Canvas. Die schmalen Fälle erhalten Textauswahl und Bedienbarkeit auch bei 600/400 Pixel Höhe. Nach 25 Wörtern liegen die gemessenen Zeichenaufrufe bei 57/54, 69/66 und 77/74 für 2/8/12 Teilnehmer (breit/schmal). Die Zwölferansichten zeigen 14.433/13.917 Dreiecke, 31 Texturen und 60 Geometrien.
- `river-gorge-high.json`: beide Zwölferfälle bestehen zusätzlich in hoher Qualität, mit 119/116 Zeichenaufrufen und 26.177/25.661 Dreiecken.
- `river-gorge-high-reduced.json`: beide Zwölferfälle bestehen zusätzlich in hoher Qualität mit reduzierter Bewegung. Bestätigter Weg und Fährenposition werden dabei unmittelbar übernommen; volle Bewegung wird weiterhin getrennt geprüft. Die beiden Ansichten benötigen jeweils 119 Zeichenaufrufe und 26.177 Dreiecke.
- `river-gorge-audio.json`: zwei instrumentierte native Fälle prüfen den ersten Wortklang, den tatsächlichen räumlichen Ursprung, die zur Kamera passende Hörerposition, Bestätigung am nächsten Brett, einen Audiokontext, stumme historische Ereignisse und Freigabe der Umgebungs-/Aktionsquellen bei Unsichtbarkeit.

`river-gorge-first.json` beschreibt nur die erste Zweierfassung vor Ergänzung des kleinen Wasserfalls und der Felsen am Uferfuß. Die zuvor genannten finalen Berichte stammen nach dieser Ergänzung. Tatsächliche aktuelle Renderbilder wurden für Lager, langen Weg und Fähre visuell kontrolliert, beispielsweise `chain-low-12-1440-long.png` und `chain-low-12-1440-ferry.png`.

## Vorbereitung und Ressourcen nach wiederholtem Wechsel

`river-gorge-shaders.json` bestätigt elf vorbereitete und elf beim ersten sichtbaren Bild verwendete Shaderprogramme in hoher Qualität sowie neun/neun in niedriger Qualität. `river-gorge-preload.json` bereitet acht tatsächliche GLB-Dateien mit zusammen 223.960 Bytes vor. Ein Umschalten der ruhigen Ansicht behält dieselbe Canvas und lädt keine Modelle erneut.

`river-gorge-lifecycle.json` umfasst 18 Wechsel zwischen Flussexpedition, Atelier, Kartenrunde und Garten. Bei allen fünf Expeditionsbesuchen werden tatsächlich 25 Wörter bestätigt und 19 sichtbare Wegstücke geprüft. Zwölf Figuren bleiben geladen, es existiert jeweils nur eine aktive Spiel-Canvas, und es werden keine Browser-/WebGL-Fehler erfasst. Alle fünf langen Wegansichten bleiben bei 90 Zeichenaufrufen, 15.464 Dreiecken, 31 Texturen und 60 Geometrien. Andere Ausschnitte in den oben genannten nativen Abläufen können durch Sichtbarkeitsbegrenzung weniger Objekte zeichnen.

## Sechs kurze tatsächliche GPU-Messungen

Nach dem Ende der übrigen Browserjobs wurden sechs getrennte warme Messungen mit hoher Qualität, stummem Audio, zwölf tatsächlich geladenen Figuren und nativer Seitenanordnung ausgeführt. Der D3D11-Renderer meldet eine **NVIDIA GeForce RTX 4080 SUPER**. Die beiden Lagerfälle zeigen die anfängliche Themenwahl. In den beiden Wegbaufällen wird während des Messfensters ein tatsächliches 26. Wort genannt und durch die übrigen Teilnehmer bestätigt. In den beiden Fährenfällen wird nach 25 gültigen Wörtern ein tatsächliches doppeltes Wort genannt; der aktive Teilnehmer scheidet regelgemäß aus und erreicht die Prüferfähre. Die letzten beiden Ereignisarten werden am Ende ausdrücklich im Zustand der tatsächlich gezeichneten Szene geprüft.

| Zustand / Browserbreite | Tatsächlicher Zeichenpuffer | Draw Calls | Dreiecke | App-Bildzeit P95 | Render-CPU P95 |
|---|---|---|---|---|---|
| Basislager / 1920 | 1040 × 797 | 102 | 21.339 | 16,8 ms | 0,8 ms |
| Basislager / 390 | 364 × 330 | 100 | 20.377 | 16,7 ms | 0,8 ms |
| Bestätigtes 26. Wort / 1920 | 1040 × 664 | 131 | 27.196 | 16,7 ms | 0,9 ms |
| Bestätigtes 26. Wort / 390 | 364 × 377 | 118 | 26.165 | 16,7 ms | 0,9 ms |
| Ein ausgeschiedener Prüfer auf Fähre / 1920 | 1040 × 664 | 129 | 27.192 | 16,8 ms | 0,9 ms |
| Ein ausgeschiedener Prüfer auf Fähre / 390 | 364 × 377 | 118 | 26.175 | 16,7 ms | 0,9 ms |

Je Fall wurden 241 rAF-Abstände erfasst. Der größte beobachtete Abstand beträgt jeweils 16,8 ms, kein Abstand überschreitet 33,5 oder 50 ms. Die Wegbaufälle bestätigen 26 gültige Wörter, Fortschritt 26 und 19 sichtbare Bretter. Die Fährenfälle bestätigen weiterhin 25 gültige Wörter, genau ein ausgeschiedenes Fährenmitglied und dessen abgeschlossenen Transfer. Berichte: `river-gorge-camp-hardware.json`, `river-gorge-build-hardware.json`, `river-gorge-ferry-hardware.json`.

Der neue Fährenprüfer griff zunächst auf eine nicht vorhandene interne `public.roster` zu. Die tatsächliche interne Zustandsquelle ist `players`; öffentliche Ansichten erzeugen daraus ihre `roster`-Darstellung. Dieser Fehler im Prüfer wurde korrigiert; die bereits bestehenden Regeln wurden nicht geändert. Der Fehllauf bleibt in `river-gorge-ferry-hardware-before-state-check.log` erhalten. Beide erneuten Fährenfälle bestehen.

Tatsächlich kontrollierte GPU-Renderbilder sind unter anderem `river-gorge-camp-chain-1920.png` und `river-gorge-ferry-chain-390.png`. Die Seiten zeigen die wirkliche Themenwahl beziehungsweise den bestätigten ausgeschiedenen Teilnehmer; die Verbindungsanzeige innerhalb dieser kontrollierten HTTP-Fälle ist kein Nachweis für ein gelöstes Echtzeitproblem.

Die Messung erfasst App-Zeiten und Browser-Scheduling, keine vollständige GPU-Zeitspur. Schmale Desktopansichten sind keine physischen Smartphones; diese kurzen warmen Messungen beweisen keine integrierte GPU-Leistung, Kaltstartlatenz oder lange echte Netzwerkpartie. Physische Mobilgeräte, reales Hören und die vollständige Olympiade aller 21 Disziplinen sind damit nicht abgenommen. Das bekannte Laufzeitproblem bleibt in `REALTIME-RUNTIME.md` dokumentiert.
