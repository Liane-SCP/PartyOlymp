# Räumlicher Klang der drei Referenzspiele

## Anbindung an die Welt

Die vorhandenen Handlungssounds können über einen szeneneigenen Effektbus und einen echten Web-Audio-Panner ausgegeben werden. Der Audio-Hörer übernimmt Position, Vorwärts- und Aufwärtsrichtung der tatsächlich gerenderten Kamera. Die Quelle wird am Ort des Ereignisses gesetzt; die Kamera darf danach weiterfahren. Equal-Power-Panning und eine zurückhaltende Entfernungsdämpfung geben dieselbe räumliche Zuordnung auf allen Grafikstufen wieder.

| Spiel | Tatsächliche Klangquellen |
| --- | --- |
| Würfelwerk | Der Becherklang entsteht am bewegten Becher; große Kombinationen werden dem Tischbereich der hervorgehobenen Figur zugeordnet. |
| Budget-Bande | Lokales Einpacken am privaten Korb; Scan- und einzelne Kassenreaktionen am Scanner. Die gemeinsame Schlussfanfare bleibt zentral. |
| Typeracer | Lokale Tipp-/Fehlerrückmeldung am eigenen Fahrzeug; Überholen bei der hervorgehobenen Figur; Zieleinlauf am tatsächlichen Zieltor. |

Die Ereignisse selbst bleiben im bisherigen Spielsystem. Der bestätigte Würfelwurf und die öffentliche Kassenfolge lösen weiterhin die bestehenden Sounds aus. Lokale Warenkorbauswahl und Tipprückmeldung bleiben lokale Eingaberückmeldungen. Der neue Audiocode liest weder geheime Preise noch geheime Restzeiten und führt keine Spielentscheidungen aus. Für Zeitgefühl gibt es keine räumlichen Anker; die Umgebungsfläche bleibt dort stumm.

## Unterschiedliche Umgebungsbetten

Die drei Referenzorte haben eigene prozedurale Umgebungsprofile statt desselben Rausch-/Brummgemischs. Der Salon kombiniert einen tiefen Raumton mit leiser Fensterluft. Das Kaufhaus kombiniert Lüftungsbänder und ein zurückhaltendes elektrisches Brummen. Die Küstenstrecke kombiniert Brandung und offeneres Luftrauschen. Kurze, überblendete Schleifen vermeiden einen harten Übergang an der Wiederholung. Es handelt sich um im Projekt erzeugte Klänge; neue externe Tonaufnahmen oder Downloads sind nicht erforderlich.

Der bestehende kurze Raumhall erhält je Ort einen anderen Anteil: Salon 0,065, Kaufhaus 0,035 und offene Rennstrecke 0,008. Die übrigen Orte verwenden vorerst ihr bisheriges Grundkonzept. Das ist keine vollständige individuelle Klangabnahme aller 21 Spiele. Insbesondere kontinuierliche Fahrzeugmotoren, weitere konkrete Umgebungsaktionen und individuelle räumliche Quellen für die übrigen Disziplinen/Bosse bleiben offen.

Musik bleibt am Musikregler, räumliche Ereignisse und Umgebung am Effektregler, Emotes am bisherigen Emoteregler. Kurze Ergebnisreaktionen bleiben Effekte. Musik-Ducking bleibt bestehen; die Umgebung folgt dem Ducking-Zustand über gecachte Gain-Ziele, ohne pro Frame neue Automationsereignisse zu erzeugen.

## Start, Mischung und Ressourcen

Der gewünschte Schauplatz und die letzte Kamera werden auch vor dem Entsperren des Audiokontexts gemerkt. Eine sichtbare Nutzerinteraktion kann den Kontext beim ersten lokalen Sound öffnen; ein bloßer Szenenaufbau startet ihn nicht. Die Initialisierung respektiert die verfügbare Browser-Information zur Nutzeraktivierung. Verborgene Seiten starten über `Sound.play` keine neuen Klänge. Bereits bestehende Hintergrundkontexte werden durch `init` nicht eigens fortgesetzt.

Ein räumliches Ereignis besitzt alle zugehörigen Ton-/Rauschquellen, deren Filter und Hüllkurven. Normales Ende gibt die ganze Gruppe frei. Ein Szenenwechsel beziehungsweise die Sichtbarkeitsbereinigung stoppt auch noch nicht gestartete Quellen und trennt die Gruppe. Bis zu acht räumliche Ereignisgruppen dürfen gleichzeitig existieren; der gemeinsame Kurzton-/Rauschgenerator begrenzt seine Stimmen auf 24. Musik, Emotes und Bosscontroller haben ihre eigenen bisherigen Systeme und sind nicht von dieser Zahl insgesamt umfasst.

Der Effektbus wendet den Effektregler auch auf bereits eingeplante räumliche Stimmen an. Die Lautstärke wird dabei einmal berücksichtigt. Mute und Effekt-Null fahren den Bus mit kurzem Gain-Übergang herunter; beim Abbau wird die Verbindung getrennt. Die Umgebungsquellen blenden beim Ausblenden kurz aus und trennen anschließend ebenfalls ihre Knoten. Wiederholtes Freigeben ist sicher. Neue Klanggruppen benötigen weder eigene Timer noch Downloads.

## Nachweise und Grenzen

Die spätere Ausarbeitung von Club 21 ergänzt einen vierten individuellen Klangort mit eigenem Raumprofil, Kartenschuh- und Bankquellen. Auch die erste Raumantwort übernimmt inzwischen ausschließlich die Ereignishistorie und spielt alte Kartenereignisse oder Emotes nicht erneut ab. Umsetzung und gesonderte native Audio-/Wiederbeitrittsnachweise stehen in `CASINO-TABLE.md`; die folgenden Nachweise der drei Referenzspiele bleiben davon getrennt.

`check-spatial-audio.mjs` rendert tatsächliche Web-Audio-Ausgabe in einem OfflineAudioContext: linke/rechte Quellen ergeben die passende Kanaldominanz, Mute/Effekt-Null ergeben Nullenergie, der während einer laufenden Reaktion heruntergedrehte Effektbus unterschreitet im späteren Messfenster die Energiegrenze von 1e-8. Normales Ende und sofortiger Abbruch räumen Stimmen/Gruppe auf; acht parallele Gruppen werden eingehalten. Ein noch nicht entsperrter Start bleibt kontextlos und übernimmt nach dem Entsperren seine gemerkten Quellen. Die drei Umgebungsprofile liefern unterschiedliche messbare Ausgaben, Zeitgefühl bleibt exakt stumm. Bericht: `outputs/qa/spatial-audio.json`.

`test-scene-audio-frame.mjs` prüft Kameraorientierung und tatsächliche Stations-/Fahrzeugpositionen sowie die ankerlose Zeitmessung. `check-spatial-scenes.mjs` bedient die echten Oberflächen mit zwölf Spielern bei 1440 und 390 Pixeln. Instrumentiert wird das native Web Audio der Anwendung: erster Becherwurf, direkte Warenkorbauswahl, öffentliche Scannerfolge und echte Texteingabe verwenden die passenden Quellen; der Audio-Hörer stimmt mit der gerenderten Kamera überein. Pro Ansicht entsteht genau ein Audiokontext. Nach dem Sichtbarkeitsereignis werden die Panner und beide laufenden Umgebungsquellen getrennt. Bericht: `outputs/qa/spatial-scenes.json`.

Die vorhandene Sound-/Dealer-/Kartenprüfung bleibt erhalten. Ihre Fixture-Erzeugung benutzt jetzt den geltenden Pixelblitz-Buzzer vor der einzigen gültigen Antwort. Die Emote-Prüfung zählt die 48 tatsächlichen Sendemöglichkeiten und sechs Favoritenplätze statt aller Menübuttons nach einem veralteten 32er-Layout. Es wurden dafür keine produktiven Spielregeln abgeschwächt.

Der endgültige Produktionsbuild, TypeScript, beide Kamera-/Anker-Node-Prüfungen, alle sechs nativen Audio-Browserfälle, die Offline-Signalprüfung, die bisherige Umgebungs-/Hallprüfung sowie die Sound-/Dealer-/Karten-/Emoteprüfung bestehen. Alle 17 Adventure-Prüfungen bestehen ebenfalls. In den sechs finalen Browserfällen werden tatsächlich beide laufenden Umgebungsschleifen nach dem Sichtbarkeitsereignis getrennt; die Scannerquelle stimmt auf beiden Breiten mit der realen Scannerposition überein. Der anschließende Ressourcenlauf über sechs vollständig geladene Szenenwechsel meldet unverändert 97/86/91 Zeichenaufrufe für Salon/Kaufhaus/Rennen, genau einen Canvas und keine WebGL-Fehler. Bericht: `outputs/qa/scene-lifecycle-audio-6.json`. Das ist ein kurzer Renderregressionstest und keine Audio-Langzeitsitzung. Der eigene Vorschauprozess wurde nach der Prüfung beendet.

Diese Nachweise belegen Signalverarbeitung, Anbindung und Ressourcenverhalten. Sie ersetzen keine Hörabnahme mit verschiedenen Lautsprechern/Kopfhörern, keine echte Mobilgeräte-Latenzmessung und keine vollständige Audio-Langzeit-/Prozessspeicherprüfung. Die vollständige Einzelgestaltung aller Disziplinen, die Reise, soziale Inszenierung und eine reale Mehrbrowser-Olympiade bleiben offen. Die Arbeit ist lokal und unveröffentlicht; die Referenzspiele werden hiermit nicht als vollständig fertig erklärt.
