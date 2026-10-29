# Pixelblitz: echte lokale Mehrspielerprüfung

`node scripts/check-picture-live-session.mjs` startet eigene Räume mit zwei beziehungsweise zwölf Teilnehmern. Zwei unabhängige Chromium-Kontexte bedienen die Spieleroberfläche bei 1280 × 720 und 1920 × 1080; ein dritter Kontext schaut bei 1280 × 720 zu. Die übrigen zehn Teilnehmer des großen Falls senden echte HTTP-Aktionen. Es werden keine API-Routen, Serveruhren, Buzzerfristen oder Raumzustände ersetzt.

Die Prüfung umfasst jeweils zwei komplette Bildrunden:

- Gleichzeitige Buzzeraktionen: zwei native Browserklicks über WebSockets im Zweierfall, zwölf konkurrierende HTTP-Anfragen im großen Fall. Der Server bestätigt genau einen Besitzer, einen Buzzerwechsel und ein Buzzerereignis. Die Browser bedienen auch im großen Fall die folgenden Antworten und Runden.
- Beide Spieleransichten und der Zuschauer folgen diesem öffentlichen Teilnehmer. Nur dessen eigene Oberfläche darf das Antwortfeld anzeigen.
- Der Zuschauer kann weder buzzern noch vorzeitig die Lösung sehen. Eine falsche Antwort bleibt bei ihrem Besitzer; die anderen Teilnehmer und der Zuschauer erhalten ihren Text nicht.
- Nach einem Fehlversuch kehrt die Kamera zum Bild zurück. Eine anschließend richtige Antwort beendet die Runde und zeigt die gemeinsame Lösung.
- Die nächste Bildrunde verwendet ein anderes Motiv und setzt Versuche, Ausschluss und Buzzer zurück.
- Der Zuschauer lädt während des zweiten Buzzers neu. Seine Kamera muss zum gültigen Serverzustand passen. Die unveränderte Acht-Sekunden-Frist läuft ab; anschließend darf ein anderer Teilnehmer antworten.
- Nach beiden Runden entsteht genau ein Historieneintrag mit der richtigen Teilnehmerzahl.

Zuschauer erhalten eine kompakte, rein lesende Studioanzeige mit aktuellem Buzzer, öffentlicher Antwortzeit und aufklappbaren Crewständen. Das große generische Spielsymbol und die wiederholte Regelbox entfallen hier. Auch Teilnehmer mit abgelaufener Wiederbeitrittsfrist können diesen öffentlichen Stand verfolgen.

Bericht und Screenshots: `outputs/qa/picture-live/`. Der Bericht zählt echte Verbindungen, Snapshots und Aktionsbestätigungen pro Browser. Die Prüfung verwendet den bekannten Inhaltskatalog zur Beantwortung des bereits öffentlich ausgewählten Bildes.

Grenzen: lokale D1-/HTTP-/WebSocket-Sitzungen, Software-WebGL und drei tatsächliche Browserkontexte je Fall. Kein Nachweis von zwölf gleichzeitig gerenderten Browsern, gehosteten Sitzungen, Referenzgeräte-FPS oder subjektiver Klangqualität.
