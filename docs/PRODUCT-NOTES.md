# Party Olymp

## Aktueller Party-Ablauf

Die Crew spielt die in der Lobby gezeigte Reihenfolge: automatische Reise → kurze Einführung mit optionalem Relikt → gemeinsamer Countdown → Minispiel → Ergebnis → Gesamtwertung → nächste Reise. Die Disziplin-Roulette entfällt. Während eines Minispiels ist die Inselkarte geschlossen; frei erkunden lässt sie sich in einer Pause. Einstellungen und Credits sind zentral erreichbar. Details und Prüfungen: [PARTY-FLOW.md](docs/PARTY-FLOW.md).

## Kamera und Desktopformat

16:9 ist das Hauptformat (1366 × 768 und 1920 × 1080). Pixelblitz folgt dem bestätigten Buzzer-Spieler und kehrt nach Fehlversuch oder Zeitablauf zum Bild zurück. Bombenwort und Kategorien-Kette folgen dem aktiven Teilnehmer; Typeracer bietet standardmäßig die Mitfahrt. Präzise Instrumente und persönliche Eingaben bleiben ruhig. Emote-Favoriten senden per Klick oder mit 1–6; Sterne verwalten die Auswahl. Umsetzung und Prüfungen: [CAMERA-DIRECTION.md](docs/CAMERA-DIRECTION.md).

## Reise zum Olymp und Relikte

Der Weltenatlas zeigt jetzt den gesamten Spielplan als zusammenhängende, frei erkundbare 3D-Inselwelt. Jede der 21 auswählbaren Disziplinen besitzt ein eigenes Wahrzeichen: unter anderem Bibliothek, Stundenglas, Regenbogenbrücke, Spielpalast, Galerie und Weltobservatorium. Auch wiederholte Spiele bekommen jeweils eine eigene Insel. Die Boss-Reiche sind dreimal so breit und haben die neunfache Landfläche: Titanenzitadelle mit Steinwächter, Krakenmeer mit acht animierten Tentakeln und Schiffen sowie Drachenvulkan mit fliegendem Drachen, Festung und Lava. Der Atlas lässt sich ziehen, per Mausrad oder zwei Fingern zoomen, auf alle Inseln ausrichten und im Vollbild erkunden. Die Etappenliste und anklickbare Inseln steuern sanfte Kamerafahrten; reduzierte Bewegung wechselt direkt zur gewählten Ansicht. `scripts/check-atlas.mjs` prüft Desktop, Mobil, 40 Inseln, Vollbild, Mausziehen und echtes Zwei-Finger-Zoomen im Browser.

Die Olympiade begleitet eine lebendige 3D-Reisekarte mit schwebenden Inseln, Runentempel, Sturmmeer, Goldkammer und dem Olymp am Horizont. Sie verbindet die Spiele als automatische gemeinsame Reise. Während einer Pause kann die Crew die Inselwelt erkunden; im laufenden Minispiel gehört der Bildschirm dem Spielort.

Alle Teilnehmer starten mit Goldener Lorbeer (+25 % Olympiadenpunkte), Phönixfeder (mindestens 40, bei Bossen 120 Punkte) und Sternensplitter (+20, bei Bossen +60 Punkte in der oberen Hälfte). Vor der Bereitschaft kann pro Disziplin ein Relikt verbindlich eingesetzt werden. Ohne gültiges Ergebnis gibt es keinen Bonus. Die Disziplinplätze ändern sich dadurch nicht; Reliktboni zählen zur Gesamtwertung und erscheinen schon in der Ergebnisauflösung. Nach jeder zweiten Disziplin außer der letzten erhält jeder eine Truhe mit freier Reliktwahl; maximal fünf Relikte passen in den Rucksack. Inventare, Truhen, Effekte und Boss-Trophäen werden im bestehenden Raumzustand gespeichert; eine Revanche beginnt frisch.

Die Siegerehrung nutzt eine 3D-Bühne mit mehreren Kamerafahrten, nacheinander aufsteigenden Podesten, Pokal und farbigem 3D-Feuerwerk mit Raketen und Funkenbahnen. Reduzierte Bewegung schaltet Kamerafahrten und Partikeleffekte aus; ohne WebGL bleiben Karte, Itembedienung und Siegerehrung zugänglich.

Gezielte Prüfungen: `node scripts/test-journey.mjs`, `node scripts/check-journey.mjs`, `node scripts/check-journey-network.mjs`, `node scripts/check-ceremony.mjs`.

Eine echte Browser-Multiplayerplattform für private Olympiaden mit 2–12 aktiven Spielern. Deutsch, keine Registrierung, private Räume, 21 auswählbare Disziplinen, persistente Wertung, eigene Figuren und animierte Emotes mit selbst erzeugtem Sound.

Öffentlich spielen: **https://party-olymp.vividboar4.chatgpt.site**. Raum erstellen, Einladungslink teilen, bereit melden und gemeinsam starten.

## Start

Node.js ab 22.13 installieren, dann im Projektordner:

```powershell
npm ci
npm run db:generate # nur nach Änderungen am Schema
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_pink_stick.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_simple_greymalkin.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_hard_puff_adder.sql
npm start -- --port 5173
```

Die Datenbankmigration einmal pro neuer lokaler Datenbank anwenden. Für die Entwicklung mit HMR: `npm run dev`. In dieser Arbeitsumgebung liegt ein zusätzliches portables Node unter `../.tools/node-v22.16.0-win-x64`; das gehört nicht zum veröffentlichten Quellcode.

## Prüfen

```powershell
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-engine.mjs
$env:QA_FULL='1'
node scripts/qa-network.mjs
```

Die Netzwerkprüfung verwendet echte HTTP-Anfragen und die echte lokale beziehungsweise bereitgestellte D1-Datenbank. Sie legt drei unabhängige Räume mit 2, 8 und 12 automatisierten Testteilnehmern an. `QA_FULL=1` durchläuft alle neun Spiele; ohne diese Variable wird ein kürzerer vollständiger Olympiadenablauf geprüft. Die Testteilnehmer sind ausschließlich ein QA-Werkzeug, niemals Teil der Produktoberfläche.

Für die gerenderte Browserprüfung:

```powershell
npm install --prefix ../.tools/qa playwright
node ../.tools/qa/node_modules/playwright/cli.js install chromium
node scripts/qa-browser.mjs
```

Mit `QA_URL=https://…` testen beide QA-Skripte eine bereitgestellte Umgebung. Testprotokolle und gerenderte Ansichten liegen in `outputs/qa` und werden nicht veröffentlicht.

## Betrieb und Quellen

Die tatsächlich durchgeführten Prüfungen und ihre Grenzen stehen im [QA_REPORT.md](QA_REPORT.md).

Siehe [ARCHITECTURE.md](ARCHITECTURE.md) für Hostingvergleich, Speicher- und Transportentscheidung, Fristen, Inhaltsquellen, Attribution und praktische Grenzen. Das Spiel verwendet authentifizierte WebSockets mit personalisierten Zuständen und HTTP als Wiederverbindungsfallback. D1 bleibt die verbindliche Instanz für Raumzustände und Ergebnisse.

Kniffel spielt 13 gemeinsame Züge mit sichtbaren Würfeln und Wertungsblättern. Eine Flottenrunde bedeutet eine vollständige Schlacht mit 12–18 Salven. Größenobjekte sind verschiebbar und über den Eckgriff skalierbar. Ergebnisauflösung und Gesamtwertung haben bewusst längere Lesezeiten. Wiki-Sprint lädt echte vollständige Wikipedia-Artikel einschließlich aller erlaubten Artikelverlinkungen; D1 puffert Artikel bei externen Ausfällen. Budget-Bande zieht zufällige Angebote aus 319 echten Amazon.de-Artikeln mit Originalfotos und einem Preissnapshot vom 10.10.2026. `node scripts/prepare-amazon.mjs` erneuert den Snapshot ohne API-Zugang.

Gezielte Checks für diese Überarbeitung: `node scripts/check-refinements.mjs`, `node scripts/check-live.mjs` und `node scripts/check-look.mjs`.

Die vorhandene `.openai/hosting.json` bezeichnet das autorisierte Sites-Projekt mit D1-Bindung `DB`. Veröffentlichungen erfolgen über den Sites-Workflow; öffentliche Freigabe ist für anonyme Freunde erforderlich. Nie Sitzungstokens oder Hostingcredentials in Git aufnehmen.

## Projektstruktur

- `lib/game/room.ts`: Olympiadenphasen, Gastgeberrechte, Wiederbeitritt, einmalige Punktevergabe.
- `lib/game/games/`: neun Spielmodule mit einheitlicher Schnittstelle.
- `lib/game/scoring.ts`: Rangfolge, Gleichstände, Gesamtwertung.
- `lib/game/content.ts`, `lib/game/data/wiki.json`: eigener und attribuierter Startbestand.
- `app/api/room/route.ts`: authentifizierte HTTP-Raumaktionen, D1 mit Versionsprüfung.
- `components/olymp/`: Lobby, Bühnenansichten, Charaktere, Emotes und Steuerung.
- `lib/audio.ts`: Web-Audio-Klangwelt und Lautstärkeeinstellungen.
- `tests/engine.test.ts`: Regeln, Sicherheit und vollständige Abläufe.


## Bedienung und Charaktere

Club 21 zeigt Handwert, Einsatz und Chips direkt am Tisch. Bei Farbwechsel leuchten passende Karten; erst nach einem Joker öffnet sich die Auswahl mit vier Farbfeldern. Schmugglerflotte trennt Zielkarte und eigene Flotte, zeigt Platzierungsvorschau und Koordinaten und bestätigt Schüsse ausdrücklich. Wiki-Sprint fängt Artikellinks direkt in der eingebetteten Wikipedia-Ansicht ab, zeigt den Ladezustand und scrollt erst nach dem Artikelwechsel wieder an den Anfang. Größengefühl verwendet wechselnde, maßhaltig beschriftete Vergleichsobjekte und eigene SVG-Illustrationen für alle Aufgaben.

Die Charakterauswahl kombiniert 12 Farben, 6 Formen und 8 Accessoires (576 Varianten); sie bleibt nach Refresh erhalten und wird in Lobby, Emotes, Spielansichten und Wertung gezeigt. Die Gesamtwertung zählt Punkte über 6,5 Sekunden hoch, bewegt die Spielerzeilen beim Überholen und begleitet Führungswechsel mit Einblendung, Partikeln und Fanfare. Reduzierte Bewegung bleibt unterstützt.


Neonkurven wurde auf Wunsch vollständig entfernt. Auswahl, Voreinstellungen und Spielmodule umfassen jetzt neun Disziplinen. Bestehende Räume überspringen die entfernte Disziplin; ihre historischen Kurvenpunkte werden aus der Gesamtwertung entfernt. Ein bisher reiner Kurvenraum erhält eine Runde Pixelblitz.

## Spielverständnis und Live-Crew

Alle neun Spiele haben kontextabhängige nächste Schritte, aufklappbare Regeln und eine kompakte Live-Crew. Würfelwerk zeigt aktuelle Würfe, Einträge und Bonusfortschritt; Null-Einträge werden bestätigt. Wiki-Sprint zeigt die aktuellen Artikel und Klicks der Mitspieler. Pixelblitz zeigt die Anzahl der Versuche und den Lösestatus, ohne Antworten zu verraten. Budget-Bande hat einen stets erreichbaren Warenkorb und gemeinsam synchronisierte Preis-Auflösungen mit laufenden Summen. Club 21 zeigt offene Spielerhände und erklärt Gewinne nach Abzug des Einsatzes. Farbwechsel erklärt die Wirkung der letzten Karte einschließlich Zielspieler und automatisch gezogener Karten. Flottensalven zeigen Treffer, versenkte Schiffe und geteilte Beute; auch ausgelassene Schüsse bleiben sichtbar. Farbgedächtnis nutzt farbige Mischregler und direkte Zielvergleiche. Größengefühl hat Größen-Schritte, Tastaturverschiebung und verständliche Verhältnisvergleiche.

Animationen reagieren auf bestätigte Aktionen: Karten kommen auf den Tisch, Würfel rollen, Salven erzeugen Wellen, bestätigte Entscheidungen erhalten einen Stempel und Ergebnisse zählen sichtbar hoch. Reduzierte Bewegung und Stummschaltung gelten weiterhin. Geheime Schätzungen, Warenkörbe, Farbwechsel-Hände und unentdeckte Flotten bleiben verborgen.

## Die natürliche Odyssee

Die Inselwelt bildet aufsteigende Inselgruppen entlang einer großen Reise zum Olymp. Jede Gruppe enthält bis zu fünf Entdeckungen und endet spätestens bei einem Boss. Organische Küsten, bewachsene Felsen, Wasserfälle, schmale Holzbrücken und Tore zwischen den Reichen ersetzen die bisherige Rasterroute. Boss-Reiche bleiben neunmal so groß wie normale Inseln.

Die Crew verwendet dieselben gewählten SVG-Avatare mit Form, Farbe und Accessoires wie in den Bossarenen, als kamerazugewandte Figuren direkt auf der Karte. Auf die aktuelle Insel tippen oder die vier Laufknöpfe benutzen; die Figuren laufen um die Wahrzeichen. Emotes sind auch im Vollbild verfügbar. Beim Etappenwechsel reist die Crew gemeinsam über die Brücke. Bewegungen, Abreisepositionen und Reisebeginn werden im Raumzustand gespeichert und an alle Spieler verteilt.

Vorlagen verteilen Bosskämpfe bereits bei der Auswahl zwischen den Minispielen. Manuell gewählte Reihenfolgen gelten exakt; es kommen keine versteckten Zwischenrunden hinzu. Bestehende Räume behalten ihre angezeigte Route, aktuelle Etappe und Historie.

Prüfungen: `node scripts/test-journey.mjs`, `node scripts/check-nature.mjs`, `node scripts/check-nature-network.mjs`. Die letzten beiden benötigen die lokale Worker-Vorschau auf Port 5173.

## Das 3D-Gameshow-Abenteuer

Startseite und Lobby führen in dieselbe Welt aus schwebendem Naturstein, Gold, Licht und gewählten Charakteren. Alle 18 Minispiele besitzen eine eigene WebGL-Bühne; die drei Bosse behalten ihre spezialisierten 3D-Arenen. Das Spielpult bleibt am Desktop direkt neben der Bühne und auf kleineren Bildschirmen darunter. Die Reisekarte ist während des Spiels erreichbar.

Die Bühnen bilden echte Zustände ab: gehaltene und rollende Würfel, private Kartenhände und öffentliche Ablage, laufende Rennwagen, eigene Codefarben, wachsende Wortketten, Ideenlichter, echte Warenfotos mit Auswahl, ein Globus aus den vorhandenen Ländergeometrien, das tatsächlich fortschreitende Rätselbild, Farbmischung, Größenverhältnisse und eine physische Spektrum-Waage. Würfel, eigene Farbkarten, Waren und Buzzer lassen sich direkt in der Szene anklicken; dieselben bedienbaren Schaltflächen bleiben im Spielpult erreichbar. Eingaben gehen weiterhin über die bestehenden authentifizierten Spielaktionen. Verdeckte Informationen bleiben verdeckt.

Die Kamera lässt sich ziehen, zurücksetzen und auf eine ruhige Ansicht umstellen. Emotes zeigen eure Originalavatare direkt auf der Bühne. Die Darstellung verwendet gebündelte statische Geometrie, nachgeladene Three-Komponenten, begrenzte Pixeldichte, automatisch reduzierte Auflösung bei hoher Renderlast und pausiert außerhalb des sichtbaren Bereichs. Beim Bühnenwechsel werden GPU-Ressourcen freigegeben. Ohne WebGL bleiben alle bisherigen Spielaktionen verfügbar.

Zum vorhandenen eigenen Soundtrack pro Disziplin kommen leise Stereo-Umgebungen, ein kurzer gemeinsamer Raumhall und ein dezenter Auflösungsakzent. Die Umgebungen folgen dem Effektregler; Master-Mute schaltet auch den Hall stumm. Beim Zeitgefühl bleibt die zusätzliche Umgebung vollständig still. Die drei musikalischen Zeitgefühl-Abschnitte unterscheiden sich harmonisch, ohne einen Metronomtakt einzuführen.

Zusätzliche Prüfungen: `scripts/test-adventure.mjs`, `scripts/check-adventure.mjs`, `scripts/check-adventure-shell.mjs`, `scripts/check-adventure-network.mjs`, `scripts/check-adventure-audio.mjs` und `scripts/check-music.mjs`.
