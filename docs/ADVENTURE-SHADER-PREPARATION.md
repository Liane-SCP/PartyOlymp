# Shader-Vorbereitung mit der gewählten Grafikstufe

Die normalen Spielorte besaßen bereits `compileAsync` vor ihrer Freigabe. Die gewählte Grafikstufe wurde allerdings erst im ersten sichtbaren Zeichenlauf angewendet: Pixelverhältnis, Schatten und Schattenkartengröße konnten dadurch nach der Vorbereitung wechseln; die Materialien wurden erneut als geändert markiert. Die neue Reihenfolge wendet dieselbe Grafikstufenfunktion bereits vor der Vorbereitung an. Der erste sichtbare Frame wendet eine unveränderte Stufe nicht erneut an.

`configureAdventureRenderer` setzt das tatsächlich gewählte Profil einschließlich Schattenkartengröße und Pixelverhältnis. `prepareAdventureRenderer` kompiliert anschließend die Szene und zeichnet einmal in ihren noch verborgenen tatsächlichen Canvas. Dadurch werden die vorhandenen Ausgabe-/Tonemapping-Varianten, Geometrie- und Texturuploads sowie gegebenenfalls die Schattenpfade vor der Freigabe benutzt. Ein eigener Render-Target-Pfad würde eine andere Ausgabevariante vorbereiten; es wird deshalb weder ein zusätzlicher Renderer noch ein zusätzlicher Zielpuffer angelegt.

## Freigabe und Lebenszyklus

- Der tatsächliche Canvas bleibt während der Vorbereitung verborgen und `inert`. Vertrauenswürdige Pointer-/Tastatureingaben erreichen ihn in diesem Zustand nicht.
- Die sichtbare Ladeanzeige bleibt bis zum Abschluss der Vorbereitung bestehen. Die tatsächliche Spielkamera wird vor dem ersten sichtbaren Zeichenlauf gesetzt; danach wird der Canvas sichtbar.
- Die Vorbereitung ruft keine Audioaktion und keinen Spielbefehl auf. Ergebnis-/Zeit-/Privatheitsregeln bleiben unverändert.
- Während einer abgebrochenen Shaderkompilierung wird keine anschließende Vorbereitungszeichnung in den bereits freigegebenen Renderer gestartet.
- Der Ressourcenabbau ist unmittelbar nach dem Anlegen des Renderers vorbereitet und wird später um Observer und Eingabehandler ergänzt. Fehler im Weltaufbau beziehungsweise in der Vorbereitung führen jetzt ebenfalls durch diesen Abbau. Die eigentliche Freigabe ist gegen doppelte Aufrufe gesichert.
- Spätere ausdrücklich gewählte oder automatische Grafikwechsel können weiterhin neue Varianten benötigen. Dynamische Produktbilder, Ergebnisse, spätere Kameras und Materialwechsel sind keine vollständig vorab geprüfte Menge.

## Prüfungen

Vier neue Node-Prüfungen bestehen für die Einstellungen Hoch/Mittel/Sparsam, Freigabe einer alten Schattenkarte, Vorbereitung derselben Szene im tatsächlichen Ausgabepfad, Fehlerweitergabe ohne zusätzlichen Zielpuffer und ausbleibende Zeichnung nach Abbruch. TypeScript und Produktionsbuild bestehen. Die bestehende Chunkgrößenwarnung bleibt sichtbar.

`outputs/qa/renderer-preparation.json` enthält acht bestandene D3D11-Browserfälle auf der vorhandenen Desktop-GPU. Alle tatsächlichen Spielorte sind geladen, die gewählte Grafikstufe entspricht der ersten sichtbaren Stufe, der Canvas ist anschließend freigegeben und die Zahl der Shaderprogramme wächst beim ersten sichtbaren Frame nicht:

| Spielort | Grafik / Breite | Vorbereitete Programme | Erster sichtbarer Frame |
|---|---|---:|---:|
| Würfelsalon, zwölf Spieler | Hoch / 1440 | 13 | 13 |
| Würfelsalon, zwei Spieler | Sparsam / 390 | 9 | 9 |
| Kaufhaus, zwölf Spieler | Hoch / 1440 | 18 | 18 |
| Kaufhaus, zwei Spieler | Sparsam / 390 | 14 | 14 |
| Rennstrecke, zwölf Spieler | Hoch / 1440 | 15 | 15 |
| Rennstrecke, zwei Spieler | Sparsam / 390 | 13 | 13 |
| Museum, zwölf Spieler | Hoch / 390 | 10 | 10 |
| Farbenlabor, zwölf Spieler | Hoch / 1440 | 11 | 11 |

Keine erfassten Browserfehler. Die tatsächlichen schmalen Renderbilder von Würfelsalon und orthografischem Museum wurden visuell kontrolliert. Der Nachweis beschreibt die Zahl vorhandener Programme in diesen Frames; er ist keine vollständige GPU-Trace-Abnahme und keine Aussage, dass sämtliche späteren Spielhandlungen ohne weitere Kompilierung auskommen.

Der spätere Ausbau der Würfelstube ergänzt ein Emissionsmaterial für den Kamin. Die dabei erneut geprüften aktuellen Salonwerte betragen 14/14 Programme in Hoch und 10/10 in Sparsam; Nachweise in [DICE-SALON-ROOM.md](DICE-SALON-ROOM.md). Die obenstehende Tabelle bleibt der ursprüngliche Acht-Szenen-Nachweis dieses Shaderausbaus.

Die vier bestehenden Würfel-/Rennabläufe bei 1440/390 Pixeln bestehen zusätzlich mit zwölf Teilnehmern, primärer räumlicher Handlung und Neuladen. Log `outputs/qa/renderer-preparation-reference-flows.log`. Beide Kaufhaus-Regressionsfälle bei 1440/390 Pixeln mit zwölf Teilnehmern bestehen ebenfalls: privater Warenkorb hinzufügen/entfernen, verbindliche Kassenauflösung und Reset der nächsten Runde. Log `outputs/qa/renderer-preparation-shopping.log`.

## Grenzen und weitere Arbeit

Die Prüfungen nutzen Engine-Fixtures und koordinierte HTTP-Snapshots mit geschlossenem Live-WebSocket. Die schmalen Fenster laufen auf derselben Desktop-GPU. Native Mobilgeräte, Eingabelatenz-/Kaltstartvergleiche, GPU-Traces, lange Szenenfolgen, Prozessspeicher, Hörabnahme und Live-Mehrbrowser-Olympiaden bleiben offen. Die Bossvorbereitung verwendet ihren bisherigen eigenen Nachbearbeitungsweg. Die vollständige individuelle Gestaltung und Abnahme aller 21 Disziplinen bleibt unverändert Ziel; keine neue Veröffentlichung.
