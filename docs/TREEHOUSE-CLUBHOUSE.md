# Farbwechsel: Baumhausclub mit hinterer Terrasse

Die Kartenrunde erhält eine tatsächliche Baumhaushütte auf einer eigenen rückwärtigen Terrasse. Der bestehende große runde Filztisch, die mechanische Ablage, gedruckte Karten und die ursprünglichen Spielerfiguren bleiben das Zentrum. Die neue Hütte, die umgebenden geladenen Baumkronen, ein unterbautes Holzdeck, die geöffnete rückwärtige Reling und ein Zugang mit durchhängenden Brückenseilen bilden einen zusammenhängenden Ort.

Die Terrasse schließt bei Z = −10 an das vorhandene Deck an. Sie überlagert dessen Oberfläche nicht. Hütte und Seitenreling liegen hinter den hinteren Sitzplätzen. Der vordere Bogen bleibt für die eigene Hand frei. Die bisherigen quadratischen Stützen sind als tragende Holzsäulen benannt. Allgemeine schwebende Felsen und Sternpunkte entfallen an diesem Ort. Warmes Hauptlicht, zurückhaltendes grünes Gegenlicht und entfernter Nebel verbinden die Architektur mit dem Wald. Es gibt keine zusätzlichen Echtzeitlichter.

## Modell und tatsächlich entfernte Daten

- **Low Poly Tree House**, Gilang Romadhan: https://poly.pizza/m/0wSdvRTUV3A
- Originaldownload: https://static.poly.pizza/c9f41c0d-5fd4-4714-8435-6d2ef6e732c5.glb
- Lizenz: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), laut geprüfter Originalquelle; Prüfung vom 18.10.2026.
- Original: 70.400 Bytes, 2.849 Dreiecke. Im Projekt: **40.196 Bytes, 1.503 Dreiecke**.
- Entfernt: Erdfläche, Gras und Steinweg. Übernommen: eigentliche Holzarchitektur, helle Details und Metallteile. Angepasst: Farbpalette, Rauheit, Metallanteil, Maßstab und Platzierung.

Das reproduzierbare Skript `scripts/prepare-treehouse-clubhouse.mjs` prüft das erwartete Quelldateiformat und die Materialbezeichnungen. Es packt nur die tatsächlich verwendeten Accessorelemente neu. Das ist hier nötig, weil die Quelldatei gemeinsame BufferViews für aktive und entfernte Geometrie verwendet. Ein bloßes Löschen der Szenenknoten würde die überflüssigen Binärdaten weiterhin ausliefern.

`outputs/qa/clubhouse-model-verification.json` dokumentiert den erfolgreichen tatsächlichen GLTFLoader-Import und den bytegenauen Vergleich aller neun aktiven Attribut-/Indexarrays mit der Quelle. Die Originaltransformation bleibt erhalten. Bei Höhe 7,2 beträgt die Modellgröße ungefähr 9,26 × 7,2 × 8,46.

Original, Quellenmetadaten und Lizenz liegen in `assets/source-models/treehouse/`. Die öffentliche GLB-Datei und Lizenz liegen in `public/adventure-models/props/`; das Modellmanifest enthält Original- und vorbereitete SHA-256-Prüfsummen.

## Sichtbare Zuschreibung und Ressourcen

„Modelle & Künstler“ ist direkt neben den Kamerabedienelementen der Tischrunde erreichbar. Die aufklappbare Zuschreibung nennt Modell, Urheber, Originalquelle, genaue Lizenz und Änderungen sowie die übrigen Kenney-Modelle. In der eigenen Handansicht beansprucht sie keinen zusätzlichen Platz. In der eingebetteten Ansicht öffnet sie oberhalb der Leiste, in der großen Tischansicht darunter. Die native Schaltfläche ist mindestens 44 Pixel hoch und per Tastatur erreichbar.

Unveränderliche Deckteile, Brückengeometrie, Requisiten und kompatible Modellteile werden nach dem Laden statisch zusammengefasst. Der bestehende Richtungsmechanismus bleibt außerhalb dieser Zusammenfassung. Karten, Auswahlziele und Figuren behalten ihre eigenen Zustände und Freigaben.

## Prüfung und verbleibender Umfang

Die sieben Node-Tests prüfen weiterhin Privatsphäre, bestätigte Aktionen, zeitabhängig wiederherstellbare Kartenflüge, Farbwahl, große Hände bis 108 Karten und beide Tischperspektiven. Neu geprüft werden freie Strahlen zur eigenen Hand, zum Zieh-/Ablagestapel und zu den Gesichtern bei 2/8/12 Teilnehmern und zwei Seitenverhältnissen. Diese Geometrieprüfung umfasst die neue konstruierte Architektur; tatsächlich geladene Modellgeometrie wird zusätzlich im Browser visuell geprüft. TypeScript und der Produktionsbuild bestehen.

Die Shaderprüfung (`clubhouse-shaders.json`) misst zwölf vorbereitete und zwölf beim ersten sichtbaren Bild verwendete Programme in hoher Qualität sowie zehn/zehn in niedriger Qualität. Die Vorladeprüfung (`clubhouse-preload.json`) bereitet vier ortsspezifische GLB-Dateien mit zusammen 72.712 Bytes vor; weitere gemeinsam verwendete Möbel werden ebenfalls bereits in der Regelphase geladen. Ein Umschalten der ruhigen Ansicht erzeugt keine erneuten Modellanfragen.

Die sechs nativen Aktionsfälle in niedriger Qualität (2/8/12 Teilnehmer × 1440/390 Pixel) bestehen mit jeweils zwei getrennten Browseransichten. Geprüft sind direkter Ziehstapel, Seitenwechsel, Richtungswechsel, Aussetzen, +2, beide ausdrücklich bestätigten Joker, private Rückseiten, Wiederbeitritt während einer bestätigten Strafe, letzte Karte, Gewinner und Folgerunde. Die gemessenen Zeichenaufrufe betragen 57/75/87. Berichte: `clubhouse-native-2.json`, `clubhouse-native-8-12.json`.

Zwei weitere Aktionsfälle mit zwölf Teilnehmern, hoher Grafikqualität und reduzierter Bewegung bestehen ebenfalls (1440/390 Pixel, je 113 Zeichenaufrufe). Bericht: `clubhouse-high-reduced.json`. Der Prüfer erwartet hier bewusst keine Kartenflugposen, aber denselben bestätigten Zug und öffentliche Kartenbestände nach Reload. Der erste erweiterte Lauf wartete noch auf die absichtlich ausgeblendeten Flugposen und lief ins Zeitlimit; dieser Prüfungsfehler bleibt in `clubhouse-high-reduced-before-motion-check.log` erhalten. Die normale Animationsvariante prüft weiterhin tatsächliche Flugposen und ihre identische Wiederherstellung.

Alle sechs zusätzlichen Handansichtfälle bestehen: zwölf Teilnehmer bei 1440 × 1100, 390 × 844, 320 × 844 und 844 × 390 Pixeln in niedriger Qualität sowie 390 × 844 und 844 × 390 in hoher Qualität mit reduzierter Bewegung. Geprüft sind direkt bedienbare große Karten, Seitensprung, Joker-Fokusfalle und ausdrückliche Bestätigung, Drehung während der Farbwahl, Escape und Rückkehr zur Tischrunde, vollständig im Bildschirm liegende Zuschreibung, eine erhaltene Canvas und der echte Rundenabschluss. Berichte: `clubhouse-hands.json`, `clubhouse-hands-high-reduced.json`.

Die Handansichtprüfung bestätigt ausdrücklich, dass stummes Spielen keinen Audiokontext erzeugt. Erst ein Klick auf den tatsächlichen „Ton einschalten“-Button schaltet genau einen Kontext frei; danach wird seine Audioposition mit der Handkamera verglichen. Der ursprüngliche Prüfer erwartete bereits bei stummem Spiel einen Kontext; der Fehllauf bleibt als `clubhouse-hands-before-audio-gesture.log` erhalten. Die Produktlogik wurde dafür nicht geändert.

Die 18 Szenenwechsel zwischen Karten, Garten, Messpavillon und Farbenlabor prüfen zwölf geladene Figuren und eine aktive Spiel-Canvas. Bei allen fünf Handansichten bleiben 29 Texturen und 35 Geometrien stabil; die Darstellung benötigt 47–48 Zeichenaufrufe und 11.656–11.722 Dreiecke. Bericht: `clubhouse-lifecycle.json`.

Der erweiterte Test `clubhouse-both-views-lifecycle.json` umfasst erneut 18 Wechsel. Bei allen fünf Kartenbesuchen geht es von der eigenen Hand zurück in die große gemeinsame Tischrunde. Die Tischrunde bleibt bei 80 Zeichenaufrufen, 14.307 Dreiecken, 29 Texturen und 35 Geometrien. Die Handansicht bleibt bei 47–48 Zeichenaufrufen und denselben stabilen Ressourcenständen. Damit wird auch die tatsächlich sichtbare Hintergrundhütte wiederholt gezeichnet.

Zwei instrumentierte native Audiofälle prüfen echte Kartenaktionen, räumlichen Ursprung, passenden Hörer, einen Audiokontext und Freigabe bei Unsichtbarkeit. Bericht: `clubhouse-audio.json`. Dies ersetzt keine Hörprobe mit Kopfhörern.

Tatsächliche Desktop- und schmale Renderbilder wurden visuell kontrolliert, darunter `color-table-2-1440-playing.png`, `clubhouse-credits-12-390.png` und `color-hand-12-390-table.png`. Im schmalen Bild bleiben zwölf Sitzplätze und die eigene Hand erkennbar; die private Nahansicht stellt drei große direkt bedienbare Karten dar.

## Kurze tatsächliche Hardwaremessung

Nach dem Ende der übrigen Browserjobs wurden vier separate warme Messungen mit D3D11 auf der tatsächlich gemeldeten **NVIDIA GeForce RTX 4080 SUPER** ausgeführt. Alle Fälle verwenden hohe Qualität, zwölf geladene Figuren, den tatsächlichen anfänglichen Sieben-Karten-Bestand, stummes Audio und die native Seitenanordnung. Die Handansicht wird über ihren echten Button geöffnet. App-Bildzeit und unabhängige rAF-Beobachtung sind keine vollständige GPU-Zeitspur.

| Ansicht / Browserbreite | Tatsächlicher Zeichenpuffer | Draw Calls | Dreiecke | App-Bildzeit P95 | Render-CPU P95 |
|---|---|---|---|---|---|
| Tisch / 1920 | 1040 × 797 | 107 | 27.422 | 16,8 ms | 1,0 ms |
| Tisch / 390 | 364 × 330 | 107 | 27.466 | 16,7 ms | 0,9 ms |
| Eigene Hand / 1920 | 1918 × 785 | 73 | 24.273 | 16,7 ms | 0,7 ms |
| Eigene Hand / 390 | 388 × 514 | 90 | 24.443 | 16,8 ms | 0,9 ms |

Pro Fall wurden 241 rAF-Abstände erfasst. Der größte beobachtete Abstand beträgt jeweils 16,8 ms; keiner überschreitet 33,5 oder 50 ms. Berichte: `clubhouse-group-hardware.json`, `clubhouse-hand-hardware.json`. Tatsächliche Renderbilder: `clubhouse-group-cards-1920.png`, `clubhouse-hand-cards-390.png`.

Diese kurzen Desktop-GPU-Messungen beweisen weder Smartphone-Leistung noch integrierte GPU-Leistung, Kaltstartlatenz, maximale Effektlast oder eine lange echte Partie. Die Raumgestaltung ersetzt keine vollständige Abnahme aller 21 Disziplinen, keine physische Mobilgeräte-/Hörprüfung und keine vollständige reale Netzwerk-Olympiade. Das bekannte WebSocket-Laufzeitproblem bleibt separat in `REALTIME-RUNTIME.md` dokumentiert.
