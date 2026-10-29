# Olymparty – Übergabe und offene Arbeiten

Stand: 18.10.2026. Die Entwicklung wurde für diese Übergabe beendet. Das vollständige Qualitätsziel für alle 21 Disziplinen ist noch nicht erreicht. Die aktuellen Änderungen wurden nicht veröffentlicht; die gehostete Seite bleibt auf Version 46.

## Ziel

Ein zusammenhängendes 3D-Gameshow-Abenteuer für 2–12 Spieler: abwechslungsreiche Regionen und Reisewege statt einer monotonen Insel-Schlangenlinie, glaubwürdige individuelle Spielorte, sichtbar mitspielende Originalfiguren, verständliche Aktionen, gemeinsame Spannung und hochwertige Kamera-, Effekt- und Klanggestaltung. Würfeln findet am gemeinsamen Tisch statt, Einkaufen im Kaufhaus; jede andere Disziplin soll ebenso konsequent räumlich umgesetzt werden. Nintendo/Mario Party dienen als Orientierung für Verständlichkeit und Sorgfalt; Welt und Figuren bleiben eigenständig. Low-Poly-Modelle aus dem Netz müssen stilistisch passen, optimiert und mit nachvollziehbaren Lizenzen/Credits eingebunden sein.

Verbindliche Gestaltung: [docs/BESPOKE-ADVENTURE.md](docs/BESPOKE-ADVENTURE.md). Ausführlicher Implementierungsstand und einzelne Nachweise: [docs/ADVENTURE-STATUS.md](docs/ADVENTURE-STATUS.md).

## Zuletzt abgeschlossen

- Vollständige Crew im Finale, gemeinsame Podeste bei Gleichstand und Teilnehmerwahl: [CEREMONY-CREW.md](docs/CEREMONY-CREW.md).
- Gemeinsame Revanche, reservierte Plätze, Spieler-/Zuschauerwechsel und erneute Bereitschaft: [REMATCH-CREW.md](docs/REMATCH-CREW.md).
- Privates Jurybuch der Kopf-Auktion mit Seiten, Enthaltungen und wiederherstellbaren Entwürfen: [AUCTION-JURY.md](docs/AUCTION-JURY.md).
- Gemeinsamer Würfelblattvergleich mit Bonus, räumlichen Platzkarten und erneut aufrufbarem Spielrückblick: [DICE-RESULTS.md](docs/DICE-RESULTS.md).
- Lokale Runtime gezielt auf `workerd 1.20261012.1` festgelegt. Bisheriger SDK-Stand und Kompatibilitätsdatum bleiben erhalten. Der ursprüngliche lokale Abschlussfehler tritt in den wiederholten Vergleichsfällen nicht mehr auf: [REALTIME-RUNTIME-UPDATE.md](docs/REALTIME-RUNTIME-UPDATE.md).

Letzter lokaler Nachweis auf Windows x64 / Node 22.16.0: Build und Typprüfung erfolgreich, 22 Engine-Tests bestanden, 36 isolierte plus vier ursprüngliche Socket-Diagnosefälle ohne Hang-Meldung, 21 echte Anwendungs-Verbindungsabläufe sauber, 19 ausgelieferte Dateien mit korrekten Build-Bytes. Eine echte Zweier-Würfelpartie lief über 13 Züge in 109,102 Sekunden einschließlich Wiederbeitritt in Zug 6, Schutz gegen doppelte/veraltete Aktionen, Blattvergleich und Gesamtwertung. Endwerte 26/43, ein Historieneintrag, alle 137 Aktionen bestätigt und keine gemeldeten Browserfehler. Die Vorschau wurde beendet und ihr Abschlussprotokoll ohne Fehlermarker ausgewertet. Dies ersetzt keine Gesamtfreigabe.

## Wichtigste nächste Arbeiten

Reihenfolge der gestalterischen Fertigstellung: Würfelwerk, Budget-Bande und Typeracer als vollständig abgenommene Referenzen für Tischspiel, Einkaufsort und Rennen abschließen; anschließend alle übrigen Disziplinen auf dasselbe Niveau bringen. Die vorhandene Implementierung dieser drei ist noch keine vollständige Referenzabnahme.

1. **Vollständige reale Olympiade:** alle 21 Disziplinen in gemischten Abläufen mit zwei und zwölf Teilnehmern sowie Zuschauern prüfen. Reise, Zwischenwertung, Bosskämpfe, Finale und Revanche einschließen; unabhängige Browser verwenden.
2. **Netzwerk und Privatsphäre:** Neuladen, Wiederbeitritt, vorhandene Hostwechselregeln, verspätete/doppelte Aktionen, Verbindungsabbrüche, Zeitabläufe und Rollenwechsel prüfen. Private Karten, Ziele, Antworten und Juryentscheidungen dürfen nicht vorzeitig bei anderen Clients ankommen. Auch gehostet testen.
3. **Reale Geräte und Performance:** 60 FPS auf Desktop, 30 FPS auf mittleren Mobilgeräten als Ziel. Physisches Smartphone, Bildschirmtastatur, Hoch-/Querformat, kalter Cache und langsames Netz prüfen. Ladezeiten, Eingabelatenz, Draw Calls, GPU- und Prozessspeicher messen. Kurze Desktop-Stichproben ersetzen diese Prüfung nicht.
4. **Individuelle Spielqualität:** die folgende Tabelle abarbeiten, echte Abläufe visuell prüfen und Nachweise dokumentieren. Einführung, Figurenaktionen, Spielhöhepunkt und Auswertung sollen zusammenpassen.
5. **Soundabnahme:** mit Kopfhörern und Lautsprechern Musik, Umgebung, Aktionen und Emotes abstimmen. Browser-Audiofreigabe, Stummschaltung, Wiedereinstieg und Hintergrundtabs prüfen. Keine unbeabsichtigten Lösungshinweise, insbesondere bei Zeitgefühl.
6. **Gesamtabnahme und Veröffentlichung:** alle Anforderungen einzeln belegen; erst anschließend die fertige Fassung veröffentlichen. Offene Live-, Geräte- und Langzeitprüfungen ausdrücklich offen lassen.

## Offene Arbeit je Disziplin

Die genannten Orte und Kernmechaniken existieren bereits. Die Tabelle beschreibt verbleibende Ausarbeitung, keinen Neubau. Für **alle 21** bleiben vollständige Gruppen-, Geräte-, Hör-, Langzeit- und Live-Mehrbrowser-Abnahmen erforderlich.

| Disziplin | Vorhandene Grundlage | Konkret noch ausarbeiten / prüfen |
|---|---|---|
| Würfelwerk | Würfelstube, Tischplätze, Becher, Haltewürfel, Wertungsblätter und Ergebnisvergleich | Figuren-, Gruppen- und Klanginszenierung; weitere reale Gruppengrößen, Sonderwertungen und Gleichstände. |
| Budget-Bande | Kaufhaus, Abteilungen, Angebote, private Körbe, Selbstscankasse und Bonwand | Abteilungsnavigation und Kundenaktionen verfeinern; längere Einkäufe, Mobilbedienung und Bonlesbarkeit. |
| Typeracer | Küstenstrecke, Fahrzeuge/Figuren, Mitfahrkamera, Motoren und Fotofinish | Streckenleben, Zieleinlauf und Ergebnisreaktionen; vollständige Mehrbrowser-Rennen, Eingabelatenz und Bildschirmtastatur. |
| Club 21 | Casinosaal, Dealer, private Hand, Einsätze, Kartenaktionen und Chipauszahlung | Gruppen-/Sonderformataktionen; längere Karten- und Ergebnisverläufe, Lesbarkeit und Klangbalance. |
| Farbwechsel | Baumhausclub, räumliche Karten, große Handansicht, Ablage und Jokerbestätigung | Räumliche Ergebnisrangfolge; Extremhände, Zeitlimits, Unterbrechungen und Screenreader-Ablauf. |
| Codeknacker | Schlossmacherwerkstatt, Farbmechanismen, private Werkbank und Tresoröffnung | Figuren, Ergebnisse und Klang; längere Rätselverläufe und Wiederbeitritt. |
| Kopf-Auktion | Auktionssaal, Gastgeber, Paddel, Bühnenauftritt und privates Jurybuch | Publikum/Figuren stärker beteiligen; öffentliche Ergebnisinszenierung, Klang und vollständige Gruppenauktionen. |
| Zeitgefühl | Observatorium, Messstationen, stille Messphase und Sternentafel | Figuren und Ergebnisse inszenieren; unbeabsichtigte Taktgeber und reale Eingabelatenz prüfen. |
| Bombenwort | Erfinderwerkstatt, Bombenübergabe, geheime Zündzeit und Wortbewertung | Figuren-/Ergebnisreaktionen und Klang; Tastatur, Zuschauerplätze und Übergaben unter Latenz. |
| Kategorien-Kette | Flussschlucht, Expeditionsstationen, wachsender Wortpfad und Fähre | Landschaft und Figurenaktionen; Wortprüfung, Touch-/Tastaturfluss und lange reale Ketten. |
| Stadt Land Fluss | Ideenatelier, private Arbeitshefte mit Entwurfswiederherstellung und gemeinsame Bewertung | Arbeitsplätze, Figuren und Klang; Eingabe/Lesbarkeit mit zwölf Teilnehmern und vollständige Bewertungsrunden. |
| Weltreise | Navigationswerkstatt, Panoramen, Karte, 3D-Globus, private Pins und Ergebnisrouten | Arbeitsplätze und Ergebnisse inszenieren; Karten-/Panorama-Lesbarkeit, Kaltstart und lange Gruppenrunden. |
| Hivemind | Picknickgarten, private Antworten und verknüpfte Antwortgruppen | Figuren, Gruppenergebnisse, Umgebung und Sound; gleiche/verschiedene Antworten in großen Gruppen. |
| Spectrum | Messpavillon, Skulpturen, private Ziele, Hinweis- und Skalenbedienung | Arbeitsplätze, Figuren und Ergebnisauftritt; Hinweise, Geheimhaltung und Gruppenauswertung. |
| Wiki-Sprint | Bibliothek, echte Wikipedia-Artikel, Navigation und Pfadfortschritt | Figuren, Zielankunft und Ergebnisse; sehr lange Artikel, Dienstfehler und vollständige Mehrbrowser-Rennen. |
| Pixelblitz | Fotostudio mit Kamera/Lichttechnik, gemeinsamer Enthüllung und exklusivem Buzzer | Figuren, Auflösung und Klang; Tastaturablauf und echte gleichzeitige Buzzeraktionen. |
| Farbgedächtnis | Pigmentmanufaktur, private Mischpulte, neutrale sRGB-Vergleiche und Ergebniswahl | Arbeitsplätze, Glas/Figuren und Ergebnisse; Farbvergleich auf realen Displays und Grafikprofilen. |
| Größengefühl | Maßstabsmuseum, Modelle, Messgriffe und Ergebnisgalerie | Exakte Modell-/Messanker; Maßstabslesbarkeit, Messstationen, Klang und Bildschirmtastatur-Unterbrechungen. |
| Würfelkoloss | Tempelboss, persönliche Runen, Haltewürfel, Ladungsringe und Salven | Tempel, Phasen, Gruppenreaktionen, Einführung und Finale; echte Gruppenkämpfe und Klangdramaturgie. |
| Krakensturm | Schiff, Kanonen, Kraken, Timing und sichtbare Salven/Fehlschüsse | Takelage, Sturm/Wellen, Phasen, Einführung und Finale; vollständige Gruppenkämpfe und Gerätesound. |
| Münzdrache | Drache, persönliche Preisaltäre, Risikotruhen und gemeinsame Münzsalve | Hort, Figurenreaktionen, Phasen, Einführung und Finale; Preis-/Risikorunden, Gruppenkämpfe und Klang. |

## Welt, Gemeinschaft und Bedienung

- [ ] Regionen, Landmarken und Spielorte räumlich verständlich verbinden; Anordnung, Höhen und Silhouetten abwechslungsreich gestalten.
- [ ] Boot, Fähre, Luftschiff und Wege auf die tatsächlichen Orte abstimmen. Gemeinsame Ankunft, Orientierung und Ruhephasen zwischen Höhepunkten ausarbeiten.
- [ ] Originalfiguren konsequent beteiligen: passende Sitz-/Stehplätze, Blickrichtungen, Aktionen, Erfolg, Fehlversuch und gemeinsamer Jubel. Zwölf Teilnehmer müssen lesbar bleiben.
- [ ] Vorhandene Plaza-, Bewegungs- und Emote-Funktionen im gesamten Ablauf prüfen und aufwerten; Wartezeiten unterhaltsam überbrücken.
- [ ] Pro Spiel kurze Einführung, sichtbares Ziel, klare eigene Aktion und verständliche Auswertung sicherstellen.
- [ ] Desktop-/Hochformatkameras prüfen: eigener Arbeitsplatz und gemeinsame Aktion sichtbar, keine verdeckten Gesichter oder Bedienelemente. Reduzierte Bewegung und Kamererschütterungen berücksichtigen.
- [ ] Tastatur, Touch, Fokus, Screenreader-Fassung, Farbalternativen und Trefferflächen in allen Phasen prüfen. Vorhandene Zugänglichkeitsfunktionen vollständig verifizieren.
- [ ] Modellmaßstäbe, Materialien, Licht, Schatten und Effekte abstimmen. Zusätzliche Netzmodelle gezielt auswählen, optimieren und lizenzieren; Credits erreichbar halten.

## Technik und Abnahme

Verbindliche Prüfparameter aus der Designmatrix: **2/8/12 Spieler**; Desktop-Referenz Windows mit integrierter Iris-Xe-Grafikklasse bei 1080p, Mobil-Referenz Android mit Snapdragon-778G-Klasse bei 390 CSS-Pixeln. Entwicklungsbudgets: höchstens 180/100 sichtbare Draw Calls und 250.000/100.000 sichtbare Dreiecke bei hoher/niedriger Qualität, ein schattenwerfendes Licht und möglichst höchstens 5 MB komprimiertes Szenenpaket ohne bestehende Rätselbilder. P95-Bildzeit, Eingabelatenz, Ladevolumen und Ressourcen nach mindestens 30 Szenenwechseln protokollieren. Diese Vorgaben sind Ziele, keine bereits erreichten Messwerte. Niedrige Qualität darf keinen spielerischen Nachteil oder abweichenden Informationsstand erzeugen.

- [ ] Alle Szenen-/Materialvarianten und lange Ladefolgen prüfen; vorhandene gemeinsamen Ressourcen, Instancing, Vorladen und Qualitätsstufen weiter nutzen.
- [ ] Prozessspeicher über lange Partien beobachten. Szenenwechsel müssen Texturen, Renderer, Audio, Event-Listener und Socket-Verbindungen sauber freigeben.
- [ ] Grafikwechsel, Hintergrundtab, Context-Verlust, Wiedereinstieg und reduzierte Darstellung über mehrere Disziplinen prüfen.
- [ ] Gehostete Sitzungen einschließlich Fehlerprotokollen prüfen. Der lokale Windows-Runtime-Nachweis gilt nicht automatisch für andere Plattformen oder die Produktion.
- [ ] Pro Spiel echte Screenshots und Prüfergebnisse mit Teilnehmerzahl, Gerät, Grafikmodus und Grenzen festhalten.

Aktuelle Berichte liegen unter `outputs/qa/`: `realtime-targeted-dice-live.json`, `realtime-targeted-close.json`, `realtime-targeted-minimal.json`, `realtime-targeted-legacy-probe.json`, `realtime-targeted-assets.json` und `realtime-targeted-runtime-audit.json`. Das Abschlussprotokoll enthält keine Fehlermarker; seine leere Ausgabe ist nur zusammen mit den Browser-/HTTP-Nachweisen aussagekräftig.

Einstiegsskripte in `scripts/`: `check-dice-live-session.mjs`, `check-realtime-close.mjs`, `check-realtime-half-open.mjs`, `check-runtime-assets.mjs` und `audit-runtime-log.mjs`. Details und Prüfgrenzen stehen in [REALTIME-RUNTIME-UPDATE.md](docs/REALTIME-RUNTIME-UPDATE.md). Der Arbeitsbaum enthält umfangreiche bestehende Änderungen; vor Fortsetzung den aktuellen Quellstand und die jeweilige Disziplinkapitel lesen.

## Definition von fertig

Jedes Spiel besitzt einen individuellen verständlichen 3D-Ort, passende lizenzierte Dekoration, beteiligte Figuren, zuverlässige Aktionen, lesbare Kameras, abgestimmten Klang und vollständige Ergebnis-/Übergangsinszenierung. Die Reise funktioniert mit 2–12 Teilnehmern auf Desktop und Touch. Privatsphäre, Wiederbeitritt, Performance und lange Sitzungen sind mit realen Abläufen geprüft. Alle Anforderungen aus der Designmatrix sind nachvollziehbar abgenommen; anschließend wird die fertige Fassung veröffentlicht.
