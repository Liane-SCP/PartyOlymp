# Sichtbare Crew und zusammenhängende Inselwege

Stand: 18.10.2026. Lokaler Oberweltausbau im unveränderten Gesamtziel für alle 21 Disziplinen. Die Inselprüfungen sind keine Abnahme der jeweiligen Minispiele oder des gesamten Abenteuers.

## Gestaltung und Bedienung

Die bisherigen Atlasgebäude verdeckten besonders auf der Kolossinsel mehrere Figuren. Die Weltkamera blickt jetzt aus ungefähr 55 Grad Höhe; ihr gemeinsamer Richtungsvektor `[62, 180, 108]` liegt in `JOURNEY_CAMERA`. Auf die tatsächlichen Bauten abgestimmte Miniaturmaßstäbe lassen den umlaufenden Crewbereich frei. Koloss, Drache, Casino, Sternwarte und weitere hohe Gebäude haben eigene Werte. Kristallpflanzen und die Boss-Gehölze wurden ebenfalls an die Sichtachsen angepasst.

Die Crew bewegt sich auf flachen, regional eingefärbten Wegen. Innerer und äußerer Rand sowie radiale Fugen machen den erlaubten Laufbereich erkennbar. Die Wegoberfläche liegt über dem flachen Gelände, nicht darin. Die Figuren behalten ihre bisherigen Formen, Farben und Accessoires sowie die Darstellung aus den Bossarenen.

Ein zunächst gebauter hoher Rundgang wurde nach der tatsächlichen Renderprüfung verworfen: Er dominierte die Landschaft und ließ die Inseln zu ähnlich wirken. Der verworfene Zustand ist als `plaza-raised-rejected-colossus.png` und `journey-plazas-raised-rejected.json` erhalten. Die ausgelieferte lokale Fassung verwendet die flachen Wege.

Bei bis zu vier Teilnehmern bleiben die Namen sichtbar. Größere ruhende Gruppen zeigen den eigenen Namen; andere Figuren werden per Maus oder Touch identifiziert. Der zusätzliche Tastaturschalter „Crew-Namen anzeigen“ blendet auf Wunsch alle Namen ein, ohne Welt oder Kamera neu aufzubauen. Die Namensanzeige und die zugängliche Statusmeldung reagieren auf bewusstes Antippen, ohne dabei einen Laufbefehl abzusenden. Aktive Emotes und einzelne manuelle Bewegungen bleiben erkennbar. Während gemeinsamer Brückenreisen entsteht standardmäßig keine Wand aus zwölf Namensschildern. Noch unsichtbare, nicht geladene Avatare fangen keine Bodenberührungen ab.

## Tatsächlich geladene Modelle

Der aktuelle Crew-Ort erhält vier niedrige Pflanz-/Leuchtobjekte auf kleinen, abgestützten Randvorsprüngen. Bereiche vor den beiden angrenzenden Reiseaufgängen bleiben frei. Das lädt zwei bereits im Projekt vorhandene, tatsächlich heruntergeladene Kenney-GLBs mit jeweils zwei Platzierungen:

| Modell | GLB-Größe | Dreiecke pro Modell | Lizenz |
| --- | --- | --- | --- |
| `furniture/pottedPlant` | 7.576 Byte | 60 | CC0-1.0 |
| `furniture/lampRoundTable` | 6.604 Byte | 76 | CC0-1.0 |

Quelle und Urheber: [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit), Kenney. Die vollständige mitgelieferte Lizenz wurde gelesen; Quellen, Hashes und bisherige Aufbereitung stehen in `public/adventure-models/manifest.json`. Die GLBs wurden nicht verändert. Maßstab, Platzierung und vorhandene Materialnormalisierung erfolgen durch den gemeinsamen Modell-Loader. Es werden keine neuen kostenpflichtigen Assets benötigt.

Nur der aktuelle Crew-Ort lädt diese zusätzliche Ausstattung. Ein eigener Szenenbesitzer teilt die Modellressourcen zwischen den Platzierungen und gibt sie einschließlich verspätet geladener Ressourcen beim Wechsel frei. Der bestehende Fähr-/Luftschiff-Besitzer bleibt getrennt.

## Wege, Brücken und Ankunft

Normalisierte öffentliche X-/Z-Laufziele, Startpositionen, Reisezeitpunkte und Wertungen bleiben unverändert. `journeyWalkHeight` vereinheitlicht die sichtbare Oberfläche; Weg und Dock liegen auf derselben Höhe. Eine Prüfung mit echten Geometrieschnitten fand dabei einen zu hohen Dockboden, der korrigiert wurde.

`journeyBridgePoint` beschreibt dieselbe Kurve für die Bretter und die Crew. Der Weg beginnt und endet auf den Inselwegen. `journeyBridgePassenger` führt die Figuren vom gespeicherten Start auf die Brücke und anschließend zum normalen Zielplatz. Zwei Spuren und zeitversetzte Reihen ersetzen die bisher seitlich aufgefächerte Gruppe. Alle Übergänge lassen sich direkt aus dem öffentlichen Reisezeitpunkt rekonstruieren. Die Kamera berücksichtigt die tatsächlichen Crewpositionen auch bei einer Brückenreise.

Eine Brückenreise zeigt eine eigene verständliche Anzeige für Aufgang, Überquerung und Ankunft. Reduzierte Bewegung bleibt eine statische Ankunft. Die Schiffs-Gangways nutzen denselben Bodenbezug wie die Inselwege.

## Nachweise und Prüfgrenzen

- `journey-plaza-unit.log`: 41 Tests bestehen. Neue Fälle prüfen den tatsächlichen Wegboden unter zwölf Positionen sowie kontinuierliche Brückenenden, Reihen und Spuren. Vorhandene Reise-/Wertungsprüfungen bleiben erhalten.
- `journey-sightlines.json`: 63.504 geprüfte Sichtlinien auf allen 21 Inseln ohne verdeckte Probenposition. Abgetastet werden drei erlaubte Radien, 72 Winkel, zwei Gesichtshöhen und sieben Animationszeitpunkte einschließlich der Flügel-Extrema. Der erweiterte Test deckte noch zwei vom Drachenflügel verdeckte Positionen auf; der Maßstab wurde daraufhin korrigiert. Die Prüfung betrachtet lokale opake Inselgeometrie, keine anderen Avatare, Textur-Alpha, entfernten Inseln oder HUD-Überdeckungen und ist kein mathematischer Beweis für alle kontinuierlichen Zustände.
- `journey-plazas.json`: alle 21 Inseln mit zwölf tatsächlich geladenen Figuren am Desktop sowie fünf Mobilansichten und ein Zweispielerfall bestehen. Pro Fall werden beide zusätzlichen GLBs geladen, die Namensanzeige geprüft und eine fremde Figur mit echter Maus-/Touch-Eingabe identifiziert, ohne einen Spieler zu bewegen. `journey-plazas-dragon-final.json` ergänzt die korrigierte Drachenansicht; `journey-plazas-final-input.json` prüft die abschließende Eingabefassung an vier repräsentativen Fällen.
- `journey-navigation.json` und die Einstiegsausgabe: vier Navigationsfälle einschließlich 320 Pixeln, 40 Etappen und einer einzelnen Insel sowie zwei native Gebietseinstiege bestehen. Die Einstiegstests projizieren inzwischen mit der tatsächlich gerenderten Kameraposition statt einer veralteten festen Höhe.
- `journey-plaza-lifecycle.json`: neun vollständig geladene Ansichten nach acht Vollbildwechseln behalten jeweils 32 GPU-Geometrien und 15 Texturen. Die alten Kontexte sind nachweislich verloren und es bleibt genau eine sichtbare Canvas. Ein weiterer schneller Wechsel schließt einen Besitzer mit zwei noch ausstehenden, künstlich verzögerten GLBs; nach deren Abschluss bleiben Browserfehler aus. Das prüft Rendererzähler und Kontextfreigabe, keine Prozess-/Treiberspeichermessung oder Langzeitsitzung.

Die abschließenden vier Eingabefälle prüfen zusätzlich den Namensschalter mit Enter. Im mobilen Casino-Fall wird auch der echte Fokusumlauf im Vollbild geprüft: Shift+Tab bleibt im Dialog und Tab erreicht wieder die Grafikauswahl. Die Fokusbegrenzung berücksichtigt jetzt neben Schaltflächen auch Auswahlfelder und andere reguläre Formularelemente.

Alle acht Fälle in `journey-transit.json` bestehen, einschließlich einer neuen mobilen Zwölfspieler-Brücke. Beide Brückenfälle vergleichen die tatsächlichen Figurenpositionen mit den gespeicherten Ausgangsplätzen, prüfen alle Figuren innerhalb des freien Bildbereichs, die eigene Reiseanzeige und die Wiederherstellung nach Reload. Die vier Natur-/Bewegungsfälle bestehen ebenfalls. Deren echter Bodenklick wählt bewusst einen freien Punkt außerhalb der sichtbaren Figuren; das Antippen einer Figur hat inzwischen die geprüfte eigenständige Bedeutung „Name anzeigen“.

`journey-audio-live.json` bestätigt erneut genau einen vor der Reise durch echte Eingabe aktivierten AudioContext sowie eine einmalige Abfahrts-/Ankunftsfolge. Die Kontextkonstruktion kostet im allein laufenden Nachtest 43,4 ms; unter gleichzeitig laufenden Software-Browserprüfungen wurden 64 ms beobachtet (`journey-audio-live-concurrent-plaza.json`). Diese Kosten fallen an der vorbereitenden Nutzeraktion an, sind kein kostenloser Kaltstart und kein Nachweis von Hörqualität oder durchgehend 60 FPS mit allen Klangquellen.

Die echte lokale HTTP-/D1-Teilstrecke `journey-transit-network.json` besteht nach den Änderungen ebenfalls: vollständig ausgewertete Hivemind-Runde, identischer öffentlicher Reisezeitpunkt in zwei gerenderten Clients, geladene Fähre, Reload während der Fahrt und gemeinsame Ankunft. Die gemessenen Bootspositionen unterscheiden sich um 0,05273 Welteinheiten. Die Runtime meldet beim Verbindungsschluss weiterhin ihren bekannten Fehler; der erfolgreiche Reiseablauf belegt keinen sauberen Request-Abschluss.

Der aktuelle Hardwarebericht `journey-quality-hardware.json` verwendet nach wie vor die RTX 4080 SUPER mit D3D11, zwölf Figuren und 21 geladenen Inseln in der normalen Koloss-Nahansicht. Drei kurze, warme Messfenster pro Stufe ergeben:

| Viewportbreite | Hoch | Sparsam | Frame-p95 Hoch / Sparsam | Hauptthread-CPU-p95 Hoch / Sparsam |
| --- | --- | --- | --- | --- |
| 1440 | 59,94 FPS | 29,85 FPS | 16,7 / 33,4 ms | 0,8 / 0,8 ms |
| 390 | 60,18 FPS | 29,96 FPS | 16,8 / 33,4 ms | 0,8 / 0,8 ms |
| 320 | 59,91 FPS | 29,87 FPS | 16,8 / 33,4 ms | 0,7 / 0,8 ms |

Das sind dieselbe starke Desktop-GPU und verschiedene Fenstergrößen, keine drei Referenzgeräte und keine Mobilgeräte-Abnahme. Die CPU-Werte sind synchrone Frame-Arbeit, keine GPU-Zeit. Der vorherige Hardwarestand ist unter `journey-quality-hardware-before-plaza.json` erhalten.

Alle 21 Desktopbilder wurden in den tatsächlich erzeugten Kontaktbögen `plaza-contact-sheet-1.png` und `plaza-contact-sheet-2.png` betrachtet. Koloss- und Casinoansichten wurden zusätzlich einzeln in Desktop-/Mobilgröße kontrolliert. Die erhöhte erste Fassung und ein zu tief liegender Wegbelag wurden anhand dieser Bilder korrigiert.

Die vertraute 30/60-Hz-Grafikwahl bleibt erhalten. Zusätzliche Hardware-, Reise-, Bewegungs- und Klangnachweise werden in den zugehörigen QA-Berichten geführt. Software-Rendererbilder ersetzen keine tatsächlichen Mobilgeräte oder mittleren Referenzgeräte.

Weitere Architektur-/Landschaftsdetails, zusätzliche gemeinsame Aufenthaltsinteraktionen, individuelle Spielort-/Klangarbeit und die vollständige Mehrbrowser-Olympiade bleiben offen. Der bekannte WebSocket-Abschlussfehler bleibt gesondert in [REALTIME-RUNTIME.md](REALTIME-RUNTIME.md) dokumentiert. Gesamter Umfang und offene Disziplinanforderungen stehen in [ADVENTURE-STATUS.md](ADVENTURE-STATUS.md).
