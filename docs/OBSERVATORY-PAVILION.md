# Zeitgefühl: offener Sternenpavillon

Der Spielort erhält eine eigene architektonische Silhouette: zwei offene Kuppelflügel mit Messingrippen, einen zurückgesetzten Gesimsbogen, gekrümmte Brüstung, feste Sternenverbindungen und eine helle Terrasse mit dünnem Messingmosaik. Das Teleskop steht auf einem seitlichen Beobachtungspodest. Bücherregal, Arbeitskommode, Bücher, Lampen, Pflanzbeete und Ruheplätze begründen einen gemeinsamen Beobachtungsort. Der mittlere Bereich bleibt für Messstation, Crew und bestehende Ergebnistafel frei.

`observatory-pavilion.ts` komponiert die Ausstattung im Ressourcenbesitzer der vorhandenen Szene. Statische Teilbäume werden nach den tatsächlichen Modelldownloads zusammengefasst; es entstehen keine zusätzlichen Echtzeitlichter, Renderer oder Animationsschleifen. Die Konstruktion nutzt die vorhandene Materialverwaltung. Das vorhandene Start/Stopp-System, die Sitzplätze, private lokale Zeitmessung, Wertung, gemeinsam getaktete Sternentafel und Ergebnisnavigation bleiben verbindlich.

## Tatsächliches Modell und Herkunft

„Telescope“ von CreativeTrio: https://poly.pizza/m/RjyTCQvA8b. Die konkrete Modellseite weist Public Domain / CC0 aus; am 18.10.2026 überprüft. Der Originaldownload enthält 734 Dreiecke, eine eingebettete Palette und keine Animationen oder externen Ressourcen. Er wird als 62.720-Byte-GLB im Projekt ausgeliefert. Die Geometrie und Palette bleiben erhalten; der gemeinsame Loader vereinheitlicht Maßstab, Rauheit und Metallanteil.

Original und Quellenbeleg: `assets/source-models/observatory/`. Reproduzierbare Übernahme mit Quellen-/Formatprüfung: `scripts/prepare-observatory-telescope.mjs`. Hash, Größe, Lizenz und Änderungen stehen im öffentlichen Modellmanifest und der eigenen Lizenzdatei. Die bereits vorhandenen Kenney-Möbel und Pflanzen behalten ihre individuellen Manifestbelege. Das generierte Zeitgefühl-Vorladepaket enthält zehn tatsächlich verwendete GLBs mit zusammen 141.524 Byte.

## Schutz der Zeitmechanik

Die gesamte Pavilionausstattung ist unveränderlich: kein schwenkendes Teleskop, keine wandernden Sterne, keine Pendel, kein Flackern und keine laufende Lichteinstellung. Das dekorative Sternenrelief ist fest. Es gibt keine nummerierte Uhr auf dem Boden. Ruhige Messung und beabsichtigte Ablenkungen bleiben getrennt. Die bestehende Szenensteuerung friert während jeder laufenden Messvariante die Figuren ein; Sternpunkte drehen sich in Zeitgefühl grundsätzlich nicht.

Die visuellen Prüfungen müssen insbesondere beweisen, dass die Innenbildpunkte während der ruhigen Messung identisch bleiben. Audioanalysen müssen weiterhin stille Musik beziehungsweise ausschließlich die vorgesehenen unregelmäßigen Echotöne nachweisen. Gestaltung allein ersetzt diese Fairnessprüfungen nicht.

## Prüfung und Grenzen

Die sechs Präsentationstests, TypeScript und Produktionsbuild bestehen auch nach der visuellen Korrektur des rückwärtigen Gesimsbogens und der Kuppelrippen. Kontrollierte tatsächliche Rendererabläufe:

- Sechs Sparfälle: 2/8/12 Teilnehmer × 1440/390 Pixel, je zwei Browsersichten. Tatsächliche 3D-Maus-/Touchauswahl, identische ruhige Canvas-Innenpixel, geschützte eigene Stopps, gemeinsam getaktete Auflösung, Wiederbeitritt, alle Ergebnissseiten, Nahansicht und Folgerundenreset bestehen. Bericht `timing-constellation-low.json`, Log `observatory-pavilion-final-browser.log`.
- Zwei hohe Zwölfspielerfälle mit denselben Eingabe-/Bild-/Auflösungskriterien bestehen. Bericht `timing-constellation-high.json`, Log `observatory-pavilion-high-browser.log`.
- Sechs Audiomessungen für calm/echo/decoy × breit/schmal bestehen: ein tatsächlicher AudioContext, stille Musik während jeder Messung, ausschließlich vorgesehene unregelmäßige Echotöne beziehungsweise Zahlennebel, echte Stoppaktion. `timing-modes.json` und `observatory-pavilion-modes.log`.
- Zwei Audio-Auflösungsfälle bestehen: exakte Freigabe, Quelle an der tatsächlich sichtbaren Tafel, keine Wiederholung nach Uhrkorrektur, Sichtbarkeitspause und stiller historischer Wiederbeitritt. `timing-reveal-audio.json` und `observatory-pavilion-reveal-audio.log`.
- Alle zehn GLBs werden in der Regelphase vorbereitet. Auch mit deaktiviertem HTTP-Cache gibt es keinen erneuten vorbereiteten Modellabruf beim Einstieg. Die ruhige Ansichtsumschaltung erhält Canvas und Modelle. `observatory-pavilion-preload.json`.
- Shader Hoch/breit: 12 vorbereitete und 12 zuerst sichtbare Programme; Sparsam/schmal: 9/9, kein Wachstum beim ersten sichtbaren Bild. `observatory-pavilion-shaders.json`.
- 18 Wechsel zwischen Observatorium, Salon, Casino und Kaufhaus bestehen mit zwölf geladenen Figuren und einem aktiven Canvas. Alle fünf Observatoriumsbesuche besitzen dieselben 64 Zeichenaufrufe, 11.212 Dreiecke, 38 Geometrien und 17 Texturen. Keine erfassten WebGL-Fehler. `observatory-pavilion-lifecycle.json`.

| Anfangsansicht | Sparsam: Zeichenaufrufe | Hoch: Zeichenaufrufe |
|---|---|---|
| Desktop, 2 / 8 / 12 Teilnehmer | 44 / 56 / 64 | Zwölfspielerprobe: 91 |
| Mobile Messstation, 2 / 8 / 12 Teilnehmer | jeweils 40 | Zwölfspielerprobe: 67 |
| Ergebnis-Nahansicht, 2 / 8 / 12 Teilnehmer | 43 / 45 / 45 | Zwölfspielerprobe: 73 |

Die aktuellen Desktop-/Mobil-Messstationen und die Zwölfspieler-Gruppenauflösung wurden als tatsächliche Renderbilder angesehen. Die Kuppel ist geöffnet und nach hinten zurückgesetzt; ihr Gesims kreuzt den Spielbereich nicht. Teleskop und Möblierung lassen Messknopf und Ergebniskamera frei. Alle genannten Berichte liegen in `outputs/qa/`. Kontrollierte Serverzeit/Engine-Schnappschüsse und SwiftShader-Funktionsprüfungen ersetzen keine echte vollständige Mehrbrowser-Olympiade und keine Geräte-FPS.

## Echte lokale Zweierpartie

`scripts/check-timing-browser.mjs` wurde an den vorhandenen Reiseablauf angepasst: Nach Start wartet es auf die tatsächliche Regelphase, bevor es Bereitschaft sendet. Der erste Versuch mit dem alten Skript wurde vom Server während der vorgeschalteten Reise korrekt mit „Bereitschaft aktuell nicht verfügbar“ abgewiesen; die Anwendung wurde dafür nicht verändert.

Die abschließende Runde verwendet echte lokale HTTP-/D1-Daten und Browser-WebSockets, unveränderte Uhren, unabhängige Starts, Maus bei 1440 Pixeln und native Touch-Eingabe bei 390 Pixeln. Der breite Browser lädt während seiner laufenden Messung neu. Bei einer echten Zielzeit von 13 Sekunden liegen die bestätigten Abweichungen bei +31 und +311 ms. Beide Clients erhalten genau zwei erfolgreiche Bestätigungen für ihre beiden Aktionen; Verbindungen 2/1 durch den Wiederbeitritt, Schnappschüsse 40/37. Keine erfassten Clientfehler. Bericht `timing-live-session.json`, Log `observatory-pavilion-live-final.log`.

Dies ist eine tatsächliche einzelne Zweier-Runde. Der bereits separat reproduzierte workerd-Abschlussfehler taucht beim Schließen von Browserverbindungen weiterhin im Workerlog auf. Die bestandene Runde ist kein Nachweis seiner Behebung und kein Ersatz für die vollständige Mehrbrowser-Abnahme; siehe [REALTIME-RUNTIME.md](REALTIME-RUNTIME.md).

## Warme Desktop-GPU-Proben

Nach Beendigung der anderen Browserprüfungen wurden zwei kurze native Seitenansichten in Hoch mit zwölf Teilnehmern, stummem Audio und der tatsächlichen RTX 4080 SUPER über D3D11 gemessen. Je 241 rAF-Abstände: p95 und Maximum 16,8 ms, kein Abstand über 33 ms, keine erfassten Browserfehler.

| Fenster / Ansicht | Tatsächlicher Renderpuffer | Zeichenaufrufe / Dreiecke | Render-CPU-p95 |
|---|---|---|---|
| 1920 × 1080 / Gruppe vor Start | 1040 × 797 | 91 / 21.676 | 0,7 ms |
| 390 × 844 / Messstation vor Start | 364 × 330 | 67 / 21.076 | 0,6 ms |

Bericht `observatory-pavilion-hardware.json`, Log `observatory-pavilion-hardware.log`. Diese Messfenster betreffen den warmen Anfangszustand auf derselben Desktop-GPU. Schmale Fenster sind keine Mobilgeräte; rAF-Abstände sind keine vollständigen GPU-Frametraces. Kaltstart, aktive Auflösungsspitzen, Eingabelatenz und langer Prozessspeicherverlauf bleiben separat zu prüfen.

Weitere individuelle Figuren-/Ergebnis-/Klanggestaltung, physische Touchgeräte, Hörabnahme, echte längere Gruppenpartien und die vollständige Abnahme aller 21 Disziplinen bleiben offen. Keine neue Veröffentlichung.
