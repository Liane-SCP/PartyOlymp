# Farbgedächtnis: Pigmentmanufaktur

Die zuvor offene Maschinenkulisse erhält eine eigene Architektur für die Herstellung und Prüfung von Pigmenten. Zwei hohe hintere Fenster, seitliche Fensterfelder, cremefarbene Pilaster, Holzleisten und Messingdetails geben dem Raum eine erkennbare Werkstattform. Zwei Vorbereitungsbänke unter den rückwärtigen Fenstern tragen tatsächlich importierte Erlenmeyerkolben mit Messmarken. Schubladen, Wandablagen mit versiegelten Vorratsgefäßen und Bodenränder gliedern die Arbeitsbereiche. Die bisherige Kühl- und Pflanzenecke wandert nach vorn, sodass die neuen Bänke frei bleiben. Vorhandene Figuren, persönliche Arbeitsplätze und die funktionierende Mischstation bleiben Teil desselben Raums.

## Neutrale Proben und übersichtliche Bedienung

`pigment-manufactory.ts` baut ausschließlich unveränderliche Kulissenteile unter der vorhandenen Mechanikgruppe. Proben- und Vergleichsansicht blenden diese Gruppe weiterhin vollständig aus. Die tatsächlich bewerteten Flächen bleiben identische unbeleuchtete sRGB-Materialien mit neutraler grauer Umgebung und unveränderter Geometrie. Es gibt keine zusätzlichen Echtzeitlichter, Transparenzschichten, Brechung oder auf die Farbprobe wirkende Glasscheiben.

Mischpult, drei Weltregler, Zahlenanzeigen, Mischgefäß und Versiegelung behalten ihre bisherigen Handlungen und Grenzen. Die Gruppenansicht passt jetzt den bis 13,7 Einheiten hohen Raum einschließlich des vorderen Bodens ein. Mischpult-, Proben- und Vergleichskamera behalten ihre spezifischen Ausschnitte. Allgemeine Wolkensprites werden im Labor ausgeblendet.

Statische Requisiten und die dafür geeigneten Mechanikteile werden anhand der tatsächlichen Material-/Geometriekompatibilität zusammengefasst. Bewegte Rührer, Regler, Füllstände, Versiegelung und private dynamische Teile bleiben unabhängig. Die neue Kulisse erzeugt keine eigene Animationsschleife und keine neuen React-Aktualisierungen.

## Tatsächlich heruntergeladenes Modell

„Erlenmeyer flask“ von Poly by Google: https://poly.pizza/m/eqIGxcsBe1V. Die konkrete Modellseite nennt Creative Commons Attribution; ihr Lizenzlink führt zu https://creativecommons.org/licenses/by/3.0/. Am 18.10.2026 geprüft. Download: https://static.poly.pizza/0ec46b5b-d7ee-48f5-a06d-4274db0dfb1e.glb.

Das Original enthält 712 Dreiecke einschließlich schwebender türkisfarbener Blasen. Die vorbereitete Fassung entfernt die Blasenprimitive, erhält Kolben und Messmarken mit 368 Dreiecken und färbt die beiden opaken Materialien cremefarben und graphitfarben. Normalen, ursprüngliche Binärdaten und Messmarkengeometrie bleiben erhalten. Die Flaschen werden unterschiedlich groß auf sechs Bankplätzen eingesetzt und teilen ihre Modellressourcen. Vorbereitet 44.416 Byte; ungenutzte ursprüngliche Binärbereiche sind noch enthalten, damit die Aufbereitung nachvollziehbar bleibt. Keine Behauptung einer vollständigen Binärkompression.

Original und Quellenbeleg liegen unter `assets/source-models/laboratory/`. `scripts/prepare-laboratory-flask.mjs` prüft Quelle, Lizenz, ursprüngliche Primitivenstruktur und selbstständiges GLB, erzeugt Modell, Lizenzdateien und Manifest mit Original-/Auslieferungshash. Der generierte Labor-Vorladeplan enthält neun verschiedene GLBs mit zusammen 225.564 Byte.

„Modelle & Künstler“ in der tatsächlich sichtbaren Labor-Navigation nennt Urheber, Modellquelle, Lizenz und Änderungen. Der Aufklapper teilt die bereits geprüfte 44-Pixel-Bedienform mit Pixelblitz, verankert den Text an der Navigation und begrenzt Breite und Höhe. Die beobachtete Navigationshöhe reserviert weiterhin Platz für Pult und Canvas, auch wenn die Knöpfe auf Touchfenstern umbrechen.

## Prüfung

Die neun gezielten Node-Prüfungen, TypeScript und der Produktionsbau bestehen. Der neue Strahltest kontrolliert, dass die neue statische Architektur aus schmalen bis breiten Kameras keine Regler, Versiegelung oder Farbflächen verdeckt. Er kontrolliert auch das vollständige Ausblenden im neutralen Modus, die Abwesenheit weiterer Lichtquellen und den Ausschnitt der hohen Gruppenansicht. Das Laden der tatsächlichen Fremdmodelle und die echten Farbwerte werden zusätzlich im Browser geprüft.

Die Erstbildprüfung bestätigt in der gebauten Fassung 12 vorbereitete/12 zuerst sichtbare Shaderprogramme bei hoher Qualität und 1440 Pixeln sowie 9/9 bei niedriger Qualität und 390 Pixeln. Die ebenfalls wiederholte Pixelblitz-Prüfung bestätigt 11/11 beziehungsweise 8/8 (`manufactory-shaders.json`). Die Vorladeprüfung bestätigt den neuen Laborplan und keine Modellnachladung durch die geprüfte Ruheumschaltung (`manufactory-preload.json`).

Die native Browserprüfung besteht in 16 Fällen: sechs 2/8/12-Spielerabläufe bei 1440/390 Pixeln in niedriger Qualität, zwei mit zwölf Teilnehmern in hoher Qualität und dem letzten Außenplatz als lokalem Spieler, zwei entsprechende Abläufe mit reduzierter Bewegung und insgesamt sechs zusätzliche WebGL-Ersatzfälle. Die Prüfung liest wirkliche Renderer-Pixel für Ziel- und Vergleichsfarben und bedient einen tatsächlichen Weltregler sowie die räumliche Versiegelung. Sie kontrolliert Tastaturänderung, erhaltene Eingabe bei 400 Pixeln Höhe, privaten Entwurf nach Neuladen, eine zweite Browsersitzung, Zuschauer bei zwölf Teilnehmern, alle echten Ergebnisse einschließlich fehlender Abgabe, Ergebnisfokus und Folgerundenreset. Berichte: `manufactory-low.json`, `manufactory-high.json`, `manufactory-reduced.json`. Keine erfassten Browserfehler.

Die native Gruppenansicht benötigt bei 2/8/12 Teilnehmern 64/82/94 Draw Calls, bei zwölf Figuren 10.692 Dreiecke, 41 Texturen und 56 Geometrien in niedriger Qualität. Der vorherige Laborbericht nennt für die entsprechende Zwölfergruppe 99 Draw Calls. Hohe Qualität enthält 134 Draw Calls und 20.542 Dreiecke. Beide Qualitätseinstellungen wurden tatsächlich angesehen: `color-lab-low-12-1440-group.png`, `color-lab-high-12-1440-group.png`. Die mobile Mischstation, Enthüllung und der erreichbare Urheberaufklapper wurden ebenfalls visuell kontrolliert (`manufactory-credits-390.png`).

Die Lebensdauerprüfung wechselt 18-mal zwischen Labor, Pixelblitz, Kaufhaus und Wiki-Sprint. Sie bestätigt zwölf geladene Figuren, genau einen aktiven Canvas und keine WebGL-Fehler. Jede der fünf Labor-Rückkehrsituationen verwendet zwölf echte Abgaben mit gemeinsamem Vergleich, wechselt den ausgewählten Teilnehmer und ändert die Fensterbreite mehrfach unter Erhalt dieser Auswahl. Die sichtbare Vergleichsansicht bleibt bei 8 Draw Calls, 56 Dreiecken, 27 Texturen und 54 Geometrien (`manufactory-lifecycle.json`). Die ausgeblendete Gruppenarchitektur wird in dieser Kameramessung nicht gezeichnet. Stabile rendererbezogene Zähler sind keine vollständige Prozessspeicherabnahme.

Die beiden nativen Audiofälle bei 1440/390 Pixeln bestehen: erste Geste, wirkliche Versiegelung und Vergleich, tatsächliche Quellenanker und Kamera als Hörer, genau ein AudioContext, keine verspäteten alten Klänge und Freigabe von Stimmen/Umgebungsquellen beim Verbergen (`manufactory-audio.json`). Dies ist eine instrumentierte Web-Audio-Prüfung ohne Hörabnahme auf realen Ausgabegeräten.

## Warme Hardwareproben der neuen Raumfassung

Nach Ende der übrigen Browserjobs wurden vier getrennte warme Zustände mit zwölf geladenen Figuren und hoher Qualität auf der tatsächlichen NVIDIA RTX 4080 SUPER über D3D11 geprüft. Die native Seitenanordnung bleibt erhalten; kein künstlich bildschirmfüllender Canvas.

| Bericht | Zustand | Renderpuffer | Draw Calls / Dreiecke | App-Bildzeit-p95 / CPU-Renderzeit-p95 |
| --- | --- | --- | --- | --- |
| `manufactory-machine-hardware.json` | Mischpult, 1920 Pixel Fensterbreite | 1476 × 565 | 119 / 20.314 | 16,7 / 0,8 ms |
| `manufactory-group-hardware.json` | Vollständige Laborgruppe, 1920 Pixel | 1476 × 565 | 134 / 20.542 | 16,7 / 0,9 ms |
| `manufactory-reveal-hardware.json`, breit | Zwölf tatsächliche Abgaben und bestätigter Vergleich während der Messung | 1040 × 565 | 12 / 104 | 16,8 / 0,3 ms |
| Derselbe Bericht, schmal | Derselbe tatsächliche Übergang, 390 Pixel | 388 × 478 | 12 / 104 | 16,7 / 0,3 ms |

Alle vier Proben enthalten jeweils 241 rAF-Abstände, maximal 16,8 ms und keinen Abstand über 33 ms. Der tatsächliche Übergang wird in beiden Enthüllungsproben zusätzlich anhand des bestätigten Spielzustands geprüft. Die abschließende mobile Bildkontrolle zeigt beide vollständigen Farbflächen mit ihren Beschriftungen oberhalb des Fußbodens sowie erreichbare Teilnehmer- und Ergebnisnavigation (`manufactory-reveal-color-390.png`).

Diese kurzen warmen Läufe sind keine Smartphone-, Kaltstart-, Eingabelatenz-, vollständige GPU-Zeit- oder lange Prozessspeicherabnahme. Sie beweisen auch nicht, dass jede historische Snapshot-/Layoutspitze beseitigt ist: Die frühere Vollbildanordnung und deren ausdrücklich dokumentierte Spitzen bleiben in [COLOR-LABORATORY.md](COLOR-LABORATORY.md) und [AUDIO-STARTUP-PERFORMANCE.md](AUDIO-STARTUP-PERFORMANCE.md) nachvollziehbar. Die neuen Messungen betreffen die hier beschriebene native Seitenanordnung und die aufgeführten Zustände.

Weitere Figuren-, Glas-/Arbeitsplatz-, Ergebnis- und Klanggestaltung sowie native Bildschirmtastaturen, Hörprüfung, echte Mobilgeräte und lange reale Gruppenpartien bleiben offen. Kontrollierte Engine-Snapshots beweisen keine Live-Netzwerkabnahme. Der bekannte workerd-Verbindungsabschluss und die vollständige Olympiade mit allen 21 Disziplinen bleiben gesondert offen. Keine Veröffentlichung dieser Zwischenfassung.
