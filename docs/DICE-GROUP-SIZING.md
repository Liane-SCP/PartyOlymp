# Würfelwerk: Tischgröße und Kamera folgen der Crew

Der Salon verwendet für kleine Gruppen einen kleineren tatsächlichen Tisch und engere Sitzabstände. Zwei Figuren sitzen sich an einem kompakten Tisch gegenüber; drei und vier Teilnehmer bilden eine entsprechend dimensionierte Runde. Ab acht Teilnehmern bleibt die bisherige große Tischform erhalten. Alle Plätze gehören weiterhin zu derselben Szene: persönlicher Würfelplatz und Tischübersicht zeigen dieselben Becher, Würfel und Wertungsflächen.

`diceTableLayout` definiert die Sitzellipse für zwei bis zwölf Teilnehmer. Ihre Halbachsen wachsen von 3/3,4 auf 7,5/5,4. Das tatsächlich geladene Kenney-Tischmodell wird im selben Verhältnis angepasst. Stühle, ursprüngliche Spielerfiguren, persönliche Filzflächen, Halteablagen, Becher, Aktionsflächen und räumliche Klanganker folgen diesen Positionen. Die Arbeitsflächen kleiner Gruppen behalten ihre bisherige Größe. Für elf und zwölf Teilnehmer bleibt die vorhandene begrenzte Verkleinerung bestehen.

Die Nahkamera folgt der tatsächlichen eigenen Würfelfläche statt einer festen Weltkoordinate. Die Übersicht berechnet ihren Abstand anhand von Tisch-/Figurenraum, Seitenverhältnis und Blickwinkel. Dadurch verschwindet bei kleinen Runden der bisher für zwölf Personen reservierte leere Tischbereich. Der Salonraum bleibt erhalten und bildet die Umgebung der gemeinsamen Handlung.

Es gibt keine neue Netzwerknachricht, Zufallsentscheidung oder Regeländerung. Öffentliche Würfelwerte und gemeinsame Wurfzeitpunkte stammen unverändert vom Server. Zuschauer erhalten keine eigenen Spielaktionen. Tabellen-/Modellgröße wird beim Szenenaufbau gewählt; Kameradistanzen reagieren auf die aktuelle Darstellung. Es entstehen keine zusätzlichen Modelle, Materialien oder Renderer.

## Prüfung

Die neun Würfeltests bestehen. Die neuen Tests prüfen alle Gruppengrößen mit tatsächlichen Sitz-/Ausrüstungspositionen sowie die Projektion von Übersicht und eigenem Platz bei vier Seitenverhältnissen und drei Blickrichtungen. Zusätzlich bleiben 36.960 tatsächlich transformierte Würfeleckpunkte in sieben Wurfphasen, elf Gruppengrößen und zwölf Kameraeinstellungen innerhalb des persönlichen Ausschnitts. Die bestehenden Wurf-, Halte-, Wertungs-, Zuschauer- und Ressourcenprüfungen bestehen weiterhin. Die 17 allgemeinen Szenentests, sechs Referenzmoment-Tests und drei Batching-Tests bestehen. TypeScript und der Produktionsbuild bestehen.

Die Browserprüfungen verwenden die auf tatsächliche Platzpositionen angepassten Skripte `check-dice-crew-table.mjs` und `check-dice-place.mjs`:

- Zehn sparsame Tischabläufe mit 2/3/4/8/12 Teilnehmern bei 1440 und 390 Pixeln bestehen mit jeweils zwei koordinierten Browseransichten: tatsächlicher Becher-/Würfelklick beziehungsweise Touch, Halten, gemeinsame Wurfphase, Wiederbeitritt während/nach dem Wurf, eigene Sitzzuordnung, erhaltener Canvas beim Kamerawechsel und Zugreset. Der schmale Zweierfall enthält einen Zuschauer. Bericht: `outputs/qa/dice-group-sizing-low.json`.
- Vier hohe Tischabläufe mit 2/4 Teilnehmern bei beiden Breiten bestehen. Bericht: `outputs/qa/dice-group-sizing-high.json`.
- Sechs vollständige Wertungsblattabläufe mit 2/3/4 Teilnehmern bei beiden Breiten bestehen: physische Platzkarte, Null-Abbruch, Escape/Fokusrückkehr, positiver Eintrag, Wiederbeitritt, nächster Zug und Reset. Der breite Zweierfall prüft zusätzlich tatsächlichen WebGL-Kontextverlust mit Fallback. Bericht: `outputs/qa/dice-group-sizing-place.json`.

| Teilnehmer | Tischrunde Sparsam | Eigener Platz Sparsam, breit / schmal |
|---|---:|---:|
| 2 | 37 | 32 / 28 |
| 3 | 38 | 32 / 29 |
| 4 | 39 | 33 / 28 |
| 8 | 43 | 32 / 28 |
| 12 | 47 | 32 / 28 |

Die hohe Tischrunde liegt mit zwei Figuren bei 59 und mit vier Figuren bei 61 Zeichenaufrufen; ihre Nahansichten liegen bei 54/50. Alle gemessenen Zustände bleiben innerhalb der bestehenden Zeichenaufrufbudgets. Die Berichte enthalten keine Browserfehler. Tatsächliche Renderbilder kleiner Gruppen wurden auf breiten und schmalen Ansichten visuell kontrolliert, darunter die hohe schmale Viererrunde.

Die Browserfälle verwenden die tatsächliche Spiel-Engine mit koordinierten Fixtures, kontrollierter Zeit und Chromium SwiftShader. Sie beweisen die erfassten Zustände und Bedienfolgen, keine Live-Netzwerkpartie oder Geräte-FPS. Es wurde kein neuer Hardware-/Langzeit-/Hörnachweis erhoben.

## Offene Gesamtanforderungen

Diese Anpassung erfüllt einen weiteren Teil der gemeinsamen Tischgestaltung. Der nachfolgende vollständige lokale Zweier-Netzwerkablauf über 13 Züge steht in [DICE-LIVE-SESSION.md](DICE-LIVE-SESSION.md); er ersetzt keine Live-Abnahme aller Gruppengrößen. Weitere Raum-/Gruppen-/Endauswertungsgestaltung, Hörabnahme, tatsächliche Mobilgeräte, mittlere Referenzhardware und Langzeitsitzungen bleiben offen. Die vollständige individuelle Ausarbeitung und Abnahme aller 21 Disziplinen sowie Veröffentlichung sind weiterhin Teil des unveränderten Gesamtziels. Frühere warme RTX-Messungen werden nicht als neue Performanceprüfung dieser Kameras ausgegeben.
