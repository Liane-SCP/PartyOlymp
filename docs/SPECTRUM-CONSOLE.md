# Spectrum: Hinweis und eigener Zeiger an der Messstation

Die bisher unter beziehungsweise neben der Bühne getrennte Spectrum-Eingabe gehört jetzt direkt zur Messstation. Eine einzige React-Portalfläche enthält Hinweis, private Zielanzeige, Zeiger, Versiegelung und Wartezustand. Auf breiten hohen Ansichten sitzt das Pult rechts neben dem Gerät; auf schmalen oder kurzen Ansichten darunter. Ergebnisphase und Zuschauerrolle behalten ihre eigenen vorhandenen Ansichten. Die Regel- und Wertungslogik wurde nicht verändert.

## Rollen und Rückmeldung

Der Hinweisgeber sieht seinen serverseitig erlaubten Zielwert und nennt einen Begriff. Reine Zahlenhinweise werden weiterhin durch dieselbe Validierung abgewiesen. Die anderen sehen erst den geteilten Hinweis und bedienen ihren eigenen 0–100-Zeiger. Das Pult zeigt beide Pole, gegebenenfalls das Thema, verbleibende Zeit und die öffentliche Zahl versiegelter Tipps. Es erklärt die tatsächlichen Abstandsgrenzen für 4/3/2 Punkte. Fremde Zielwerte und Zeiger werden nicht aus Geheimzuständen rekonstruiert.

Die direkte 3D-Skala und das räumliche Versiegelungsfeld bedienen dieselbe einzelne Eingabe. Dafür sucht die Brücke das portierte Element innerhalb der gemeinsamen Sitzung statt im jetzt verborgenen alten Spielpult. Die Rückmeldung des Reglers bleibt unmittelbar; nur bestätigte Aktionen gehen an die bestehende Spiellogik. Tastaturänderungen übertragen ausschließlich tatsächlich verwendete Regler-Tasten. Escape löst keine zusätzliche Zeigeraktion aus.

## Entwürfe, Frist und Wiederbeitritt

Eigene Hinweis- und Zeigerentwürfe werden im selben Tab mit Raum, Olympiadenstart, Disziplinindex, Runde und Teilnehmer abgegrenzt gespeichert. Der Schlüssel enthält keine fremden Informationen. Wiederhergestellte Hinweise werden erneut validiert. Ein bestätigter eigener Tipp wird aus dem privaten Serverzustand angezeigt. Alte Runden werden nicht als neue Eingabe übernommen. Die bestehende `timeoutDraft`-Strecke erhält den letzten gültigen Hinweis beziehungsweise einen tatsächlich veränderten Zeiger; die verbindliche Fristentscheidung bleibt beim Server.

## Kleine Eingabeflächen und WebGL-Ausfall

Die feste Nahansicht berücksichtigt `visualViewport.height` und dessen oberen Versatz. Das Pult misst seine tatsächliche Höhe über einen aufgeräumten `ResizeObserver`. Texteingaben wechseln beim Größenwechsel weder DOM-Knoten noch React-Zustand; Text und Auswahl bleiben erhalten. Unter 520 Pixel verfügbarer Höhe bekommt die Eingabe vorübergehend Vorrang. Die nicht sichtbare 3D-Welt behält ihren Renderer, pausiert aber ihre Framearbeit. Nach dem Vergrößern wird dieselbe Szene fortgesetzt. Escape beziehungsweise die Rückkehr zur Gruppe beendet den Eingabefokus. Die tatsächliche Bildschirmtastatur auf einem Smartphone ist damit noch nicht geprüft.

Die mobile Eingabe verwendet mindestens 16-Pixel-Schrift und 44-Pixel-Bedienflächen. Ein eigener Scrollbereich macht bei sehr kurzer Ansicht auch die Bestätigung erreichbar. Die nicht benötigten Kamerawerkzeuge verschwinden in dieser Eingabesituation. Bei fehlendem WebGL bleibt dasselbe HTML-Pult bedienbar; es entsteht keine zweite Kopie mit abweichendem Zustand.

## Gezielte Nachweise

Der erste Integrationslauf `spectrum-entry-layout.json` besteht mit zwölf Spielern auf 1440/390 × 700 Pixeln: tatsächlicher Hinweis, Validierung, private Zielwerte, direkte 3D-Skala, Tastaturkorrektur, räumliche Versiegelung, sämtliche Ergebnisse, eigener Teilnehmer beim Breitenwechsel, Escape, Wiederbeitritt, fehlender Tipp/fehlender Hinweis und Rundenreset. Die spätere kleine Korrektur des Desktop-Pultabstands und der sehr kurzen Eingabe wird getrennt nachgeprüft.

Die abschließenden Pultläufe `spectrum-console-low.json` und `spectrum-console-high.json` bestehen nach Ausblendung der störenden Kamerawerkzeuge und Pause der verdeckten Welt: sechs niedrige Fälle mit 2/8/12 Spielern und zwei hohe Fälle mit zwölf Spielern, jeweils Desktop/Touch. Die hohe Probe setzt zusätzlich die Anwendungseinstellung für reduzierte Bewegung. Jeder Bericht ergänzt zwei echte WebGL-Ausfallfälle mit erfolgreichem Hinweis. Geprüft wurden unveränderte Input-/Canvas-Knoten bei 600/400/900 Pixel Höhe, Auswahl, erreichbare Eingabeflächen einschließlich Bestätigung, Neuladen des eigenen Hinweises und Zeigers, Zahlenvalidierung, Enter, Geheimhaltung, tatsächliche Fristabgabe und Folgerunde. In der 400-Pixel-Ansicht bleibt der tatsächliche Szenen-Framezähler über 650 ms stehen; nach dem Vergrößern läuft er wieder weiter. Escape schließt die Nahansicht und entfernt tatsächlich den Eingabefokus. Die finalen Desktop-/Touchbilder einschließlich der sehr kurzen Ansicht wurden kontrolliert.

Die vorhandenen neun Spectrum-Darstellungsprüfungen und acht Spielregelprüfungen bestehen. TypeScript und der abschließende Produktionsbuild bestehen. Die bekannte Warnung zu großen Clientchunks bleibt offen.

`spatial-scenes-spectrum-console.json` ergänzt zwei bestandene native Web-Audio-Abläufe nach der Portalumstellung: tatsächlicher Regler-/Versiegelungs-/Enthüllungsklang, Quellenposition, Kamerahörer, ein AudioContext, stumme alte Ereignisse nach verspäteter Zustellung und Wiederbesuch sowie Freigabe aller Quellen und sechs Umgebungsschleifen. Die danach geänderte sehr kurze Ansicht betrifft die Sichtbarkeit und Framepause, nicht die Klangquellen.

`scene-lifecycle-spectrum-console-18.json` enthält 18 bestandene Wechsel zwischen Spectrum, Hivemind und Kaufhaus. Jeder der sechs Spectrum-Besuche öffnet vor der tatsächlichen Ergebnisphase das neue Hinweisfeld und wechselt viermal die Breite bei erhaltenem Eingabe- und Canvas-Knoten. Anschließend folgen Geräte-/Gruppenansicht, alle zwölf Ergebnisse und vier weitere Breitenwechsel. Der Hinweisplatz bleibt bei allen sechs Besuchen bei 78 Zeichenaufrufen, 1.628 Dreiecken, 43 Texturen und 49 Geometrien. Das breite letzte Ergebnis bleibt jeweils bei 86 Zeichenaufrufen, 1.792 Dreiecken, 57 Texturen und 68 Geometrien. Keine alten Spectrum-Eingaben in den Ergebnis-/Folgeszenen, eine aktive Canvasfläche und keine gemeldeten WebGL-Fehler. Das ist ein Renderer-Ressourcennachweis, kein Nachweis einer vollständigen Prozessspeichergrenze.

`spectrum-console-fallback.json` ergänzt zwei gezielte Fälle auf dem abschließenden Build: jeweils Hinweisgeber und ratender Client mit erzwungen fehlendem WebGL bei 1440/390 Pixel Breite. Der Hinweis wird tatsächlich geteilt; der zweite Client sieht keinen privaten Zielwert, stellt per Tastatur 99 ein und versiegelt diesen Tipp bis zur tatsächlichen Auflösung. Die Ergebnisse bleiben über die vorhandene HTML-Auswertung zugänglich.

## Warme Hardwareproben mit integriertem Pult

Die folgenden vier kurzen Proben verwenden zwölf geladene Figuren, hohe Grafik und dieselbe RTX 4080 SUPER über D3D11. Sie laufen einzeln nach den Funktionsprüfungen. `hardware-spectrum-console-machine.json`, `hardware-spectrum-console-group.json` und `hardware-spectrum-console-reveal.json` bleiben von den älteren Berichten getrennt. Der Prüfer vergrößert die Bühne auf das Fenster und blendet die globale Navigation aus; die normale Seitenbedienung wird durch die oben beschriebenen gesonderten Tests geprüft.

| Zustand | Renderpuffer | rAF-Abstände | p95 / p99 | Maximum | >33,5 / >50 ms | Zeichenaufrufe / Dreiecke |
|---|---|---|---|---|---|---|
| Privates Gerät mit Zeigerpult | 1510 × 852 | 241 | 16,7 / 16,8 ms | 16,8 ms | 0 / 0 | 98 / 2.692 |
| Gruppe mit Zeigerpult | 1510 × 852 | 241 | 16,7 / 16,8 ms | 16,8 ms | 0 / 0 | 104 / 2.820 |
| Tatsächliche Enthüllung, breit | 1918 × 852 | 235 | 16,7 / 33,4 ms | 50,0 ms | 2 / 0 | 83 / 2.456 |
| Tatsächliche Enthüllung, schmal | 388 × 584 | 240 | 16,7 / 16,8 ms | 33,3 ms | 0 / 0 | 111 / 2.972 |

Das Pult beansprucht in den ersten beiden Proben tatsächlich einen Teil der Breite; die frühere volle Gerätefläche ist deshalb kein direkt identischer Vergleich. Bei den letzten beiden Proben werden die elf verbindlichen Tipps erst im Messfenster abgegeben. Die Trace-API meldet breit weiterhin einen 63,5 ms langen Animationsframe mit 49,6 ms Scriptdauer in `Response.json.then`, ohne erzwungene Layoutdauer. Es wurde kein >50-ms-Long-Task erfasst. Der größte rAF-Abstand ist exakt 50 ms und zählt bei der strikten `>50`-Grenze deshalb nicht als Überschreitung. Das ist ausdrücklich kein Nachweis eines vollständig flüssigen Übergangs. Snapshot-/Ergebnisaufbau und lange Framephasen bleiben zu untersuchen. Die schmale Probe auf derselben Desktop-GPU beweist keine Smartphone-FPS. Kalte Downloads, Eingabelatenz, reale Referenzgeräte und Prozessspeicher sind damit nicht abgenommen.

## Verbleibender Umfang

Dies ist keine vollständige Spectrum-Abnahme. Hinweisgeber-Arbeitsplatz, Architektur, Figurenaktionen, lange räumliche Hinweisbanner, echte Softwaretastaturen, Hörabnahme, Referenzgeräte, kalte Ladephasen, längere Live-Gruppenpartien und die vollständige Olympiade bleiben offen. Die bereits dokumentierten langen Enthüllungsframes sind durch das Eingabepult nicht als behoben nachgewiesen. Frühere Hardware- und Ressourcenberichte in [SPECTRUM-MACHINE.md](SPECTRUM-MACHINE.md) beziehen sich auf ihre jeweiligen Szenarien. Die Arbeit ist lokal und unveröffentlicht. Das Gesamtziel umfasst unverändert alle 21 Disziplinen.


## Nachfolgende Diagnose der Audio-Erstinitialisierung

Die spätere CPU-Diagnose, der Stummschutz und die Vorbereitung an der ersten echten Nutzeraktion stehen mit den neuen Rohberichten in [AUDIO-STARTUP-PERFORMANCE.md](AUDIO-STARTUP-PERFORMANCE.md). Der dort nachgewiesene Anteil der früheren Snapshot-Spitze lag im kalten Audioaufbau. Die alten Berichte bleiben erhalten. Die neuen Nachweise ersetzen weder alle historischen Zustände noch die vollständige Performanceabnahme; eine getrennte breite Spectrum-Layout-/ResizeObserver-Spitze sowie Kaltstart- und Geräteprüfungen bleiben offen.


Weitere Canvas-/Layoutkorrektur: [SPECTRUM-CANVAS-SIZING.md](SPECTRUM-CANVAS-SIZING.md). Das Verschwinden des Pults verkleinert die normale Bühne nicht mehr. Finale Spar-/Hoch-/Fallbackfälle, Ergebnisnavigation und vier DPR-/Zeigerpixelprüfungen bestehen. Ein erzwungener Vollbild-Ausreißer und die im Hochformat noch wenig ausgenutzte Bildfläche bleiben offen. Keine vollständige Spectrum- oder Gesamtabnahme.


Die mobile Spectrum-Leselinse nutzt nun eine zur Maschinenbreite passende Höhe und einen tieferen Hochformat-Kamerafokus. Dadurch bleiben Hinweis, Skala und nahe Figuren zusammen sichtbar. Finale sechs DPR-/Eingabefälle, zwei Zwölfspieler-Ergebnisabläufe und breite/schmale warme Hardwareproben sind in [SPECTRUM-CANVAS-SIZING.md](SPECTRUM-CANVAS-SIZING.md#nachfolgender-ausbau-der-mobilen-leselinse) dokumentiert. Der Vollbild-Stressfall, tatsächliche Mobilgeräte und die Gesamtanforderungen bleiben offen.
