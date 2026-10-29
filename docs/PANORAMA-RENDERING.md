# Weltreise: Panoramapuffer und präzise Ergebnisübersicht

Dieser Nachtrag ergänzt [NAVIGATION-WORKSHOP.md](NAVIGATION-WORKSHOP.md). Die dort dokumentierten früheren 50-ms-Ergebniswechsel bleiben erhalten. Die folgenden Änderungen betreffen tatsächliche Panoramaeingaben, verborgene beziehungsweise entfernte Ansichten, das erste Einpassen der Ergebniskarte und einen doppelten Auflösungsklang.

## Befund und Korrektur

Der Panorama-Renderer setzte bei jedem Zeichnen sowohl `canvas.width` als auch `canvas.height`, selbst wenn die Werte identisch waren. Dadurch mussten Blickbewegung, Tastatur und Zoom den WebGL-Zeichenpuffer immer wieder zurücksetzen. Im Gegensatz dazu brauchen sie bei gleicher Bildschirmgröße nur neue Kamera-Uniforms und einen neuen Draw-Aufruf.

`panorama.tsx` ändert die Puffergröße jetzt nur, wenn sich die tatsächlichen Pixelmaße ändern. Ein noch nicht geladenes, entsorgtes, vom Dokument getrenntes oder auf null verkleinertes Panorama zeichnet nicht. Das verhindert auch den in der Zeitlinie beobachteten unnötigen Zeichenversuch nach einem Resize-Ereignis mit null Breite/Höhe beim Entfernen der Eingabeansicht. Die tatsächliche Ortsaufnahme und ihre Blickparameter bleiben unverändert.

Die Straßenkarte startete zuvor mit einer angenommenen Größe von 600 × 320. Ihr einmaliges automatisches Einpassen konnte dadurch bereits vor der ersten tatsächlichen Größenmessung abgeschlossen sein. Sie wartet nun auf positive gemessene Maße, ignoriert Nullereignisse und erzeugt bei unveränderter Größe keinen neuen Größenstatus. Die globale Übersicht darf bis Zoomstufe 0 herauszoomen; die eigentliche Eingabekarte startet weiterhin auf Stufe 1 und unterstützt unverändert Pfeiltasten, Enter, Zoom und präzises Pinsetzen.

In einem Desktop-Spielpult mit wenig Platz standen Karte und Rangliste trotz zu schmaler Kartenfläche weiterhin nebeneinander. Eine auf das tatsächliche Spielpult bezogene Containerabfrage ordnet sie unterhalb von 600 Pixel Inhaltsbreite untereinander an. Große Spielpulte behalten ihre Zweispaltenansicht. Die Rangliste verwendet weiter mindestens gut lesbare, innerhalb des Pults bleibende Karten. Das Ergebnis kann damit beispielsweise auch auf einem 1280-Pixel-Desktop alle zwölf Tipps und das Ziel zeigen.

Zusätzlich spielte die 3D-Bühne nach dem eigenen räumlichen Reisemotiv weiterhin die allgemeine `sceneResolve`-Melodie. Die Weltreise wird nun von diesem zusätzlichen allgemeinen Klang ausgenommen. Der bestätigte Serverzustand löst weiterhin genau das eigene Reisemotiv aus; Stimmenzahl und Cue-Grenzen werden dadurch nicht unnötig belastet.

## Native Regression

`scripts/check-panorama-resize.mjs` verwendet echte Enginezustände und eine tatsächlich geladene Panoramaaufnahme. Es beobachtet die nativen Canvas-Größensetter und prüft Maus/Tastatur bei 1440 Pixel sowie native CDP-Touchereignisse/Tastatur bei 390 Pixel.

Der Test wurde zuerst gegen den vorherigen Build ausgeführt. `panorama-resize-before.log` zeigt die beabsichtigte Regression: identische Breiten-/Höhenzuweisungen während Blickbewegung und Zoom. Der erste korrigierte Zwischenstand fand außerdem einen zu eng eingepassten Kartenausschnitt (`panorama-resize-fixed.log`); diese Feststellung führte zur globalen Zoomstufe und zur an das Pult angepassten Spaltenanordnung.

`panorama-resize-fit-fixed.json` bestätigt für beide endgültigen Fälle:

- Keine Pufferzuweisung bei vier Tastatureingaben und acht Schritten einer Maus- beziehungsweise Touchbewegung; die Kamerawerte ändern sich tatsächlich.
- Verdeckte Panoramen behalten ihren positiven Puffer und setzen ihn nicht auf null.
- Eine echte Viewportänderung passt den Puffer mit positiven, tatsächlich geänderten Werten an: zwei Zuweisungen im breiten Fall, eine im schmalen.
- Das Entfernen der Panoramaansicht bei zwölf tatsächlichen Abgaben erzeugt keine Nullpufferzuweisung.
- Nach dem Ergebniswechsel liegen Ziel und zwölf Tipps innerhalb des anhand der tatsächlichen SVG-Maße geprüften Kartenbereichs. Nach der jeweiligen Größenänderung misst er ungefähr 493 × 320 beziehungsweise 376 × 290 Pixel.

Die Tests liefern kontrollierte HTTP-Ansichten und schließen die WebSocket-Verbindung. Sie sind keine echte Netzwerkpartie oder physische Mobilgeräteprüfung. Die kurze zusätzliche Sichtbarkeitswartezeit dient hier ausschließlich der Prüfung abgeschlossener Resize-/Fit-Effekte.

## Erneute Hardwareproben

Die Instrumentierung von `createProgram`, `linkProgram` und `getProgramParameter` in `navigation-transition-gl-before.json` und `navigation-transition-current-timeline.json` erfasste insgesamt jeweils 358 WebGL2-Aufrufe, ohne weitere Programmoperation während des viersekündigen Ergebnis-Samples. Die vorangegangene Vorbereitung der unsichtbaren Routen/Marker funktioniert damit im geprüften Ablauf; sie allein beseitigte die Bildzeitspitze dennoch nicht. Die vollständige spätere Zeitlinie zeigt weiterhin Ergebnislayoutarbeit und Größenereignisse alter Eingabeansichten.

`navigation-transition-soft-impact.json` bezeichnet nur eine Probe mit geringerer Kamerawackelstärke. Die Kamerabewegung war weiterhin aktiv; diese Probe ist ausdrücklich kein Nachweis einer ausgeschalteten Kamerabewegung und kein kausaler Vergleich dafür.

Nach Panorama-/Kartenkorrektur wurden vier uninstrumentierte, kurze, warme Proben auf der tatsächlichen RTX 4080 SUPER über D3D11 ausgeführt. Sie verwenden hohe Qualität, zwölf tatsächliche Pinabgaben während der Messung, das normale Seitenlayout und stummes Audio. `navigation-transition-fit-fixed-hardware.json` und `navigation-transition-fit-repeat-hardware.json` enthalten:

| Probe | Viewport / tatsächlicher Zeichenpuffer | rAF-P95 | Längster rAF-Abstand | App-Render-CPU P95 |
|---|---|---|---|---|
| Erster breiter Ergebniswechsel | 1920 / 1040 × 797 | 16,8 ms | 33,3 ms | 1,0 ms |
| Schmaler Ergebniswechsel | 390 / 364 × 330 | 16,7 ms | 16,8 ms | 0,9 ms |
| Zweite unabhängige breite Probe | 1920 / 1040 × 797 | 16,7 ms | 33,2 ms | 0,9 ms |
| Dritte unabhängige breite Probe | 1920 / 1040 × 797 | 16,8 ms | 16,8 ms | 0,9 ms |

Alle zeigen nach Freigabe zwölf öffentliche Routen, den abgeschlossenen Flug und die tatsächlichen Crew-Ergebnisse. Die Geometrie bleibt bei 130 Zeichenaufrufen und 23.242 Dreiecken. Die früheren 50-ms-Abstände wurden in diesen drei neuen breiten Proben nicht beobachtet. Zwei Proben verlieren im Übergang weiterhin ein Bildintervall. Das belegt eine günstigere begrenzte Messreihe nach den zusammengehörigen Änderungen, aber keine universelle Ursachenbehebung, dauerhafte 60-FPS-Garantie oder vollständige GPU-Bildzeitmessung. Schmale Viewports verwenden dieselbe Desktop-GPU; Iris Xe, mittlere Mobilhardware, kalte Ladezeiten und echte Netzwerkpartien bleiben offen.

## Lesbare Zuordnung dicht benachbarter Tipps

Die anschließende Bildkontrolle zeigte trotz korrekter Kartenmaße eine weitere Schwäche: Zwölf nahe beieinanderliegende Tipps überdeckten sich mit ihren vollständigen Namen und Entfernungen. Die Karte zeichnet nun weiterhin sämtliche öffentlichen Pins und Routen, aber nur die Zielbeschriftung direkt im Kartenbild. Ein eigener, ausdrücklich beschrifteter Selektor hebt jeden veröffentlichten Spielertipp hervor. Sein Name und seine Entfernung stehen separat im lesbaren HTML-Bereich. Die ausgewählte Route wird betont, andere Routen bleiben abgeschwächt sichtbar. Ein Klick oder Tap nahe einem tatsächlichen Pin wählt denselben Teilnehmer. „Alle Tipps“ hebt die Auswahl wieder auf und passt die Karte ein.

Die Auswahl steht nach einer weiteren Layoutkontrolle über der Karte, damit die nächste Handlung in einem schmalen Spielpult sofort erreichbar bleibt. Beschriftung und Selektor sind über eine eindeutige `useId`-/`htmlFor`-Zuordnung verbunden. Eine erste Prüfung fand die ursprünglich verschachtelte Beschriftung nicht exakt (`panorama-map-picker.log`); die ausdrückliche Zuordnung besteht in `panorama-map-picker-fixed.json`.

Die erweiterten nativen Prüfungen wählen alle zwölf Teilnehmer, kontrollieren die tatsächlich hervorgehobenen SVG-Pins und Routen, die vollständigen HTML-Angaben und unveränderte Kartenpositionen. Zusätzlich funktionieren Home/Pfeiltaste im nativen Selektor sowie ein tatsächlicher Maus-/Touchklick auf Pin sechs. Die globale Stufe 0 ist über „Welt“ erreichbar und die Minus-Schaltfläche dort korrekt gesperrt. Die Ergebnisaktionen senden keine Spielaktion und verändern keine abgegebene Antwort. Die endgültige bloße Versetzung des Selektors in die Werkzeugleiste wird mit denselben Interaktionen und aktuellen Renderbildern erneut geprüft.

`navigation-picker-final-native.json` enthält vier 2/12-Spielerabläufe in niedriger Qualität; `navigation-picker-final-missing.json` zwei Zwölferabläufe in hoher Qualität, mit reduzierter Bewegung und einer fehlenden Abgabe. Die erneuten beiden Audioprüfungen und TypeScript stehen unter `navigation-picker-final-audio.json` beziehungsweise `navigation-picker-final-types.log`.

Die zwei anschließenden Hardwareproben mit dem Selektor vor seiner bloßen Versetzung (`navigation-map-picker-final-hardware.json`) zeigen jeweils 241 rAF-Intervalle, P95 16,7 ms, einen längsten Abstand von 16,8 ms, App-Bildzeit P95 16,7 ms und Render-CPU P95 0,9 ms. Die Zeichnungsflächen und die Geometrie entsprechen den oben genannten breiten/schmalen Proben. Diese weiteren günstigen kurzen Messungen erweitern den Nachweis; sie ersetzen weiterhin keine Referenzgeräte- oder Langzeitabnahme.

Nach der Versetzung über die Karte bestehen dieselben zwei vollständigen Puffer-/Karten-/Auswahlprüfungen erneut (`panorama-map-toolbar.json`). Aktuelle Renderbilder `panorama-result-selected-1280.png` und `panorama-result-selected-430.png` zeigen die tatsächliche ausgewählte Route, separat lesbare Teilnehmerangaben und die freie Zielbeschriftung. Die gesonderten Rangansichten zeigen auch die letzten Teilnehmer innerhalb des bedienbaren Scrollbereichs. Eine veraltete Farbangabe in der Legende wird durch die eindeutige Zuordnung zur tatsächlichen Beschriftung „Gesuchter Ort“ ersetzt.

Die letzten beiden kurzen Hardwareproben (`navigation-map-toolbar-hardware.json`) messen breit/schmal P95 16,8/16,8 ms, längste rAF-Abstände 33,2/16,8 ms und Render-CPU P95 0,9/0,8 ms bei weiterhin 130 Zeichenaufrufen und 23.242 Dreiecken. Die breite Übergangsspitze um ein Bildintervall bleibt damit auch im letzten geprüften Aufbau sichtbar. TypeScript und Produktionsbuild bestehen nach der Toolbarversetzung; die anschließende reine Legendentextkorrektur wurde mit einem weiteren erfolgreichen Produktionsbuild abgeschlossen (`navigation-map-legend-build.log`).

## Weitere Abnahme

Die sieben Node-Prüfungen der Navigation und TypeScript bestehen erneut. Erneute 2/8/12-Spielerabläufe, reduzierte Bewegung, fehlende Antworten, private Pins und Wiederbeitritt sowie 18 Szenenwechsel und die beiden räumlichen Audioprüfungen sind in den zugehörigen `navigation-transition-*`-Berichten dokumentiert. Die Audioprüfung kontrolliert zusätzlich, dass neben dem eigenen Reisemotiv nicht die charakteristische allgemeine Enthüllungsmelodie erklingt.

Die Weltreise und die vollständige Olympiade sind damit weiterhin nicht vollständig abgenommen. Weitere persönliche Kamera-/Arbeitsplatzgestaltung, größere Crew-Tischkarten, Figurenreaktionen, Hörprüfung, reale Referenzgeräte, Kaltstart-/Eingabelatenz-/Prozessspeichermessung und die komplette Live-Mehrbrowser-Olympiade bleiben erforderlich. Diese Änderungen beheben das bekannte workerd-WebSocket-Schließproblem nicht. Die Arbeitsfassung bleibt unveröffentlicht.


Der weitere Ausbau verbindet die öffentliche Kartenauswahl mit der tatsächlichen Route, dem Pin und dem zugehörigen Crewplatz in der 3D-Werkstatt. Die lokale Zuordnung, der unveränderte gemeinsame Flugzeitpunkt und neue Prüfungen stehen in [GEO-LINKED-RESULTS.md](GEO-LINKED-RESULTS.md).
