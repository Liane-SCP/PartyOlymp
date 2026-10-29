# Typeracer: Tippen und Rennen in derselben Ansicht

Die Küstenstrecke besitzt ein eingebettetes Rennpult. Der vorhandene Typeracer-Controller rendert seine Texteingabe über ein React-Portal auf die Bühne. Es existiert weiterhin genau ein Eingabefeld mit derselben Sequenz-, Wiederholungs- und Bestätigungslogik. Ein Kamerawechsel, die mobile Nahansicht und Änderungen der verfügbaren Bildschirmfläche ersetzen weder dieses Feld noch den Renderer. Die zusätzliche Teilnehmerliste bleibt in der Spielkonsole erreichbar.

## Kamera und mobile Eingabe

Die Mitfahrkamera folgt der geglätteten Fahrzeugposition und Streckenrichtung. Ihr Abstand richtet sich nach dem tatsächlichen Figurenmaßstab. Die Übersicht berechnet ihren Abstand aus dem gesamten Streckenvolumen, dem Kamerawinkel und dem Seitenverhältnis; die Wasserfläche zählt nicht zum einzupassenden Spielfeld. Die ruhige Ansicht verwendet die Übersicht ohne Mitfahrt.

Auf schmalen Bildschirmen öffnet die Eingabe eine bildschirmfüllende Rennansicht mit einem erreichbaren Zurückknopf. Höhe und oberer Versatz kommen aus `visualViewport`, soweit vorhanden. Der kompakte Modus richtet sich ebenfalls nach dieser tatsächlichen Höhe. Das ist notwendig, weil eine Bildschirmtastatur den sichtbaren Bereich verkleinern kann, während `innerHeight` und CSS-Höhenabfragen unverändert bleiben. Die Eingabe verwendet mobil mindestens 16 CSS-Pixel; der kompakte untere Abstand berücksichtigt die Safe Area. Globale Raum- und Emoteleisten werden in dieser Ansicht ausgeblendet, damit sie keine Eingabe verdecken.

Der Vorlagetext scrollt innerhalb seines eigenen Feldes zur aktuellen Zeile. Die Seite wird beim Tippen nicht verschoben. Ein falsches zusätzliches Zeichen verwendet unmittelbar den Fehlerton und erhöht den bestätigten Fortschritt nicht. Verlassen und erneutes Öffnen der Rennansicht erhalten Eingabe und Canvas.

## Großes Starterfeld

Zwei bis zwölf Fahrzeuge erhalten getrennte parallele Spuren innerhalb der vorhandenen Straßenbreite. Der Maßstab der tatsächlich geladenen Kenney-Fahrzeuge wird aus ihrer Modellbreite begrenzt; Figurenmaßstab, Farbmarkierung und Sitzhöhe passen sich an. Es gibt keine künstlichen Fortschrittsabstände zwischen Spielern. Platzierung und Zieleinlauf beruhen weiter auf bestätigten Spielständen.

Das Boxenzelt steht im Innenfeld; ein versetzter Baum und versetzte Büsche halten diesen Bereich frei. Die sechs Startkegel folgen den tatsächlichen Streckenrändern außerhalb der Fahrspuren. Die vergrößerte Wasserfläche verdeckt die bisher aus der Übersicht sichtbare rechteckige Kante und benötigt keine zusätzliche Geometrie oder Draw Calls.

Die vorhandenen kamerazugewandten Boss-Sprites bleiben als Spielerfiguren erhalten. Das ist die bisherige Charakterdarstellung; es sind keine neu eingeführten dreidimensionalen Charaktermodelle. Die tatsächlichen Automodelle behalten ihre native Fahrtrichtung.

## Renderaufwand

Die beiden Kenney-Automodelle bestehen jeweils aus fünf starren Teilmeshes mit einem gemeinsamen Palettenmaterial. Diese Teile werden nach dem Laden in lokalen Modellkoordinaten zusammengefasst. Pro Variante entsteht eine gemeinsame Geometrie für alle Kopien. Die Originalmaterialien und sämtliche Dreiecke bleiben erhalten; jedes Auto benötigt einen statt fünf Zeichenaufrufen für den Körper. Das Zieltor bündelt seine wiederholten Pfosten und Zielfeldteile. Der schwebende Figuren-Bodenring entfällt im Fahrzeug; die individuelle Farbmarkierung bleibt am Auto erhalten.

Vor dieser Optimierung meldete die Streckenübersicht auf Grafikstufe Sparsam 82/130/162 Zeichenaufrufe bei 2/8/12 Teilnehmern. Die Browserprüfung erfasst die neuen Zähler, prüft die vorherigen/nachherigen Modellgrenzen, genau ein Körpermesh pro Auto und zwei gemeinsam verwendete Körpergeometrien. Sie kontrolliert außerdem das bestehende Sparsam-Budget von höchstens 100 Zeichenaufrufen und 100.000 sichtbaren Dreiecken. Diese Geometrie- und Aufrufzähler sind keine Geräte-FPS-Messung.

Der abschließende Lauf besteht in allen sechs Desktop-/Touch-Fällen mit folgenden Übersichtswerten:

| Teilnehmer | Zeichenaufrufe vorher | Nachher | Sichtbare Dreiecke nachher | Renderer-Geometrien |
|---|---:|---:|---:|---:|
| 2 | 82 | 61 | 11.339 | 35 |
| 8 | 130 | 79 | 23.483 | 35 |
| 12 | 162 | 91 | 31.579 | 35 |

Bei zwölf Fahrern sind das rund 44 Prozent weniger Zeichenaufrufe. Alle zwölf Avatare waren geladen. Desktop- und Touch-Zähler stimmen für dieselbe Gruppengröße überein. Die Materialwirkung und die Bildkomposition wurden in den tatsächlichen Desktop-/Mobilbildern kontrolliert.

## Nachweise und Grenzen

`scripts/test-race-view.mjs` prüft die Projektion aller acht Streckenvolumen-Ecken für verschiedene Seitenverhältnisse, Umlaufwinkel und Rückkehrziele sowie getrennte Fahrerpositionen für jede Gruppengröße von zwei bis zwölf. Die Modellbreiten werden zusätzlich im Browser nach dem tatsächlichen GLB-Laden geprüft.

`scripts/check-race-view.mjs` deckt 2/8/12 Teilnehmer bei 1440 und 390 CSS-Pixeln ab: echtes zeichenweises Tippen, bestätigter Fortschritt, Fehlerkorrektur, scrollende aktuelle Textzeile, Mitfahrt/Übersicht, genau ein erhaltenes Eingabefeld und Canvas, Zieleinlauf und Reload. Mobil werden sowohl ein verkleinertes Browserfenster als auch ausschließlich veränderte `visualViewport.height`/`offsetTop` bei unverändertem `innerHeight` geprüft. Der Test verlässt und öffnet die Rennansicht ausdrücklich erneut. Bilder und Ergebnisdaten liegen unter `outputs/qa/race-view-*` und `outputs/qa/race-view.json`.

Die 17 Adventure- und zwei Rennansicht-Node-Prüfungen bestehen; die sechs Prüfungen der gemeinsamen Referenzmomente ebenfalls. Die vier bestehenden Browser-Referenzabläufe und die sechs Momentfälle für Kaufhaus/Salon/Rennen bestehen nach der Eingabeänderung. Der Würfel-Klicktest wartet jetzt auf das Ende der tatsächlich gerenderten Wurfanimation, statt nach pauschal 900 ms die Endposition anzunehmen. Eine langsame Software-Grafik kann die gekappte Animationszeit langsamer fortschreiben als die Wanduhr. Der 3D-Klick und seine bestätigte Halteaktion bleiben unverändert Teil der Prüfung.

Nach dem Zusammenfassen der Automodelle besteht zusätzlich `scripts/check-scene-lifecycle.mjs`: 30 Wechsel zwischen Salon, Kaufhaus und Rennstrecke mit zwölf Teilnehmern, genau einem aktiven Canvas, stabilen Geometrie-/Texturzählern pro Szene und keinen WebGL-Fehlern. Der abschließende TypeScript-Check und Produktionsbuild bestehen. Die neuen Änderungen bleiben lokal und unveröffentlicht; keine der 21 Disziplinen wird dadurch als vollständig abgenommen erklärt.

Die Browserprüfung verwendet Chromium mit SwiftShader und koordinierte Spiel-Engine-Fixtures. Simulierte sichtbare Tastaturfläche belegt keine native Bildschirmtastatur auf einem physischen Gerät. Reale Mobilbrowser, Geräte-FPS, Eingabelatenz, vollständig gespielte Mehrbrowser-Rennen und die Gesamtabnahme sind weiterhin erforderlich. Der nachfolgende Fahrzeugsound-Ausbau steht in [RACE-MOTOR-AUDIO.md](RACE-MOTOR-AUDIO.md). Allgemeine Streckengestaltung, gehörte Gesamtmischung, Ergebnisinszenierung und die vollständige Olympiade bleiben Teil des unveränderten Gesamtziels.
