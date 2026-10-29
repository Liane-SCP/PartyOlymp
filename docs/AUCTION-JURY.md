# Kopf-Auktion: privates Jurybuch und gemeinsames Bühnenbuch

Die Jury prüft Begriffe nun in einem eigenen Buch mit sechs Einträgen pro Seite. Die Gestaltung übernimmt Papier-, Messing- und Petroltöne des Auktionssaals. Nummer, vollständiger Begriff und drei eindeutig beschriftete Entscheidungen bleiben auch bei langen Antworten und auf schmalen Bildschirmen erreichbar. Die separate öffentliche Liste ist während der eigenen Prüfung einklappbar.

## Verständlicher Ablauf

„Noch offen“ ist ein eigener Zustand. Er unterscheidet sich von bewusst gewählter Enthaltung. Fortschritt und Zusammenfassung zeigen gültige, ungültige, enthaltene und offene Einträge. „Offene Begriffe“ führt zur nächsten Seite mit einer offenen Antwort und fokussiert die erste dort noch offene Entscheidung. Vor- und Zurückblättern behält sämtliche bisherigen Entscheidungen.

Vor der Abgabe einer unvollständigen Bewertung erscheint eine konkrete Rückfrage mit der Anzahl offener Begriffe. Man kann weiterprüfen oder die offenen Einträge als Enthaltung festlegen. Vollständig geprüfte Bücher benötigen keine zusätzliche Bestätigung. Nach der verbindlichen Abgabe bleibt das eigene Buch lesbar, die Entscheidungen sind gesperrt. Die übrige Crew sieht nur, wer bereits abgegeben hat.

Der aktuelle Prüfplatz verbindet Oberfläche und 3D-Szene: Jurybuch und Bühnenbuch zeigen dieselbe Seite. Das Bühnenbuch markiert den eigenen ausgewählten Begriff mit einem schmalen Messingrahmen. Ein Klick auf dessen räumliche Zeile führt zur passenden Entscheidungszeile im privaten Buch. Es wird dadurch keine Stimme abgegeben. Die vorhandene Buchkamera und dieselbe Szene bleiben erhalten. Zuschauer und der auftretende Spieler können keine Juryaktion auslösen. Nach Abgabe sind auch die räumlichen Juryziele deaktiviert.

Blättern und bewusste Auswahl erhalten kurze lokale Rückmeldungen. Wiederherstellung und fremde Statusänderungen spielen diese Bediengeräusche nicht nach. Die hörbare Qualität ist weiterhin separat zu prüfen.

## Entwürfe, Geheimhaltung und Wertung

Der Entwurf wird im Sitzungsspeicher gegen Raum, Spieler, Phase und die genaue Begriffsliste abgegrenzt. Zusätzlich nutzt das Jurybuch die vorhandene private serverseitige Deadline-Eingabe. Diese speichert Stimmen und Angaben darüber, welche Einträge bereits bewusst geprüft wurden. Ohne lokalen Cache kann das Buch aus diesem bestätigten Serverentwurf wiederhergestellt werden. Ältere Entwürfe ohne Prüfmetadaten bleiben lesbar: vorhandene Ja-/Nein-Stimmen werden übernommen, leere Stimmen erscheinen als offen.

Die Prüfmetadaten verändern die Spielregeln nicht. Verbindlich sind weiterhin die serverseitigen Ja-/Nein-Stimmen; Enthaltungen tragen zu keiner Seite bei. Mehr Ja als Nein bedeutet gültig. Gleichstand und fehlende Stimmen bedeuten ungültig. Der Auftretende stimmt nicht über seine eigenen Antworten ab. Erfolg beziehungsweise Fehlschlag verändert seinen Rohwert um das Zehnfache des Gebots. Alle anderen erhalten dafür null Rohpunkte. Die anschließende Olympiadenwertung bleibt unverändert.

Stimmen und Prüfmetadaten werden ausschließlich im eigenen `mine`-Zustand zurückgegeben. Öffentliche Statusanzeigen, Bühnenbuch und andere Browser erhalten vor der Auflösung keine Zwischenmehrheiten. Im lokalen 3D-Entwurf stehen nur Buchseite und ausgewählter Index. Nach erfolgreicher Abgabe wird der Sitzungscache entfernt. Wiederholte oder verspätete Bewertungen bleiben durch die bestehende Serverlogik gesperrt.

## Umsetzung und Ressourcen

`lib/auction-jury.ts` enthält Zustand, Zusammenfassung, validierte Wiederherstellung und Seitenwahl. `components/olymp/auction-jury.tsx` führt Eingabe, private Sicherung, Abgabe und Buchverknüpfung aus. `trio-games.tsx` bindet das Jurybuch anstelle der bisherigen langen Bewertungsliste ein. `game-board.tsx` leitet ausschließlich erlaubte räumliche Auswahlereignisse weiter. Die sechs bereits vorhandenen Buchzeilen werden als Auswahlziele wiederverwendet; `auction-location.ts` ergänzt einen geteilten Rahmenkörper. Die Figuren, heruntergeladenen Möbel und der lizenzierte Hammer bleiben dieselben. Es wird kein zweiter Renderer aufgebaut und kein zusätzliches Modell heruntergeladen.

## Prüfungen

- Sechs neue Tests in `tests/auction-jury.test.ts` bestehen: Unterscheidung offener Einträge und Enthaltungen, sichere JSON-Wiederherstellung, Navigation über unvollständige letzte Seiten, private Serverentwürfe, Legacy-Entwürfe, unveränderliche bestätigte Stimmen, echte Raum-Deadline-Verarbeitung, Mehrheits-/Gleichstandsregeln und räumliche Auswahl auf der neunten Buchseite bei zwölf Teilnehmern.
- Die zehn vorhandenen Auktions-Präsentationstests bestehen weiterhin, einschließlich der tatsächlichen Modellgeometrie und Auftrittswege.
- Vier neue native Browserfälle durchlaufen sieben beziehungsweise fünfzig Begriffe, zwei beziehungsweise zwölf Teilnehmer und 1440 beziehungsweise 390 Pixel. Je Fall öffnen drei voneinander getrennte Browserkontexte die Jury-, Auftritts- und Zuschaueransicht. Geprüft werden lokale und reine Server-Wiederherstellung, bewusste Enthaltung, Buchauswahl per Maus beziehungsweise Touch, Seitengleichheit, unverändertes Canvas, Abgabebestätigung, eigene versiegelte Wiederansicht und die korrekte gemeinsame Auflösung.
- Die abschließenden vier Fälle prüfen zusätzlich die bewusste Enthaltung per Tastatur auf breiten Ansichten und den gezielten Sprung zum ersten offenen Begriff einschließlich Fokus und Rückkehr zur letzten Seite. Alle vier bestehen auf dem finalen Build; Bericht `outputs/qa/auction-jury-browser.json`, Protokoll `outputs/auction-jury-browser-final.log`. Die breite normale Seitenansicht, die schmale Siebener- und Fünfziger-Buchseite sowie die neunte räumliche Buchseite wurden visuell kontrolliert. Es wurde kein horizontaler Überlauf festgestellt.
- Vier bestehende komplette Browserabläufe für zwei beziehungsweise zwölf Teilnehmer bei beiden Breiten bestehen nach Anpassung an die neue Seitennavigation weiterhin: echte Gebote, Wörter, Auftritt, Wiederbeitritt, Jury, Ergebnis und nächste Runde. Bericht: `outputs/qa/auction-jury-existing-browser.json`.
- `scripts/check-auction-jury-live.mjs` besteht über die echte lokale HTTP-/D1-Strecke mit drei Spielern und realer Uhr. Eine angefangene Bewertung wird privat gespeichert, ein weiterer Juror gibt verbindlich ab, und der Server übernimmt den Entwurf zum tatsächlichen Fristende. Mehrheit, Gleichstand, fehlende Stimmen und −30 Rohpunkte beim gescheiterten Dreiergebot sind geprüft. Bericht: `outputs/qa/auction-jury-live.json`.
- Abschließender Sites-Build und Typprüfung endeten mit Exitcode 0 (`outputs/auction-jury-final-build.log`, `outputs/auction-jury-final-types.log`). Die sechs neuen Tests wurden auf dem finalen Stand erneut ausgeführt und bestehen. Die eigene Vorschau sowie alle eigenen Prüfläufe sind beendet. Es erfolgte keine Veröffentlichung.

Die Browserprüfungen benutzen koordinierte Raumlogik hinter kontrollierten HTTP-Antworten, eine gemeinsame feste Fixture-Uhr, geschlossene WebSockets und SwiftShader. Der zusätzliche Live-Test verwendet echte HTTP-/D1-Anfragen und reale Fristen, jedoch keine Browser-WebSockets. Diese Nachweise sind keine physische Mobilgeräte-, Hör-, vollständige Speicher-/Performance- oder komplette Olympiadenabnahme. Die bestehende lokale Wrangler-/workerd-Verbindungsproblematik ist damit nicht als behoben nachgewiesen.

## Verbleibender Gesamtauftrag

Weitere Publikums-/Ergebnis-/Figureninszenierung, Hörprüfung, Referenzgeräte, lange echte Mehrbrowserpartien, zuverlässige WebSocket-Abnahme und die vollständige Olympiade über alle 21 Disziplinen bleiben offen. Die neue Juryführung ist ein lokaler Ausbau des vollständigen Abenteuerauftrags und nicht veröffentlicht.
