# Würfelwerk: gemeinsamer Blattvergleich am Tisch

Nach dem dreizehnten Zug bleibt die Crew an ihren ursprünglichen Tischplätzen. Die Platzkarten zeigen Blattplatz und Gesamtsumme. Gleich hohe Blattsummen teilen sich denselben Platz; bei zwei gleichen Spitzenblättern folgt Blattplatz drei. Die ausgewählte Platzkarte wird zusätzlich markiert. In der Tischmitte steht der gemeinsame Abschluss des Würfelabends. Die ursprünglichen Figuren reagieren auf den abgeschlossenen Blattvergleich, während die bisherigen Wurf- und Kombinationsreaktionen während des Spiels erhalten bleiben.

Die Auswertung zeigt alle Teilnehmer und ihre Blattpunkte. Über Teilnehmerkarten, eine beschriftete Auswahl oder die tatsächliche Platzkarte am 3D-Tisch lässt sich jedes öffentliche Blatt öffnen. Eigene Auswahl und Markierung bleiben lokal. Ein Zuschauer kann die veröffentlichten Blätter ebenfalls ansehen. Die Auswahl startet keine Spielaktion und verändert weder Würfel noch Punkte.

Das ausgewählte Blatt enthält alle dreizehn Kategorien, oberen und unteren Block, den Bonus sowie die Gesamtsumme. Ab 63 Punkten im oberen Block werden 35 Bonuspunkte ausgewiesen. Beim fremden Blatt steht das eigene Blatt daneben. Fehlende Legacy-Einträge werden als fehlend dargestellt; es werden keine fertigen Würfe oder Werte erfunden. Blattplatz und Blattpunkte sind ausdrücklich vom anschließend serverseitig ermittelten Disziplinplatz und den Olympiadenpunkten getrennt.

## Rückblick nach der kurzen Ergebnisphase

Für das vollständige Lesen aller Kategorien ist die elfsekündige direkte Ergebnisphase zu kurz. Deshalb ist der Blattvergleich zusätzlich in Lobby, Zwischenstand, Pause und Finale über „Würfelblätter im Spielrückblick“ erreichbar. Er wird aus den tatsächlich gespeicherten Disziplinergebnissen einschließlich ihrer vollständigen Wertungsblätter rekonstruiert. Mehrere Würfelpartien können einzeln ausgewählt werden. Der Rückblick baut keinen weiteren Renderer auf und lädt seine Blatttabellen erst beim Öffnen. Schließen entfernt diese Tabellen wieder. Er benötigt keinen aktiven Würfelraum und sendet keine Raumkommandos.

## Technische Änderungen

- `lib/dice-results.ts`: fertige Blätter, Summen, Bonus und gleiche Blattplätze; Rekonstruktion aus gespeicherter Historie ohne Mutation ihrer Daten.
- `components/olymp/dice-results.tsx`: Teilnehmerwahl, vollständiges Vergleichsblatt und verzögert aufgebauter Spielrückblick.
- `dice-crew-table.ts`: bestehender gemeinsamer Texturatlas für Abschlusskarten und Auswahlmarkierung; vorhandene Boxgeometrie und unsichtbares Treffermaterial für die Ergebniswahl. Die laufenden Becher-/Halte-/Blattaktionen werden während der Auswertung gesperrt. Bei der nächsten normalen Spielphase sind Ergebnisziele wieder deaktiviert.
- `adventure-scene.ts`, `game-board.tsx`, `round-results.tsx` und `platform.tsx`: räumliche Zuordnung, Figurenreaktionen, Ergebnisdarstellung und Rückblick. Die Ergebniswahl nutzt dieselbe Würfelszene. `app/dice-results.css` stellt lesbare Papierflächen, große Eingaben und responsive Tabellen bereit.

Die vorhandenen heruntergeladenen Möbel, Becher, Würfel und ursprünglichen Figuren werden weiterverwendet. Es wurden für diese Auswertung keine zusätzlichen Modelle oder Texturdateien heruntergeladen. Der Blattvergleich steuert keine Kamerafahrt und benötigt keine spielentscheidende Animation.

## Prüfungen und tatsächlicher Live-Durchlauf

Fünf neue Tests bestehen (`scripts/test-dice-results.mjs`): tatsächliche dreizehn Züge für jede Gruppengröße von zwei bis zwölf, vollständige Kategorien und Summen, Bonusgrenze, gemeinsame Plätze, Legacy-Daten, sämtliche räumlichen Ergebnisziele, Zuschauer, Rückkehr zu normalen Spielkontrollen und Wiederherstellung aus unveränderter gespeicherter Historie. Die neun vorhandenen Würfelplatztests bestehen ebenfalls.

Fünf Browserfälle prüfen zwei beziehungsweise zwölf Teilnehmer bei 1440 und 390 Pixeln sowie zusätzlich einen Zuschauer bei zwölf Teilnehmern. Je Fall öffnen zwei getrennte Browserkontexte dieselbe Partie. Die Prüfung öffnet jedes Blatt, kontrolliert alle Kategorien und Summen, wählt eine wirkliche Platzkarte per Maus beziehungsweise Touch aus und vergleicht eigene und fremde Blätter. Tastaturwahl erfolgt auf den breiten Ansichten. Die Ergebniswahl bleibt lokal und benutzt dasselbe Canvas; es werden keine Raumaktionen gesendet. Die finale Fassung prüft zusätzlich den aus der Historie geöffneten Rückblick und dessen verzögerten Aufbau. Bericht: `outputs/qa/dice-results-browser.json`.

Alle fünf finalen Fälle bestehen (`outputs/dice-results-browser-final.log`). Vier bestehende Würfeltisch-Browserabläufe für zwei und zwölf Teilnehmer bei beiden Breiten bestehen auf dem finalen Build ebenfalls: tatsächlicher Becherwurf, Halten, öffentliche Würfel, Wiederbeitritt während des Wurfes, Platzkamera, Zurücksetzen und Zuschauerrechte (`outputs/dice-results-crew-regression.log`). Der finale Sites-Build und die Typprüfung enden mit Exitcode 0 (`outputs/dice-results-final-build.log`, `outputs/dice-results-final-types.log`). Die breite Vergleichstabelle, die schmale Teilnehmerwahl und die schmale Summenansicht wurden visuell geprüft; ein zunächst zu heller Text auf dem Papier wurde abgedunkelt. Es wurde kein horizontaler Überlauf festgestellt. Sämtliche eigenen Testprozesse und Vorschauen sind beendet.

Die tatsächliche lokale Zweierpartie (`DICE_LIVE_RESULTS=1 DICE_LIVE_REPORT=outputs/qa/dice-results-live.json node scripts/check-dice-live-session.mjs`) besteht über echte HTTP-/D1-Daten und tatsächliche Browser-WebSockets. Sie benötigt 105,497 Sekunden und enthält dreizehn native Züge, einen Wiedereintritt im sechsten Zug, die Prüfung doppelter und veralteter Aktionen sowie die direkte neue Ergebniswahl in beiden Browsern. Die bestätigten Blattsummen sind 36 und 22. Die Disziplinwertung enthält genau einen Verlaufseintrag, Plätze eins und zwei sowie 100 und null Olympiadenpunkte. Alle 68 beziehungsweise 64 Browseraktionen wurden erfolgreich bestätigt. Die Clients empfangen 301 beziehungsweise 296 Snapshots. Der Test erfasst keine Browser- oder Spielprotokollfehler.

Dieser Live-Durchlauf entstand vor der ergänzten Rückblickansicht und der Korrektur, die bisherige Figurenreaktionen während normaler Züge erhält. Der Live-Nachweis deckt den vollständigen gemeinsamen Spielablauf und die direkte Ergebniswahl ab. Der nachträgliche Rückblick wird separat auf dem finalen Build aus tatsächlichen Engine-Historien geprüft; dafür wird keine zusätzliche reale Netzwerkpartie behauptet.

## Runtime-Befund und Grenzen

Beim echten Wiedereintritt erscheinen zwei bekannte lokale workerd-Hang-Meldungen. Nach dem Browserabbau werden weitere vier erfasst. Bericht: `outputs/qa/dice-results-runtime.json`. Die Partie und ihre Prüfungen bestehen, aber dies ist kein Nachweis, dass der bekannte lokale WebSocket-Abschlussfehler behoben wurde. Browser-/Spielprotokollfehler und Runtime-Meldungen bleiben getrennt ausgewiesen.

Die koordinierten Browserfälle verwenden tatsächliche Spielregeln, kontrollierte HTTP-Snapshots, eine feste gemeinsame Szenenuhr und geschlossene WebSockets. Sie messen keine echten Referenzgeräte-FPS. Ein schmaler Desktop-Viewport ersetzt kein physisches Mobilgerät. Hörprüfung, vollständige Eingabelatenz, lange Prozessspeicherprüfung, alle echten Gruppengrößen und eine komplette gemischte Olympiade bleiben offen. Auch die weitere Raum-/Gruppen-/Klanggestaltung des Würfelwerks bleibt Bestandteil des unveränderten Auftrags über alle 21 Disziplinen. Dieser Ausbau ist lokal und unveröffentlicht.
