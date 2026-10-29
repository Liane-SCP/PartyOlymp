# Hivemind: persönlicher Gedankenplatz

Die geheime Eingabe gehört jetzt direkt zur Parkbühne. Eine persönliche Kamera zeigt die eigene Figur, ihre anklickbare Gedankenanzeige und einen dezenten Bodenring. „Park ansehen“ und Escape führen zur gemeinsamen Übersicht zurück. Die eigene Anzeige beziehungsweise „Mein Gedankenplatz“ öffnen dieselbe Eingabe. Der Renderer und das tatsächliche Eingabeelement bleiben bei diesen Wechseln erhalten.

Desktop zeigt die Frage und Eingabe auf einer gut lesbaren Schreibfläche neben der Welt. Schmale Ansichten zeigen sie darunter. Bei aktiver Eingabe auf schmalen oder niedrigen Ansichten nutzt die Bühne den verfügbaren visuellen Bildschirmbereich. Globale Kopf-, Crew- und Emoteleisten werden dann ausgeblendet, damit sie den Abgabeknopf nicht verdecken. Größenänderungen ersetzen weder das Feld noch seine Textauswahl. Die reale Smartphone-Bildschirmtastatur ist damit noch nicht geprüft.

## Private Antwort und Wiederbeitritt

Enter oder „Geheim festlegen“ geben den Gedanken bewusst ab. Reine Satzzeichen sind entsprechend der unveränderten serverseitigen Normalisierung keine gültige Antwort. Client und Server verwenden dieselbe kleine Regeldatei, ohne den großen Fragenkatalog in die Eingabekomponente zu importieren.

Noch offene Entwürfe werden im selben Tab gespeichert. Der Schlüssel trennt Raum, tatsächliche Olympiade, Disziplinindex und Spieler; der gespeicherte Inhalt trägt zusätzlich die Runde. Er verwendet den bereits öffentlichen Startanteil des Phasenschlüssels, weil `startedAt` nicht separat im öffentlichen Raum enthalten ist. Andere Runden, Spieler und neue Olympiaden übernehmen diesen Entwurf nicht. Dies ist keine geräteübergreifende Entwurfssynchronisierung.

Eine bereits versiegelte Antwort wird beim Wiederbeitritt aus `mine.answer` wiederhergestellt und bleibt gesperrt. Zuvor erschien dieses Feld leer. Der Tabentwurf wird nach bestätigter Abgabe entfernt. Die vorhandene Deadline-Registrierung übergibt den zuletzt gültigen Gedanken weiterhin an die tatsächliche serverseitige Fristbehandlung. Die neue Runde beginnt mit einer leeren Eingabe. Fremde Antworten werden durch diese Oberfläche nicht öffentlich.

Die Bereitschaft der Crew steht als Anzahl auf dem Gedankenblatt und als Häkchen an den öffentlichen Namen. Nach der Abgabe kehrt die Kamera zur Gruppe zurück. Die gemeinsame Enthüllung und Gruppentafeln aus [HIVEMIND-GATHERING.md](HIVEMIND-GATHERING.md) bleiben erhalten.

## Kamera, Modelle und Klang

Der eigene Platz verwendet die vorhandenen Figuren und Parkmodelle. Der Bodenring ist ein kleines konstruktives Effektobjekt. Es gibt keine neuen externen Assets oder Lizenzannahmen. Die eigene Bestätigung erklingt weiterhin am Gedankenplatz; der Audio-Hörer folgt der tatsächlichen Kamera. Der zusätzliche allgemeine Enthüllungston wurde für Hivemind entfernt, sodass die bestehende räumliche Mehrheits-/Gleichstandsklangfolge den gemeinsamen Moment trägt.

Acht gezielte Node-Prüfungen bestehen einschließlich aller persönlichen Kameras bei 2–12 Sitzordnungen und vier Seitenverhältnissen sowie der Entwurfsabgrenzung anhand echter öffentlicher Raumzustände. Die acht vorhandenen Regelprüfungen bestehen. TypeScript und Produktionsbuild bestehen; die Warnung zu großen Clientchunks bleibt offen.

## Native Browserprüfungen

`herd-console-low.json` enthält sechs bestandene Chromium-Fälle (2/8/12 Spieler × 1440 Pixel Desktop/390 Pixel Touch) und einen zusätzlichen Fall ohne WebGL. Die neue Prüfung kontrolliert den tatsächlichen Trefferpunkt des Abgabeknopfs mit `elementFromPoint`; eine überlagernde Emoteleiste kann dadurch nicht als erreichbare Bedienung durchgehen.

Jeder reguläre Fall prüft die einzelne portierte Eingabe, Satzzeichenvalidierung, persönliche Kamera, 600/400 Pixel hohe Ansichten, erhaltene Textauswahl sowie dieselben DOM-/Canvasobjekte bei Größenwechseln. Hinzu kommen Escape, direkte Auswahl der eigenen tatsächlichen 3D-Gedankenanzeige mit Maus/Touch, Neuladen eines offenen Entwurfs, echte Enter-Abgabe, Fremdansicht ohne eigene geheime Antwort, Neuladen der gesperrten eigenen Antwort, Aufdeckung, leere Folgerunde und tatsächliche serverseitige Fristabgabe des letzten registrierten Gedankens.

`herd-console-high.json` enthält zwei zusätzliche bestandene Fälle mit zwölf Spielern, hoher Grafik, reduzierter Bewegung und dem zwölften Spieler als eigenem Client. So werden Kamera, direkte 3D-Auswahl und Wiederbeitritt auch außerhalb des ersten Sitzplatzes geprüft.

Schreibansicht und kurze schmale Eingabe wurden tatsächlich gerendert und kontrolliert. Die kurze Ansicht zeigt Eingabe und unverdeckten Abgabeknopf; die Welt wird dafür entsprechend verkleinert. Die Daten verwenden echte Spiellogik mit kontrollierter HTTP-Fixture und ersetzen keine Live-Mehrbrowser-Partie oder echte Smartphone-Tastatur.

`spatial-scenes-herd.json` besteht erneut in beiden Breiten: tatsächliche eigene Bestätigung, gemeinsame Quelle, Kamera-/Hörerzuordnung, ein AudioContext, stumme verspätete Historie im selben Spiel und nach Szenenbesuch sowie Freigabe aller Quellen und Umgebungsschleifen. Die streng gezählte Audio-Prüfung hatte den zusätzlichen allgemeinen `sceneResolve`-Ton aufgedeckt; dieser wurde entfernt, ohne die Prüfung abzuschwächen.

## Szenenwechsel und Ressourcen

`scene-lifecycle-herd-console-18.json` besteht mit 18 Wechseln zwischen Hivemind, Atelier und Kaufhaus. Jeder der sechs Parkbesuche rendert zunächst den persönlichen Gedankenplatz und die schreibende Gruppe; anschließend werden zwölf tatsächliche Einzelgruppen ausgewertet, alle Nahansichten geöffnet und die Übersicht wiederhergestellt. Die folgenden Rendererzähler bleiben bei allen sechs Besuchen identisch:

| Sparansicht | Zeichenaufrufe | Dreiecke | Texturen | Geometrien |
|---|---:|---:|---:|---:|
| Persönlicher Gedankenplatz | 46 | 5.154 | 23 | 31 |
| Gruppe mit Eingabeblatt | 60 | 5.386 | 31 | 40 |
| Ergebnis nach allen Nahansichten | 71 | 6.602 | 55 | 65 |

Eine aktive Canvasfläche und keine gemeldeten WebGL-Fehler. Die Ergebniszähler umfassen jetzt die zuvor tatsächlich dargestellten Gedankenanzeigen; sie sind deshalb nicht mit einem direkt im Ergebnis gestarteten Renderer gleichzusetzen. Die Zähler hängen von bereits hochgeladenen und sichtbaren Ressourcen ab und beweisen keine vollständige Prozessspeichergrenze.

## Kurze Hardwareproben

RTX 4080 SUPER, ANGLE/D3D11, headless Chromium, hohe Grafik, zwölf geladene Figuren. Jede Probe läuft allein nach den funktionalen Browserprüfungen. Rohberichte: `hardware-herd-thought-personal.json`, `hardware-herd-thought-group.json`, `hardware-herd-thought-gathering.json`.

| Szenario | Tatsächlicher Renderpuffer | rAF-Abstände | p95 / p99 ms | >33,5 / >50 ms | Zeichenaufrufe | Dreiecke |
|---|---|---:|---|---|---:|---:|
| Persönlicher Platz | 1460 × 922 | 241 | 16,8 / 16,8 | 0 / 0 | 57 | 8.616 |
| Schreibende Gruppe | 1460 × 922 | 241 | 16,8 / 16,8 | 0 / 0 | 71 | 8.848 |
| Echte zwölf Abgaben und Enthüllung, breites Fenster | 1918 × 860 | 237 | 16,8 / 16,8 | 1 / 1 | 82 | 10.064 |
| Dieselbe Enthüllung, schmales Fenster | 388 × 624 | 239 | 16,7 / 16,8 | 0 / 0 | 82 | 10.064 |

Die breiten Fenster sind 1920 × 1080, das schmale Fenster 390 × 844 Pixel. Im breiten Übergang tritt ein einzelner Bildabstand über 50 ms auf; er bleibt als offene Bildzeitspitze dokumentiert. CPU-Renderaufruf-p95: 0,6/0,6/0,8/0,9 ms. Keine GPU-Zeitspur. Das erzwungene große Benchmarklayout ist kein Nachweis des normalen Seitenlayouts; dafür dienen die separaten nativen Eingabeprüfungen und kontrollierten Schreibbilder. Das schmale Fenster läuft auf derselben Desktop-GPU und belegt keine Smartphone-FPS. Diese kurzen warmen Proben ersetzen keine vollständige Performanceabnahme.

## Offene Abnahme

Weitere Park-/Figurenaktionen, native Smartphone-Tastaturen und IME, unterbrochene echte Gruppenpartien, Hörabnahme, Mittelklasse-Geräte, kalte Ladephasen, Prozessspeicher und vollständige Mehrbrowser-Olympiade bleiben offen. Die schmale gemeinsame Übersicht ist weiterhin eine Gesamtansicht; vollständige Texte werden über die einzeln erreichbaren Gruppen gezeigt. Diese Erweiterung ist keine vollständige Disziplin- oder Gesamtabnahme. Der Stand ist lokal.
