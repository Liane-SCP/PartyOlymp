# Spectrum: offener Messpavillon

Die leere rechteckige Rückwand wird durch einen offenen mechanischen Pavillon ersetzt. Eine runde Bühne mit sichtbarem Sockel, rückwärtigen Ausstellungsstufen und einer eingelegten Bodenlinie trägt die vorhandene Messmaschine und die gemeinsame Crew. Ein großer kupferfarbener Doppelbogen verbindet die beiden Pole hinter der Skala. Die A-Seite bleibt kantig, die B-Seite erhält eine runde Säule und einen runden Sockel. Buchstabenplaketten und feste Verbindungen zur Skala ordnen die beiden Formen eindeutig zu.

Die Formensprache bezeichnet ausschließlich A und B. Sie behauptet keine feste Bedeutung wie heiß/kalt, gut/schlecht oder laut/leise und passt daher zu den wechselnden tatsächlichen Begriffspaaren. Die Wortpaare stehen weiterhin gut lesbar an der ursprünglichen Skala. Bogen und Zahnräder besitzen keinen zweiten Zeiger, keinen Zielwert und keine auf die private Schätzung reagierende Animation.

## Gleiche Regeln und klare Ansichten

Die vollständige 0–100-Skala, der eigene Zeiger, private Zielbänder, das Hinweisbanner und die wiederverwendeten Ergebniskarten behalten ihre Geometrie und bestätigte Datenquelle. Die eigene Maschine, Gruppenübersicht, Hinweisgeberposition und Ein-/Dreier-Ergebnisse behalten ihre eigenen Kameras und Steuerungen. Es werden keine zusätzlichen Laufwege oder Bedienaktionen verlangt.

Die neue Kulisse liegt hinter den relevanten Anzeigen. Der Hinweis bleibt auch über der größeren mobilen Ergebniskarte frei. Alle Teilnehmer stehen weiterhin an ihren bisherigen nummerierten Plätzen. Die vorhandene Bar und Pflanze werden so versetzt, dass sie auf der neuen runden Bühne stehen; die Figur des Hinweisgebers behält ihre Position.

Geheimhaltung bleibt phasengebunden: Nur der Hinweisgeber erhält sein privates Ziel; andere Teilnehmer sehen ihren eigenen Zeiger. Öffentliche Ergebnisse und Punkte erscheinen erst nach tatsächlicher Aufdeckung. Neue Architektur, permanente A/B-Formen und Zahnräder hängen ausschließlich von der unveränderlichen Raumgestaltung ab.

## Modelle und technische Kosten

Die beiden früheren liegenden Fabrikzahnräder werden durch das bereits tatsächlich heruntergeladene und lokal aufbereitete „Collectible Gear“ von Quaternius ersetzt: https://poly.pizza/m/1tgrqxAQia, CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/. Das bestehende Quellenpaket unter `assets/source-models/vault/` enthält Original, Lizenz, Herkunft und Aufbereitung. Die senkrecht ausgerichtete Fassung hat 440 Dreiecke und 16.240 Byte. Die SHA-256-Werte von Original und ausgelieferter Datei wurden erneut mit dem tatsächlichen Manifest abgeglichen. Es gibt für diesen Ausbau keinen neuen Download und keine neue Lizenzannahme.

Die vorhandenen Kenney-Stehlampen, Bar und Pflanze bleiben lokal gehostete Modelle. Der aktualisierte Vorladeplan enthält vier unterschiedliche GLBs mit insgesamt 36.420 Byte. Mehrfach verwendete Zahnräder teilen ihre Ressourcen.

`spectrum-pavilion.ts` erzeugt die Architektur als unveränderliche Szenegeometrie. Statische Grundkörper und Requisiten werden gemeinsam nach kompatiblen Materialien/Attributen zusammengefasst. Eigenzeiger, Ergebniszeiger, private Zielbänder, Pick-Flächen und wechselnde Texte behalten ihre unabhängigen Zustände. Der Ausbau benötigt keine zusätzlichen Echtzeitlichter, Transparenzschichten, Renderpässe oder eigenen Animationsschleifen. Allgemeine Außenfelsen und Wolkensprites werden durch die eigene offene Bühnenkomposition ersetzt.

## Erneute Prüfung

Zehn gezielte Node-Prüfungen, TypeScript und Produktionsbau bestehen. Der neue geometrische Sichttest kontrolliert bei 2/8/12 Teilnehmern aus schmalen bis breiten Gruppen- und Geräteperspektiven die volle Skala, den Hinweis, die Versiegelung und sämtliche Gesichter gegen die neue Architektur. Die vorhandenen Prüfungen für private Zielwerte, korrekte gemeinsame Wertungen, identische Tipps, fehlende Abgaben/Hinweise, alle Ergebniskarten, Rundenreset und Hinweis-/Kartenausschnitte bleiben erhalten.

Die gebaute Erstbildprüfung bestätigt 8 vorbereitete/8 zuerst sichtbare Shaderprogramme bei hoher Qualität und 1440 Pixeln sowie 6/6 bei niedriger Qualität und 390 Pixeln (`pavilion-shaders.json`). Der aktuelle Vorladeplan meldet vier vorbereitete Dateien, null Fehler und keine erneuten Modellanfragen durch die geprüfte Ruheumschaltung (`pavilion-preload.json`).

Die acht nativen Präsentationsfälle bestehen: 2/8/12 Teilnehmer jeweils bei 1440/390 Pixeln in niedriger Qualität, dazu zwei Fälle in hoher Qualität mit dem letzten Außenplatz als lokalem Teilnehmer (`pavilion-first.json`, `pavilion-low.json`, `pavilion-high.json`). Sie bedienen den tatsächlichen Hinweis, die räumliche Skala, Tastatur und Versiegelung. Die Prüfungen kontrollieren private Zielwerte, sämtliche tatsächlichen Ergebniskarten, erhaltene eigene Auswahl nach Breitenwechsel, Neuladen, fehlende Tipps/Hinweise und Folgerundenreset. Gleich gewertete Zeiger bleiben an derselben wahren Position.

Acht weitere Pultfälle bestehen bei zwölf Teilnehmern: je zwei Desktop-/Touchabläufe sowie zwei WebGL-Ersatzfälle in niedriger Qualität und nochmals mit hoher Qualität und voreingestellter reduzierter Bewegung (`pavilion-console.json`, `pavilion-console-reduced.json`). Sie prüfen die erhaltene Eingabe bei kurzen Fenstern, den wiederhergestellten privaten Hinweisentwurf, die Ablehnung eines reinen Zahlenhinweises, einen akzeptierten Hinweis, den nach Neuladen erhaltenen eigenen Zeiger und die tatsächlich bestätigte Versiegelung. Alle fünf Berichte erfassen null Browserfehler. Diese 16 Fälle ersetzen keine native Bildschirmtastatur oder echte Netzunterbrechung.

Die tatsächlichen neuen Gruppenansichten und die letzte mobile Ergebniskarte wurden angesehen (`pavilion-low-2-1440-group.png`, `pavilion-high-12-1440-group.png`, `pavilion-high-12-390-page-11.png`). Bogen und verschieden geformte Pole bleiben als Raum erkennbar. Im Geräteblick sind Hinweis, echte Skala und ausgewählte Ergebniskarte gemeinsam lesbar.

Die Lebensdauerprüfung führt 18 Szenenwechsel zwischen Spectrum, Bombenwort, Farbgedächtnis und Pixelblitz aus. Jeder der fünf Spectrum-Aufenthalte prüft einen echten Hinweisentwurf und mehrere Breitenwechsel ohne Austausch von Eingabe oder Canvas; anschließend werden tatsächliche Tipps enthüllt. Alle zwölf Figuren sind geladen, genau ein Canvas bleibt aktiv und es treten keine WebGL-Fehler auf. Die Schreibphase behält jeweils 72 Draw Calls, 5.304 Dreiecke, 43 Texturen und 56 Geometrien; die gemessene Ergebnisansicht jeweils 56 Draw Calls, 5.052 Dreiecke, 57 Texturen und 71 Geometrien (`pavilion-lifecycle.json`). Dies sind die dort eingestellten Ausschnitte in niedriger Qualität, keine vollständigen Prozessspeicher- oder Gruppenkostenmessungen.

Die zwei räumlichen Audiofälle bei 1440/390 Pixeln bestehen: erste Geste, tatsächliche Spielaktionen und Quellenanker, Kamera als Hörer, ein AudioContext, Schutz vor alten Ereignissen sowie Freigabe von Stimmen/Umgebung beim Verbergen (`pavilion-audio.json`). Das ist keine Hörprüfung auf echten Ausgabegeräten.

## Warme Hardwareproben

Nach Ende der anderen Browserjobs wurden vier Zustände mit tatsächlichem D3D11-Rendering auf der lokalen NVIDIA RTX 4080 SUPER, hoher Qualität und zwölf geladenen Figuren gemessen. Die native Seitenanordnung bleibt erhalten. In den beiden Enthüllungsfällen werden elf echte Tipps innerhalb des Messfensters bestätigt und die tatsächliche gemeinsame Aufdeckung geprüft.

| Bericht | Zustand | Renderpuffer | Draw Calls / Dreiecke | App-Bildzeit-p95 / CPU-Renderzeit-p95 |
| --- | --- | --- | --- | --- |
| `pavilion-machine-hardware.json` | Eigene Geräteansicht, 1920 Pixel Fensterbreite | 1874 × 571 | 80 / 9.376 | 16,7 / 0,6 ms |
| `pavilion-group-hardware.json` | Vollständige Gruppe, 1920 Pixel | 1874 × 571 | 91 / 9.904 | 16,8 / 0,6 ms |
| `pavilion-reveal-hardware.json`, breit | Tatsächliche Aufdeckung während der Messung | 1874 × 571 | 75 / 9.620 | 16,8 / 0,7 ms |
| Derselbe Bericht, schmal | Tatsächliche Aufdeckung, 390 Pixel Fensterbreite | 388 × 298 | 94 / 10.026 | 16,8 / 0,7 ms |

Die drei breiten Proben enthalten je 241 rAF-Abstände, maximal 16,8 ms. Die schmale Probe enthält 240 Abstände, p95 16,8 ms und einen maximalen Abstand von 33,3 ms. Kein Abstand überschreitet die im Helfer verwendete 33,5-ms-Grenze oder 50 ms. Die Zähler zeigen den gemessenen jeweiligen Endzustand, nicht sämtliche Zwischenzustände oder vollständige GPU-Zeiten.

Diese kurzen warmen Proben sind keine Smartphone-, Kaltstart-, Eingabelatenz- oder Prozessspeicherabnahme. Frühere dokumentierte Snapshot-/ResizeObserver-Spitzen sind damit nicht allgemein als behoben nachgewiesen; sie bleiben in [AUDIO-STARTUP-PERFORMANCE.md](AUDIO-STARTUP-PERFORMANCE.md) und den ursprünglichen Spectrum-Berichten nachvollziehbar. Eine schmale Desktopansicht läuft weiterhin auf derselben Desktop-GPU.

Weitere Figuren-, Arbeitsplatz-, Ergebnis- und Klanggestaltung, native Bildschirmtastaturen, echte Mobilgeräte, Hörprüfung, lange reale Gruppenpartien und vollständige Netz-/Gesamtabnahme bleiben offen. Frühere Mechanik und ausdrücklich historische Messungen stehen in [SPECTRUM-MACHINE.md](SPECTRUM-MACHINE.md) und [SPECTRUM-CONSOLE.md](SPECTRUM-CONSOLE.md). Der bekannte workerd-Verbindungsabschluss und die vollständige Olympiade aller 21 Disziplinen sind dadurch nicht abgenommen. Keine Veröffentlichung dieser Zwischenfassung.
