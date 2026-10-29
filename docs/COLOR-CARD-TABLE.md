# Farbwechsel: Aktionen in der Baumrunde

Der nachfolgende Ausbau der Baumhaushütte, Brücke, Beleuchtung und sichtbaren Modellcredits ist in [TREEHOUSE-CLUBHOUSE.md](TREEHOUSE-CLUBHOUSE.md) dokumentiert. Die dortigen erneuten Nachweise beziehen sich auf die aktuelle Raumgestaltung.

## Eigene Tischgestaltung

Die Baumrunde verbindet den bestehenden Baumhausort mit einer eigenen mechanischen Ablage, einem tatsächlichen Ziehstapel und einem gerichteten Zugweg. Die im Projekt gesicherten Kenney-Naturmodelle und Möbel bleiben lokal eingebunden. Niedrige Hocker lassen die ursprünglichen Spielerfiguren sichtbar. Ein freier Bogen vor dem Tisch verhindert, dass die unmittelbar benachbarten Figuren die persönliche Hand verdecken. Die Sitzanordnung wird weiterhin für die eigene Perspektive gedreht.

Die Karten besitzen gerundete Körper, bedruckte Vorderseiten und ein eigenes vierfarbiges Rückseitenmuster. Jede der vier Farben hat zusätzlich ein Symbol: Raute, Kreis, Dreieck und Quadrat. Diese Symbole stehen auch auf den ergänzenden Bildschirmkarten. Die Karten zeigen Zahlen, Aussetzen, Richtungswechsel, +2 und die beiden Joker. Dafür wird ein lokaler Canvas-Atlas mit 55 Motiven erzeugt; ein externer Bilddownload ist nicht nötig.

`printed-card-batch.ts` kapselt die gemeinsam verwendete Rendertechnik für Club 21 und Farbwechsel: instanzierte Körper, eine gemeinsame Geometrie für beide bedruckten Seiten, gecachte Matrizen/Atlasfelder und eigene Ressourcenfreigabe. Die jeweilige Disziplin behält ihre eigenen Druckmotive, Kartenpositionen und Regeln. Zwei Zeichenaufrufe stellen den eigentlichen Kartenbestand dar. Die ausschließlich für Interaktion vorgesehenen Kartenproxies auf Ebene 31 werden nicht zusätzlich angezeigt.

## Spielhandlungen

Passende eigene Karten besitzen eine sichtbare helle Kontur und sind am Tisch direkt bedienbar. Unpassende Karten, fremde Hände und Aktionen außerhalb des eigenen Zuges sind keine gültigen räumlichen Eingabeziele. Der Ziehstapel löst denselben verbindlichen Ziehbefehl wie die zugängliche Oberfläche aus.

In der eingebetteten Tischansicht stehen bis zu acht eigene Karten gleichzeitig. Größere Hände werden über die beiden seitlichen Tasten oder die entsprechenden Bildschirmbuttons durchgeblättert. Der ursprüngliche Handindex bleibt erhalten, sodass stets die tatsächlich gewählte Karte gespielt wird. Die folgende große Handansicht ergänzt drei gut anvisierbare Karten und einen Seitensprung; ihre Bedienung wird über ein Portal in die Bühne versetzt. Die gesamte eigene Hand bleibt zusätzlich im normalen Spielpult zugänglich. Ein Rundenwechsel und schrumpfende Hände begrenzen den gewählten Ausschnitt wieder korrekt. Einzelheiten: `COLOR-HAND-VIEW.md`.

Eine Jokerkarte öffnet die vorhandene Farbwahl mit Fokusführung und Tastaturbedienung. Die Wahl selbst spielt keine Karte. Erst das ausdrückliche Bestätigen übermittelt den Spielbefehl. Die vorherige automatische Abgabe einer nur ausgewählten Jokerfarbe am Zeitlimit wurde entfernt, damit sie diese Bestätigung nicht umgeht. Nicht bestätigte Joker folgen somit weiterhin der normalen verbindlichen Zeitlimitregel des Servers.

Die eigentlichen Animationen verwenden ausschließlich veröffentlichte Spielzüge und deren Zeitstempel:

- Eine ausgespielte Karte fliegt vom betreffenden Spieler zur erhöhten Ablage.
- Ziehen und die Konsequenzen von +2/+4 werden durch Rückseiten vom gemeinsamen Stapel zum tatsächlichen Empfänger dargestellt.
- Richtungswechsel drehen die tatsächlichen Wegpfeile um. Auch bei zwei Spielern liegen sie auf unterschiedlichen Wegabschnitten; die bestehende Zwei-Spieler-Regel bleibt erhalten.
- Der aktive Teilnehmer erhält einen sichtbaren Platzmarker; Figuren und ergänzende Meldung verdeutlichen das Aussetzen beziehungsweise die Ziehstrafe.
- Die letzte Karte erzeugt einen kurzen gemeinsamen Hinweis. Ein bestätigter Gewinner bekommt eine eigene Meldung und Figurenreaktion.

Gegnerische Hände zeigen ausschließlich ihre öffentliche Anzahl und höchstens drei dekorative Rückseiten. Die Animation einer gezogenen Karte liest weder deren Farbe noch deren Wert. Die private eigene Hand und die öffentliche Ablage bleiben getrennt. Zuschauer erhalten keine erfundene eigene Hand oder eigenen Ziehbefehl.

## Gemeinsame Zeit und Klang

Kartenwege werden direkt aus dem veröffentlichten Zeitstempel berechnet. Ein Neuladen während einer Ziehstrafe setzt dieselben Positionen fort. Reduzierte Bewegung überspringt die Bewegungen, ohne Karteninformationen früher freizugeben. Die ergänzende Aktionsanzeige verwendet ebenfalls das jüngste Zeitfenster und beginnt nicht erneut eine Warteschlange älterer Spielzüge. Das Zugprotokoll bleibt lesbar.

Farbwechsel hat ein eigenes dezentes Umgebungsprofil aus Blätterluft und Holzraum, mit einem Hallanteil von 0,018. Kartengeräusch, Richtungswechsel, Aussetzen, Ziehstrafe und letzte Karte besitzen unterschiedliche kurze Rückmeldungen am Tisch. Musik-, Effekt- und Emoteregler bleiben getrennt.

Die hörbare Rückmeldung wird beim Empfang eines neuen bestätigten Spielzuges ausgelöst. Sie hängt nicht vom sichtbaren Renderloop ab. Das behebt einen im Browser gefundenen Fehler: Beim Bedienen des unterhalb der Bühne liegenden Pults pausiert die unsichtbare 3D-Szene; dadurch blieb eine ausschließlich dort ausgelöste Rückmeldung aus. Die Bühne spielt diese Kartenklänge nicht nochmals ab. Historische erste Raumantworten erzeugen weiterhin keine erneuten Spielzugsounds. Ein Panner verwendet die zuletzt tatsächlich gerenderte Kamera und den Tisch als Quelle.

## Prüfung und Grenzen

`test-color-card-table.mjs` prüft inzwischen sechs Bereiche: große private Hände und spielbare Karten; verborgene Ziehkarten und fortsetzbare Positionen; letzte Karte/Gewinner/Folgerunde; tatsächliche Pfeilgeometrie und Richtungsumkehr für 2/8/12 Plätze; Handkamera/Seitenzugänglichkeit und wiederhergestellte Figuren; beobachtende Tischrunde ohne Spielbefehle. Die sechs Club-21-Prüfungen und alle 17 Adventure-Prüfungen bleiben nach der gemeinsamen Kartentechnik erfolgreich. TypeScript und Produktionsbuild bestehen.

`check-color-card-table.mjs` verwendet einen kontrollierten gültigen 108-Kartenbestand. Maus beziehungsweise echtes Touch löst Blättern, Ziehen, normale Karten, Richtungswechsel, Aussetzen, +2 und beide Joker aus. Auswahl und Bestätigung der Jokerfarbe werden getrennt geprüft. Zwei koordinierte Ansichten kontrollieren außerdem Rückseiten, Wiederbeitritt während einer Ziehstrafe, letzte Karte, Gewinner und Folgerundenreset. Die Zuganfänge und das Endspiel werden gezielt eingerichtet; dies ist keine vollständige durchgespielte Netzwerkpartie. Berichte und tatsächlich gerenderte Bilder liegen unter `outputs/qa/color-table*`.

`check-spatial-scenes.mjs` umfasst nun acht native Audiofälle: Würfelwerk, Budget-Bande, Typeracer und Farbwechsel auf jeweils 1440/390 Pixeln. Alle acht Fälle bestehen einschließlich echter erster Eingabe, passender Quelle, Kamerahörer, eines Audiokontexts und Freigabe der Panner sowie beider Umgebungsquellen. Die neuen Aktionsklänge werden zusätzlich in `check-sound-feel.mjs` als echte Offline-Audiosignale geprüft.

Alle sechs Tischfälle für 2/8/12 Teilnehmer auf 1440/390 Pixeln bestehen. Bericht: `outputs/qa/color-table.json`. Die tatsächlich angesehenen Desktop-/Mobilbilder zeigen die bewusst freigehaltene eigene Hand, die Ziehstrafe und den Gewinner. Die niedrige Übersicht mit zehn eigenen Karten im kontrollierten Browser-Startaufbau verwendet 68/86/98 Zeichenaufrufe für 2/8/12 Teilnehmer. Die folgende gerundete Kontur wurde in beiden Zwölf-Spieler-Fällen erneut geprüft: 12496 Dreiecke, 32 Texturen und 36 Geometrien bei weiterhin 98 Zeichenaufrufen. Bericht: `outputs/qa/color-table-focused.json`.

Der anschließende Lauf über 18 Wechsel zwischen Baumrunde, Casino und Kaufhaus besteht mit zwölf geladenen Figuren, einem Canvas, stabilen Geometrie-/Texturzählern pro Ort und ohne WebGL-Fehler. Bericht: `outputs/qa/scene-lifecycle-color-cards-18.json`. Die zufällige Starthand dieses Ressourcenlaufs hat sieben Karten und damit keine Blättertasten: 92 Zeichenaufrufe, 30 Texturen und 34 Geometrien in der Baumrunde. Das erklärt den Unterschied zum gezielt größeren Handaufbau. Beide Casino-Browserfälle mit zwölf Teilnehmern bleiben nach der gemeinsamen Kartentechnik ebenfalls erfolgreich bei 78 Zeichenaufrufen. Die vorhandene Foto-/Karten-/Jokerprüfung sowie die Sound-/Dealer-/Emoteprüfung einschließlich aller vier neuen Aktionsklänge bestehen.

Die zusätzliche Hand-/Tischansicht für schmale Touch-Bildschirme ist in `COLOR-HAND-VIEW.md` beschrieben. Offen bleiben größere Extremhände, sämtliche Zeitlimit-/Unterbrechungsvarianten, die vollständige räumliche Ergebnisrangfolge, Hör-/Screenreader-Abnahme und echte Geräte-/Latenz-/Prozessspeichermessungen. Native Touch-Ereignisse in Chromium und SwiftShader beweisen keine physische Geräte-FPS. Stabile Rendererzähler beweisen keine vollständige Speichergrenze. Die vollständige Disziplinabnahme, die übrigen Spiele, Reise und Gesamtveröffentlichung bleiben Teil des unveränderten Ziels. Diese Arbeit ist lokal und unveröffentlicht.
