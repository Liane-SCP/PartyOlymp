# Würfelkoloss: nahe Crewansicht und wählbarer Tempel

Die bisherige Hochformatkamera hielt die gesamte Tempelplattform im Bild und verkleinerte dadurch Figuren, Boss und gemeinsame Runenangriffe. Die neue Standardansicht richtet sich näher auf den eigenen Platz und den monumentalen Tempelwächter. **Ganzer Tempel** erhält die ausdrücklich wählbare Gesamtübersicht; **Zur Action** kehrt zur näheren Ansicht zurück. Die eigene Würfel-/Halte-/Angriffshandlung bleibt über die vorhandene Runenplatz-Nahansicht erreichbar.

`lib/colossus-camera.ts` komponiert den höheren Wächter und die davor angeordneten Runensteine eigenständig. Die kurze 320 × 700-Projektion zeigte im ersten Entwurf den Kopf zu nah an der Statusleiste; der vertikale Blickpunkt wurde vor dem Browserdurchgang angehoben. Die tatsächlichen Renderbilder wurden danach kontrolliert.

Während der gemeinsamen Salve folgt die Kamera ausschließlich öffentlich bestätigten Angriffen mit positivem Schaden. Ein Verzicht oder ein schadensloser Beitrag führt keine Kameraverfolgung aus. Nach der Salve wird wieder der eigene Platz zum Bezugspunkt. Private Augen und Halteauswahlen dienen nicht zur Kamerawahl. Die bisherigen Ladungen, Projektile, Wertungen und Trefferzeitpunkte bleiben erhalten.

## Darstellung und Bedienung

- Eigene Hochformatkomposition bis 600 Pixel Breite und ab 600 Pixel Höhe; Querformat behält die breite Kamera.
- Zeitbasierte gedämpfte Übergänge zwischen Crewansicht, Gesamtübersicht und persönlichem Runenplatz.
- Reduzierte Bewegung setzt gewählte Ansichten unmittelbar und verzichtet auf automatische Salvenverfolgung.
- Drei Ansichtsschaltflächen während der Eingabe, zwei während der Auflösung; mindestens 44 Pixel hoch.
- Ergebnisüberschrift in der nahen Weltansicht unter der Statusleiste bei 198 Pixeln, in der Gesamtübersicht unterhalb der kleineren Welt.
- Allgemeine Effektstärke in der nahen Hochformatansicht 35 %, Trefferlicht 50 %, zusätzlicher Blitz 45 %. Die lesbare eigene Würfelentscheidung bleibt erhalten.
- Ursprüngliche Figuren, Accessoires, Plätze und räumliche Angriffsursprünge bleiben erhalten. Es werden keine neuen Modelle, Texturen, Geometrien oder Lichtquellen für die Kamerakorrektur benötigt.

## Prüfungen der aktuellen Quelle

Zwei neue Node-Prüfungen bestehen: Projektion des eigenen Platzes und Wächterkopfes bei 320 × 700, 390 × 844 und 430 × 932 mit zwei/acht/zwölf Teilnehmern und linken/mittleren/rechten Plätzen; Verfolgung ausschließlich bestätigter schädigender Beiträge und Rückkehr zum eigenen Platz. Die vier bisherigen Kraken-/Drachen-Kameraprüfungen bestehen ebenfalls. TypeScript und Produktionsbuild bestehen; die bestehende Chunkgrößenwarnung bleibt sichtbar.

`outputs/qa/colossus-camera.json` enthält vier bestandene Abläufe: zwei Teilnehmer bei 320 × 700 mit eigenem letzten Platz, zwölf Teilnehmer bei 390 × 844 mit eigenem letzten Platz, zwölf Teilnehmer bei 430 × 932 mit eigenem ersten Platz und 390 × 844 zusätzlich mit reduzierter Bewegung. Tatsächliche CDP-Touchaktionen wechseln Ansichten, würfeln räumlich, halten einen Würfel, würfeln erneut und bestätigen den Angriff. Gehaltener Wert und fremde private Hand werden geprüft. Alle eigenen Gesichtsecken liegen frei von DOM-Flächen; der geprüfte Ausschnitt ist ungefähr 29/38/42 Pixel breit und mindestens 40 % größer als in der Übersicht. Die Gesamtübersicht enthält alle Plätze. Verzicht ohne Schaden, Salve, Ergebnisüberschrift sowie Querformat und Rückkehr werden geprüft. Keine Browserfehler.

Der erste Versuch des neuen Prüfskripts projizierte eine Wurfaktion mit noch nicht erneuerten Diagnosematrizen aus der vorherigen Ansicht und landete auf einem DOM-Button. Die tatsächliche Runenfläche war im Renderbild frei. Der Ablauf wartet nun nach dem abgeschlossenen Ansichtswechsel auf die nächste Veröffentlichung der Kameramatrizen, bevor er den Touchpunkt berechnet. Die eigentliche Bedienung wurde dafür nicht verzögert oder verändert.

Die Renderbilder `colossus-camera-action-390-12-11.png` und `colossus-camera-impact-320-2-1.png` wurden visuell kontrolliert. Der Wächter ist zwischen Statusleiste und Crew erkennbar; die eigenen Figuren sind deutlich größer und die Trefferwellen verdecken weniger von der Szene.

`outputs/qa/colossus-camera-hardware.json` enthält zwei aufgewärmte fünfsekündige Fenster mit zwölf Teilnehmern und elf tatsächlich entladenen Runenangriffen auf einer RTX 4080 SUPER über D3D11: 1920 × 1080 mit breiter Kamera und 390 × 844 mit neuer Actionkamera. Je 301 Bildintervalle, 95. Perzentil 16,7 ms, Maximum 16,8 ms, kein Intervall über 33 ms; angezeigte 60 FPS bei Auflösungsskala 1,00. Die erfassten Draw-Call-Momentaufnahmen betragen 123 und 134; sie sind keine Höchstwerte für alle Kampfphasen. Der Verzicht erhält keine Ladung. Keine Browserfehler. Das schmale Fenster nutzt dieselbe Desktop-GPU und belegt keine Leistung auf einem Telefon.

Die zusätzliche Regression des bisherigen Runenablaufs bei zwölf Teilnehmern und 390 Pixeln besteht: tatsächlicher Wurf-/Halte-/Angriffstouch, unveränderter gehaltener Würfel, alter Wurf nach Neuladen, Privatheit bei fremdem Neuwurf, öffentliche Bereitschaft, schadensloser Verzicht und gemeinsame Entladung. Bericht `outputs/qa/colossus-camera-runes-regression.json`, Log `outputs/qa/colossus-camera-runes-regression.log`. Auch die anschließend vollständig erneut ausgeführte bisherige Matrix mit zwei/zwölf Teilnehmern bei 1440/390 Pixeln besteht mit allen vier Fällen und ohne Browserfehler. Aktueller Bericht `outputs/qa/colossus-runes-animated.json`, Log `outputs/qa/colossus-camera-runes-full.log`.

## Offene Gesamtarbeit

Die Abläufe verwenden echte Engine-Ergebnisse mit koordinierten HTTP-Fixtures, stummgeschalteten Ton und geschlossenem Live-WebSocket. Physische Mobilgeräte, native Bildschirmtastaturen, Hörabnahme, Live-Gruppenkämpfe, weitere Bossphasen und längere Sitzungen sind damit nicht abgenommen. Weitere Tempel-/Figuren-/Phasen-/Klanggestaltung, die vollständige Olympiade und die Abnahme aller 21 Disziplinen bleiben offen. Keine neue Veröffentlichung.
