# Prüf- und Abstimmungsansichten

Die Desktop-Abstimmung von Stadt Land Fluss verwendet eine einspaltige Antwortliste. Nur diese Liste scrollt; Kopf, Kategorien und Abgabe bleiben sichtbar. Die Präsentationskamera reserviert den Platz der privaten Abstimmung, damit die drei öffentlichen Antwortblätter links daneben vollständig sichtbar sind.

Das Jurybuch der Kopf-Auktion verwendet ebenfalls eine scrollbare Begriffsliste mit fester Seitenauswahl und Abgabe. Ein gemeinsamer Hintergrund hält die Abstimmung vor der Bühne lesbar; einzelne Begriffe brauchen keine zusätzlichen Kachelhintergründe. Diese Regeln gelten nur für die aktive Juryansicht auf Desktops ab 1100 Pixeln Breite.

## Nachweis

`node scripts/check-party-reviews.mjs` prüft fünf reale Engine-Zustände mit zwölf Teilnehmern bei 1280 × 720 und 1920 × 1080: Kategorienabstimmung, Bombenwortprüfung, Kettenantwortprüfung, angefochtene Kettenantwort und Auktionsjury. Die Aktionen laufen über die reguläre Raumaktion; der Test prüft die serverseitig angenommene Stimme. Die Auktionsjury bewertet zwölf Begriffe auf zwei Seiten.

Zusätzlich geprüft: kein Dokument-Scrollen, kein horizontaler Überlauf der Konsole, keine Browserfehler sowie die sichtbare, unverdeckte Abgabe bei Kategorien und Auktion. Bericht und Screenshots liegen unter `outputs/qa/party-reviews/`.

`node scripts/test-atelier-presentation.mjs` prüft zwölf Fälle, darunter die Projektion sämtlicher Tafel-Ecken neben die Abstimmung bei 1280, 1366 und 1920 Pixeln Breite. Bestehende Prüfungen decken außerdem private Entwürfe, geheime Stimmen, Ergebnisblätter und Kamera-Grenzen ab.

Die Browserprüfung verwendet lokales Chromium mit Software-WebGL und kontrollierter HTTP-Kommunikation. Die Prüfphasen werden für die Bedienung auf 60 Sekunden gehalten. Das ist kein Nachweis einer vollständigen Netzwerkpartie oder der Echtzeit-Latenz.
