# Stadt Land Fluss: Modellbauatelier und freie Schreibplatzkameras

Der vorhandene Stadtmodelltisch steht jetzt in einer weiter ausgearbeiteten Ideenwerkstatt. Holzfußboden mit Fugen und heller Einfassung, Sockelvertäfelung, Holzpilaster, obere Fensterfelder und offene Dachrippen gliedern den Ort. Hintere Eckbereiche enthalten Materialbank, Papierstapel, Planablage, Bücherregal und eine tatsächlich importierte Staffelei mit Malutensilien. Kleine Stifte ergänzen die geladenen Schreibtische und Stühle aller Teilnehmer. Eine flache Straßenstruktur verbindet die sieben bestehenden interaktiven Modellbezirke.

Die vorhandene Mechanik bleibt erhalten: Nur die eigenen Eingaben beleben die privaten Stadtbezirke; fremde Antworten und Stimmen bleiben geschützt. Das persönliche native Schreibblatt, Entwurfsspeicherung, absichtliche Abgabe, alle sieben Kategorien und die gemeinsame blätterbare Bewertungswand behalten ihre Funktion. Die vorhandenen Charakterformen, Gesichter und Accessoires bleiben Teil der Schreibplätze. Tageslicht, warmes Holz und dezentes grünes Gegenlicht verbinden die Szene ohne zusätzliche Echtzeitlichtquelle. Die allgemeinen Wolkensprites entfallen hier.

## Persönliche Sicht für die hinteren Plätze

Die persönliche Kamera folgt dem tatsächlichen eigenen Sitz. Bei einem hinteren Sitz liegt diese Kamera hinter der alten Rückwand. Eine reine Prüfung der Bildausschnittgrenzen hatte diese Verdeckung bisher nicht ausgeschlossen. Der neue Node-Test weist einen tatsächlichen Strahlentreffer der hinteren Schreibkamera auf der alten Wand nach.

Die rückwärtige Kulisse ist deshalb eine eigene zusammengefasste Gruppe. Während der persönlichen, noch offenen Schreibansicht wird sie als räumlicher Schnitt ausgeblendet. Boden, eigene Figur, Schreibtisch und Stadtmodell bleiben erhalten. Beim Wechsel zur Gruppe, nach Abgabe und während Bewertung oder Ergebnis wird der vollständige Raum wieder angezeigt. Es werden keine halbtransparenten Wände oder zusätzlichen Effektpässe benötigt.

`AdventureStage` gibt den tatsächlichen persönlichen Schreibmodus an die bestehende Szene weiter. Das Szenenbild meldet seinen Schnittzustand im vorhandenen Atelier-Rahmen als `roomCutaway`; dies ist zugleich die Grundlage der gezielten nativen Rück-/Seitensitzprüfung. Die neue Dekorationsgruppe bleibt getrennt vom bespielten Tisch und der wechselnden Bewertungswand. Vor dem statischen Zusammenfassen wird ihre Sichtbarkeit kurz erhalten beziehungsweise wiederhergestellt, sodass auch ein vorzeitig aktivierter Nahmodus das Zusammenfassen nicht verhindert.

## Tatsächlich heruntergeladenes Modell

- **Art Easel Set Up**, **reyshapes**: https://poly.pizza/m/2ZP3o8hyPA
- Download: https://static.poly.pizza/de6672ae-e7be-47eb-9836-f4894bbc82f2.glb
- Lizenz der konkreten Originalseite: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), geprüft am 18.10.2026.
- Original: 315.024 Bytes, zehn Materialprimitive, 3.266 Dreiecke.
- Vorbereitet: **184.640 Bytes, ein Materialprimitiv, 3.266 Dreiecke**.

`scripts/prepare-atelier-easel.mjs` erhält die tatsächlichen Positionen, Normalen und ursprünglichen Knotentransformationen. Die gemalte Vertexfarbpalette wird in normalisierte Farbbytes gepackt; der größte gemessene Komponentenfehler beträgt rund 0,00000003. Unbenutzte UVs, FBX-Zusätze und die zehn geringfügig unterschiedlichen metallischen Materialvarianten entfallen. Ein gemeinsames opakes, raues Material nutzt die ursprünglichen Vertexfarben. Die Geometrie wird zu einem einzigen indizierten Primitiv zusammengeführt.

Die tatsächliche GLTFLoader-Prüfung bestätigt ein Mesh und alle 3.266 Dreiecke. Bei Höhe 3,7 beträgt die ursprüngliche Ausdehnung ungefähr 1,26 × 3,7 × 2,51. Die erste Bildprüfung zeigte die Leinwand seitlich. Ihre tatsächliche große Flächennormale zeigt in der Quelle nach −X; die Instanz ist deshalb um etwa +90 Grad zur gemeinsamen Vorderkamera gedreht. Die erneuten Browserprüfungen beziehen sich auf diese korrigierte Ausrichtung.

Original, Quellenmetadaten und Lizenz liegen in `assets/source-models/atelier/`. Öffentliche GLB und Lizenz liegen in `public/adventure-models/props/`. Das Modellmanifest dokumentiert Quell- und Ausgabeprüfsummen. Die übrigen vorhandenen Möbel-, Lebensmittel-, Stadt- und Fahrzeugmodelle bleiben lokal eingebundene Kenney-Assets.

## Prüfung und verbleibender Umfang

Die elf Node-Tests und TypeScript bestehen. Die neuen Prüfungen decken jede Sitzposition bei 2/8/12 Teilnehmern, tatsächliche frühere Wandverdeckung und die Wiederherstellung der Kulisse bei Gruppe, versiegelter Abgabe und Bewertung ab. Der Produktionsbuild besteht nach der visuellen Korrektur der Staffelei erneut.

Die aktuellen nativen Browserfälle verwenden tatsächliche Enginezustände und Maus-/Touchbedienung in Chromium mit SwiftShader. HTTP-Antworten sind kontrollierte echte Spielansichten, die WebSocket-Verbindung ist in diesen funktionalen Fällen geschlossen. Die Berichte belegen keine reale Netzwerkpartie.

- `ideas-workshop-views-low.json`: zehn Rück-/Seitensitzfälle mit 2/8/12 Teilnehmern und Breiten 1440/390. Bei zwölf Teilnehmern werden der hintere und beide seitlichen Plätze verwendet. Eigene Sicht, Gruppensicht, dieselbe Canvas, vertraulicher Entwurf, tatsächliche automatische Speicherung, Reload und Wiederherstellung des Raums nach Abgabe bestehen. In der vollen Schreibgruppe sind 64/82/94 Zeichenaufrufe für 2/8/12 Teilnehmer gemessen; bei zwölf Teilnehmern 15.372 Dreiecke, 40 Texturen und 59 Geometrien.
- `ideas-workshop-views-high.json`: beide hinteren Zwölferansichten bestehen zusätzlich in hoher Grafikqualität.
- `ideas-workshop-notebook-low.json`: sechs vollständige Schreibfälle für 2/8/12 Teilnehmer × Desktop/Touch, einschließlich aller sieben Felder, Enter, simulierter IME, 600/400 Pixel hoher Ansichten mit erhaltener Textauswahl, Entwurf/Reload, direkter 3D-Kategorienwahl, bewusster Abgabe, Bewertung und Folgerundenreset. Zwei weitere Fälle prüfen den echten Zeitablauf mit absichtlich ausgelassenen periodischen Autosaves und die Bedienung bei fehlendem WebGL.
- `ideas-workshop-notebook-high-reduced.json`: zwölf Teilnehmer, Desktop und schmale Ansicht, hohe Qualität mit reduzierter Bewegung, derselbe vollständige Schreibablauf.
- `ideas-workshop-review-low.json`: sechs Zweibrowserfälle für 2/8/12 Teilnehmer × Desktop/Touch. Tatsächliche Antworten, gleiche Antworten, falsche Anfangsbuchstaben, 60 Zeichen lange Antworten, private Stimmen, alle Antwortseiten, Urteile, Ergebnisrangfolge und Reset bleiben korrekt.
- `ideas-workshop-picking.json`: alle sieben tatsächlich gerenderten Stadtbezirke fokussieren mit nativer Maus und Touch ihr richtiges Eingabefeld; versiegelte Blätter bleiben gesperrt.
- `ideas-workshop-audio.json`: zwei instrumentierte native Fälle prüfen Papier-/Bewertungsklang, tatsächlichen räumlichen Ursprung, zur Kamera passenden Hörer, einen Audiokontext und Freigabe bei Unsichtbarkeit.

Die beiden mit `-final.log` bezeichneten Sichtprüfungen und die genannten Browserberichte wurden nach Korrektur der Staffeleiausrichtung ausgeführt. Die ersten Sichtprüfungslogs ohne `-final` dokumentieren den davor sichtgeprüften Stand. Die später entdeckte Kartentexturkorrektur besitzt eigene, nachfolgend genannte Nachweise; ältere Zustandsprüfungen allein beweisen die sichtbare Urteilskarte nicht.

## Vorbereitung und wiederholte Szenenwechsel

`ideas-workshop-shaders.json` bestätigt elf vorbereitete und elf beim ersten sichtbaren Bild verwendete Programme in hoher Qualität sowie neun/neun in niedriger Qualität. `ideas-workshop-preload.json` lädt 13 tatsächliche GLB-Dateien mit zusammen 698.076 Bytes bereits in der Regelphase vor. Ein Umschalten der ruhigen Darstellung behält dieselbe Canvas und löst keine erneute Modellanfrage aus.

`ideas-workshop-lifecycle.json` umfasst 18 Wechsel zwischen Atelier, Kartenrunde, Garten und Messpavillon mit zwölf tatsächlich geladenen Figuren, jeweils einer aktiven Spiel-Canvas und keinen erfassten Browser-/WebGL-Fehlern. In jedem der fünf Atelierbesuche werden die gemeinsame Schreibansicht und anschließend echte Antworten/Abstimmungen mit der vollständigen blätterbaren Zwölfer-Ergebniswand geprüft. Die Schreibansicht bleibt bei 94 Zeichenaufrufen, 15.372 Dreiecken, 40 Texturen und 59 Geometrien. Die Ergebnisansicht bleibt bei 37 Zeichenaufrufen, 8.908 Dreiecken, 34 Texturen und 60 Geometrien.

## Sichtbares Urteil nach dem Layoutwechsel korrigiert

Die abschließende GPU-Bildkontrolle zeigte einen zusätzlichen tatsächlichen Darstellungsfehler: Der Spielzustand meldete die abgeschlossene Abstimmung, die kompakte Antwortkarte zeigte aber weiterhin die cremefarbene Fläche und „CREW PRÜFT“. Eine instrumentierte Canvasprüfung bewies, dass der Antworttext bereits mit dem richtigen grünen Hintergrund und „✓ 10 P · 12 JA / 0 NEIN“ gezeichnet worden war. Der eigentliche WebGL-Inhalt blieb dagegen alt.

Die Antworttexturen wurden zunächst mit 1024 × 144 Pixeln angelegt. Die kompakte Darstellung änderte diese bereits hochgeladene Bildfläche auf 1024 × 256. Die verwendete WebGL2-Texturverwaltung behielt ihre vorher angelegte Speicherdimension. Weitere Bildaktualisierungen reichten deshalb nicht aus, um den sichtbaren Inhalt zuverlässig zu aktualisieren.

Die drei Kartenflächen werden jetzt von Anfang an mit festen 1024 × 256 Pixeln angelegt und während ihres Lebens nicht mehr umdimensioniert. Ein absolut gesetzter Zeichenmaßstab erhält die bisherigen logischen Layouts mit 144 beziehungsweise 256 Pixeln Höhe. Weder neue Texturen pro Antwort noch zusätzliche Shader sind nötig. Die sichtbare Beschriftung, Hintergrundfarbe und Punkte folgen nun auch nach Layoutwechseln dem bestätigten Zustand.

`check-atelier-card-paint.mjs` liest Pixel aus tatsächlichen Canvas-Screenshots an einer projizierten unbedruckten Stelle derselben Antwortkarte. Vor der Korrektur scheitert die Prüfung nach bestätigter Zustimmung mit weiterhin cremefarbenen Pixeln `[244,232,205]`; erhalten sind `atelier-card-paint-before-fix.log` und `atelier-paint-accepted-before-fix.png`. Nach der Korrektur werden tatsächlich grüne Pixel gelesen. Ein zweiter Fall bestätigt die tatsächlich rote Karte nach zwölf ablehnenden Stimmen. Beide Entscheidungen bleiben bei vier aufeinanderfolgenden Desktop-/Hochformatwechseln sichtbar und zeigen weiterhin dieselbe Antwort.

Endgültige Pixelberichte: `atelier-card-paint.json`, `atelier-card-paint-rejected.json`. Der Test prüft damit den sichtbaren Renderinhalt zusätzlich zu den Spielzuständen. Elf Node-Tests, TypeScript und der Produktionsbuild bestehen nach der Korrektur erneut. Die erneute Shaderprüfung heißt `ideas-workshop-shaders-fixed.json`. `ideas-workshop-lifecycle-fixed.json` wiederholt die 18 Szenenwechsel und wechselt bei jedem Atelierbesuch zusätzlich viermal zwischen breiter und schmaler Ergebnisansicht; dabei bleiben 35 Texturen und 60 Geometrien stabil. Die breite Ergebnisansicht benötigt 37, die kompakte 41 Zeichenaufrufe. Die sechs vollständigen Zweibrowser-Bewertungsfälle bestehen erneut (`ideas-workshop-review-low-fixed.json`).

## Sechs kurze tatsächliche Hardwaremessungen

Die endgültigen Messungen wurden nach der Kartentexturkorrektur und nach dem Ende der übrigen Browserjobs mit hoher Qualität, zwölf geladenen Figuren, stummem Audio und der nativen Seitenanordnung ausgeführt. Der tatsächliche D3D11-Renderer meldet eine **NVIDIA GeForce RTX 4080 SUPER**. Die Gruppenfälle öffnen den ganzen Raum über „Atelier ansehen“. Die privaten Fälle verwenden wirklich Teilnehmer sechs auf dem hinteren Platz. In beiden Bewertungsfällen lösen zwölf tatsächliche Stimmabgaben während des Messfensters die gemeinsame Enthüllung aus; der bestätigte Zustandswechsel wird im Bericht geprüft.

| Ansicht / Browserbreite | Tatsächlicher Zeichenpuffer | Draw Calls | Dreiecke | App-Bildzeit P95 | Render-CPU P95 |
|---|---|---|---|---|---|
| Ganze Werkstatt / 1920 | 1416 × 651 | 142 | 30.102 | 16,8 ms | 0,9 ms |
| Ganze Werkstatt / 390 | 364 × 260 | 142 | 30.102 | 16,7 ms | 0,9 ms |
| Hinterer Schreibplatz / 1920 | 1416 × 651 | 101 | 21.430 | 16,8 ms | 0,7 ms |
| Hinterer Schreibplatz / 390 | 388 × 420 | 77 | 21.014 | 16,8 ms | 0,6 ms |
| Bestätigte Bewertung / 1920 | 1040 × 595 | 64 | 17.755 | 16,7 ms | 0,6 ms |
| Bestätigte Bewertung / 390 | 364 × 446 | 67 | 17.780 | 16,8 ms | 0,6 ms |

In jedem Fall wurden 241 rAF-Abstände erfasst. Der größte beobachtete Abstand beträgt jeweils 16,8 ms, keiner liegt über 33,5 oder 50 ms. App-Zeiten und Browser-Scheduling sind keine vollständige GPU-Zeitspur. Endgültige Berichte: `ideas-workshop-group-hardware-fixed.json`, `ideas-workshop-rear-hardware-fixed.json`, `ideas-workshop-review-hardware-fixed.json`. Die älteren Dateien ohne `-fixed` dokumentieren die Messungen vor der Kartentexturkorrektur.

Der erste zusätzliche Bewertungsprüfer verlangte auch im schmalen Layout drei gleichzeitige Karten. Tatsächlich zeigt dieses Layout absichtlich eine größere Karte pro Seite. Der Prüfer verlangt jetzt weiterhin zwölf tatsächliche Antworten, den bestätigten Enthüllungszustand und zusätzlich die zum Bildschirm passende kompakte beziehungsweise normale Kartenanzahl. Der erste Fehllauf bleibt in `ideas-workshop-review-hardware-before-compact-check.log` und dem zugehörigen unvollständigen JSON erhalten. Beide abschließenden Bewertungsfälle bestehen; die Produktdarstellung wurde dafür nicht verändert.

Tatsächlich kontrollierte aktuelle Bilder sind unter anderem `ideas-workshop-high-12-6-1440-group.png`, `ideas-workshop-rear-fixed-categories-390.png` und `ideas-workshop-review-fixed-categories-390.png`. Sie zeigen die korrigierte Staffelei, die freie hintere Schreibkamera und das sichtbar aktualisierte kompakte Urteil. Die Vorababbildung des Modellautors ist ausschließlich eine Quellenansicht und kein Nachweis der Spielszene.

Diese kurzen Desktop-Messungen beweisen keine Leistung auf einem physischen Smartphone oder einer integrierten GPU, keine Kaltstartlatenz und keine lange echte Partie. Diese Ortsarbeit ist keine vollständige Abnahme aller 21 Disziplinen. Physische Mobilgeräte, reales Hören, lange echte Mehrbrowserpartien und die vollständige Netzwerk-Olympiade bleiben gesondert zu prüfen; das bekannte Laufzeitproblem ist in `REALTIME-RUNTIME.md` dokumentiert.
