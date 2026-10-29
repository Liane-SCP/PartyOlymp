# Krakensturm: mobile Actionkamera und Schiffsübersicht

Die bisherige mobile Kamera passte das komplette quer liegende Schiff in das Hochformat ein. Das drückte Crew und Kraken in einen schmalen Streifen am oberen Bildschirmrand. Die vorherige Salven-Bildkontrolle zeigte einen großen ungenutzten Wasserbereich und kaum erkennbare Figuren und Effekte.

## Ansichten

Für Bildschirme bis 600 Pixel Breite und mindestens 600 Pixel Höhe ist die gemeinsame Standardansicht jetzt näher am Geschehen. Sie zeigt den Boss und den eigenen Crewbereich. Die übrigen Stationen werden dabei teilweise angeschnitten. Die Taste **Ganzes Schiff** schaltet ausdrücklich in die vollständige Schiffsübersicht; **Zur Action** kehrt zurück. Die bestehende persönliche Kanonenansicht bleibt über **Deine Kanone** erreichbar. Auf breiten Ansichten bleibt die gemeinsame Gesamtkomposition erhalten, und die zusätzliche mobile Taste wird ausgeblendet.

Während der Salve folgt die Actionkamera sanft den tatsächlich abgegebenen öffentlichen Angriffen. Ein nicht abgegebener Angriff lenkt die Kamera nicht um. Nach der Salve kehrt sie zum eigenen Bereich zurück. Bei reduzierter Bewegung bleibt die Kamera während der einzelnen Schüsse am eigenen Bereich; bewusst gewählte Ansichtswechsel erfolgen unmittelbar. Der Übergang zwischen Entscheidungs- und Salvenausschnitt ist bei aktivierter Bewegung geglättet.

Die unteren mobilen Bedienelemente nutzen die verfügbare Breite. Spielpult, persönliche Kanone und Schiffsübersicht sind im gemeinsamen Entscheidungsbild nebeneinander erreichbar. In der nahen Actionansicht steht der Ergebnistext während der Salve im freien Streifen unter der Statusleiste. Die erste Bildkontrolle hatte ihn noch vor Crewgesichtern gezeigt; das wurde korrigiert. In der entfernten Schiffsübersicht bleibt er im freien unteren Bildbereich. Die persönliche Kanonenansicht behält ihre bestehende Anordnung mit zwei Tasten. Eine nach der Entscheidung verbleibende `stationFocus`-Auswahl markiert die Darstellung nicht länger fälschlich als persönliche Ansicht.

Der Kameraversatz bei Größen-/Auflösungswechseln berücksichtigt jetzt die Übergangsanteile für persönliche Ansicht und Schiffsübersicht. Die Meeresfläche wurde bei unveränderter Segmentzahl vergrößert, damit in der entfernten Schiffsübersicht keine harte Wasserflächenkante im Bild liegt.

Die erste nahe Zwölfer-Salvenaufnahme zeigte außerdem überstrahlte Trefferstrahlen. Die räumliche Inszenierung erhält in der mobilen Actionansicht deshalb eine Stärke von 0,35; Einschlaglicht und zentraler Blitz werden zusätzlich abgeschwächt. Die breite Ansicht und die ausdrücklich gewählte Schiffsübersicht behalten ihre bisherigen Werte. Kanonenkugeln, neue Mündungs-/Wassereffekte und verbindliche Wertung bleiben erhalten.

## Touch-Eingabe

Der erste Prüfablauf zeigte, dass die Kanonenmündung in der gemeinsamen Ansicht zu klein für zuverlässig präzises Touch-Treffen war. Die echte Modellfläche bleibt direkt bedienbar. Zusätzlich erhält ausschließlich die eigene bedienbare Kanone bei Touch eine Trefferfläche mit 22 Pixel Radius um ihren tatsächlichen projizierten Mündungsanker. Schiffstransformation und Rückstoß werden dabei berücksichtigt. Maus-Raycasts und die bestehenden 44-Pixel-Würfelbereiche bleiben erhalten.

## Prüfung

Zwei neue Node-Tests prüfen die Platzierung der eigenen Figur und des Bosskopfes zwischen Kopfzeile und Eingabebereich bei 320 × 700, 390 × 844 und 430 × 932 mit zwei, acht und zwölf Teilnehmern. Zusätzlich wird das Folgen bestätigter Angriffe geprüft, einschließlich anderer Ergebnisreihenfolge und übersprungener nicht abgegebener Angriffe.

TypeScript und der endgültige Produktionsbuild bestehen; der Build endet mit Exitcode 0. Die vier vorhandenen Salven-/Ressourcenprüfungen bestehen weiterhin.

`outputs/qa/kraken-camera.json` enthält vier erfolgreiche abschließende Browserabläufe ohne erfasste Seitenfehler: 320 × 700 mit zwei Teilnehmern am letzten Platz, 390 × 844 mit zwölf Teilnehmern am letzten Platz, 430 × 932 mit zwölf Teilnehmern am ersten Platz sowie 390 × 844 mit zwölf Teilnehmern und reduzierter Bewegung. Alle durchlaufen Actionansicht, vollständige Schiffsübersicht, persönliche Kanone und Rückweg. Vier projizierte Gesichtspunkte liegen in beiden persönlichen Arbeitsansichten auf dem freien Canvas; alle Kanonenmündungen liegen in der gewählten Schiffsübersicht im Bild. Nach dem Rückweg hält ein tatsächlicher CDP-Touch **18 Pixel links neben der projizierten Mündung** die Kanone mindestens 250 ms und löst den verbindlich bestätigten Schuss aus. Anschließend erfolgen gemeinsame Salve und Größenwechsel ins Querformat und zurück. Die zusätzliche mobile Taste verschwindet im Querformat. Die Position des Ergebnistexts im freien oberen Streifen wird ebenfalls geprüft.

Die tatsächlichen 320er-/390er-Action- und Salvenbilder sowie die vollständige 390er-Zwölfer-Schiffsübersicht wurden visuell kontrolliert. Die korrigierte nahe Salve zeigt den Boss, die Crew und das Projektil ohne die zuvor beobachtete großflächige Überstrahlung. Die entfernte Übersicht zeigt alle zwölf Plätze und keine harte Wasserflächenkante. Bildnamen beginnen unter `outputs/qa/` mit `kraken-camera-action-`, `kraken-camera-ship-` und `kraken-camera-salvo-`. Die anfänglichen gescheiterten Touchläufe und die erste überlagernde/überstrahlte Ergebnisaufnahme waren Anlass für die beschriebenen Korrekturen; die abschließenden Berichte stammen aus dem danach neu gebauten Stand.

`outputs/qa/kraken-camera-hardware.json` erfasst zwei aktive fünfsekündige Zwölfer-Salven auf einer NVIDIA RTX 4080 SUPER über ANGLE/D3D11: 1920 × 1080 mit erfasstem Kameramodus `wide` und 390 × 844 mit `action`. Je 301 Bildintervalle ergeben p95 16,8 beziehungsweise 16,7 ms, maximal 16,8 ms, kein Intervall über 33 ms und gemeldete 60 FPS bei Rendermaßstab 1. Beide Beobachter erfassen tatsächlich aktive Mündungsblitze von elf Stationen, Wasserfehlschüsse und höchstens vier Salveneffekt-Zeichenaufrufe. Der nicht abgegebene zwölfte Angriff bleibt unsichtbar. Es wurden keine Seitenfehler erfasst. Dies sind warme, stumme Desktopmessungen mit einem Diagnosebeobachter und koordinierten HTTP-Fixtures; die schmale Ansicht ist kein physisches Smartphone.

Diese Arbeit ersetzt keine vollständige Abnahme aller 21 Disziplinen, echte Mobilgeräte, Live-Mehrbrowser-Kämpfe, Kaltstart-/Latenzgrenzen, längere Sitzungen oder Hörabnahme. Intro, Finale und weitere Sonderformate benötigen eine eigene vollständige Kompositionsabnahme. Es wurde keine neue Version veröffentlicht.
