# Grafikstufen der Oberwelt

Stand: 18.10.2026. Weiterer lokaler Ausbau innerhalb des unveränderten Gesamtziels für alle 21 Disziplinen. Keine vollständige Abenteuerabnahme oder Veröffentlichung.

## Verhalten

Die Weltkarte war unabhängig von der Spielgrafik fest auf 30 Renderupdates pro Sekunde begrenzt. Sie nutzt jetzt die vorhandenen Qualitätsprofile und denselben gespeicherten Wunsch wie die Spielorte:

| Stufe | Ziel-Renderfrequenz | maximale Pixeldichte |
| --- | --- | --- |
| Hoch | 60 Hz | 1,5 |
| Mittel | 30 Hz | 1,15 |
| Sparsam | 30 Hz | 1,0 |

Automatisch beginnt bei feinem Zeiger mit Hoch, bei grobem Zeiger mit Mittel. Der vorhandene Qualitätscontroller senkt die Stufe bei anhaltend hohen Frame-/CPU-Zeiten. Die manuelle Wahl bleibt verbindlich. Die Karte übernimmt diese Auflösungs-/Frequenzregeln; sie erhält dadurch keine zusätzlichen dynamischen Schatten.

`use-graphics-quality.ts` hält die lokale Einstellung zwischen gleichzeitig geöffnetem Spielort und Weltkarte in beiden Richtungen synchron. Andere Tabs erhalten Änderungen über das Storage-Ereignis. Bei gesperrtem Local Storage bleibt die Bedienung innerhalb des offenen Dokuments wirksam. Ein Qualitätswechsel baut weder Welt noch Kamera oder Figuren neu auf.

Die vorhandene öffentliche Serverzeit steuert Reisen unverändert. Eine niedrigere Renderfrequenz verändert weder Reisedauer noch Ankunftszustand. Außerhalb des sichtbaren Bereichs beziehungsweise bei verstecktem Dokument pausiert das Rendering; beim Sichtbarwerden wird der aktuelle Zustand abgetastet. Pausen und Größenwechsel setzen Messfenster zurück, Qualitätswechsel zusätzlich die angezeigten Messwerte. Es gibt keine React-Aktualisierung pro Messframe.

Die 44 Pixel hohe Grafikauswahl ist in die Regionsplakette integriert. Im schmalen Layout stehen Plakette und Emotes untereinander. Unter 381 Pixeln entfällt der zusätzliche Regionsname in dieser Plakette zugunsten der lesbaren Beschriftung „Grafik“; Ortsname und Gebietsnav bleiben vorhanden.

## Hardware-Nachweis

`scripts/check-journey-quality.mjs` mit `QA_HARDWARE=1` erzwingt D3D11 und lehnt Software-Renderer ab. Der damalige Bericht `outputs/qa/journey-quality-hardware-before-plaza.json` enthält drei Viewportgrößen, jeweils zwölf tatsächlich geladene Figuren und eine Auswahl mit 21 Inseln. Gemessen wurde die normale Nahansicht der ersten Kolossinsel, jeweils etwa 3,5 Sekunden pro manueller Stufe. Es ist keine Messung sämtlicher Inselansichten oder Spitzenlasten.

Tatsächlicher Renderer: NVIDIA GeForce RTX 4080 SUPER über ANGLE/D3D11; emulierte Geräte-Pixeldichte 2. Alle Fenster laufen auf diesem Desktop.

| Viewportbreite | Hoch, beobachtete FPS | Sparsam, beobachtete FPS | Frame-p95 Hoch / Sparsam | Hauptthread-CPU-p95 Hoch / Sparsam |
| --- | --- | --- | --- | --- |
| 1440 | 60,13 | 29,87 | 16,8 / 33,4 ms | 0,6 / 0,6 ms |
| 390 | 60,17 | 29,84 | 16,8 / 33,4 ms | 0,6 / 0,7 ms |
| 320 | 60,05 | 29,91 | 16,7 / 33,4 ms | 0,7 / 0,7 ms |

Die CPU-Spalte misst die synchrone Frame-Arbeit bis zur Messstelle inklusive Darstellung und Beschriftung, keine GPU-Zeit und keine Eingabe-zu-Bild-Latenz. Schmale Fenster sind kein Nachweis für ein tatsächliches Mobilgerät. Diese starke Desktop-GPU ersetzt die noch offenen mittleren Referenzgeräte ausdrücklich nicht.

Alle drei Fälle prüfen zusätzlich reduzierte Puffergröße, dieselbe Canvas nach Qualitätswechsel, null Renderupdates außerhalb des Sichtbereichs, Wiederaufnahme und gespeicherte Wahl nach Reload. Die beiden schmalen Fälle prüfen außerdem den tatsächlich unverdeckten Auswahlmittelpunkt im Vollbild. Ein vierter Ablauf mit gleichzeitig geöffnetem Würfelspiel und Atlas prüft die gemeinsame Einstellung in beiden Richtungen. Browserfehler: keine.

## Weitere Prüfung und Grenzen

Die 17 allgemeinen Szenentests und 39 Reisetests bestehen. Zwei ältere Szenentests wurden an den tatsächlichen öffentlichen Ergebnisvertrag angepasst und zugleich um Geheimhaltungsprüfungen ergänzt: Spectrum darf einen alten privaten Zielwert nicht als öffentliche Enthüllung verwenden; das Farbenlabor darf fehlende öffentliche Ergebnisse nicht durch einen privaten Entwurf ersetzen.

Der finale funktionale Lauf `journey-quality.json` besteht ebenfalls mit 1440/390/320 Pixeln sowie der gemeinsamen Würfelspiel-/Kartenwahl. Er prüft zusätzlich ein tatsächliches Storage-Ereignis aus einem zweiten Tab desselben Browserkontexts. Alle sieben Fahrzeug-/Brücken-/Wiedereintrittsfälle in `journey-transit.json` und die vier Navigationsfälle in `journey-navigation.json` bestehen nach den Änderungen; ihre Browserfehlerlisten sind leer. SwiftShader-Werte dienen ausschließlich der Funktionsprüfung, nicht als Hardware-Abnahme.

Die vier Natur-/Bewegungsfälle bestehen erneut auf Desktop, im Touchfenster, mit zwölf Figuren und bei reduzierter Bewegung. `check-journey-audio-live.mjs` bestätigt auch mit der neuen Rendersteuerung einen vorab durch echte Eingabe aktivierten AudioContext sowie genau eine Abfahrts- und Ankunftssequenz ohne Wiederholung. Das prüft Audio-Ausführung und Planung, keine Hörqualität.

Visuell kontrolliert wurden die endgültigen Bilder `journey-quality-1440.png`, `journey-quality-320.png` und `journey-quality-390-fullscreen.png`. Der erste schmale Entwurf verdeckte die Grafikauswahl durch die Emote-Leiste. Diese Anordnung wurde korrigiert; ein weiterer Entwurf mit schlecht umgebrochenem Regionsnamen unter 381 Pixeln wurde durch die klare Grafikbeschriftung ersetzt.

Offen bleiben unter anderem echte mittlere Desktop-/Mobilgeräte, längere Messfenster, Kaltstart, maximale Reise-/Gesamtübersichtslast, Latenz und Prozessspeicher. Die visuelle Prüfung zeigt außerdem weiterhin verdeckte Crewfiguren hinter hohen Atlasgebäuden; bessere Aufenthaltsflächen und Sichtführung gehören zum weiteren Weltfeinschliff.

Der unabhängig isoliert reproduzierte WebSocket-Abschlussfehler ist in [REALTIME-RUNTIME.md](REALTIME-RUNTIME.md) beschrieben. Alle individuellen Spielorte, Klang-/Hörprüfungen und die vollständige Mehrbrowser-Olympiade behalten ihre offenen Abnahmepunkte in [ADVENTURE-STATUS.md](ADVENTURE-STATUS.md).


Der folgende Ausbau der sichtbaren Crew, flachen Inselwege, angepassten Kamera und Namensbedienung ist in [JOURNEY-PLAZAS.md](JOURNEY-PLAZAS.md) beschrieben. Dort stehen die neueren Hardwarewerte und ihre Prüfgrenzen. Die ältere Tabelle oben bleibt dem gesicherten Bericht vor dem Weltausbau zugeordnet.
