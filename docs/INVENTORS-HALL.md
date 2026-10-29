# Bombenwort: Erfinderwerkstatt

Die Funkenwerkstatt erhält eine eigene industrielle Raumgestaltung um ihre bestehende gemeinsame Wort- und Bombenrunde. Hintere und seitliche Sprossenfenster, ein gegliedertes Mauerwerk, Dachbalken mit Eckstreben und kupferfarbene Kanten lösen die vorher weitgehend leeren Wandflächen ab. Eine eingefasste gemeinsame Anzeigetafel verbindet die tatsächliche Buchstabenfolge, den aktiven Bombenbesitzer und das letzte Urteil. Unter den Fenstern hängen sechs tatsächlich importierte Schraubenschlüssel. Zwei ausgestattete Werkbänke stehen vor den bestehenden Maschinen; die zentrale Bodenroste und feste Sicherheitsmarkierungen lassen den Übergabebereich frei.

Jeder vorhandene persönliche Bombentisch erhält eine niedrige metallene Ablage mit seitlichem Rand. Die Bombe bleibt seitlich neben dem ursprünglichen Gesicht der jeweiligen Figur. Die Zuschauerbank erhält eine niedrige Rückenlehne und passt ihre Breite weiterhin an die Gruppe an. Vorhandene Förderbänder, Rohre, Maschinen und Kisten bleiben Teil der Werkstatt. Allgemeine Außenfelsen und Wolkensprites werden an diesem Innenort ausgeblendet.

## Mechanik und Geheimhaltung

Neue Architektur und Ausstattung sind statisch und gehören zum bestehenden Szenenbesitzer. Sie hängen weder von der geheimen Zündzeit noch von einem Countdown ab. Es kommen keine Lichtquellen, zyklischen Warnleuchten, beschleunigten Zündschnüre oder neuen regelmäßigen Klanghinweise hinzu. Die vorhandene Bombe behält ihre charakteristischen Augen und ihre feste dekorative Zündschnur.

Die existierenden serverbestätigten Mechaniken bleiben verbindlich: ein gültiges Wort löst den festen 500-ms-Flug aus, schnelle Übergaben erhalten ihren jeweiligen Flugursprung, fremde Prüferstimmen bleiben versiegelt, Explosion und Ausscheiden folgen dem gemeinsamen bestätigten Zeitstempel. Der Rauch ist zeitlich begrenzt; Wiederbeitritt stellt den bereits erreichten Zustand her. Reduzierte Bewegung setzt die bestätigte Bombe direkt auf ihre Ablage und lässt ausgeschiedene Figuren ohne Rauchwiederholung auf der Bank ankommen.

Die sichtbaren Gruppentafeln und das persönliche Wortpult behalten ihre bisherigen Handlungen und Kameras. Es gibt keine zusätzlichen Laufwege, Eingabesperren oder Wartezeiten. Das bestehende private Wortfeld und die Crewprüfung bleiben auch bei kürzer verfügbarer Touchhöhe erreichbar.

## Modell und Ressourcen

„Wrench“ von Armory_3D: https://poly.pizza/m/TvT0yqLRln. Die konkrete Seite weist Public Domain (CC0) aus; am 18.10.2026 geprüft. Lizenz: https://creativecommons.org/publicdomain/zero/1.0/. Tatsächlicher Download: https://static.poly.pizza/f117ea86-ca0d-4b7a-8e32-213a1238e406.glb.

Das Modell enthält 464 Dreiecke, eine opake Materialgruppe und keine Texturdateien. Die vorbereitete Fassung fügt eine Wurzelrotation hinzu, damit die lange Werkzeugachse senkrecht und die breite Seite zur Wandansicht steht. Originalgeometrie, Normalen, UVs und Binärdaten bleiben erhalten. Die Materialpalette wird zu mattem Stahl vereinheitlicht; die sechs Instanzen werden passend skaliert und leicht geneigt. Vorbereitet 28.812 Byte.

Original, Quellenbeleg und Lizenztext liegen unter `assets/source-models/workshop/`. `scripts/prepare-workshop-wrench.mjs` prüft Quelle, Lizenz und selbstständige Modellstruktur und erzeugt öffentliches Modell, Lizenzdatei sowie Manifest mit beiden SHA-256-Werten. Der Werkstatt-Vorladeplan enthält acht unterschiedliche GLBs mit zusammen 217.820 Byte.

Unbewegliche Grundkörper und importierte Requisiten liegen nun zusammen im statisch zusammengefassten Kulissenbaum. Die Bombe, ihr Pick-Körper, Rauch, Crewleuchten und wechselnde Texte behalten ihre eigenen Zustände. Fenster und Oberflächen benötigen keine zusätzlichen Transparenz- oder Nachbearbeitungspässe.

## Erneute Prüfung

Neun gezielte Node-Prüfungen, TypeScript und Produktionsbau bestehen. Die vorhandene Sichtprüfung für sämtliche Gruppengrößen von 2 bis 12 umfasst jetzt zusätzlich Werkstattarchitektur, persönliche Metallablagen und Banklehne. Die Gesichter bleiben in den geprüften Gruppenperspektiven frei. Die vorhandenen Prüfungen für persönliche Kameras, alle seitlichen Bombenplätze, geheime Restzeit, gemeinsame Übergaben, Wiederbeitritt und einmalige Materialfreigabe bleiben bestehen.

Die gebaute Erstbildprüfung bestätigt 12 vorbereitete/12 zuerst sichtbare Shaderprogramme bei hoher Qualität und 1440 Pixel Breite sowie 10/10 bei niedriger Qualität und 390 Pixel Breite (`inventors-shaders.json`). Die Vorladeprüfung bestätigt acht vorbereitete Dateien, null fehlgeschlagene Modelle und keine erneuten Modellanfragen bei der geprüften Ruheumschaltung (`inventors-preload.json`).

Die sechs regulären nativen Abläufe mit 2/8/12 Teilnehmern auf 1440/390 Pixel Breite bestehen (`inventors-first.json`, `inventors-low.json`). Jeweils zwei Browsersitzungen bedienen echte Wörter und Crewurteile. Die Prüfung bestätigt eine abgelehnte Antwort mit anschließendem erneuten Versuch, versiegelte fremde Stimmen, denselben tatsächlichen Flug-/Rauchzustand nach Neuladen, das Ausscheiden auf die Bank und den vollständigen Folgerundenreset. Auf schmalen Fenstern bleiben Eingabe, Auswahlbereich und Canvas bei reduzierter verfügbarer Höhe erhalten. Die Gruppe benötigt bei 2/8/12 Spielern 45/63/75 Draw Calls, bei zwölf Figuren 14.170 Dreiecke, 35 Texturen und 45 Geometrien in niedriger Qualität. Die schmalen persönlichen Ausschnitte benötigen in diesen Fällen 40/43/50 Draw Calls.

Die beiden zusätzlichen Zwölferabläufe in hoher Qualität bestehen ebenfalls (`inventors-high.json`). Die Gruppe benötigt 105 Draw Calls und 25.684 Dreiecke; die schmale persönliche Ansicht 80 Draw Calls. Die zwei äußeren rechten Stationsfälle prüfen nach neun tatsächlichen Übergaben die eigene Kamera, ein 390×600-Pixel-Fenster, die Abgabe mit Enter, den erhaltenen Canvas und die Rückkehr zur gemeinsamen Ansicht in beiden Grafikprofilen (`inventors-stations.json`). Zusammen mit den regulären Abläufen sind dies zehn native Fälle. Die gezielt verkürzten Desktop-Touchfenster ersetzen keine echte Bildschirmtastatur.

Die tatsächlichen Zweier- und Zwölfergruppen wurden visuell kontrolliert (`bomb-low-2-1440-group.png`, `bomb-low-12-1440-group.png`, `bomb-high-12-1440-group.png`). Die Werkzeugtafeln sind sichtbar; Werkbänke und Maschinen stehen hinter der Spielrunde und die Buchstabenfolge bleibt frei. Die hohe rechte Stationsansicht wurde bei verkürztem Fenster ebenfalls angesehen (`bomb-station-right-high-390-600.png`): Figur, Bombenablage, Buchstabenfolge und Eingabe sind gleichzeitig erkennbar.

Die Lebensdauerprüfung wechselt 18-mal zwischen Bombenwort, Codeknacker, Farbgedächtnis und Pixelblitz. Sie bestätigt zwölf geladene Figuren, einen aktiven Canvas und keine WebGL-Fehler. In den fünf Werkstattaufenthalten bleiben 75 Draw Calls, 14.170 Dreiecke, 35 Texturen und 45 Geometrien unverändert (`inventors-lifecycle.json`). Dieser Ablauf misst die anfängliche Wortphase, nicht jede Explosions-/Prüferphase und nicht den vollständigen Prozessspeicher.

Die zwei instrumentierten nativen Web-Audio-Fälle auf 1440/390 Pixeln bestehen: erste Geste, tatsächliche Spielaktion und räumliche Quellen, Kamera als Hörer, genau ein AudioContext, Schutz vor alten Ereignissen und Freigabe der Stimmen/Umgebungsquellen beim Verbergen (`inventors-audio.json`). Eine Hörprüfung auf echten Ausgabegeräten ist dadurch nicht ersetzt.

## Tatsächlicher Flug und Explosion während der Hardwaremessung

Nach Ende aller anderen Browserjobs prüft `scripts/check-bomb-hardware.mjs` zwei warme D3D11-Läufe auf der tatsächlichen NVIDIA RTX 4080 SUPER bei 1920/390 Pixel Fensterbreite, zwölf geladenen Figuren und hoher Grafik. Der betrachtende Teilnehmer bleibt während beider Aktionen in der Gruppenansicht. Die echte Engine bestätigt „Haus“, wechselt den Bombenbesitzer und löst danach tatsächlich die Explosion aus. Diese externen Spieleraktionen werden an der nächsten beobachteten HTTP-Snapshot-Grenze ausgeführt, sodass die erste Auslieferung des festen 500-ms-Flugs nicht bereits durch einen reinen Fixture-Pollabstand verpasst wird. Die bestätigten Engine-Zeitstempel bleiben unverändert; dies ist keine Live-Netzwerkmessung.

Die 4,5-sekündige rAF-Messung erfasst ausdrücklich einen erhöhten Bombenflug, sichtbaren Rauch und das Ausscheiden auf die Bank. Beide Fälle prüfen diese drei tatsächlich gerenderten Zustände und den abschließenden ausgeschiedenen Teilnehmer. Die Abfrage der DOM-Zähler pro Frame verursacht selbst einen kleinen Diagnoseaufwand. Bericht: `inventors-active-hardware.json`.

| Fensterbreite | Renderpuffer am Ende | rAF-Abstände | p95 / p99 / Maximum | Höchste beobachtete Draw Calls / Dreiecke |
| --- | --- | --- | --- | --- |
| 1920 Pixel | 1040 × 797 | 270 | 16,8 / 16,8 / 33,3 ms | 105 / 27.228 |
| 390 Pixel | 364 × 330 | 271 | 16,8 / 16,8 / 16,8 ms | 105 / 27.228 |

Kein rAF-Abstand überschreitet die im Helfer verwendete 33,5-ms-Grenze oder 50 ms. Der breite Lauf enthält dennoch ausdrücklich einen 33,3-ms-Abstand. Im Endzustand nach dem Rauch liegen beide Fälle bei 95 Draw Calls, 23.708 Dreiecken, 37 Texturen und 45 Geometrien. Die App-Bildzeit-p95 beträgt jeweils 16,7 ms, die CPU-Renderzeit-p95 0,8/0,9 ms. Kurze warme Desktop-Läufe belegen weder Smartphone-Leistung noch Kaltstart, vollständige GPU-Zeit, Eingabelatenz, Prozessspeichergrenzen oder sämtliche stärkeren Aktionskombinationen.

Weitere Figuren-, Ergebnis-, Raum- und Klanggestaltung sowie native Bildschirmtastaturen, echte Mobilgeräte, Hörprüfung, lange Live-Gruppenpartien und die komplette Mehrbrowser-Olympiade bleiben offen. Kontrollierte Engine-HTTP-Fälle ersetzen keine Prüfung des bekannten workerd-Verbindungsabschlusses. Diese Ausarbeitung ist ein Fortschritt innerhalb des unveränderten Ziels für alle 21 Disziplinen. Keine Veröffentlichung dieser Zwischenfassung.
