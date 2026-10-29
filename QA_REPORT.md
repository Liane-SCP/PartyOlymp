# Party Olymp – Prüfbericht

Stand: 10. Oktober 2026. Öffentliche URL: https://party-olymp.vividboar4.chatgpt.site.

## Gezielte Prüfungen der Überarbeitung

Nach dem praktischen Nutzerfeedback wurden die Funktionen ausgearbeitet und gezielt geprüft. Vier neue Regelchecks bestätigen gemeinsame Kniffelzüge einschließlich aller 13 Einträge, eine vollständige Schmugglerflotten-Schlacht bei nur einer eingestellten Runde, die Reihenfolge von Lenkpaketen und das Weiterführen alter Spielzustände. Zwei echte lokale WebSocket-Clients bestätigen authentifizierte Zustandsübertragung, Lenkaktionen und Spur-Deltas. Ein lokaler Online-Durchlauf lädt einen vollständigen Wikipedia-Artikel und navigiert über einen servergeprüften Link weiter. Zehn neue Desktop-/Mobilansichten prüfen Kniffel, Amazon-Produkte, Flotte, verschiebbare und skalierbare Größenobjekte sowie die stufenweise Punkteauflösung. Die Browserchecks prüfen tatsächlich Mausziehen und den Eckgriff. Es gibt keine JavaScript-Fehler und keinen horizontalen Seitenüberlauf in diesen Ansichten. Die Ansichtsgenerierung erstellt jetzt unveränderliche Momentaufnahmen, damit nachfolgende Engine-Aktionen frühere Ansichten nicht verändern.

Die langen vollständigen Olympiaden wurden für diese Überarbeitung auf Wunsch nicht erneut durchlaufen. Die folgenden Ergebnisse stammen aus dem vorherigen veröffentlichten Stand und sind kein umfassender Nachweis für die neuen Spielregeln oder den neuen Transport. Die gezielten Prüfungen sind mit `check-refinements.mjs`, `check-live.mjs` und `check-look.mjs` wiederholbar. Nach Veröffentlichung sind auch zwei echte WebSocket-Clients unter der öffentlichen URL sowie das Laden eines vollständigen Wikipedia-Artikels und die weitere servergeprüfte Navigation erfolgreich geprüft. Beim ersten Kurvencheck schied der Testfahrer vor der letzten Lenkaktion aus; der anschließende Durchlauf bestätigte die Übertragung. Der direkte Browsercheck machte zusätzlich die zu schnelle zentrale Startkollision sichtbar. Die Startbahnen sind deshalb weiter außen und leicht versetzt; jede Runde erhält zwei Sekunden Puffer, während Eingaben bereits angenommen werden. Ein weiterer öffentlicher Browserdurchlauf bestätigte tatsächliche Raumbeitritte, Bereitschaft, synchronisierten Start und Emotes über die neue Verbindung sowie Refresh, Offline-Wiederverbindung und gespeicherte Audioeinstellungen. Das ersetzt weiterhin keine menschliche Beurteilung der Steuerung über verschiedene Internetanschlüsse.

## Zuvor tatsächlich geprüft

### Automatisierte Spielregeln

20 Tests in `tests/engine.test.ts` erfolgreich. Die Tests prüfen feste Teilnehmerzahlen, Gleichstände, volle Rechengenauigkeit, ungültige Ergebnisse, Gesamtgleichstände, Würfelkategorien und Bonus, Blackjack-Asse, Antwortnormalisierung, CIELAB-Farbabweichung und symmetrische Größenwertung. Weitere Fälle: erreichbare Wiki-Strecken, Dauer-Vorgaben, private Karten und Flotten, Gastgeberrechte, Zuschauer, Emote-Abklingzeit, Zweispieler-Kartenregeln, gleichzeitige Flottentreffer und Kurvenkollisionen, Fristen ohne Eingaben und Wiederbeitrittsfrist.

Die vollständigen Engine-Olympiaden umfassen **2, 8 und 12 Teilnehmer, alle zehn Spiele und jeweils zwei Runden**. Zwischen Zustandsänderungen wird der Raum serialisiert und wieder eingelesen. Ergebnisse werden genau einmal verbucht. Ein eigener Test schützt mathematische Gesamtgleichstände vor Gleitkomma-Rundungsrauschen. Die gespeicherte Punktgenauigkeit bleibt dabei unverändert. Ein zusätzlicher Test prüft, dass nach Ausschöpfung des Inhaltsbestands keine unmittelbar aufeinanderfolgenden Aufgaben oder Warenkörbe wiederholt werden.

TypeScript-Prüfung und Produktionsbuild erfolgreich.

### Öffentlicher Spielserver und reale Datenbank

Die HTTP-Tests verwenden den veröffentlichten Spielserver und dessen tatsächliche D1-Datenbank. Die Teilnehmer sind automatisierte Testclients außerhalb des Produkts. Die Produktoberfläche erzeugt keine simulierten Mitspieler.

| Teilnehmer | Umfang                                   | Ergebnis               | Laufzeit  |
| ---------- | ---------------------------------------- | ---------------------- | --------- |
| 2          | Zehn Spiele, Bilderraten mit zwei Runden | Erfolgreich bis Podium | 305,916 s |
| 8          | Zehn Spiele, Bilderraten mit zwei Runden | Erfolgreich bis Podium | 493,877 s |
| 12         | Zehn Spiele, Bilderraten mit zwei Runden | Erfolgreich bis Podium | 666,052 s |

Die Netzwerkprüfungen kontrollieren parallele Räume, gleichzeitigen Beitritt und Eingaben, idempotente Aktionskennungen, Gastgeberrechte, Zuschauerbeitritt während der Olympiade, private Zustandssichten, fortlaufende Ergebnislisten, korrekte Endpunktesummen und Wiederbeitritt mit derselben Identität. Zusätzlich wurde die Fortsetzung eines bestehenden Acht-Spieler-Raums über eine Veröffentlichung hinweg geprüft. Zwölf gleichzeitig gespeicherte Anwesenheitsmeldungen erzeugen keine neue Raumversion; eine wiederholte Spielaktion verändert diese genau einmal.

Der zusätzliche öffentliche Ausfalltest in `scripts/qa-recovery.mjs` ist erfolgreich: Gastgeber bleibt mehr als 90 Sekunden getrennt, Rolle wird automatisch übertragen, Rückkehr verwendet dieselbe Identität, die abgebrochene Disziplin lässt keine nachträglichen Aktionen zu und ergibt 0 Olympiadenpunkte. Ab der nächsten Disziplin nimmt der Spieler wieder aktiv teil. Vollständiger Durchlauf mit Würfeln und Farbgedächtnis: 214,418 Sekunden.

### Browser, Darstellung und Audio

Zwei unabhängige Chromium-Browserkontexte unter der öffentlichen URL: Desktop mit 1440 × 1000 und Touch-Mobilansicht mit 390 × 844. Geprüft wurden Raumgründung und Einladung, Bereitschaft und Countdown, Spielansicht, Emote-Übertragung zwischen den Kontexten, Wiederbeitritt nach Refresh und automatische Wiederverbindung nach einem künstlich ausgelösten Offline-Zustand. Keine unbehandelten JavaScript-Fehler und kein horizontaler Seitenüberlauf.

Web Audio initialisiert sich nach Nutzerinteraktion mit laufendem AudioContext. Gespeicherte Musiklautstärke und Bewegungseinstellung bleiben nach Refresh erhalten. Die erzeugten Klänge benötigen keine externen Audio-Downloads.

Zusätzliche kontrollierte, aus der echten Spielengine erzeugte Zustandsansichten prüfen alle zehn Spiele, vier Auflösungen, eine Zwölf-Spieler-Lobby und das Podium sowie sechs gleichzeitige Emotes und den Zuschauerzustand der Kurvenarena. Diese Ansichten verwenden feste API-Antworten ausschließlich im QA-Werkzeug; sie sind **Darstellungsprüfungen**, keine zusätzlichen Multiplayer-Nachweise. Die Emote-Leiste liegt außerhalb der scrollbaren Spielfläche. Spielaktionen und Touch-Steuerung sind durch Scrollen erreichbar und werden von der Leiste nicht verdeckt. Nach Ausscheiden sind die Lenkbuttons deaktiviert.

Gerenderte Ansichten wurden zusätzlich visuell betrachtet. Rohprotokolle und PNGs liegen lokal in `outputs/qa`, ohne Sitzungstokens. Der Importcache für Wikipedia und die lokalen QA-Ausgaben werden nicht veröffentlicht.

## Praktische Grenzen und ungeprüfte Fälle

- Die neue Verbindung verwendet WebSockets mit D1 als gemeinsamer Autorität und lokaler Lenkvorhersage. Datenbank- und Netzlatenz beeinflussen die Serverbestätigung weiterhin. Die flüssige Canvas-Darstellung ersetzt keine Netzwerkgarantie; ein neuer breiter Lasttest mit zwölf WebSocket-Spielern wurde nicht durchgeführt.
- Die Browserprüfungen liefen automatisiert auf derselben Arbeitsmaschine. Ein tatsächlicher Spieleabend mit Menschen über unterschiedliche private Internetanschlüsse sowie physische Android- und iOS-Geräte wurde nicht durchgeführt. Safari und Firefox sind nicht separat geprüft.
- Die technische Audioaktivierung ist nachgewiesen. Die subjektive Klangqualität, Lautsprecher und Kopfhörer sowie die Balance einer echten Freundesrunde wurden nicht durch hörende Testpersonen bewertet.
- Die Inhaltsbank ist endlich. Nach Ausschöpfung werden ältere Aufgaben wiederverwendet; unmittelbar aufeinanderfolgende Wiederholungen werden vermieden. Die angegebenen Produktpreise sind ausdrücklich Spielwerte.
- Es wurden keine tage- oder wochenlangen Lasttests und keine absichtliche Überschreitung von Hostingkontingenten durchgeführt. Der Hostingvergleich und die Betriebsgrenzen stehen in `ARCHITECTURE.md`.

## Wiederholen

```powershell
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-engine.mjs
$env:QA_URL='https://party-olymp.vividboar4.chatgpt.site'
$env:QA_FULL='1'
node scripts/qa-network.mjs
node scripts/qa-recovery.mjs
node scripts/qa-presence.mjs
node scripts/qa-browser.mjs
node scripts/qa-views.mjs
```

Playwright muss gemäß README installiert sein. Der vollständige Netzwerktest legt eigene Räume an und kann mit zwölf Teilnehmern länger dauern; sein Testfenster beträgt maximal 30 Minuten pro Raum. `QA_PLAYERS=2,8,12` begrenzt bei Bedarf die ausgewählten Gruppengrößen.


## Weitere Überarbeitung am 10.10.2026

Die früheren langen Olympiadenläufe wurden für diese Änderung nicht wiederholt. Gezielte aktuelle Checks:

- TypeScript ohne Fehler und Produktionsbuild erfolgreich.
- Kurze Enginechecks bestanden: bestehende Kniffel-/Flottenräume, synchronisierte 13 Würfelzüge, volle Ein-Runden-Schlacht und validierte Charakterkombinationen. Die kurzzeitig ergänzten Kurventests wurden zusammen mit der Disziplin wieder entfernt.
- `scripts/check-gameplay.mjs`: Desktop 1440 px und Mobil 390 px für Club 21, Joker-Farbfelder, Flottenplatzierung und getrennte Seekarten, Golden-Gate-Illustration mit wechselnder Referenz. Aktionen geprüft: Joker sendet erst nach Farbwahl, Schuss erst nach Bestätigung, überschneidende Platzierung abgelehnt. Zusätzlich eingebetteter Wikipedia-Link ohne Fragment-Sprung, animiertes Überholen mit Führungsanzeige und unabhängige Charakterauswahl. Keine JavaScript-Fehler oder horizontale Überläufe. Screenshots in `outputs/qa/gameplay-*`.
- `scripts/check-wiki-browser.mjs`: echte Wikipedia-Artikellinks im Browser navigieren über die lokale Worker/D1-Instanz zum nächsten vollständigen Artikel; keine Fragmentnavigation; gewählte Figur und Artikel bleiben nach Refresh erhalten.
- AudioContext, Begrenzung und sofortiges Master-Mute/Unmute erfolgreich geprüft. Der öffentliche Kurvencheck zeigte ein Problem während verzögerter Eingaben; anschließend wurde das Spiel auf ausdrücklichen Nutzerwunsch vollständig entfernt.

Darstellungsfixtures sind keine zusätzlichen Multiplayer-Nachweise. Die subjektive Steuerungs- und Klangqualität bei unterschiedlichen privaten Internetanschlüssen muss weiterhin bei einem echten Spieleabend beurteilt werden.


## Neonkurven entfernt

Die früheren Berichte über zehn Spiele sind historische Prüfergebnisse vor der Entfernung. Aktuell gibt es neun Disziplinen. Die Entfernung betrifft Katalog, Typen, Voreinstellungen, Oberfläche, Spielmodul und Steuerungsprotokoll. Gezielte Migrationstests prüfen aktive alte Räume sowie bereits verbuchte Resultate. Ein breiter neuer Neun-Spiele-Dauerdurchlauf wurde nicht durchgeführt. Die veröffentlichten Wikipedia-Artikellinks und die Figurenpersistenz wurden im echten Browser geprüft.

## Alle neun Modi: Bedienung, Crew und Rückmeldung

- Zehn gezielte Enginechecks in `scripts/check-refinements.mjs`: inklusive tatsächlicher +2-Wirkung und Timeout-Aktion, öffentlicher Club-21-Hände bei weiter verdeckter Dealerkarte, privater falscher Antworten trotz sichtbarem Versuchszähler, Wiki-Gegnerfortschritt und Flotten-Finale ohne abgegebene Schüsse.
- `scripts/check-game-feel.mjs`: alle neun aktiven Spielansichten bei 1440 und 390 Pixeln sowie alle neun Ergebnisansichten. Prüft die Crew-Anzeigen, Null-Eintrag-Bestätigung, Warenkorbauswahl und Wiederherstellung, Größenregler und Pfeiltasten sowie Salvenübersicht. Keine JavaScript-Ausnahmen und kein horizontaler Seitenüberlauf. Bilder unter `outputs/qa/feel-*` wurden für Darstellungskorrekturen betrachtet; insbesondere kompakte Avatare, fünf mobile Würfel in einer Reihe und Größenauflösung.
- Budget-Auflösung verwendet die Serverzeit und setzt nach Neuladen beim bereits erreichten Preis fort. Dieser Wiederbeitritt wird ausdrücklich im Browser geprüft.
- `scripts/check-wiki-browser.mjs`: echte lokale Worker/D1-Sitzung mit Host und Gast. Echte eingebettete Wikipedia-Links funktionieren; eine Gast-Navigation erscheint über WebSocket in der Crew-Anzeige des Hosts. Figur bleibt beim Neuladen erhalten.
- TypeScript und Produktionsbuild erfolgreich. Die Darstellungstests verwenden isolierte Antwort-Fixtures; sie ersetzen keinen vollständigen Neun-Spiele-Netzwerktest. Auf einen weiteren langen Komplettlauf wurde zugunsten der gewünschten Featurearbeit verzichtet.
# Reise zum Olymp – 17.10.2026

## Erweiterter Weltenatlas

- TypeScript, Produktionsbuild und 17 Tests in `scripts/test-journey.mjs` bestanden. Die Atlas-Tests prüfen alle 21 Katalogspiele mit eigenem Thema und physisch vorhandener Geometrie, tatsächlich neunfache Landfläche der Bosse, ausreichende Abstände selbst bei 40 Boss-Inseln, 40 verschiedene Etappen einschließlich wiederholter Spiele, endliche Instanzmatrizen und Raycasting auf die tatsächliche letzte Insel.
- `scripts/check-atlas.mjs`: 1440-Pixel-Desktop, 390-Pixel-Mobil, 40 Etappen und reduzierte Bewegung. Prüft die Anzahl tatsächlich gebauter Inseln, mindestens 610 Pixel Kartenhöhe, Ausrichtung auf einzelne Inseln, Zoom, Mausziehen, vollständige Übersicht, Vollbildgröße, Schließen per Escape und Rückkehr zur Crew. Auf Mobil wird Zwei-Finger-Pinch per echten Browser-Touch-Ereignissen geprüft. Desktopbilder umfassen alle 21 Wahrzeichen, Übersicht und Vollbild; weitere Bilder zeigen Mobil und den 40-Inseln-Atlas.
- Der Atlas verwendet dieselbe persistente Spielauswahl und bestehende Item-/Trophäendaten. `scripts/check-journey.mjs` prüft weiterhin Reliktwahl, Neuladen, Truhen und Bonusdarstellung sowie WebGL-Ausfall. An der Punktevergabe und den Minispielregeln wurde für den größeren Atlas nichts geändert.
- Die Browserbilder liegen unter `outputs/qa/atlas-*`. Darstellung wurde anhand tatsächlicher Renderbilder geprüft; nach der Bildkontrolle wurden die Statue vor das Tempeldach gerückt, der mobile Ausschnitt vergrößert, die Übersicht anhand der projizierten Weltgrenzen eingepasst und das Wolkenmeer weich gestaltet. Chromium/SwiftShader ist kein Nachweis gleicher Bildrate auf allen realen Mobilgeräten.

- TypeScript und Produktionsbuild erfolgreich. `scripts/test-engine.mjs`: 22 bestehende Tests inklusive vollständiger Engine-Olympiaden mit 2, 8 und 12 Spielern bestanden.
- `scripts/test-journey.mjs`: 14 Tests für eigene und fremde Inventare, Einsatzfristen, einmaligen Verbrauch, alle drei Reliktwirkungen inklusive Bossfaktor und ungültiger Ergebnisse, einmalige Wertung, gespeicherte Truhen, Kapazität, Revanche, Gleichstände sowie endliche 3D-Geometrie auf Routen mit 1 bis 40 Spielen und die Kamerapositionen.
- `scripts/check-journey-network.mjs`: echter lokaler Worker und D1, zwei unabhängige Spieler, drei vollständig abgeschlossene Hivemind-Disziplinen. Reliktverbrauch, private Inventare, wiederholte Aktionskennungen, Bonuswertung (62,5 statt 50), Truhenwahl, Podium und Revanche nachgewiesen.
- `scripts/check-journey.mjs`: gerenderte Desktop- und Mobilansicht (1440/390 Pixel), bis zu zwölf Crewmitglieder, 3D-Karte, Inselnavigation, Itemeinsatz, Wiederherstellung nach Neuladen, Truhenwahl und Reliktbonus in der Ergebnisanzeige. Zusätzlich reduzierte Bewegung und erzwungener WebGL-Ausfall. Diese Ansichten verwenden die tatsächliche Engine mit abgefangenen HTTP-Antworten; sie sind keine zusätzlichen D1-Netzwerktests.
- `scripts/check-ceremony.mjs`: Desktop/Mobil, tatsächliche Änderung der Kameraposition, Feuerwerk während des Ablaufs, Wiederholung, geteilte Sieger, reduzierte Bewegung und WebGL-Ausfall. Screenshots unter `outputs/qa/journey-*` und `outputs/qa/ceremony-*` wurden visuell geprüft und zu große Kartensymbole korrigiert.
- Kein Test mit echten menschlichen Teilnehmern auf unterschiedlichen Endgeräten/Internetanschlüssen. Die 3D-Prüfungen liefen mit Chromium/SwiftShader; schwächere reale GPUs können langsamer rendern.


## Natürliche Odyssee, Boss-Abstände und bewegliche Crew – 17.10.2026

- 29 gezielte Tests in `scripts/test-journey.mjs`: zusätzlich Boss-only-Auswahlen mit echten Zwischenetappen, einmalige Migration zukünftiger Etappen, autorisierte und begrenzte Kartenbewegungen, gespeicherte Abreisepositionen, Sperre während der Überfahrt, organische Küsten mit konsistenter Fläche und nach oben gerichteten Normalen, tatsächliche Figurenbewegung und Emote-Zuordnung. Auch die größte aufgefüllte Auswahl mit 80 Inseln wird auf deterministische Positionen, Abstände und aufsteigende Boss-Reiche geprüft.
- Die Figuren verwenden die echten `Avatar`-SVGs auf Three-Sprites, entsprechend der Bossdarstellung. Keine neu modellierten Körper. Der Browsercheck wartet ausdrücklich auf alle geladenen Avatartexturen; Form, Farbe und Accessoires bleiben erhalten.
- `scripts/check-nature.mjs`: tatsächlicher WebGL-Atlas bei 1440/390 Pixeln, zwei, drei und zwölf Figuren sowie reduzierte Bewegung. Prüft Laufknöpfe, Raycasting auf echte Inselgeometrie mit Maus beziehungsweise Touch, Emotes und gemeinsame Überfahrten. Bilder unter `outputs/qa/nature-*` zeigen Küsten, alle drei Boss-Reiche, Übersicht, Figuren und Emotes. Die Darstellung verwendet echte Enginezustände mit abgefangenen HTTP-Antworten.
- `scripts/check-nature-network.mjs`: echter lokaler Worker/D1 und zwei unabhängige Browser mit Katze/Krone und Hase/Schleife. Nachgewiesen: voneinander getrennte Bosse, auf dem anderen Client tatsächlich bewegte Figur, gespeicherte Bewegung nach Neuladen, Schutz gegen doppelte Aktionskennungen, an den zweiten Client verteiltes Siegertanz-Emote und nutzbare Emote-Auswahl im Karten-Vollbild.
- TypeScript und Produktionsbuild erfolgreich. Die bestehenden 22 Enginechecks einschließlich vollständiger Abläufe mit 2, 8 und 12 Spielern wurden ebenfalls bestanden. Die Browserprüfung verwendet Chromium/SwiftShader; keine neue Aussage zur Bildrate auf realen Mobilgeräten oder zur Qualität über verschiedene private Internetanschlüsse.

## Zusammenhängendes 3D-Gameshow-Abenteuer – 17.10.2026

- Produktionsbuild und TypeScript bestanden. 22 bestehende Enginechecks und 29 Reisechecks bestanden; zusätzlich drei Prüfungen in `scripts/test-adventure.mjs` für alle Bühnen, endliche Geometrie, Original-Avatarsprites, echte bestätigte Rennpositionen, stabile gehaltene Würfel und die Unabhängigkeit von geheimen Zeitfristen.
- `scripts/check-adventure.mjs`: alle 18 aktiven Minispiele bei 1440 und 390 Pixeln, insgesamt 36 Bühnenansichten. Geprüft: passende tatsächliche WebGL-Bühne, geladene Avatartexturen, veränderbare Kamera, Rückkehr zur Standardansicht, erreichbare Eingaben und kein horizontaler Seitenüberlauf. Ein Klick auf einen tatsächlichen 3D-Würfel wird bis zur bestätigten Halten-Aktion durch die vorhandene Spielsteuerung verfolgt. Die Renderaufrufe blieben unter dem Prüfwert von 280 je Bild. Das ist kein Versprechen gleicher Bildrate auf realen Mobilgeräten.
- `scripts/check-adventure-picking.mjs`: auf reale Szenenobjekte projizierte Mausklicks wählen Waren aus, öffnen beim Joker die vorhandene Farbwahl ohne vorzeitige Spielaktion und betätigen den echten Buzzer. Erst die ausdrückliche Farbwahl und Bestätigung spielt den Joker.
- `scripts/check-adventure-reveals.mjs`: echte Engine-Auflösungen für Pixelblitz, Farben, Größen, Hivemind und Budget. Die Galerie zeigt die volle Auflösung und kehrt in der nächsten Runde zum neuen verpixelten Bild zurück; die alte Vollbildtextur bleibt nicht liegen. Weitere Bilder zeigen Ziellicht, echten Größenvergleich, Gruppenlichter und enthüllte Preise.
- `scripts/check-adventure-shell.mjs`: Startseite und Erstellen-Dialog bei zwei Breiten, Lobby, zwölf geladene Crewfiguren, ruhige Kamera bei reduzierter Bewegung, während des Spiels erreichbare Reisekarte, 3D-Countdown sowie absichtlich abgeschaltetes WebGL mit weiter erreichbarem Rätselbild und Buzzer.
- `scripts/check-adventure-network.mjs`: echter lokaler Worker/D1 und zwei unabhängige Browser. Der eingegebene Text wird über die vorhandene authentifizierte Verbindung bestätigt und erscheint als gemeinsamer Rennfortschritt in der 3D-Bühne des zweiten Clients. Nach Neuladen bleibt dieser Fortschritt erhalten.
- `scripts/check-boss-views.mjs`: alle drei spezialisierten Bossarenen bei Intro, Spiel mit zwölf Figuren, Salve, dritter Phase und Sieg; zusätzlich mobile Ansichten und WebGL-Ausfall. Alle Arenen füllen den vorgesehenen Bildschirm und die Bedienpulte bleiben darin. Der Prüfadapter verwendet jetzt den tatsächlichen Raumaktions-Einstieg einschließlich der automatischen Fristeingaben; lokale Halteauswahl wird vor dem nächsten bestätigten Wurf separat geprüft.
- `scripts/check-music.mjs`: 78 offline gerenderte Musikabschnitte, unterschiedliche Abschnitte je Thema, Stumm/Null, begrenzte Spitzen, Themenwechsel und exklusive Bossmusik bestanden. `scripts/check-adventure-audio.mjs` prüft Energie und Spitzen der Stereo-Umgebungen, Effektregler Null, Stumm, ausdrücklich stille Zusatzumgebung beim Zeitgefühl und den kurzen Stereo-Hallimpuls.
- Bilder unter `outputs/qa/adventure-*` und `outputs/qa/boss-*` wurden visuell geprüft. Insbesondere wurden Schattenfehler auf Textflächen entfernt, das Pult scrollbar neben die Szene gesetzt, die Reisekarte im Desktopspiel wieder erreichbar gemacht und die Größe kleiner Texturen begrenzt. Darstellungstests verwenden Chromium/SwiftShader und kontrollierte echte Enginezustände; nur der ausdrücklich genannte Netzwerktest verwendet zwei echte Worker/D1-Sitzungen. Es wurde kein neuer vollständiger menschlicher Spieleabend über unterschiedliche Internetanschlüsse durchgeführt.
