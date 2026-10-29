# Zeitgefühl: Messstation und gemeinsame Sternentafel

Die nachfolgenden Raumzähler beziehen sich auf die frühere Architektur. Der anschließende Sternenpavillon mit tatsächlich importiertem Teleskop und erneuten Eingabe-/Bild-/Audio-/Ressourcenprüfungen ist in [OBSERVATORY-PAVILION.md](OBSERVATORY-PAVILION.md) dokumentiert. Die aktuelle Gruppenansicht benötigt zusätzliche, dort ausgewiesene Geometrie; die bisherigen kleineren Zähler sind keine Aussage über den neuen Raum.

Das Observatorium erhält eine eigene Messperspektive und eine gemeinsame räumliche Auflösung. Die bestehenden serverseitigen Start-/Stopp-, Toleranz- und Wertungsregeln bleiben erhalten.

## Messen

Auf schmalen Bildschirmen wird die Messstation vor dem ersten Start nah gezeigt. Auf Desktop lässt sie sich über „Meine Messstation“ öffnen. Der tatsächliche 3D-Knopf bleibt Start und Stopp; das vorhandene große Spielpult und die Tastaturbedienung bleiben verfügbar. Die Perspektive wird vor dem Start gewählt und während der laufenden Messung nicht durch den Perspektivknopf verändert. Der Blickpunkt springt beim Wechsel sofort an seinen festen Platz, damit kein nachlaufender Kameraübergang einen Takt vorgibt.

In allen Messvarianten stehen dekorative Figurenbewegungen still. Regelmäßige Hintergrundmusik wird während der eigenen Messung unterdrückt. Die vorgesehene Echo-Variante behält ihre unregelmäßigen Töne. Der Zahlennebel erscheint zusätzlich direkt über dem 3D-Knopf; die Zahlen kommen aus derselben lokalen Ablenkungsfolge wie im Spielpult. Die ruhige Variante hat weder solche Zahlen noch Ablenkungstöne.

Eine eigene Beschriftung erklärt die jeweilige Variante. Weder der Knopf noch seine Anzeigen liefern die verstrichene Zeit. Die bereits vorhandene globale Anzeige „Zeit verborgen“ bleibt erhalten. Die zusätzlichen generischen Netzwerk-Bestätigungsklänge für Start/Stopp entfallen; die unmittelbaren lokalen Start-/Stoppsignale bleiben.

## Gemeinsam auflösen

Eine Sternentafel zeigt bis zu vier Teilnehmer pro Seite. Sie verwendet dieselbe Enthüllungsfunktion wie die Ergebnisanzeige: erster Wert 1.200 ms nach `revealStartedAt`, danach alle 650 ms ein weiterer. Noch versiegelte Reihen enthalten keine Stoppwerte, Abweichungen oder Punkte. Auch das eigene Ergebnis wird auf der Tafel nicht vor seinem gemeinsamen Zeitpunkt angezeigt.

Die Reihen zeigen Name, tatsächlichen Stopp und signierte Abweichung in deutscher Schreibweise. Ein Stern markiert den Abstand zum Ziel. Die Skala bleibt fest bei ±1,5 Sekunden; größere Abweichungen werden am Rand mit einem Richtungspfeil und dem tatsächlichen Zahlenwert kenntlich gemacht. Ein fehlender Stopp bekommt eine eigene Beschriftung und keinen irreführenden Stern.

„Live“ folgt der aktuell enthüllten Seite. Vorwärts/rückwärts bleiben alle zwei bis zwölf Teilnehmer erreichbar. „Nahansicht“ zeigt die Tafel lesbar; „Zurück“ stellt den Sternengarten mit den Teilnehmerfiguren wieder her. Die Figuren reagieren erst nach der zugehörigen Enthüllung. Beide Ansichten verwenden denselben Canvas. Die nächste Runde setzt Tafel, Seite und Perspektive zurück.

In der Nahansicht überdecken Crewleiste und Grafikauswahl die Ergebnisnavigation nicht. Die normalen Anzeigen sind nach dem Verlassen der Nahansicht wieder erreichbar. Die vorhandenen Kenney-Stuhl-/Pflanzenmodelle werden weiterbenutzt und statisch zusammengefasst; es werden keine neuen externen Assets hinzugefügt.

## Klang und Besitz der Ressourcen

Neue Ergebnisklänge kommen räumlich von der Sternentafel. Eine rückwärts korrigierte Uhr darf bereits gehörte Enthüllungen nicht erneut auslösen. Ein Wiederbeitritt übernimmt den aktuellen Enthüllungsstand als bestehende Geschichte. Während der Messung gibt es keine räumlichen Umgebungs- oder Ergebnisquellen als Taktgeber.

Schienen und Sterne verwenden Instancing. Beschriftungen aktualisieren vorhandene Canvastexturen. Nicht benötigte Reihen werden ausgeblendet. Geometrien, Texturen, Instancing-Puffer und importierte Modelle werden beim Szenenwechsel durch ihre jeweiligen Besitzer freigegeben.

## Nachweise und offene Abnahme

- `scripts/test-timing-presentation.mjs`: sechs bestandene Bereiche für echte Spiellogik/Wertung/Privatsicht, die Enthüllungsgrenze, alle zwölf paginierten Ergebnisse, tatsächliche Sternobjekte und Szenenrücksetzung, eingepasste Ergebniskamera, den projizierten echten Start-/Stopp-Körper mit mindestens 44 Pixeln in beiden Achsen auf 296 × 420 und 366 × 420 CSS-Pixeln sowie ruhige Figuren in allen Messvarianten. Die Touchprüfung betrachtet projizierte Geometrie und ersetzt keine motorische Geräteabnahme.
- `scripts/check-timing-constellation.mjs`: sechs Sparfälle (2/8/12 Teilnehmer × 1440/390 Pixel) mit jeweils zwei Browsersichten. Tatsächliche 3D-Maus-/Touchauswahl für Start und Stopp, identische ruhige Canvas-Innenpixel über zwei Aufnahmen, Schutz eigener Stopps bis zur Auflösung, gemeinsam getaktete UI/Sterne, Wiederladen während der Enthüllung, Seiten-/Nahansichtswechsel mit erhaltenem Canvas und Folgerundenreset bestanden. Die weiteren Ergebnisse entstehen über echte Spielmodule mit kontrollierter Serverzeit; dies ist keine vollständige Live-Mehrbrowserpartie.
- In den niedrigen Anfangsansichten werden auf Desktop mit 2/8/12 Teilnehmern 31/43/51 Zeichenaufrufe gemessen; die mobile Messstation benötigt in diesen Fällen 27. Die Ergebnistafel-Nahansicht benötigt 32 bei zwei beziehungsweise 34 bei acht/zwölf Teilnehmern. Zwei zusätzliche hohe Grafikfälle mit zwölf Teilnehmern bestanden: 62 Zeichenaufrufe in der Desktop-Anfangsansicht, 38 in der mobilen Messstation und jeweils 46 in der Ergebnis-Nahansicht. Berichte: `outputs/qa/timing-constellation-low.json` und `outputs/qa/timing-constellation-high.json`. Diese Werte belegen die geprüften Grafikzustände, keine Geräte-FPS.
- `scripts/check-timing-modes.mjs`: sechs Fälle (ruhig/Echo/Zahlennebel × Desktop/Touch), zwölf Figuren, ein nativer AudioContext und ein Analyser am tatsächlichen Ausgang hinter dem Limiter. Nach dem Startsignal bleiben ruhige Runde und Zahlennebel unter der Prüfgrenze von RMS 0,00001. In den vorgesehenen stillen Fenstern der Echo-Folge wird ebenfalls kein regelmäßiges Musikbett gemessen; die vorgesehenen unregelmäßigen Töne erzeugen messbare Peaks. Der Zahlennebel im Spielpult und in der 3D-Anzeige stimmt überein. Rohmessungen stehen unter `outputs/qa/timing-mode-samples-*.json`; Gesamtbericht `outputs/qa/timing-modes.json`.
- `scripts/check-timing-reveal-audio.mjs`: Desktop und Touch mit zwölf Teilnehmern. Kein räumlicher Ergebnisklang vor der Enthüllungsgrenze, tatsächliche Quelle an der Sternentafel, keine Wiederholung nach rückwärts korrigierter Uhr, ein AudioContext, Quellenfreigabe bei Unsichtbarkeit und kein historischer Ergebnisklang nach erneutem Laden. Bericht: `outputs/qa/timing-reveal-audio.json`.
- `scripts/check-scene-lifecycle.mjs` mit `LIFECYCLE_GAMES=timing,code,budget`, `LIFECYCLE_STEPS=18` und `LIFECYCLE_TIMING_RESULTS=1`: jeweils sechs Besuche, zwölf geladene Figuren, ein Canvas und keine WebGL-Fehler. Der direkte Einstieg in die Ergebnis-Nahansicht bleibt bei 34 Zeichenaufrufen, 21 Texturen, 35 Geometrien und 3.954 Dreiecken; Tresor und Kaufhaus bleiben bei ihren bisherigen Zählern. Bericht: `outputs/qa/scene-lifecycle-timing-18.json`. Das ist eine begrenzte Szenenwechselprüfung, keine lange vollständige Partie oder Prozessspeichermessung.
- Die betroffenen Auktions- und Audioframe-Prüfungen sowie TypeScript und Produktionsbuild bestanden. Die vorhandene Warnung zu großen Clientchunks bleibt bestehen.

Renderbilder und Messberichte stehen unter `outputs/qa/timing-*.png` beziehungsweise `outputs/qa/timing-*.json`. Browserprüfungen verwenden Chromium/SwiftShader. Sie belegen keine realen Desktop-/Mobilgerät-FPS, keine Hörabnahme, keine vollständige Prozessspeichergrenze und keine vollständige Olympiade. Weitere Ausgestaltung des Observatoriums, längere reale Gruppenpartien, Geräte-/Eingabelatenz-/Hörprüfung, automatische Grafikwechsel und die vollständige Disziplin-/Gesamtabnahme bleiben offen.
