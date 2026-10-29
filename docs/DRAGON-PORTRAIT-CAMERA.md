# Münzdrache: nähere Hochformatkamera und wählbarer Hort

Die bisherige Hochformatübersicht hielt sämtliche zwölf Plätze gleichzeitig im Bild. Dadurch schrumpften die Gesichter, der Drache und die Münzen an den oberen Bildschirmrand, während viel ungenutzter Raum blieb. Die neue Standardansicht komponiert den eigenen Platz und den Drachen näher zwischen Statusleiste und Bedienung. **Ganzer Hort** schaltet bewusst auf die bisherige Gesamtübersicht; **Zur Action** kehrt zur näheren Ansicht zurück.

`lib/dragon-camera.ts` enthält die auf den Drachen abgestimmte Pose, die Höhenanpassung für kurze Displays und die Auswahl des öffentlichen Beitrags. Die Kamera richtet sich während der Salve nur nach tatsächlich abgegebenen, positiv bewerteten Ergebnissen. Ein durch die verbleibenden Phasen-Lebenspunkte begrenzter Treffer zählt weiter als bestätigter Beitrag; ein punktloser oder ausgebliebener Tipp lenkt die Kamera nicht. Nach der Salve wird wieder der eigene Platz gewählt. Die Kamera verändert weder Timing noch Punkte oder private Informationen.

Die persönliche Preisaltaransicht bleibt erhalten und hat Vorrang vor der näheren Gruppenansicht. Sie zeigt Produkt, Risikotruhen, private Preiseingabe und Siegel. Der Handlungshinweis verweist jetzt auf diesen ausdrücklich erreichbaren Preisaltar, weil das seitlich aufgestellte Produkt in der näheren Ansicht eines anderen Crewplatzes angeschnitten sein kann.

## Lesbarkeit und Bewegung

- Hochformatmodus nur bis 600 Pixel Breite bei mindestens 600 Pixel Höhe. Querformat erhält die bisherige breite Inszenierung.
- Die ursprünglichen Teilnehmerfiguren, Größenverhältnisse und Plätze bleiben erhalten. Die Kamera wird näher positioniert; die Gruppe wird nicht umgebaut.
- Übergänge zwischen Nahansicht, Gesamtübersicht und Preisaltar werden zeitbasiert geglättet. Die Salvenansicht folgt den öffentlichen Beiträgen mit gedämpfter Bewegung.
- Reduzierte Bewegung setzt gewählte Ansichten unmittelbar und verzichtet auf automatische Salvenverfolgung. Der eigene Platz bleibt Bezugspunkt.
- Die Ergebnisüberschrift steht in der näheren Weltansicht unter der Statusleiste bei 198 Pixeln. In der Gesamtübersicht sitzt sie unterhalb der kleinen Welt, statt Figuren zu überdecken.
- Drei gut erreichbare Ansichtsschaltflächen stehen während der Eingabe nebeneinander; während der Auflösung bleiben zwei. Der Preisaltar besitzt weiterhin sein eigenes kompaktes Eingabefeld.
- In der näheren Hochformatansicht werden die allgemeinen Effektstärken auf 35 %, das Trefferlicht auf 50 % und der zusätzliche Blitz auf 45 % begrenzt. Die Münzsalve und teilnehmerbezogenen Beitragsringe bleiben erkennbar.

## Prüfungen

Zwei neue Node-Prüfungen decken die Projektion von eigenem Platz und Drachenziel für 320 × 700, 390 × 844 und 430 × 932 bei zwei, acht und zwölf Teilnehmern sowie linken, mittleren und rechten Plätzen ab. Die zweite Prüfung bindet die Kameraverfolgung an bestätigte positive Beiträge und prüft die Rückkehr zum eigenen Platz. Die zwei bestehenden Kraken-Kameraprüfungen bestehen ebenfalls. TypeScript und Produktionsbuild bestehen; die bestehende Chunkgrößenwarnung bleibt bestehen.

Der abschließende vollständige Browserdurchgang besteht in `outputs/qa/dragon-camera.json` für zwei Teilnehmer bei 320 × 700, zwölf Teilnehmer bei 390 × 844 mit eigenem letzten Platz, zwölf Teilnehmer bei 430 × 932 mit eigenem ersten Platz sowie 390 × 844 mit reduzierter Bewegung. Tatsächliche Touchaktionen bedienen die Ansichtswechsel und bestätigen den privaten Preis-/Risikoentwurf. Die vier Eckpunkte des eigenen Gesichtsausschnitts sind im Bild und frei von DOM-Bedienflächen. Dieser Ausschnitt ist in der Nahansicht rund 31, 41 beziehungsweise 45 Pixel breit und jeweils mindestens 40 % größer als in der Gesamtübersicht. Die Gesamtübersicht enthält alle Spielerplätze. Ergebnisüberschrift und Wechsel ins Querformat/zurück werden ebenfalls geprüft. Keine Browserfehler.

Die Renderbilder bei 320 Pixeln und der Zwölfergruppe bei 390 Pixeln wurden visuell kontrolliert, einschließlich der endgültigen 390-Pixel-Ansicht mit angepasstem Handlungshinweis: Die Figuren sind deutlich größer, die Welt nutzt den freien Raum und die Treffer überstrahlen die Szene weniger.

`outputs/qa/dragon-camera-hardware.json` prüft die endgültige Quelle in zwei aufgewärmten fünfsekündigen Messungen mit zwölf Teilnehmern und zehn startenden Münzbeiträgen auf einer RTX 4080 SUPER über D3D11. Bei 1920 × 1080 läuft die breite Kamera, bei 390 × 844 die neue nähere Actionkamera. Je 301 Bildintervalle, 95. Perzentil 16,8 ms, Maximum 16,8 ms, kein Intervall über 33 ms; angezeigte 60 FPS bei Auflösungsskala 1,00. Die Salve benötigt höchstens zwei Effekt-Draw-Calls. Weder der punktlose noch der ausgebliebene Tipp erzeugt Münzen. Die schmale Ansicht belegt keine Leistung auf einem Telefon.

Der bestehende Altarablauf besteht zusätzlich bei 320 × 700; Bericht `outputs/qa/dragon-altar-case1.json`, Log `outputs/qa/dragon-camera-altar-regression.log`. Sein direkter Produktzugang führt in der neuen Hochformatkomposition zunächst über **Ganzer Hort**, weil das Produkt am anderen Rand der Welt stehen kann. Der ursprüngliche Test erwartete das Produkt auch in der bewusst näheren Ansicht eines anderen Crewplatzes vollständig im Bild und scheiterte dort an seiner Sichtbarkeitsprüfung. Der angepasste Ablauf behält den tatsächlichen 3D-Produkttap und sämtliche privaten Entwurfs-/Risiko-/Siegel-/Folgerundenprüfungen bei.

Die Abnahme verwendet echte Engine-Ergebnisse mit koordinierten HTTP-Fixtures, stummgeschalteten Ton und geschlossenem Live-WebSocket. Bildschirmgrößen werden auf Desktop gerendert. Physische Mobilgeräte, native Bildschirmtastaturen, Hörabnahme, Live-Mehrbrowserkämpfe, weitere Bossphasen und längere Sitzungen sind damit nicht abgenommen. Die übrige Hort-/Figuren-/Phasen-/Klanggestaltung und das vollständige Ziel aller 21 Disziplinen bleiben offen. Keine neue Veröffentlichung.
