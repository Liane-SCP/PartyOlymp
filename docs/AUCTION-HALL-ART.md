# Auktionshaus: Saal, Gastgeber und Sitzordnung

Der nachfolgende Ausbau ersetzt den direkten Figurenflug durch einen tatsächlichen Auftritt über Sitzreihe, Mittelgang und Treppe. Neue Sitzblöcke, freie unvollständige Reihen, gemeinsame Wegzeit, sofort mögliche Eingabe sowie aktuelle Funktions-/Ressourcen-/Hardwarebelege stehen in [AUCTION-STAGE-ENTRANCE.md](AUCTION-STAGE-ENTRANCE.md). Die folgenden Messwerte beschreiben die vorherige Saalfassung.

Der Saal hat jetzt seitliche Wandpaneele, Wandlampen, Bücherregale, einen Mittelgang, Bühnentreppen und geraffte Vorhangfalten. Das Thema hängt vor dem Bühnenbogen über der linken Bühnenhälfte. Bei der visuellen Prüfung lag die alte Themenfläche hinter dem Bogen und wurde aus der erhöhten Kamera verdeckt. Eine zunächst durchgehende neue Themenfläche verdeckte anschließend die erste Buchzeile. Die seitliche Anordnung korrigiert beide Überdeckungen; ein Strahlentest prüft alle sechs Zeilen einschließlich ihrer Ränder aus schmalen und breiten Bühnenkameras mit drei Blickwinkeln.

Miro steht hinter einem tatsächlichen Kenney-Schreibtisch. Sein Gesicht und Hut verwenden dieselbe SVG-/Sprite-Darstellung wie die vorhandenen Spieler und Bosse. Die Reaktion folgt der öffentlichen Spielphase. In der Buchnahansicht werden Gastgeber und Hammer ebenso wie die Zuschauer ausgeblendet; der Renderer bleibt erhalten.

Die Sitzplätze besitzen niedrige Frontanzeigen anstelle hoher Tafeln vor den Figuren. Namen, letztes Gebot, Führung und Aussteigen bleiben den Plätzen zugeordnet. Eine gemeinsame Canvastextur und ein Mesh stellen alle Anzeigen dar. Die Stuhlrücken liegen hinter den Figuren. Die persönliche Bedienung und die öffentliche Teilnehmerleiste bleiben zusätzlich zugänglich.

## Heruntergeladenes Hammermodell

- **Gavel**, Poly by Google: <https://poly.pizza/m/6yKiq1_NH5K>.
- **CC BY 3.0**: <https://creativecommons.org/licenses/by/3.0/>.
- Tatsächlich heruntergeladenes Original: `outputs/asset-sources/auction/Gavel.glb`, mit Quellenbeleg und Modellvorschau im gleichen Ordner.
- Spielasset: `public/adventure-models/props/auction-gavel.glb`, 20.440 Bytes und 1.016 Dreiecke einschließlich des goldenen Materialteils.
- Quelle, Lizenz, Änderungen und SHA-256 stehen in `auction-gavel-source.json`, der öffentlichen Modellmanifestdatei sowie der Lizenzdatei. Die Saaloberfläche zeigt die nötige Zuschreibung unter „Modelle & Künstler“.
- `scripts/prepare-auction-gavel.mjs` trennt Schlagblock und Hammer anhand der verbundenen Modellgeometrie und ergänzt einen Griffdrehpunkt. Die ursprüngliche Geometrie und Farbpalette bleiben erhalten; Skalierung, Ausrichtung und Materialrauheit werden an die Szene angepasst.
- Die Möbel `desk`, `lampWall` und `bookcaseClosedWide` stammen aus dem bereits heruntergeladenen [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit), CC0. Ihre tatsächlichen Dateien, Größen, Dreiecke und Prüfsummen sind im Manifest registriert.

Hammerbewegung und Vorhang folgen `performStartedAt`. Der Block bleibt fest; der Hammer liegt beim öffentlichen Zuschlag auf und federt kurz zurück. Ein später Wiederbeitritt beginnt in der aktuellen Pose. Reduzierte Bewegung hält ihn ruhig. Der räumliche Hammerklang wurde an die neue Pultposition versetzt.

## Ressourcen und Prüfung

Die neue Anzeigentextur gehört dem Location-Kit und wird mit der Szene freigegeben. Importierte statische Möbel und unveränderliche Architektur werden zusammengefasst; bewegliche Vorhänge, Paddel, Gastgeber und Hammer behalten ihre eigenen Transformationen.

Der Modelltest lädt das ursprüngliche und das abgeleitete GLB tatsächlich. Er vergleicht die erhaltenen Dreieckspositionen mit einer Toleranz für Float32-Umrechnung, prüft den unveränderten Schlagblock bei gedrehtem Hammer und verifiziert die veröffentlichte Prüfsumme. Weitere Tests prüfen die gemeinsame Uhr, private Bewertungen, Bücherseiten, Bühne und Rundenreset.

Die Browserprüfung wartet auf tatsächlich geladene Gastgeber- und Hammerobjekte. Sie kontrolliert die gemeinsame Hammerpose in zwei Ansichten, die Buchsicht, Zuschreibung und den bestehenden vollständigen Gebots-/Begriffs-/Bewertungsablauf. Für die Animationsprüfung wird die Bühne ausdrücklich sichtbar gemacht: Nach dem mobilen Eingabefokus darf der außerhalb des Bildes liegende Renderer pausieren.

## Messergebnisse und Grenzen

`scripts/test-auction-presentation.mjs` besteht mit sieben Tests; außerdem bestehen die 17 allgemeinen Szenentests, drei Batching-/Ressourcentests, TypeScript und der Produktionsbuild. Die vorhandene Warnung zu großen Clientchunks bleibt bestehen.

Die sechs Sparfälle des vollständigen Gebots-/Bühnenbuch-/Bewertungsablaufs verwenden je zwei koordinierte Browseransichten, mit zusätzlichem Zuschauer im mobilen Zweierfall:

| Teilnehmer | Breiten | Zeichenaufrufe | Dreiecke | Texturen | Geometrien |
|---|---|---:|---:|---:|---:|
| 2 | 1440 / 390 | 53 | 3.632 | 19 | 33 |
| 8 | 1440 / 390 | 65 | 5.576 | 31 | 39 |
| 12 | 1440 / 390 | 73 | 6.872 | 39 | 43 |

Die hohe Zwölfspieler-Stufe verwendet 98 Zeichenaufrufe, 13.416 Dreiecke, 41 Texturen und 43 Geometrien. Gegenüber der vorherigen Ausbaustufe sinken die Zwölfspieler-Zeichenaufrufe von 93 auf 73 beziehungsweise von 118 auf 98. Das belegt die geprüften Renderbudgets, keine realen Geräte-FPS. Berichte: `outputs/qa/auction-theatre-low.json` und `auction-theatre-high.json`; Bilder: `auction-{quality}-{count}-{width}-{bid,perform,book,verdict}.png`.

Acht Wechsel zwischen Auktion mit Buchnahansicht und Würfelsalon bestehen mit zwölf geladenen Figuren, einem aktiven Canvas und ohne WebGL-Fehler. Die Auktion bleibt dabei bei 33 Zeichenaufrufen, 40 Texturen, 45 Geometrien und 4.421 Dreiecken. Bericht: `outputs/qa/auction-hall-lifecycle.json`. Diese Prüfung erfolgte vor dem letzten seitlichen Versetzen der Themenfläche; Ressourcenverwaltung und Buchsicht wurden dadurch nicht verändert.

Die räumliche Audioprüfung besteht bei 1440 und 390 Pixeln: tatsächlicher Bieteranker, neuer Hammeranker `[-6.8,3.4,-4.4]`, Kamerahörer, ein AudioContext sowie Freigabe der Quellen und zweier Umgebungsschleifen bei Unsichtbarkeit. Bericht: `outputs/qa/spatial-scenes-auction.json`. Der letzte Themenversatz ändert keine Klanglogik.

Die Renderbilder von Saal, Auftritt, Buch und Urteil wurden in ausgewählten kleinen und vollen Gruppen auf breiten und schmalen Ansichten tatsächlich betrachtet und die genannten Überdeckungen korrigiert. Die Nachweise verwenden echte Szenen und Spielregeln mit koordinierten Fixtures sowie Chromium/SwiftShader. Sie ersetzen keine Hörabnahme, physische Mobilgerät-/Bildschirmtastaturprüfung, Referenzgeräte-FPS, Langzeit-Prozessspeicherprüfung oder vollständige Live-Mehrbrowser-Olympiade. Weitere Auftrittswege, Gruppen-/Ergebnisaktionen und Einspruchsführung bleiben offen. Der bekannte lokale WebSocket-Runtime-Abschlussfehler wird dadurch ebenfalls nicht als behoben gewertet. Die vollständige Abnahme aller 21 Disziplinen und Veröffentlichung bleiben Bestandteil des Gesamtauftrags.
