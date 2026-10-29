# Reisegebiete, lesbare Kartenbeschriftungen und Touch-Einstieg

Stand: 18.10.2026. Lokaler Zwischenstand im weiterhin offenen Gesamtziel für alle 21 Disziplinen; keine Veröffentlichung oder vollständige Oberweltabnahme.

## Gebiete statt ausschließlich Gesamtübersicht

Die Gesamtübersicht bleibt erreichbar. Zusätzlich richtet „Reisegebiet ansehen“ die Kamera auf das Kapitel der ausgewählten Insel. In Gesamt- und Gebietsansicht bieten ein beschriftetes Auswahlfeld und zwei 44 Pixel hohe Schaltflächen direkten Zugang zu den anderen Kapiteln. Gebietstitel und Etappenbereich erklären den Ausschnitt. Wiederholte Landschaftsprofile in langen Partien bleiben durch ihre Kapitelnummern unterscheidbar.

Gebietswechsel sind lokale Erkundung: Sie ändern weder die aktuelle Disziplin noch Bereitschaft, Punkte oder Positionen der Crew. Die Auswahl einer konkreten Insel öffnet deren bisherige Nahansicht. Erst dort gelten Geländetipps bei eingeschaltetem Laufmodus als Laufziele. Die Laufpfeile erscheinen ebenfalls nur in dieser Ansicht; dadurch verdecken sie keinen Reisetitel in der Übersicht.

Die Gebiets-/Gesamtansicht bleibt beim Wechsel ins Vollbild und zurück erhalten. Größenwechsel passen den Ausschnitt erneut an. Kurzes Querformat erhält eine horizontale Werkzeugleiste und einen kompakteren Informationsteil.

Die Gebietskamera verwendet die vorhandenen räumlichen Ausmaße einschließlich Klippen und hoher Bossbauten. Zusätzlich startet ihre Ausrichtung beim tatsächlichen räumlichen Mittelpunkt des Kapitels. Die erste Fassung verwendete dafür den Mittelpunkt der gesamten Reise: Bei einer 40-Spiele-Route konnten entfernte kurze Kapitel dadurch hinter der Kamera liegen. Die vollständige Prüfung aller 13 Kapitel dieser Route deckte den Fehler auf; der lokale Tiefenmittelpunkt korrigiert ihn.

## Beschriftungen und schmale Ansichten

Die Kartenbeschriftungen werden anhand ihrer tatsächlichen Breite und Höhe platziert. Die Platzierung reserviert zunächst die sichtbaren Titel, Werkzeuge, Informationsflächen und sozialen Bedienelemente sowie den Zielnamen des Olymps. Danach folgen ausgewählte Insel, Crewinsel, Bosse und übrige Etappen in dieser Priorität. Randnahe Beschriftungen bleiben innerhalb der Karte. Überlagerte Beschriftungen werden ausgeblendet; sämtliche Etappen bleiben über die bestehende Etappenliste erreichbar.

Messungen der Labelgrößen erfolgen gebündelt nach Ansichts-/Größenänderungen. Ein ResizeObserver berücksichtigt geänderte Informationsflächen. Hinzugefügte oder entfernte Laufsteuerungen werden in die Hindernisliste übernommen beziehungsweise daraus entfernt. In jeder Animationsrunde werden nur die projizierten Positionen und die numerische Kollisionsprüfung aktualisiert.

Der allgemeine `button:active`-Effekt hatte die zentrierende Transformation einer Kartenbeschriftung ersetzt. Dadurch konnte diese während des Antippens unter dem Finger wegrutschen und den Klick verlieren. Kartenbeschriftungen behalten ihre Ankertransformation jetzt auch im gedrückten Zustand. Ein tatsächlicher gehaltener Mausklick sowie native Touch-Einstiege prüfen das Verhalten.

Auf sehr schmalen Bildschirmen wurde der Kartentitel begrenzt und die Emote-Leiste passend zur Werkzeugleiste angeordnet. Außerhalb der immersiven Spielansichten erhält der allgemeine Kopfbereich unter 381 Pixeln eine kompakte Marke und 44-Pixel-Symboltasten. Die globale Favoritenleiste darf in dieser Breite intern scrollen, anstatt die Seite nach rechts zu vergrößern. Eine einzelne Etappe wird im Titel korrekt als „1 Insel“ bezeichnet.

## Prüfung

`outputs/qa/journey-navigation.json` enthält vier bestandene Fälle:

| Fensterbreite | Spieler | Spieleinträge | untersuchte Kapitel | Bewegung |
|---|---:|---:|---:|---|
| 320 | 12 | 21 | 7 | reduziert |
| 390 | 12 | 21 | 7 | normal |
| 1440 | 2 | 40 | 13 | reduziert |
| 390 | 2 | 1 | 1 | reduziert |

Geprüft wurden sämtliche Gebiete, passende Inselbeschriftungen, tatsächliche DOM-Rechtecke nach dem Einpassen, überdeckungsfreie erreichbare Gebietseingaben, vollständiger Seitenrand, gleiche Canvas-Identität beim Erkunden, Vollbild, Drehung/Größenwechsel, erhaltener Gebietsausschnitt, native Markerwahl, gehaltener Mausklick, Tastatur-Einstieg und Rückkehr zur Crew. Kein untersuchter Gebietswechsel schaltete die Disziplin weiter. Jeder erfasste Gebietsausschnitt enthielt mindestens eine erreichbare Inselbeschriftung; es wird nicht behauptet, dass sämtliche Namen gleichzeitig sichtbar sind.

Die kleineren Kameraausschnitte bringen die Reise deutlich näher: Bei 320 Pixeln beträgt die vollständige Ansichtsgröße 1593,59 Welteinheiten gegenüber 190,23–298,82 für die Gebiete; bei 390 Pixeln mit 21 Etappen 1061,88 gegenüber 148,90–206,15. Diese Werte beschreiben die Kamera und keine Auflösung oder Bildrate.

`outputs/qa/journey-entry.json` belegt zusätzlich zwei echte Geländeeinstiege auf 390/1440 Pixeln. Der Tap beziehungsweise Mausklick auf die gerenderte aktuelle Insel in der Gebietsansicht öffnet deren Nahansicht, ohne einen Laufbefehl oder Disziplinwechsel zu erzeugen. In einem ruhenden 800-ms-Fenster wurden bei weiterlaufenden Renderframes jeweils null Zugriffe auf die Labelgrößen erfasst. Dies ist kein allgemeines CPU-/GPU- oder Latenzbenchmark.

Weitere Nachweise:

- Drei Tests in `tests/journey-labels.test.ts` bestanden: gemessene lange Texte/Ränder, Hindernisse/Prioritäten sowie ungültige und nicht gemessene Anker.
- TypeScript-Prüfung und Produktionsbuild bestanden. Die bestehende Warnung zu großen JavaScript-Chunks bleibt offen.
- `scripts/check-nature.mjs` nach den Navigations- und Laufmodusänderungen erneut bestanden: Desktop mit drei Spielern, Mobilansicht mit zwei, Crew mit zwölf und reduzierte Mobilansicht mit drei. Tatsächliche Geländeeingabe in der Nahansicht, Emotes, Figurenbewegung und gemeinsame Reisebewegung bleiben wirksam.

Renderbilder `journey-navigation-320-21-all.png`, `journey-navigation-320-21-region.png`, `journey-navigation-390-21-rotated.png`, `journey-navigation-1440-40-region.png` und `journey-navigation-390-1-region.png` wurden visuell geprüft. Die Navigations-/Entry-Berichte entstanden vor der abschließenden reinen Singular-Korrektur im Titel; TypeScript und Produktionsbuild wurden dafür erneut ausgeführt.

## Grenzen und verbleibender Umfang

Die vollständige lange Reise bleibt auf einem schmalen Handy naturgemäß eine kleine Übersicht. Für lesbare Erkundung stehen die Gebiets- und Inselansichten zur Verfügung. Die Prüfungen decken die erfassten ruhigen Zustände und Bedienabläufe ab, keine beliebigen Überlagerungen während jeder Kamerabewegung oder ein geöffnetes Emote-Menü.

SwiftShader und simulierte Touchfenster sind keine echten Mobilgeräte oder Hardware-FPS-Nachweise. Orts- und Architekturmodelle, abwechslungsreiche Transportmittel, regionale Klanggestaltung, weitere soziale Interaktionen sowie Referenzgeräte-, Hör-, Langzeit- und echte Mehrbrowser-Olympiadenprüfung bleiben offen. [JOURNEY-REGIONS.md](JOURNEY-REGIONS.md) dokumentiert die vorangegangenen Landschaften und Instanzfarben; [ADVENTURE-STATUS.md](ADVENTURE-STATUS.md) erhält den vollständigen Disziplinumfang.


Der anschließende Ausbau mit gemeinsamen Wolkenfähren und Luftschiffen steht in [JOURNEY-TRANSPORT.md](JOURNEY-TRANSPORT.md). Tatsächlich geladener Kenney-Rumpf, getrennte Deckplätze für 2–12 Figuren, zeitlich synchronisiertes Ein-/Aussteigen, Reisebegleitung, reduzierte Bewegung und frische Klangübergänge sind integriert. 39 Tests, sieben Rendererfälle, vier Nahansicht-/Bewegungsfälle, zwölf Audiosignalfälle sowie eine reale Zwei-Browser-Fährreise nach einer abgeschlossenen Hivemind-Runde bestehen. Fahrzeug-/Hafenfeinschliff, räumliche Fahrtatmosphäre, echte Hardware-/Hör-/Langzeitprüfung und die vollständige Abnahme aller 21 Spiele bleiben offen.
