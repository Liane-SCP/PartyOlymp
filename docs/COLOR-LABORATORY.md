# Farbgedächtnis: persönliches Mischpult und neutraler Gruppenvergleich

Der nachfolgende Bericht beschreibt die ursprüngliche Laborumgebung und die jeweils ausdrücklich genannten historischen Prüffassungen. Der spätere Raumausbau mit hohen Fenstern, ausgestatteten Vorbereitungsbänken und tatsächlich importierten Erlenmeyerkolben samt erneuter Prüfung steht in [PIGMENT-MANUFACTORY.md](PIGMENT-MANUFACTORY.md).

Das Farbenlabor besitzt vier auf die Handlung abgestimmte Ansichten. Die Merkphase zeigt die tatsächliche Zielprobe groß. „Mischpult ansehen“ führt anschließend zu einer steileren Nahansicht des räumlichen RGB-Geräts mit breiteren Schienen und beschrifteten Reglern. „Farbprobe ansehen“ zeigt die unverzerrte eigene Vergleichsfläche. „Labor ansehen“ öffnet die gesamte Crew mit persönlichen Arbeitsplätzen, öffentlichen Versiegelungsständen, Regalen, Rohrmodellen und Mischtechnik.

## Eigene Entscheidungen direkt am Gerät

Die drei Weltregler und die große Versiegelungstaste bedienen dieselbe private Mischung wie das native Pult. Maus und Touch können direkt an den Schienen ansetzen. Das Pult ergänzt präzise Tastaturregler mit Kanalnamen und Zahlenwerten. Eine dargestellte Probe im Pult bleibt auch während des Ladens der 3D-Szene und ohne WebGL verfügbar. Die bestehenden vier Sekunden Merkzeit werden nicht verändert.

Eigene Änderungen steuern die Vergleichsfläche, drei dekorative Pigmentstände und das Mischgefäß. Der Rührer reagiert kurz auf eine Änderung; reduzierte Bewegung unterdrückt diese Drehung. Das dekorativ beleuchtete Gefäß ersetzt nicht die neutrale Vergleichsfläche.

Ein unbestätigter Entwurf wird nur lokal unter Raum, Spielbeginn, Spielindex, Runde und Teilnehmer gespeichert. Wiederbeitritt stellt ihn wieder her. Nach bestätigter Abgabe gilt die tatsächliche Serverantwort; die Regler und die räumliche Bestätigung sind gesperrt. Die bestehende Fristabgabe erhält einen geänderten Entwurf. Fremde Mischungen und Ergebniswerte erscheinen erst in der erlaubten Auflösung. Die Szenenprojektion ignoriert alte Auflösungen und private Serverdaten während der Eingabephase.

## Gleiche Bedingungen für die Farben

Ziel und gewählte Mischung besitzen identische Geometrien und graue, unbeleuchtete Umgebungen. Die Farbflächen verwenden `MeshBasicMaterial`, deaktivierte Tonwertanpassung und explizite sRGB-Eingaben. Die HTML-Vignette ist für das Labor entfernt. Allgemeines Kamerawackeln, allgemeiner Auflösungsklang und allgemeines Konfetti sind für diese Disziplin durch die passende Geräteinszenierung ersetzt.

In der Probenansicht verschwinden abgeschnittene Nachbarproben und dekorative Technik. In der Ergebnisansicht werden auf breiten Fenstern beide Proben nebeneinander, auf schmalen Fenstern untereinander angeordnet. Die vorhandenen Flächen, Materialien und Texturen werden dafür wiederverwendet.

## Gemeinsame Auflösung

Ein kurzer Verschluss öffnet die Zielprobe anhand der bestätigten Auflösungszeit. Später beitretende Ansichten holen den bereits erreichten Zustand nach; reduzierte Bewegung öffnet unmittelbar. Die Ausgabe zeigt den tatsächlichen Farbabstand und die tatsächlichen Rundengutschriften. Jede Crew-Mischung ist über Vor-/Zurückauswahl erreichbar. Der gewählte Teilnehmer bleibt bei einem Breitenwechsel erhalten. Für eine fehlende Abgabe erscheint ausdrücklich „Keine Mischung“ und keine erfundene neutrale Ersatzschätzung.

Die Laborübersicht zeigt die ursprünglichen Figuren an ihren Plätzen und die öffentlichen Punktestände. Gute bestätigte Ergebnisse erhalten passende Figurenreaktionen. „Alle Ergebnisse“ verlässt die große Bühnenansicht, fokussiert die vollständige native Auswertung und bringt sie in den sichtbaren Bereich. Die nächste Merkphase führt wieder zur Bühne. Zuschauer und aufgegebene Teilnehmer erhalten keine aktive Mischbedienung.

## Modelle und Sound

Verwendet werden die bereits lokal vorhandenen Kenney-Modelle `factory/machine`, `factory/pipe-large-valve`, `factory/pipe-large-bend`, `furniture/bookcaseOpen`, `food/bottle-oil`, `furniture/cabinetBedDrawerTable`, `furniture/kitchenFridge` und `furniture/pottedPlant`. Die Dateien wurden mit ihren SHA-256-Werten und CC0-Einträgen im lokalen Assetregister abgeglichen. Es gibt für diese Ausarbeitung keine neuen Downloads oder neuen Lizenzannahmen. Möbel und statische Mechanikteile werden zusammengefasst; bewegte und interaktive Teile bleiben unabhängig.

Das Labor hat ein eigenes leises Raum-/Lüftungsbett. Regler, Schließen der Zielprobe, Versiegelung und Enthüllung besitzen unterschiedliche kurze Klänge. Die Versiegelung erklingt am tatsächlichen Teilnehmerplatz, der Vergleich an der Probenwand. Der gemeinsame Bestätigungshelfer setzt nun einen verbindlichen Ereigniszeitpunkt. Dadurch können veraltete Versiegelungsereignisse zuverlässig stumm bleiben. Musik-, Effekt- und Stummschalteinstellungen werden weiterverwendet.

## Geprüfte Nachweise und Grenzen

- Acht gezielte Node-Prüfungen: erlaubte Zielphasen und veraltete Daten, echte private Abgaben und Ereigniszeiten, alle zwölf ausgewählten Ergebnisse, tatsächliche neutrale Materialien und sRGB-Werte, wiederverwendete Flächen bei Layoutwechseln, gemeinsamer Verschluss und reduzierte Bewegung, Folgerundenreset, Kameragrenzen sowie gültige und ungültige RGB-Werte.
- Alle 22 vorhandenen Engine-Prüfungen bestehen nach der Ergänzung der Bestätigungszeit. Simulierte vollständige Olympiaden ersetzen keine reale Mehrbrowser-Olympiade.
- `color-laboratory-low.json`: sechs native Chromium-Fälle mit 2/8/12 Teilnehmern und 1440/390 Pixel Breite plus zwei Fälle ohne WebGL. Pixelproben aus dem tatsächlichen Renderer, direkter 3D-Regler, Tastaturänderung, erhaltenes Pult bei 400 Pixel verfügbarer Höhe, privater Entwurf nach Neuladen, direkte Weltversiegelung, zweite Browsersitzung, Zuschauer bei zwölf Teilnehmern, alle tatsächlichen Ergebnisse einschließlich fehlender Abgabe, Ergebnisfokus und Folgerunde. Die volle Gruppe benötigt 69/87/99 Zeichenaufrufe für 2/8/12 Teilnehmer; mit zwölf Figuren 7.144 Dreiecke, 42 Texturen und 61 Geometrien. Dieser Bericht liegt vor der abschließenden steileren Mischpultkamera und dem Entfernen des allgemeinen Konfettis.
- `color-laboratory-high.json`: zwei hohe Grafikfälle mit zwölf Teilnehmern, dem letzten Außenplatz als lokalem Spieler und reduzierter Bewegung, dazu zwei WebGL-Ersatzfälle. Die steilere Mischpultkamera und breiteren Schienen sind enthalten. Beide Gruppenansichten benötigen 136 Zeichenaufrufe und 13.430 Dreiecke. Der Bericht liegt vor der abschließenden Rückführung zur Folgerunde.
- `spatial-scenes-color.json`: zwei native Web-Audio-Fälle mit zwölf Teilnehmern, erster Reglergeste, wirklicher Versiegelung, gemeinsamem Vergleich, Kamera als Hörer, einem AudioContext, stummen alten Ereignissen innerhalb derselben Disziplin und nach erneutem Eintritt sowie Freigabe von Stimmen und Umgebungsquellen beim Verbergen.
- `color-laboratory-lifecycle.json`: 18 Wechsel zwischen Labor, Pixelblitz und Kaufhaus mit zwölf geladenen Figuren. Sechs Laborvergleiche einschließlich Auswahl- und Breitenwechseln behalten jeweils 16 Zeichenaufrufe, 72 Dreiecke, vier Texturen und sieben Geometrien im tatsächlich sichtbaren neutralen Vergleich. Pixelblitz bleibt bei 36/3.326/8/24, das Kaufhaus bei 86/4.226/32/43. Ein aktiver Canvas und keine erfassten WebGL-Fehler. Diese Zähler beweisen keine vollständige Prozessspeichergrenze; der gemeinsame Laborraum ist gesondert im nativen Gruppenablauf erfasst.

`color-laboratory-final.json` ergänzt zwei Sparfälle und zwei WebGL-Ersatzfälle nach der Rückführung zur Folgerunde. Die anschließende Bildkontrolle deckte auf, dass die untere mobile Beschriftung unter dem tatsächlichen Laborboden lag. Beide gestapelten Flächen stehen nun höher; die Kamera passt den gesamten Vergleich ein. Die Node-Prüfung kontrolliert zusätzlich die tatsächlichen Beschriftungsflächen relativ zur tatsächlichen Bodenhöhe. Angeschnittene Proben im Hintergrund der Mischpult-Nahansicht werden ausgeblendet.

`color-laboratory-stack-final.json` prüft diese abschließende Anordnung auf Desktop und Touch mit zwei Teilnehmern sowie zwei WebGL-Ersatzfällen erneut: wirkliche Farbwerte im Renderer, räumlicher Regler und Versiegelung, gespeicherter Entwurf, alle Ergebnisse, Ergebnisfokus und Folgerunde. Das korrigierte mobile Vergleichsbild wurde angesehen; die untere Beschriftung ist jetzt vollständig sichtbar. Die vorherigen Berichte bleiben erhalten. Die tatsächlichen Merk-, Gruppen-, Mischpult- und Vergleichsbilder wurden angesehen und erkennbare störende Ausschnitte korrigiert.

`spatial-scenes-color-final.json` wiederholt beide Audiofälle nach der letzten räumlichen Korrektur erfolgreich. Die Enthüllungsquelle entspricht jetzt der tatsächlichen Zielprobe: breit `[-4, 5.1, -6.56]`, im gestapelten mobilen Vergleich `[0, 10.1, -6.56]`. Die für die nächste Auflösung bekannte Anordnung ist bereits vor deren Ereignis verfügbar; der erste Klang hängt damit nicht von der Reihenfolge zwischen Snapshot-Empfang und nächstem Renderbild ab. Der frühere Audio-Bericht bleibt erhalten.

## Warme Hardwareproben und offene Bildzeitspitze

Nach Ende der anderen Browserjobs wurden vier kurze warme Fälle mit zwölf Figuren, hoher Grafik und tatsächlichem D3D11-Rendering auf der lokalen NVIDIA RTX 4080 SUPER gemessen. Jeder Lauf enthält ein viersekündiges Messfenster nach einer Aufwärmphase. Die schmale Ansicht verwendet weiterhin dieselbe Desktop-GPU.

| Abschließender Rohbericht | Zustand | Renderpuffer | Zeichenaufrufe / Dreiecke | rAF-Abstände | p95 / p99 / Maximum |
| --- | --- | --- | --- | --- | --- |
| `hardware-color-machine-final.json` | Mischpult mit privater Eingabe | 1520 × 846 | 111 / 12.892 | 241 | 16,7 / 16,8 / 16,8 ms |
| `hardware-color-group-final.json` | Gesamte Laborgruppe | 1520 × 846 | 136 / 13.430 | 241 | 16,8 / 16,8 / 16,8 ms |
| `hardware-color-reveal-final.json`, breit | Tatsächliche zwölf Abgaben und Auflösung innerhalb der Messung | 1918 × 846 | 20 / 120 | 237 | 16,8 / 33,3 / 50,0 ms |
| `hardware-color-reveal-final.json`, schmal | Derselbe Übergang mit höher gesetztem mobilem Vergleich | 388 × 544 | 16 / 112 | 240 | 16,7 / 16,8 / 33,4 ms |

Der Renderpuffer wächst bei der Auflösung, weil das Eingabepult verschwindet; die Zähler stammen aus dem gemessenen Endzustand. Die breite Auflösung enthält einen rAF-Abstand über 33,5 ms. Die Trace-API meldet außerdem einen 59,8 ms langen Animationsframe mit 49,5 ms Scriptdauer im Aufrufkontext `Response.json.then`. Das ist trotz der strikten Zahl von null rAF-Abständen über 50 ms eine offene Spitze. Die Aufrufzuordnung beweist noch keine vollständige Ursache.

Die vorherigen Rohberichte `hardware-color-machine.json`, `hardware-color-group.json` und `hardware-color-reveal.json` bleiben erhalten. Vor der letzten Ausschnitt-/Beschriftungskorrektur benötigte das Mischpult 120 Zeichenaufrufe, die Gruppe ebenfalls 136. Die erste breite Auflösung erreichte maximal 33,3 ms rAF-Abstand, ihre Trace-Diagnose zeigte jedoch bereits einen 52,3 ms langen Animationsframe mit 49,4 ms Scriptdauer im selben Aufrufkontext. Die spätere Messung ersetzt diesen Befund nicht.

Diese Proben belegen keine Smartphone-Leistung, Kaltstartgrenze, vollständige Eingabelatenz, lange Prozessspeichersitzung oder vollständige Performanceabnahme. Die anschließend an die tatsächliche breite beziehungsweise gestapelte Probenposition angepasste Enthüllungsquelle verändert keine Rendergeometrie; ihre räumliche Prüfung wird separat im Audio-Bericht geführt.

Weitere Architektur-, Arbeitsplatz-, Glas-/Lichttechnik- und Figurenaktionen sowie die abschließende Erlebnisabstimmung bleiben offen. Reale Mobilgeräte, native Bildschirmtastaturen, Hörprüfung auf echten Ausgabegeräten, kaltes Laden, längere Sitzungen, echte Netzunterbrechungen und die vollständige Mehrbrowser-Olympiade sind weiterhin nicht abgenommen. Schmale und kurze Desktop-Browserfenster ersetzen diese Prüfungen nicht. Diese Disziplin und ihre gezielten Nachweise schließen das Gesamtziel für alle 21 Spiele und die Oberwelt nicht ab.


## Nachfolgende Diagnose der Audio-Erstinitialisierung

Die spätere CPU-Diagnose, der Stummschutz und die Vorbereitung an der ersten echten Nutzeraktion stehen mit den neuen Rohberichten in [AUDIO-STARTUP-PERFORMANCE.md](AUDIO-STARTUP-PERFORMANCE.md). Der dort nachgewiesene Anteil der früheren Snapshot-Spitze lag im kalten Audioaufbau. Die alten Berichte bleiben erhalten. Die neuen Nachweise ersetzen weder alle historischen Zustände noch die vollständige Performanceabnahme; eine getrennte breite Spectrum-Layout-/ResizeObserver-Spitze sowie Kaltstart- und Geräteprüfungen bleiben offen.
