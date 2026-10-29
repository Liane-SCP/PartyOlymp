# Regionale Landschaften und passende Atlasminiaturen

Stand: 18.10.2026. Lokaler Ausbau innerhalb des unveränderten Gesamtziels für alle 21 Disziplinen. Keine Veröffentlichung und keine vollständige Oberweltabnahme.

## Gestaltung

Die räumlichen Kapitel der bestehenden aufsteigenden Inselroute besitzen nun sechs zusammenhängende Landschaftsprofile. Die Auswahl der Profile folgt dem Fortschritt durch die Kapitel; alle Inseln eines Kapitels teilen dieselbe Identität. Individuelle Spielorte behalten zusätzlich ihre eigenen Bodenfarben. Bosslandschaften erhalten einen stärkeren Anteil ihrer eigenen Farbgebung.

| Gebiet | Landschaft und Vegetation |
|---|---|
| Morgenhaine | warme grüne Haine, mehrteilige Laubkronen, erdige Klippen |
| Wind der Wunder | sandige Böden, türkisgrüne Palmenformen, warme Stege |
| Sternenriff | kühle Felsen, Kristallbewuchs, abgestimmte Wasserfälle |
| Vergessene Reiche | gedeckte Steinfarben, Zedern, helle Wege |
| Himmelskrone | blaugraue Höhenlandschaft, kühle Nadelbäume und Felsen |
| Tore des Olymps | helle Kalksteinfarben, schmale Zypressen, cremefarbene Wege |

Blüten variieren jetzt tatsächlich zwischen den drei vorgesehenen Farben; zuvor griff die Auswahl durch denselben Modulo-Ausdruck immer auf die erste Farbe zu. Küstenform, Landfläche, sichere Laufziele und die gewählte Spielreihenfolge bleiben erhalten. Landschaftsprofile sind Gestaltung, keine zusätzlichen Spielregeln.

Die Atlasdarstellungen für Kaufhaus, Würfelsalon, Baumhaus, Messhalle und Farblabor stellen nun die entsprechenden Spielorte als eigenständige Miniaturen dar. Das Pixelblitz-Mosaik wird durch Studiolicht und Träger ergänzt. Zehn Ortsnamen und Kurzbeschreibungen wurden an die tatsächlichen Disziplinen angepasst. Die internen Wahrzeichenkennungen bleiben kompatibel.

Dieser Ausbau verwendet konstruktive Geometrien für die Atlasminiaturen und erweitert die Landschaftsgestaltung. Er ist kein Nachweis neuer heruntergeladener Modelle. Die kuratierten Modelle in den eigentlichen Spielorten sowie ihre weitergehende Ausarbeitung und Abnahme bleiben Teil des umfassenderen Asset-/Disziplinumfangs.

## Instanzfarben und Kosten

Die erste regionale Fassung benötigte in der vollständigen 21-Insel-Übersicht 350 Zeichenaufrufe. Viele matte Objekte unterschieden sich nur durch ihre Farbe. Der Atlas fasst diese Objekte nun bei gleicher Geometrie und Materialart zusammen und speichert den ursprünglichen linearen Farbwert je Instanz. Metallische Oberflächen behalten ihre passende Materialart; selbstleuchtende Oberflächen und das vertexgefärbte Gelände behalten ihre eigenen Materialien.

Die vorhandene Zuordnung von Instanzen zu Inseln bleibt bestehen. Es werden weder Figuren noch Landschaftsdetails oder Auflösung entfernt. Geometrien, Materialien und Instanzen werden weiterhin vom Szenenbesitzer freigegeben.

Gemessene Zeichenaufrufe mit zwölf geladenen Figuren in Chromium/SwiftShader:

| Ansicht | vor Instanzfarben | final |
|---|---:|---:|
| gesamte 21-Insel-Reise, 1440 Pixel | 350 | 249 |
| gesamte 21-Insel-Reise, 390 Pixel | 350 | 249 |
| einzelne Inseln, 1440 Pixel | siehe Rohbericht | 17–70 |
| einzelne Inseln, 390 Pixel | siehe Rohbericht | 17–69 |

Das sind rund 29 % weniger Zeichenaufrufe in der Übersicht. Die vollständige Übersicht bleibt deutlich aufwendiger als ein einzelner Inselbesuch. Diese Werte sind keine GPU-Bildzeit-, Mobilgeräte- oder Langzeit-Speicherabnahme.

Die statischen Übersichtsbilder vor/nach der Instanzierung wurden zusätzlich pixelweise verglichen. Desktop: mittlere Kanalabweichung 0,00000424, maximale Abweichung 1 auf der 8-Bit-Skala, kein Pixel mit Abweichung über 3. Mobilansicht: identische Pixel. Dieser Vergleich belegt die beiden erfassten ruhigen Ansichten, nicht sämtliche denkbaren Kameras oder Animationszustände.

## Nachweise

- `scripts/test-journey.mjs`: 30 Tests bestanden. Darunter sämtliche Kataloginseln, wiederholte Einträge bis 40, Inselabstände, echte Treffer auf instanzierte Geometrie, Bewegung und persistierte Reisezustände, Relikte, Wertung und Bossabstände. Die zusätzliche Prüfung untersucht tatsächliche Gelände-Farbattribute, ursprüngliche regionale Instanzfarben und die neuen Miniaturgruppen.
- TypeScript-Prüfung und Produktionsbuild bestanden. Die bekannte Warnung zu großen JavaScript-Chunks bleibt offen.
- `scripts/check-atlas.mjs`: Desktop, Mobilansicht, 40 Einträge und reduzierte Bewegung bestanden nach der Landschaftsänderung, vor der anschließenden Instanzoptimierung. Fokus, Zoom, Drag, Gesamtansicht, Vollbild und Rückkehr zur Crew wurden geprüft.
- `scripts/check-journey-regions.mjs` für den finalen Quellstand: sämtliche 21 Orte mit zwölf geladenen Figuren auf 1440/390 Pixeln, passende Gebietsanzeige und Ortsnamen, Zeichenaufrufe, eine aktive Canvas-Fläche, keine horizontale Seitenüberbreite oder Browserfehler.
- `scripts/check-nature.mjs` erneut nach der Instanzoptimierung: Desktop mit drei Spielern, Mobilansicht mit zwei, Crew mit zwölf und reduzierte Mobilansicht mit drei Spielern bestanden. Tatsächliche Geländeklicks/-taps senden gültige Laufziele; Bewegung, Emotes und gemeinsame Reisebewegung bleiben wirksam.

Rohberichte unter `outputs/qa/`: `journey-regions-before-instancing.json`, `journey-regions-final.json` und `journey-regions-render-comparison.json`. Renderbilder: `journey-regions-final-1440-overview.png`, `journey-regions-final-390-overview.png`, `atlas-island-budget.png`, `atlas-island-dice.png`, `atlas-island-cards.png`, `atlas-island-spectrum.png` sowie die übrigen Atlas-/Nature-Bilder. Die vier genannten Ortsansichten und die Gesamtansichten wurden visuell kontrolliert.

## Verbleibende Arbeit

Die schmale Gesamtübersicht zeigt die gesamte Route weiterhin sehr klein; Ziel-/Bossbeschriftungen können sich überlagern. Hier sind eine lesbare regionale Übersicht, verbesserte Beschriftungsplatzierung und eine passende Navigation erforderlich. Die ruhige Mobil-Gesamtansicht gilt deshalb nicht als gestalterisch fertig.

Weitere kuratierte Landschafts-/Architekturmodelle, passende Transportmittel statt durchgehend gleicher Brücken, Umgebungsleben, regionale Klanggestaltung und Aufenthaltsinteraktionen bleiben offen. Ebenso fehlen vollständige Referenzgeräte-/Kaltstart-/Latenz-/Speicherprüfungen und die abschließende echte Mehrbrowser-Olympiade. Die individuellen Disziplinen werden unverändert nach [ADVENTURE-STATUS.md](ADVENTURE-STATUS.md) und der ursprünglichen Designmatrix weiterentwickelt.


Die nachfolgende Gebietsansicht, tatsächliche Beschriftungsgrößen, stabile Marker beim Drücken und die Korrekturen für 320 Pixel/kurzes Querformat sind in [JOURNEY-NAVIGATION.md](JOURNEY-NAVIGATION.md) dokumentiert. Vier Navigationsfälle mit 1/21/40 Einträgen und 2/12 Spielern, zwei echte Geländeeinstiege sowie die Nahansicht-/Emote-/Reiseprüfungen bestehen. Die vollständige Mobilübersicht bleibt klein; Gebiete und einzelne Inseln sind separat erreichbar. Transportmittel, weiterer Modell-/Klangausbau und die gesamte 21-Spiele-Abnahme bleiben offen.


Der anschließende Ausbau mit gemeinsamen Wolkenfähren und Luftschiffen steht in [JOURNEY-TRANSPORT.md](JOURNEY-TRANSPORT.md). Tatsächlich geladener Kenney-Rumpf, getrennte Deckplätze für 2–12 Figuren, zeitlich synchronisiertes Ein-/Aussteigen, Reisebegleitung, reduzierte Bewegung und frische Klangübergänge sind integriert. 39 Tests, sieben Rendererfälle, vier Nahansicht-/Bewegungsfälle, zwölf Audiosignalfälle sowie eine reale Zwei-Browser-Fährreise nach einer abgeschlossenen Hivemind-Runde bestehen. Fahrzeug-/Hafenfeinschliff, räumliche Fahrtatmosphäre, echte Hardware-/Hör-/Langzeitprüfung und die vollständige Abnahme aller 21 Spiele bleiben offen.
