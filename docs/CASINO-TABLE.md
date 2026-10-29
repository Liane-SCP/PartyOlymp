# Club 21: gemeinsame Tischrunde

Die folgenden ursprünglichen Raum-Messwerte gehören zur früheren Einrichtung. Ihre Berichte sind inzwischen unter `outputs/qa/casino-table-before-room.json` und `casino-table-high-before-room.json` gesichert. Der anschließende Ausbau mit Bogenfenstern, Kartenwappen, Lounge und neuen Prüfungen steht in [CASINO-ROOM.md](CASINO-ROOM.md); aktuelle gleichnamige Tischberichte können diesen späteren Stand enthalten.

Die spätere primäre Hand-/Dealerbedienung, große tatsächliche Karten, gemeinsame Aufdeckfreigabe und die passenden aktuellen Wiederholungen stehen in [CASINO-PLACE.md](CASINO-PLACE.md). Zum Vergleich räumlicher Posen wählt die Tischprobe nach dem Neuladen ausdrücklich dieselbe Tischansicht.

## Gestaltung und Interaktion

Der Smaragdpalast verwendet einen eigenen Casinosaal mit Filztisch, Messinglinien, Bar, Pflanzen, Leuchte und einem besetzten Dealerplatz. Die vorhandenen lizenzierten Kenney-Möbel bleiben lokal eingebunden. Teilnehmer sitzen auf niedrigen Barhockern, damit die ursprünglichen Portraitfiguren mit ihren Formen, Gesichtern und Accessoires sichtbar bleiben. Der Dealer Jules verwendet dieselbe Figuren-/Avatartechnik, mit Monokel und Fliege. Er zählt nicht als zusätzlicher Teilnehmer und hat keine Spieleraktionen.

Die Sitzanordnung berücksichtigt zwei bis zwölf Teilnehmer. Die eigene Figur sitzt auch bei zwei Teilnehmern direkt vor der eigenen Hand. Andere Teilnehmer besitzen sichtbare öffentliche Hände auf der inneren Tischfläche; deren Offenheit entspricht ausdrücklich der vorhandenen Club-21-Regel und dem öffentlichen Server-Payload. Zuschauer sehen diese öffentlichen Hände, aber keine erfundene eigene Hand oder Einsatzaktion.

Die Karten haben abgerundete Körper, gedruckte Vorderseiten und gemusterte Rückseiten. Alle 52 Werte und eine Rückseite liegen in einem im Projekt erzeugten Atlas von 1024 × 1232 Pixeln. Es gibt dafür keinen externen Bilddownload. Instanzierte Körper und eine gemeinsame Vorder-/Rückseitengeometrie benötigen zusammen zwei Zeichenaufrufe. Die logischen Kartenobjekte auf Ebene 31 werden nicht zusätzlich gerendert. Eigene neue Karten kommen aus dem Kartenschuh; aufgedeckte Dealer-Karten drehen sich über dem Filz tatsächlich im Raum.

Die drei Tischaktionen bleiben direkt mit den vorhandenen verbindlichen Befehlen verbunden: Einsatz bestätigen, Karte ziehen und stehen bleiben. Die präzise Oberfläche mit Handwert, Einsatz und Spielregeln bleibt ergänzend erhalten. Der Casinoraum verwendet eine Innenraumbeleuchtung ohne die zuvor sichtbaren schwebenden Außenkristalle.

## Gemeinsame Zeit, Aufdeckung und Auszahlung

`lib/casino-presentation.ts` berechnet dieselbe öffentliche Aufdeckfolge für Tisch und Ergebnisoberfläche. Eine weitere Dealerkarte wird alle 1500 ms freigegeben. Die nächste noch nicht freigegebene Karte bleibt als Rückseite sichtbar. Die tatsächliche Drehung dauert nach ihrer Freigabe 350 ms, mit genügend Hub über der Tischfläche. Ihr Winkel wird aus der gemeinsamen Zeit berechnet. Ein Neuladen startet sie nicht erneut.

Auszahlungen, persönliche Ergebnisreaktionen und die Ergebnistabelle beginnen erst nach der vollständigen Dealerphase. Der eine Sekunde lange Chiptransfer wird ebenfalls aus dieser Zeit berechnet. Reduzierte Bewegung lässt Drehung und Transfer ruhig erscheinen, gibt aber keine Karte und kein Ergebnis früher frei.

Einsätze und Rückgaben teilen sich instanzierte Stapel. Zwölf gleichzeitige Rückgaben beginnen an zwölf getrennten Punkten auf der Bankmatte. Die Token sind eine abstrahierte Mengenanzeige; verbindliche exakte Chipwerte stehen in der Oberfläche. Gewinn, Verlust und Gleichstand werden aus Auszahlung minus Einsatz abgeleitet. Zuschauer erhalten keine persönliche Gewinn-/Verlustreaktion. Beim nächsten Durchlauf verschwinden alte Rückgaben und Kartenwerte.

Die Ergebniskamera passt Tisch, sämtliche Sitzplätze und Dealer für unterschiedliche Seitenverhältnisse und erlaubte Kameradrehungen ein. Die Frontansicht bleibt die persönliche Perspektive: absolute Positionen der anderen Teilnehmer können sich zwischen zwei Betrachtern durch die angepasste Sitzordnung unterscheiden. Dealerphase und veröffentlichte Beträge sind gemeinsam; ein Wiederbeitritt derselben Perspektive erhält auch dieselben tatsächlichen Chippositionen.

## Klang und Wiederbeitritt

Ein kurzes Papierreiben mit Filzkontakt ersetzt beim Kartengeräusch die bisherige elektronische Tonfolge. Kartenereignisse entstehen räumlich am Kartenschuh, die Auszahlung an der Bankmatte. Auch ein anderer Teilnehmer erhält die hörbare öffentliche Kartenausgabe. Das erweitert nicht die Sichtbarkeit fremder Hände in anderen Kartenspielen.

Die gemeinsame Auszahlung erhält einen kurzen Chipklang, auch wenn der eigene Spieler verloren hat und ein anderer gewinnt. Die persönliche Gewinn-/Verlustfanfare bleibt an das eigene Ergebnis gebunden. Zuschauer bekommen keine erfundene persönliche Fanfare. Das Casino besitzt ein eigenes dezentes Raum-/Luftprofil und einen Raumhallanteil von 0,055; Effektlautstärke und Stummschaltung gelten weiterhin.

Bei der ersten Raumantwort wird die Ereignishistorie übernommen, ohne gespeicherte Kartenereignisse oder Emotes erneut abzuspielen. Eine spät geladene, bereits abgeschlossene Dealerauflösung wiederholt ihre Auszahlung ebenfalls nicht. Das bloße Öffnen einer Sitzung entsperrt keinen Audiokontext. Die eigentliche Nutzeraktion kann ihn öffnen. Verborgene Szenen geben Panner und beide Umgebungsquellen frei.

## Nachweise

- `scripts/test-casino-table.mjs`: sechs Prüfungen für gemeinsame Zeit, öffentliche Hände, tatsächliche Dreh-/Chippositionen nach Wiedereinstieg, reduzierte Bewegung, Zuschauer, Kameraausschnitt und zwölf getrennte Rückgaben.
- `scripts/check-casino-table.mjs`: 2/8/12 Teilnehmer auf 1440/390 Pixeln, jeweils zwei koordinierte Browseransichten. Tatsächliche Maus-/Touch-Eingaben lösen Einsatz, Ziehen und Stehenbleiben aus. Ein kontrollierter gültiger Sechs-Deck-Ablauf wird durch die echte Spielengine ausgewertet; Auszahlungen werden nicht überschrieben. Geprüft werden verborgene Karten, gemeinsame Dealerposen, Neuladen während Aufdeckung und Chiptransfer, vollständige Auszahlung und Folgerundenreset. Bericht: `outputs/qa/casino-table.json`; gerenderte Bilder: `casino-table-*-playing.png`, `casino-table-*-flip.png` und `casino-table-*-paid.png`.
- `scripts/check-casino-audio.mjs`: natives instrumentiertes Web Audio auf Desktop und Touch. Die echte erste Einsatzaktion entsperrt genau einen Kontext. Eine fremde Kartenausgabe bleibt hörbar. Der Bankklang beginnt erst nach Freigabe; das gilt für den eigenen Gewinner wie für den eigenen Verlierer. Audio-Hörer und tatsächliche Kamera stimmen überein. Sichtbarkeitsbereinigung trennt Quellen; Neuladen einer abgeschlossenen Hand spielt die Auszahlung nicht erneut. Bericht: `outputs/qa/casino-audio.json`.
- `outputs/qa/scene-lifecycle-casino-18.json`: 18 Szenenwechsel zwischen Casino und den drei Referenzspielen, zwölf vollständig geladene Teilnehmer und zusätzlicher geladener Dealer im Casino, ein Canvas, keine WebGL-Fehler und stabile Geometrie-/Texturzähler bei wiederholten Besuchen. Der Casinoeinsatz ist in diesem Ressourcenlauf noch leer. Er meldet dort 75 Zeichenaufrufe, 5236 Dreiecke, 32 Texturen und 30 Geometrien.

Die vollständig besetzte Runde mit je zwei Startkarten benötigt im niedrigen Grafikmodus 48/66/78 Zeichenaufrufe für 2/8/12 Teilnehmer. Mit zwölf Teilnehmern sind es 10244 Dreiecke. Der frühere geprüfte Zwölferrundenzustand hatte 114 Zeichenaufrufe und zeigte nur eigene Karten sowie den Dealer. Die Reduktion beruht sowohl auf Batching als auch auf der gezielten Innenraumkomposition; die Darstellungsumfänge sind deshalb nicht identisch.

TypeScript und Produktionsbuild bestehen. Alle sechs Casino- und 17 Adventure-Prüfungen, die sechs Tisch-Browserfälle, beide nativen Audiofälle und die Offline-Spatial-Audioprüfung bestehen ebenfalls. Die vorhandenen Sound-/Dealer-/Emote- und Foto-/Kartenprüfungen bleiben erfolgreich. Die tatsächlichen Desktop-/Mobilbilder der Tischrunde, Aufdeckung und Auszahlung wurden angesehen.

Bei der Bildkontrolle überlagerte die schwebende Tischanzeige den Dealer. Sie liegt deshalb jetzt auf der freien Filzfläche zwischen Bankmatte und eigener Hand. Die letzte Fassung besteht auf 1440/390 Pixeln mit zwölf Teilnehmern erneut, einschließlich beider Wiederbeitrittszeitpunkte und direkter Aktionen; Bericht: `outputs/qa/casino-table-focused.json`. Der zusätzliche hohe Desktopmodus besteht mit 103 Zeichenaufrufen und 20282 Dreiecken; Bericht: `outputs/qa/casino-table-high-focused.json`. Die gemeinsamen Beträge und direkten Aktionen bleiben auf beiden Grafikstufen gleich.

## Verbleibende Abnahme

Die folgende Farbwechsel-Ausarbeitung verwendet die gleiche Rendertechnik über `printed-card-batch.ts`. Casinodruck, Dealerphase und Chiptransfer bleiben im eigenen Modul. Alle sechs Casino-Node-Prüfungen und beide gezielten Zwölf-Spieler-Browserfälle auf Desktop/Touch bleiben nach dieser Extraktion erfolgreich. Der neue Ressourcenlauf über 18 Wechsel zwischen Baumrunde, Casino und Kaufhaus zeigt ebenfalls stabile Zähler; siehe `COLOR-CARD-TABLE.md`.

Die Browserprüfungen verwenden Chromium mit SwiftShader und koordinierte Engine-Fixtures. Sie beweisen keine physischen Geräte-FPS, keine vollständige Prozessspeichergrenze und keine reale Live-Netzwerk-Olympiade. Web-Audio-Messungen ersetzen keine Hörabnahme auf Lautsprechern und Kopfhörern. Längere Kartenszenarien, sämtliche Ergebnisvarianten, weitere Casino-Umgebungsaktionen, reale Mobilgeräte und vollständige Unterbrechungs-/Mehrbrowserabläufe bleiben Teil der offenen Disziplinabnahme. Reise, soziale Aufenthaltsbereiche, die übrigen Disziplinen und die Gesamtveröffentlichung bleiben ebenfalls offen. Diese Arbeit ist lokal und unveröffentlicht.
