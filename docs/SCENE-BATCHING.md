# Zusammenfassung statischer Schauplatzteile

## Umsetzung

Der Szenen-Assetbesitzer teilt exakt gleiche, untexturierte Standardmaterialien innerhalb derselben Szene. Die Übereinstimmung berücksichtigt die serialisierten Materialeigenschaften; nur Anzeigename, UUID und Metadaten werden aus dem Vergleich entfernt. Texturierte Materialien und eigene Shaderanpassungen bleiben getrennt. Alle ursprünglich geladenen Materialien bleiben im Besitzerregister und werden einmal freigegeben, auch wenn ihr Mesh anschließend ein anderes, identisches Material verwendet.

`batchStaticMeshes` berücksichtigt Sichtbarkeit und Dynamik entlang der gesamten Elternkette. Kinder eines privaten Warenkorbs, einer später erscheinenden Tüte oder eines interaktiven Objekts dürfen nicht in den Schauplatz hochgezogen werden. Transparente, gespiegelte, skinnierte und Morph-Objekte werden ausgeschlossen. Bei identischen Geometrien bleibt Instancing erhalten. Optional werden unterschiedliche, kompatible Geometrien desselben Materials mit ihren tatsächlichen Transformationen zusammengeführt. Diese Option verwenden Salon und Kaufhaus; ursprüngliche Geometrie- und Materialbesitzer bleiben zuständig. Nur neu erzeugte kombinierte Geometrien gehören dem Batching-Helfer, dessen Freigabe wiederholbar ist.

Der bewegte Würfelbecher bleibt außerhalb des statischen Salonbaums. Wertungsblatt, Scannerfenster und Scannerstreifen bleiben eigenständig bedien- beziehungsweise aktualisierbar. Warenkorb und Papiertüte sind ausdrücklich dynamische Eltern, unabhängig von ihrer Sichtbarkeit beim Assetladen.

## Messung und Grenzen

Erster kontrollierter Lauf mit sechs Wechseln zwischen Salon, Kaufhaus und Rennstrecke: zwölf vollständig geladene Avatare, niedrige Grafikqualität, im Kaufhaus zehn vollständig geladene Produktbilder. Je Szenenbesuch gleiche Werte, ein Canvas, keine gemeldeten WebGL-Fehler:

| Schauplatz | Vorherige Draw Calls | Aktuelle Draw Calls | Dreiecke | Texturen | Geometrien |
| --- | ---: | ---: | ---: | ---: | ---: |
| Würfelsalon | 107 | 97 | 7.196 | 38 | 38 |
| Kaufhaus | 163 | 143 | 4.226 | 51 | 61 |
| Küstenrennen | 91 | 91 | 31.579 | 23 | 35 |

Die dargestellte Dreieckszahl bleibt gegenüber dem vorherigen Lauf unverändert. Der Salon erreicht in diesem Zustand das Low-Quality-Ziel von höchstens 100 Zeichenaufrufen. Das Kaufhaus überschreitet das Ziel weiterhin; insbesondere dynamische Warenpräsentationen brauchen weitere Arbeit. Diese Verbesserung ist keine vollständige Performance-Abnahme und keine Freigabe der Referenzspiele.

`test-static-batches.mjs` prüft transformierte Positionen und Normalen bei rotierten, nicht gleichmäßig skalierten Eltern, unveränderte Dreieckszahlen, die Elternzuordnung ausgeblendeter/dynamischer/interaktiver/gespiegelter Objekte und den Besitz neu erzeugter Geometrien. Ein Loader-Test bestätigt szenenlokales Materialteilen, getrennte abweichende/texturierte Materialien und genau einmalige Freigabe aller Originalmaterialien.

Der vollständige Lauf über 30 Szenenwechsel bestätigt dieselben Werte bei allen zehn Besuchen jedes Schauplatzes: Draw Calls, Dreiecke, Texturen und Geometrien bleiben je Ort identisch. Nachweis: `outputs/qa/scene-lifecycle-batched-30.json`. Alle sechs Tischfälle, sechs Kassenfälle (je zwei koordinierte Ansichten) und sechs Rennfälle mit 2/8/12 Spielern bei 1440/390 Pixeln bestehen ohne gemeldete Fehler. Die Berichte sind als `dice-place-batched-all.json`, `checkout-layout-batched-all.json` und `race-view-batched-all.json` unter `outputs/qa/` gesichert. Tisch- und Kassenbilder wurden auf Desktop beziehungsweise Touch visuell kontrolliert. Die drei neuen Node-Prüfungen, 17 Adventure-Prüfungen, drei Checkout-Prüfungen, TypeScript und Produktionsbuild bestehen.

Nach den letzten Schutzmaßnahmen für dynamische Tüten und übereinstimmende Render-Layer/-Reihenfolge bestehen im endgültigen Produktionsbuild erneut die mobile Kassenfolge mit zwölf Spielern und zwei Ansichten sowie sechs vollständig geladene Szenenwechsel. Die Messwerte bleiben 97/143/91 Zeichenaufrufe; die finalen Berichte stehen in `checkout-layout.json` und `scene-lifecycle.json`. Der eigene Vorschauprozess wurde nach der Prüfung beendet.

Die Browsermessung verwendet Chromium/SwiftShader und belegt keine Geräte-FPS, Eingabelatenz oder vollständige Prozessspeichergrenze. Echte Hardwaremessung, das gesamte Sound-/Welt-/Disziplinziel und die vollständige Mehrbrowser-Olympiade bleiben offen. Der Arbeitsstand ist lokal und unveröffentlicht.

Die anschließende gezielte Warenflächen-Überarbeitung steht in `SHOPPING-DISPLAYS.md`. Sie verbessert das Kaufhaus von diesem historischen Zwischenstand mit 143 Zeichenaufrufen auf 86 in der vollständig geladenen niedrigen Übersicht; Salon und Rennen bleiben unverändert. Die Budgetüberschreitung der früheren Übersicht gilt damit für den neuen geprüften Zustand nicht mehr.
