# Erste tatsächliche GPU-Messung der 21 Anfangsszenen

Am 18. Oktober 2026 wurde die lokale Fassung erstmals zusätzlich zu SwiftShader mit der tatsächlichen NVIDIA GeForce RTX 4080 SUPER über ANGLE/Direct3D 11 gemessen. Windows meldet Treiberversion `32.0.16.1088`; der jeweilige WebGL-Kontext bestätigt den NVIDIA-D3D11-Renderer selbst. Die Probe ersetzt weder den Ziel-Desktop mit Iris Xe noch das Ziel-Mobilgerät mit Snapdragon 778G.

## Verfahren

`scripts/check-hardware-scenes.mjs` öffnet pro Disziplin eine neue Browsersicht mit zwölf konfigurierten Teilnehmern. Die normalen Orte warten auf zwölf geladene Figuren und die hohe Grafikstufe. Bossorte warten auf geladenes Rig und die fertige Arena; sie behalten ihre eigene adaptive Auflösung. Ton ist stummgeschaltet. Die Raumantworten stammen aus der tatsächlichen Spiellogik-Fixture; es handelt sich nicht um eine Live-Netzwerkpartie.

Der Browser verwendet ausdrücklich `--use-angle=d3d11 --enable-webgl`. Software-Renderer werden zurückgewiesen. Die Bühne wird für die Messung in ein Fenster von 1920 × 1080 Pixeln gesetzt. Die tatsächlichen Renderpuffer werden separat erfasst: Rahmen und integrierte Eingabepulte können die dreidimensionale Fläche verkleinern. Eine Fensterangabe allein ist deshalb kein Nachweis für einen gleich großen Renderpuffer.

Nach 2,2 Sekunden Aufwärmzeit werden vier Sekunden `requestAnimationFrame`-Abstände erfasst. Zusätzlich speichert die Probe die bereits vorhandenen App-Diagnosen: Bildzeitfenster, CPU-Renderzeit, Grafikzähler und bei Bossen die gemessene GPU-Zeit, gemeldete FPS und adaptive Skalierung. Die Aufnahme des Renderbilds erfolgt nach dem Messfenster.

Rohdaten: `outputs/qa/hardware-scenes.json`. Einzelbilder: `outputs/qa/hardware-<id>-1920.png`. Die zusätzlich gerenderte Übersicht `outputs/qa/hardware-contact.png` wurde visuell kontrolliert. Der Bericht wird während des Laufs geschrieben; eine vorhandene Datei allein beweist keinen erfolgreichen Abschluss. Für den hier dokumentierten Lauf wurden der erfolgreiche Prozessabschluss, alle 21 unterschiedlichen Disziplinen und die leere Fehlerliste geprüft.

## Ergebnis dieses kurzen Laufs

Alle 21 Anfangsszenen wurden abgeschlossen, insgesamt 5.061 rAF-Abstände. Deren p95 und p99 liegen je Szene bei 16,7–16,8 ms. In diesen Messfenstern gab es keinen Abstand über 33,5 ms. Die App meldet für die normalen Orte zuletzt ein Bildzeit-p95 von höchstens 16,8 ms. Die drei Bossanzeigen melden jeweils 60 FPS; die zuletzt erfassten GPU-Zeiten betragen 2,19 ms beim Koloss, 2,60 ms beim Kraken und 3,96 ms beim Drachen.

Diese Werte beschreiben den beobachteten kurzen Lauf auf dieser starken Desktop-GPU. Browser-rAF ist keine vollständige GPU-Zeitspur. Bei den normalen Orten ist `appRenderP95` die CPU-Dauer des Renderaufrufs, kein GPU-Timer. Die 60-FPS-Grenze lässt aus diesem Lauf keine Aussage über die maximal mögliche Bildrate ableiten.

| Spiel-ID | Renderpuffer | Draw Calls | Dreiecke | rAF p95 (ms) |
|---|---:|---:|---:|---:|
| colossus | 1920 x 1080 | 142 | 30273 | 16.7 |
| kraken | 1920 x 1080 | 116 | 127493 | 16.7 |
| dragon | 1920 x 1080 | 100 | 63577 | 16.7 |
| code | 1918 x 1078 | 139 | 16136 | 16.7 |
| auction | 1918 x 1078 | 118 | 9598 | 16.7 |
| timing | 1918 x 1078 | 62 | 7212 | 16.8 |
| bomb | 1918 x 1078 | 92 | 16220 | 16.7 |
| chain | 1918 x 1078 | 64 | 8688 | 16.8 |
| categories | 1918 x 1078 | 135 | 21108 | 16.7 |
| geo | 1918 x 1078 | 106 | 15060 | 16.7 |
| typer | 1918 x 835 | 149 | 61184 | 16.8 |
| herd | 1918 x 1078 | 73 | 8532 | 16.7 |
| spectrum | 1918 x 1078 | 89 | 2744 | 16.8 |
| dice | 1918 x 766 | 129 | 14254 | 16.7 |
| wiki | 1918 x 1078 | 121 | 11580 | 16.8 |
| picture | 1918 x 1078 | 136 | 7110 | 16.8 |
| budget | 1918 x 1078 | 124 | 7772 | 16.7 |
| blackjack | 1918 x 1078 | 99 | 10366 | 16.7 |
| cards | 1918 x 1078 | 127 | 23616 | 16.7 |
| color | 1918 x 1078 | 114 | 9422 | 16.8 |
| size | 1918 x 1078 | 96 | 5274 | 16.7 |

## Wiederholen und weiter prüfen

Mit laufender lokaler Vorschau auf Port 5173:

```text
node scripts/check-hardware-scenes.mjs
```

`HARDWARE_GAMES` begrenzt die Disziplin-IDs, `HARDWARE_WIDTHS` die Fensterbreiten und `HARDWARE_REPORT` die Ausgabedatei. Eine schmale Ansicht auf derselben RTX bleibt eine Desktop-GPU-Messung und wird ausdrücklich nicht als Smartphone-Nachweis bezeichnet.

Offen bleiben Messungen auf den festgelegten Mittelklasse-Referenzgeräten, echte Mobil-Tastaturen, unterschiedliche Pixeldichten, Spitzenzustände mit zwölf gleichzeitigen Aktionen, Boss-Salven und Auflösungen, kalte Downloads/Shader-Kompilierung, Eingabelatenz, automatische Qualitätswechsel, lange Sitzungen und Prozess-/GPU-Speicher. Ebenso fehlen die vollständige Live-Mehrbrowser-Olympiade und die gesamte Anforderung-für-Anforderung-Abnahme. Der Lauf ist ein erster Hardware-Ausgangspunkt und kein Abschluss der Performance- oder Spielabnahme.

Die Bildübersicht zeigt ebenfalls weiterhin Gestaltungsarbeit: Mehrere Orte benötigen eine stärkere Einbindung in ihre Region, weniger leeren Hintergrund und eine gezieltere Kamerakomposition. Dieser erste Lauf lag vor dem anschließenden Ausbau der Kategorien-Expedition; deren fortlaufender Weg und gezielte Nachprüfung sind in [CHAIN-EXPEDITION.md](CHAIN-EXPEDITION.md) beschrieben. Gute Bildzeiten dieser Anfangsszenen ersetzen diese noch offenen Anforderungen nicht.


## Nachfolgende Kategorien-Expedition
Die Tabelle oben bleibt der historische Ausgangslauf der 21 Anfangsszenen. Die später umgebaute Expedition wurde zusätzlich einzeln gemessen: `outputs/qa/hardware-chain-expedition.json` enthält die warme Anfangsszene mit zwölf Figuren, 241 rAF-Abständen, p95/p99 jeweils 16,8 ms, 88 Zeichenaufrufen und 10.889 Dreiecken bei 1918 × 1078 Renderpixeln. Das dazugehörige Bild ist `hardware-chain-expedition-1920.png`. Das allgemeine Einzelbild `hardware-chain-1920.png` wurde dabei aktualisiert; die alte Kontaktübersicht zeigt weiterhin den früheren 21er-Lauf. Diese Dateistände dürfen nicht als ein gemeinsamer neuer Gesamtlauf interpretiert werden.

Eine weitere gezielte Probe mit tatsächlichem Wegaufbau während der Erfassung steht in `outputs/qa/hardware-chain-long.json`: 25 vorhandene Begriffe, ein bestätigter 26. Begriff im Messfenster, zwölf geladene Figuren, hohe Grafik, RTX 4080 SUPER/D3D11. 240 rAF-Abstände: p95 16,7 ms, p99 16,8 ms, keiner über 33,5 ms. Endstand: 113 Zeichenaufrufe/14.220 Dreiecke bei tatsächlich 1918 × 945 Renderpixeln. Bild: `hardware-chain-long-chain-1920.png`. `HARDWARE_CHAIN_LONG=1` aktiviert dieses Szenario; `HARDWARE_IMAGE_PREFIX` trennt seine Bilder vom historischen 21er-Lauf. Dies bleibt ein kurzer warmer Desktoplauf mit Spielengine-Fixture, keine vollständige Hardware-, Netzwerk- oder Disziplinabnahme.


## Nachfolgendes Ideenatelier

Die neu ausgearbeitete Atelierfassung wurde auf derselben RTX 4080 SUPER/D3D11 mit zwölf Figuren und hoher Grafik separat gemessen. `hardware-atelier-writing.json`: warme Schreibphase, 241 rAF-Abstände, p95 16,7 ms, p99 16,8 ms, 124 Zeichenaufrufe/21.162 Dreiecke. `hardware-atelier-review.json`: zwölf Antwortoptionen und echte Stimmauflösung im Messfenster, 239 Abstände, p95/p99 16,8 ms, im Endzustand 58 Zeichenaufrufe/9.498 Dreiecke. Beide Fenster enthalten keinen Abstand über 33,5 ms. Beide verwenden tatsächlich 1918 × 876 Renderpixel im 1920 × 1080 Fenster. Bilder: `hardware-atelier-writing-categories-1920.png`, `hardware-atelier-review-categories-1920.png`; die historische 21er-Kontaktübersicht bleibt unverändert.

`HARDWARE_ATELIER_REVIEW=1` bereitet die Bewertungswand mit tatsächlichen Spielbefehlen vor und löst die Abstimmung während der Messung auf. `HARDWARE_IMAGE_PREFIX` trennt die Dateien der beiden Szenarien. Einzelheiten, Gruppen-/Ressourcennachweise und Grenzen stehen in [IDEAS-ATELIER.md](IDEAS-ATELIER.md). Auch diese zwei kurzen warmen Desktopproben belegen keine Mobilgerät-FPS, kalten Ladezeiten, Latenzen, Prozessspeicher oder vollständige Live-Olympiade.


## Atelier mit integriertem Schreibblatt

Die drei anschliessenden warmen RTX-4080-SUPER-/D3D11-Proben sind in [ATELIER-NOTEBOOK.md](ATELIER-NOTEBOOK.md) mit Rohberichtnamen und Grenzen dokumentiert. Persoenlicher Platz und Gruppe: jeweils 1460 x 932 Renderpuffer, 241 rAF-Abstaende, p95 16,7/16,8 ms und 104/124 Zeichenaufrufe. Bewertungswand: 1918 x 876, 239 Abstaende, p95 16,8 ms, 58 Zeichenaufrufe, eine Luecke ueber 33,5 ms bei echter Abstimmungsaufloesung. Diese neuen Ausschnitte ersetzen die historischen Zahlen oben nicht. Keine Smartphone-, Kaltstart-, Langzeit- oder vollstaendige Performanceabnahme.

## Hivemind: tatsächliche Gruppenenthüllung

`hardware-herd-gathering.json` misst zwölf echte Abgaben, Gruppenbewegung und zwölf Einzelgruppen innerhalb des warmen viersekündigen Messfensters auf derselben RTX 4080 SUPER über D3D11. Breites Fenster: 1918 × 860 Renderpuffer, 238 rAF-Abstände, p95 16,7 ms/p99 33,3 ms. Schmales Fenster: 388 × 624, 241 Abstände, p95 16,7 ms/p99 16,8 ms. Beide Endzustände: 82 Zeichenaufrufe und 10.064 Dreiecke; keine Lücke über 33,5 ms. Das schmale Fenster ist weiterhin dieselbe Desktop-GPU. Bilder, abschließende Dekorations-/Nebelsichtkorrekturen, funktionale Nachweise und Grenzen stehen in [HIVEMIND-GATHERING.md](HIVEMIND-GATHERING.md). Keine Smartphone-, Kaltstart-, Langzeit- oder vollständige Performanceabnahme.

## Hivemind mit integriertem Gedankenplatz

Die anschließenden vier warmen D3D11-Proben stehen in [HIVEMIND-THOUGHT-PLACE.md](HIVEMIND-THOUGHT-PLACE.md) und den dort genannten eigenen Rohberichten. Persönlicher Platz und schreibende Gruppe: jeweils 1460 × 922 Renderpuffer, 241 rAF-Abstände, p95/p99 16,8 ms, 57/71 Zeichenaufrufe. Tatsächlicher Übergang vom persönlichen Platz zu zwölf ausgewerteten Gruppen: breite Ansicht 1918 × 860, 237 Abstände, p95/p99 16,8 ms; schmale Ansicht 388 × 624, 239 Abstände, p95 16,7/p99 16,8 ms. Beide Ergebnisse benötigen 82 Zeichenaufrufe. Im breiten Übergang gibt es einen einzelnen Abstand über 50 ms; diese Spitze bleibt offen. Die schmale Probe ist kein Smartphone-Benchmark. Frühere Berichte werden durch diese anderen Szenarien nicht ersetzt. Keine vollständige Performanceabnahme.

## Spectrum: Messgerät, Gruppe und tatsächliche Enthüllung

Vier weitere warme RTX-4080-SUPER-/D3D11-Proben mit zwölf Figuren und hoher Grafik sind in [SPECTRUM-MACHINE.md](SPECTRUM-MACHINE.md) vollständig mit Rohberichtnamen dokumentiert. Private Geräte- und Gruppenansicht: jeweils 1918 × 852 Renderpixel, 241 rAF-Abstände, p95 16,7 beziehungsweise 16,8 ms, Maximum 16,8 ms und 88 beziehungsweise 104 Zeichenaufrufe. Tatsächliche gemeinsame Enthüllung im Messfenster: breit 235 Abstände, p95 16,8/p99 33,3 ms, Maximum 66,6 ms, zwei Abstände über 33,5 ms und einer über 50 ms; schmal 240 Abstände, p95/p99 16,8 ms, Maximum 33,3 ms bei 388 × 584 Renderpixeln. Die breite 66,6-ms-Spitze bleibt offen. Der Hardwareprüfer verwendet eine vollflächige Bühne mit ausgeblendeter globaler Navigation. Die Bedienbarkeit der normalen Seite benötigt eigene Funktionsprüfungen. Die schmale Ansicht auf derselben Desktop-GPU ist kein Smartphone-Nachweis. Diese Berichte ersetzen weder die historischen Proben noch die vollständige Performanceabnahme.

Nach korrigierter normaler Kurzansicht bestätigt `hardware-spectrum-reveal-final.json` breit 66,7 ms Maximum. Die anschließende Trace-Diagnose und das Entfernen des für Spectrum unpassenden allgemeinen CSS-Kameraimpulses sind ebenfalls in `SPECTRUM-MACHINE.md` beschrieben. `hardware-spectrum-steady-trace.json`: breit 237 rAF-Abstände, p95 16,8/p99 33,3 ms, Maximum 49,9 ms; schmal 241 Abstände, p95 16,7/p99 16,8 ms, Maximum 16,8 ms. Die Rendererstände bleiben 83/111 Zeichenaufrufe bei 1918 × 852 beziehungsweise 388 × 584. Breit meldet die Long-Animation-Frame-API weiterhin 52,9 und 57 ms lange Frames. Der erste ordnet 49,7 ms Scriptdauer dem Snapshot-Empfang `Response.json.then` zu. Die Spitze gilt damit weiterhin als untersuchungsbedürftig; die historische >50-ms-Probe wird nicht durch die bessere Wiederholung ersetzt. Kein vollständiger Ursachen-, Mobil- oder Performanceabschluss.

## Spectrum mit integriertem Hinweis-/Zeigerpult

Vier anschließende warme D3D11-Proben mit zwölf Figuren und hoher Grafik stehen mit Rohberichtnamen in [SPECTRUM-CONSOLE.md](SPECTRUM-CONSOLE.md). Private Geräte- und Gruppenansicht: durch das tatsächlich sichtbare Pult jeweils 1510 × 852 Renderpixel, 241 rAF-Abstände, p95 16,7/p99 16,8 ms, Maximum 16,8 ms und 98/104 Zeichenaufrufe. Die bestätigte Enthüllung im Messfenster: breit 235 Abstände, p95 16,7/p99 33,4 ms, Maximum exakt 50,0 ms; schmal 240 Abstände, p95 16,7/p99 16,8 ms, Maximum 33,3 ms. Ergebnisstände weiterhin 83/111 Zeichenaufrufe bei 1918 × 852 beziehungsweise 388 × 584 Renderpixeln. Die breite Trace-Probe meldet einen 63,5 ms langen Animationsframe mit 49,6 ms Scriptdauer in `Response.json.then`. Die strikte Zahl der rAF-Abstände >50 ms beträgt zwar 0, der Übergang bleibt dennoch offen. Andere Ausschnitte und ein gutes p95 ersetzen weder die früheren Spitzen noch die vollständige Performance-/Geräteabnahme.

## Wiki-Sprint mit vollständiger Buchgalerie

Die gesonderten warmen RTX-4080-SUPER-/D3D11-Proben mit zwölf Figuren, hoher Grafik und 28 tatsächlichen vorbereiteten Artikelschritten sind in [WIKI-LIBRARY.md](WIKI-LIBRARY.md) dokumentiert. Die erste Galerieprobe benötigt 87 Zeichenaufrufe; nach Ausblenden des angeschnittenen Hallenschilds 86. Beide: 241 rAF-Abstände, p95 16,7/p99 16,8 ms, Maximum 16,8 ms bei 1918 × 802 Renderpixeln. Die Gruppenansicht vor der Ankunft benötigt 129 Zeichenaufrufe bei denselben Bildzeiten. Die erste tatsächliche Ankunft im Messfenster erreicht breit maximal 33,4 ms, schmal 16,8 ms. Nach Freistellen der Zielkammer benötigen beide Endzustände 111 Zeichenaufrufe und 11.380 Dreiecke, breit 1918 × 802 und schmal 388 × 556 Renderpixel. Die breite Wiederholung hat 239 Abstände, p95 16,7/p99 16,8 ms und Maximum exakt 50,0 ms; die schmale 241 Abstände und Maximum 16,8 ms. Breit erfasst die Trace-API eine 50-ms-Aufgabe und einen 51,5-ms-Animationsframe mit 50,1 ms Scriptdauer in `Response.json.then`. Diese Snapshot-Spitze bleibt offen. Alle Rohberichte bleiben getrennt erhalten. Keine Live-Wikipedia-, Kaltstart-, Smartphone-, Prozessspeicher- oder vollständige Performanceabnahme.


## Pixelblitz: Bildwand, Studiogruppe und gemeinsame Enthüllung

Vier gesonderte warme RTX-4080-SUPER-/D3D11-Proben mit zwölf Figuren und hoher Grafik stehen in [PICTURE-STUDIO.md](PICTURE-STUDIO.md). Bildwand und Studio: jeweils 1510 × 846 Renderpixel, 87 beziehungsweise 146 Zeichenaufrufe. Tatsächliche Gewinnantwort und Enthüllung im Messfenster: breit 1918 × 846 bei 97 Zeichenaufrufen, schmal 388 × 594 bei 82. Jeder Fall umfasst 241 rAF-Abstände; p95 16,7–16,8 ms, p99 und Maximum 16,8 ms. Keine erfassten Abstände >33,5 ms und keine Long-Task-/Long-Animation-Frame-Einträge in diesen kurzen Fenstern. Rohberichte: `hardware-picture-screen.json`, `hardware-picture-studio.json`, `hardware-picture-reveal.json`. Die schmale Ansicht verwendet dieselbe Desktop-GPU und belegt keine Smartphone-Leistung. Kaltstart, echte Mobilgeräte, lange Sitzungen, Eingabelatenz und vollständige Performanceabnahme bleiben offen; frühere Spitzen anderer Disziplinen bleiben bestehen.


## Farbgedächtnis: Mischgerät, Laborgruppe und neutraler Vergleich

Vier abschließende warme RTX-4080-SUPER-/D3D11-Proben mit zwölf Figuren und hoher Grafik stehen in [COLOR-LABORATORY.md](COLOR-LABORATORY.md). Mischgerät und Gruppe: jeweils 1520 × 846 Renderpixel, 111 beziehungsweise 136 Zeichenaufrufe, 241 rAF-Abstände, p99 und Maximum 16,8 ms. Tatsächliche zwölf Abgaben und Auflösung im Messfenster: breit 1918 × 846 bei 20 Zeichenaufrufen, 237 Abstände, p95 16,8/p99 33,3 ms, Maximum exakt 50,0 ms; schmal 388 × 544 bei 16 Zeichenaufrufen, 240 Abstände, p95 16,7/p99 16,8 ms, Maximum 33,4 ms. Breit meldet die Trace-API einen 59,8 ms langen Animationsframe mit 49,5 ms Scriptdauer im Aufrufkontext `Response.json.then`. Die erste, getrennt aufbewahrte breite Auflösung meldete bereits 52,3 ms Animationsframe und 49,4 ms Scriptdauer. Diese Snapshot-Spitze bleibt offen; ein gutes p95 und die strikte Zahl null der rAF-Abstände >50 ms schließen sie nicht ab. Rohberichte: `hardware-color-machine-final.json`, `hardware-color-group-final.json`, `hardware-color-reveal-final.json` sowie die dort dokumentierten früheren Berichte. Die schmale Ansicht ist kein Smartphone-Benchmark. Keine Kaltstart-, Latenz-, Langzeit- oder vollständige Performanceabnahme.


## CPU-Diagnose: kalter Audioaufbau im Snapshot

Die nachfolgenden ursächlichen V8-Profile und zwölf normalen stummen/hörbaren Vergleichsfälle stehen in [AUDIO-STARTUP-PERFORMANCE.md](AUDIO-STARTUP-PERFORMANCE.md). In den nachgestellten Farbgedächtnis-Fällen entfallen vor der Korrektur statistisch 50,266 ms beziehungsweise 54,794 ms auf `Sound.init()` während der Auflösung; danach gibt es in den entsprechenden Messfenstern keinen gesampelten Initialisierungsaufruf. Stumm bleibt ohne Kontext. Bei gespeichertem eingeschaltetem Ton wird genau ein Kontext vor dem warmen Fenster an der echten Kameraaktion vorbereitet und später wiederverwendet.

Die sechs abschließenden hörbaren D3D11-Fälle für Farbgedächtnis, Spectrum und Wiki mit jeweils zwölf Figuren und 1920/390 Pixel Breite erreichen p95 16,7–16,8 ms und p99 16,8 ms. Maximale rAF-Abstände: Farbe 33,3/16,8 ms, Spectrum 33,4/16,8 ms, Wiki 16,8/16,8 ms. Keine Intervalle >33,5 ms. Die breite Spectrum-Probe meldet dennoch einen 56,5-ms-Animationsframe mit React-/Render-/ResizeObserver-Arbeit, darunter 25,8 ms im ResizeObserver. Diese andere Spitze bleibt offen. Die erste native Audiokonstruktion kostet an der Nutzeraktion weiterhin gemessene 36,8–44,5 ms in den breiten Fällen und ist kein kostenloser Kaltstart. Die CPU-Sampling-Fälle sind gesonderte Diagnosen und keine FPS-Abnahme. Historische Berichte bleiben bestehen. Kein Smartphone-, Langzeit-, Live-Netzwerk- oder vollständiger Performanceabschluss.


Nachfolgende Spectrum-Messungen: [SPECTRUM-CANVAS-SIZING.md](SPECTRUM-CANVAS-SIZING.md). Auf der normalen Seite entfällt das unbeabsichtigte Schrumpfen von 1874 auf 1040 CSS-Pixel. Finale breite Proben mit und ohne Ton sowie DPR 2 erreichen maximal 16,8 ms ohne lange Animationsframes. Schmal: maximal 16,8 ms mit Ton beziehungsweise 33,3 ms stumm. Der getrennte erzwungene Vollbild-Stresstest erreicht weiterhin einen 62,3-ms-Animationsframe ohne Script-Einträge. Kein Mobilgeräte- oder Gesamtleistungsnachweis; historische Messungen bleiben bestehen.


Die mobile Spectrum-Leselinse nutzt nun eine zur Maschinenbreite passende Höhe und einen tieferen Hochformat-Kamerafokus. Dadurch bleiben Hinweis, Skala und nahe Figuren zusammen sichtbar. Finale sechs DPR-/Eingabefälle, zwei Zwölfspieler-Ergebnisabläufe und breite/schmale warme Hardwareproben sind in [SPECTRUM-CANVAS-SIZING.md](SPECTRUM-CANVAS-SIZING.md#nachfolgender-ausbau-der-mobilen-leselinse) dokumentiert. Der Vollbild-Stressfall, tatsächliche Mobilgeräte und die Gesamtanforderungen bleiben offen.
