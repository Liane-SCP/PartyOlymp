# Kopf-Auktion: vom Sitzplatz über den Mittelgang auf die Bühne

Der Höchstbietende nimmt einen nachvollziehbaren Weg durch den Auktionssaal. Er verlässt seinen eigenen Stuhl seitlich, benutzt den Durchgang hinter der Sitzreihe, geht durch den Mittelgang und steigt auf die Bühne. Die vorherige direkte Interpolation zwischen Sitz und Bühne entfällt. Die Figur und ihre Accessoires verwenden weiterhin dieselbe Darstellung wie die übrigen Spieler und Bossarenen.

Die Sitzordnung lässt auch bei unvollständigen Reihen den 2,3 Einheiten breiten Mittelgang frei. Die bisherigen mittigen Einzelplätze bei fünf und neun Teilnehmern sowie der mittlere Platz einer Dreierreihe blockieren ihn nicht mehr. Zwei zusammenhängende Sitzblöcke ersetzen die einzelnen Inselpodeste. Die Reihen besitzen passende Bodenhöhen und Zwischenstufen. Die tatsächlich importierten Kenney-Stühle stehen auf diesen Flächen; die niedrigen öffentlichen Platzanzeigen und Paddel bleiben den Teilnehmern zugeordnet.

## Ablauf und gemeinsame Uhr

`lib/auction-entrance.ts` beschreibt Sitzplätze, Bodenhöhen und die einzelnen Wegpunkte. Jede Szene berechnet ihre Routen einmal beim Aufbau. Pro Bild wird nur die aktuelle Position des öffentlichen Höchstbietenden auf dessen Route ermittelt.

Der Auftritt folgt dem bestehenden serverseitigen `performStartedAt`. Separate Zuschaueransichten, Neuladen, später Wiedereintritt und das zwischenzeitliche Öffnen des Bühnenbuchs starten ihn nicht erneut. Auch das Laufwippen folgt derselben Uhr. Die bereits vorhandene gemeinsame Vorhang- und Hammerbewegung bleibt erhalten.

Die Dauer hängt von der Weglänge ab und liegt zwischen 1,6 und 3,8 Sekunden. Bei den konkret geprüften hintersten Plätzen sind es 1.816 ms für drei, 2.373 ms für fünf und 3.559 ms für zwölf Teilnehmer. Die Dauer wird auf ganze Millisekunden aufgerundet, damit auch am exakten Endzeitpunkt mit einer realistischen Epochenuhr zuverlässig die stehende Pose und Bühnenkamera gelten.

Die Saalübersicht zeigt den Weg. Erst nach Ankunft übernimmt die Bühnenkamera. Auf der Platzanzeige steht während des Laufens „ZUR BÜHNE“, danach „AUF DER BÜHNE“. Bei reduzierter Bewegung und bei historischen Zuständen ohne Startzeit befindet sich die Figur unmittelbar am Bühnenplatz. Neue Runden setzen Figur und Kamera zurück.

Die Begriffeingabe ist während des Auftritts bereits möglich. Ihr automatischer Fokus verwendet `preventScroll`, damit die Browseransicht beim Zuschlag nicht vom sichtbaren Saal zur darunterliegenden Eingabe springt. Bewusstes Auswählen des Felds bleibt möglich. Der Weg verändert weder Eingabefrist, Zuschlag, Bewertung noch Punkte. Das Bühnenbuch bleibt erreichbar und verwendet denselben Renderer. Eine bei der Bildkontrolle gefundene Überlagerung zwischen dessen Schaltfläche und dem Einführungstext ist in breiten Ansichten korrigiert.

## Modelle und Ressourcen

Die vorhandenen, heruntergeladenen Stühle, Möbel und das bewegliche Hammermodell werden weiterverwendet. Die Assetdateien und ihre Lizenzangaben bleiben unverändert; Herkunft und Zuschreibung stehen in [AUCTION-HALL-ART.md](AUCTION-HALL-ART.md). Der Umbau betrifft Aufstellung und konstruktive Böden/Stufen. Diese werden mit der übrigen statischen Architektur zusammengefasst. Es entstehen keine zusätzlichen Lichtquellen oder Routentimer und kein laufender Modelldownload beim Auftritt.

## Prüfnachweise

- `auction-entrance-final-unit.log`: zehn Prüfungen. Alle Gruppengrößen von 2–12 und alle Sitzplätze werden berücksichtigt. Die Laufwege werden gegen tatsächliche Boden-/Stufenobjekte und die Abmessungen des mit GLTFLoader geladenen Stuhlmodells geprüft. Weitere Prüfungen betreffen getrennte Szenen, spätes Einsteigen, reduzierte Bewegung, die Epochenuhr, private Bewertungen und den Rundenreset.
- `auction-entrance-small-fixed.json` und `auction-entrance-native.json`: sechs native Abläufe für 3/5/12 Teilnehmer, jeweils 1440/390 Pixel breit und mit dem jeweils letzten Teilnehmer auf der Bühne. Zwei getrennte Browseransichten vergleichen die Positionen. Geprüft sind sichtbare Figuren, Eingabe während des Laufens, Wiedereintritt mitten im Auftritt, Bühnenbuch, unverändertes Canvas, keine Modellnachladung beim Ansichtwechsel, geheime Jurybewertungen, tatsächliche Auswertung und Reset. Die schmale Buchbedienung verwendet echte Touch-Ereignisse.
- `auction-entrance-high.json`: zwei weitere Zwölfspielerabläufe mit hoher Qualität. Die korrigierte Schaltfläche lässt den Einführungstext frei. Ein zusätzlicher Browser prüft die sofortige Ankunft mit reduzierter Bewegung.
- `auction-entrance-focus-theatre.json`: vier abschließende vollständige Zweiansichten-Abläufe mit 2/12 Teilnehmern. Native Gebote, sieben Begriffe, Seitenwechsel, geheime Bewertungen und das tatsächliche negative Ergebnis bestehen erneut. Zusätzlich wird beim Zuschlag geprüft, dass der automatische Eingabefokus die Browseransicht nicht vom Saal wegscrollt. Sparsam bleiben es 53 beziehungsweise 73 Zeichenaufrufe.
- `auction-entrance-lifecycle.json`: 18 Wechsel zwischen Auktion, Würfelwerk, Weltreise und Stadt Land Fluss. Über fünf Auktionsbesuche mit Bühnenbuch bleiben 33 Zeichenaufrufe, 40 Texturen, 45 Geometrien und 4.481 Dreiecke konstant. Jeweils ein aktives Canvas, zwölf geladene Figuren und keine WebGL-Fehler.
- `auction-entrance-shaders.json`: 13 vorbereitete Programme in Hoch und zehn in Sparsam; keine zusätzlichen Programme im ersten sichtbaren Bild.
- `auction-entrance-audio.json`: Bieter- und Hammeranker, zur Kamera passender Hörer, ein AudioContext und Freigabe der Quellen/Umgebungsschleifen bestehen in beiden Breiten.
- Produktionsbuild einschließlich der anschließenden Fokuskorrektur (`auction-entrance-focus-build.log`), TypeScript (`auction-entrance-final-types.log`) und Whitespaceprüfung bestehen. Die genannten Berichte liegen unter `outputs/qa`.

Die Renderbilder der hohen Zwölferübersicht während des Weges sowie der breiten und schmalen Bühnenansicht wurden visuell kontrolliert. Diese Funktionsprüfungen verwenden kontrollierte HTTP-Spielansichten, echte Engine-Befehle und geschlossene WebSockets. Sie sind keine Live-Netzwerkabnahme oder physische Bildschirmtastaturprüfung.

## Warme Hardwarestichprobe während des Weges

`auction-entrance-hardware.json` verwendet die tatsächliche RTX 4080 SUPER über D3D11, zwölf Teilnehmer, hohe Grafikqualität, das normale Seitenlayout und stummes Audio. Nach dem Aufwärmen lösen echte Gebots-/Pass-Befehle den Auftritt von Teilnehmer elf aus. Die viersekündige Probe erfasst pro Breite sieben unterschiedliche bewegte Positionen: vom Stuhl über Reihenweg und Mittelgang bis zur Bühne. Der betrachtende Teilnehmer sitzt im Publikum; eine automatische Texteingabefokussierung verschiebt deshalb nicht den Bildausschnitt. Die anschließende Korrektur der Fokusoption betrifft dieses gemessene Betrachter-Szenario nicht.

| Viewport / Zeichenpuffer | Zeichenaufrufe / Dreiecke während des Weges | App-Bildzeit P95 / Render-CPU P95 | rAF-Intervalle / längster Abstand |
|---|---|---|---|
| 1920 / 1040 × 797 | 99 / 13.584 | 16,7 / 0,8 ms | 241 / 16,8 ms |
| 390 / 364 × 330 | 99 / 13.584 | 16,7 / 0,7 ms | 241 / 16,8 ms |

Beide Stichproben verwenden 41 Texturen und 44 Geometrien. Kein Intervall überschreitet 33,5 oder 50 ms. Die letzte gespeicherte Bewegungsprobe liegt bei rund 97 beziehungsweise 99 Prozent; die anschließende vollständig eingerastete Bühnenkamera wird von den Funktionsprüfungen abgedeckt, nicht von dieser Messung. Der schmale Viewport läuft ebenfalls auf der Desktop-GPU. Kalte Downloads, physische Mobilgeräte, vollständige GPU-Bildzeit, Prozessspeicher über lange Sitzungen, Eingabelatenz und hörbare Klangqualität sind damit nicht abgenommen.

## Verbleibender Auftrag

Die anschließend ausgearbeitete private Juryführung mit Seiten, Entwürfen und räumlicher Buchauswahl steht in [AUCTION-JURY.md](AUCTION-JURY.md). Weitere Gruppen-/Publikums-/Ergebnisinszenierung, Hörprüfung, reale Referenzgeräte, längere echte Mehrbrowserpartien und die vollständige Olympiade bleiben erforderlich. Das Gesamtziel umfasst unverändert alle 21 Disziplinen, die Reise, soziale Funktionen, Sound, Performance und zuverlässigen Multiplayer. Dieser Ausbau ist ein lokaler Zwischenstand und nicht veröffentlicht.
