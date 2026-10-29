# Weltreise: Karte, Globus und Crew gemeinsam zuordnen

Die öffentliche Tippauswahl der Ergebniskarte ist jetzt mit der Navigationswerkstatt verbunden. Eine Auswahl betont dieselbe Spielerroute am 3D-Globus, vergrößert deren farbigen Pin, markiert das zugehörige Kartenpult mit einem goldenen Rahmen und hebt den vorhandenen Standring der ursprünglichen Spielfigur hervor. Die vorhandene Tischkarten-Textur zeigt den gewählten Arbeitsplatz goldfarben. Auf der großen Werkstattanzeige stehen Name und Entfernung dieses Teilnehmers.

Der Globus richtet beim Wechsel der Auswahl den Mittelpunkt des tatsächlichen Großkreisbogens nach vorn. Das funktioniert auch an der Datumsgrenze und bei antipodalen Tipps. Anschließendes manuelles Drehen bleibt erhalten; der nächste Zeichenframe richtet den Globus nicht erneut aus. „Alle Tipps“ stellt die gemeinsamen Routen und die Zielausrichtung wieder her. Kamera, Sitzordnung und ursprüngliche Charaktermodelle bleiben dabei stabil.

## Öffentliche Identität und lokale Ansicht

`WorldMap` meldet die tatsächliche `playerId` des gewählten veröffentlichten Pins. `GeoResultsMap` verbindet sie über den vorhandenen lokalen `AdventureDraft` mit der Szene. Die Zuordnung verwendet die Spieler-ID und den tatsächlichen Crewplatz. Fehlt beispielsweise der fünfte Tipp, darf die fünfte auswählbare Kartenoption den sechsten Teilnehmer markieren. Der fehlende Teilnehmer behält seine Kennzeichnung „OHNE TIPP“.

`geoResultKey` bindet die Auswahl an Runde, veröffentlichten Auflösungsbeginn und Zielkoordinaten. `geoResultSelection` akzeptiert ausschließlich einen tatsächlich veröffentlichten Tipp eines vorhandenen Crewmitglieds. Während der Antwortphase, bei alten Ergebniskennungen, unbekannten IDs und fehlenden Tipps bleibt die Markierung aus. Private Antworten und geheime Ziele werden dafür nicht gelesen.

Jeder Browser inspiziert unabhängig. Eine Person kann den letzten Teilnehmer ansehen, während eine andere den ersten vergleicht. Die Auswahl sendet keine Spielaktion, verändert keine Antwort, keine Punkte und keine gemeinsame Uhr. Ein Neuladen beginnt wieder mit der gemeinsamen Übersicht. Die nächste Runde entfernt die alte Auswahl.

Während des kurzen eigenen Ergebnisflugs wird der eigene Flugpunkt beim Betrachten einer fremden Route ausgeblendet. Er soll nicht wie ein Flug entlang des fremden Tipps erscheinen. Beim Zurückwechseln läuft er am aktuellen gemeinsamen Zeitpunkt weiter. Die Auswahl startet die Reiseanimation nicht neu; reduzierte Bewegung bleibt berücksichtigt.

## Begrenzte Ressourcen

Die vorhandenen Routen, Marker, Spielerstandringe und die feste Tischkarten-Textur werden weiterverwendet. Die zusätzliche Pultmarkierung besitzt eine einmal angelegte Ringgeometrie mit 64 Dreiecken und einem eigenen einfachen Material. Sie benötigt bei sichtbarer Auswahl einen zusätzlichen Zeichenaufruf und keine weitere Textur oder Beleuchtung.

Die verborgene Grafikvorbereitung zeichnet diesen Ring zusammen mit den vorhandenen Ergebnisobjekten und stellt anschließend dessen ursprüngliche Sichtbarkeit wieder her. Die Auswahl ändert anschließend Skalierungen, Uniformwerte und den Inhalt der bestehenden Textur. Alle Geometrien und Objekte behalten ihre Identität. Die Ortsmodelle und ihre Lizenzen sind weiterhin in [NAVIGATION-WORKSHOP.md](NAVIGATION-WORKSHOP.md) dokumentiert; die vorangegangenen Panorama-/Kartenkorrekturen in [PANORAMA-RENDERING.md](PANORAMA-RENDERING.md).

## Geprüfter Umfang

Alle nachfolgenden Dateien liegen unter `outputs/qa/`. Native Funktionsprüfungen verwenden echte Enginekommandos mit kontrollierten HTTP-Ansichten und geschlossenen WebSockets. Das ist keine reale Netzwerkpartie.

- `geo-linked-unit-final.log`: zehn Node-Prüfungen. Sie decken unter anderem geschützte Bereitschaft, gemeinsame Flugzeit, zulässige Ergebniskennungen, fehlende Antworten, die Zuordnung aller Plätze bei 2/8/12 Teilnehmern, das unveränderte Objekt-/Geometrieinventar, freie Gesichter/Aktionsflächen und die vollständige Wiederherstellung verborgener Objekte ab. Ein weiterer Fall prüft den frühen eigenen Flug bei fremder/eigener Auswahl mit unverändertem Fortschritt.
- Die nativen Abläufe prüfen zwei voneinander unabhängige Browser, 2/12 Teilnehmer auf 1440/390 Pixel, normale und fehlende Abgaben, Wiederbeitritt, gelöschte Auswahl in der Folgerunde und unveränderte veröffentlichte Ergebnisse. Der fehlende Tipp steht bewusst in der Mitte der Crew. Die erste niedrige Fassung steht in `geo-linked-native.json`; die erste hohe in `geo-linked-high.json`.
- `geo-linked-final-native.json` wiederholt die sechs niedrigen Fälle mit voller Bewegung und einem zusätzlichen kontrollierten Uhrzeitversuch: Bei 25 Prozent des gemeinsamen Flugs verschwindet der eigene Flugpunkt bei fremder Auswahl und kehrt bei eigener Auswahl mit identischem Fortschritt und lokaler Position zurück. Der zweite Browser behält seinen eigenen Flug. `geo-linked-final-high-reduced.json` prüft die vier Zwölferfälle zusätzlich in hoher Qualität mit reduzierter Bewegung. Beim Auswählen steigen weder Textur- noch Geometriezähler.
- `geo-linked-lifecycle.json`: 18 Szenenwechsel zwischen Weltreise, Kategorien-Kette, Farbwechsel und Atelier. Auf fünf Weltreisebesuchen werden zwölf tatsächliche Tipps aufgelöst und der letzte Teilnehmer ausgewählt. Dabei bleiben 22 Texturen, 53 Geometrien, zwölf geladene Figuren und 95 Zeichenaufrufe stabil. Die Rendererzählung ersetzt keine Prozessspeicherprüfung.
- `geo-linked-shaders.json`: die vorbereiteten und ersten sichtbaren Frames verwenden weiterhin jeweils denselben Programmsatz, 14 in hoher und 12 in niedriger Qualität. Spätere beliebige Materialvarianten sind damit nicht allgemein abgenommen.
- `geo-linked-panorama.json`: die beiden vollständigen Panorama-/Kartenabläufe einschließlich aller zwölf Auswahloptionen, Tastatur und nativer Maus-/Touchauswahl bestehen mit der Verbindung zur Szene weiter. `geo-linked-audio.json` bestätigt erneut die beiden räumlichen Klangabläufe, stumme historische Ereignisse und das Ausbleiben der zusätzlichen allgemeinen Enthüllungsmelodie.

Nach Ergänzung des frühen Flugsonderfalls bestehen die zehn Node-Prüfungen, TypeScript und der Produktionsbuild erneut (`geo-linked-flight-build.log`). `geo-linked-final-lifecycle.json` wiederholt die 18 Wechsel mit fünf aktiven Zwölferauswahlen bei unverändert stabilen 22 Texturen und 53 Geometrien. Beide vollständigen Panorama-/Kartenabläufe bestehen erneut in `geo-linked-final-panorama.json`. Die frühen Uhrzeitversuche sind gezielt kontrollierte Client-/Serverzeitansichten; sie ersetzen keine Prüfung verschiedener realer Netzwerkverzögerungen.

`geo-linked-final-hardware.json` enthält die zwei abschließenden kurzen, warmen Proben auf der tatsächlichen RTX 4080 SUPER über D3D11. Zwölf tatsächliche Tipps sind bereits veröffentlicht; während der viersekündigen Messung wird der letzte Teilnehmer im echten Auswahlfeld gewählt. Der eigene Flug ist bereits abgeschlossen. Beide Proben verifizieren die ausgewählte ID und den richtigen Arbeitsplatz sowie zwölf weiterhin veröffentlichte Routen. `geo-linked-hardware.json` hält die erste entsprechende Messreihe vor Ergänzung des frühen Flugsonderfalls fest.

| Viewport / tatsächlicher Zeichenpuffer | Zeichenaufrufe / Dreiecke bei Auswahl | App-Bildzeit P95 / Render-CPU P95 | rAF-Intervalle / längster Abstand |
|---|---|---|---|
| 1920 / 1040 × 797 | 131 / 23.306 | 16,8 / 0,8 ms | 241 / 16,8 ms |
| 390 / 364 × 330 | 131 / 23.306 | 16,8 / 0,7 ms | 241 / 16,8 ms |

Die Messung betrifft die Auswahl in einer bereits veröffentlichten Auflösung, mit hoher Qualität, normalem Seitenlayout und stummem Audio. Sie ist kein erneuter Nachweis des erstmaligen Ergebniswechsels, kalter Ladezeiten, einer vollständigen GPU-Bildzeit oder physischer Mobilhardware. Der schmale Viewport verwendet ebenfalls die Desktop-GPU.

Aktuelle Renderbilder der hohen Zwölferansicht und der schmalen Zweieransicht wurden angesehen. Die Zuordnung von Namensanzeige, Route, Pin und goldenem Arbeitsplatz ist erkennbar. In der schmalen Zweierübersicht wirkten die Figuren und ihre Tischkarten gegenüber der großen Werkstatt noch klein. Die daraus entwickelte persönliche Kartenplatz-/Globusansicht, die angepasste Gruppenkamera und ihre Bedien-/Ressourcen-/Hardwareprüfungen stehen nun in [GEO-CAMERAS.md](GEO-CAMERAS.md). Die Übersicht bleibt bewusst eine gemeinsame Ansicht; die persönliche Ansicht vergrößert den eigenen Arbeitsplatz.

Weitere eigene Arbeitsplatzgestaltung, größere Tischkarten aus der Gruppenansicht, zusätzliche Figurenreaktionen, Hörprüfung, echte Referenzgeräte, Kaltstart-/Latenz-/Langzeitmessungen und die vollständige Live-Mehrbrowser-Olympiade bleiben erforderlich. Das Gesamtziel bleibt offen; diese Arbeitsfassung ist unveröffentlicht.
