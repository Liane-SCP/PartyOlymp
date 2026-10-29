# Persönliches Schreibblatt im Ideenatelier

Das eigene Blatt ist jetzt direkt in die Atelierbühne eingebunden. Eine persönliche Kamera zeigt den eigenen Sitzplatz, das Papier und die angrenzende Miniaturstadt. „Atelier ansehen“ führt zur Gruppe zurück; die sieben anklickbaren Stadtbezirke wählen die zugehörige Kategorie. Die HTML-Eingaben bleiben echte, scharf lesbare Textfelder mit zuverlässigem Fokus. Desktop zeigt alle sieben Felder neben der Welt; schmale oder niedrige Ansichten zeigen das aktive Feld unter der Welt.

Enter wechselt zur nächsten Kategorie. Im letzten Feld fokussiert Enter die bewusste Abgabe, ohne bereits abzugeben. IME-Komposition wird dabei berücksichtigt. Pfeile und Kategorienreiter bieten dieselbe Auswahl. Der aktive Reiter bleibt auch sichtbar, wenn ein Häkchen seine Breite nachträglich verändert. Ein kurzer Papierklang kommt nur vom eigenen Platz. Fremde Entwürfe und geheime Stimmen werden nicht durch diese Oberfläche öffentlich.

Entwürfe behalten die vorhandene automatische Speicherung und Sequenzprüfung. Zusätzlich registriert das Blatt den aktuellen Stand für den serverseitigen Zeitablauf. Ein älterer Stand kann einen neueren gespeicherten Entwurf nicht überschreiben. Nach Abgabe sind alle Felder gesperrt und die Kamera kehrt zur Gruppe zurück. Bewertung und Ergebnis verwenden weiterhin die gemeinsame Präsentationswand. Eine neue Runde beginnt mit leerem Blatt. Kamera-, Auswahl- und Größenwechsel erzeugen keinen neuen WebGL-Renderer.

## Geprüfte Zustände

- `notebook-low.json`: sechs native Chromium-Fälle, 2/8/12 Spieler jeweils mit Maus bei 1440 Pixeln und Touch bei 390 Pixeln; zusätzlich tatsächlicher serverseitiger Zeitablauf bei bewusst ausgelassenen periodischen Autosaves sowie Bedienung mit fehlendem WebGL.
- `notebook-high.json`: zwölf Spieler, Desktop und Touch, hohe Grafikqualität.
- `notebook-reduced.json`: zwölf Spieler, Touch und reduzierte Bewegung.
- Jeder reguläre Fall prüft alle sieben Felder, Enter, simulierte IME, 600/400 Pixel hohe Ansichten, Textauswahl, gespeicherten Wiederbeitritt, direkte 3D-Kategorieauswahl, explizite Abgabe, Datenschutz, gesperrtes Blatt, Bewertungsübergang und Rundenreset.
- `test-atelier-presentation.mjs`: neun bestandene Node-Prüfungen einschließlich tatsächlicher Sitz-/Papier-/Kopfgrenzen aller 2–12 Sitzordnungen bei vier Seitenverhältnissen, Fortschrittszählung und serverseitigem Zeitablauf mit veralteten Sequenzen.
- TypeScript und Produktionsbuild bestehen; die Warnung zu großen Clientchunks bleibt offen.

Der anschließende `atelier-low.json`-Lauf besteht erneut in allen sechs 2/8/12-Desktop-/Touchfällen einschließlich Entwurf, tatsächlicher Stimmen, privater Stimmzettel, aller Antwortseiten, Ergebnis und Reset. `atelier-picking.json` prüft zusätzlich alle sieben tatsächlich gerenderten Bezirke mit nativen Maus-/Touchereignissen. Dabei wartet der Test jetzt ausdrücklich auf die persönliche Kamera und die Rückkehr zur Gruppe; ein noch alter Kameradiagnosestand darf keine neue Projektion begründen.

`scene-lifecycle-notebook-18.json` besteht mit 18 Szenenbesuchen und 24 Breitenwechseln. Jeder Atelierbesuch rendert Schreiben mit zwölf Figuren und anschließend das echte Rundenergebnis. Schreiben bleibt bei 89 Zeichenaufrufen, 10.910 Dreiecken, 41 Texturen und 57 Geometrien; das breite Ergebnis nach dem Aufwärmzyklus bei 35/4.737/36/58. Eine aktive Canvasfläche, keine gemeldeten WebGL-Fehler. Stabile Rendererzähler beweisen keine vollständige Prozessspeichergrenze.

Der native Audio-Bericht `spatial-scenes-categories-chain.json` enthält vier bestandene Fälle einschließlich Papierklang am eigenen Platz, tatsächlicher Abgabe-/Bewertungsquellen, alter Ereignisse, Szenenbesuch und Ressourcenfreigabe.

## Kurze tatsächliche Hardwareproben

RTX 4080 SUPER, ANGLE/D3D11, headless Chromium, hohe Grafik, zwölf geladene Figuren, 1920 × 1080 Fenster. Jede Szene wird allein gemessen. Berichte: `hardware-notebook-personal.json`, `hardware-notebook-group.json`, `hardware-notebook-review.json`.

| Ansicht | Renderpuffer | rAF-Abstände | p95 / p99 ms | >33,5 ms | Zeichenaufrufe | Dreiecke |
|---|---|---:|---|---:|---:|---:|
| Persönlicher Schreibplatz | 1460 × 932 | 241 | 16,7 / 16,8 | 0 | 104 | 20.755 |
| Gruppe mit Schreibblatt | 1460 × 932 | 241 | 16,8 / 16,8 | 0 | 124 | 21.162 |
| Wand, echte Abstimmungsauflösung während Messung | 1918 × 876 | 239 | 16,8 / 16,8 | 1 | 58 | 9.498 |

CPU-Renderaufruf-p95: 0,7/0,7/0,6 ms. Keine GPU-Zeitspur, kein Kaltstart- oder Smartphone-Benchmark. Das Benchmarklayout erzwingt eine große Bühne; die tatsächlichen Puffer sind deshalb ausdrücklich angegeben. Diese Werte ersetzen weder normale Seitenlayoutprüfungen noch die vollständige Performanceabnahme.

Die tatsächlichen Desktop-Schreibbilder sowie die schmale 400-Pixel-Ansicht wurden visuell kontrolliert. Die kurze Ansicht hält Texteingabe und Abgabe erreichbar; die verbleibende Weltansicht wird entsprechend klein. Die zwölf vorhandenen lokal gespeicherten Kenney-Modelle werden weiterverwendet. Dieses Blatt fügt keine Modell- oder Texturressourcen zum WebGL-Renderer hinzu.

## Grenzen

Chromium-Touch und Größenänderungen ersetzen keine physische Smartphone-Tastatur. IME wird simuliert. Vollständige Architektur-/Sitzplatzgestaltung, reale Gruppenpartien, Mittelklasse-Geräte, Kopfhörer-/Lautsprecherabnahme, kalte Ladephasen, echte Netzwerkunterbrechungen und die komplette Olympiade bleiben offen. Diese gezielte Erweiterung ist keine vollständige Abnahme der Disziplin oder aller 21 Spiele. Der Stand ist lokal.
