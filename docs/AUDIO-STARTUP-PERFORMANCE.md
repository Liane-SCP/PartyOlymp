# Audio vorbereiten, bevor eine Spielauflösung beginnt

Die zuvor bei Farbgedächtnis, Spectrum und Wiki-Sprint wiederholt beobachtete Scriptspitze im Aufrufkontext `Response.json.then` wurde gezielt untersucht. Eine nachgewiesene Ursache ist die verspätete Erstinitialisierung des Audiosystems. Die Benennung des Aufrufkontexts war kein Beweis für langsames JSON-Parsen oder Netzwerkverkehr.

## Nachgewiesene Ursache

`Sound.play()` konnte nach einer Kameraaktion noch während der gültigen Browseraktivierung einen Audiokontext erstmals anlegen. Die Stummschaltung wurde erst in den einzelnen Ton-/Rauschgeneratoren geprüft. Dadurch entstanden auch bei gespeichertem „Alles stumm“ ein Audiokontext, Hall, Musik- und Umgebungsressourcen beim Empfang des ersten passenden Auflösungsereignisses.

Die statistischen V8-CPU-Profile aus dem tatsächlich aufgebauten Farbgedächtnis-Übergang weisen diese Zeit `Sound.init()` zu:

| Diagnose | Inklusive gesampelte Initialisierungszeit innerhalb des Messfensters |
| --- | --- |
| Stumm, vorher | 50,266 ms |
| Stumm, nach Schutz vor Initialisierung | Kein gesampelter Aufruf |
| Gespeicherter eingeschalteter Ton, vor Vorbereitung an der Kameraaktion | 54,794 ms |
| Gespeicherter eingeschalteter Ton, nach Vorbereitung | Kein gesampelter Aufruf |

Rohprofile: `snapshot-color-before-profile-color-1920.cpuprofile`, `snapshot-color-after-profile-color-1920.cpuprofile`, `snapshot-audible-before-profile-color-1920.cpuprofile`, `snapshot-audible-after-profile-color-1920.cpuprofile`. Die Auswertung steht in `snapshot-audio-profile-summary.json`. CPU-Sampling verändert das Laufzeitverhalten; diese vier Fälle sind Ursachendiagnosen und keine FPS-Abnahme. Die Profile enthalten beispielsweise auch lange Frames ohne Scriptzuordnung unmittelbar nach dem Start des Profilers. Sie dürfen nicht mit den folgenden normalen Messungen gleichgesetzt werden.

## Umsetzung

`Sound.init()` und `Sound.play()` beenden sich bei aktivierter Stummschaltung vor der Initialisierung. Die Einstellungsbedienung übernimmt den neuen Zustand vor dem Freischalten. „Ton einschalten“ funktioniert deshalb weiterhin im selben echten Nutzerereignis. Mehrere rasche Einstellungsänderungen bauen auf dem jeweils aktuellen Zustand auf.

Bei gespeichertem eingeschaltetem Ton bereitet die erste echte Klick- oder Tastaturaktion auf der Plattform Audio vor, auch wenn sie nur eine Kamera oder Ansicht bedient. Die Vorbereitung wird als Microtask nach den Eingabe-/Aktionshandlern des Zielobjekts ausgeführt. Programmgesteuerte Ereignisse lösen sie nicht aus. Ohne Nutzeraktion wird weiterhin kein Kontext angelegt. Ein bereits laufender Kontext wird wiederverwendet; ein suspendierter kann an der tatsächlichen Nutzeraktion fortgesetzt werden.

Dies entfernt die kalte Erstinitialisierung aus den nachgestellten Auflösungen. Es macht die native Konstruktion selbst nicht kostenlos: Die breiten anschließenden Hardwarefälle beobachten 36,8–44,5 ms direkt im ersten Audiokontext-Konstruktor, jetzt vor dem Messfenster an der Kameraaktion. Diese einmalige Kaltstart-/Eingabelatenz bleibt von der warmen Bildzeitabnahme getrennt. Musik, Effekte und Spielregeln wurden nicht vereinfacht oder entfernt.

## Funktionsnachweise

`audio-activation.json` enthält vier native Chromium-Fälle:

- 1440/390 Pixel Breite mit gespeichertem stummem Zustand: eine tatsächliche Regleraktion und eine tatsächliche spätere Auflösung erzeugen keinen Kontext. Einschalten per Enter funktioniert sofort. Musik- und Bewegungseinstellungen bleiben über mehrere Änderungen erhalten. „Alles stumm“ senkt den Masterbus; spätere Auflösungen erzeugen keine neuen Stimmen. Wieder einschalten verwendet denselben Kontext.
- 1440/390 Pixel Breite mit gespeichertem eingeschaltetem Ton: Laden und programmatisches Fokussieren erzeugen keinen Kontext. Die echte Kameraaktion per Maus beziehungsweise Tastatur bereitet genau einen laufenden Kontext vor. Sie sendet keine zusätzliche Spielaktion. Die spätere Auflösung verwendet ihn wieder.

`snapshot-spatial-scenes.json` ergänzt sechs bestandene native räumliche Fälle für Farbgedächtnis, Wiki-Sprint und Spectrum auf Desktop und Touch: echte Quellen, erster Nutzereingriff, tatsächliche Kamera als Hörer, ein Kontext, stumme historische Ereignisse und Ressourcenfreigabe beim Verbergen. Die bestehenden Offline-/Web-Audio-Prüfungen für räumliches Stereo, Effektregler, Stummschalten, Stimmenbegrenzung und Freigabe bestehen ebenfalls. Die Musikprüfung rendert weiterhin 78 musikalische Abschnitte einschließlich Moduswechsel und Boss-Abgrenzung erfolgreich. TypeScript und Produktionsbuild bestehen.

## Normale warme Hardwaremessungen

Alle folgenden Fälle verwenden zwölf konfigurierte Teilnehmer, hohe Grafik, dieselbe lokale RTX 4080 SUPER über D3D11 und echte bestätigte Übergänge während eines viersekündigen Messfensters. Die Browserjobs liefen nacheinander. CPU-Sampling war ausgeschaltet. Die kleinen Fenster laufen ebenfalls auf der Desktop-GPU.

Die stummen Berichte `snapshot-color-after.json`, `snapshot-spectrum-after.json` und `snapshot-wiki-after.json` liegen nach dem Stummschutz und vor der ergänzten Vorbereitung für eingeschalteten Ton. Farbgedächtnis und Wiki-Sprint erreichen in beiden Breiten maximal 16,8 ms rAF-Abstand und keine erfassten langen Aufgaben/Animationsframes. Spectrum erreicht breit maximal 33,4 ms; die Trace-API erfasst einen anderen 52,9-ms-Animationsframe mit React-, Render- und ResizeObserver-Arbeit, einschließlich 21,8 ms im ResizeObserver. Dieser Befund wird nicht als erledigt betrachtet.

Die anschließenden hörbaren Fälle prüfen zusätzlich verbindlich, dass bereits vor dem Messfenster genau ein Kontext besteht und die Auflösung keinen weiteren erzeugt:

| Rohbericht | Breite | Renderpuffer | Zeichenaufrufe | rAF-p95 / p99 / Maximum |
| --- | --- | --- | --- | --- |
| `snapshot-color-audible-final.json` | 1920 | 1918 × 846 | 20 | 16,7 / 16,8 / 33,3 ms |
| derselbe Bericht | 390 | 388 × 544 | 16 | 16,7 / 16,8 / 16,8 ms |
| `snapshot-spectrum-audible-final.json` | 1920 | 1918 × 852 | 83 | 16,7 / 16,8 / 33,4 ms |
| derselbe Bericht | 390 | 388 × 584 | 111 | 16,7 / 16,8 / 16,8 ms |
| `snapshot-wiki-audible-final.json` | 1920 | 1918 × 802 | 111 | 16,8 / 16,8 / 16,8 ms |
| derselbe Bericht | 390 | 388 × 556 | 111 | 16,7 / 16,8 / 16,8 ms |

Keiner dieser sechs rAF-Läufe enthält einen Abstand über 33,5 ms. Trotzdem meldet die breite hörbare Spectrum-Probe einen 56,5-ms-Animationsframe: unter anderem React-Arbeit, 9,3 ms im Rendercallback und 25,8 ms im ResizeObserver. Die fehlende Audio-Erstinitialisierung ist damit belegt; die gesamte Bildzeitspitze dieser Disziplin ist weiterhin nicht abgeschlossen. Die übrigen fünf hörbaren Fälle enthalten in diesen Fenstern keine erfassten langen Aufgaben/Animationsframes.

## Weiterhin offen

Layout-/Canvasgrößenwechsel, Shader-/Texturarbeit, kaltes Laden, einmalige Audiokonstruktion, echte langsamere Referenzgeräte, reale Mobilbrowser, Hörabnahme und längere Prozessspeichersitzungen benötigen weitere Arbeit. Diese kurzen lokalen Proben ersetzen keine echte Netzwerk-Olympiade und keine vollständige Performance-, Disziplin- oder Gesamtabnahme. Sämtliche früheren Berichte bleiben als historische Messungen erhalten. Das Gesamtziel für alle 21 Spiele und die Oberwelt bleibt aktiv.


Die getrennte Spectrum-Größendiagnose folgt in [SPECTRUM-CANVAS-SIZING.md](SPECTRUM-CANVAS-SIZING.md). Vorreservierter breiter Puffer und durchgehendes Blocklayout beseitigen die gemessene Canvas-Neuzuweisung beim Aufdecken auf der normalen breiten Seite. Deren finale Messfenster sind ohne lange Animationsframes. Ein erzwungener Vollbild-Stresstest bleibt mit 62,3 ms offen; die Audio-Kaltstartkosten und die sonstigen hier genannten Prüfgrenzen gelten weiter.
