# Größengefühl: gemeinsame Museumsgalerie

Stand: 18. Oktober 2026. Dies ist eine verifizierte Teilverbesserung innerhalb des vollständigen 21-Spiele-Ziels, keine Disziplin- oder Gesamtfreigabe.

## Verhalten

Die Auflösung wechselt in eine gemeinsame Museumsrunde. Die Figuren kommen anhand des öffentlichen `revealStartedAt` zu ihren Plätzen vor den Exponaten. Wiederbeitritt sucht die aktuelle Position auf derselben Zeitachse; reduzierte Bewegung zeigt den Endzustand direkt.

Drei öffentliche Ergebnistafeln zeigen eine Seite der Teilnehmer. Die Auswahl erfolgt über die räumlichen Tafeln, die Teilnehmerliste, Vor/Zurück oder „Mein Tipp“. Die Vergleichsansicht zeigt den ausgewählten Tipp neben dem echten Wert oder neben dem bekannten Referenzobjekt. Fehlende Abgaben erhalten keinen erfundenen Messkörper. Punkte und Rang folgen den öffentlichen Ergebnissen, einschließlich Gleichständen.

Nur die sichtbaren Vergleichspartner bestimmen den gemeinsamen Maßstab. Ein ausgeblendetes, sehr großes Lösungsmodell verkleinert deshalb nicht mehr den Referenzvergleich. Die Messanker behalten ihre tatsächlichen Größenverhältnisse. Die Kamerahülle bleibt pro Objekt und Ansicht fest und berücksichtigt die Höhe der Navigation. Beim Ziehen wird der Ausschnitt nicht mit dem eigenen Tipp nachgeregelt.

Vor der Auflösung gelangen keine fremden Schätzwerte oder echten Maße in die Galerie. Öffentliche Abgabemarken bleiben sichtbar. Die tatsächliche Lösung wird ausschließlich aus der freigegebenen Auflösung gelesen; veraltete Ergebnisfelder während einer neuen Eingabephase werden ignoriert.

Die präzise Eingabe liegt jetzt als einzelnes Messpult innerhalb der Museumsansicht. Die zweite 2D-Objektbühne unter der Szene ist entfernt. Zahlenfeld, logarithmischer Regler, Halbieren/Verdoppeln und echte Zehn-Prozent-Schritte steuern denselben privaten Tipp. Enter bestätigt ausdrücklich und berücksichtigt laufende Texteingabekomposition. Ein laufender Abgabeversuch ist gegen Doppelaktivierung geschützt.

Gültige Entwürfe werden in der aktuellen Browser-Sitzung pro Raum, Olympiadenstart, Spielindex, Runde und Teilnehmer wiederhergestellt. Ungültige Eingaben sperren die Abgabe und entfernen den automatischen Zeitlimit-Entwurf; das Modell behält währenddessen den letzten gültigen Wert. Bestätigte Abgaben löschen den lokalen Entwurf. Die Eingabe akzeptiert die serverseitigen Grenzen `0 < cm <= 100000000`; der logarithmische Regler deckt `0,001 … 100000000 cm` ab, noch kleinere positive Werte bleiben über das Zahlenfeld erreichbar. Kleine Maße werden nicht mehr auf „0 mm“ gerundet.

Das Pult behält sein DOM-Element beim Größenwechsel und beim Neuaufbau der 3D-Ansicht durch den Ruhemodus. Ein Ausfall der 3D-Ansicht verlegt das Pult nicht während des Schreibens an eine andere Stelle. Die Navigation wird als Ganzes vermessen; ihre aktuelle Höhe reserviert Platz im Kameraausschnitt.

Referenz und Schätzobjekt besitzen unabhängige Messrichtungen. Eine Giraffen-Höhe bleibt deshalb auch neben einer Container-Länge aufrecht und erhält einen vertikalen Messstab. Das gemeinsame Längenmaß bleibt unverändert. Der Modellbibliothek wurde außerdem die korrekte Erkennung von „Höhe“ mit Umlaut wiedergegeben.

Die breite räumliche Reglerleiste, deren Erklärungsschild und der zusätzliche räumliche Bestätigungsknopf sind entfernt. Das Modell selbst und ein kleiner messingfarbener Messgriff sind direkt greifbar: Längen ändern sich mit horizontaler, Höhen mit vertikaler Bewegung. Die relative Größenänderung beginnt beim aktuellen Tipp. Der Griff besitzt eine kameraabhängige Trefferfläche von 44 CSS-Pixeln auf einer ausschließlich für Raycasts verwendeten Ebene; diese Fläche wird nicht gerendert. Die Genauigkeitseingabe und die eindeutige Abgabe bleiben am integrierten Messpult.

Antippen bzw. Bewegung unter drei Pixeln in Messrichtung erzeugt keinen Entwurf. Beim Abbruch einer bereits begonnenen Bewegung bleibt deren letzter gültiger Vorschauwert erhalten; es wird keine Antwort bestätigt. Ein Wechsel der verbindlichen Spielphase beendet die alte Geste, bevor sie die Eingabe einer neuen Runde verändern kann. Die Abgabe selbst benötigt weiterhin eine ausdrückliche Bestätigung oder den bereits vorgesehenen Zeitlimit-Entwurf.

Ziehen und Regler runden ihre Werte auf sechs signifikante Stellen, damit das Zahlenfeld keine langen rechnerischen Nachkommastellen zeigt. Andere numerische Bedienhilfen entfernen Gleitkomma-Rauschen nach zwölf signifikanten Stellen. Direkt getippte gültige Zahlen bleiben davon unberührt.

Die Ergebnistafeln liegen nach visueller Korrektur an der Rückwand. Sie verdecken die Messmodelle nicht mehr. Vorhandene Kenney- und Giraffenmodelle sowie Lizenzlinks bleiben integriert.

Das echte Exponat wird jetzt gemeinsam mit dem eigenen Enthüllungsklang bei 475 ms auf der öffentlichen Ergebnisuhr eingeblendet. Uhrkorrekturen, reduzierte Bewegung und ein Wiedereinstieg erzeugen keine doppelten oder nachgeholten Klänge. Nachweise und Grenzen der sieben instrumentierten Klangfälle stehen in [SIZE-AUDIO.md](SIZE-AUDIO.md).

## Nachweise am aktuellen Quellstand

- `node scripts/test-size-presentation.mjs`: 6 bestandene Tests. Deckt echte öffentliche Spielansichten für 2/8/12 Teilnehmer, private und veraltete Informationen, fehlende Abgaben, Gleichstände, Rundenzurücksetzung, gemeinsame Zeitachse, Kamerahüllen, sichtbaren Vergleichsmaßstab und Eingabe-/Reglergrenzen einschließlich verbindlicher Zeitlimit-Entwürfe ab. Protokoll: `outputs/qa/size-console-unit.log`.
- `node scripts/test-adventure.mjs`: 17 bestehende Tests bestanden.
- `node node_modules/typescript/bin/tsc --noEmit`: erfolgreich.
- Produktionsbuild über den Sites-Buildhelfer: erfolgreich; aktuelles Protokoll `outputs/qa/size-direct-build.log`. TypeScript und `git diff --check` bestehen.
- `node scripts/check-size-museum.mjs`: bestanden bei 1440 und 390 CSS-Pixeln mit zwölf geladenen Figuren. Prüft horizontales Ziehen am Griff, vertikales Ziehen am Modell, direktes Touch-Ziehen per Chromium-Touchereignissen, einen Touch-Start 20 Pixel neben dem winzigen sichtbaren Griff, Abbruch ohne Abgabe und einen während des Ziehens erfolgenden Rundenwechsel. Ein normaler Raumtick entfernt dabei alte Zeitlimit-Entwürfe wie im tatsächlichen Raumablauf. Antippen bzw. zwei Pixel Mausbewegung erzeugen keinen Entwurf. Weitere Prüfungen: unveränderte Kamera, Größenverhältnisse an tatsächlichen Modellankern, Zahlenbedienung, alle zwölf öffentlichen Tipps, fehlende Abgabe, Tastaturauswahl, Referenzwechsel, räumliche Tafelauswahl, Wiederladen während der Auflösung, neue Runde und Künstlerlinks. Die Gestenberechnung verwendet die tatsächlich empfangenen Pointer-Koordinaten; Messverhältnisse werden gegen den tatsächlich eingestellten Wert geprüft. Keine erfassten Browserfehler. Protokoll: `outputs/qa/size-direct-browser.log`.
- `node scripts/check-size-console.mjs`: bestanden bei 1440 und 390 CSS-Pixeln. Prüft ein einzelnes integriertes Pult, entfernte zweite Objektbühne, erhaltenes Eingabe-DOM/Fokus/Canvas bei Größenwechseln, erhaltenes Eingabe-DOM/Fokus beim Renderer-Neuaufbau, private Wiederherstellung nach Neuladen, Löschen des verbindlichen Zeitlimit-Entwurfs bei ungültiger Eingabe, Werte von `0,00001 cm` bis `100000000 cm`, verständliche Kleinstmaßanzeige, echte Zehn-Prozent-Schritte, Enter-Abgabe, Sperrung/Löschen des Entwurfs nach Bestätigung und Rücksetzung der nächsten Runde. Enthält ausdrücklich die vertikale Giraffenreferenz neben dem horizontalen Container. Aktuelles Protokoll: `outputs/qa/size-direct-console.log`.
- Ressourcenprüfung mit `LIFECYCLE_GAMES=size,dice`, `LIFECYCLE_STEPS=8`, jeweils `LIFECYCLE_SIZE_RESULTS=0` und `1`: beide bestanden, insgesamt 16 Szenenwechsel. Prüft einzelne bzw. entfernte Messpulte, jeweils ein Canvas, zwölf geladene Figuren und Grafikbudgets. Die Auflösung enthält Teilnehmerwahl sowie wiederholte Wechsel zwischen 390 und 1440 Pixeln. Museum/Eingabe: 41–51 Zeichenaufrufe, 1.818–3.868 Dreiecke, 7–9 Texturen, 16 Geometrien. Museum/Auflösung: 78–89 Zeichenaufrufe, 2.772–5.508 Dreiecke, 26–28 Texturen, 36 Geometrien. Unterschiedliche Exponate erklären die Ressourcenunterschiede. Keine erfassten WebGL-Fehler. Berichte: `outputs/qa/size-console-lifecycle-answer.json` und `outputs/qa/size-console-lifecycle-reveal.json`.
- Dieselbe Ressourcenprüfung wurde nach der Umstellung auf die direkte Messstation erneut mit insgesamt 16 Szenenwechseln bestanden: Eingabe 35–50 Zeichenaufrufe, 2.284–4.662 Dreiecke, 6–7 Texturen, 14–15 Geometrien; Auflösung 78–87 Zeichenaufrufe, 2.828–7.884 Dreiecke, 26–28 Texturen, 36–37 Geometrien. Berichte: `outputs/qa/size-direct-lifecycle-answer.json` und `outputs/qa/size-direct-lifecycle-reveal.json`. Danach wurden nur Eingabeschwelle und Zahlenrundung ergänzt; die Szenenressourcen blieben unverändert. Die abschließenden Gesten- und Pultprüfungen wurden auf dieser finalen Eingabelogik wiederholt.

Die Renderbilder `size-gallery-input-{1440,390}.png`, `size-museum-horizontal-{1440,390}.png`, `size-gallery-selected-{1440,390}.png`, `size-museum-vertical-{1440,390}.png`, `size-console-invalid-{1440,390}.png`, `size-console-extreme-{1440,390}.png` und `size-console-next-round-{1440,390}.png` unter `outputs/qa/` wurden tatsächlich visuell kontrolliert. Erkannte Fehler bei Tafeln, Enter-Bestätigung und Referenzausrichtung wurden korrigiert; anschließend wurden die betreffenden Browserprüfungen wiederholt.

Die Browserprüfungen verwenden die echte Spielengine mit abgefangenen Raumantworten und Chromium/SwiftShader. Sie beweisen weder eine reale Mehrbrowser-Netzwerkpartie noch FPS auf den Referenzgeräten. Die Ressourcenprüfung kontrolliert die pro Renderer gemeldeten Ressourcen, nicht den vollständigen Prozess- oder GPU-Speicher nach Garbage Collection.

## Noch offen

- Exakte Modelle für konkrete Archivobjekte; derzeit bestehen weiterhin ausdrücklich symbolische Kategoriemodelle.
- Stärkere Ausgestaltung und Beleuchtung des Museums sowie größere, situationsbezogene Beschriftungen auf schmalen Geräten. Die Gruppenansicht dient dort der Orientierung; die Auswahl und Ergebniswerte bleiben über die Bildschirmnavigation zugänglich.
- Weitere Ausgestaltung der physischen Messstation und größere bzw. stärker eingeführte Messgriffe auf schmalen Geräten. Die große Beschriftungen verdeckende Leiste ist beseitigt; kleine Sockelschriften bleiben in der Gruppenübersicht auf Smartphones eingeschränkt lesbar. Die Bildschirmnavigation stellt die Werte separat dar.
- Native Bildschirmtastaturprüfung, weitere Unterbrechungs-/Fehler-/Entwurfsvarianten und Qualitätswechsel während der Eingabe. Die bisherige Fokusprüfung simuliert Browsergrößen und einen Renderer-Neuaufbau, kein tatsächliches Smartphone.
- Lautsprecher-/Kopfhörer- und Referenzgeräteabnahme, Musikabmischung und echte Hintergrundphase über die Enthüllungsgrenze. Die instrumentierten Web-Audio-Prüfungen für Live-Stummschaltung, Effekte null, aktive Klangunterbrechung und Wiedereinstieg bestehen; Einzelheiten in [SIZE-AUDIO.md](SIZE-AUDIO.md).
- Sämtliche Archiv-Messanker und Extremfälle, echte Gruppenpartien mit Verbindungsunterbrechung/Wiedereinstieg, Referenzhardware und komplette Olympiade.

Der Gesamtumfang und die übrigen Disziplinen bleiben in `ADVENTURE-STATUS.md` und `BESPOKE-ADVENTURE.md` maßgeblich. Die gehostete Fassung wurde in diesem Schritt nicht verändert.
