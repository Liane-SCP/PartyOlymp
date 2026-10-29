# Museum: gemeinsame Enthüllung und Klang

Stand: 18. Oktober 2026. Verifizierte Teilverbesserung des 21-Spiele-Ziels; keine Gesamt- oder Hörabnahme.

## Änderung

Das echte Messmodell samt Sockel, Beschriftung und Maßstab erscheint 475 ms nach dem öffentlichen `revealStartedAt`. Der eigene Tipp und die bekannte Referenz bleiben bereits sichtbar. Die tatsächliche Größe wird beim Einblenden nicht animiert oder verzerrt; die nominalen Messanker werden auch für das noch ausgeblendete Modell korrekt aktualisiert.

Am selben öffentlichen Zeitpunkt wird der museumspezifische Enthüllungsklang ausgelöst. Die Tonfolge bleibt die vorhandene Kombination aus kurzem Rauschen und zwei Sinustönen bei 392 und 587,33 Hz. Der räumliche Ursprung der gemeinsamen Fanfare liegt im Bühnenzentrum `[0,3,-1.4]`. Der Auswahlklang entsteht dagegen am jeweils aktuellen Tipp-Sockel.

Die Klangentscheidung folgt der echten verstrichenen Spielzeit. Sie hängt nicht mehr vom für reduzierte Bewegung direkt auf den Endzustand gesetzten Bewegungsfortschritt ab. Dadurch funktioniert die Enthüllung auch ohne Crew-Laufanimation.

Ein begrenzter Verlauf merkt den bereits beobachteten Höchststand pro Runde und Enthüllungszeitpunkt. Eine kleine Uhrkorrektur hinter die Grenze und anschließend wieder nach vorn löst keinen zweiten Klang aus. Bereits vergangene bzw. während einer längeren Aktualisierungslücke übersprungene Grenzen werden stumm übernommen. Auch ein ausgeschalteter Klang wird nicht später beim Einschalten nachgeholt. Ein neuer Rundenzeitpunkt besitzt eine eigene Grenze.

Die generische Ergebnisfanfare des Szenen-Renderers und der generische `reveal`-Ereignisklang werden für diese Disziplin unterdrückt. Die eigene Enthüllung überlagert sich deshalb nicht mehr mit zwei weiteren Standardklängen. Andere Disziplinen behalten ihre vorhandenen Abläufe.

## Nachweise

- `node scripts/test-size-presentation.mjs`: 9 Tests bestanden. Die neuen Fälle prüfen die exakte Grenze, Uhrkorrektur, stillen Wiedereinstieg, übersprungene Grenze und einen bereits knapp hinter der Grenze eintreffenden laufenden Phasenwechsel. Die bisherigen Eingabe-, Mess-, Kamera- und Geheimhaltungsfälle bestehen ebenfalls. Protokoll: `outputs/qa/size-audio-unit.log`.
- `node scripts/test-adventure.mjs`: 17 Tests bestanden. Protokoll: `outputs/qa/size-audio-baseline.log`.
- TypeScript, Produktionsbuild über den Sites-Helfer und `git diff --check` erfolgreich. Buildprotokoll: `outputs/qa/size-audio-build.log`.
- `node scripts/check-size-museum.mjs`: bestehende Maus-/Touch-/Mess-/Galerieprüfungen bestanden bei 1440 und 390 CSS-Pixeln. Die Ergebnisaufnahme wartet jetzt ausdrücklich auf das eingeblendete echte Modell. Protokoll: `outputs/qa/size-audio-museum.log`.
- `node scripts/check-size-audio.mjs`: sieben Szenarien mit jeweils zwölf geladenen Figuren bestanden. Bericht: `outputs/qa/size-audio.json`; Protokoll: `outputs/qa/size-audio-browser.log`.

Die sieben Klangfälle sind Desktop und schmaler Touch-Bildschirm, beide jeweils zusätzlich mit reduzierter Bewegung, ein anfangs stummer Desktop, ein Touch-Bildschirm mit anfangs auf null gesetzten Effekten und ein laufender Übergang aus der Eingabe zur Auflösung.

Die Prüfung verwendet echte Chromium-Web-Audio-Knoten mit delegierenden Messhüllen und eine kontrollierte öffentliche Spieluhr. Vor jedem Zeitschritt wartet sie auf den tatsächlich gerenderten Zeitstand. Sie prüft:

- Kein AudioContext beim bloßen Laden; Freigabe durch eine tatsächliche Browser-Eingabe.
- Das echte Modell ist bei 474 ms ausgeblendet und bei 475 ms sichtbar. Bei eingeschaltetem Klang entsteht genau eine räumliche Route mit den beiden vorgesehenen Tonhöhen.
- Die Uhr springt von 475 auf 300 und anschließend auf 600 ms. Der Vorwärtssprung liegt innerhalb der bisherigen Frischegrenze; der alte Fortschrittsvergleich hätte hier erneut ausgelöst. Es bleibt genau eine Route.
- Im laufenden Übergang gibt es vor der Grenze keine generischen Enthüllungs- oder Ergebnisfanfaren.
- Die Figurenauswahl erzeugt ihre eigene Route vom Tipp-Sockel. Koordinaten werden mit einer Toleranz für native AudioParam-Gleitkommazahlen geprüft.
- Live-Stummschaltung fährt den Master-Gain auf null. Bei Stummschaltung bzw. Effektlautstärke null erzeugt eine weitere Auswahl keine neue Route.
- Nach späterem Einschalten wird eine verstrichene Enthüllung nicht nachgespielt; eine neue bewusste Auswahl funktioniert wieder.
- Vor dem simulierten Sichtbarkeitswechsel wird synchron nachgewiesen, dass eine neu ausgelöste Auswahlroute noch verbunden ist. Der Wechsel unterbricht diese aktive Route. Anschließend sind alle aufgezeichneten räumlichen Routen getrennt und die Geräusch-/Oszillatorquellen einschließlich der Umgebungsloops beendet.
- Ein AudioContext pro Dokument; nach Neuladen erneut kein Context bis zur Eingabe. Nach der Freigabe entstehen weder historische räumliche Routen noch unpositionierte Oszillator-Fanfaren.

Für alle sieben Fälle wurden Vorher-/Nachher-Bilder unter `outputs/qa/size-reveal-{before,after}-*.png` erstellt und visuell kontrolliert. Sie zeigen den unveränderten Bildausschnitt, die korrekt große hinzugekommene Ausstellung und das abweichende Crew-Verhalten bei reduzierter Bewegung.

## Grenzen und weitere Arbeit

Dies sind instrumentierte Browserprüfungen mit der echten Spielengine und abgefangenen Raumantworten. Sie ersetzen keine reale Mehrbrowser-Netzwerkpartie, keinen echten Smartphone-Tabwechsel und keine Lautsprecher- oder Kopfhörerabnahme. Der Sichtbarkeitswechsel wird über `document.hidden` und das zugehörige Ereignis simuliert. Das Überspringen der Grenze nach einer längeren Pause ist durch die Zustandsprüfung abgedeckt; eine reale Hintergrundphase über diese Grenze ist noch gesondert zu prüfen.

Die Tests verwenden Musiklautstärke null, damit die einzelnen Effekte eindeutig zugeordnet werden können. Klangfarbe, Lautheit, Musikabmischung und tatsächliche Ausgabelatenz auf Referenzgeräten bleiben offen. Die vorhandene ruhige Museum-Atmosphäre bleibt erhalten. Aus diesen Prüfungen werden keine FPS-, vollständigen Prozessspeicher- oder Hörqualitätsaussagen abgeleitet.

Die künstlerische Ausgestaltung, konkreten Archivmodelle und restlichen Abnahmen in `SIZE-GALLERY.md` und `ADVENTURE-STATUS.md` bleiben offen. Die gehostete Fassung wurde nicht verändert.
