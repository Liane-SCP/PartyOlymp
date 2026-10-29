# Spielregie und 16:9

Stand: 22.10.2026. Desktop in 16:9 ist das Hauptformat. Geprüfte Ansichten: 1280 × 720, 1366 × 768 und 1920 × 1080. Die Spielwelt füllt das Fenster; Eingaben, Menüs und längere Texte liegen darüber. Kurze Beschriftungen brauchen keine zusätzliche flächige Karte.

## Kameraentscheidungen

| Spiel | Geführte Ansicht und Vorrang der eigenen Bedienung |
| --- | --- |
| Pixelblitz | Bestätigter Buzzer → aktiver Teilnehmer samt Buzzer. Fehlversuch, Timeout, Auflösung und neue Runde → Bild. Bild, eigener Platz und Studio bleiben manuell anwählbar. Zuschauer folgen demselben öffentlichen Buzzer. |
| Bombenwort | Aktueller Bombenträger mit Werkbank; Übergabe wechselt den Fokus. Persönliche Worteingabe hat Vorrang. Die Kamera verwendet keine geheime Zündzeit. |
| Kategorien-Kette | Aktiver Teilnehmer und sein Abschnitt der Expedition. Persönliche Eingabe hat Vorrang; Themenwahl und Ergebnis verwenden die Ortsansicht. |
| Typeracer | Teilnehmer starten mit der Mitfahrkamera, wahlweise Streckenübersicht. Nach dem eigenen Zieleinlauf und bei der Auswertung geht es zur Übersicht über die Crew. Ruhige Ansicht bleibt ohne Mitfahrt. |
| Würfelwerk | Gemeinsamer Tisch mit wählbarem eigenen Würfelplatz, anschließend Blattvergleich. Keine Umschnitte während der Würfelauswahl. |
| Budget-Bande | Abteilungsübersicht oder ausgewähltes Angebot, anschließend Kasse und öffentliche Bonansichten. |
| Club 21 | Eigene Karten; bei der Auflösung Dealer und Auszahlung. Tischübersicht bleibt anwählbar. |
| Farbwechsel | Gemeinsamer Tisch und sichtbarer Zugmarker; persönliche Hand beim Auswählen. Kein fremder Zug reißt die Handansicht weg. |
| Codeknacker | Werkstattübersicht und eigene Werkbank. Der Code bleibt privat; keine Kamerafahrt aufgrund fremder geheimer Versuche. |
| Kopf-Auktion | Öffentlicher Bühnenauftritt und Hammer; das private Jurybuch hat Vorrang. |
| Zeitgefühl | Feste Messstation während der Messung; anschließend öffentliche Sternentafel und Ergebniswahl. Keine dekorative Kamerabewegung als Taktgeber. |
| Stadt Land Fluss | Eigenes Arbeitsheft beim Schreiben, gemeinsame Blätter bei Bewertung und Ergebnis. |
| Weltreise | Werkstatt, eigener Kartenplatz oder Globus. Präzise Pins und Panoramabedienung behalten eine feste Kamera. |
| Hivemind | Eigener Gedanke beim Schreiben; öffentliche Antwortgruppen nach der Enthüllung. |
| Spectrum | Festes Messinstrument bei der Eingabe, gemeinsame Ergebnisansicht nach der Enthüllung. |
| Wiki-Sprint | Bibliothek, Links und eigener Weg. Die Kamera bewegt sich beim Lesen nicht automatisch. |
| Farbgedächtnis | Vorlage → eigenes Mischpult → Ergebnisse. Feste Farbvergleichsansicht. |
| Größengefühl | Orthografischer Vergleich → Ergebnisgalerie; keine Perspektivverzerrung und keine Bewegung während des Messgriffs. |
| Würfelkoloss | Eigener Runenplatz, Bossaktion und gemeinsame Salve; Tempelübersicht bleibt anwählbar. |
| Krakensturm | Eigene Kanone bei der Eingabe, gemeinsame Salve und Treffer; Schiffsübersicht bleibt anwählbar. |
| Münzdrache | Eigener Preisaltar bei der Eingabe, gemeinsame Münzsalve und Bossaktion; Hortübersicht bleibt anwählbar. |

Die bestehende Ortsregie bleibt in ihren jeweiligen Präsentationsmodulen. `lib/camera-direction.ts` ergänzt öffentliche Zugwechsel und zeitunabhängiges Einschwingen. Pixelblitz verwendet reale Figurenplätze und einen Blick vom Mittelgang, damit vordere Pulte den aktiven Teilnehmer nicht verdecken. Die eigene Antwort bleibt beim Ansichtswechsel als derselbe DOM-Knoten mit gleichem Entwurf bestehen.

Reduzierte Bewegung schneidet direkt auf eine neue Pixelblitz-Ansicht und unterbindet automatische Zugverfolgung bei Bombenwort und Kategorien-Kette. Die ständig laufende kleine Kameradrift entfällt. Während eines gehaltenen Zeigers bleibt die Kamerapose fest; erst eine bewusste Ziehbewegung erkundet die Szene. Dadurch bewegt sich ein Klickziel nicht zwischen Drücken und Loslassen weg. Kamerastöße bewegen ausschließlich die 3D-Fläche; feste Eingaben und Menüs behalten ihre Position und ihren CSS-Bezugsrahmen.

## Bedienung und Laufzeit

Emote-Favoriten senden jetzt sowohl beim Anklicken als auch mit 1–6. Sterne verwalten die Favoriten; bei sechs belegten Plätzen lässt sich weiterhin gezielt ersetzen. Wiederholte Tastaturereignisse, Texteingabe und IME-Komposition lösen keine zusätzlichen Reaktionen aus.

Einstellungen und andere App-Dialoge setzen ihre Geschwister vorübergehend auf `inert`. Tab und Escape bleiben beim obersten App-Dialog; ein darunterliegendes Karten-, Casino- oder Instrumentenfenster verarbeitet dieselben Tasten nicht zusätzlich. Neue Spielfelder im Hintergrund können den Fokus nicht aus dem Menü nehmen. Beim Schließen wird der vorherige Fokus wiederhergestellt.

Größenabhängige Layoutänderungen werden über `FrameResizeObserver` auf den nächsten Frame gelegt. Dadurch wird während der ResizeObserver-Zustellung keine neue Größenänderung ausgelöst. Der Pixelblitz-Bildausschnitt wird nur bei Größen-, Ansichts- oder Teilnehmerwechsel neu berechnet. Die orthografische Projektionsmatrix wird nur bei geändertem Ausschnitt aktualisiert.

Das Würfelpult liegt im 16:9-Format rechts, damit der eigene Platz frei bleibt. Das Schreibblatt zeigt bei 1366 × 768 bereits alle sieben Eingaben und die feste Abgabe. Das Maßstabsmuseum reserviert den Platz des seitlichen Messpults in seiner orthografischen Projektion; beide Vergleichsobjekte bleiben frei. Hivemind verwendet nur die tatsächlich benötigte Formularhöhe. Wortlisten und das Expeditionstagebuch werden bei Bedarf geöffnet. Die Kamerawahl von Pixelblitz, Spectrum und Farbgedächtnis benötigt keine zusätzliche durchgehende Hintergrundfläche.

## Kamerawahl bei Wortbombe und Begriffskette

Die Bühnenkamera bietet „Spieler folgen“ und „Übersicht“. Die Verfolgung verwendet ausschließlich den öffentlichen aktiven Spieler und nennt ihn neben den Tasten. Die Übersicht bleibt auch bei einem Zugwechsel ausgewählt; beim Wechsel der Disziplin beginnt wieder die automatische Regie. Beide Tasten setzen vorherige manuelle Drehungen zurück.

Das persönliche Eingabepult hat weiterhin Vorrang. In dessen Nahansicht ist die zusätzliche Kamerawahl ausgeblendet. Bei reduzierter Bewegung bleibt die ruhige Übersicht aktiv. In der 16:9-Ansicht steht die Kamerawahl oben links, der Expeditionsfortschritt darunter; beide benötigen keine zusätzliche Hintergrundfläche.

Diese Ergänzung wurde auf Wunsch ohne neue Testläufe umgesetzt. Die folgenden Nachweise stammen aus früheren Läufen und belegen die neue Kamerawahl nicht.

## Mitfahrkamera nach dem eigenen Zieleinlauf

Zuschauer und bereits fertige Teilnehmer können beim Typeracer ein noch fahrendes Crewmitglied auswählen und dessen Fahrzeug verfolgen. Während des eigenen Rennens bleibt der eigene Fahrer das Ziel der persönlichen Mitfahrkamera. Mit „Streckenübersicht“ endet die Verfolgung. Nach dem bestätigten Zieleinlauf des ausgewählten Fahrers kehrt die Kamera ebenfalls zur Übersicht zurück; ein weiterer Fahrer wird bewusst ausgewählt.

Die Verfolgung liest ausschließlich öffentliche Fahrerpositionen und Zieleinläufe. Sie verwendet weiterhin den bestehenden Renderer und bleibt bei ruhiger Ansicht oder reduzierter Bewegung ausgeschaltet. Die Kamerawahl reserviert in 16:9 den Platz der seitlichen Zuschauer- beziehungsweise Zielanzeige. Beim Rundenwechsel beginnt die Zuschauerwahl wieder in der Übersicht. Die Dealeransicht im Casino wechselt bei einem neuen Durchgang nur für einen mitspielenden Teilnehmer in die eigene Handansicht.

Diese Ergänzung wurde ohne neue Testläufe umgesetzt. Die älteren Nachweise unten belegen die neue Wahl eines fremden Rennfahrzeugs nicht.

## Rückkehr zur Übersicht

Die gemeinsame Kamerataste heißt „Bühnenübersicht anzeigen“ und wechselt auch bei fest eingerichteten Nahansichten zur jeweiligen Raum-, Tisch- oder Gruppenansicht. Bei Kettenreaktion, Bombe und Typeracer beendet sie zusätzlich die Spielerverfolgung. Private Eingaben und die gewählten Vergleichsobjekte bleiben erhalten. Pixelblitz richtet die Kamera beim nächsten Buzzerwechsel weiterhin automatisch auf den aktiven Spieler.

Bei Zeitgefühl ist diese Taste während einer laufenden Messung gesperrt. Die Änderung wurde ausschließlich am Quelltext bearbeitet; es wurden keine Testläufe ausgeführt.

## Zeigerbedienung

Eine laufende Ziehbewegung gehört genau einem primären Zeiger und der Spielphase, in der sie begonnen wurde. Weitere Berührungen übernehmen sie nicht. Bei Phasenwechsel, Fensterwechsel, ausgeblendetem Tab, verlorenem Zeigerfang oder abgebrochener Berührung wird die Geste beendet, ohne eine zusätzliche Eingabe beim Loslassen auszulösen. Bereits während des Ziehens geänderte Entwürfe bleiben erhalten. Dadurch kann ein verlorenes Loslassen die automatische Kamera nicht dauerhaft festhalten.

Auf dem Globus setzt gehaltenes Enter den Pin nur einmal; während einer ausstehenden Bestätigung setzt Enter keinen neuen Pin. Diese Änderungen wurden ohne Testläufe umgesetzt.

## Reduzierte Bewegung

Die gemeinsame Bewegungseinstellung berücksichtigt sowohl die Spieloption als auch die Systemeinstellung und aktualisiert sich bei Änderungen des Systems. Boss-Szenen lesen die Systemeinstellung zusätzlich direkt, sodass ihre Kamerafahrten und Erschütterungen auch unabhängig vom Plattformrahmen reduziert bleiben.

Auf der Weltkarte ändert die Bewegungseinstellung die laufende Szene, ohne Renderer, Figuren und Kartenansicht neu aufzubauen. Wird während einer geführten Reise auf reduzierte Bewegung umgeschaltet, endet die Verfolgung mit einer festen Ansicht der aktuellen Insel. Diese Änderungen wurden ohne Testläufe umgesetzt.

## Reproduzierbare Nachweise

- `node scripts/test-camera-direction.mjs`: exklusive Buzzerhoheit, Rückkehr nach Fehlversuch/Timeout, reale Plätze für 2/8/12 Spieler, Schmal- bis Breitformat, Priorität persönlicher Eingaben und bildratenunabhängiges Einschwingen.
- `node scripts/test-picture-presentation.mjs`: Bildfreigabe, private Antworten, Auflösung und bisherige Studioansichten.
- `node scripts/check-camera-direction.mjs`: native Chromium-Eingaben, beide 16:9-Auflösungen, zwölf Teilnehmer und Zuschauer, manuelle Bildwahl, echte richtige/falsche Antworten und Timeout, gleichbleibender Renderer sowie Emote-Favoriten. Ergebnisse: `outputs/qa/camera-direction/report.json`.
- `node scripts/check-picture-live-session.mjs`: zwei vollständige Bildrunden mit 2/12 Teilnehmern über echte lokale D1-/HTTP-/WebSocket-Verbindungen, zwei Spielerbrowser und ein Zuschauerbrowser. Gleichzeitiges Buzzern, gemeinsamer Kamerafokus, private Fehlantwort, Neuladen, unveränderte Acht-Sekunden-Frist und einmalige Wertung. Umfang und Grenzen: [PIXELBLITZ-LIVE.md](PIXELBLITZ-LIVE.md).
- `node scripts/test-size-presentation.mjs`: exakte Größenverhältnisse, private Tipps und orthografische Ausschnitte, einschließlich freier Vergleichsflächen neben dem 16:9-Pult.
- `node scripts/check-modal-priority.mjs`: Einstellungen über der privaten Kartenansicht, Tab-Priorität, isoliertes Escape, blockierter Hintergrund-Autofokus beim Disziplinwechsel und wieder bedienbares Schreibblatt nach dem Schließen. Ergebnis: `outputs/qa/modal-priority.json`.
- `$env:PARTY_CHECK='games'; $env:PARTY_WIDTHS='1280,1366,1920'; $env:PARTY_REPORT='outputs/qa/party-flow/report-16x9-final.json'; node scripts/check-party-flow.mjs`: Startansichten aller 21 Disziplinen, bildschirmfüllende Welt ohne Seitenscrollen, native Code-/Karten-/Größeneingaben, Schreibblattabgabe, Würfelwurf und Wertungsblatt, Hivemind, Ergebnisse und Einstellungen. Ergebnisse: `outputs/qa/party-flow/report-16x9-final.json` (70 Fälle, keine Browserfehler).

Die Browserläufe verwenden die echte Anwendung mit kontrollierten Engine-Zuständen und Software-WebGL. Sie belegen Darstellung und die geprüften Eingabewege. Sie belegen weder Referenzgeräte-FPS noch eine vollständige Netzwerkpartie oder die gesamte bisherige Schauplatz-/Audio-Designmatrix.
