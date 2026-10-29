# Pixelblitz: Bildwand, persönliche Buzzer und gemeinsame Enthüllung

Der folgende Bericht beschreibt die ursprüngliche Spielmechanik und deren damalige Ausstattung. Der spätere Ausbau mit echten Kameras, Scheinwerfern und Traversenkulisse sowie die erneute Prüfung der Bildvorbereitung stehen in [PICTURE-STUDIO-SET.md](PICTURE-STUDIO-SET.md).

Pixelblitz besitzt eine auf das Bilderraten abgestimmte Studioansicht: große Bildwand, zwei erhöhte Teilnehmerbänke, persönliche Pulte, nummerierte Namensschilder und getrennte Bild-, Platz- und Studiokameras. Die bestehenden Figuren behalten ihre Identität. Der eigene Buzzer ist direkt in der Welt anklickbar; das native Bedienpult bleibt zusätzlich per Tastatur und Touch erreichbar. Auf breiten, ausreichend hohen Fenstern steht die Eingabe neben der Bildwand, auf schmalen Fenstern darunter.

## Bild und verbindlicher Spielverlauf

Die tatsächlichen lokalen Rätselfotos erscheinen auf der Studiobildwand. Puzzle-Canvas, vollständige Enthüllung und 3D-Fläche teilen das Seitenverhältnis 20:13. Hochformatige und quadratische Motive werden mit neutralem Rand eingepasst. Die Bildmaterialien umgehen die künstlerische Tonwertanpassung. Die vorherige unterschiedliche Puzzle-/Flächenproportion ist korrigiert.

Beim ersten bestätigten Buzzer hält die gemeinsame Bildentwicklung an. Nur dessen Besitzer erhält ein Antwortfeld und die verbleibende Frist; die Anzeige überschreitet auch bei leicht zurückliegender Clientzeit keine acht Sekunden. Falsche Antwort und Fristablauf setzen den Teilnehmer für dieses Bild aus. Andere Teilnehmer können anschließend buzzern. Fremde Antworten und die Lösung gelangen vor der Auflösung nicht in den öffentlichen Szenenrahmen.

Die Bildquelle gehört zur gemeinsamen Bühne und wird auch für Zuschauer und aufgegebene Teilnehmer weiter aktualisiert. Sie hängt nicht mehr vom Vorhandensein eigener Spielsteuerung ab. Bei einem neuen Bild werden alte Bildschirmtexturen unmittelbar entfernt, während die neue Datei lädt. Nur eine vollständig geladene Puzzlequelle mit passendem Bildpfad wird erneut hochgeladen. Ein verspäteter alter Bild-Callback darf die Folgerunde nicht überschreiben.

## Figuren, Auflösung und Bedienung

Der aktive Buzzer senkt sich sichtbar. Pultlicht, öffentliche Namensanzeige und eine einzelne schattenlose Lichtquelle kennzeichnen den Antwortenden. Falsche Antworten und tatsächliche Gewinner haben getrennte Zustände. Ergebniswerte stammen aus der echten Rundenauswertung.

Die vollständige Bildenthüllung besitzt einen kurzen, anhand der Serverzeit berechneten Vorhangmoment. Später beitretende Ansichten zeigen den bereits erreichten Zustand; reduzierte Bewegung öffnet unmittelbar. Allgemeines Kamerawackeln und doppeltes Bühnenkonfetti entfallen für diese Disziplin.

Die eigene Antwort wird während des Antwortfensters lokal wiederhergestellt. Das Eingabefeld und der Renderer bleiben bei einer Änderung der verfügbaren Fensterhöhe erhalten. Auf sehr kurzen vergrößerten Ansichten hat die Eingabe Vorrang; die verdeckte 3D-Zeichenschleife pausiert. Dies simuliert verfügbare Tastaturhöhe, ersetzt aber keine Prüfung einer echten mobilen Bildschirmtastatur.

Die zusätzliche Schaltfläche „Ergebnis ansehen“ verlässt die große Bühne, fokussiert die vollständige HTML-Auswertung und bringt sie in den sichtbaren Bereich. Die nächste Runde kehrt zur Bildansicht zurück. Die normale 2D-Bild-/Buzzerbedienung bleibt bei fehlendem WebGL erhalten.

## Modelle und Klang

Die tatsächlich vorhandenen Kenney-GLBs `furniture/lampRoundTable`, `furniture/kitchenBar`, `furniture/cabinetBedDrawerTable`, `furniture/pottedPlant` und `furniture/computerScreen` sind integriert. Dateigrößen und SHA-256-Werte stimmen mit den CC0-Einträgen im lokalen Assetregister überein. Es wurde für diese Ausarbeitung kein neuer Download benötigt. Statische Dekoration wird zusammengefasst.

Ein leises Studio-/Luftbett ersetzt die allgemeine Atmosphäre. Buzzer, falsche Antwort und Erfolg erklingen am jeweiligen persönlichen Pult. Die Enthüllung hat eine eigene Quelle an der Bildwand. Der erste native Buzzer entsperrt Audio direkt im Nutzerereignis. Historische Ereignisse bleiben auch bei bereits laufendem Audio stumm.

Die Klangprüfung deckte einen fehlenden Zeitstempel am gemeinsamen Auflösungsereignis auf. `finishRound` setzt ihn nun auf die bestätigte Serverzeit; damit wird der Enthüllungsklang nicht mehr durch die Prüfung auf aktuelle Ereignisse verworfen. Die 22 vorhandenen Engine-Prüfungen bestehen nach dieser Änderung erneut.

## Geprüfte Nachweise

- Acht gezielte Node-Prüfungen: unverzerrte Bildpassung, Buzzerberechtigung und Geheimhaltung, eingefrorener Bildfortschritt, tatsächlicher Fristablauf, Bildschirmmaterial/-proportion und Texturfreigabe, echte Punkte und gemeinsame Vorhangphase, Kameragrenzen für 2/8/12 Teilnehmer sowie begrenzte Restzeit und Zuschauerrechte.
- `picture-studio-low.json`: sechs native Chromium-Fälle mit 2/8/12 Teilnehmern und 1440/390 Pixel Breite, dazu zwei Fälle ohne WebGL. Tatsächlicher 3D-Buzzer, exklusive Antwort, eingefrorenes Foto, falsche Antwort, weitere Antwortfrist, Zuschauer bei zwölf Teilnehmern, Gewinner aus einer zweiten Browsersitzung, tatsächliche Punkte und verzögert geladene Folgebilder. Dieser Bericht liegt vor der abschließenden Ergebnisnavigation.
- `picture-studio-high.json`: zwei hohe Grafikfälle mit zwölf Teilnehmern, reduziertem Bewegungsumfang und dem letzten Außenplatz als lokalem Spieler, außerdem zwei Fälle ohne WebGL. Dieser erste Bericht liegt ebenfalls vor der abschließenden Ergebnisnavigation.
- `spatial-scenes-picture.json`: zwei native Web-Audio-Fälle mit zwölf Teilnehmern. Eigener Buzzer, Quelle des fremden Gewinners, dreitöniger Erfolg, Enthüllungsquelle an der Bildwand, tatsächliche Kamera als Hörer, ein AudioContext, stumme alte Ereignisse innerhalb derselben Disziplin und nach erneutem Szeneneintritt sowie Freigabe der Stimmen/Umgebung beim Verbergen.
- `picture-studio-lifecycle.json`: 18 Wechsel zwischen Studio, Bibliothek mit langem Bücherpfad und Kaufhaus, jeweils zwölf geladene Figuren. Sechs Studiobesuche mit tatsächlicher Bildauflösung behalten jeweils 36 Zeichenaufrufe, 3.326 Dreiecke, acht Texturen und 24 Geometrien in der Bildansicht. Die Bibliothek bleibt bei 47/5.334/33/44, das Kaufhaus bei 86/4.226/32/43. Ein aktiver Canvas und keine erfassten WebGL-Fehler. Dies sind stabile Rendererzähler, keine vollständige Prozessspeichermessung.

`picture-studio-final-high.json` prüft die beiden hohen Fälle mit zwölf Teilnehmern nach der abschließenden Formular- und Ergebnisnavigation erneut, einschließlich echter Betätigung von „Ergebnis ansehen“, Fokus und sichtbarer Position der HTML-Auswertung sowie Rückkehr zum neuen Bild. Zwei weitere Fälle ohne WebGL bestehen ebenfalls. Der vorherige hohe Bericht bleibt als Nachweis des vorherigen Zustands erhalten.

`picture-studio-final-low.json` ergänzt zwei abschließende Sparfälle mit zwölf Teilnehmern einschließlich der gemeinsamen Studiokamera und zwei weiterer Fälle ohne WebGL. Die Studiogruppe benötigt in beiden Breiten 97 Zeichenaufrufe, 4.238 Dreiecke, 29 Texturen und 45 Geometrien. Damit liegt auch die tatsächlich sichtbare volle Gruppe unter dem angesetzten niedrigen Draw-Call-Budget von 100. Die direkte Ergebnisnavigation und Rückkehr zur Folgerunde bestehen ebenfalls. Dies ist keine Zeitmessung auf einem schwachen Gerät.

Desktop- und schmale Bild-/Antwortansichten sowie die hohe gemeinsame Studiokamera wurden tatsächlich als Renderbilder angesehen. Die gemeinsame Ansicht zeigt alle zwölf getrennten Pultplätze; für das eigentliche Raten steht die deutlich größere Bildansicht zur Verfügung.

## Warme Hardwareproben

Vier gesonderte Fälle mit zwölf Figuren, hoher Grafik und tatsächlichem D3D11-Rendering auf der lokalen NVIDIA RTX 4080 SUPER wurden nach Abschluss der anderen Browserjobs gemessen. Jeder Fall enthält 241 rAF-Abstände über vier Sekunden nach einer Aufwärmphase. Alle vier erreichen p99 und Maximum 16,8 ms; kein erfasster Abstand überschreitet 33,5 ms. Die zusätzlich aktivierten Long-Task-/Long-Animation-Frame-Beobachter melden in diesen Fenstern keine Einträge.

| Rohbericht | Ansicht | Renderpuffer | Zeichenaufrufe | Dreiecke | rAF-p95 |
| --- | --- | --- | --- | --- | --- |
| `hardware-picture-screen.json` | Bildwand mit seitlichem Pult | 1510 × 846 | 87 | 6.942 | 16,8 ms |
| `hardware-picture-studio.json` | Gemeinsames Studio mit Pult | 1510 × 846 | 146 | 7.830 | 16,7 ms |
| `hardware-picture-reveal.json`, breit | Tatsächliche Gewinnantwort und gemeinsame Enthüllung während der Messung | 1918 × 846 | 97 | 7.074 | 16,7 ms |
| `hardware-picture-reveal.json`, schmal | Derselbe Übergang bei 390 Pixel Fensterbreite | 388 × 594 | 82 | 6.910 | 16,8 ms |

Die Canvasfläche wächst beim Ende der Eingabe, weil das Pult verschwindet. Die Zähler stammen jeweils aus dem gemessenen Endzustand. Diese warmen kurzen Proben belegen weder Smartphone-Leistung noch Kaltstart, vollständige Eingabelatenz, GPU-Zeit pro Frame, lange Prozessspeichermessungen oder die vollständige Performanceabnahme. Frühere Spitzen anderer Disziplinen bleiben davon unberührt und offen.

## Weiterhin offen

Weitere Architektur-, Lichttechnik-, Figurenaktions- und Ergebnisgestaltung, native mobile Tastaturen, Hörprüfung auf echten Ausgabegeräten, langsamere Referenzgeräte, kaltes Laden, reale Netzunterbrechungen und die vollständige Live-Mehrbrowser-Olympiade bleiben offen. Eine schmale Chromium-Ansicht ist kein Smartphone-Nachweis. Die gezielten Prüfungen und diese einzelne Disziplin erfüllen nicht die vollständige Abnahme aller 21 Spiele, der Oberwelt und des Gesamtprojekts.
