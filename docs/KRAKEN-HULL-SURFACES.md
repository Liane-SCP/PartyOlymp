# Krakensturm: bereinigte Rumpfoberflächen

Die Bildkontrolle der Kanonenintegration zeigte Rastermuster auf Deck und schrägen Bordwänden. Die Ursache lag im abgeleiteten Kenney-Schiffsmodell: Unterschiedliche Dreiecke bedeckten dieselben Ebenen. Eine unabhängige geometrische Diagnose fand im vorherigen Rumpf 159 überlappende Dreieckspaare. Die bisherige Anhebung der Kanonenplattformen konnte diese modellinternen Überlappungen nicht beseitigen.

## Aufbereitung

Das Original `ship-large.glb`, seine Palette, die mitgelieferte CC0-Lizenz und Quellenmetadaten liegen jetzt dauerhaft unter `assets/source-models/watercraft/`. `prepareBossHull()` prüft Original und Palette gegen deren SHA-256-Prüfsummen, bevor es die vorhandene Höhenbeschneidung bei Y = 2,45 ausführt.

Die neue Offline-Aufbereitung `scripts/lib/resolve-hull-surfaces.mjs` gruppiert tatsächlich koplanare Flächen. Bei Überlappung erhält die zuerst vorhandene Autorenfläche Vorrang; aus späteren Dreiecken wird nur die bereits bedeckte Teilfläche herausgeschnitten. Neue Randpunkte übernehmen interpolierte Positions-, Normalen- und UV-Attribute. Nicht überlappende Bereiche bleiben erhalten. Das betrifft 49 Dreiecke des bisherigen beschnittenen Rumpfs. Nach Float32-Quantisierung kollabierende Splitterdreiecke werden entfernt.

Der Rumpf bleibt ein einziges Mesh mit einem Material und derselben Palette. Die Außenform und Deckhöhe bleiben erhalten. Kanonen-, Figuren- und Projektilpositionen ändern sich nicht. Es werden weder zusätzliche Laufzeitberechnungen noch Polygon-Offset, veränderte Tiefentests oder verdeckende Ersatzflächen eingeführt.

Das reparierte Modell besitzt 721 statt 628 Dreiecke: Das Ausschneiden von Überschneidungen benötigt zusätzliche Randdreiecke. Die GLB-Datei benötigt 55.076 Byte. Der reproduzierbare SHA-256 lautet `5e78d22a3c85ae2e703a8ead95de1a7e988fa0f7617fd567e61d47640bf5f523`. Manifest und öffentliche `ship-hull-source.json` dokumentieren Bearbeitung, Quelle und Prüfsummen; die Lizenz liegt ebenfalls beim Laufzeitmodell.

## Nachweise

`node scripts/test-ship-hull.mjs` besteht mit drei unabhängigen Prüfungen:

- Quell-/Paletten-/Lizenzbindung, bytegleiche Wiedererzeugung, Manifest und Größenbudget.
- Tatsächliche geometrische Schnittprüfung aller koplanaren Dreieckspaare: keine verbleibende Überschneidung oberhalb der numerischen Toleranz; keine degenerierten Dreiecke.
- Jedes neue Dreieck stammt aus dem interpolierten Attributfeld einer Originalfläche. Stichproben aus jedem erhaltenen Originaldreieck bleiben bedeckt; kein geprüfter Oberflächenpunkt wird zum Loch.

Die fünf bestehenden Boss-Ortstests einschließlich Deckabdeckung für alle Stationspositionen von zwei bis zwölf Teilnehmern und die drei Kanonen-Assettests bestehen ebenfalls. Der Produktionsbuild endet mit Exitcode 0. Die bestehende Chunkgrößenwarnung bleibt erhalten.

## Tatsächliche Darstellung und Eingabe

Der lokale Worker lieferte nach dem Produktionsbuild exakt den oben angegebenen Modellhash aus. Die Übersicht bei 1920 Pixeln sowie die persönliche Ansicht am ersten und letzten Platz bei 390 Pixeln wurden visuell kontrolliert. Die zuvor beobachteten Muster an Deck und Bordwand sind in diesen Bildern beseitigt. Die Vorheraufnahme des letzten Platzes liegt unter `outputs/qa/ship-hull-before-last-station-390.png`, die zugehörige Nachheraufnahme unter `outputs/qa/ship-hull-repair-last-station-390.png`. Die übrigen Bilder beginnen mit `ship-hull-repair-hardware`.

Die beiden animierten Zwölfer-Abläufe mit dem letzten Teilnehmer bei 1440 und 390 Pixeln bestehen erneut. Maus und CDP-Touch treffen die Modellmündung, halten die Kanone und lösen den bestätigten Schuss mit anschließender gemeinsamer Salve aus. Freier zentraler Gesichtsbereich, sichtbares Zielband und gemeinsam genutzte Modellressourcen werden ebenfalls geprüft. `outputs/qa/ship-hull-repair-browser.json` enthält beide Ergebnisse ohne erfasste Fehler.

Vier warme Hardwaremessungen auf der RTX 4080 SUPER über ANGLE/D3D11 enthalten je 241 Bildintervalle. Übersicht und persönliche Ansicht bei 1920 × 1080 sowie 390 × 844 melden jeweils 60 FPS bei Rendermaßstab 1; p95 liegt zwischen 16,7 und 16,8 ms, kein Intervall über 33 ms. Die Übersicht erfasst 103 Zeichenaufrufe. Die persönlichen Einzelbilder erfassen 63 beziehungsweise 68; Momentaufnahmen können die periodische Schattenaktualisierung enthalten und sind kein Vergleich einer konstanten Renderpasszahl. Die Berichte `ship-hull-repair-hardware-overview.json` und `ship-hull-repair-hardware-focus.json` enthalten keine erfassten Seitenfehler.

Diese Prüfungen verwenden koordinierte Engine-Fixtures. Die schmalen Hardwareansichten laufen auf derselben Desktop-GPU. Sie belegen weder echte Smartphone-Leistung noch Live-Netzwerkverhalten, Kaltstart, aktive Salvenspitzen oder Prozessspeicher über längere Sitzungen. Die vollständige Olympiaden-, Live-Mehrbrowser-, Hör-, echte Mobilgeräte- und Langzeitabnahme aller 21 Disziplinen bleibt unabhängig offen. Es wurde keine neue Version veröffentlicht.
