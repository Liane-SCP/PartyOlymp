# Ergebnisansichten mit zwölf Teilnehmern

Stand: 22.10.2026. Die Ergebnisansichten wurden zusätzlich zu den Startansichten in 16:9 geprüft. `resultFixture` in `tests/adventure-browser-engine.ts` erzeugt die erste Auflösung jeder Disziplin durch echte Engine-Aktionen und Ticks. Dieselben Bot-Aktionen verwendet der vollständige Engine-Olympiaden-Test; die Prüfungen pflegen keine zweite Kopie dieses Ablaufs.

## Änderungen

- Kopf-Auktion, Zeitgefühl und Bombenwort verwenden in der Seitenleiste lesbare Ergebniszeilen. Namen, Messwerte und Punkte überlappen nicht mehr. Das eigene Ergebnis steht zusätzlich oben; bei Zeitgefühl erst nach dessen gemeinsamem Aufdeckzeitpunkt.
- Die übrigen Ergebnislisten passen sich der Seitenleiste an. Hivemind übernimmt dort kein breites, zweispaltiges Kinolayout mehr. Codeknacker verwendet zwei ausreichend breite Spalten.
- Ein direkter Sprung zum eigenen Eintrag scrollt nur die Ergebnisleiste und setzt den Tastaturfokus auf diesen Eintrag. Die Reihenfolge der Rangliste bleibt erhalten.
- Wiki-Sprint zeigt die Seitennavigation der Ergebnisbücher wieder an. Alle vier Seiten mit zwölf Teilnehmern sind erreichbar.
- Die Atelier-Ergebnisse zeigen wahlweise die Bühnenblätter oder die Tabelle mit Wertung. Die Tabelle verdeckt kein drittes Bühnenblatt mehr. Die Abstimmungsphase behält ihre bisherigen Eingaben.
- Im Maßstabsmuseum stehen Zielwert und Galerieauswahl in getrennten Bereichen derselben Seitenleiste. Die tatsächliche Höhe der Galerie reserviert ihren Platz. Alle zwölf öffentlichen Tipps lassen sich auswählen; die Auswahl wird nicht mehr von einer transparenten Ergebnisfläche blockiert.

## Nachweise

- `node scripts/check-party-results.mjs`: alle 21 ersten Rundenauflösungen mit zwölf Teilnehmern in 1280 × 720 und 1920 × 1080, keine Seitenüberläufe und keine horizontal überlaufende Haupt-Ergebnisleiste. Bericht: `outputs/qa/party-results/report.json`.
- Galeriebedienung: `RESULT_GAMES=categories,size,color,spectrum,timing,wiki`. Native Schaltflächen bis zur letzten Seite, letzte Farbmischung, letzter Größentipp und Wechsel zwischen Atelierblättern und Tabelle. Bericht: `outputs/qa/party-results/report-galleries.json`.
- Letzter Teilnehmer: `RESULT_VIEWER=last`, Spiele `chain,herd,typer,cards,wiki`, Breite 1280. Eigener Eintrag erhält den Fokus; die Dokumentseite bleibt bei Scrollposition null. Bericht: `outputs/qa/party-results/report-last-viewer.json`.
- `node scripts/test-engine.mjs`: 22 Prüfungen, darunter vollständige Olympiaden mit zwei, acht und zwölf Spielern, Persistenz, Privatsphäre und genau einmalige Punktevergabe. Nach dem Herausziehen des gemeinsamen Bot-Helfers erneut bestanden.

Die Browserberichte verwenden lokale Chromium-Darstellung und kontrolliertes Polling, das den Ergebniszustand hält. Sie sind keine vollständige Netzwerkpartie. Zwischenphasen wie gemeinsame Wortprüfung und Kategorienabstimmung sind durch diese Ergebnisprüfung allein noch nicht visuell abgenommen. Die übergreifenden Kamera-, Eingabe- und 16:9-Nachweise stehen in [CAMERA-DIRECTION.md](CAMERA-DIRECTION.md).
