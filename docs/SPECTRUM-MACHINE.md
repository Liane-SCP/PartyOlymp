# Spectrum: gemeinsame Messmaschine und persönliche Ergebnisse

Die spätere offene Raumgestaltung mit runder Bühne, mechanischem Doppelbogen und unterschiedlich geformten A-/B-Polen sowie deren erneute Nachweise stehen in [SPECTRUM-PAVILION.md](SPECTRUM-PAVILION.md). Dieser Bericht beschreibt die Mechanik und die jeweils genannte frühere Ausstattung.

Die Messhalle besitzt jetzt eine eigene, lesbare Geräteansicht und eine Gruppenübersicht. Beide Ansichten passen zu Skala, Zielmechanik und Figurenplätzen. Die Pole sind als deutlich bezeichnete A-/B-Flächen auf der Sockelfront angebracht. Das Hinweisbanner bleibt vor den Ergebnisflächen sichtbar; eine tatsächliche Projektionsprüfung verhindert, dass die größere mobile Karte es verdeckt.

## Geheimhaltung und Rollen

Vor der Aufdeckung liest die Darstellung ausschließlich den erlaubten eigenen Zeiger und den nur für den Hinweisgeber gelieferten Zielwert. Fremde Tipps erscheinen nicht vorzeitig in Karten, Markierungen oder Diagnosedaten. Ein altes `reveal` wird außerhalb der tatsächlichen Ergebnisphase ignoriert. Der Hinweisgeber bleibt an seinem eigenen Platz; öffentliche Bereitschaftsmarken gehören zu den nummerierten Figurenplätzen.

Die Auflösung übernimmt bestätigte Punkte und Abstände. Hinweisgeber erhalten die ausdrückliche Kennzeichnung „keine Wertungsrunde“. Fehlt der Hinweis, gilt diese Kennzeichnung für alle. Ein fehlender Tipp in einer sonst gültigen Runde bleibt dagegen ein fehlender Tipp mit 0 Punkten. Diese unterschiedlichen Fälle werden nicht als dieselbe Niederlage dargestellt.

## Gemeinsame Skala und Karten

Jeder abgegebene Tipp bleibt exakt an seiner tatsächlichen 0–100-Position. Auch gleiche Werte werden nicht künstlich auseinandergerückt. Nummern, Farben und die zugehörigen Ergebniskarten ordnen die Zeiger zu. Die Zeiger der aktuellen Kartenseite sind hervorgehoben; kleine nummerierte Fahnen unterscheiden auch direkt übereinander liegende Tipps.

Drei wiederverwendete Karten zeigen auf breiten Ansichten jeweils eine Gruppe von Ergebnissen. Schmale Ansichten zeigen eine größere Karte. Alle bis zu zwölf Teilnehmer, einschließlich Hinweisgeber und fehlender Tipps, sind über die Seitenauswahl erreichbar. „Mein Ergebnis“ wählt den tatsächlichen eigenen Teilnehmer. Der gewählte Teilnehmer bleibt beim Wechsel zwischen Einzel- und Dreieransicht erhalten. Die vollständige HTML-Auswertung bleibt zusätzlich verfügbar.

Die Zielbänder öffnen sich anhand des öffentlichen `revealStartedAt`. Reduzierte Bewegung zeigt sie sofort vollständig. Ein späterer Einstieg startet keinen neuen lokalen Enthüllungsablauf. Die nächste Runde entfernt alte Karten, Zielbänder und Fahnen und setzt die Ansicht zurück. Die vorherige private Zeiger-Vorschau bleibt bei der Aufdeckung nicht als zweiter vermeintlicher Tipp stehen.

## Kurze Ansichten und Rückkehr zur Gruppe

Auf schmalen oder höchstens 760 Pixel hohen Fenstern nutzt die Geräteansicht eine eigene Bildschirmfläche mit acht Pixel Rand. Die globale Navigation und Emoteleiste verschwinden während dieser Nahansicht. Alle Ergebnisaktionen bleiben Teil derselben Bühne. Escape und „Messstation ansehen“ kehren zur Gruppe zurück; nach dem Layoutwechsel wird die ursprüngliche Bühne wieder sichtbar gescrollt. Ohne diesen nachgelagerten Schritt konnte die Rückkehr beim vorherigen Scrollstand nur den unteren HTML-Ergebnisbereich zeigen und die unsichtbare 3D-Szene korrekt pausieren.

Die schmale Gruppenbühne passt ihre Höhe zwischen 400 und 580 Pixeln an den Platz unter der normalen globalen Leiste an. Damit wird die zweite Navigationszeile in der geprüften 700-Pixel-Ansicht nicht vom scrollenden Rahmen abgeschnitten. Im Gruppenmodus bleibt ein kompakter Emoteknopf verfügbar. Der Browserprüfer kontrolliert für jede aktive Navigationsschaltfläche die Mitte und zwei um vier Pixel eingerückte Ecken mit `elementFromPoint`; ein nur durch automatisches Scrollen erfolgreicher Klick genügt nicht.

## Modelle, Geometrie und Klang

Die vorhandenen lokal gespeicherten Kenney-Modelle für Zahnrad, Stehlampe, Werkbank und Pflanze werden weiterverwendet. Vier tatsächliche GLB-Dateien wurden mit ihren SHA-256- und CC0-Einträgen im Assetregister abgeglichen. Es gibt keinen neuen externen Download oder neue Lizenzannahme.

Private und öffentliche Zeiger verwenden eine einzige gemeinsame Geometrie aus Stiel und Spitze. Dadurch entfallen wiederholte Kegelgeometrien und der zweite Zeichenaufruf pro Zeiger. Die Karten behalten ihre Texturen und Geometrien auch beim Seiten- und Breitenwechsel. Das Erscheinungsbild verändert sich über Maßstab, Textinhalt und vorhandene Materialien.

Die Messhalle hat ein eigenes leises Lüftungsbett. Das Verstellen rastet mit einem kurzen mechanischen Klang ein; die Bestätigung kommt vom Hinweisplatz beziehungsweise vom Versiegelungsfeld. Die gemeinsame Enthüllung klingt aus der Mitte des Instruments. Das neue öffentliche `spectrumReveal`-Ereignis trägt die Serverzeit. Alte Ereignisse bleiben bei Wiederbeitritt und verspäteter Zustellung stumm. Der allgemeine zusätzliche Enthüllungston und die allgemeinen Konfettipartikel sind für dieses Messgerät entfernt.

## Gezielte Prüfungen

`test-spectrum-presentation.mjs` besteht mit neun Node-Prüfungen: tatsächliche private Rollen und Zielwerte, Punkte/gleiche Tipps/fehlende Antworten/fehlender Hinweis, Erreichbarkeit aller Karten, wirkliche Maschinenobjekte und Reset, exakte Zeigerpositionen, Kameragrenzen für 2–12 Figuren bei vier Seitenverhältnissen, vollständige lange Namen, gemeinsame Zeigergeometrie sowie das unverdeckte tatsächliche Hinweisbanner. Die acht bestehenden Regelprüfungen aus `test-new-games.mjs` bestehen ebenfalls. TypeScript und Produktionsbuild bestehen; die Warnung zu großen Clientchunks bleibt offen.

`spectrum-presentation-low.json` enthält sechs bestandene Chromium-Fälle mit 2/8/12 Teilnehmern, jeweils Desktop und Touch. Der Hinweisgeber gibt einen echten Hinweis ein; ein reiner Zahlenhinweis wird vorher durch die bestehende Validierung abgewiesen. Der ratende Client bedient die tatsächliche 3D-Skala, ändert den Wert zusätzlich per Tastatur und versiegelt über das räumliche Feld. Die Prüfung erfasst Geheimhaltung, alle Ergebniskarten, den eigenen Teilnehmer bei Breitenwechseln, denselben Renderer, Wiederbeitritt, fehlende Tipps, fehlenden Hinweis und den Rundenreset.

`spectrum-presentation-high.json` ergänzt zwei hohe Grafikfälle mit zwölf Teilnehmern, reduzierter Bewegung und dem zwölften Spieler als ratendem Client. Diese ursprünglichen Läufe liegen vor der nachfolgenden Banner- und Kurzlayoutkorrektur. Die abschließenden Layoutprüfungen werden getrennt dokumentiert.

Nach Banner- und Kurzlayoutkorrektur bestehen `spectrum-short-layout.json` und `spectrum-final-layout.json` mit jeweils zwölf Teilnehmern bei 1440 und 390 Pixel Breite, einmal 700 und einmal 1100 Pixel Höhe. Der erweiterte native Ablauf prüft zusätzlich Escape, die sichtbare Rückkehr zur Gruppe und die unverdeckten Mitten/Ecken aller aktiven Navigationsknöpfe auf jeder Ergebnisseite sowie in der Gruppenansicht. Beide Berichte enthalten keine Seitenfehler. Die tatsächlichen Bilder der ersten und letzten Ergebnisgruppe und der Gruppenübersicht wurden kontrolliert. Die schmale 700-Pixel-Gruppenansicht zeigt jetzt die vollständige Navigation innerhalb des scrollenden Rahmens. Diese vier finalen Layoutfälle verwenden niedrige Grafik und ergänzen die ursprünglichen sechs niedrigen und zwei hohen Fälle; sie werden nicht als vollständige erneute hohe Grafikabnahme ausgegeben.

`spatial-scenes-spectrum.json` enthält zwei bestandene native Web-Audio-Fälle: erstes Entsperren, tatsächliche Regler-/Bestätigungs-/Enthüllungsquellen, Kamera-/Hörerzuordnung, ein AudioContext, stumme alte Ereignisse im selben Spiel und nach Szenenbesuch sowie Freigabe aller Quellen und Umgebungsschleifen.

`scene-lifecycle-spectrum-18.json` enthält 18 bestandene Wechsel zwischen Spectrum, Hivemind und Kaufhaus. Jeder der sechs Spectrum-Besuche öffnet die Gruppen- und Geräteansicht, alle zwölf tatsächlichen Ergebnisse sowie vier Breitenwechsel. Die breite letzte Ergebnisseite bleibt nach den Wechseln bei 86 Zeichenaufrufen, 1.792 Dreiecken, 56 Texturen und 67 Geometrien. Eine aktive Canvasfläche, keine gemeldeten WebGL-Fehler. Die Rendererzähler beweisen keine vollständige Prozessspeichergrenze.

## Bisherige warme Hardwareproben

Die Rohberichte `hardware-spectrum-machine.json`, `hardware-spectrum-group.json` und `hardware-spectrum-reveal.json` enthalten vier kurze warme D3D11-Proben auf einer RTX 4080 SUPER mit zwölf geladenen Figuren und hoher Grafik. Sie wurden vor der anschließenden Korrektur des normalen kurzen Layouts aufgenommen. Der Hardwareprüfer setzt die Bühne unabhängig davon auf die ganze Fensterfläche und blendet die globale Navigation aus; diese Berichte beweisen deshalb nicht die Bedienbarkeit des normalen Seitenlayouts.

| Zustand | Tatsächlicher Renderpuffer | rAF-Abstände | p95 / p99 | Maximum | >33,5 / >50 ms | Zeichenaufrufe / Dreiecke |
|---|---|---|---|---|---|---|
| Private Geräteansicht | 1918 × 852 | 241 | 16,7 / 16,8 ms | 16,8 ms | 0 / 0 | 88 / 2.212 |
| Private Gruppenansicht | 1918 × 852 | 241 | 16,8 / 16,8 ms | 16,8 ms | 0 / 0 | 104 / 2.820 |
| Tatsächliche gemeinsame Enthüllung, breit | 1918 × 852 | 235 | 16,8 / 33,3 ms | 66,6 ms | 2 / 1 | 83 / 2.456 |
| Tatsächliche gemeinsame Enthüllung, schmal | 388 × 584 | 240 | 16,8 / 16,8 ms | 33,3 ms | 0 / 0 | 111 / 2.972 |

Die Enthüllungsproben führen die elf tatsächlichen Tipps erst während des Messfensters aus und prüfen anschließend Ziel, endgültige Karten und abgeschlossene Enthüllung. Die breite Enthüllung besitzt eine offene 66,6-ms-Spitze. Ein guter p95 widerlegt diese Spitze nicht. Browser-rAF ist kein vollständiger GPU-Zeitverlauf; die schmale Probe auf derselben Desktop-GPU ist keine Smartphone-Messung. Ein späterer Lauf darf diese Rohberichte nicht als vermeintlich fehlerfreie Messung überschreiben.

### Anschließende Diagnose und ruhige Geräteansicht

`hardware-spectrum-reveal-final.json` bestätigt auf dem korrigierten Seitenlayout erneut eine breite Spitze von 66,7 ms (235 Abstände, p95 16,8/p99 33,3 ms, zweimal >33,5 und einmal >50 ms). Schmal: 240 Abstände, p95 16,7/p99 16,8 ms, Maximum 33,2 ms. Die Rendererstände entsprechen der Tabelle. Diese Wiederholung ist getrennt gespeichert.

Der danach eingeführte optionale Prüfschalter `HARDWARE_TRACE=1` erfasst während desselben Messfensters Browser-`longtask`- und `long-animation-frame`-Einträge mit Scriptzuordnung. `hardware-spectrum-reveal-trace.json` zeigt breit erneut 66,7 ms und eine 53-ms-Aufgabe aus `Response.json.then` im Platform-Client, ohne erzwungene Layoutdauer. Ein weiterer langer Animationsframe enthält keine Scriptzuordnung. Diese Diagnose allein identifiziert keine einzelne teure Funktion.

Im Code wurde zusätzlich der allgemeine CSS-Kameraimpuls für Spectrum gefunden. Er transformierte den gemeinsamen Vorfahren der fest positionierten Geräteansicht und konnte damit deren Bezugssystem während der Enthüllung verändern. `gameImpact` unterdrückt diesen generischen Effekt jetzt für Spectrum. Die mechanische Aufdeckung bleibt unverändert. `spectrum-steady-layout.json` besteht erneut auf 1440/390 × 700 mit zwölf Teilnehmern, allen Karten, Touch-/Mausaktionen, Escape, Gruppenrückkehr und unverdeckten Navigationsrändern. Eine neue Browserassertion verlangt zusätzlich, dass das tatsächliche Kameraelement keinen generischen Impuls erhält. TypeScript und Produktionsbuild bestehen nach dieser Änderung.

`hardware-spectrum-steady-trace.json` enthält die danach einzeln gemessenen beiden Enthüllungen: breit 237 Abstände, p95 16,8/p99 33,3 ms, Maximum 49,9 ms, einmal >33,5 und kein Abstand >50 ms; schmal 241 Abstände, p95 16,7/p99 16,8 ms, Maximum 16,8 ms, keine Abstände >33,5 ms. Die breite Probe enthält dennoch zwei lange Animationsframes mit 52,9 und 57 ms Gesamtdauer; im ersten ist weiterhin `Response.json.then` mit 49,7 ms Scriptdauer zugeordnet. Es wurden keine >50-ms-Long-Tasks erfasst. Renderer: breit unverändert 83 Zeichenaufrufe/2.456 Dreiecke bei 1918 × 852, schmal 111/2.972 bei 388 × 584. Die geringeren rAF-Spitzen sind ein Ergebnis dieser Wiederholung, kein Nachweis einer vollständig behobenen Ursache. Insbesondere bleiben Snapshot-Verarbeitung, React-/Ergebnisaufbau und die zweite lange Framephase zu untersuchen. Die frühere Hivemind-Spitze ist unverändert offen.

## Offene Abnahme

Das anschließend integrierte Hinweis-/Zeigerpult steht in [SPECTRUM-CONSOLE.md](SPECTRUM-CONSOLE.md). Weitere Raum-/Hinweisgebergestaltung, die Lesbarkeit maximal langer Hinweise, reale Smartphone-Tastaturen, Hörabnahme, Mittelklasse-Geräte, kalte Ladephasen, längere Live-Gruppenpartien, Prozessspeicher und die komplette Mehrbrowser-Olympiade bleiben offen. Die noch offene Bildzeitspitze aus der gesonderten Hivemind-Probe ist hierdurch nicht behoben. Diese Erweiterung ist keine vollständige Spectrum- oder Gesamtabnahme. Der Stand ist lokal.
