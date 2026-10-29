# Finale: die vollständige Crew und gemeinsame Podestplätze

Die Siegerehrung verwendet dieselben ursprünglichen Figuren wie die Spielorte und Bossarenen. Gesichter, Formen, Farben und Accessoires werden aus `Avatar` über den vorhandenen `createMapCharacter`-Lader übernommen. Die vorherige vereinfachte Neuerfindung der Figuren als Kugel-/Polyederkörper entfällt.

Alle 2–12 Teilnehmer bleiben im Finale. Die serverseitigen Plätze bestimmen die Aufstellung: Jeder tatsächlich belegte Platz 1–3 erhält eine gemeinsame Plattform; gleiche Plätze besitzen dieselbe Höhe. Weitere Teilnehmer feiern davor. Zwölf gemeinsame Champions stehen auf einem verbreiterten gemeinsamen Goldpodest. Ein Gleichstand auf Platz eins mit anschließendem Platz drei erzeugt kein erfundenes Silberpodest.

Die vollständige serverseitige Rangliste und Punktevergabe bleiben unverändert. Die Teilnehmerauswahl zeigt alle Namen und den ausgewählten Platz samt Punkten. In der Szene betont sie genau den zugehörigen Standring. Anfangs ist der eigene Teilnehmer gewählt; Zuschauer erhalten eine gültige Auswahl aus der teilnehmenden Crew. Diese Auswahl, Replay und Grafikwechsel senden keine Spielaktionen.

## Bild, Kamera und Lesbarkeit

`ceremonyLayout` beschreibt Plätze, Podeste und Bildgrenzen. Mehrreihige Gruppen stehen versetzt. Die Kamera passt ihre tatsächlichen Grenzen zwischen Überschrift und Ergebnisbedienung ein. Ein Strahlentest prüft die Gesichtspositionen aller Figuren gegen die übrigen Sprites. Die neue Anordnung vermeidet die vorherige Beschränkung auf drei Figuren und überschneidende Positionen bei großen Gleichständen.

Bei der visuellen Prüfung war die ursprüngliche Nebeldichte aus der weiter entfernten Gruppenkamera zu stark. Sie verdunkelte sogar die Figuren. Der Nebel ist entfernt, die Materialien folgen den raueren, weniger metallischen Oberflächen der übrigen Spielwelt und die Figuren sind etwas größer. Das Ergebnis wurde in breiten und schmalen Renderbildern geprüft, einschließlich des Zwölfer-Goldpodests.

Große Gewinnergruppen werden in der Überschrift zusammengefasst. Die Ergebniskarten fassen gleiche Plätze zusammen; die vollständigen Namen bleiben über die Auswahl und die vorhandene Rangliste zugänglich. So verdeckt keine lange Namenswand die Figuren. Auswahl, Grafik und Replay besitzen ausreichend große Bedienelemente und sichtbare Tastaturfokusmarkierungen.

## Laufzeit und Ton

Grafikstufen verwenden die vorhandenen Profile und den gespeicherten Grafikmodus. Hohe Qualität zielt auf 60 FPS, niedrigere Stufen verwenden die vorgesehenen Grenzen. Grafik-, Effekt- und Bewegungsänderungen verwenden dieselbe Szene und denselben Renderer. Größenänderungen weisen den Zeichenpuffer nur bei tatsächlicher Änderung neu zu. Außerhalb des sichtbaren Bereichs und bei verborgenem Dokument pausiert die Zeichenroutine.

Alle Figurentexturen werden vor der Freigabe geladen. Die Shader-Vorbereitung umfasst auch die späteren Konfetti- und Feuerwerksvarianten. Beim Abbau werden Figuren, Texturen, Geometrien, Batches, Beobachter und Grafikkontext freigegeben. Ein Kontextverlust führt zur lesbaren Darstellung der gesamten Crew ohne WebGL.

Die Feier bleibt eine persönliche, wiederholbare Präsentation der verbindlichen Endwertung. Überspringen spielt eine einzelne Siegerfanfare und konsumiert die früheren Platzsignale. Reduzierte Bewegung zeigt sofort den Schlusszustand. Ihre anschließende Deaktivierung startet weder die Ehrungen noch deren Klänge erneut. Nur ein ausdrückliches Replay beginnt von vorn.

Die Reihenfolge berücksichtigt nur die tatsächlich belegten Podestplätze. Bei drei Plätzen bleiben die ursprünglichen Zeitpunkte erhalten. Bei zwei Plätzen beginnt die erste Ehrung nach zwei und die zweite nach 4,4 Sekunden. Gibt es nur gemeinsame Champions, beginnt ihr Auftritt nach zwei Sekunden; leere Wartephasen für fehlende Bronze- oder Silberplätze entfallen. Pokal und Effekte folgen dem jeweiligen Siegerauftritt.

## Nachweise

- `outputs/qa/ceremony-crew-final-unit.log`: sechs Tests. Geprüft sind Reihenfolge der Ehrungen ohne leere Zeitfenster, ursprüngliche Figuren, alle Gruppengrößen 2–12, gemeinsame Podesthöhen, vollständige Teilnehmerzuordnung, sämtliche Kameragrenzen und unverdeckte Gesichtspositionen auch bei zwölf Figuren.
- `ceremony-crew-native.json`: acht Chromium-Abläufe bei 1440/390 Pixeln. Zweier- und Zwölfergruppen, unterschiedliche Plätze, zwölf gemeinsame Gewinner, Zuschauer, initial fehlendes WebGL und Kontextverlust nach erfolgreichem Rendern. Alle Namen, Ränge und ursprünglichen Figuren bleiben erreichbar. Auswahl, Grafikwechsel, reduzierte Bewegung und Replay erhalten das Canvas und stabile Rendererzähler. In den bewegten schmalen Fällen werden echte Touch-Ereignisse verwendet.
- Vier zusätzliche Rückkehrer aus der Pause prüfen die Freigabe des jeweils tatsächlich verlassenen Finale-Kontexts, einen aktiven Finale-Renderer und konstante Ressourcen. Die Pausenkarte besitzt einen eigenen Kontext und wird dabei nicht mit dem Finale verwechselt.
- `ceremony-crew-split.json`: weiterer Zwölfspielerfall mit zwei ersten Plätzen, anschließendem dritten Platz und ohne Silberpodest.
- `ceremony-crew-early.json`: der normale Zwölfer-Championauftritt ist bereits nach 2,2 Sekunden sichtbar und gekrönt. Nach ausdrücklichem Replay bestehen auch Auswahl, Grafikwechsel, vier Rückkehrer und Kontextverlust mit der verkürzten Einleitung.
- `ceremony-crew-existing.log`: die vier bestehenden Abläufe für Kamerafahrten, Feuerwerk, Replay, gemeinsame Gewinner, reduzierte Bewegung und Fallback bestehen erneut, mit den korrigierten Erwartungen an gemeinsame Plattformen.
- `ceremony-crew-audio.json`: zwei instrumentierte Web-Audio-Abläufe. Kein Audiostart durch Laden der Seite, genau eine Fanfare beim Überspringen, keine nachgeholten früheren Ehrungen, stumme Wiederherstellung aus ruhiger Darstellung, ausdrückliches Replay und ein wiederverwendeter AudioContext.
- Produktionsbuild einschließlich der angepassten Reihenfolge (`ceremony-crew-schedule-build.log`), TypeScript (`ceremony-crew-final-types.log`) und Whitespaceprüfung bestehen.

Die Prüfungen verwenden echte Browserereignisse und serverseitig berechnete Ranglisten aus kontrollierten HTTP-Spielansichten mit geschlossenen WebSockets. Sie ersetzen keine vollständige Live-Olympiade. Eine frühere Prüfung verwechselte den aktiven Kontext der Pausenkarte mit dem bereits verlassenen Finale; die Prüfung erfasst nun den richtigen Kontext. Außerdem endete die lokale Vorschau zwischen zwei Browserläufen mit „Network connection lost“ und bestätigtem Prozessende. Nach Neustart bestehen die abschließenden Abläufe. Der Runtime-/Netzwerkpfad ist dadurch nicht als behoben abgenommen.

## Warme Desktop-GPU-Stichproben

`outputs/qa/ceremony-crew-final-hardware.json` verwendet tatsächlich die RTX 4080 SUPER über D3D11, hohe Grafikqualität, das normale Seitenlayout, zwölf geladene Figuren und aktives Feuerwerk einschließlich Konfetti. Nach dem Aufwärmen werden jeweils vier Sekunden gemessen. Die Stichproben enthalten auch die an belegte Plätze angepasste Ehrungsfolge. Audio ist dabei stumm; der Klang besitzt einen eigenen Funktionsnachweis.

| Platzverteilung / Viewport | Zeichenpuffer | Zeichenaufrufe / Dreiecke | App-Bildzeit P95 / Render-CPU P95 |
|---|---|---|---|
| Unterschiedlich / 1920 | 1571 × 798 | 70 / 58.504 | 16,8 / 0,6 ms |
| Unterschiedlich / 390 | 323 × 698 | 70 / 58.504 | 16,8 / 0,5 ms |
| Zwölf Champions / 1920 | 1571 × 798 | 55 / 56.188 | 16,7 / 0,6 ms |
| Zwölf Champions / 390 | 323 × 698 | 55 / 56.188 | 16,8 / 0,6 ms |

Alle vier Stichproben verwenden 13 Texturen, 31 Geometrien und sieben vorbereitete Programme. Der erste sichtbare Frame und die laufenden Effekte verwenden denselben Programmumfang. Jede Probe enthält 241 rAF-Intervalle, höchstens 16,8 ms Abstand und kein Intervall über 33,5 oder 50 ms. Der schmale Viewport läuft ebenfalls auf der Desktop-GPU. Kalte Ladezeiten, physische Mobilgeräte, volle GPU-Bildzeit, Prozessspeicher über lange Sitzungen und hörbare Klangqualität bleiben ungeprüft.

## Verbleibender Gesamtauftrag

Weitere Raum-/Figuren-/Gruppen- und Revanchegestaltung, individuelle Spielmomente, Hörprüfung, reale Referenzgeräte, Kaltstart-/Latenz-/Langzeitmessungen und eine komplette Live-Mehrbrowser-Olympiade bleiben erforderlich. Das Ziel umfasst unverändert alle 21 individuell ausgearbeiteten Disziplinen, die Reise, soziale Funktionen, Sound, Performance und zuverlässigen Multiplayer. Diese lokale Arbeitsfassung ist nicht veröffentlicht und keine Gesamtabnahme.
