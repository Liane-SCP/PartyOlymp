# Würfelwerk: persönlicher Platz und Wertungsblatt

Der nachfolgende gemeinsame Tischaufbau steht in [DICE-CREW-TABLE.md](DICE-CREW-TABLE.md). Er ersetzt die nachstehend beschriebene große persönliche Würfelfläche durch echte Plätze aller Teilnehmer und eine Nahansicht auf denselben eigenen Platz. Das vollständige Wertungsblatt bleibt als vorhandener Dialog erreichbar. Zahlen und Bilder dieser älteren Ausbaustufe sind historische Nachweise.

Der Salon besitzt eine eigene Nahansicht auf Becher, fünf Würfel, Halteablage und persönliches Blatt. Die Tischrunde bleibt über den Kamerawechsel erreichbar. Auf schmalen Bildschirmen öffnet „Mein Würfelplatz“ eine bildschirmfüllende Ansicht mit einem erreichbaren Zurückknopf. Die vorhandenen Boss-Charaktere, Sitzplätze und heruntergeladenen Salonmöbel bleiben erhalten. Verwendete Kenney-Modelle und Lizenzen sind im bestehenden `public/adventure-models/manifest.json` und den Paket-Lizenzdateien dokumentiert.

## Ein zusammenhängender Spielablauf

Der bestehende Würfel-Controller wurde in `DiceTableControls` ausgelagert. Seine fünf Halteaktionen und seine Wurfaktion befinden sich über ein Portal auf der Bühne; es gibt genau einen aktiven Controller. Becher und dreidimensionale Würfel lösen dieselben regelgeprüften Aktionen aus. Es wird keine zweite Spiellogik eingeführt. Bestätigte Würfelwerte, gehaltene Würfel, verbrauchte Würfe und Einträge kommen weiterhin aus dem Serverzustand.

Das Pult zeigt Wurfzahl, gemeinsamen Zug, verbleibende Zeit und gegebenenfalls den bereits gesicherten Eintrag. Ein laufender Auftrag sperrt weitere Aktionen; eine unmittelbar gesetzte Referenz schützt auch vor zwei Aufrufen im selben Ereignisdurchlauf. Fehlgeschlagene Übertragungen bleiben sichtbar und können erneut versucht werden. Der Countdown wird durch das Öffnen des Blatts nicht angehalten.

Der ergänzende Bereich heißt jetzt „Eure Tischrunde“ und zeigt die öffentlichen Würfel, Haltezustände, Würfe, Punkte und Einträge der Crew direkt. Die vollständigen fremden Wertungsblätter bleiben über die einzelnen Spieler aufklappbar. Die bisher zusätzliche kompakte Crew-Zeile entfällt für dieses Spiel, damit dieselben Informationen nicht zweimal nebeneinander stehen.

Das frühere Zweispaltenraster für Würfel und Blatt wird in diesem ergänzenden Bereich aufgehoben. Es hatte trotz des ausgelagerten Spielpults noch eine Mindestbreite von mehr als 600 Pixeln erzwungen und dadurch Karten am rechten Rand abgeschnitten. Die Crew nutzt jetzt eine einzelne flexible Spalte mit getrennten Bereichen für Avatar, Name, Würfel und Aufklapppfeil.

Die Kameradistanz der Nahansicht wird aus dem tatsächlichen Seitenverhältnis, dem Kamerawinkel und dem gesamten Handlungsvolumen berechnet. Dieses umfasst den Becher, die Würfel einschließlich Wurfhöhe, die Halteablage und das Blatt. Die automatische kleine Umlaufbewegung entfällt in der Nahansicht. Der Renderer wird beim Kamerawechsel und beim Öffnen des Blatts nicht ersetzt.

Die normalen Spielbühnen bereiten ihre tatsächlichen Avatar-Texturen jetzt vor der ersten Shader-Kompilierung vor. So wird nicht zuerst eine unsichtbare Figur ohne Textur kompiliert und erst im laufenden Spiel die Texturvariante nachgeladen. Die vorhandene Avatar-API meldet die fertige Dekodierung; ersetzte, fehlgeschlagene und beim Szenenabbau abgebrochene Anfragen werden ebenfalls abgeschlossen. Ein abgebrochener Aufbau kann dadurch nicht an einer unaufgelösten Avatar-Anfrage hängenbleiben. Die Bühnenbereinigung ist gegen doppelte Aufrufe abgesichert.

Ein ResizeObserver misst die tatsächliche Pult-Höhe und reserviert die benötigte Fläche außerhalb des Canvas. Feste Annahmen über Textumbruch oder Buttonhöhe bestimmen den Ausschnitt daher nicht. Die fünf Halteflächen und die wesentlichen Aktionen sind mindestens 44 CSS-Pixel groß. Die mobile Vollansicht blendet verdeckende globale Leisten aus und berücksichtigt unten die Safe Area. Eine verkleinerte Ansicht bleibt bedienbar.

## Blatt direkt am Tisch

Vor der eigenen Figur liegt ein gerahmtes, anklickbares Blatt mit Messingklammer. Seine Textur zeigt alle 13 Kategorien, tatsächliche Einträge, mögliche Punkte des aktuellen Wurfs und die bestätigte Gesamtsumme einschließlich eines bereits erreichten Bonus. Null und eine noch freie Kategorie bleiben unterschiedliche Zustände. Die Textur wird nur bei einer inhaltlichen Änderung neu gezeichnet. Sie gehört der Szene und wird beim Verlassen freigegeben.

Das Anklicken öffnet dasselbe persönliche Blatt wie die Pult-Schaltfläche. Die große Papieransicht bietet die vollständigen Kategorien, Regelhinweise, hervorgehobene beste Werte, belegte Zeilen und den Fortschritt zum oberen Bonus. Ein natives, gestaltetes Dialogelement begrenzt den Tastaturfokus, unterstützt Escape und gibt den Fokus an die Pult-Schaltfläche zurück. Die Liste scrollt innerhalb des Blatts; Kopf und Abschluss bleiben erreichbar.

Ein positiver Eintrag verwendet die vorhandene autoritative Kategorieaktion. Das Blatt schließt nach der bestätigten Abgabe. Ein manueller Null-Eintrag verlangt weiterhin die ausdrückliche Bestätigung. Zurück oder das Schließen des Blatts verwirft diese vorgemerkte Auswahl; sie bleibt nicht unbemerkt für die vorhandene Deadline-Abgabe aktiv. Nach der Abgabe lässt sich das Blatt weiter lesen, belegte Zeilen bleiben gesperrt. Beim nächsten gemeinsamen Zug werden Würfe und Haltezustände zurückgesetzt, bestehende Einträge bleiben erhalten. Ein neues Blatt entfernt die alten Inhalte auch von der physischen Tischfläche.

## Prüfung

`scripts/test-dice-place.mjs` prüft das Einpassen aller acht Ecken des Handlungsvolumens bei verschiedenen Seitenverhältnissen, Kamerawinkeln und Übergangszielen. Die zweite Prüfung kontrolliert die physische Blattdarstellung mit bestätigten Einträgen, einem echten Nullwert, erreichtem Bonus, Reset und fehlender eigener Ansicht. Öffentliche fremde Blätter dürfen nicht als persönliches Blatt erscheinen.

Eine dritte Node-Prüfung kontrolliert den Lebenszyklus der neuen Avatar-Bereitschaft mit simulierten Bildereignissen: erfolgreiche Dekodierung, verdrängte Anfrage, Ladefehler mit erhaltenem altem Bild und Abbruch beim Dispose. Die tatsächlichen SVG-Avatare werden zusätzlich in den Browserläufen verwendet.

`scripts/check-dice-place.mjs` verwendet tatsächliche Spiel-Engine-Fixtures für 2/8/12 Teilnehmer bei 1440 und 390 CSS-Pixeln. Es bedient den physischen Becher, hält einen physischen Würfel und prüft dessen Erhalt beim Neuwurf. Es öffnet das physische Blatt, bricht eine Null-Auswahl per Schaltfläche und Escape ab, trägt eine kontrollierte große Straße ein, prüft dieselbe Szene und denselben Controller, lädt neu und spielt mit allen Teilnehmern bis zum folgenden gemeinsamen Zug. Ein kontrollierter Neustart prüft den Blattreset. Mobil wird zusätzlich eine nur 430 Pixel hohe Ansicht geprüft.

Im Desktop-Zweierfall wird außerdem über `WEBGL_lose_context` der echte Grafikkontext verloren. Das Spielpult bleibt bedienbar; ein doppelter Wurfaufruf verbraucht nur einen Wurf und eine Kategorie kann weiter eingetragen werden. Das ist ein geprüfter Spielpult-Fallback, keine automatische Wiederherstellung der 3D-Szene.

Der letzte Würfelablauf besteht in allen sechs Fällen. `scripts/check-dice-layout.mjs` besteht zusätzlich mit acht Teilnehmern und langem Namen bei 1440 und 390 Pixeln auf Grafikstufe Hoch. Es prüft die tatsächlichen Zeilengrenzen innerhalb des Panels, getrennte Namen/Würfel und sämtliche 13 Einträge eines geöffneten öffentlichen Blatts. Die zugehörigen Desktop-/Mobilbilder wurden angesehen. Die vier bestehenden Referenzabläufe, sechs gemeinsamen Momentfälle und sechs Rennansicht-Fälle bestehen ebenfalls. TypeScript, Produktionsbuild, die drei neuen sowie die 17 Adventure- und sechs Referenzmoment-Node-Prüfungen bestehen.

Die kontrollierte Würfelkombination und der Neustart sind Testdaten. Die Tests belegen keine vollständig durchgespielte 13-Züge-Runde über echte Netzwerkverbindungen. Bilder und Ergebnisdaten stehen unter `outputs/qa/dice-place-*` und `outputs/qa/dice-place.json`. Der Renderer ist Chromium/SwiftShader und belegt keine Geräte-FPS oder physische Touch-Hardware.

Die Ressourcenprüfung fand beim ersten Versuch 26 Texturen und null geladene Avatare im ersten Salon, später 38 Texturen und zwölf geladene Avatare. Die Differenz waren die zwölf erst später geladenen Figurenbilder. `check-scene-lifecycle.mjs` vergleicht deshalb jetzt ausdrücklich vollständig geladene Zustände mit zwölf Avataren und sparsamer Grafik statt pauschal 750 ms zu warten. Die ursprünglichen Wachstumsgrenzen wurden nicht gelockert. Die Diagnose steht in `outputs/qa/scene-lifecycle-failure.json`.

Der erneute vollständige Lauf über 30 Szenenwechsel besteht mit zwölf geladenen Avataren pro Messpunkt, genau einem aktiven Canvas, konstanten Geometrie-/Texturzählern und ohne WebGL-Fehler. Im Kaufhaus wird zusätzlich ausdrücklich auf sämtliche angeforderten Produktbilder ohne offene Bildanfrage gewartet; ein früher Zustand mit noch leeren Fotoflächen genügt nicht. Die Bildbereitschaft wird gemeinsam mit den Zählern protokolliert. Diese Prüfung bleibt auf Ressourcen je Renderer begrenzt und beweist keine vollständige Prozessspeichergrenze.

## Weiterhin offen

Die übrigen Sitzplätze benötigen über ihre öffentlichen Blatt-/Würfelanzeigen hinaus eigene ausgearbeitete Würfelbereiche und Becher. Vollständige Gruppen- und Endauflösung, weitere Wurf-/Reaktionsinszenierung, räumliche Klangabstimmung, längere echte Mehrbrowser-Partien, Grafikbudgets und Geräte-/Latenz-/Speicherabnahme bleiben offen. Auch die vollständige Olympiade und die übrigen Disziplinen gehören weiterhin zum unveränderten Gesamtziel. Diese Überarbeitung erklärt Würfelwerk nicht als fertig.
