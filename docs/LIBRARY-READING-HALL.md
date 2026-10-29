# Wiki-Sprint: Lesesaal und Archivnische

Die Bibliothek erhält einen höheren Lesesaal mit Bogenfenstern, Holzpfeilern, einer oberen Galerie mit Geländern, zusätzlichen Regalschränken und einem eingefassten Läufer im Mittelgang. Die vorhandenen echten Artikellinks bleiben auf ihren direkt bedienbaren Buchflächen. Links, persönlicher Bücherpfad, Crewkarten, Artikelansicht und Rennwertung werden durch die Dekoration nicht ersetzt.

Hinter den vorhandenen, gemeinsam getakteten Buchdeckeltüren steht ein offenes Modellbuch auf einem eigenen Lesepult in einer vertieften Archivnische. Der bisherige flache helle Hintergrund entfällt. Das Ziel ist weiterhin der tatsächlich erreichte Artikel; das Modell ist öffentliche Dekoration und enthält keine zusätzlichen Navigationshinweise. Der bestehende Arbeitsplatz links erhält einen Stuhl, eine Leselampe und ein offenes Buch. Rechts ergänzt ein kleiner Tisch mit Sitzplatz und Teppich den Lesesaal.

## Tatsächliches Buchmodell und Ressourcenbesitz

„Open Book“ von Quaternius: https://poly.pizza/m/FsCIGEfTEs. Die konkrete Modellseite wurde am 18.10.2026 als Public Domain / CC0 überprüft. Originalgeometrie, drei Materialien, Normalen und Binärdaten bleiben unverändert. Der Download besitzt 592 Dreiecke, benötigt 34.976 Byte und enthält keine externen Ressourcen oder Animationen. Uniformer Maßstab, Platzierung und Rauheit werden vom vorhandenen Loader angepasst.

Original, Quellenbeleg und Lizenzdatei liegen in `assets/source-models/library/`. `scripts/prepare-library-book.mjs` prüft Quelle, Lizenz und Format und übernimmt das tatsächliche GLB samt Hash/Größe ins öffentliche Manifest. Die bestehenden Kenney-Möbel behalten ihre individuellen Lizenz-/Quellenbelege. Der generierte Wiki-Vorladeplan enthält elf tatsächlich verwendete GLBs mit zusammen 143.404 Byte.

`library-reading-hall.ts` nutzt den vorhandenen Szenenbesitzer. Statische Architektur und Ausstattung werden nach dem Laden gemeinsam zusammengefasst. Buchdeckeltüren, bewegliche Regale und echte Linkflächen bleiben außerhalb dieser statischen Zusammenfassung. Es kommen keine weiteren Echtzeitlichter hinzu. Die Fenster sind opake, konstant akzentuierte Flächen; die Beleuchtung nutzt vorhandene Lichtquellen. Generische Außenwolken und schwebende Außenfelsen werden im Innenraum nicht mehr gezeichnet.

## Visuelle Korrektur und Kamera

Die erste tatsächliche Raumaufnahme zeigte das offene Zielbuch teilweise hinter der bisherigen Zielbeschriftung. Das Schild steht nun über dem Eingang der Archivnische und vor deren Trägerbalken. Die Artikeltiteltafel sitzt an der Vorderseite des Ankunftspodests; die beiden Schilder überlagern sich nicht mehr. Die Rückwand erhält einen wärmeren Kontrast zur Raumumgebung. Die Übersichtskamera berücksichtigt die auf 13 Einheiten erhöhte Architektur. Eine neue Geometrieprüfung projiziert die tatsächlichen Lesesaal-Ecken von schmalem Hochformat bis zu kurzem Querformat und prüft den Abstand des Zielschilds vor seinem Balken. Die Nahkamera für tatsächliche Artikellinks wird nicht verändert. Die Buchkarten sitzen nun mittig auf der tatsächlichen 3D-Buchfläche: Die große mobile Karte bleibt vollständig über dem Läufer und unter dem oberen Buchrahmen. Eine zusätzliche Geometrieprüfung und die tatsächliche mobile Aufnahme sichern insbesondere ihre zuvor angeschnittene Fußzeile ab.

## Prüfung

Elf Wiki-Präsentationsbereiche, TypeScript und Produktionsbuild bestehen. Die aktuelle Vorladeprüfung enthält alle elf Modelle, keine erneuten vorbereiteten Modellabrufe bei deaktiviertem HTTP-Cache und denselben Renderer bei einer ruhigen Ansichtsumschaltung. Shader Hoch/breit: 8 vorbereitet / 8 zuerst sichtbar; Sparsam/schmal: 6/6. Die 18 Wechsel zwischen Bibliothek, Tresorwerkstatt, Observatorium und Kaufhaus mit zwölf Figuren, langem Bücherpfad und einem aktiven Canvas bestehen mit stabilen Zählern und ohne erfasste WebGL-Fehler.

Nachweise in `outputs/qa/`: `library-hall-final-tests.log`, `library-hall-final-types.log`, `library-hall-final-build.log`, `library-hall-preload.json`, `library-hall-shaders.json` und `library-hall-lifecycle.json`. Alle fünf Bibliotheksbesuche der 18-Wechsel-Probe besitzen im fokussierten langen Bücherpfad identische 48 Zeichenaufrufe, 9.482 Dreiecke, 32 Texturen und 49 Geometrien. Diese Ressourcenprobe liegt vor den letzten reinen Positionskorrekturen von Zielschild und Buchkarten; danach wurden Build, elf Node-Bereiche, TypeScript, Vorladen, Shader-Vorbereitung und beide tatsächlichen Ankunftsabläufe erneut geprüft. Ressourcenbesitz, Materialien und Geometrien wurden durch diese Positionskorrekturen nicht geändert.

## Native Galerie- und Raumabläufe

Sechs Sparfälle (2/8/12 Spieler × 1440/390 Pixel) und zwei hohe Zwölfspielerfälle bestehen: direkte Auswahl eines späteren tatsächlichen Artikellinks, alle bestätigten Pfadstationen bis zur 30. Station, jede Crewkarte, erhaltene Auswahl beim Breitenwechsel, unverdeckte Navigationsflächen, gleiches Canvas, lesbarer Artikel nach Ankunft, Wiederbeitritt, tatsächliche Punkte und Folgerundenreset. Die 85 erfassten Spar-Galerieproben benötigen 40–53 Zeichenaufrufe bei höchstens 9.532 Dreiecken. Die 46 hohen Galerieproben liegen bei 81–102 Zeichenaufrufen und höchstens 19.070 Dreiecken. Alle bleiben im unveränderten 100-/180-Zeichenaufrufbudget. Berichte: `wiki-gallery-low.json` und `library-hall-high.json`; Logs: `library-hall-gallery.log` und `library-hall-high.log`. Diese umfassenden Galerieabläufe liegen vor der abschließenden reinen Schildermontage und Ausrichtung der Buchkarten. Die Schlussfassung wird durch die folgenden zwei vollständigen Ankunfts-/Navigationsfälle geprüft.

Die Schlussfassung mit montierten, freigestellten Tafeln besteht zusätzlich in `library-hall-arrival.json`: zwei Zwölfspielerfälle, 1440/390 Pixel, jeweils zwei Browserkontexte. Der erste Spieler erreicht durch eine tatsächliche 3D-Maus-/Touchaktion den Zielartikel. Der zweite öffnet danach weiterhin seine eigenen echten Links und navigiert erfolgreich. Der erste kann seinen Artikel weiter lesen; Rundenauswertung, Punktwerte und Reset bleiben korrekt. Die vier erfassten Galerie-/Raumzustände benötigen 42–78 Zeichenaufrufe, die offene Zwölfspieler-Zielraumansicht 78 bei 10.026 Dreiecken. Die endgültigen breiten und schmalen Raumaufnahmen sowie die große mobile Linkfläche wurden visuell kontrolliert. Kein erfasster Seitenfehler.

Die Strahlprüfung für das Lesepult verwendet ausdrücklich drei erlaubte Testlinks, damit alle drei großen Buchflächen unabhängig vom zufällig gewählten Bankartikel geprüft werden. Ein früherer zufälliger Artikel mit weniger als drei Links hatte die alte feste Drei-Flächen-Annahme verletzt. Die ursprünglichen Trefferaussagen wurden beibehalten; der Testaufbau deckt nun zuverlässig den vorgesehenen Fall ab.

## Aktive warme GPU-Proben

Nach Beendigung der anderen Browserprüfungen wurde die Schlussfassung in zwei nativen Seitenansichten gemessen: Hoch, zwölf Teilnehmer, stummes Audio, tatsächliche RTX 4080 SUPER über D3D11. Jeweils während des Messfensters führt die Engine den letzten erlaubten Artikelschritt aus; abschließend sind Ankunft, 30 bestätigte Stationen und vollständig geöffnetes Zielbuchtor geprüft.

| Fensterbreite | Tatsächlicher Renderpuffer | Zeichenaufrufe / Dreiecke im Endzustand | rAF-p95 / Maximum | Render-CPU-p95 |
|---|---|---|---|---|
| 1920 | 1040 × 521 | 115 / 19.420 | 16,7 / 16,8 ms | 0,8 ms |
| 390 | 388 × 540 | 115 / 19.420 | 16,8 / 16,8 ms | 0,7 ms |

Je 241 rAF-Abstände, kein Abstand über 33 ms, keine erfassten Browserfehler. `library-hall-hardware.json` und `library-hall-hardware.log`. Die unterschiedlichen Renderpuffer gehören zu den tatsächlich aufgezeichneten Seitenansichten. Die Messung ist keine vollständige GPU-Frametrace und kein Smartphone-, Kaltstart-, Latenz-, Hör- oder Langzeitspeichernachweis. Die schmale Gesamtübersicht bleibt eine Miniatur; tatsächliche Link-/Pfad-/Crewkarten besitzen die geprüfte eigene Nahansicht. Reale mobile Erkundung und weitere Kamerainszenierung bleiben Teil der Gesamtabnahme.

Der vorherige Spar-Galeriebericht ist unter `wiki-gallery-before-reading-hall-low.json` erhalten. Die älteren Raum-/GPU-Berichte in [WIKI-LIBRARY.md](WIKI-LIBRARY.md) beziehen sich auf frühere Architektur und andere konkrete Zustände. Sie ersetzen keine Messung dieses Lesesaals.

Weitere Figuren-/Arbeitsplatz-/Klanggestaltung, große tatsächliche Live-Artikel, native Geräte-/Tastatur-/Screenreader-/Hörprüfung, lange Mehrbrowserpartien und die vollständige individuelle Abnahme aller 21 Disziplinen bleiben offen. Der bekannte workerd-Verbindungsabschluss bleibt separat offen. Keine neue Veröffentlichung.
