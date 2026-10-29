# Spectrum: Bühnenbreite und Canvas beim Aufdecken

Stand: 18.10.2026. Lokaler Zwischenstand innerhalb der weiterhin offenen Ausarbeitung aller 21 Disziplinen; keine Veröffentlichung oder vollständige Abnahme.

## Änderung

Die Spectrum-Sitzung behält auch nach dem Verschwinden des Eingabepults ihr Blocklayout. Zuvor fiel sie in das allgemeine zweispaltige Sitzungslayout zurück: In der normalen 1920-Pixel-Seite schrumpfte die Bühne beim Aufdecken von 1874 auf 1040 CSS-Pixel. Das verkleinerte die Welt und löste eine teure Änderung des Canvas-Puffers aus.

Bei mindestens 1100 Pixel Fensterbreite und 761 Pixel Fensterhöhe reserviert der Renderer außerdem schon während der Eingabe die spätere volle Bühnenbreite. Die sichtbare Canvas-Fläche und die Kameraprojektion folgen weiterhin dem tatsächlichen CSS-Ausschnitt. Nur Spectrum verwendet dafür `setSize(..., false)`. Projektionsänderungen erfolgen nur bei geänderter sichtbarer Größe; wiederholte identische Puffergrößen werden ausgelassen.

Auflösung, Figuren, Schatten und Grafikprofile wurden dabei nicht reduziert. Der breitere Puffer kostet bereits während der Eingabe zusätzliche Rasterfläche und Grafikspeicher. Auf schmalen Ansichten wird die spätere Höhe nicht vorab reserviert: Die gemessene Änderung von 320 auf 568 Pixel kostet weiterhin 9,3–11,7 ms. Das ist keine allgemeine Beseitigung sämtlicher Größenwechsel.

## Diagnose und Messgrenzen

Im ursprünglichen erzwungenen breiten Szenario kostete eine Canvas-Breitenänderung von 1510 auf 1918 Pixel 18,8 ms; der ResizeObserver benötigte insgesamt 19,3 ms. Nach Reservierung blieben diese Zuweisungen aus und der Observer benötigte etwa 0,5 ms. CPU-Sampling und Chromium-Timeline dienten der Ursachenanalyse; sie beeinflussen den Ablauf und sind keine unveränderten FPS-Benchmarks.

Die normale Seite zeigte vor der Layoutkorrektur maximal 33,3 ms zwischen Animationsframes und einen Long Animation Frame von 52,4 ms. Nach der Korrektur lagen im erfassten Ablauf sämtliche Abstände bei höchstens 16,8 ms, ohne Long Tasks oder Long Animation Frames. Die historischen Berichte bleiben erhalten.

Finale, einzeln ausgeführte Hardwarefälle: Chromium/ANGLE D3D11 auf NVIDIA RTX 4080 SUPER, zwölf geladene Figuren, hohe Grafik, tatsächliche gemeinsame Spectrum-Auflösung im viersekündigen Messfenster. CPU-Sampling und Timeline-Capture waren ausgeschaltet. Die Tonfälle hatten bereits vor der Messung genau einen AudioContext.

| Bericht unter `outputs/qa/` | Darstellung | Maximaler Frameabstand | Long Animation Frames |
|---|---|---:|---|
| `spectrum-canvas-native-audible-final.json` | normale Seite, 1920×1080 / 390×844 | 16,8 / 16,8 ms | keine |
| `spectrum-canvas-native-muted-final.json` | normale Seite, 1920×1080 / 390×844 | 16,8 / 33,3 ms | keine |
| `spectrum-canvas-retina-final.json` | normale Seite, 1920×1080, DPR 2 mit Profilgrenze 1,5 | 16,8 ms | keine |
| `spectrum-canvas-forced-final.json` | erzwungene Vollbildbühne, 1920×1080 | 50,0 ms | ein Frame mit 62,3 ms, ohne zugeordnete Script-Einträge |

In allen breiten Fällen blieben Canvas-Größenzuweisungen bei der Enthüllung aus. Der erzwungene Vollbild-Stresstest bleibt trotzdem offen. Die zusätzliche Timeline zeigt Raster-/GPU-Arbeit, beweist aber keine abschließend isolierte Ursache des verbleibenden Ausreißers. Ein schmaler Desktop-Browser und DPR-Emulation sind keine Messung auf einem Mobilgerät.

## Funktion und Ressourcen

- `spectrum-buffer.json`: vier Fälle (1440/DPR1, 1440/DPR2, 1100/DPR1, 390/DPR2). Tatsächlicher 3D-Klick beziehungsweise Touch ergibt Tipp 75. Eine Prüfung der gerenderten Zeigerpixel belegt zusätzlich die korrekte sichtbare Position. Dasselbe Canvas übersteht Grafikwechsel und Fenstergrößenänderungen; auf breiten Ansichten bleiben Bühnen- und Pufferbreite beim Aufdecken erhalten.
- `spectrum-canvas-console-low-final.json`: sechs Sparfälle mit 2/8/12 Spielern auf 1440/390 Pixeln plus zwei Fälle ohne WebGL. Hinweisprüfung, privates Ziel, Entwurfswiederherstellung, Eingabe-/Auswahlerhalt, Tastatur, Fristende und Rundenreset bestehen.
- `spectrum-resize-console-high.json`: zwei hohe Grafikfälle mit zwölf Spielern, reduziertem Bewegen und letztem eigenen Teilnehmer plus zwei Fallbackfälle bestehen.
- `spectrum-canvas-presentation-high.json`: zwei hohe Grafikfälle mit zwölf Spielern auf 1440/390 Pixeln prüfen tatsächliche Eingaben, verdeckte Informationen, sämtliche Ergebniskarten, eigenen Teilnehmer nach Größenwechsel, Wiederbeitritt und neue Runde.
- `spectrum-resize-lifecycle.json`: 18 Wechsel zwischen Spectrum, Hivemind und Kaufhaus mit zwölf Figuren. Pro wiederholter Szene bleiben Textur-/Geometriezähler stabil: Spectrum 57/68, Hivemind 23/31, Kaufhaus 32/43; keine Browserfehler. Das ersetzt keine Prozessspeicherprüfung.

Die Renderbilder `spectrum-buffer-1440-2-reveal.png` und `spectrum-buffer-390-2-reveal.png` wurden visuell kontrolliert. Die breite Ergebnisansicht ist lesbar und unverzerrt. Auf dem schmalen Hochformat bleibt viel freier Raum oberhalb des Messgeräts; die mobile Kamerakomposition benötigt weiteren gestalterischen Feinschliff. Der normale Seitenablauf wurde zusätzlich im breiten Renderbild kontrolliert.

TypeScript-Prüfung und Produktionsbuild bestanden für diesen Quellstand. Die bestehende Warnung zu großen JavaScript-Chunks bleibt offen. Keine Spielregeln oder Assets wurden für diese Größenkorrektur verändert.

## Noch offen

Weitere Architektur-/Figuren-/Ergebnisgestaltung, mobile Kamerakomposition, verbleibender Vollbild-Rasterausreißer, tatsächliche Mobil- und Referenzgeräte, Hörprüfung, reale Mehrbrowserpartien und vollständige Olympiade. Der Gesamtumfang und die offenen Anforderungen stehen weiterhin in [ADVENTURE-STATUS.md](ADVENTURE-STATUS.md).

## Nachfolgender Ausbau der mobilen Leselinse

Die bei der Sichtkontrolle aufgefallene leere Hochformatfläche wurde anschließend gezielt verkürzt. Nur die fokussierte Ansicht ohne Eingabepult erhält auf höchstens 600 Pixel breiten Fenstern eine zur Gerätebreite passende Höhe, begrenzt durch den tatsächlich verfügbaren Sichtbereich. Die Höhe der Ergebnisnavigation wird weiterhin berücksichtigt; auf 320 Pixeln darf diese zweizeilig sein. Ein abgedunkelter Hintergrund trennt die fokussierte Lesefläche von der darunterliegenden Seite.

Die Schreibansicht bleibt von dieser Höhenbegrenzung ausgenommen. Texteingabe, Fokus, Entwürfe und die bisherige Behandlung eines kurzen Tastaturfensters bleiben erhalten. Der Kameramittelpunkt der kompakten Ergebnisansicht liegt im Hochformat tiefer, sodass die Figuren unmittelbar vor der Maschine nicht am unteren Rand abgeschnitten werden. In kurzen breiten Ansichten geht der Mittelpunkt kontinuierlich in die bisherige höhere Leseposition über. Die gemeinsame Raumansicht bleibt separat erreichbar.

Finale Größen im 1100 Pixel hohen Browserfenster, jeweils mit zwölf Figuren:

| Breite / DPR | Höhe der fokussierten Ergebnisbühne | sichtbarer Canvas |
|---|---:|---:|
| 320 / 2 | 549 CSS-Pixel | 318 × 242 CSS-Pixel |
| 390 / 2 | 556 CSS-Pixel | 388 × 298 CSS-Pixel |
| 600 / 1 | 724 CSS-Pixel | 598 × 466 CSS-Pixel |

Zuvor belegte die fokussierte Bühne in diesen Fällen 1082 CSS-Pixel. Die Skalierung der Spielfläche in horizontaler Richtung, Zeigerwerte und Eingaberegeln ändern sich dadurch nicht. Die Modelle und ihre Detailstufen wurden nicht reduziert.

Nachweise für den finalen Quellstand:

- `spectrum-portrait-buffer-final.json`: sechs Fälle mit 1440/DPR1, 1440/DPR2, 1100/DPR1, 320/DPR2, 390/DPR2 und 600/DPR1. Tatsächliche Zeigerpixel, Maus-/Touch-Eingabe, bestätigter Tipp 75, gleiche Canvas-Identität, breite Pufferstabilität, kompakte Höhe sowie Grafik- und Fensterwechsel bestehen. Die entsprechenden Renderbilder für 320, 390 und 600 Pixel wurden visuell kontrolliert.
- `spectrum-portrait-presentation-final.json`: hohe Grafik, reduzierte Bewegung, zwölf Spieler, letzter eigener Teilnehmer, 1440/390 × 844 Pixel. Tatsächliche Hinweis-/Skalen-/Versiegelungsaktionen, Privatsphäre, alle zwölf Ergebniskarten, eigener Teilnehmer nach Breitenwechsel, Wiederbeitritt und Rundenreset bestehen.
- Neun Tests aus `test-spectrum-presentation.mjs`, TypeScript-Prüfung und Produktionsbuild bestehen. Die bekannte Warnung zu großen JavaScript-Chunks bleibt offen.
- `spectrum-portrait-console.json` prüfte nach der Höhenänderung zusätzlich zwölf Spieler auf 1440/390 Pixeln und zwei WebGL-Fallbackfälle: Eingabeerhalt bei 600/400/900 Pixel Höhe, Hinweisprüfung, private Informationen, Entwürfe, Fristende und Reset bestehen. Dieser Bericht entstand vor der anschließenden Änderung ausschließlich des Ergebnis-Kameramittelpunkts.
- `spectrum-portrait-hardware-final.json`: normale Seite, zwölf Figuren, hohe Grafik, gespeicherter eingeschalteter Ton, genau ein AudioContext vor/nach dem warmen Fenster, RTX 4080 SUPER/D3D11. Breit 1874 × 571 Renderpixel, 85 Zeichenaufrufe, 241 Abstände, maximal 16,8 ms. Schmal 388 × 298, 104 Zeichenaufrufe, 240 Abstände, maximal 33,3 ms. Beide p99 16,8 ms und keine erfassten langen Aufgaben/Animationsframes. Der schmale Höhenwechsel 320 → 298 kostet weiterhin 12,5 ms. Keine kostenlose Größenänderung und keine Mobilgeräteabnahme.

Die älteren Berichte einschließlich `spectrum-portrait-hardware.json` vor der Kamerakorrektur bleiben erhalten. Der frühere erzwungene Vollbild-Rasterausreißer wurde durch diese mobile Gestaltung nicht erneut abschließend untersucht. Orts-/Figurenfeinschliff, echte Geräte, Hör- und Mehrbrowserprüfung sowie das vollständige 21-Spiele-Abenteuer bleiben offen. Dieser Ausbau ist lokal und unveröffentlicht.
