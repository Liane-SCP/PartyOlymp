# Budget-Bande: Kasse, Maßstab und gemeinsamer Scan

Die nachfolgende gemeinsame Bonwand, individuelle Leseansicht und ihre aktuellen Nachweise stehen in [BUDGET-RECEIPTS.md](BUDGET-RECEIPTS.md). Die unten beschriebenen Zahlen bleiben die historischen Stände der Kassenüberarbeitung.

Die Selbstscan-Station verwendet jetzt einen Kassenterminal mit tatsächlichem Kenney-Monitor und passender Tastatur, Kassenschublade, Scanner mit Lichtstreifen, Förderband und Packfläche. Eine vorhandene Kenney-Papiertüte ergänzt den Abschluss. Die Bildschirmfläche des Terminals zeigt während der öffentlichen Auflösung dieselbe laufende Summe wie die große Anzeige. Vorher bleibt sie auf „Bereit“.

Die beiden neu übernommenen Modelle kommen aus dem bereits heruntergeladenen Kenney Furniture Kit 2.0, dessen beiliegende Lizenz ausdrücklich CC0 nennt. `prepare-adventure-assets.mjs` übernimmt die originalen GLBs, erhält ihre Palettentexturen und führt Quelle, Autor, Lizenz, Hash, Größe und Dreieckszahl im bestehenden Manifest fort. Monitor und Tastatur ergänzen zusammen 9.880 GLB-Bytes und 104 Dreiecke. Es werden keine zusätzlichen Pakete oder Laufzeit-Downloads fremder Modellplattformen benötigt.

## Proportionen und Bildausschnitt

Die Oberkante der bisherigen Theke lag bei 2,14 Welteinheiten und damit über den Figuren. Sie liegt jetzt bei 1,12; die vorhandenen Boss-Figuren bleiben unverändert bei ungefähr 1,2 Einheiten Höhe über ihrem Bodenstand von 0,3. Monitor, Tastatur, Förderband, Scanner und Warenauflage wurden dazu passend platziert. Der persönliche Korb wurde ebenfalls verkleinert und auf den Boden gesetzt.

Die eigene Kassenkamera berechnet den Abstand aus dem tatsächlichen Seitenverhältnis und dem vollständigen Kassenbereich einschließlich Beschilderung und Kundenplatz. Sie berücksichtigt auch den Übergang vom allgemeinen Kaufhausblick zur Kasse. Nach dem gemeinsamen Abschluss kehrt die Darstellung zur Übersicht zurück.

Summe und Budget stehen während des Scans zusätzlich groß im vorhandenen Bühnenhinweis. Der zuletzt gescannte Artikel wird mit Preis und Artikelzahl genannt; lange Namen werden in diesem Hinweis gekürzt. Vollständige Produktnamen und Bons bleiben in den bestehenden Listen verfügbar. Überschreitet bereits die laufende Summe das Budget, wird der Hinweis entsprechend gefärbt. Die eigentliche Wertung bleibt unverändert serverseitig.

## Eine gemeinsame, wiederaufnehmbare Folge

Scanzahl, Kundenfortschritt, Warenpositionen und Kundenposition werden aus derselben öffentlichen `revealStartedAt`-Zeit berechnet. Ein anderer Grafikrhythmus und ein Wiederbeitritt müssen deshalb nicht erst eine lokale Bewegungsgeschichte nachholen. Die öffentlichen Artikelpositionen werden direkt aus der gemeinsamen Zeit gesetzt; die persönliche private Auswahl behält ihre lokale Einpackbewegung.

Der aktive Artikel fährt über den Scanner. Wartende Artikel liegen in einer kleinen Zuführung, gescannte Artikel wechseln in ein Raster auf der Packfläche. Bis zu zehn ausgewählte Artikel passen mit ihren tatsächlichen Bildproportionen auf die Theke. Der visuelle Förderfortschritt läuft noch etwas über den letzten Zählschritt hinaus, damit auch der letzte Artikel die Packfläche erreicht. Der angezeigte Scanzähler bleibt auf die tatsächliche Artikelzahl begrenzt.

Die Scannerbeleuchtung folgt ausschließlich dem öffentlichen Scan. Reduzierte Bewegung lässt Bogen- und Übergangsbewegungen entfallen. Leerer Korb, Überschreitung, knapper Einkauf, normaler Erfolg und gemeinsame Zusammenfassung bleiben getrennte Ergebnisse. Ein leerer Korb erhält eine „Oops“-Reaktion statt eines persönlichen Jubels.

Die vorhandene Dauer mit 800 ms Ankunft und höchstens 14 Sekunden gemeinsamer Kundenfolge bleibt erhalten. Es wird keine zusätzliche Spielwartezeit eingeführt. Preise, fremde Körbe und Summen werden vor der erlaubten öffentlichen Phase nicht in diese Darstellung übernommen. Auch ein verbliebenes altes Reveal darf die private Auswahl nicht beeinflussen.

## Prüfung und verbleibender Umfang

`test-checkout-layout.mjs` prüft den vollständigen Kameraausschnitt für verschiedene Seitenverhältnisse und Winkel, den Thekenmaßstab, zehn passende Packpositionen einschließlich des letzten Artikels sowie gleiche sichtbare Waren-/Kundenpositionen bei verschiedenen Frame-Geschichten. Die private Folge muss alte öffentliche Werte und die Tüte zurücksetzen.

`check-checkout-layout.mjs` verwendet tatsächliche Spiel-Engine-Fixtures mit 2/8/12 Teilnehmern bei 1440 und 390 Pixeln. Zwei Ansichten vergleichen dieselben gerenderten Waren- und Kundenpositionen, zehn gescannte Artikel, Überschreitung, knappen Einkauf, Wiederbeitritt, Zusammenfassung und Reset. Die tatsächlichen Modellbreiten werden nach dem GLB-Laden geprüft. Kontrollierte Preise und eine eingefrorene gemeinsame Uhr machen diese Aussagen reproduzierbar; es ist keine vollständige reale Netzwerk-Olympiade.

Der abschließende Lauf besteht in allen sechs Fällen. Desktop- und Mobilbilder wurden auf Maßstab, Ausschnitt, Terminalfläche und lesbare Summen kontrolliert. Die zwei bestehenden Warenkorb-/Kassen-/Reset-Abläufe und die sechs Referenzmoment-Fälle bestehen ebenfalls. Der erneute Ressourcenlauf über 30 Szenenwechsel besteht mit zwölf geladenen Avataren, vollständig geladenen Produktbildern im Kaufhaus, genau einem aktiven Canvas und stabilen Geometrie-/Texturzählern. TypeScript, Produktionsbuild sowie die drei neuen, 17 Adventure- und sechs Referenzmoment-Node-Prüfungen bestehen.

Die sparsame Kaufhausübersicht meldet dabei 163 Zeichenaufrufe, 4.226 sichtbare Dreiecke, 51 Texturen und 63 Renderer-Geometrien. Das Ziel von höchstens 100 Zeichenaufrufen aus der Designmatrix ist damit noch nicht erreicht. Die Stabilitätsprüfung darf deshalb nicht als abgeschlossene Performance-Abnahme gelesen werden; weitere Bündelung der vorhandenen Modelle bleibt erforderlich.

Anschließende statische Zusammenfassung: Der erste vollständig geladene Nachtest meldet 143 Zeichenaufrufe bei weiterhin 4.226 Dreiecken und 51 Texturen, jetzt 61 Renderer-Geometrien. Umsetzung und Nachweise stehen in `SCENE-BATCHING.md`; das Ziel von 100 bleibt offen.

Nachfolgende Warenflächen-Überarbeitung: `SHOPPING-DISPLAYS.md` dokumentiert den aktuellen Stand von 86 Zeichenaufrufen in der vollständig geladenen Übersicht und 96 mit vollem privaten Korb. Die vorherigen Zahlen 163/143 sind historische Zwischenstände. Die aktuelle niedrige Übersicht meldet 4.226 Dreiecke, 32 Texturen und 43 Geometrien. Die nachfolgenden Kassenprüfungen überwachen zusätzlich das Draw-Call-Budget bei zehn eingepackten Artikeln in beiden Ansichten.

Die Renderer-Prüfung verwendet Chromium/SwiftShader. Bilder und Ergebnisdaten liegen unter `outputs/qa/checkout-layout-*` und `outputs/qa/checkout-layout.json`. Echte Geräte-FPS, Eingabelatenz, Prozessspeicher, vollständige Mehrbrowser-Partien, weitere Kaufhaus-/Gruppeninszenierung, Klangabstimmung und das vollständige Abenteuer bleiben offen. Budget-Bande wird hierdurch nicht als fertig erklärt. Der Stand bleibt lokal und unveröffentlicht.
