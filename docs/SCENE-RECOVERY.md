# Grafikverlust ohne Neustart der Partie

Normale Spielbühnen, die Weltkarte und die Siegerehrung bieten bei einem Grafikfehler „3D erneut laden“. Der vorhandene Boss-Neustart liegt jetzt frei vor der Szene statt unter der Reaktionsschaltfläche und hat eine mindestens 44 Pixel hohe Trefferfläche.

Der Neustart betrifft ausschließlich die Grafik. Die bestehenden Formular-Komponenten, lokalen Entwürfe, Raumdaten und Serverfristen bleiben bestehen. Verlorene normale Bühnen und Karten stoppen ihre Render-Schleife, entfernen Listener und Beobachter und geben Szene, Renderer und Canvas frei. Abgebrochene Vorbereitungen dürfen danach keine alte Szene wieder einblenden. Ein Klick baut aus dem aktuellen öffentlichen Spielzustand genau einen neuen Renderer auf. Die Karte behält ihre gewählte Übersicht beziehungsweise Region.

Pixelblitz zeigt währenddessen dasselbe schrittweise verpixelte Foto in einer 2D-Ansicht; ein aktiver Buzzer hält den Bildfortschritt weiterhin an. Das Antwortfeld bleibt am selben Ort und als derselbe DOM-Knoten erhalten. Nach erfolgreicher Wiederherstellung entfällt der 2D-Canvas vollständig: Es läuft keine verdeckte zweite Bilddarstellung neben der 3D-Bühne. Auch das Farbmischpult bleibt unabhängig vom Grafikstatus an seinem festen Platz.

Die Ausfallansicht von Farbgedächtnis und Pixelblitz wird nicht mehr auf die alte Höhe von 160 Pixeln zusammengedrückt. Desktop-Ansichten behalten auch beim Laden und im Fehlerzustand das volle 16:9-Fenster. Der Neustartknopf liegt vor den Spielpulten, damit beispielsweise die eigene Casinoansicht ihn nicht verdeckt.

Bei einer ausgefallenen Siegerehrung erscheinen alle Ergebnisse. Ein Grafikneustart führt diese abgeschlossene Präsentation fort und spielt die Rangfolge samt Jubel nicht erneut ab. Die ausdrücklich gewählte Wiederholung bleibt verfügbar.

## Prüfung

`node scripts/check-scene-recovery.mjs` verwendet die tatsächliche WebGL-Erweiterung `WEBGL_lose_context` und native Klicks auf die Wiederherstellung. Die Standardauswahl umfasst alle 21 Disziplinen, die Karte und die Siegerehrung, jeweils mit zwölf Teilnehmern bei 1280 × 720 und 1920 × 1080. Stadt Land Fluss wiederholt den Verlust pro Auflösung dreimal.

Geprüft werden ein freier, sichtbarer Neustartknopf, die vollständige Desktop-Bühne im Fehlerzustand, ein verlorener und entfernter alter WebGL-Kontext, genau ein neuer Canvas, unveränderte Phase, Runde und Punkte sowie kein Dokument-Scrollen. Eigene Eingaben in Stadt Land Fluss, Typeracer, Pixelblitz und Farbgedächtnis behalten Inhalt und DOM-Knoten. Zusätzlich geprüft: Pixelblitz-Kamerafokus, das 2D-Ersatzfoto, keine verdeckte 2D-Darstellung nach Rückkehr, Kartenübersicht und abgeschlossene Siegerehrung.

Bericht und Screenshots liegen unter `outputs/qa/scene-recovery/`. Die zusätzlichen bestehenden Szenen-, Kamera- und Siegerehrungstests umfassen 27 Prüfungen: `test-adventure.mjs`, `test-camera-direction.mjs` und `test-ceremony.mjs`.

Der Standardlauf besteht mit 46 Ansichten und insgesamt 50 Wiederherstellungen ohne Browserfehler. `node scripts/check-scene-preparation-recovery.mjs` ergänzt zwei Fälle bei beiden Auflösungen: Eine tatsächlich angeforderte GLB-Datei bleibt zunächst zurückgehalten, während der noch nicht eingeblendete WebGL-Kontext verloren geht. Danach darf der alte Ladevorgang seine Szene nicht verspätet einblenden. Entwurf und Eingabeknoten bleiben erhalten; auch ein anschließender Verlust im fertigen neuen Renderer lässt sich beheben. Bericht: `preparation-report.json` im selben Verzeichnis.

Grenzen: lokales Chromium mit Software-WebGL und kontrollierten Engine-Ansichten. Der Test beweist Grafikverlust und Wiederherstellung, keine vollständige Netzwerkpartie, Referenzgeräte-FPS oder langfristige Prozessspeicherwerte.

## Boss-Vorbereitung und Ladefehler

Die Boss-Arenen verwenden für Grafikverlust, fehlgeschlagene Modelle und fehlgeschlagene Shader dieselbe idempotente Freigabe wie beim Verlassen. Sie stoppt die Render-Schleife und entfernt die alte Arena sofort. Verspätet geladene Bossmodelle und HDR-Texturen werden freigegeben, statt im abgebrochenen Renderer weiterverarbeitet zu werden. Eine erneut ausgelöste Freigabe darf dieselben Ressourcen nicht noch einmal entsorgen. Ein optional fehlender Himmel verwendet weiterhin die bestehende direkte Beleuchtung.

`node scripts/check-boss-preparation-recovery.mjs` ergänzt die Prüfung aller drei Bosse bei 1280 × 720 und 1920 × 1080. Je Fall bleibt entweder das Boss-GLB oder die HDR-Datei ausstehend, während der tatsächliche Kontextverlust ausgelöst wird. Nach der Freigabe des Downloads dürfen weder Modellmetadaten noch die Zahl angelegter Shaderprogramme am alten Kontext weiterwachsen. Der native Neustart muss eine fertige Arena erzeugen; diese muss sich nach einem weiteren Grafikverlust ebenfalls wiederherstellen lassen. Bericht: `boss-preparation-report.json`.

Der zusätzliche Modus `BOSS_RECOVERY_HOLDS=model-error` beantwortet Modelldownloads zunächst mit HTTP 503 und gibt sie vor dem erneuten Ladeversuch frei. Der gleiche Test prüft dabei sofort entfernte alte Renderer, erfolgreiches erneutes Laden und unveränderte Spielphase, Runde und Punkte. Mit `BOSS_RECOVERY_REPORT=outputs/qa/scene-recovery/boss-model-error-report.json` bleibt dieser Bericht getrennt vom Abbruchtest.

Beide Bossläufe bestehen: zwölf Modell-/HDR-Abbruchfälle und sechs Modelldownload-Fehlerfälle, jeweils ohne ungefangene Browserfehler. Jede Ersatzarena wird anschließend noch einmal im fertigen Zustand unterbrochen und erneut geladen. Ein bereits abgebrochener Besitzer startet nach verspäteter Ankunft des HDR-Lademoduls auch keinen neuen Himmel-Download mehr.
