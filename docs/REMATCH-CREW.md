# Gemeinsame Revanche und verständliche Rollen

Die Crew stellt nach dem Finale ihre nächste Runde gemeinsam zusammen. Die Endwertung bleibt sichtbar, während Teilnehmer und Zuschauer ausdrücklich „Mitspielen“ oder „Zuschauen“ wählen. Die Revanche-Tafel verwendet die vorhandenen ursprünglichen Avatare, nennt die Titelverteidiger und zeigt reservierte Plätze sowie offene Rückmeldungen. Sie eröffnet keine zusätzliche 3D-Szene. Nur der Gastgeber kann anschließend die Lobby vorbereiten.

## Ablauf und verbindliche Regeln

- Bisherige aktive Teilnehmer behalten innerhalb der bestehenden 90-Sekunden-Wiederbeitrittsfrist einen reservierten Platz, auch solange ihre Antwort offen ist. Ein Zuschauer kann diesen Platz nicht verdrängen.
- „Zuschauen“ gibt den eigenen Platz frei. Neue Mitspieler werden nur bei freien Plätzen aufgenommen. Der Server begrenzt die Runde auf zwölf Spielplätze.
- Abgelaufene Reservierungen können neu vergeben werden. Ein zurückkehrender ehemaliger Teilnehmer erhält einen inzwischen vergebenen Platz nicht automatisch zurück.
- Eine Rückmeldung verändert weder die abgeschlossene Wertung noch die Rollen des abgeschlossenen Spiels. Beim Öffnen der Lobby werden die neuen Rollen übernommen. Auswahl, bisherige Punkte, Historie und persönliche Bestleistungen bleiben dabei erhalten.
- In der Lobby können auch spät beigetretene Zuschauer einen freien Platz übernehmen. Ein tatsächlicher Rollenwechsel setzt die eigene Bereitschaft zurück; ein wiederholtes identisches Rollenkommando tut dies nicht.
- Eine Revanche startet erst nach erneuter Bereitschaft aller aktiven Spieler und dem ausdrücklichen Start durch den Gastgeber. Erst dieser Start setzt Rundenergebnisse und Historie zurück. Persönliche Bestleistungen bleiben erhalten.
- Rollenkommandos gelten nur für den authentifizierten Absender und den aktuellen Phasenschlüssel. Alte Eingaben aus dem Finale werden in der Lobby abgewiesen. Bestehende gespeicherte Räume benötigen keine Migration; ihre Revanche-Ansicht wird bei Bedarf aus dem aktuellen Endzustand abgeleitet.

Die Bereitschaftszählung der Lobby berücksichtigt dieselbe 90-Sekunden-Frist wie der Server. Sie zeigt dadurch auch kurz getrennte, noch reservierte Teilnehmer, anstatt einen möglichen Start fälschlich nur anhand der zwölfsekündigen Online-Anzeige zu beurteilen.

## Umsetzung

`lib/game/rematch.ts` verwaltet Reservierungen und explizite Rückmeldungen. `roomAction` prüft Phase und Rechte; `publicRoom` projiziert eine öffentliche Revanche-Ansicht ohne Sitzungstoken. `components/olymp/rematch-board.tsx` stellt die Finaltafel und die Lobby-Rollenwahl bereit. `app/rematch.css` enthält die responsive Gestaltung. Bestätigungsgeräusche entstehen nur nach erfolgreich bestätigten eigenen Rollenkommandos.

Die Oberfläche enthält große Touchziele, semantische Tastaturbuttons, `aria-pressed`, eine Statuszeile und eine begrenzt hohe, scrollbar erreichbare Crew-Liste. Abwesende Personen bleiben erkennbar. Die vorhandene globale Fehleranzeige meldet abgewiesene Aktionen; nach einer Antwort oder einem Fehler werden die Bedienelemente wieder freigegeben.

## Nachweise und Grenzen

- `node scripts/test-rematch.mjs`: neun Tests. Sie prüfen Legacy-Ansicht und Tokenfreiheit, Reservierungen bei zwölf Teilnehmern, Freigabe und erneute Aufnahme, kurze und abgelaufene Trennungen, Berechtigungen, ungültige und veraltete Eingaben, idempotente Rollenkommandos, Erhalt der Ergebnisse, Löschen des alten Spielzustands einschließlich privater Eingabeentwürfe, Bereitschaft und tatsächlichen Neustart. Zusätzlich durchlaufen alle Gruppengrößen von zwei bis zwölf den Rollenwechsel und Start. Fremde Zielpersonen im Aktionspayload ändern ausschließlich die eigene Rolle.
- `node scripts/test-engine.mjs`: 22 bestehende Tests bestanden. `node scripts/test-journey.mjs`: 45 bestehende Tests bestanden. Die Typprüfung besteht.
- `node scripts/check-rematch.mjs`: vier Browserfälle, zwei und zwölf Teilnehmer bei 1440 und 390 Pixeln, jeweils drei getrennte Browserkontexte für Gastgeber, Mitspieler und Zuschauer. Native Maus-/Tastatur- beziehungsweise Touchaktionen prüfen gemeinsame Rückmeldungen, Kapazitätsgrenzen, Neuladen, Gastgeberrechte, erneute Bereitschaft, Zweier-Neustart und Rollenwechsel in der vollen Lobby. Während der Rückmeldungen bleibt dasselbe Siegerehrungs-Canvas erhalten. Kein horizontaler Überlauf wurde festgestellt. Breite und schmale Renderbilder der Revanche-Tafel und Lobby-Rollenwahl wurden angesehen.
- Der Browserbericht `outputs/qa/rematch-browser.json` verwendet die echte Raumlogik über kontrollierte HTTP-Antworten und geschlossene WebSockets. Das belegt keine reale Netzwerk- oder WebSocket-Partie.
- `scripts/check-rematch-live.mjs`: bestanden über die echte lokale HTTP-/D1-Strecke mit realer Uhr: vollständige Zeitgefühl-Partie, Finale, Zuschauerwechsel, wiederholte Aktionskennung, Rechte-/Phasen-/Bereitschaftsprüfung und erneuter Start. Ergebnis in `outputs/qa/rematch-live.json`, Ablauf in `outputs/rematch-live.log`.
- Der abschließende Sites-Build endete mit Exitcode 0 (`outputs/rematch-build-final.log`); die Typprüfung endete mit Exitcode 0 (`outputs/rematch-types.log`). Die eigene Vorschau wurde vor diesem Abschluss-Build beendet. Der erste PowerShell-Buildaufruf meldete trotz „Build complete“ und ausgegebener Chunk-Warnung Exitcode 1; der abschließende Aufruf erfasste den tatsächlichen nativen Build-Exitcode ausdrücklich.

Die erste HTTP-Prüfung verglich irrtümlich komplette öffentliche Spielerzeilen einschließlich `lastSeen`; ein normaler Heartbeat veränderte diesen Wert. Der korrigierte Vergleich prüft IDs, Platzierungen und sämtliche Wertungsfelder sowie die vollständige Spielhistorie. Dies war ein Fehler im Testvergleich, kein verlorenes Spielergebnis.

Physische Mobilgeräte, Hörprüfung, reales Mehrbrowser-WebSocket-Verhalten, lange Sitzungen, Prozessspeicher und die vollständige Olympiade über alle Disziplinen sind hiermit weiterhin nicht abgenommen. Der bekannte lokale Wrangler-/workerd-Verbindungsfehler ist durch diese Arbeit nicht als behoben nachgewiesen. Diese Änderung ist ein Fortschritt im vollständigen Abenteuerauftrag, kein Abschluss oder veröffentlichter Gesamtstand.
