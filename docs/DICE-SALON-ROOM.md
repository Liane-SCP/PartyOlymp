# Würfelsalon: eine zusammenhängende Würfelstube

Der Würfelsalon besitzt jetzt einen eigenen holzvertäfelten Raum mit dunkler grüner Wand, zwei gerahmten Seitenfenstern, gebundenen Vorhängen, Kamin mit Mantel und Holzscheiten sowie einer Würfelplakette über dem Feuer. Eine Bücherwand und eine kleine Erfrischungsecke mit Tischlampe, Becher und Brot vervollständigen den gemeinsamen Spieleabend.

`createSalonRoom` komponiert diese Einrichtung um die bestehenden Tischplätze. Die Raumhalbbreite beträgt Tischradius X plus 4,2 Einheiten; die Raumhalbtiefe Tischradius Z plus 4,6. Damit ist die kleine Zweiergruppe nicht mehr in den unverändert großen Zwölferraum gestellt. Der tatsächlich importierte Teppich wird ebenfalls auf die Tischgröße angepasst. Tisch, Sitze, Figurenidentitäten, persönliche Becher, bestätigte Augenwürfel und Halteablagen behalten ihre bisherigen Spielpositionen und Regeln.

## Modelle und Gestaltung

Die vorhandenen tatsächlich heruntergeladenen Modelle aus Kenneys Furniture Kit und Food Kit werden weiterverwendet. Zusätzlich zur bisherigen Salonausstattung werden die bereits im Projekt lizenzierten Modelle `furniture/bookcaseClosedWide`, `furniture/lampWall` und `food/bread` in den Raum integriert. Die lokale Furniture-Kit-Lizenz weist Kenney und CC0 aus; Quellen, Prüfsummen und Lizenzen bleiben im bestehenden Assetmanifest beziehungsweise unter `public/adventure-models/` dokumentiert.

Architektonische Verkleidung, Dielenfugen, Kaminsockel, Steine und Würfelplakette sind eigene einfache Spielgeometrie. Die vorhandenen Möbel bilden die eigentliche Einrichtung. Der Raum verwendet dieselbe stilisierte Farb- und Materialfamilie wie die Teilnehmerplätze. Die bisherige kühle allgemeine Raumbeleuchtung erhält nur für den Salon eine wärmere Hauptfarbe und zurückgenommene Gegenbeleuchtung.

Die Fenster bleiben seitlich des Kamins; Wandlampen sitzen außerhalb der Fensterflächen. Vorderseite und rechte Wand bleiben als bespielbarer Ausschnitt offen. Die Bücher- und Erfrischungsecke sowie der Kamin liegen außerhalb aller Tischplätze. Es hängt keine zusätzliche Lampe über den bedienbaren Würfeln, die diese bei der Nahkamera verdecken könnte.

## Bewegung und Renderaufwand

Das Feuer besitzt drei kleine Flammen mit einer gemeinsam genutzten Kegelgeometrie und zwei warmen emissiven Materialien. Eine geringe Skalierungsvariation folgt der vorhandenen Serverzeit; reduzierte Bewegung zeigt eine feste Pose. Das Feuer erzeugt keine zusätzliche Lichtquelle, keine Partikelwolke und keinen Schattenpass. Es löst keine Spielaktion oder Zusatzwertung aus.

Statische Architektur und Möbel werden mit dem vorhandenen Batching zusammengefasst. Nur die drei Flammen bleiben aus der statischen Zusammenfassung ausgeschlossen. Eigene Geometrien und Materialien gehören dem Raum, importierte Geometrien weiterhin dem vorhandenen gemeinsamen Modellbesitzer. Der Szenenabbau gibt beide über ihre bestehenden Besitzgrenzen frei.

Die Modellvorbereitung ist neu generiert: zwölf unterschiedliche GLBs mit insgesamt 125.904 Byte statt zuvor neun mit 88.468 Byte. Sämtliche 21 Vorbereitungspläne bestehen weiterhin ihre Dateigrößen-/Budgetprüfung.

## Prüfungen und Bilder

Die neun bestehenden Würfelplatzprüfungen und die fünf Vorbereitungstests bestehen. TypeScript und Produktionsbuild bestehen; die vorhandene Chunkgrößenwarnung bleibt sichtbar.

Die vier bestehenden Zweier-/Zwölferabläufe bei 1440/390 Pixeln in Sparsam bestehen: echte Becher-/Halteaktionen, gemeinsam bestätigter Wurf, Wiederbeitritt, öffentliche Augen, eigener Platz, Gruppen-/Nahansicht, Reset und der vorhandene Zuschauerfall. Die erfassten Draw-Call-Momentaufnahmen betragen 56/39, 56/40, 66/38 und 66/35 für Gruppen-/Nahansicht. Log `outputs/qa/salon-room-low.log`; aktueller Bericht `outputs/qa/dice-crew-low.json`.

Auch die vier hohen Grafikabläufe bestehen mit denselben Eingaben und Zustandsprüfungen. Die Draw-Call-Momentaufnahmen betragen 93/76, 93/77, 103/75 und 103/72 für Gruppen-/Nahansicht. Log `outputs/qa/salon-room-high.log`, Bericht `outputs/qa/dice-crew-high.json`. Dies sind erfasste Szenenzustände, keine Höchstwerte für jede Animation oder Kamerarichtung.

Die tatsächlichen Gruppenrenderbilder für zwei und zwölf Teilnehmer bei 1440 Pixeln sowie zwölf Teilnehmer bei 390 Pixeln in Hoch wurden visuell kontrolliert. Kamin, Fenster, Möbel und Tisch bilden einen zusammenhängenden Raum; die bedienbaren Plätze bleiben frei.

`outputs/qa/salon-room-shaders.json` prüft zusätzlich die endgültige Szene in Hoch bei 1440 Pixeln mit zwölf Teilnehmern und Sparsam bei 390 Pixeln mit zwei Teilnehmern. Die Shaderprogramme bleiben von der Vorbereitung zum ersten sichtbaren Frame unverändert bei 14 beziehungsweise 10. Der Canvas wird anschließend tatsächlich freigegeben; keine erfassten Browserfehler.

`outputs/qa/salon-room-preparation.json` besteht für Salon und Kraken einschließlich beider Datensparvarianten. Die neue Würfelstube übernimmt alle zwölf GLBs / 125.904 Byte ohne erneute GLB-Anfrage beim Eintritt, auch mit deaktiviertem HTTP-Cache. Die Szenenmodule sind ebenfalls vor dem Eintritt bereit. Datensparen unterbindet die spekulative Vorbereitung; der reguläre Bedarfslader bleibt verfügbar. Keine erfassten Browserfehler.

Zwei viersekündige warme Hardwarefenster mit zwölf Figuren und 60 bereits bestätigten Würfeln verwenden die native Seitenaufteilung, hohe Grafik und die tatsächliche RTX 4080 SUPER über D3D11. Bericht `outputs/qa/salon-room-hardware.json`:

| Fenster | Tatsächlicher Renderpuffer | rAF-Proben | rAF-p95 | Größter Abstand | Spiel-Frame-p95 | Draw Calls |
|---|---|---:|---:|---:|---:|---:|
| 1920 × 1080 | 1040 × 485 | 241 | 16,8 ms | 16,8 ms | 16,8 ms | 103 |
| 390 × 844 | 364 × 320 | 241 | 16,7 ms | 16,8 ms | 16,7 ms | 103 |

Kein gemessener Abstand über 33 ms und keine erfassten Browserfehler. Diese Messung enthält den geladenen Gruppenzustand, keine frische Wurfspitze, keine hörbare Klangabnahme und keinen Kaltstart-/Eingabelatenzvergleich. Auch das schmale Fenster verwendet dieselbe Desktop-GPU und belegt keine Mobilgeräte-Leistung.

Diese Nachweise verwenden Engine-Fixtures mit koordinierten HTTP-Snapshots und geschlossenem Live-WebSocket. Sie ersetzen keine vollständige Live-Partie, physische Mobilgeräte-, Hör-, Langzeit- oder Prozessspeicherabnahme. Weitere Figuren-/Ergebnis-/Klanginszenierung, andere Gruppengrößen in echten Partien und die vollständige individuelle Ausarbeitung aller 21 Disziplinen bleiben offen. Keine neue Veröffentlichung.
