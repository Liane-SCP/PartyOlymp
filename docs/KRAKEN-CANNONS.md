# Krakensturm: tatsächlich importierte Schiffskanonen

Die Kanonenstationen verwenden jetzt die fahrbare Kanone aus dem [Kenney Pirate Kit](https://kenney.nl/assets/pirate-kit). Die offizielle Produktseite und die tatsächlich heruntergeladene Paketlizenz weisen das Pirate Kit 2.1 als CC0 aus. Originalmodell, Palette, Lizenz und Quellenmetadaten liegen dauerhaft unter `assets/source-models/pirate/`; die kuratierten Laufzeitdateien liegen unter `public/adventure-models/props/`.

## Auswahl und Aufbereitung

Das ausgewählte Original `cannon-mobile.glb` besitzt einen ausgearbeiteten Lauf mit Mündungsöffnung, Holzlafette, vier Rädern und seitlichen Beschlägen. Die drei ursprünglichen Meshes werden mit ihren vorhandenen Hierarchietransformationen in eine einzige Geometrie gebacken. Alle 472 Dreiecke, Normalen und Paletten-UVs bleiben erhalten. Die nicht benötigten Tangenten entfallen. Die ursprüngliche Palette bleibt als lokale Textur erhalten; die Materialrauheit wird wie bei den übrigen importierten Modellen vereinheitlicht.

Das Laufzeitmodell benötigt 28.736 Byte, die Palette 10.061 Byte. Alle zwei bis zwölf Kanonen teilen dieselbe Geometrie, dasselbe Material und dieselbe Textur. Das Modell benötigt einen sichtbaren Mesh-Zeichenaufruf pro Kanone. Der reproduzierbare Modellhash lautet `44bfc36178107382af6d10ffc3cd0a294c0cccf36eb8ab38d61559955eae149a`.

`scripts/prepare-ship-cannon.mjs` rekonstruiert die Aufbereitung aus dem erhaltenen Original. Die Quelle wird vor der Verarbeitung gegen ihre registrierte Prüfsumme geprüft. Die Funktion gehört außerdem zum bestehenden Asset-Vorbereitungsablauf. Die erzeugten Modell-/Lizenz-/Quellendateien und der Eintrag in `public/adventure-models/manifest.json` dokumentieren Autor, Quelle, Download, Lizenz, Paketversion, Bearbeitung und Prüfsummen.

## Position und Spielmechanik

Die Mündungsmitte des aufbereiteten Modells liegt exakt bei `[0, 0.455, -0.72]` im vorhandenen Kanonenraum. Das ist der bisherige Ursprung der gemeinsam inszenierten Schüsse. Die Räder treffen bei lokalem Boden `-0.09` und bestehender Kanonenhöhe `0.84` auf die Deckhöhe `0.75`. Auch bei zwölf Spielern bleiben die tatsächlichen Modelle voneinander getrennt.

Die neue Platzierungsoption `origin: 'authored'` erhält solche vermessenen Modellanker. Alle bestehenden Platzierungen behalten ihre bisherige Zentrierung und Basisausrichtung. Das zusätzliche Verhalten ist separat geprüft.

Die Modelle hängen unter den vorhandenen Kanonengruppen. Schiffsschwanken, Rückstoß und bestehende Kameraführung gelten dadurch auch für sie. Laden, Zeitmessung, Loslassen, Zielband, Genauigkeit, Schaden und Serverentscheidungen werden unverändert verwendet. Die tatsächlichen Modellflächen sind direkt bedienbar. Die goldene Stationsfläche bleibt ebenfalls erreichbar.

Die Oberseite der verstärkten Stationsplatten liegt bei `0.755` und damit fünf Millimeter über dem Hauptdeck. Die vorher koplanaren Flächen sind getrennt; Rad- und Projektilanker bleiben erhalten. Die anschließende Bildkontrolle zeigte zusätzlich Rasterartefakte an schrägen Bordflächen. Deren Ursache waren modellinterne koplanare Überschneidungen; die geometrische Bereinigung und ihre gesonderten Nachweise stehen in [KRAKEN-HULL-SURFACES.md](KRAKEN-HULL-SURFACES.md).

Die früheren einfachen Kanonenmeshes werden nach erfolgreichem Laden ausgeblendet und bleiben in der Freigabe des Arena-Besitzers. Ein fehlgeschlagener Download lässt die vorhandene bedienbare Ersatzdarstellung erhalten. Importierte Modelle und Palette gehören dem gemeinsamen Modellbesitzer und werden beim Szenenabbau freigegeben.

## Mobile Nahansicht

Das erste tatsächliche Mobilbild zeigte das seitliche Bedienfeld teilweise vor der eigenen Figur. In der persönlichen Kanonenansicht stehen die beiden Ansichtswechsel jetzt nebeneinander in einem unteren Feld; Hinweis und breiteres Zielband liegen darunter. Die Kameramitte ist entsprechend nach unten auf den Arbeitsbereich ausgerichtet, sodass die Figur höher im freien Bild steht. Die vorhandenen Welt-/Pultansichten und der automatische Rückweg zur gemeinsamen Salve bleiben erhalten.

Vier projizierte Punkte im zentralen Gesichtsbereich müssen auf dem freien Canvas liegen. Die beiden Schaltflächen bleiben mindestens 44 Pixel hoch. Der tatsächliche schmale Zweier-Render wurde kontrolliert: Gesicht und Kanone stehen frei über dem Bedienfeld, das Zielband bleibt sichtbar.

## Prüfungen

- Drei Assettests prüfen Lizenz-/Quellenbindung, Prüfsummen, tatsächliche Mesh-/Materialzahl, alle erhaltenen transformierten Dreiecke/Normalen/UVs sowie die geometrische Mündungs-, Boden- und Platzzuordnung für zwei bis zwölf Stationen.
- Die erneute Vorbereitung erzeugt bytegleich dieselbe GLB-Datei.
- Vier Batching-/Modellbesitztests einschließlich unveränderter normaler Modellzentrierung und erhaltener Autorenkoordinaten bestehen. Die 17 allgemeinen Szenentests und fünf Boss-Ortstests bestehen.
- TypeScript und Produktionsbuild bestehen. Die vorhandene Clientchunk-Warnung bleibt bestehen.
- Sechs Chromium-/SwiftShader-Abläufe mit zwei, acht und zwölf Teilnehmern sowie jeweils 1440 und 390 Pixel Breite bestehen. Jeweils der letzte Teilnehmer bedient die tatsächliche Modellmündung mit Maus beziehungsweise CDP-Touch, hält mindestens 250 ms und löst einen serverseitig bestätigten Schuss sowie die gemeinsame Salve aus. Alle Modelle teilen innerhalb der Szene eine Geometrie und ein Material. Die Berichte `outputs/qa/boss-venues-kraken-focus-crew{2,8,12}-player{1,7,11}-animated.json` enthalten jeweils zwei Ergebnisse und keine erfassten Fehler. Die beiden Zwölferfälle wurden nach der abschließenden Plattenanhebung erneut erfolgreich ausgeführt.
- Die endgültigen persönlichen Ansichten wurden als tatsächliche Renderbilder kontrolliert: `boss-venue-kraken-ready-390-focus-crew12-player11-animated.png` für den letzten Platz und `kraken-cannons-hardware-focus-kraken-390.png` für den ersten Platz. Eigene Gesichter und Kanonen sind erreichbar und oberhalb des Bedienfelds sichtbar. Die Übersicht zeigt alle zwölf Figuren mit ihren Stationen; die gesamte Schiffs-/Bosskomposition bleibt weiter auszuarbeiten.

Die lokalen Hardwareberichte `outputs/qa/kraken-cannons-hardware-overview.json` und `outputs/qa/kraken-cannons-hardware-focus.json` messen den ruhenden Antwortzustand mit zwölf geladenen Kanonen auf einer NVIDIA RTX 4080 SUPER über ANGLE/D3D11. Jede Messung enthält 241 Bildintervalle. Alle vier Fälle wurden nach der Plattenanhebung erneut gemessen. Die persönliche Ansicht benötigt bei 1920 × 1080 insgesamt 63 Zeichenaufrufe bei p95 16,8 ms und bei 390 × 844 insgesamt 34 bei p95 16,7 ms. Die Übersicht benötigt bei beiden Größen 103 Zeichenaufrufe bei p95 16,7 ms. Alle melden 60 FPS bei Rendermaßstab 1, ohne Intervalle über 33 ms und ohne erfasste Seitenfehler. Dies sind warme Desktop-GPU-Messungen ohne aktive Salven; ein schmales Fenster belegt keine Smartphone-Leistung und keine Kaltstart-, Langzeit- oder Eingabelatenzgrenze.

## Grenzen

Die Browserabläufe verwenden die tatsächliche Spiel-Engine mit koordinierten Fixtures und Chromium/SwiftShader. Sie belegen die geprüften Maus-/Touchaktionen und Darstellungen, keine physische Mobilgeräte-FPS, native Bildschirmtastatur, Hörabnahme, vollständige Live-Mehrbrowser-Bossbegegnung oder Prozessspeichergrenze. Weitere Takelage-/Deck-/Wellen-/Phasen-/Klanggestaltung, allgemeine mobile Übersichtskomposition und die vollständige Abnahme aller 21 Disziplinen bleiben offen. Der bekannte lokale WebSocket-Runtime-Abschlussfehler wird dadurch nicht behoben. Es wurde keine neue Version veröffentlicht.
