# Würfelkoloss: sichtbarer Runenwurf und gemeinsame Ladung

Die spätere nähere Hochformatkamera, wählbare Gesamtübersicht und aktive Salvenmessung sind in [COLOSSUS-PORTRAIT-CAMERA.md](COLOSSUS-PORTRAIT-CAMERA.md) dokumentiert. Die vier bewegten Runenabläufe wurden auf diesem Kamerastand erneut vollständig bestanden.

Die fünf eigenen Augenwürfel am persönlichen Runenplatz werden jetzt tatsächlich geworfen. Bewegliche Würfel heben ab, drehen sich und kommen auf dem Stein zur Ruhe. Gehaltene Würfel behalten ihre Position, ihre bestätigte Oberseite und die goldene Kennzeichnung. Der letzte Frame zeigt die serverseitig bestätigten Augen. „RUNENWURF …“ kennzeichnet die Bewegung auf dem bestehenden Schild.

## Verbindlicher Zeitbezug und Privatheit

Eine erfolgreiche Koloss-Wurfaktion setzt `rollStartedAt` auf dieselbe Serverzeit wie das zugehörige Wurfereignis. Ein neuer Angriff setzt diesen Wert zurück. Nur die eigene Hand übergibt Augen, Halteauswahl und diesen Zeitbezug an den eigenen Würfelplatz. Fremde Hände werden nicht als räumliche Würfel vorausgeladen oder aus dem öffentlichen Bereitschaftsstatus erraten.

Der Wurf dauert 740 Millisekunden und folgt der Serverzeit. Der lokale Renderer-Zähler beeinflusst seine Pose nicht. Ein spät beitretender Spieler sieht einen alten Wurf bereits ausgerollt. Alte gespeicherte Räume ohne Zeitstempel zeigen weiterhin ihre bestätigte Ruhepose. Reduzierte Bewegung überspringt die Dreh-/Sprungbewegung. Die vorhandenen Regeln, höchstens drei Würfe, atomare Halteauswahl, Schwächen, Schaden und Wertungen bleiben erhalten.

## Ladung am Angriffspunkt

Jeder öffentliche Runenplatz besitzt einen flachen Ring und einen kleinen Ladungskristall. Während der Entscheidung zeigt die Ladung ausschließlich den veröffentlichten Bereitschaftsstatus. Sie behauptet zu diesem Zeitpunkt keinen Schaden und zeigt keine fremden Augen. Auch ein abgegebener Verzicht kann bereit sein; erst das gemeinsame Ergebnis entscheidet, ob tatsächlich Energie zum Angriff vorhanden ist.

In der Auflösung wird die Ladung passend zur bestehenden Projektilfolge abgebaut: erster Start bei 3,45 Sekunden, die weiteren Starts über 2,7 Sekunden verteilt. Nur veröffentlichter positiver Schaden lädt dabei einen Angriff. Die bestehende Flugzeit von 750 Millisekunden und die Trefferzeitpunkte bleiben erhalten.

Kristall und Projektil beginnen über der grünen Angriffs-Rune. Ein erster tatsächlicher Nahbild-Check zeigte den zuvor mittig angeordneten Kristall vor dem Gesicht der Figur; er wurde zur Angriffsaktion versetzt. `colossusRuneOrigin` definiert für Darstellung und Projektil denselben Ursprung. Die drei Kampfphasen verwenden abgestimmte Gold-, Türkis- und Violetttöne. Reduzierte Bewegung verzichtet auf Puls und Rotation und schaltet die Ladung am gemeinsamen Startzeitpunkt um.

## Rendering und Ressourcen

Alle öffentlichen Ringe und Kristalle verwenden zwei InstancedMeshes, zwei kleine Geometrien und ein gemeinsames unbeleuchtetes Material. Damit entstehen zwei zusätzliche Zeichenaufrufe für zwei bis zwölf Teilnehmer. Instanzfarben sind vor der Shader-Vorbereitung angelegt. Es werden keine neuen Lichter oder Schattenpässe ergänzt.

Die vorhandenen Augenatlanten und sechs kleinen Würfelgeometrien bleiben gemeinsam verwendet. Es entstehen keine Geometrien oder Texturen pro Wurf. Instanzpuffer und Effektmaterial werden beim Abbau freigegeben; die beiden Effektgeometrien gehören zum bestehenden Szenenbesitzer. Der instanzbezogene Dispose-Nachweis ist keine vollständige Prozessspeicher-Abnahme.

Die zentralen importierten Bossmodelle und übrigen tatsächlich integrierten Kulissen bleiben erhalten. Die neuen Ringe, Kristalle und Wurfbewegungen sind passende eigene Effekt-/Spielgeometrie; ein weiterer Modelldownload ist dafür nicht nötig.

## Prüfung

Fünf neue Tests prüfen den tatsächlichen privaten Serverzeitpunkt einschließlich Ereignis und Angriffreset, gehaltene Werte, frische/alte/fehlende Zeitstempel, reduzierte Bewegung, übereinstimmende Posen trotz unterschiedlicher Renderer-Zähler, korrekte obere Atlasflächen, öffentliches Laden/Entladen, alle Gruppengrößen und die Freigabe beider Instanzpuffer. Fünf bestehende Boss-Ortstests und 32 Boss-Regel-/Wertungs-/Frametakt-Prüfungen bestehen. TypeScript und Produktionsbuild bestehen; die vorhandene Clientchunk-Warnung bleibt sichtbar.

Die erste zusätzliche Browserprüfung konnte die Wurfphase nicht erfassen: Die betreffenden Diagnoseattribute wurden nur einmal pro Sekunde veröffentlicht. Die Probe zeigte den ersten Wert nach rund einer Sekunde bereits korrekt ausgerollt. Die kleinen Würfel-/Ladungsattribute werden jetzt im vorhandenen 100-Millisekunden-HUD-Takt ausgegeben; die eigentliche Animation und ihre Dauer wurden dafür nicht verlängert. Der Prüfablauf wartet außerdem auf den veröffentlichten Aktionsflächenbestand, bevor er daraus einen 3D-Klick berechnet.

Vor der abschließenden Kristallkorrektur bestehen alle sechs bisherigen persönlichen Boss-Ortsabläufe für Koloss, Kraken und Drache bei 1440/390 Pixeln mit zwölf Teilnehmern und aktiver Bewegung. Bericht: `outputs/qa/boss-venues-focus-animated.json`. Dieser gezielte Rückgriff prüft die durchgereichten Bossdaten und vorhandenen Eingaben; er ersetzt keine vollständige Boss-Abnahme.

Die finalen vier Abläufe mit aktiver Bewegung bestehen für 2/12 Teilnehmer bei 1440/390 Pixeln. Sie verwenden jeweils den letzten Teilnehmer der Sitzordnung und prüfen tatsächlichen Wurf-/Halte-/Angriffsklick beziehungsweise Touch, festliegenden gehaltenen Würfel, alten Wurf nach Reload, Privatheit beim fremden Neuwurf, öffentliche Bereitschaft, schadenslosen Verzicht und gemeinsame Entladung. Bericht: `outputs/qa/colossus-runes-animated.json`.

Ein weiterer Zwölfspielerfall bei 390 Pixeln mit reduzierter Bewegung besteht mit denselben Aktionen und Zustandsprüfungen. Bericht: `outputs/qa/colossus-runes-reduced.json`. Beide Berichte enthalten keine erfassten Browserfehler. Die tatsächlichen finalen geladenen Nahbilder wurden breit und schmal kontrolliert; der Kristall steht frei über der Angriffsaktion.

Die beim Abschluss erfassten Zeichenaufrufe der bewegten Zwei-/Zwölfspielerfälle liegen bei 101/74 beziehungsweise 146/122 für breit/schmal; reduziert sind es im schmalen Zwölfspielerfall 142. Dies sind einzelne Auflösungszustände mit unterschiedlicher Kamera/Frustum und aktiver Effektfolge, keine Obergrenze für alle Kampfphasen und keine Geräte-FPS.

Zwei zusätzliche kurze warme Hardwarefenster verwenden hohe native Bossdarstellung mit zwölf Teilnehmern, elf tatsächlich abgegebenen Ladungen und fünf ausgerollten eigenen Würfeln. Beide zeigen die Übersicht, nicht die Nahansicht. Auf der tatsächlichen NVIDIA GeForce RTX 4080 SUPER über D3D11 ergeben sich:

| Fenster / Renderpuffer | rAF-Proben | rAF-p95 | Größter Abstand | Gemeldete Spiel-FPS | Renderfaktor | Zeichenaufrufe |
|---|---:|---:|---:|---:|---:|---:|
| 1920×1080 | 241 | 16,8 ms | 16,8 ms | 60 | 1 | 113 |
| 390×844 | 241 | 16,8 ms | 16,8 ms | 60 | 1 | 113 |

Bericht: `outputs/qa/colossus-runes-hardware.json`. Die Probe prüft den warmen geladenen Bereitschaftszustand mit laufendem Ring-/Kristallpuls. Sie enthält keine Messung des frischen Wurfs, der Salvenspitzen, des kalten Shader-/Assetladens oder der Eingabelatenz. Auch das schmale Fenster läuft auf derselben starken Desktop-GPU und belegt keine physische Mobilgeräte- oder vollständige Performanceabnahme. Die initialen Vor-Positions-Berichte bleiben separat erhalten und werden nicht als Nachweise der finalen Kristallposition ausgegeben.

## Grenzen

Die Funktionsabläufe verwenden tatsächliche Spiel-Engine-Fixtures und native Chromium-Maus-/Touchaktionen. Sie sind keine vollständige Live-Mehrbrowser-Bossbegegnung. Weitere Tempel-/Gruppen-/Phasen-/Klanggestaltung, tatsächliche Mobilgeräte, mittlere Referenzhardware, Hör-/Langzeitprüfung, der bekannte lokale WebSocket-Abschlussfehler und die vollständige Abnahme aller 21 Disziplinen bleiben offen. Es wurde keine neue Fassung veröffentlicht.
