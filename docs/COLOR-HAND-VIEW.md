# Große Handansicht und gemeinsame Tischrunde

## Drei zusammenhängende Ansichten

Farbwechsel besitzt neben der eingebetteten Baumrunde zwei vollflächige Ansichten. „Meine Karten“ zeigt drei große Karten aus der eigenen Hand. „Tischrunde ansehen“ wechselt zum gemeinsam besetzten Tisch und bleibt ebenfalls vollflächig. „Spielpult“ führt zurück zu den übrigen Anzeigen und setzt den Tastaturfokus auf das benannte Spielpult.

Diese Trennung behebt einen im kurzen Querformat gefundenen Rücksprungfehler: Die normale Seitenaufteilung lässt dort nur einen kleinen Ausschnitt der eingebetteten Bühne sehen. Eine unmittelbar dorthin zurückgeklappte Szene konnte außerhalb des sichtbaren Bereichs liegen und ihren Renderloop pausieren. Der Wechsel zwischen Hand und Tisch bleibt nun innerhalb derselben sichtbaren Bühne. Erst die ausdrückliche Wahl des Spielpults verlässt sie.

Die große Tischrunde ist eine Ansicht zum Beobachten. Sie zeigt öffentliche Aktionen, den aktiven Teilnehmer und gemeinsame Ergebnismomente. Wer selbst handeln möchte, öffnet seine Karten. Die ursprünglichen direkten Tischaktionen bleiben in der eingebetteten Ansicht erhalten. Zuschauer können die große Tischrunde ohne erfundene eigene Hand öffnen.

## Karten und Bedienung

Die Handkamera besitzt einen festen Blickwinkel und berechnet ihren Abstand aus dem tatsächlichen Seitenverhältnis. Ihre räumlichen Grenzen umfassen die drei vergrößerten Karten. Streichen dreht diese Kamera nicht versehentlich. Die Tischrunde behält die bisherige Erkundungskamera.

Die eigene Figur bleibt am gemeinsamen Tisch erhalten. Die persönliche Nahansicht nimmt ihre Perspektive ein und blendet dabei nur ihren eigenen Portraitkörper aus; beim Wechsel zur Tischrunde sind wieder alle Teilnehmer sichtbar. Die ursprünglichen Formen, Gesichter, Farben und Accessoires bleiben unverändert.

Ein kompaktes Bedienfeld ergänzt die räumlich anklickbaren Karten mit Tastatur-/Touchbuttons, Zugstatus, aktueller Farbe, Farbzeichen und Richtung. Ziehen, Blättern und der direkte Sprung zu einer Kartenseite sind erreichbar. Drei Karten pro Seite bleiben auch beim Drehen des Geräts dieselben drei Karten. In der eingebetteten Ansicht werden weiterhin bis zu acht Karten gleichzeitig gezeigt.

Die aktiven Bildschirmkarten werden beim Öffnen der Nahansicht über ein React-Portal in die Bühne versetzt. Es gibt dabei keine zweite aktive Hand mit abweichenden Befehlen. Die ursprünglichen Handindizes bleiben erhalten. Serverbefehle, Auswahl und räumliche Eingaben verwenden denselben Zustand. Die synthetische Layoutprüfung erreicht auch die letzten drei Karten eines 108-Kartenaufbaus; die Browserfälle verwenden einen gültigen 108-Kartenbestand mit einer gezielt großen eigenen Hand von 19 Karten.

Spielbare Karten besitzen jetzt eine gerundete Kontur statt einer rechteckigen Platte unter dem abgerundeten Kartenkörper. Die Konturen bleiben in einer gemeinsamen Instanzgruppe und benötigen keine zusätzlichen Texturen.

## Fokus, Joker und Übergänge

Hand und große Tischrunde sind benannte Dialogansichten. Der darunterliegende Spielpultbereich ist währenddessen `inert`. Tab bleibt in der geöffneten Ansicht. Escape führt von der Hand zur Tischrunde und anschließend zum Spielpult. Die sichtbaren Navigationsbuttons bieten dieselben Wege mit Touch.

Die Jokerwahl liegt über der Bühne. Solange sie offen ist, wird auch die Bühne für Eingaben gesperrt; nach dem Schließen wird ihr vorheriger Zustand wiederhergestellt. Escape verwirft zunächst nur die Jokerwahl. Farbwahl und ausdrückliches Bestätigen bleiben getrennte Aktionen. Das bloße Öffnen, Blättern oder Wechseln einer Ansicht sendet keinen Spielbefehl.

Im niedrigen Querformat stehen die vier Jokerfarben in einer Reihe. Bestätigung und Abbruch bleiben damit gemeinsam im sichtbaren Dialog. Die Buttons besitzen mindestens 44 CSS-Pixel Höhe/Breite. Die Einstellung für reduzierte Bewegung unterdrückt auch die Einblend-/Skalierungsbewegung dieser Farbwahl. Die Abstände am unteren Rand berücksichtigen die verfügbare Safe Area.

Beim bestätigten Rundenende wechselt die Hand automatisch zur großen Tischrunde. Gewinner und öffentliche Auflösung bleiben dort sichtbar. Das Spielpult mit den ausführlichen Ergebnissen ist direkt erreichbar. Beim Disziplinwechsel oder Verlassen der Spielphase wird der Kartenmodus geschlossen; eine offen gebliebene Jokerwahl wird ebenfalls zurückgesetzt.

## Ressourcen und Nachweise

Ansichtswechsel verwenden denselben Canvas, Renderer, Kartenatlas und dieselben Modelle. Die Karten werden umpositioniert/skaliert; ein neuer Schauplatz wird dafür nicht geladen. Der Audio-Hörer folgt der tatsächlich gerenderten Kamera. Der bestehende Audiokontext wird weiterverwendet.

`test-color-card-table.mjs` umfasst nun sechs Bereiche einschließlich Kameragrenzen, projizierter Kartenflächen auf Hoch-/Querformat, vollständiger Seitenzugänglichkeit, Wiederherstellung der Figuren und des beobachtenden Tischmodus. TypeScript und Produktionsbuild bestehen. Die bisherigen Foto-/Karten-/Jokerprüfungen und alle 17 Adventure-Prüfungen wurden während der Ausarbeitung ebenfalls erfolgreich ausgeführt.

`check-color-hand-view.mjs` prüft die neue Handansicht mit echten Maus-/Touch-Ereignissen, einem kontrollierten gültigen Kartenbestand und der echten Spielengine. Er erfasst die projizierten Kartenflächen, native Buttonmaße, direkten Karteneinsatz, Ziehen, Seitensprung, ausdrückliche Jokerbestätigung, Fokus/Escape, Geräteausrichtung, einen unveränderten Canvas, einen Audiokontext und den Audio-Hörer an der Handkamera. Das Rundenende wird durch einen echten gültigen Spielbefehl ausgelöst. Gezielte Zuganfänge und das Endspiel werden eingerichtet; das ist keine vollständig durchgespielte Live-Netzwerkpartie.

Die abschließende Matrix besteht in zwölf Browserfällen: 2/8/12 Teilnehmer auf 1440 × 1100, 390 × 844, 320 × 640 und 844 × 390 Pixeln. Hinzu kommt ein erfolgreicher Zwölf-Spieler-Fall mit reduzierter Bewegung, einschließlich unterdrückter Joker-Einblendung. Die projizierten Kartenflächen sind im geprüften stehenden Bild mindestens 62 CSS-Pixel breit und 84 Pixel hoch; alle geprüften nativen Buttons und Auswahlfelder erreichen mindestens 44 × 44 Pixel. Berichte: `outputs/qa/color-hand.json` und `outputs/qa/color-hand-reduced-focused.json`.

Auch der Geräteausrichtungswechsel während der offenen Jokerwahl besteht: Karte und gewählte Farbe bleiben erhalten, Bestätigung und Abbruch liegen weiterhin im sichtbaren Dialog. Die große Tischrunde bleibt im Querformat vollständig als eigene Ansicht offen; erst „Spielpult“ verlässt sie. Fokus, zwei Escape-Schritte, direkte Spiel-/Ziehbefehle, Seitensprung und tatsächlicher Rundenabschluss bestehen. Die instrumentierten nativen Audiokontexte bleiben bei einem Kontext pro Ansicht; der Audio-Hörer stimmt mit der Handkamera überein. Die vorhandenen Foto-/Karten-/Joker- und Sound-/Dealer-/Emoteprüfungen bleiben ebenfalls erfolgreich.

Der Ressourcenlauf über 18 Wechsel zwischen Handansicht, Casino und Kaufhaus besteht. Pro Ort gibt es sechs vollständig geladene Besuche mit zwölf Avataren, einem aktiven Canvas und ohne WebGL-Fehler. Andere Disziplinen erhalten weder ein verbliebenes Kartenportal noch ein gesperrtes Spielpult. Die niedrige Handansicht meldet je nach passenden Karten 52–53 Zeichenaufrufe, 30 Texturen und 33–34 Geometrien. Eine unbenutzte Konturgeometrie wird erst bei einer tatsächlich spielbaren Karte hochgeladen; das erklärt die Schwankung um eins. Casino und Kaufhaus bleiben bei ihren jeweiligen stabilen Zählern. Bericht: `outputs/qa/scene-lifecycle-card-hand-18.json`.

Tatsächliche Desktop-/Mobilbilder der Hand, der kompakten Jokerwahl und der gemeinsamen Zwölferrunde wurden angesehen. Die rechteckige Unterlage unter der runden Kartenkontur sowie die verdeckten Querformataktionen wurden dabei korrigiert. Die Arbeit bleibt lokal und unveröffentlicht.

Die vollständige Farbwechsel-Abnahme bleibt offen: sämtliche langen Karten-/Zeitlimit-/Unterbrechungsszenarien, die vollständige räumliche Ergebnisrangfolge, echte Geräte-/Latenz-/Prozessspeicherwerte, Hör- und Screenreader-Abnahme sowie eine reale Mehrbrowserpartie. Die übrigen Disziplinen, Reise und Gesamtveröffentlichung bleiben Teil des unveränderten Gesamtziels. Chromium-/SwiftShader-Geometrie und stabile Rendererzähler sind keine physische Geräte-FPS- oder vollständige Speicherabnahme.
