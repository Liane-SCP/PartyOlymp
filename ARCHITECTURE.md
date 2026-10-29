# Party Olymp – Architektur und Betrieb

Stand: 10. Oktober 2026. Die Plattform ist eine deutschsprachige, anonyme Browser-Olympiade für 2–12 aktive Spieler und zusätzliche Zuschauer.

## Architekturentscheidung

React 19 / Vinext erzeugt die Oberfläche; ein Cloudflare Worker verarbeitet sämtliche Raumaktionen. Cloudflare D1 speichert einen vollständig serialisierbaren Raumzustand einschließlich privater Spielinformationen, Phase, Fristen und abgeschlossener Ergebnisse. Der Client erhält ausschließlich `publicRoom()` mit seinem eigenen privaten Teilzustand. Kein Browser simuliert andere Teilnehmer.

Jede Mutation führt `UPDATE ... WHERE revision = ?` aus. Bei Konkurrenz wird der Zustand erneut geladen und die Aktion erneut geprüft. Zufall, Zulässigkeit und Ergebnisse werden nur serverseitig entschieden. Aktionskennungen machen Wiederholungen idempotent. Die Verbuchung besitzt zusätzlich einen eindeutigen Schlüssel aus Olympiadenstart und Disziplinindex. Raumcode und Mitgliederidentität werden getrennt behandelt; Mitgliedertokens sind kryptografisch zufällig und werden niemals in öffentlichen Zuständen ausgegeben.

Anwesenheitsmeldungen liegen in separaten D1-Zeilen mit gemeinsamem Schlüssel aus Raum und Spieler. Eine einzelne SQL-Abfrage liest Spielzustand und aktuelle Anwesenheit konsistent. Heartbeats schreiben keine neue Raumversion und konkurrieren dadurch nicht mit Spielaktionen. Der Server prüft abgelaufene Wiederbeitrittsfristen vor dem Auffrischen der jeweiligen Anwesenheit. Bestehende Räume verwenden ihre bisherigen Zeitstempel als Rückfallwert und bleiben über diese Erweiterung hinweg gültig.

Das vorhandene Sites-Hosting bietet Worker und D1, aber keine deklarierte Durable-Objects-Bindung. Die Bereitstellung verwendet nun authentifizierte WebSockets unter `/api/live`. Jede Verbindung besitzt ihren eigenen Worker-I/O-Kontext; es gibt keine unkoordinierte Socket-Raumliste als Wahrheit. D1-CAS koordiniert die verbindlichen Raumzustände auch zwischen unterschiedlichen Worker-Instanzen. Auf 100 ms gerasterte Simulationszeitpunkte reduzieren konkurrierende Tick-Schreibvorgänge. WebSockets werden automatisch wiederhergestellt; quittierte Aktionskennungen verhindern Doppelverarbeitung. Bei nicht verfügbarer Socket-Verbindung bleibt HTTP als Fallback erhalten. Datenbanklatenz und hohe Spielerzahlen begrenzen die Snapshotfrequenz weiterhin.

Phasen und Fristen werden durch authentifizierte Raumanfragen weitergeführt. Wenn kein Client online ist, fallen keine laufenden Pollingkosten an; der nächste Zugriff verarbeitet abgelaufene Fristen. Ein Neustart löscht keine gespeicherten Räume. Laufende Räume bekommen bei Deployments neue Serverlogik; inkompatible Zustandsschemaänderungen erfordern Migrationen. Keine automatischen inkompatiblen Änderungen vornehmen.

Kleine Frame-Nachrichten auf der bestehenden WebSocket-Verbindung lösen die nächste Momentaufnahme aus. Jede Nachricht verarbeitet eine begrenzte Worker-Aufgabe, statt einen endlosen datenbanklesenden Hintergrundauftrag an den ursprünglichen HTTP-Request zu binden. Der Browser sendet ungefähr alle 450 ms eine Frame-Nachricht; gleichzeitig laufende Snapshotarbeit auf derselben Verbindung wird zusammengefasst.

## Hostingvergleich anhand aktueller Anbieterdokumentation

| Anbieter                | Echtzeit / Zustandsdauer                                                                                                                                                                                                                              | Kostenlos / Neustarts                                                                                                                                                                                                                | Entscheidung                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Vercel                  | Aktuelle WebSocket-Unterstützung in Functions, Verbindungen an Instanz und deren maximale Laufzeit gebunden; dauerhafte Zustände brauchen externen Speicher.                                                                                          | Hobby-Functions mit Fluid Compute bis 300 Sekunden; regelmäßige Wiederverbindung nötig.                                                                                                                                              | Möglich mit Zusatzdiensten, aber hier keine bessere vorhandene Bereitstellung.                         |
| Render                  | Eigener dauerlaufender WebSocket-Prozess möglich; Frankfurt als Region verfügbar.                                                                                                                                                                     | Free-Webservices schlafen nach 15 Minuten Inaktivität, Kaltstart ungefähr eine Minute. Dateisystem beim Neustart/Deployment flüchtig, persistente Disks nur bezahlt; Free-Postgres läuft nach 30 Tagen ab.                           | Für private Spieleabende ohne weitere bezahlte Datenbank weniger geeignet.                             |
| Cloudflare Workers + D1 | Edge-Frontend, serverseitige HTTP-Aktionen, dauerhafte Datenbank. Mit separat eingerichteten Durable Objects wäre WebSocket-Synchronisierung möglich. Datenbankstandort und tatsächliche Latenz sind nicht allein durch den Frontend-Edge garantiert. | Workers Free: begrenzte tägliche Requests und CPU. D1 Free: 5 Mio. gelesene, 100.000 geschriebene Zeilen täglich, 5 GB insgesamt. Bei Überschreitung greifen Grenzen. Sites-Kontingente sind vom verbundenen Hostingdienst abhängig. | Vorhandene autorisierte Sites-Bereitstellung genutzt; D1-CAS ermöglicht konsistente unabhängige Räume. |

Quellen, geprüft am 10.10.2026:

- https://vercel.com/docs/functions/websockets
- https://vercel.com/docs/functions/limitations
- https://render.com/docs/free
- https://render.com/docs/regions
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/pricing/

Bei vorhandener WebSocket-Verbindung entfallen die wiederholten Browser-HTTP-Statusanfragen. Die verbundenen Worker lesen weiterhin D1 ungefähr alle 450 ms. Anwesenheit wird höchstens ungefähr alle vier Sekunden pro Spieler geschrieben. Kosten hängen somit weiter von Verbindungsdauer und Gruppengröße ab; es gibt keine Behauptung unbegrenzter Gratisnutzung.

## Spielmodule

`lib/game/games` enthält Initialisierung, Aktionen, Fristen, öffentliche Sicht und Ergebniserzeugung. `catalog.ts` enthält öffentlich lesbare Regeln und Standardeinstellungen. `room.ts` verbindet die Module mit Bereitschaft, Countdown, Rohwertauflösung, Punktevergabe, Pausen und Revanche. Individuelle Wertung, niemals Teams oder Ausschluss nach schlechten Runden.

Bei jedem Spiel zählt dieselbe feste Teilnehmerzahl. Ungültige Ergebnisse oder endgültig abgebrochene Disziplinen erhalten 0 Olympiadenpunkte. Nach 90 Sekunden ohne Verbindung ist die aktuelle Disziplin für diesen Spieler abgebrochen; ab der nächsten Disziplin darf er wieder aktiv teilnehmen. Ein kurzfristiger Refresh stellt dieselbe Identität über den gespeicherten Sitzungstoken wieder her.

## Inhalte und Rechte

- 48 originale SVG-Bildrätsel: eigene Illustrationen, keine fremden Bilder.
- 319 echte Amazon.de-Produkte aus elf Kategorien mit ASIN, Originalfoto-URL, Quellseite und Preissnapshot vom 10.10.2026. Die Bilder bleiben externe Original-URLs; ihre Rechte liegen bei den jeweiligen Rechteinhabern, keine Behauptung einer freien Lizenz. Preise sind datierte Referenzwerte und keine aktuellen Angebote. `scripts/prepare-amazon.mjs` importiert öffentlich angezeigte Bestsellerseiten und stoppt bei Zugriffsbeschränkungen. Eine automatisch laufende offizielle API-Anbindung würde den derzeit nicht vorhandenen freigeschalteten Associates-/Creators-Zugang benötigen.
- 40 Größenaufgaben: präzise benanntes Maß und Referenzquelle in der Auflösung. Tiergrößen sind typische Werte, keine Behauptung universeller exakter Maße.
- Vollständige echte Wikipedia-Artikel aus der deutschsprachigen MediaWiki-Schnittstelle, alle erlaubten Links im Artikelnamensraum statt einer Begrenzung auf die lokale Bank. HTML wird serverseitig auf erlaubte Elemente und Attribute reduziert; Artikelnavigation wird anhand der tatsächlich vom Server geladenen Linkliste geprüft. Artikel und Revisionen werden in D1 gepuffert; bei Ausfällen stehen bereits geladene Artikel und die ursprüngliche Offline-Reserve bereit. 243 vorab geprüfte Rennstrecken dienen weiterhin als erreichbare Start-Ziel-Aufgaben. Quelle, Revision, Wikipedia-Mitwirkende und CC BY-SA 4.0 erscheinen in der Ansicht. Die Offline-Reserve umfasst 84 Artikel; `scripts/prepare-wiki.mjs` erneuert sie.
- Charaktere, Emotes, Spielillustrationen, Spielsymbole, Animationen und Web-Audio-Klänge sind für dieses Projekt selbst erstellt. Allgemeine UI-Symbole stammen aus Lucide mit ISC-/MIT-Lizenzen; die vollständigen Hinweise liegen in `public/third-party-notices.txt` und werden mit ausgeliefert. Keine Clash-Royale-Assets.

Die Referenzen für Yahtzee, Uno, WikiRace, Curve Fever und Magnitudle wurden aufgerufen. Quackthink, Tableroom und Dialed waren beim Abruf nicht zugänglich. Die im Katalog beschriebenen eigenen Varianten ersetzen nicht verifizierbare Originalregeln.

## Sicherheit und Grenzen

Raumcodes sind Einladungen, keine öffentlich aufgelisteten Räume. Zustandssichten sind personalisiert und `no-store`. Gastgeberrechte, Mitgliedertoken, Fristen, Aktionsphase, Eingabegrößen und Aktionswerte werden geprüft. Kein Geldwert, keine Accounts, keine Shops. Namen sind React-Text und werden nicht als HTML ausgegeben. Wikipedia-HTML durchläuft serverseitig HTMLRewriter: Skripte, Formulare, eingebettete Frames und Ereignisattribute werden entfernt. Navigierbare Links bekommen ausschließlich servergeprüfte Artikeltitel. WebSocket-Authentifizierung überträgt Sitzungstokens im ersten Datenpaket statt in URL-Logs.

Es gibt keine Geräteüberwachung: Freunde können außerhalb des Spiels nachschlagen. Die Plattform prüft die Aktionen innerhalb ihrer Spielansicht. Der Server schützt verdeckte Karten, fremde Flotten und zukünftige Lösungen. Das aktuell gezeigte Bild beziehungsweise die kurz gezeigte Farbe muss der Browser zur Darstellung erhalten; vollständige Absicherung gegen manipulierte eigene Browser wäre für Wahrnehmungsspiele nicht möglich.

Die Live-Crew erhält je Modus eine gezielte Projektion: offene Club-21-Hände (aber keine verdeckte Dealerkarte), Kartenanzahlen und letzte Farbwechsel-Aktion (keine fremden Hände), Wiki-Artikel/Klicks/Ankunft, Pixelblitz-Versuchszähler (keine Antworten) sowie bestehende Abgabe-, Würfel- und Beutezustände. Rundenereignisse sind mit der Rundennummer versehen. `revealStartedAt` synchronisiert die Budget-Auflösung mit der Serverzeit und ermöglicht Wiedereinstieg ohne einen erneuten Preis-Countdown. `play-context.tsx` stellt Anleitung und Crew dar, `round-results.tsx` die modusspezifische Auflösung; `game-feel.css` bündelt responsive Rückmeldung und berücksichtigt reduzierte Bewegung.


## Weitere Bedienüberarbeitung

WikiReader verwendet einen nativen Capture-Listener für Links im sanitisierten Wikipedia-HTML, verhindert die Fragmentnavigation, lässt einen Navigationsauftrag gleichzeitig zu und zeigt den Ladezustand. Der Artikelkörper wird memoisiert; Zeit- und Raumupdates setzen dessen DOM nicht zurück. Die Navigation wird unverändert durch die echte serverseitige Linkliste geprüft.

Die Figur erhält ein optionales, serverseitig begrenztes `look` mit Form 0–5, Accessoire 0–7 und Farbindex 0–11; ältere numerische Avatare bleiben gültig. Dafür ist keine Datenbankmigration erforderlich. Vor der Punktevergabe speichert der Raum eine tokenfreie `previousStandings`-Liste. RankingShow interpoliert von diesen alten Gesamtpunkten zu den neuen, sortiert die sichtbaren Zeilen beim tatsächlichen Überholen und nutzt abschließend die verbindliche Rangfolge. Raumstart setzt den vorherigen Zwischenstand zurück. Bei reduzierter Bewegung erscheint die neue Wertung direkt.


## Entfernte Disziplin

Regelversion 3 entfernt die ehemalige Kurvendisziplin aus gespeicherten Raumauswahlen, passt den aktuellen Index an und überspringt einen noch aktiven Kurvenzustand vor dem Modulzugriff. Bereits verbuchte Kurvenresultate werden entfernt und die Gesamtpunkte, Siege und zweiten Plätze aus den verbleibenden Resultaten neu berechnet. Ein nur aus der entfernten Disziplin bestehender Raum erhält eine Runde Pixelblitz. GameId, Spielkatalog, Voreinstellungen, Arena, Steuerungsprotokoll und Kurvenmodule enthalten diese Disziplin nicht mehr. Die einmalige Altzustandsmigration benötigt keine Datenbankänderung.
