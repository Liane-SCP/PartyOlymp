# Kopf-Auktion: Bietersaal und Bühnenbuch

Der nachfolgende Ausbau von Raum, Sitzanzeigen und Auktionator mit einem zusätzlich heruntergeladenen Hammermodell steht in [AUCTION-HALL-ART.md](AUCTION-HALL-ART.md). Die nachstehenden Zahlen beschreiben die frühere Bühnenbuch-Ausbaustufe; aktuelle Messungen und Quellen stehen im Folgebericht.

Der bestehende Auktionssaal erhält einen durchgehenden Ablauf von Gebot, Zuschlag und Auftritt bis zur Bewertung und Auflösung. Der Höchstbietende bleibt nun auch in der tatsächlichen Spielphase `judge` auf der Bühne. Zuvor wurde irrtümlich `review` geprüft, wodurch die Figur während der Bewertung zum Sitz zurückkehrte.

## Gemeinsame Darstellung

`performStartedAt` wird beim serverseitigen Zuschlag veröffentlicht. Figurenposition und Vorhänge folgen dieser gemeinsamen Uhr. Die Vorhänge fahren seitlich und werden gerafft. Ein Wiederbeitritt setzt am aktuellen Zeitpunkt fort. Die Bewertung setzt den Auftritt nicht zurück. Die nächste Runde schließt die Vorhänge und stellt die Sitzordnung wieder her. Reduzierte Bewegung übernimmt den bestätigten Zustand unmittelbar.

Bieternummern, letzte eigene Gebote, Höchstgebot, Aussteigen und versiegelte Bewertungen erscheinen an den zugehörigen Plätzen. Unvollständige Sitzreihen werden mittig angeordnet. Paddelköpfe und Griffe werden jeweils instanziert; die importierten Kenney-Möbel werden statisch zusammengefasst. Modelle, Quellen und Lizenzen stammen aus dem vorhandenen Assetbestand. Diese Änderung lädt keine zusätzlichen externen Modelle herunter.

Das Bühnenbuch zeigt sechs nummerierte Begriffe pro Seite. Bis zu 50 Begriffe bleiben über die Seitenwahl erreichbar. „Neueste“ folgt eingehenden Begriffen. Auch die Auflösung besitzt eine Seitenwahl. Lange Wörter werden auf der räumlichen Zeile gekürzt; die vollständigen Begriffe stehen weiterhin im Spielpult.

„Bühnenbuch ansehen“ öffnet eine eigens eingepasste Nahansicht mit größerer Schrift. Die Zuschauerfiguren und Paddel verdecken in dieser Leseperspektive keine Zeilen. „Auktionssaal ansehen“ stellt die gemeinsame Saalansicht wieder her. Positionen und Spielzustand bleiben erhalten; derselbe Canvas und Renderer werden weiterbenutzt. Eine neue Runde beendet die Buchansicht automatisch.

## Bewertung und Rollen

Während der Bewertung zeigen Saal und Buch ausschließlich den öffentlichen Abgabestatus. Einzelne Ja-/Nein-Stimmen und Enthaltungen werden vor der Auswertung nicht angezeigt. Danach erscheinen die serverbestätigten Gültigkeiten und Stimmenzahlen. Gleichstand bleibt entsprechend den bestehenden Regeln ungültig. Punkte und Mehrheitsregeln wurden nicht verändert.

Zuschauer erhalten den öffentlichen Bieterverlauf, Begriffe und Seitenwahl. Sie können weder bieten noch eine Bewertung abgeben. Die serverseitige Teilnehmerprüfung bleibt verbindlich. Ihre räumliche Ansicht überträgt ebenfalls keine fremden privaten Stimmzettel.

## Klang und Ressourcen

Ein leiser Saalraum mit gedämpfter Luft ergänzt Holz-/Paddel-, Zuschlags- und Begriffsklänge. Jedes öffentliche Gebot adressiert den Audioanker des tatsächlichen Bieters. Der Absender wird dabei unabhängig von einem möglicherweise noch älteren gerenderten Höchstgebot ausgewählt. Hammer und Auftritt besitzen eigene räumliche Quellen.

Erfolgs- und Fehlschlagklänge werden beim neuen gemeinsamen Ergebnisereignis ausgelöst. Das bloße Einblenden einer bereits bestehenden Ergebnisansicht startet diese Klänge nicht erneut. Der zusätzliche allgemeine Bühnen-Abschlussklang entfällt hier zugunsten der passenden Auktionsauflösung.

Die neue optionale Ankerwahl in `Sound.play` erhält den bisherigen Standard für alle übrigen Klänge. Gemeinsame Touchmaterialien und Instancing-Ressourcen besitzen eine eindeutige Freigabe. Das Bühnenbuch verwendet wiederverwendete Canvastexturen; neue Wörter erzeugen keine neuen Texturen.

## Nachweise und Grenzen

- `scripts/test-auction-presentation.mjs`: vier Bereiche für eingepasste Bühnenkamera, tatsächliche Spiellogik/Mehrheiten/Geheimhaltung, alle 50 Begriffe und tatsächliche Figuren-/Vorhangobjekte einschließlich Bewertungsphase, Wiederbeitritt, Buchansicht und Rundenreset.
- `scripts/check-auction-theatre.mjs`: Maus-/Touchauswahl am eigenen Paddel, Überbieten, tatsächliche Begriffeingabe, Seitenwechsel, Buchkamera mit erhaltenem Canvas, Bewertung, gemeinsame Auflösung und Rundenreset. Berichte und Renderbilder stehen unter `outputs/qa/auction-theatre-*.json` und `outputs/qa/auction-*.png`.
- Die sechs Sparfälle (2/8/12 Teilnehmer × 1440/390 Pixel) bestanden mit jeweils zwei Browsersichten. Saalwerte: 54/77/93 Zeichenaufrufe und 1.422/3.654/5.142 Dreiecke. Im mobilen Zweierfall wurde zusätzlich eine Zuschaueransicht geprüft: öffentliche Begriffe und Blättern, keine Gebots-/Bewertungsbedienung, serverseitige Zurückweisung eines Gebots. Die Renderbilder der Saal-, Auftritts-, Buch- und Ergebnisansichten wurden visuell kontrolliert.
- Zwei zusätzliche hohe Grafikfälle mit zwölf Teilnehmern bei 1440 und 390 Pixeln bestanden mit jeweils 118 Zeichenaufrufen. Bericht: `outputs/qa/auction-theatre-high.json`. Das belegt das Grafikbudget der geprüften Zustände, keine tatsächlichen Geräte-FPS.
- `scripts/check-scene-lifecycle.mjs` mit `LIFECYCLE_GAMES=auction,code,budget`, `LIFECYCLE_STEPS=18` und `LIFECYCLE_AUCTION_BOOK=1`: sechs Besuche je Ort, zwölf geladene Figuren, ein Canvas, keine WebGL-Fehler und stabile Zähler. Auktionsbuch 28 Zeichenaufrufe, 50 Texturen, 64 Geometrien und 2.904 Dreiecke; Tresor 100/40/53 und Kaufhaus 86/32/43. Bericht: `outputs/qa/scene-lifecycle-auction-book-18.json`. Die niedrigen Buchwerte entstehen durch die gezielt ausgeblendeten Zuschauerfiguren und Paddel. Stabile Rendererzähler beweisen keine vollständige Prozessspeichergrenze.
- `scripts/check-spatial-scenes.mjs` mit `SPATIAL_GAMES=auction`: Desktop und Touch, erstmalige Audiofreigabe, tatsächlicher Bieter-/Hammeranker, Hörer an der Kamera, ein AudioContext und Freigabe von Klangquellen und beiden Umgebungsschleifen bei Unsichtbarkeit bestanden. Bericht: `outputs/qa/spatial-scenes-auction.json`.
- `scripts/check-spatial-audio.mjs`: räumliche Stereoverteilung, Effektregler/Stummschaltung, laufende Lautstärkeänderung, begrenzte Klanggruppen, Quellenfreigabe, ausstehende Nutzerinteraktion und weiterhin stilles Zeitgefühl bestanden.
- TypeScript, Produktionsbuild sowie die betroffenen Tresor-, Audioframe- und Batching-Prüfungen bestanden. Die vorhandene Warnung zu großen Clientchunks bleibt sichtbar.

Die Browsernachweise verwenden koordinierte Spiellogik-Fixtures und Chromium/SwiftShader. Sie ersetzen keine reale Geräte-FPS, Hörabnahme, native Smartphone-Tastatur, längere Prozessspeicherprüfung oder komplette Live-Mehrbrowser-Olympiade. Weitere Raum-/Auktionatorgestaltung, ausführlichere Gruppenreaktionen und Einspruchsführung sowie die vollständige Disziplin- und Gesamtabnahme bleiben offen.
