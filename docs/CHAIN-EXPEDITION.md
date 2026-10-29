# Kategorien-Kette: fortlaufende Expedition

Der nachfolgende Ausbau zu einer Flussschlucht mit tatsächlich geladenem Zelt und beschädigten Steinbögen ist in [EXPEDITION-RIVER-GORGE.md](EXPEDITION-RIVER-GORGE.md) dokumentiert. Die dortigen erneuten Nachweise beziehen sich auf die ausgearbeitete Umgebung.

Die Kategorien-Kette führt jetzt über einen tatsächlich wachsenden Weg zwischen bewaldeten Inseln und Ruinen. Die frühere Grenze von zwölf Brettern ist entfernt. Jeder bestätigte Begriff ergänzt einen nummerierten Wegabschnitt; die Crew geht anschließend gemeinsam weiter. Nach zwölf Begriffen erreicht sie den nächsten Ausblick. Das beendet weder die Runde noch die Disziplin: Ausscheiden, Mehrheiten, Punkte und bestehende Phasenzeiten bleiben maßgeblich.

## Weg und gemeinsame Zeit

`chain-presentation.ts` berechnet ausschließlich aus öffentlichen Spielinformationen den gebauten Weg, den sichtbaren Ausschnitt und die Position jeder Figur. Bestätigte Historieneinträge erhalten einen serverseitigen Zeitstempel. Nach 350 ms Aufbauzeit beginnt die 700 ms lange gemeinsame Bewegung. Diese Darstellung liegt innerhalb der bestehenden Ergebnisphase und verlängert sie nicht.

Die Welt wird um den aktuellen Fortschritt versetzt. Drei Inselgruppen werden zyklisch weiterverwendet. Bretter, Pfosten und Seile verwenden feste Instancing-Kapazitäten von 24/48/48; zwölf wiederverwendete Wortplaketten zeigen die jüngsten passenden Begriffe. Bei 25 bestätigten Wörtern enthält der sichtbare Ausschnitt 19 Bretter. Neue Begriffe erzeugen keine neuen Inseln, Meshes oder Canvastexturen. Die Plaketten passen mit ihren tatsächlichen Weltabmessungen auf das jeweilige Brett.

Die vollständige Historie bleibt für Regeln und Nachschlagen erhalten. Ihre Liste zeigt jeweils zwanzig Einträge mit einer echten Seitenwahl. Eine begrenzte räumliche Ansicht entfernt keine früheren Begriffe aus dem Spiel.

Figuren stehen in zwei versetzten Laufreihen. Ausgangssteg und gebaute Abschnitte tragen ihre tatsächlichen Fußpositionen. Niedrige Geländer lassen die Gesichter frei. Die ursprünglichen Figurenformen, Farben und Accessoires bleiben erhalten. Der aktive Teilnehmer erhält eine direkt anklickbare Markierung. Die Gruppenleiste zeigt die Namen; bei Platzmangel kann sie horizontal gewischt werden.

## Prüferfähre und ältere Räume

Ausgeschiedene Spieler wechseln mit einem kurzen Sprung auf die begleitende Fähre. Ausscheidenszeit und erreichter Schritt werden öffentlich gespeichert; dadurch folgt auch dieser Ablauf der gemeinsamen Uhr. Die Teilnehmer bleiben als Prüfer aktiv. Ein Wiederbeitritt setzt am aktuellen Zeitpunkt fort. Reduzierte Bewegung übernimmt die bestätigten Positionen unmittelbar.

Fehlende Präsentationszeitstempel älterer Räume werden als bereits abgeschlossene Bewegung behandelt. Der neue Fortschrittszähler kann aus der bisherigen gültigen Historie wiederhergestellt werden. Ein Rundenwechsel setzt Weg und Ausscheidensinformationen zurück.

## Eingabe und Prüfung an der Bühne

Ein einziges Expeditionspult liegt direkt an der 3D-Ansicht. Es enthält Eingabe, verbleibende Zeit, Prüfung, Einspruch, versiegelte Stimmabgabe und Ergebnis. Die sichtbare Zeit gehört zu den bereits öffentlichen Phasenfristen. Fremde einzelne Ja-/Nein-Stimmen werden weiterhin nicht übertragen; nur ihre öffentlichen Abgabestände sind sichtbar. Das Pult zeigt die Anzahl geprüfter beziehungsweise versiegelter Abgaben; ein Haken neben dem jeweiligen Crewnamen markiert die abgegebene Prüfung oder Stimme.

Auf schmalen Ansichten öffnet der Eingabefokus eine persönliche Perspektive. Ein eigener Zurückknopf stellt die Gruppenansicht wieder her; der 3D-Marker öffnet erneut die Eingabe. Text und Auswahl bleiben bei Flächenänderungen erhalten. `visualViewport` und ein ResizeObserver passen Bühne und Platz für die Bedienung an. Ein langes Wort vergrößert den Bedienbereich, ohne die Weltfläche zu überdecken. Der Canvas wird dabei nicht ersetzt.

Die Kamera besitzt ein eigenes Gruppen- und Eingabekonzept. Wegschilder und eine kompakte Fortschrittsanzeige ersetzen die großen schwebenden Texttafeln. Die gemeinsame Landschaft bleibt so im Vordergrund.

## Modelle, Klang und Ressourcen

Bäume, Felsen, Tisch und Bücher stammen aus dem vorhandenen Kenney-Modellbestand. Die Fähre verwendet den bereits heruntergeladenen und für das Schiff aufbereiteten Kenney-Rumpf `watercraft/ship-hull` mit 628 Dreiecken. Quellen, CC0-Lizenzen, Ableitung und Hash stehen weiterhin in `public/adventure-models/manifest.json`. Es wurden keine zusätzlichen externen Modelle heruntergeladen. Maßstab und Platzierung werden für die Expedition angepasst.

Ein leises Wind-/Flussbett mit zwei Schichten ersetzt den allgemeinen Raumton. Wortabgabe, Einspruch, Holzaufbau und Ausscheiden besitzen eigene Klänge und räumliche Quellen. Der Aufbauklang beginnt am nächsten zu bauenden Abschnitt; Wort- und Prüfsignal gehören zum aktiven Platz. Der Audiohörer folgt der tatsächlichen Kamera.

Die bisherigen Klangaufrufe beim Einblenden der Bedienkomponente entfallen. Neue öffentliche Ereignisse lösen die Klänge aus. Unbekannte alte Kettenereignisse ab drei Sekunden Alter werden beim Aufholen einer Verbindung ebenfalls nicht nachgespielt. Die Quelle dieser Altersprüfung ist die Zeit des öffentlichen Serverschnappschusses. Ein zunächst unbekanntes, zehn Sekunden altes Ereignis wird in der Audio-Prüfung ausdrücklich injiziert.

Inseln und Fähre werden innerhalb ihrer beweglichen Gruppen materialweise zusammengefasst. Beim Wechsel werden Modelle, zusammengefasste Geometrien, Instancing-Puffer und Schilder freigegeben. Die gesamte Verlaufsliste wächst entsprechend der tatsächlich gespielten Begriffe; die Anzahl räumlicher Ressourcen und sichtbarer DOM-Historienzeilen bleibt begrenzt.

## Nachweise und Grenzen

- `scripts/test-chain-expedition.mjs`: acht bestandene Bereiche für tatsächliche Bestätigung/Einspruch/Gleichstand/Privatheit, Präsentationszustände bis 1.000 gültige Begriffe, gemeinsame tatsächliche Figurenpositionen, reduzierte Bewegung, sichtbare Bodenunterstützung bis 180 Begriffe, Fähre/Altbestand, Kameraausschnitte für 2–12 sowie passend transformierte Wortplaketten sowie tatsächliche serverseitige Zeitstempel aller vier Kettenklänge.
- `scripts/check-chain-expedition.mjs`: zwei Browsersichten, 25 tatsächlich bestätigte Tierbegriffe, Tastaturabgabe, echte Touchaktionen und 3D-Marker, erhaltene Eingabe/Selektion, Seitenwahl, Einspruch und geheime Abstimmung, gemeinsame Bewegung, Wiederbeitritt, Fähre und vollständiger Rundenreset. Die abschließende Fassung umfasst auch 60 Zeichen und Flächenhöhen von 600/400 Pixeln. Berichte: `outputs/qa/chain-expedition-low.json` und `chain-expedition-high.json`.
- `scripts/check-scene-lifecycle.mjs` mit `LIFECYCLE_GAMES=chain,bomb,budget`, `LIFECYCLE_STEPS=18`, `LIFECYCLE_CHAIN_LONG=1`: sechs Besuche je Ort. Jeder Kettenbesuch wartet auf zwölf geladene Figuren und 25 abgeschlossene Schritte. Der erreichte Zustand wird im Bericht mitgespeichert: `outputs/qa/scene-lifecycle-chain-long-18.json`.
- `scripts/check-spatial-scenes.mjs` mit `SPATIAL_GAMES=chain`: Wort-/Aufbauquelle, Kamerahörer, ein AudioContext, erneutes Einblenden mit bereits laufendem Audio, ein unbekanntes altes Ereignis sowie Freigabe der räumlichen Quellen und Umgebungsschleifen. Sechs Schleifen entstehen über die drei aufeinanderfolgenden Szenenbesuche, nicht gleichzeitig.
- `scripts/check-word-locations.mjs` mit `GAMES=chain`: ursprüngliche Abgabe/Bestätigung/Duplikat-Abläufe auf Desktop/Touch. Beide Breiten bestehen auch nach der letzten Bild-/Ereigniskorrektur.

Die abschließenden sechs Sparfälle (2/8/12 Teilnehmer × 1440/390 Pixel), zwei hohen Grafikfälle (12 Teilnehmer × beide Breiten), zwei räumlichen Audiofälle und beide ursprünglichen Wortabläufe bestehen. Die 8er-/12er-Touchfälle wischen die überlaufende Namensleiste tatsächlich und bedienen danach weiterhin Historie, Einspruch und Abstimmung. Die öffentlichen Prüf-/Versiegelungsmarken werden in den größeren Gruppen ebenfalls direkt geprüft.

| Grafik | Spieler | Breite | Zeichenaufrufe | Dreiecke | Texturen | Geometrien |
|---|---:|---:|---:|---:|---:|---:|
| low | 2 | 1440 | 55 | 8152 | 22 | 40 |
| low | 2 | 390 | 51 | 7656 | 22 | 40 |
| low | 8 | 1440 | 67 | 8452 | 28 | 46 |
| low | 8 | 390 | 63 | 7956 | 28 | 46 |
| low | 12 | 1440 | 75 | 8652 | 32 | 50 |
| low | 12 | 390 | 71 | 8156 | 32 | 50 |
| high | 12 | 1440 | 105 | 13997 | 34 | 50 |
| high | 12 | 390 | 101 | 13501 | 34 | 50 |

Die Werte zeigen jeweils den Zustand nach 25 abgeschlossenen Begriffen. Der endgültige Wechseltest bestätigt 18 Szenenbesuche mit je sechs Besuchen in Expedition, Bombenwerkstatt und Kaufhaus: Expedition 83 Zeichenaufrufe/32 Texturen/50 Geometrien/8.875 Dreiecke, Bombenwerkstatt 72/36/44/9.414, Kaufhaus 86/32/43/4.226. Der Tierwortlauf und der Wechseltest verwenden unterschiedliche Begriffe und Ansichten; die Zähler gelten jeweils für ihren konkreten Messzustand mit 25 bestätigten Schritten. Die Ressourcenstände bleiben je Ort über die sechs Besuche identisch. Eine aktive Zeichenfläche, zwölf geladene Figuren und keine WebGL-Fehler werden geprüft.

Der Touch-Test verwendet eine Wischdauer von etwa 250 ms und wartet auf ruhenden Scrollstand. Ein zuvor verwendeter Wisch mit praktisch null Dauer unterdrückte nachfolgende native Klicks auch auf einer leeren HTML-Testseite; dieses Testtreiberproblem wurde isoliert und behoben. Touchbefehle werden weiterhin nativ ausgelöst. Dies ersetzt keine echte Smartphone-Tastaturprüfung.

Die neue D3D11-Hardwareprobe `outputs/qa/hardware-chain-long.json` misst zwölf Figuren auf der RTX 4080 SUPER bei hoher Grafik. Während des viersekündigen Messfensters wird ein 26. Begriff tatsächlich bestätigt; Aufbau und Bewegung laufen während der Erfassung. Ergebnis: 240 rAF-Abstände, p95 16,7 ms, p99 16,8 ms, kein Abstand über 33,5 ms. Der Endzustand enthält 26 Schritte/19 sichtbare Bretter, 113 Zeichenaufrufe, 14.220 Dreiecke, 34 Texturen und 50 Geometrien. Der tatsächliche Renderpuffer ist 1918 × 945 Pixel; das Fenster ist 1920 × 1080. App-Bildzeit-p95: 16,7 ms; CPU-Renderaufruf-p95: 1,1 ms. Letzterer ist keine GPU-Zeit.

Renderbilder von Ausgangslager, langem Weg und Fähre auf Desktop und Touch sowie die Hardwareaufnahme wurden visuell kontrolliert. Das Bootsschild wurde nach einer sichtbaren Verdeckung tiefer gesetzt. Die Hardwareaufnahme vergrößert die Bühne gezielt per Teststil und ist kein Nachweis für das normale Seitenlayout. TypeScript, acht Node-Prüfungen und Produktionsbuild bestehen. Die vorhandene Warnung zu großen Clientchunks bleibt offen.

Diese gezielten Prüfungen ersetzen keine vollständige Disziplin- oder Gesamtabnahme. Offene Punkte sind insbesondere längere reale Gruppenpartien, native Smartphone-Tastaturen, Referenzgeräte, Hörabnahme, Netzwerkunterbrechungen mit echter Laufzeit, vollständige Olympiade und weitere Orts-/Ergebnisgestaltung. Die vollständige Überarbeitung aller 21 Spiele bleibt das Ziel. Dieser Arbeitsstand ist nicht veröffentlicht.
