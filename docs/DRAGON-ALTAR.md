# Münzdrache: persönlicher Preis- und Risikoaltar

Der Preisaltar verbindet jetzt das tatsächliche Produktbild, die private Preiseingabe und drei bedienbare Schatztruhen. Die Truhen stehen für **Sicher**, **Mutig** und **Riskant**. Die gewählte Truhe öffnet ihren tatsächlich modellierten Deckel; andere Truhen schließen. Versiegeln bestätigt den Tipp sofort. Die bisherige Übernahme des letzten gültigen Entwurfs bei Zeitablauf bleibt erhalten und wird jetzt ausdrücklich erklärt. Auswahl, Höchstpunktzahl und Erklärung bleiben zusätzlich über ein lesbares Bedienfeld erreichbar.

## Tatsächlich importiertes Modell

Die Truhe stammt aus dem bereits heruntergeladenen [Kenney Pirate Kit 2.1](https://kenney.nl/assets/pirate-kit). Die mitgelieferte CC0-Lizenz, das unveränderte Original `chest.glb`, die Palette und Quellenmetadaten liegen unter `assets/source-models/pirate/`. Die Metadaten enthalten Original-/Paletten-/Archivprüfsummen, Autor, Quelle, Paketversion, Lizenz und Download.

`scripts/prepare-treasure-chest.mjs` prüft Quelle und Palette gegen ihre registrierten Prüfsummen. Es erhält beide Originalmeshes, die Scharnierhierarchie, sämtliche Animationen, Normalen, UVs und den vollständigen Binärteil. Nur Palettenpfad und Generatorangabe werden angepasst. Die erzeugte `props/treasure-chest.glb` benötigt **25.172 Byte** und besitzt **232 Dreiecke**; die lokal gehostete Palette benötigt 10.061 Byte. SHA-256: `ec9653a337b6a0ddd910075d90d66fecb7dd2f282d92ef43ae4e19b5cb2e6059`. Manifest, öffentliche Quellen-JSON und Lizenzdatei gehören zum Modell. Die Vorbereitung ist in den bestehenden Assetablauf eingebunden.

Der Szenenbesitzer lädt die Truhe einmal. Die drei Instanzen teilen Geometrien, Materialien, Palette und unveränderte Animationsclips; jede Instanz besitzt eigene Knoten und einen eigenen Mixer. Der Mixer bindet den originalen Knoten `lid`. Änderungen einer Auswahl bewegen keine andere Truhe. Beim Szenenabbau werden Mixer gestoppt und Bindungen entfernt, bevor der gemeinsame Modellbesitzer seine Ressourcen freigibt.

Deckel werden nur während einer tatsächlichen Zustandsänderung neu abgetastet. Erreichte Posen werden auf exakt geschlossen beziehungsweise offen gesetzt; ruhende Deckel lösen keine laufenden Mixer-Neustarts aus. Die formatierte private Preisanzeige wird ebenfalls nur bei einer Wertänderung erneuert.

## Bedienung und Lesbarkeit

Das echte Produktbild am Altar öffnet und fokussiert die kompakte Preiseingabe. Der zusätzliche Ansichtswechsel **Zum Preisaltar** bleibt verfügbar. In der Welt bleiben Produkt, Risikowahl, eigener Tipp und Versiegelung räumlich zusammen. Das Eingabefeld und die Tastaturauswahl ergänzen die tatsächlichen Modellflächen. Die persönliche Ansicht berücksichtigt die Bildschirmhöhe; auf schmalen Ansichten steht der Produktname als lesbare Ergänzung unter der Statusleiste. **Spielpult öffnen** zeigt weiterhin das vollständige bisherige Produkt-/Regelbedienfeld.

Die drei Risikostufen nutzen dieselben Angaben in Welt und Bedienfeld. Höchstwerte werden ausdrücklich als Punkte gekennzeichnet und gegen die tatsächliche Serverwertung geprüft. Die Risikowahl nutzt den bestehenden Münzklang. Eine Auswahl allein versiegelt keinen Tipp. Der räumliche Siegelknopf und der Formularabschluss führen denselben validierten Sendeweg aus. Ungültige Beträge sperren beide Wege. Touch ergänzt kleine Bedienflächen in der persönlichen Ansicht um den vorhandenen 44-Pixel-Treffbereich. Bei reduzierter Bewegung wird der gewählte Deckelzustand unmittelbar gesetzt.

## Private Entwürfe und verbindliche Ergebnisse

Der lokale Entwurf ist nach Raum, Teilnehmer, Spielphase und Runde eingegrenzt. Gültige Beträge werden als genaue Centwerte in den vorhandenen privaten Serverentwurf übernommen. Unvollständige Texte wie `123,` bleiben im eigenen Tab erhalten. Ein anderer Teilnehmer oder Zuschauer erhält weder diesen Entwurf noch die Risikowahl. Nach Neuladen kann ein gültiger Entwurf auch ohne Tabcache aus dem eigenen Serverzustand wiederhergestellt werden.

Für einen unterbrochenen Wechsel von gültiger zu ungültiger Eingabe übernimmt ausschließlich der neue Altaraufruf die Information über einen bereits vorhandenen privaten Serverentwurf in `useDeadlineInput`. Dadurch kann eine wiederhergestellte unvollständige Eingabe den älteren gültigen Entwurf mit derselben bisherigen Verzögerung aufheben. Schnelle Korrekturen bleiben zusammengefasst; der Phasenwechsel hebt alte Timer auf. Alle bisherigen Aufrufe behalten den bisherigen Standardwert.

Nach der bestätigten Abgabe hat der eigene Serverwert Vorrang vor einer eventuell abweichenden lokalen Vorschau. Die Truhen schließen, das Siegel wird inaktiv und der eigene Tipp erscheint als versiegelt. Eine abgelaufene Runde ohne gültigen Tipp wird ausdrücklich als **Kein Tipp abgegeben** gekennzeichnet. Der Referenzpreis bleibt in der Darstellung bis zur vorgesehenen Enthüllung verborgen. Die nächste Runde löscht den alten Eingabezustand und lädt das tatsächliche neue Produktbild.

## Prüfungen und offene Abnahme

Vier Node-Prüfungen bestehen für Quellen-/Lizenz-/Manifestbindung, unveränderte Originalgeometrie und Animationen, genaue Centwerte, private Phasenzuordnung, tatsächliche Höchstpunktzahlen und getrennte Animation bei gemeinsam besessenen Ressourcen. Die vier bestehenden Modell-/Batchingtests und fünf Boss-Ortstests bestehen ebenfalls. TypeScript und der Produktionsbuild bestehen. Die bestehende Chunkgrößenwarnung bleibt erhalten.

`outputs/qa/deadline-initial-draft.json` prüft den tatsächlichen React-Hook in Chromium: Ein ungültiger wiederaufgenommener Entwurf hebt den vorhandenen Serverentwurf auf, der Standardaufruf bleibt unverändert, eine schnelle gültige Korrektur erzeugt keinen überholten Löschvorgang, ein gültiger Entwurf bleibt erhalten und ein Phasenwechsel verwirft den alten Timer.

Alle fünf Browserabläufe in `outputs/qa/dragon-altar.json` bestehen: 1440 × 1000 mit zwei und zwölf Spielern, 320 × 700 mit zwei Spielern sowie 390 × 844 mit zwölf Spielern, zusätzlich mit reduzierter Bewegung. Tatsächliche Maus-/CDP-Touchaktionen wählen die modellierten Truhen und bestätigen am räumlichen Siegel. Die breiten Ansichten prüfen außerdem Tab und Pfeiltaste an der Risikoauswahl; der Zweierfall bestätigt per Enter. Pro Fall entsteht genau eine bestätigte Schätzung. Private Serverentwürfe ohne Tabcache sowie unvollständige Tabentwürfe mit einem älteren gültigen Serverentwurf werden wiederhergestellt beziehungsweise bereinigt. Fremde Teilnehmer-/Zuschaueransichten, verzögerte Referenzpreisfreigabe und Produkt-/Eingabereset der nächsten Runde werden geprüft. Der breite Zweierfall prüft zusätzlich die Anzeige **Kein Tipp abgegeben** nach Ablauf der folgenden leeren Runde.

Die endgültigen Renderbilder `dragon-altar-selected-320-2.png` und `dragon-altar-selected-390-12.png` wurden visuell kontrolliert. Produktbild, Truhen und kompakte Eingabe sind vorhanden; Produktnamen bleiben auf zwei Zeilen begrenzt. Die kleinen räumlichen Beschriftungen werden durch die lesbare Bildschirmbedienung ergänzt. Dies ersetzt keine Prüfung einer nativen Bildschirmtastatur.

`scripts/test-dragon-deadlines.mjs` besteht mit 22 Prüfungen des tatsächlichen Serverablaufs: darunter die Übernahme eines gültigen privaten Preis-/Risikoentwurfs bei Zeitablauf und das Ausbleiben eines erfundenen Tipps nach dem Löschen des Entwurfs. Eine leere Drachenrunde bleibt serverseitig nicht abgegeben; die abgeschlossene Anzeige unterscheidet dies von einem versiegelten Tipp.

`outputs/qa/dragon-altar-hardware.json` enthält zwei fünfsekündige, aufgewärmte D3D11-Messungen auf einer RTX 4080 SUPER mit zwölf Fixture-Spielern, tatsächlich wechselnder Risikowahl und bewegten Originaldeckeln: 1920 × 1080 und 390 × 844, je 301 Bildintervalle, 95. Perzentil 16,7 ms, Maximum 16,8 ms, kein Intervall über 33 ms, angezeigte 60 FPS bei Auflösungsskala 1,00. Die Draw-Call-Momentaufnahmen betragen 99 beziehungsweise 75 und sind keine garantierten Höchstwerte. Beide Berichte enthalten keine Browserfehler. Die schmale Messung nutzt dieselbe Desktop-GPU und belegt keine Mobilgeräte-Leistung.

Die Prüfungen verwenden koordinierte Engine-Fixtures. Echte Mehrbrowser-Kämpfe, native Bildschirmtastaturen, physische Mobilgeräte, Hörabnahme, längere Sitzungen und Prozessspeichergrenzen sind damit nicht abgenommen. Weitere Hort-, Figuren-, Münzsalven-, Phasen- und Klanggestaltung sowie die vollständige Abnahme aller 21 Disziplinen bleiben offen. Es wurde keine neue Version veröffentlicht.
