# Codeknacker: Schlossmacherwerkstatt und echte Farbmechanismen

Der Tresor steht nun in einer ausgestatteten Werkstatt mit Mauerfeldern, kräftigen Stützpfeilern, Kupferleitungen, Halterungen, matten Deckenleuchten und einem markierten Mittelgang. Seitliche Maschinen, Ventile, Bücher und Ersatzteile erklären den Arbeitsort. Hinter der bestehenden schwingenden Tür sind Ablagefächer mit Griffen, eine Schwelle und ein innerer Boden sichtbar. Die Ausstattung bleibt außerhalb der eigenen Werkbank und ergänzt keine geheimen Farbhinweise.

Die vier bedienbaren Farbmechanismen haben runde Farbflächen und tatsächlich importierte Zahnräder. Jede gewählte Farbe besitzt zusätzlich ein Punktmuster von eins bis sechs, passend zu den vorhandenen nummerierten Farbtasten. Die Auswahl ist dadurch nicht nur an der Farbe erkennbar. Das gewählte Zahnrad dreht sich an seinem eigenen Mittelpunkt; die aktuelle Position ist weiter hervorgehoben. Die ursprünglichen Spielerfiguren, Arbeitsplätze, Eingaben und Regeln bleiben verbindlich.

Die abschließende Bildkontrolle zeigte, dass die bisherigen hohen öffentlichen Statusschilder mehrere Crewgesichter verdeckten. Die Schilder stehen nun mit ihren Trefferlampen auf niedriger Arbeitshöhe. In der erneuten tatsächlichen Zwölfspieler-Gruppenaufnahme sind die Gesichter über den Tafeln sichtbar. Regeln, Statuswerte und die Zuordnung zu den Teilnehmern wurden dafür nicht verändert.

## Modell, Quelle und Vorbereitung

„Collectible Gear“ von Quaternius: https://poly.pizza/m/1tgrqxAQia, konkrete Modellseite am 18.10.2026 als Public Domain / CC0 geprüft. Das heruntergeladene Original enthält 440 Dreiecke und ein untexturiertes Material. Die Vorderfläche liegt im Original schräg im Koordinatensystem. `scripts/prepare-vault-gear.mjs` richtet sie mit einem zusätzlichen Wurzelknoten auf die Z-Achse aus. Originalgeometrie, Normalen, Topologie, Binärdaten und Palette bleiben erhalten. Eine Drehung um Z bewegt so tatsächlich die Zahnradachse.

Original, Quellenbeleg und Lizenzdatei stehen in `assets/source-models/vault/`. Das öffentliche Manifest enthält Original-/Auslieferungshash, Quelle, Urheber, Lizenz, Änderung, Normalisierungsrotation und Dateigröße. Das ausgelieferte GLB benötigt 16.240 Byte. Vier Farbmechanismen, das gemeinsame Türhandrad und ein Ersatzteil nutzen dasselbe Modell. Die bereits importierten Kenney-Möbel und -Maschinen behalten ihre jeweiligen Manifestbelege. Das aktuelle Codeknacker-Vorladepaket enthält neun tatsächlich verwendete Modelle mit insgesamt 144.792 Byte.

## Ressourcen und Performance

`vault-workshop.ts` komponiert die Architektur innerhalb des vorhandenen Ressourcenbesitzers. Statische Raumteile werden nach dem Laden zusammengefasst. Der Raum verwendet die vorhandene Sonnen-/Randbeleuchtung; es kommen keine zusätzlichen Echtzeitlichter hinzu. Die gezeichneten Leuchten haben einen konstanten Materialakzent. Generische Außenwolken und schwebende Außenfelsen werden in diesem Innenraum nicht mehr gezeichnet.

Die erste Zwölfspielerprobe benötigte 101 Zeichenaufrufe und wurde vom unveränderten Sparbudget von 100 korrekt abgewiesen. `vault-dial-gears.ts` zeichnet die vier gleichen Zahnräder jetzt gemeinsam und erhält dabei die tatsächlichen lokalen Achsen, Auswahlskalierungen und Drehungen. Der neue Geometrieklon gehört der Szene; die Material- und Originalgeometrie-Besitzer bleiben beim Modellloader. Vier eigene Farbflächen benötigen einen instanzierten Zeichenaufruf, alle bis zu 24 Farbpunkte einen weiteren.

| Anfangsansicht | Sparsam | Hoch |
|---|---|---|
| 2 Spieler, breit / schmal | 68 / 68 Zeichenaufrufe | nicht erneut gemessen |
| 8 Spieler, breit / schmal | 86 / 86 Zeichenaufrufe | nicht erneut gemessen |
| 12 Spieler, breit / schmal | 98 / 98 Zeichenaufrufe | 142 / 142 Zeichenaufrufe |

Der frühere Raum lag im Zwölfspieler-Sparfall bei 100 Zeichenaufrufen. Der neue, umfangreichere Raum bleibt innerhalb desselben Budgets. Diese Zähler sind keine Geräte-FPS.

## Aktuelle Funktionsnachweise

- Sechs Präsentationsbereiche bestehen: getrennte projizierte Touchflächen, bestätigte gemeinsame Auflösung, ausschließlich öffentliche Fremdstatuswerte, tatsächliche Tür-/Handradpositionen, eigene Farben/Punkte samt bestätigtem Tipp und Zuschauerzustand sowie erhaltene Zahnradachsen/Materialbesitzer.
- Sechs Sparfälle und zwei hohe Fälle prüfen jeweils zwei Browsersichten: öffentliche Fortschritte, identische Tür-/Handraduhr, Wiederbeitritt, Geheimhaltung und Folgerundenreset. `vault-progress-low.json`, `vault-progress-high.json`, Logs `vault-workshop-final-browser.log` und `vault-workshop-high-browser.log`.
- Vier direkte native Eingabeabläufe (2/12 Spieler × 1440/390 Pixel) wählen jede Position und Farbe an der tatsächlichen 3D-Geometrie und versiegeln zwei Tipps über die bestehende Bedienung. Geprüft sind die bestätigten Nutzdaten, gesperrter Wiederbeitritt mit eigenem versiegeltem Tipp, ausbleibende Fremdfarben, gleiche Canvas-/Modelle beim Perspektivwechsel, Auflösung und Reset. `vault-workshop-native.json`.
- Alle neun GLBs werden in der Regelphase vorgeladen. Deaktivierter HTTP-Cache erzwingt keine erneuten vorbereiteten Modellabrufe beim Einstieg. Ruhige Ansichtsumschaltung erhält den Renderer. `vault-workshop-preload.json`.
- Shader Hoch/breit: 11 vorbereitet / 11 zuerst sichtbar; Sparsam/schmal: 9/9. Kein Wachstum beim ersten sichtbaren Bild. `vault-workshop-shaders.json`.
- 18 Szenenwechsel zwischen Werkstatt, Observatorium, Würfelstube und Kaufhaus bestehen mit zwölf geladenen Figuren, einem Canvas und stabilen Ressourcen. `vault-workshop-lifecycle.json`.

Die sechs vorhandenen Code-Regeltests und zwei räumlichen Audioframe-Tests bestehen ebenfalls. TypeScript und der Produktionsbuild bestehen nach der Korrektur der Schilderhöhe. Für die Schlussfassung wurden die betroffenen Renderer-/Eingabe-/Ressourcenabläufe erneut ausgeführt.

Die vier direkten Eingabeläufe erfassen zusätzlich die tatsächlichen Sparzähler nach Auswahl von vier Farben samt Punktmustern:

| Spieler / Fensterbreite | Eigene Werkbank | Gruppenansicht mit gewählten Farben |
|---|---|---|
| 2 / 1440 | 69 Zeichenaufrufe | 69 Zeichenaufrufe |
| 2 / 390 | 69 Zeichenaufrufe | 69 Zeichenaufrufe |
| 12 / 1440 | 80 Zeichenaufrufe | 99 Zeichenaufrufe |
| 12 / 390 | 95 Zeichenaufrufe | 99 Zeichenaufrufe |

Die gefüllte Zwölfspieler-Gruppenszene enthält 17.940 Dreiecke und bleibt innerhalb desselben Budgets von 100 Zeichenaufrufen. Alle fünf abschließenden Werkstattbesuche der 18-Wechsel-Prüfung haben im leeren Anfangszustand identische 98 Zeichenaufrufe, 16.820 Dreiecke, 58 Geometrien und 41 Texturen. Die Anzahl sichtbarer Geometrien in einer Nahkamera hängt vom tatsächlichen Ausschnitt ab.

## Vollständige echte lokale Zweierdisziplin

`scripts/check-code-live-session.mjs` erstellt zwei echte lokale Sitzungen, durchläuft Reise/Regeln/Bereitschaft und spielt anschließend eine vollständige konfigurierte Ein-Runden-Disziplin über die Originaloberfläche und echte Browser-WebSockets. Ein Browser verwendet Maus bei 1440 Pixeln, der andere native Touch-Eingaben in einer 390-Pixel-Ansicht. Es gibt keine Request-Umleitung, keine Uhrenersetzung, keine Datenbank-/Spielzustandsänderung und keinen Zugriff auf den geheimen Code. Der Solver betrachtet ausschließlich die erlaubten eigenen Trefferhinweise und filtert damit seine möglichen nächsten Tipps.

Die endgültige Fassung benötigt vier gemeinsame Züge. Der breite Browser lädt nach dem ersten versiegelten Tipp neu; sein eigener Tipp bleibt erhalten, der andere Client erhält keine verborgenen Farben. Beide lösen den Code, sehen die geöffnete Tür und erhalten dieselbe verbindliche Schlusswertung: Rohwert 1293, Rang 1, 50 Olympiadenpunkte. Je vier Browseraktionen erhalten genau vier erfolgreiche Bestätigungen; Verbindungen 2/1 aufgrund des Wiederbeitritts, Schnappschüsse 96/97. Ein korrekter Code-Eintrag steht in der Historie. Keine erfassten Clientfehler.

Bericht `code-live-session.json`, Log `vault-workshop-live.log`, Bilder `code-live-desktop-solved.png` und `code-live-mobile-solved.png`. Eine vorherige echte Zweierprobe vor dem Absenken der Statusschilder bestand mit fünf gemeinsamen Zügen. Die abschließende Vier-Zug-Probe bezieht sich auf die endgültige Raumfassung. Es handelt sich um eine echte einzelne Zweierdisziplin, nicht um alle Gruppengrößen oder eine vollständige 21-Spiele-Partie. Der gesondert dokumentierte workerd-Abschlussfehler ist weiterhin offen; siehe [REALTIME-RUNTIME.md](REALTIME-RUNTIME.md).

## Warme Desktop-GPU-Proben der Schlussfassung

Nach Beendigung aller anderen Browserprüfungen: Hoch, zwölf Teilnehmer, native Seitenaufteilung, stummes Audio, tatsächliche RTX 4080 SUPER über D3D11. Beide Messungen betreffen die Gruppenansicht vor dem ersten Tipp.

| Fenster | Tatsächlicher Renderpuffer | Zeichenaufrufe / Dreiecke | rAF-p95 / Maximum | Render-CPU-p95 |
|---|---|---|---|---|
| 1920 × 1080 | 1040 × 797 | 142 / 27.420 | 16,8 / 16,8 ms | 1,0 ms |
| 390 × 844 | 364 × 330 | 142 / 27.420 | 16,8 / 16,8 ms | 0,9 ms |

Je 241 rAF-Abstände, kein Abstand über 33 ms, keine erfassten Browserfehler. Bericht `vault-workshop-hardware.json`, Log `vault-workshop-hardware.log`. Diese kurzen warmen Proben auf einer Desktop-GPU belegen weder Mobilgeräte-FPS noch Kaltstart, aktive Auflösungsspitzen, vollständige GPU-Frametraces oder lange Prozessspeicherverläufe.

Breite und schmale eigene Werkbänke sowie die Zwölfspieler-Gruppenszene wurden als tatsächliche Renderbilder angesehen. Die vier Farbflächen, Punktmuster und nummerierten Tasten bleiben erkennbar; die seitliche Ausstattung liegt neben der eigentlichen Eingabe. Die kontrollierten Browserläufe nutzen echte Spielmodule, teilweise kontrollierte Serverzeit und SwiftShader. Sie belegen keine Mobilhardware, Hörabnahme oder vollständige Live-Olympiade.

Weitere Figuren-/Ergebnis-/Klangarbeit, echte Geräte-/Hör-/Langzeitsitzungen, der bekannte workerd-Verbindungsabschluss und die vollständige Abnahme aller 21 Disziplinen bleiben offen. Keine neue Veröffentlichung.
