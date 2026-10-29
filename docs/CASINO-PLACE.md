# Club 21: eigener 3D-Platz und Dealeransicht

Club 21 beginnt jetzt am eigenen Tischplatz. Auf schmalen oder niedrigen Bildschirmen öffnet er die große Ansicht; auf Desktop nimmt die räumliche Spielansicht die verfügbare Bühnenbreite ein. Der Dealer und die gemeinsame Tischrunde sind jederzeit über eindeutig beschriftete Knöpfe erreichbar. „Spielpult“ stellt die bisherige ausführliche Oberfläche wieder her und gibt ihr den Tastaturfokus zurück. Die Runde bleibt dieselbe: weder Kamera- noch Seitenwechsel erzeugen eine neue Szene, einen zweiten Renderer oder neue Modelle.

## Karten, Spielhandlungen und Gruppe

Die eigene Hand verwendet die tatsächlich bereits vorhandenen gedruckten 3D-Karten, mit drei großen Karten pro Seite. Lange Hände bleiben vollständig über Pfeile und direkte Seitenwahl erreichbar. Eine neue bestätigte Karte führt zur betreffenden Seite; bei einer neuen Hand beginnt die Auswahl wieder vorn. Die gemeinsame Tischrunde stellt die vollständige ursprüngliche Anordnung wieder her. Auch die Dealeransicht verwendet die tatsächlichen Karten und folgt zunächst der zuletzt aufgedeckten Seite; manuelle Seitenwahl und „Aktuelle Karte“ bleiben möglich.

Der persönliche Ausschnitt räumt fremde Karten-/Chipstapel, Bankausrüstung und vordere Figuren aus dem unmittelbaren Lesebereich. Ihre bestätigten Zustände und ursprünglichen Sitzplätze bleiben für die Tischrunde erhalten. Der eigene Einsatz liegt neben den Karten. Die erste Sichtprüfung hatte einen Stapel über der unteren Kartenecke gezeigt; die Stapelposition und Sichtbarkeit wurden deshalb gesondert korrigiert. Die 3D-Hand-/Einsatzanzeige und die großen räumlichen Ziehen-/Stehen-Schaltflächen gehören zum eigenen Filzbereich. Die Crewzeile zeigt bestätigtes Stehenbleiben mit einem eigenen zugänglichen Haken.

Einsatzwahl und ergänzende HTML-Tasten verwenden exakt die bestehenden Club-21-Handler. Es gibt keinen zweiten privaten Einsatzentwurf oder unabhängigen Netzwerkweg. Während eine Aktion bestätigt wird, sperrt ein gemeinsamer In-flight-Guard sowohl alte als auch neue Bedienelemente. Eine Ablehnung zeigt einen verständlichen Fehler und erlaubt einen erneuten Versuch. Die vorhandene automatische HTTP-Wiederholung vorübergehender Serverfehler bleibt erhalten; die gezielte Ablehnungsprobe verwendet deshalb eine nicht automatisch wiederholte 400-Antwort.

Die gespiegelten Eingabewerte sind zusätzlich an den bestehenden serverseitigen Phasenschlüssel gebunden. Ein noch ausstehendes altes Antwortversprechen kann dadurch weder die Dealeranzeige als dauerhaft „Wird bestätigt“ überdecken noch einen alten Einsatzentwurf in einer neuen Hand aktivieren. Bis das vorhandene Pult für die neue Phase bereit ist, bleiben neue Aktionen gesperrt. Diese Abgrenzung betrifft die Darstellung und Eingabefreigabe; der Server bleibt für jede Spielentscheidung verbindlich.

## Gemeinsame Aufdeckung ohne Vorwegnahme

Der serverseitige Dealerzeitpunkt bestimmt weiterhin sichtbare Karten, verdeckte Rückseite, Drehung und Auszahlung. Die neue Seitenwahl kann noch nicht aufgedeckte Karten nicht vorzeitig sichtbar machen. Gezeigter Dealerwert und zugängliche Kartenbeschreibung verwenden ausschließlich den bis dahin aufgedeckten Teil.

Die Engine schreibt Auszahlungen bei der serverseitigen Abrechnung sofort gut. Der neue Kontostand darf den Ausgang der noch laufenden Dealeranimation nicht verraten. Bis zur gemeinsamen Auszahlungsfreigabe zeigt der Platz deshalb den vorherigen Bestand, berechnet aus dem bestätigten neuen Bestand abzüglich der noch nicht freigegebenen Auszahlung. Das funktioniert auch bei spätem Wiedereinstieg. Erst danach erscheinen Gewinn/Verlust, Auszahlung und neuer Bestand. Regeln, Chipbeträge, Teilnahmechips und Wertung bleiben unverändert.

## Kamera, Eingabe und Ersatzbedienung

Eigener Platz und Dealer besitzen eigene feste Kameras. Sichtbare Karten, Auswahlflächen und Textanzeigen sind an denselben vorhandenen Tischkoordinaten ausgerichtet. Die Nahansichten begrenzen die Renderbreite auf 960 CSS-Pixel, damit ein extrem breites, niedriges Fenster keine zufällig angeschnittenen Randmöbel zum Teil der eigenen Spielhandlung macht. Schmale Ansichten behalten ihre ganze verfügbare Breite. Im kurzen Querformat stehen Welt und scrollbares Pult nebeneinander. Ein ResizeObserver reserviert die tatsächlich benötigte Bedienhöhe; die Bedienung liegt außerhalb des Canvas.

Die Großansicht besitzt Dialogsemantik, eingeschränkte Hintergrundbedienung, Tab-Fokusführung und eine Rückkehr mit Escape. Der normale eingebettete Platz bleibt eine normale Seitenansicht. Die ruhige Darstellung ist auch im neuen Pult erreichbar. Alle neuen Knöpfe und die Seitenwahl haben mindestens 44 Pixel große Ziele. Die vollständigen Kartenwerte sind zusätzlich für Vorlesesoftware vorhanden. Bei WebGL-Ausfall werden diese Werte auch sichtbar als Text ausgegeben; die ergänzenden Spielaktionen bleiben bedienbar.

Die große Ansicht reagiert auch auf den Wechsel in ein niedriges Fenster. Eine ausdrücklich gewählte kompakte Ansicht bleibt dort scrollbar. Die äußeren CSS-Kamerawackler sind für Club 21 deaktiviert: Eine Transformation des Elterncontainers würde den Bezugspunkt des festen Dialogs verändern. Eigentliche Karten-, Dealer- und Chipanimationen bleiben erhalten. Der native Zwölfspieler-Touchfall prüft deshalb ausdrücklich die normale Bewegungseinstellung mit emulierter Betriebssystempräferenz „keine Reduktion“ und protokolliert Versuche, den äußeren Spielcontainer zu animieren.

Es werden keine zusätzlichen GLBs, Bildatlanten oder Audiosysteme eingeführt. Die 13 vorbereiteten Casinoraummodelle mit 131.352 Byte bleiben unverändert. Geometrien, Kartenatlas, Chips und ihre Besitzer werden weiterverwendet. Die neue Kamera- und UI-Ausarbeitung ersetzt keine physische Geräte-, Hör-, vollständige Live-Gruppen- oder Langzeitabnahme.

## Nachweise

Fünf neue Node-Prüfungen bestehen: alte Bestätigungen und neue Phasenschlüssel, zeitlich geschützte Dealerwerte und Kontostände, lange Hände und Zuschauergrenzen, tatsächliche Kartenproxies einschließlich verborgener zukünftiger Dealerflächen sowie eigene Chipposition und Wiederherstellung aller Einsätze in der Tischrunde. Die sechs bisherigen Casino-/Zuschauerprüfungen, TypeScript und Produktionsbuild bestehen ebenfalls.

Die abschließenden vier Platzabläufe mit 2/12 Spielern bei 1440/390 Pixeln bestehen (`outputs/qa/casino-place.json`, `casino-place-final-browser.log`). Jeder Ablauf erspielt sieben tatsächliche Karten über eine kontrollierte gültige Sechs-Deck-Folge, verwendet direkte Maus- beziehungsweise CDP-Touch-Aktionen für Einsatz/Ziehen/Stehen, prüft verzögerte Bestätigung und Doppeltipp, alle drei Kartenseiten, private Dealerfreigabe, den vorherigen Kontostand vor der Auszahlung, tatsächliche 200-Chip-Auszahlung, Wiederbeitritt, Folgerunde sowie Ein-/Ausstieg und Tastaturfokus der Großansicht. Die schmalen Fälle verwenden zusätzlich 740 × 390 Pixel Querformat. Der breite Zwölfspielerfall prüft den Wechsel in ein 720 Pixel niedriges Fenster mit tatsächlich erreichbaren Knöpfen. Der normale Bewegungsfall meldet keine äußere Containeranimation.

Die gemessenen gedruckten Kartenflächen der geprüften Seiten sind mindestens 180,92 × 217,51 CSS-Pixel auf Desktop und 78,52 × 98,04 in der schmalen Hochformatansicht groß. Alle geprüften Karten passen in den tatsächlichen Canvas. Dies beschreibt die kontrollierte Siebenkartenhand und die erfassten Ansichten. Der Zweierspieler-Touchfall enthält zusätzlich eine tatsächlich abgelehnte 400-Aktion mit unveränderter Hand und erfolgreichem erneutem Versuch sowie eine Kontextverlust-Ersatzbedienung mit bestätigtem Einsatz und sichtbar lesbaren Kartenwerten.

Die sechs bisherigen Tischfälle mit 2/8/12 Spielern bestanden nach der grundlegenden Hand-/Dealerumstellung. Die beiden Zwölfspieler-Tischfälle bestehen zusätzlich auf der abschließenden Fassung (`casino-place-final-shared-table.log`, `casino-table-focused.json`). Die vollständig ausgeteilte Zwölferrunde benötigt weiterhin 81 Zeichenaufrufe auf Sparsam. Beide nativen Web-Audio-Fälle bestehen erneut: erste Geste, öffentliche fremde Kartenausgabe, erst zur Freigabe abgespielte Auszahlung, zur Kamera passender Hörer, Sichtbarkeitsbereinigung und ruhiger Wiedereinstieg in ein abgeschlossenes Ergebnis (`casino-place-final-audio.log`, `casino-audio.json`). Eine subjektive Hörabnahme bleibt erforderlich.

Die tatsächliche Modellübergabe aus der Vorbereitung besteht mit deaktiviertem HTTP-Cache, ohne erneute Abrufe der 13 vorbereiteten GLBs und mit demselben Renderer beim Umschalten der ruhigen Ansicht (`casino-place-preparation.json`). Die Shaderprobe bleibt bei 16/16 Programmen auf Hoch und 12/12 auf Sparsam zwischen Vorbereitung und erstem sichtbarem Frame (`casino-place-shaders.json`). 18 Wechsel zwischen Casino, Würfelsalon, Kaufhaus und Rennstrecke bestehen mit einem aktiven Canvas und stabilen Zählern je Szene (`casino-place-lifecycle.json`). Alle fünf Casinobesuche am eigenen noch leeren Platz melden 29 Zeichenaufrufe, 6.372 Dreiecke, 32 Texturen und 38 Geometrien. Das ist der eigene Platz vor dem Einsatz; die volle Tischrunde wird getrennt gemessen.

## Kurze Hardwareproben

Die vier warmen Proben verwenden Hoch, zwölf Teilnehmer mit jeweils zwei tatsächlich über die Engine ausgeteilten Karten und 50-Chip-Einsatz, stummes Audio und eine RTX 4080 SUPER über D3D11. Die Handansicht ist vergrößert, die Tischrunde eingebettet. Beide eigenen Handproben enthalten sichtbare Ziehen-/Stehen-Flächen. Jede Probe erfasst 241 rAF-Abstände; Maximum jeweils 16,8 ms, kein Abstand über 33 ms. Berichte: `casino-place-hand-hardware.json` und `casino-place-table-hardware.json`.

| Ansicht / Fensterbreite | Tatsächlicher Renderpuffer | Zeichenaufrufe / Dreiecke | rAF-p95 | Render-CPU-p95 |
|---|---|---|---|---|
| Eigener Platz / 1920 | 960 × 753 | 67 / 13.866 | 16,7 ms | 0,6 ms |
| Eigener Platz / 390 | 388 × 523 | 68 / 13.892 | 16,8 ms | 0,7 ms |
| Tischrunde / 1920 | 1040 × 507 | 117 / 25.162 | 16,7 ms | 1,0 ms |
| Tischrunde / 390 | 364 × 362 | 117 / 25.162 | 16,7 ms | 1,0 ms |

Die unterschiedlichen Ausschnitte und Renderpuffer gehören zu den ausdrücklich aufgezeichneten Ansichten auf derselben Desktop-GPU. Die Messfenster enthalten die stabile ausgeteilte Runde. Aktive Aufdeck-/Auszahlungsspitzen, kalte Ladezeit, GPU-Frametraces, physische Mobilgeräte und lange Prozessspeicherfolgen bleiben separat zu prüfen. Keine erfassten Browserfehler. Die tatsächlichen breiten und schmalen Hand-/Dealerbilder, das Querformat und die aktive hohe Touchansicht wurden angesehen; Kartenecken und Bedienflächen sind dort frei von überlagernden Chipstapeln beziehungsweise Navigation.

Die Tisch-Vergleichsprobe wählt nach einem Neuladen ausdrücklich dieselbe Tischansicht, bevor sie räumliche Dealer-/Chippositionen vergleicht: persönliche Seitenansichten besitzen bewusst eine andere lokale Anordnung. Die Escape-Probe öffnet ausdrücklich die Großansicht, bevor sie deren Schließen und den zurückgegebenen Fokus prüft. Beide ursprünglichen Vergleichsinvarianten bleiben erhalten.

Die bisherige Raum-/Tischfassung ist unter `outputs/qa/casino-table-before-place.json` beziehungsweise `casino-table-high-before-place.json` gesichert. Weitere Figuren-/Gruppen-/Finalinszenierung, echte Smartphone-/Bildschirmleser-/Hör-/Netzwerk-/Langzeitsitzungen und die vollständige individuelle Abnahme aller 21 Disziplinen bleiben offen. Keine neue Veröffentlichung.
