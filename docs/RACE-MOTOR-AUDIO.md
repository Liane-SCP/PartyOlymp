# Typeracer: räumliche Motoren und bestätigte Beschleunigung

Die Küstenstrecke besitzt neben Brandung, Fahrtwind und kurzen Tipp-/Rennereignissen jetzt kontinuierliche, räumliche Fahrzeugmotoren. Die Klänge werden im Projekt synthetisiert: ein weicher Dreieckton, eine leise zweite Harmonische und ein geglätteter Tiefpass erzeugen einen zurückhaltenden Spielzeugmotor. Es werden keine neuen Audiodateien heruntergeladen. Fahrzeuge, Strecke und ursprüngliche Figuren verwenden weiterhin ihre vorhandenen tatsächlich integrierten Modelle.

## Fahrt und Quelle

`RaceMotorDrive` liest ausschließlich den bestätigten öffentlichen `racers`-Fortschritt. Neue korrekte Zeichen erhöhen die Motorleistung. Derselbe Fortschritt, ein lokaler Entwurf, Fehler und zurückgenommene Zeichen erzeugen keinen zusätzlichen Schub. Nach einer kurzen Haltephase klingt die Leistung exponentiell ab. Ein erstmalig beobachteter Fahrer, ein neuer Rundenschlüssel, eine rückwärts laufende Uhr oder eine lange ausgeblendete Phase beginnen ruhig; alter Fortschritt wird nicht als neuer Beschleunigungsschub nachgespielt.

Die Klangposition folgt der tatsächlichen gerenderten Fahrzeugbesatzung. Derselbe Kamera-Hörer wie bei den räumlichen Tipp-/Rennereignissen bestimmt die Hörposition. Der eigene Wagen bleibt ausgewählt; hinzu kommen die drei dem Hörer nächsten noch fahrenden Rivalen. Zuschauer hören die nächsten vier Fahrzeuge. Die Tonlage erhält eine kleine reproduzierbare Variation je Spieleridentität. Fertige oder nicht veröffentlichte Fahrer erzeugen keine neuen Motorframes.

## Mischung und Ressourcen

`RaceMotorAudio` verwendet höchstens vier wiederverwendete Plätze mit je zwei Oszillatoren. Ein Wechsel der nächsten Rivalen belegt diese Plätze neu und erzeugt keine weiteren Quellen. Die Zahl von acht bezeichnet nur die kontinuierlichen Motorquellen; Musik, Umgebung und kurze Handlungssounds besitzen ihre eigenen bestehenden Grenzen.

Der eigene Motor ist lauter als ein einzelner Rivalenmotor. Niedrige Einzelpegel, Entfernungsdämpfung und die vorhandene Gesamtbegrenzung lassen Platz für die Tippgeräusche. Timbre-Automation ist auf 20 Hz begrenzt und verwendet gecachte Zielwerte. Die Quellen benötigen weder neue Klangpuffer noch einen Hintergrundtimer oder neue Spielnachrichten.

Motoren hängen am Effektregler und an der globalen Stummschaltung. Die Lautstärke wird innerhalb kurzer Rampen geändert. Ein bloßes Anlegen der Szene öffnet keinen Audiokontext. Nach Nutzerfreigabe wird der vorhandene Kontext verwendet. Sind alle Fahrer fertig, wechselt die Szene, verschwindet die Rennfläche oder wird das Dokument verborgen, werden Motorquellen gestoppt und ihre Verbindungen freigegeben. Eine wieder sichtbare Strecke kann im selben Kontext ein neues begrenztes Set anlegen. Verborgene Rennflächen behalten keinen eingefrorenen Beschleunigungston.

## Prüfungen

- Vier Motor-/Szenentests prüfen öffentliche Bestätigung, Abklingen, Fehler/Entwürfe, späten Einstieg, Rundenschlüssel, rückwärts laufende Zeit, fehlende Fahrer, gültige Quellen und Auswahl des eigenen/nächster Fahrzeuge. Die tatsächlichen Fahrzeug-/Figurenpositionen werden für alle Gruppengrößen von zwei bis zwölf geprüft.
- Zwei bestehende Audioframe-Tests, 17 allgemeine Szenentests, zwei Rennkamera-/Spurentests, TypeScript und Produktionsbuild bestehen. Die bekannte Clientchunk-Warnung bleibt bestehen.
- Die native Web-Audio-Probe erzeugt ein tatsächliches messbares Signal: RMS etwa 0,00150 im Leerlauf und 0,00272 bei voller Leistung in der kontrollierten Mischung, gemessener Spitzenwert nach Stummschaltung null. Diese Werte sind Signalnachweise, keine Lautheits- oder Hörabnahme.
- Zweihundert Rivalenauswahlen behalten dieselben acht Quellen. Zwölf Wechsel des Szenenbesitzers verwenden einen Kontext; alle erzeugten Oszillatoren und Motor-Panner werden abschließend freigegeben. Effektregler null und vollständiges Rennende sind ebenfalls geprüft.
- Zwei tatsächlich gerenderte Zwölfspieler-Szenen bei 1440/390 Pixeln prüfen bestätigtes Tippen, Fahrzeuganker, vier aktive Motorplätze, einen Kontext, ausgeblendete Rennfläche, simulierten Dokument-Sichtbarkeitswechsel, Fortsetzen und Zieleinlauf. Bericht: `outputs/qa/race-motor-audio.json`.
- Die sechs bestehenden Rennabläufe mit 2/8/12 Teilnehmern bei 1440/390 Pixeln bestehen einschließlich Texteingabe, Korrektur, Kamerawechsel, simulierten Tastaturflächen, Zieleinlauf und Reload. Die sparsamen Ansichten bleiben bei 61/79/91 Zeichenaufrufen. Bericht: `outputs/qa/race-view.json`.
- Beide vorhandenen räumlichen Typeracer-Audioprüfungen bestehen weiterhin. Bericht: `outputs/qa/spatial-scenes-typer.json`.

Die Quellenprüfung unterscheidet kontinuierliche Motor-Panner von einem zum Zieleinlauf noch berechtigt laufenden kurzen Fanfaren-Panner. Die Fanfare wird nicht vorzeitig abgebrochen, um einen Nullzähler zu erzwingen.

## Kurze Hardwareprobe mit aktivem Ton

Zwei native Seitenlayouts mit hoher Grafik, zwölf geladenen Figuren und tatsächlicher NVIDIA GeForce RTX 4080 SUPER über D3D11 wurden mit aktiven Motoren gemessen. Der eigene Fahrer erhält echte zeichenweise Eingabe am normalen Textfeld; elf Rivalen erhalten alle 200 ms gültige Fortschrittsaktionen durch die tatsächliche Spiel-Engine-Fixture. Damit laufen während des Messfensters bestätigte Fahrzeugbewegung, Motorbeschleunigung und Texteingabe gleichzeitig.

| Fensterbreite | Renderpuffer | rAF-Proben | rAF-p95 | Größter Abstand | App-p95 | Zeichenaufrufe | Motorquellen |
|---|---|---:|---:|---:|---:|---:|---:|
| 1920 | 1040×554 | 241 | 16,7 ms | 16,8 ms | 16,8 ms | 149 | 8 |
| 390 | 388×562 | 241 | 16,7 ms | 16,8 ms | 16,7 ms | 87 | 8 |

Beide Fenster verwenden genau einen laufenden Audiokontext und zeigen keine Intervalle über 33,5 ms innerhalb der viersekündigen rAF-Stichprobe. Bericht: `outputs/qa/race-motor-hardware.json`. Die tatsächlichen breiten und schmalen Renderbilder wurden betrachtet. Die schmale Mitfahrkamera und die breite Übersicht zeigen unterschiedliche Ausschnitte und dürfen hinsichtlich Zeichenaufrufen nicht als derselbe Bildinhalt verglichen werden.

## Prüfgrenzen und verbleibende Arbeit

Die Funktionsfälle verwenden Chromium/SwiftShader und koordinierte Spiel-Engine-Fixtures. Dokument-Sichtbarkeit wird gezielt simuliert. Die Hardwareprobe läuft auf einer starken Desktop-GPU, auch beim schmalen Fenster. Keine physische Mobilgeräte-/Kaltstart-/Eingabelatenz-/vollständige GPU-Zeit-/Langzeit-/Hörabnahme und kein vollständiges Live-Mehrbrowser-Rennen werden behauptet.

Die neue Klangschicht ist ein weiterer Schritt für die Rennmechanik. Strecken-/Umgebungs-/Ergebnisgestaltung, die gehörte Gesamtmischung, echte Gruppenrennen, mittlere Referenzgeräte und die vollständige Abnahme aller 21 Disziplinen bleiben offen. Der bekannte lokale WebSocket-Runtime-Abschlussfehler wird durch diese Fixture-Nachweise nicht behoben. Es wurde keine neue Fassung veröffentlicht.
