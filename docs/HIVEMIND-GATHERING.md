# Hivemind: gemeinsame Gedankenenthüllung

Der spätere Ausbau zum Gartenfest mit tatsächlich importiertem Pavillon und räumlichen, gemeinsam instanzierten Gedankenblasen sowie dessen erneute Nachweise stehen in [HIVEMIND-FESTIVAL-GARDEN.md](HIVEMIND-FESTIVAL-GARDEN.md). Dieser Bericht beschreibt die ursprüngliche gemeinsame Mechanik und die jeweils genannte Ausstattung.

Der Picknickpark besitzt jetzt eine eigene Tageslichtstimmung ohne die allgemeinen schwebenden Bühnensterne. Vor der Aufdeckung zeigen die persönlichen Gedanken nur ausstehende beziehungsweise versiegelte Antworten. Die tatsächlichen Antworttexte bleiben im bisherigen privaten Serverzustand.

## Gemeinsamer Moment

Die Figuren sammeln sich innerhalb von 1,7 Sekunden bei den tatsächlich ausgewerteten Antwortgruppen. Position und Fortschritt werden aus `revealStartedAt` und der gemeinsamen Serverzeit berechnet. Unterschiedliche Bildraten und ein späterer Einstieg verschieben den Moment dadurch nicht auf einen neuen lokalen Animationsanfang. Reduzierte Bewegung zeigt sofort die Endposition. Fehlende Antworten erhalten einen gesonderten Bereich; sie erscheinen nicht als erfundene Antwortgruppe.

Jede Gruppe hat eine farbige Bodenfläche und eine niedrige Gruppenplakette. In der Nahansicht erscheint eine dreizeilige, wiederverwendete Antworttafel mit Gruppennummer, tatsächlicher Teilnehmerzahl und Punktestatus. Die großen Tafeln bleiben in der Übersicht verborgen, damit auch die hinteren Figuren sichtbar sind. Nur bestätigte positive Punktwerte zeichnen eine Gewinnergruppe aus. Einzelantworten, gleich große Spitzengruppen und vollständig fehlende Antworten erhalten keine falsche Siegermarkierung. Die HTML-Ergebnisliste führt weiterhin alle Namen und Antworten vollständig auf.

Eine feste Übersicht zeigt die gemeinsame Verteilung. Mit „Nächste Gedankengruppe“ und „Vorherige Gedankengruppe“ wird jede Gruppe einzeln erreichbar. „Alle Gedanken“ führt zurück. Die Nahkamera wird aus den wirklichen Figuren- und Tafelgrenzen berechnet. Die schmale Bühne erhält mehr Höhe, damit Tafel und Navigation erreichbar bleiben. Bei der nächsten Runde verschwinden alte Texte, Gruppen, Markierungen und Nahansicht.

## Modelle und Klang

Die vorhandenen lokal gespeicherten Kenney-Modelle für Tische, Apfel, Pizzakarton, Bäume, Büsche und Gartenbauwerk werden weiterverwendet. Kein neuer externer Download und keine neue Lizenzannahme. SHA-256 der sechs tatsächlichen GLBs und ihre CC0-Einträge wurden mit den lokalen Dateien abgeglichen. Die Dekoration bleibt statisch zusammengefasst; dynamische Gruppentafeln behalten dieselben Texturen und Geometrien bei Antwort- und Ansichtswechseln.

Der Ort hat ein leises eigenes Blätterwindbett. Die eigene Bestätigung erklingt am persönlichen Gedankenplatz. Die gemeinsame Enthüllung besitzt unterschiedliche kurze Klangfolgen für eine punktende Mehrheit und ein Ergebnis ohne Mehrheit. Das öffentliche `herdGather`-Ereignis trägt die tatsächliche Serverzeit. Historische Ereignisse werden beim ersten Snapshot sowie bei verspäteter Zustellung nicht erneut abgespielt.

## Gezielte Nachweise und Grenzen

`test-herd-presentation.mjs` besteht mit sechs Node-Prüfungen: tatsächliche private Antworten und Resultate, gemeinsame Zeitleiste einschließlich spätem Einstieg/reduzierter Bewegung, wirkliche Figurenpositionen und Rundenreset, Kamera für 2–12 Spieler bei vier Seitenverhältnissen, vollständige lange/Unicode-Antworten sowie echte Strahlprüfungen gegen verdeckte Figurenköpfe. TypeScript und Produktionsbuild bestehen. Die Warnung zu großen Clientchunks bleibt offen.

`herd-gathering-low.json` enthält sechs bestandene Chromium-Fälle (2/8/12 Spieler × Desktop 1440/Touch 390 Pixel). Jeder Fall prüft eine echte private Abgabe, eine 60 Zeichen lange Antwort, eine Gewinnergruppe, alle einzeln erreichbaren Antwortgruppen, gleich große Spitzengruppen, vollständig fehlende Antworten, Wiederbeitritt und den Reset zwischen vier tatsächlich ausgewerteten Runden. Die Übersicht und erste/letzte Nahansicht werden gerendert. Die 12er-Übersicht und schmale letzte Nahansicht wurden visuell kontrolliert. Diese Tests verwenden echte Spiellogik mit kontrollierter HTTP-Fixture; sie sind keine Live-Mehrbrowser-Partie.

`herd-gathering-high.json` enthält zusätzlich zwei bestandene Zwölf-Spieler-Fälle mit hoher Grafikqualität und aktivierter reduzierter Bewegung, jeweils Desktop und Touch. Damit wird auch die unmittelbare Gruppenpositionierung ohne Bewegungsanimation im Browser geprüft. Nach diesen Ablauftests wurden ausschließlich die Picknicktische und Decken weiter an den Rand versetzt, damit sie die vorderen Gruppenplaketten freigeben; die nachfolgenden Hardwarebilder prüfen diese endgültige Dekorationsanordnung.

Die abschließende Sichtprüfung entfernte außerdem den entfernungsabhängigen Parknebel: Bei der weit herausgezoomten schmalen Gruppenübersicht hatte er die Figuren ausgewaschen. `herd-final-layout.json` enthält danach erneut zwei bestandene vollständige Zwölf-Spieler-Abläufe auf Desktop und Touch mit der endgültigen Dekoration und klarer Sicht. Die schmale Übersicht wurde erneut kontrolliert. Die anschließenden Hardwareproben unten stammen ebenfalls aus dieser Fassung.

`spatial-scenes-herd.json` enthält zwei bestandene native Web-Audio-Fälle: erstes Entsperren durch Eingabe, eigene Bestätigung am Gedankenplatz, gemeinsamer Klang aus der Parkmitte, Kamera-/Hörerzuordnung, ein AudioContext, verspätete alte Ereignisse im selben Spiel, Szenenwechsel mit altem Ereignis sowie Freigabe aller Quellen/Umgebungsschleifen beim Ausblenden.

`scene-lifecycle-herd-18.json` enthält 18 bestandene Wechsel zwischen Hivemind, Atelier und Kaufhaus. Jeder Hivemind-Besuch öffnet alle zwölf wirklichen Einzelgruppen und kehrt zur Übersicht zurück. Nach dem Durchblättern bleiben 71 Zeichenaufrufe, 6.602 Dreiecke, 43 Texturen und 52 Geometrien über sechs Besuche identisch. Eine aktive Canvasfläche; keine gemeldeten WebGL-Fehler. Die Atelier-Schreibphase wird erst nach Rückkehr zur Gruppenansicht und abgeschlossener Kamerabewegung erfasst und bleibt bei 89/10.910/41/57. Das beweist keine vollständige Prozessspeichergrenze.

Die Bühnenfreigabe wartet jetzt zusätzlich auf die benötigten Ortsmodelle, bevor die Shader vorbereitet werden. Die HTML-Bedienung bleibt während der Vorbereitung verfügbar. Die acht bestehenden Regelprüfungen aus `test-new-games.mjs` bestehen einschließlich Hivemind-Geheimhaltung, Gleichstand, eindeutiger Mehrheit und doppelter Abgabe.

## Kurze Hardwareprobe nach der Dekorationskorrektur

`hardware-herd-gathering.json`: RTX 4080 SUPER, ANGLE/D3D11, headless Chromium, hohe Grafik und zwölf geladene Figuren. In jedem viersekündigen warmen Messfenster werden tatsächlich zwölf verschiedene Antworten abgegeben; die serverbestätigte Enthüllung, Gruppenbewegung und zwölf Einzelgruppen liegen innerhalb der Messung. Keine andere Browserprüfung läuft gleichzeitig.

| Fenster | Tatsächlicher Renderpuffer | rAF-Abstände | p95 / p99 ms | >33,5 ms | Zeichenaufrufe | Dreiecke |
|---|---|---:|---|---:|---:|---:|
| 1920 × 1080 | 1918 × 860 | 238 | 16,7 / 33,3 | 0 | 82 | 10.064 |
| 390 × 844 | 388 × 624 | 241 | 16,7 / 16,8 | 0 | 82 | 10.064 |

CPU-Renderaufruf-p95: 0,9 beziehungsweise 0,8 ms. Die endgültigen Hardwarebilder wurden kontrolliert: alle zwölf Figuren und vorderen Gruppenplaketten bleiben frei; Tische und Decken stehen daneben. Das erzwungene große Benchmarklayout überlagert globale Kopf-/Emoteleisten und dient deshalb ausschließlich der Szenen-/Messkontrolle. Das normale Seitenlayout wird durch die separaten Chromium-Fälle geprüft. Die schmale Messung läuft auf derselben Desktop-GPU und ist kein Smartphone-FPS-Nachweis. Keine GPU-Zeitspur, Kaltstart-, Eingabelatenz-, Langzeit- oder vollständige Performanceabnahme.

Die anschließend integrierte persönliche Eingabe und ihre Wiederbeitrittsprüfung stehen in [HIVEMIND-THOUGHT-PLACE.md](HIVEMIND-THOUGHT-PLACE.md). Diese Arbeit ist keine vollständige Hivemind- oder Gesamtabnahme. Weitere Park-/Figurenaktionen, reale Smartphone-Tastaturen, längere Gruppenpartien, Hörabnahme, Mittelklasse-Referenzgeräte, kalte Ladephasen und die komplette Mehrbrowser-Olympiade bleiben offen. Der Stand ist lokal.
