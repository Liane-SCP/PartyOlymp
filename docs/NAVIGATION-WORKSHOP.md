# Weltreise: Navigationswerkstatt und gemeinsame Auflösung

Die Reisebasis besitzt jetzt einen zusammenhängenden Werkstattaufbau: gegliederte Rückwand mit Fensterfeldern, Holzrahmen und Brüstung, einen eingefassten Globussockel, Gepäck und einen seitlichen Arbeitstisch mit Kartenrollen und tatsächlich geladenem Kompass. Der zunächst hinter der Panoramawand kaum sichtbare Kompass wurde nach Bildkontrolle nach vorn neben die Leinwand versetzt und größer dargestellt. Warmes Tageslicht und ein kühles Gegenlicht ersetzen an diesem Ort die allgemeinen schwebenden Kristalle, Sterne und Wolkensprites. Die Kulisse erzeugt keine zusätzlichen Echtzeitlichter. Ihre Ausrüstung ist unabhängig vom geheimen Ziel und von der Blickrichtung des echten Panoramas.

Jeder Teilnehmer sitzt als ursprüngliche Spielfigur an einem eigenen tatsächlich geladenen Kenney-Tisch mit Kartenblatt, Raster und Bleistift. Bis sechs Personen sitzen gemeinsam in einer zentrierten Reihe, darüber in zwei jeweils zentrierten Reihen. Die Sitzordnung ist für 2–12 Personen berechnet. Gesichter, Globus, Panoramafenster, präzises Kartenpult und ausdrückliche Bestätigung bleiben frei.

## Öffentliche Crewzustände, private Tipps

Eine gemeinsame, fest dimensionierte Canvastextur und ein zusammengefasstes Mesh zeigen alle persönlichen Tischkarten. Die Textur wird bei Statusänderungen neu bemalt, nach ihrer GPU-Anlage aber nicht mehr vergrößert. Die Karten lesen ausschließlich die öffentliche Bereitschaft und tatsächlich veröffentlichte Ergebnisse: Ort wählen, versiegelt, Entfernung beziehungsweise ohne Tipp. Fremde Antworten werden dafür nicht angefordert oder aus privaten Enginefeldern abgeleitet.

Ein Klick oder Tap auf dem echten geografischen Globus setzt weiterhin zunächst einen lokalen Pin. Ziehen dreht nur den Globus. Das reale Panorama lässt sich unabhängig untersuchen; die genaue Straßenkarte bleibt für Maus, Touch und Tastatur erreichbar. Erst die Bestätigung schickt den Tipp ab. Die Auswertung, Quellen, Punktformel und Spielregeln bleiben erhalten.

Der Flug vom eigenen abgegebenen Tipp zum Ziel wird nun aus `revealStartedAt` und den gemeinsamen Servermillisekunden berechnet. Ein Neuladen setzt ihn an derselben Stelle fort. Später Wiederbeitritt und ältere Ergebnisse ohne Startzeit spielen keinen neuen Flug ab. Reduzierte Bewegung zeigt sofort das Ergebnis. Ein nicht abgegebener lokaler Entwurf erzeugt keinen Ergebnisflug. Die öffentlichen Großkreisrouten bleiben einschließlich Datumsgrenze und Polen erhalten; die nächste Runde entfernt alte Pins, Ziel und Routen.

## Ergebnislayout und Klang

Bei der tatsächlichen Bildkontrolle wurde eine horizontale Abschneidung des Ergebnisbereichs im geteilten Desktop-Spielpult festgestellt: Die bisherigen Mindestbreiten der Karten-/Rangspalten überstiegen die verfügbare Breite. Die Weltreise verwendet nun schrumpfbare, proportional verteilte Spalten und innerhalb der Rangliste eine an die verfügbare Breite angepasste Kartenzahl. Kartenwerkzeuge umbrechen; ihre Trefferflächen bleiben mindestens 44 Pixel groß. Native Prüfungen kontrollieren zusätzlich, dass sämtliche Ergebnis-Karten innerhalb des Spielpults liegen und die Seite nicht horizontal überläuft.

Der Ort besitzt eine eigene leise Raum-/Fensterluft ohne den bisherigen allgemeinen Dauerton. Pinsetzen klingt am Globus, die eigene bestätigte Abgabe am tatsächlichen persönlichen Sitzplatz und die gemeinsame Auflösung mit einem kurzen Reisemotiv am Globus. Die bisherige allgemeine schwere Enthüllungsfanfare entfällt hier. Gleichzeitige fremde Abgaben erzeugen keinen Klangsturm. Alte Ereignisse werden beim Wiederbeitritt, bei später nachgelieferter Historie und bei Rückkehr in dasselbe Spiel nicht erneut hörbar. Audiokontext, Lautstärken, Stummschaltung und Freigabe unsichtbarer Szenen bleiben im gemeinsamen System.

## Tatsächlich integriertes Modell

Compass von Quaternius: [Originalseite](https://poly.pizza/m/LlnxQPETHh), [Original-GLB](https://static.poly.pizza/db18fada-a70e-44da-961c-0cc31dffdaa6.glb), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Quellenmetadaten und ursprüngliche Datei liegen unter `assets/source-models/navigation/`; Lizenztext und optimierte Datei werden im Projekt ausgeliefert.

Die ursprüngliche Datei umfasst 40.552 Bytes. `prepare-navigation-compass.mjs` passt die fünf undurchsichtigen Materialien an Messing, dunkle Skala, Rot und Creme sowie die gemeinsame Rauheit an und entfernt überflüssige Metadaten. Die ausgelieferte Datei umfasst 39.348 Bytes und 656 Dreiecke. Geometrie, Indizes und ursprüngliche Transformationen bleiben erhalten; der vollständige BIN-Inhalt ist bytegleich. Es werden keine Geometrie- oder UV-Einsparungen behauptet.

`navigation-compass-verification.json` belegt den Binärvergleich und das tatsächliche Laden mit GLTFLoader. Bei der endgültigen Höhe 0,9 misst das Modell ungefähr 1,015 × 0,900 × 0,785. Der Kompass liegt als statische Navigationsausrüstung auf dem seitlichen Arbeitstisch und zeigt keine geheime Reiserichtung an. Die SHA-256-Werte und Lizenzinformationen sind im Modellmanifest dokumentiert.

## Vorbereitung der Ergebnisobjekte

In zwei breiten Desktop-Messungen trat beim erstmaligen Enthüllen ein Bildabstand von ungefähr 50 ms auf. Eine zusätzliche Chromium-Zeitlinie zeigte Grafiktreiber-Abfragen beim ersten Zeichnen der bis dahin unsichtbaren Ergebnisobjekte sowie anschließende Layoutarbeit der Ergebniskarte. Die vorhandene Canvas wurde dabei nicht neu dimensioniert. Das ist eine Diagnose des beobachteten Übergangs, keine allgemeine Ursache für alle Bildzeitspitzen.

Die Routen und Ergebnis-Marker werden nun einmal mit neutralen Ausgangspositionen im noch verborgenen, gesperrten Canvas gezeichnet. Anschließend wird die ursprüngliche Sichtbarkeit aller Objekte wiederhergestellt, bevor ein bedienbares Bild erscheint. Geheime Koordinaten werden dafür nicht benötigt. Ein zusätzlicher Node-Test prüft die vollständige Wiederherstellung und unveröffentlichte Ziel-/Routenmetadaten. Die beiden Shaderprüfungen bestehen danach weiterhin mit 14/12 Programmen ohne Wachstum im ersten sichtbaren Frame.

Die kurzen Hardwareproben verwenden zwölf Figuren, hohe Qualität, das normale Seitenlayout und stummes Audio auf der tatsächlichen RTX 4080 SUPER über D3D11. `navigation-group-warm-hardware.json` dokumentiert die Kartenwahl nach der Vorbereitung, `navigation-side-bench-hardware.json` die erneut gemessene Auflösung nach der letzten Werkbankversetzung:

| Zustand / Viewport | Tatsächlicher Zeichenpuffer | Zeichenaufrufe / Dreiecke | App-Bildzeit P95 / Render-CPU P95 | Längster rAF-Abstand |
|---|---|---|---|---|
| Kartenwahl / 1920 Pixel | 1040 × 797 | 108 / 21.448 | 16,8 / 0,7 ms | 16,8 ms |
| Kartenwahl / 390 Pixel | 364 × 330 | 108 / 21.448 | 16,8 / 0,7 ms | 16,8 ms |
| Tatsächliche Zwölferauflösung während der Probe / 1920 Pixel | 1040 × 797 | 130 / 23.242 | 16,8 / 0,9 ms | 50,0 ms |
| Tatsächliche Zwölferauflösung während der Probe / 390 Pixel | 364 × 330 | 130 / 23.242 | 16,8 / 0,8 ms | 16,8 ms |

Der breite Übergang bleibt eine offene Performance-Schwäche. Eine erste Probe nach Vorbereitung (`navigation-reveal-warm-hardware.json`) lag bei höchstens 33,4 ms; die erneute endgültige Probe zeigt wieder einen einzelnen Abstand von 50 ms. Die Vorbereitung allein behebt diesen Übergang also nicht nachweislich. Die früheren 50-ms-Proben bleiben unter `navigation-reveal-hardware.json` und `navigation-reveal-final-hardware.json` erhalten. Die Diagnoseberichte mit aktiver Instrumentierung sind keine Performance-Abnahme. Auch die kurzen normalen Hardwareproben belegen weder Iris-Xe-/Mobilhardware noch kalte Ladezeiten, Netzwerkpartien oder vollständige GPU-Bildzeiten.

## Nachweise und Grenzen

Alle Berichte liegen unter `outputs/qa/`. Die funktionalen Browserfälle verwenden tatsächliche Spiel-Engine-Kommandos und getrennte kontrollierte HTTP-Ansichten; ihre WebSockets sind geschlossen. Sie belegen keine echte Netzwerkpartie.

- Sieben gezielte Node-Tests prüfen alle Gruppengrößen, geschützte Crewtexte, den gemeinsamen Flugzeitbezug, fehlende Antworten, die einmalige Ressourcenfreigabe des Kartenatlas, freie Strahlen zu Gesichtern und vier ursprünglichen 3D-Aktionen sowie die verborgene Grafikvorbereitung. Drei Audio-Frame-Tests prüfen unter anderem die tatsächlichen Weltreise-Ursprünge und den unverändert ruhigen Zeitgefühl-Ort. TypeScript und Produktionsbuild bestehen.
- `navigation-low.json`: sechs native Abläufe für 2/8/12 Teilnehmer auf 1440/390 Pixel. Zwei getrennte Ansichten prüfen tatsächlichen Globusklick, Panoramabedienung, präzise Karte mit Tastatur, ausdrückliche Bestätigung, private Pins, öffentliche Bereitschaft, synchronen Flug nach Neuladen, späten Wiedereinstieg und Rundenreset. Niedrige Qualität benötigt bei der Zwölferauflösung 94 Zeichenaufrufe und 15.824 Dreiecke.
- `navigation-high-reduced.json`: zwei Zwölferabläufe mit hoher Qualität und reduzierter Bewegung; `navigation-missing.json`: zwei weitere Abläufe mit einer tatsächlichen fehlenden Abgabe und elf öffentlichen Routen. Die Darstellung markiert den fehlenden Tipp korrekt. Hohe Qualität benötigt dabei 130 beziehungsweise 128 Zeichenaufrufe.
- `navigation-precision.log`: beide Zwölferfälle prüfen zusätzlich die geografische Klickgenauigkeit, eigenständige Globusdrehung, echte Panorama-/Kartenbedienung, private Bestätigung und Rundenreset.
- `navigation-lifecycle.json`: 18 Wechsel zwischen Weltreise, Kategorien-Kette, Farbwechsel und Atelier. Bei fünf Weltreisebesuchen werden jeweils zwölf tatsächliche Tipps aufgelöst. Danach bleiben 22 Texturen und 52 Geometrien bei zwölf Figuren stabil. Das ist ein Renderer-Ressourcenvergleich, keine Prozessspeicher- oder Langzeit-Netzwerkabnahme.
- `navigation-shaders.json`: vorbereiteter und erster sichtbarer Frame verwenden jeweils denselben Programmsatz, 14 bei hoher beziehungsweise 12 bei niedriger Qualität. Das belegt den ersten Frame und keine beliebigen späteren Materialvarianten.
- `navigation-preload.json`: neun vorbereitete Szene-GLBs mit zusammen 122.084 Bytes; nach Szeneneintritt erfolgt kein erneuter GLB-Abruf beim ruhigen Grafikwechsel. Panorama, Länderpolygone und Kartenkacheln sind separate Ressourcen und nicht in dieser GLB-Bytezahl enthalten.
- `navigation-audio.json`: zwei native instrumentierte Audioprüfungen bestätigen Pin-/Sitz-/Auflösungsursprung, passende Kamera-Hörerposition, einen einzigen Kontext, genau einen gemeinsamen Auflösungsklang bei elf weiteren Abgaben, stumme historische Ereignisse sowie Freigabe von Aktionsklängen und sechs Umgebungsquellen bei Unsichtbarkeit. Dies ersetzt keine Hörabnahme.

Nach Ergänzung der verborgenen Grafikvorbereitung wurden die sieben Node-Tests, TypeScript und der Produktionsbuild erneut ausgeführt. `navigation-warm-native.json` prüft vier hohe 2/12-Spielerabläufe auf beiden Breiten; `navigation-lifecycle-warm.json` bestätigt erneut 18 Szenenwechsel und dieselben fünf stabilen Weltreisebesuche. `navigation-shaders-warm.json` bestätigt erneut 14/12 Programme ohne erstes Wachstum, `navigation-audio-warm.json` erneut beide vollständigen Audioprüfungen. Die letzte reine Werkbankversetzung wird zusätzlich durch den gezielten Strahlen-/Sitz-/Vorbereitungstest, einen weiteren Produktionsbuild und aktuelle Renderbilder geprüft; ihre erneuten nativen Zwölferabläufe stehen in `navigation-side-bench-native.json`.

Die tatsächlichen Renderbilder der Gruppenansicht und der gesamten Ergebnisoberfläche wurden visuell kontrolliert. Schmale Chromium-Ansichten laufen auf dem Desktop und sind keine physischen Mobilgeräte. Weitere persönliche Kameras, bessere Lesbarkeit der kleinen Tischkarten aus der Gruppenansicht, Arbeitsplatz-/Figurenanimationen, Hörprüfung, tatsächliche Mobilhardware, Kaltstart-/Latenz-/Prozessspeichermessung und die vollständige Mehrbrowser-Olympiade bleiben erforderlich. Das bekannte lokale workerd-WebSocket-Schließproblem ist durch diese Arbeiten nicht behoben. Die Gesamtanforderung bleibt offen; die Arbeitsfassung ist nicht veröffentlicht.


Unmittelbar weiter zu untersuchen ist der breite erstmalige Ergebniswechsel: Die normalen Proben zeigen den langen Abstand etwa 1,25–1,32 Sekunden nach Probenstart, unmittelbar nach Freigabe der zwölf Tipps. Die Zeitlinie liegt in `navigation-reveal-timeline-geo-1920.trace.json`; `navigation-reveal-timeline.json` enthält die leere Canvas-Zuweisungsliste, die neue Karten-Resize-Beobachtung und die absoluten Zeiten der langsameren Bilder. Weitere Messungen müssen zwischen Ergebnisaufbau, GPU-Erstbenutzung und Seitengestaltung unterscheiden; das vorbereitete erste sichtbare Bild allein ist kein Beleg für einen gleichmäßigen Ergebniswechsel.


Der anschließende Nachtrag [PANORAMA-RENDERING.md](PANORAMA-RENDERING.md) dokumentiert die Korrektur wiederholter Panorama-Pufferzuweisungen, die präzisere Ergebniskarte, den entfernten doppelten Auflösungsklang und weitere gemessene Übergänge. Die bisherigen Messungen oben bleiben als zeitlich frühere Nachweise erhalten.
