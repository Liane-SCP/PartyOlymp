# Krakensturm: bestätigte Kanonensalve

Die gemeinsame Salve unterscheidet jetzt zwischen einem bestätigten Treffer, einem tatsächlich abgegebenen Fehlschuss und einem nicht abgegebenen Angriff. Zuvor blendete die gemeinsame Projektilbedingung Schüsse mit null Schaden aus. Damit verschwanden sowohl echte Fehlschüsse als auch gültige Beiträge, deren Schaden an einer Phasengrenze auf null begrenzt wurde.

## Inszenierung

`lib/kraken-salvo.ts` verwendet ausschließlich öffentlich bestätigte Ergebnisse. `submitted: true` löst den Schuss aus; ein positiver Score kennzeichnet einen Treffer unabhängig vom tatsächlich zugeordneten Schaden. Eine fehlende oder nicht abgegebene Aktion erzeugt weder Projektil noch neue Salveneffekte oder Schussklang. Die serverseitige Wertung bleibt erhalten.

Die Kanonen feuern weiterhin von 3,45 bis 6,15 Sekunden; die Flugzeit beträgt 0,75 Sekunden. Projektile und Mündungsblitze verwenden den tatsächlichen lokalen Modellanker `[0, .455, -.72]` unter der jeweiligen Kanonengruppe einschließlich Schiffstransformation und Rückstoß. Treffer fliegen zum Boss. Fehlschüsse enden an deterministischen Wasserpositionen neben ihm mit Tropfen und einem expandierenden Wasserring.

`components/olymp/kraken-salvo.ts` besitzt vier begrenzte Instanzpools für Mündungsblitz, Rauch, Wassertropfen und Wasserringe. Sie teilen zwei Geometrien und drei Materialien. Pro Schuss werden keine neuen Geometrien, Materialien oder Partikelobjekte angelegt. Außerhalb der Enthüllung erfolgt keine Effektberechnung; bei reduzierter Bewegung bleiben die Pools verborgen. Die geringe Effektstufe reduziert Rauch und Tropfen. Die vorhandenen Ergebnisanzeigen bleiben die statische Entsprechung.

Die ununterbrochenen alten Ladeteilchen nach 3,45 Sekunden wurden korrigiert: `sin(PI)` war numerisch noch positiv, wodurch ein `charge > 0`-Test die Partikel weiterlaufen ließ. Die Ladephase endet jetzt ausdrücklich. Kraken-Schockringe am Boss erscheinen während der normalen Salve nur bei tatsächlichem Einschlag; Intro, Phasenbruch und Sieg behalten ihre eigene Inszenierung.

## Klang

Die bisherige einzelne Kanonensalve bei 3,8 Sekunden wurde für Kraken durch einzelne Schussklänge an den tatsächlichen Abschusszeitpunkten ersetzt. Die Stärke sinkt mit der Gruppengröße, um überlagerte Salven zu begrenzen. Fehlschüsse besitzen einen eigenen Wasserklang ohne metallischen Boss-Trefferakzent. Die bestehende Ereignisdeduplizierung und das Verwerfen veralteter Klänge bei Rückkehr bleiben erhalten. Musik, Effekte und globale Stummschaltung verwenden den vorhandenen Mixer.

## Nachweise und Grenzen

Vier neue Tests prüfen bestätigte und fehlende Angriffe, echte Fehlschüsse, phasenbegrenzten Schaden, Reihenfolge für zwei bis zwölf Spieler, bewegte Mündungsanker, Wasserringe, feste Ressourcen, reduzierte Bewegung und den Abschluss der Ladepartikel. Die fünf vorhandenen Boss-Ortstests und TypeScript bestehen. Der Produktionsbuild endet mit Exitcode 0; die bestehende Chunkgrößenwarnung bleibt erhalten.

`scripts/check-kraken-salvo-audio.mjs` prüft native Web-Audio-Ausgabe nach Nutzeraktivierung: Schuss und Wassereinschlag erzeugen unterschiedliche, messbare Signale; ausgeschaltete Effekte und globale Stummschaltung erzeugen keinen messbaren Ausgang. Dies ist keine Hörabnahme oder Aufzeichnung der zeitlichen Kopplung im vollständigen gerenderten Spiel.

Die endgültigen Browserabläufe in `outputs/qa/kraken-salvo.json` bestehen für zwei und zwölf Teilnehmer bei jeweils 1440 und 390 Pixeln Breite ohne erfasste Seitenfehler. Sie verwenden echte, öffentlich gefilterte Engine-Ergebnisse einschließlich eines Nullpunkte-Schusses und bei zwölf Teilnehmern eines nicht abgegebenen Angriffs. Sie prüfen die sichtbare Nullpunkte-Kanonenkugel, ihren tatsächlichen bewegten Mündungsursprung, das Wasserziel, die getrennten Trefferziele und das Ausblenden aller Effektpools nach Ende der Salve. Die zusätzliche Zwölferprüfung bei 390 Pixeln mit reduzierter Bewegung besteht ebenfalls; `kraken-salvo-reduced.json` erfasst keine bewegten Salveneffekte oder Projektile.

Die tatsächlichen breiten Zweierbilder und das schmale Zwölferbild wurden visuell kontrolliert. Der fortlaufende Ladepartikel-Burst ist nach der Korrektur verschwunden. Bei dieser Effektprüfung waren Schiff, Boss und neue Effekte in der allgemeinen mobilen Übersicht noch zu klein. Die anschließende nähere Actionkamera, ausdrücklich anwählbare Schiffsübersicht und Touch-Korrektur sind gesondert in [KRAKEN-PORTRAIT-CAMERA.md](KRAKEN-PORTRAIT-CAMERA.md) dokumentiert; eine vollständige Disziplinabnahme wird weiterhin nicht behauptet.

`outputs/qa/kraken-salvo-hardware.json` erfasst zwei aktive fünfsekündige Zwölfer-Salven auf einer NVIDIA RTX 4080 SUPER über ANGLE/D3D11 bei 1920 × 1080 und 390 × 844. Je 301 Bildintervalle ergeben p95 16,7 ms, maximal 16,8 ms, kein Intervall über 33 ms und gemeldete 60 FPS bei Rendermaßstab 1. Ein Diagnosebeobachter erfasst tatsächlich aktive Mündungsblitze von zehn beziehungsweise elf Stationen, Wasserfehlschüsse und höchstens vier neue Effekt-Zeichenaufrufe. Der nicht abgegebene zwölfte Angriff bleibt unsichtbar. Beide Abläufe enthalten keine erfassten Seitenfehler. Diese warmen Desktopmessungen mit stummem Mixer und koordinierten HTTP-Fixtures belegen keine Smartphone-Leistung, Live-Netzwerk-, Kaltstart-, Latenz- oder Langzeitgrenze.

Die vollständige Abnahme aller 21 Disziplinen, Live-Mehrbrowser-Bosskämpfe, echte Mobilgeräte, längere Sitzungen, Latenz und Klangabstimmung bleiben offen. Es wurde keine neue Version veröffentlicht.
