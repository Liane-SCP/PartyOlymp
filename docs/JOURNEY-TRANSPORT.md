# Gemeinsame Fähren und Luftschiffe

Stand: 18.10.2026. Lokaler Ausbau der Oberwelt innerhalb des unveränderten Gesamtziels für alle 21 Disziplinen. Kein Veröffentlichungs- oder Abschlussbericht.

## Reise und Figuren

Kurze Verbindungen innerhalb eines Gebiets behalten ihre begehbaren Brücken. An- und Abreisen am Kraken nutzen eine Wolkenfähre. Andere Gebietswechsel und Strecken über 65 Welteinheiten nutzen ein Luftschiff. Lange Brücken werden dafür durch Anleger und eine dezente Flugroutenmarkierung ersetzt. Gebietstore stehen am Ankunftsanleger statt frei in der Mitte einer langen Verbindung.

Beide Fahrzeuge besitzen ein gemeinsames Deck mit eigenen Plätzen für 2–12 Spieler. Die vorhandenen Figuren bleiben in ihrer Boss-Darstellung erhalten. Einsteigen, gemeinsame Überfahrt und Aussteigen werden aus dem bestehenden öffentlichen Startzeitpunkt berechnet. Ein leicht gestaffeltes Betreten/Verlassen verhindert, dass alle gleichzeitig denselben Übergabepunkt benutzen. An Bord stehen die Figuren auf ihren Deckplätzen und spielen keine Laufanimation ab. Bei der Ankunft gehen sie wieder auf ihren normalen Laufkreis.

Der Server verwendet weiterhin seine bisherigen 6500 ms Reisezeit. Wertung, Bereitschaftsregeln, Spielreihenfolge und Raumlogik werden nicht verändert; es wird keine zusätzliche Wartephase eingeführt. Wiederbeitritt springt an die aktuelle öffentliche Reisezeit und spielt die Abfahrt nicht erneut ab. Reduzierte Bewegung zeigt die statische Ankunft ohne bewegtes Fahrzeug oder Kameraflug. Serverseitige Bewegungssperren während der Reise bleiben bestehen.

Die Kamera berücksichtigt Fahrzeug, Ballon und tatsächliche Figurenpositionen einschließlich Ein-/Ausstieg. Der erste Reiseausschnitt wird sofort korrekt gesetzt; danach folgt die Kamera weich. Gesamt-/Gebietsansicht sowie manuelles Zoomen/Verschieben behalten die Kontrolle. „Zur Crew springen“ aktiviert die Begleitung wieder. Nach der Ankunft kehrt die Kamera zur Insel zurück. Reisephase und Fahrzeugname stehen lesbar im Informationsteil; Laufsteuerungen werden während der Fahrt ausgeblendet. Eigener Name und aktive Reaktionen bleiben sichtbar, andere Namensschilder verdecken das gemeinsame Deck nicht.

## Tatsächlich integriertes Modell

Der Rumpf verwendet die bereits heruntergeladene und lokal gespeicherte Datei `public/adventure-models/watercraft/ship-hull.glb` aus Kenneys Watercraft Kit 2.1. Die mitgelieferte [Lizenzdatei](../public/adventure-models/watercraft/LICENSE.txt) nennt CC0; das [Assetmanifest](../public/adventure-models/manifest.json) dokumentiert Quelle, Bearbeitung und Prüfsumme.

- Quelle laut Manifest: `https://kenney.nl/assets/watercraft-kit`, Urheber Kenney.
- Rumpf: 51.140 Bytes, 628 Dreiecke; zusätzlich wird die lokale Palettentextur mit 8.814 Bytes verwendet.
- SHA-256: `2f0175138cc91460e1487a36efd7a97ddf7db32a1ea6479c644dad428eecf2ba`.
- Vorhandene Ableitung von `ship-large`: Segel/Flaggen entfernt und obere Geometrie bei Y=2,45 beschnitten. Rumpf, UVs, Normalen und Palette bleiben erhalten; native Hauptebene bei Y=2,1.
- Neue Platzierung: 4,8 Einheiten breit, Deck auf lokales Y=0 ausgerichtet. Authored Deckauflage, Reling, Segel, Ballon, Seile, Propeller und Gangway ergänzen den Rumpf. Die GLB-Datei selbst wurde dafür nicht verändert.

Ein gemeinsamer Modellbesitzer lädt den Rumpf einmal pro Kartenszene, teilt seine Ressourcen und gibt sie beim Szenenwechsel frei. Das Modell wird für die aktuelle beziehungsweise folgende passende Verbindung vorbereitet. Ein einfacher Ersatzrumpf hält die Darstellung während des Ladens oder bei Fehlern funktionsfähig; die Abnahmefälle warten ausdrücklich auf den tatsächlich geladenen GLB-Rumpf. Im Brückenfall ohne bevorstehende Fahrzeugverbindung wird kein Rumpf geladen.

## Klang

Vier kurze eigene Effekte begleiten Einsteigen, Luftschiffabfahrt, Fährabfahrt und Anlegen. Sie nutzen den bestehenden Effektregler und den Hauptmix. Es entsteht kein neuer AudioContext in der Renderphase. Cues werden nur bei frischen benachbarten öffentlichen Phasen und bereits laufendem Kontext ausgelöst. Erste Beobachtung, Zeitsprung, Wiederbeitritt, langer unsichtbarer Zeitraum und rückwärts gesuchte Zeit spielen keine historischen Übergänge nach.

`journey-audio.json` prüft vier Effekte jeweils hörbar, mit Effektlautstärke null und stumm: zwölf OfflineAudioContext-Fälle mit begrenzten Spitzen, stillen Enden und null verbleibenden Stimmen. Die erfassten hörbaren Spitzen liegen ungefähr zwischen 0,0073 und 0,0122. Diese Signalprüfung ersetzt keine Hörabnahme.

`journey-audio-live.json` prüft die tatsächliche Browserplanung während einer laufenden Reise: genau ein durch einen echten Kameraklick vorbereiteter AudioContext, ein geplanter Abfahrtston und die einmalige Ankunftsfolge. Die erste Kontextkonstruktion wurde an der vorbereitenden Nutzeraktion gemessen; der aktuelle Einzelwert steht unter `constructionMs` im Bericht. Das ist kein kostenloser Kaltstart und kein Framezeitnachweis. Klangeindruck, räumliche Atmosphäre und vollständiger Musik-/Effektmix bleiben weiter abzustimmen.

## Funktionelle Prüfung

39 Tests aus `scripts/test-journey.mjs` bestehen. Neue Prüfungen behandeln Transportwahl, getrennte Deckplätze für sämtliche Gruppengrößen 2–12, kontinuierliche Übergänge aus gespeicherten Startpositionen, identisches Sampling nach Zeitseek, tatsächliche Fahrzeuggeometrie innerhalb der Kamerahülle, gemeinsame Passagierpositionen, reduzierte Bewegung und Regeln gegen historische Klangwiederholungen. Vorhandene Insel-, Relikt-, Wertungs-, Bewegungs-, Wheel- und Bossabstandstests bleiben enthalten.

TypeScript und Produktionsbuild bestehen. Die bekannte Warnung zu großen JavaScript-Chunks bleibt offen.

`journey-transit-final.json` enthält sieben bestandene Browserfälle mit echtem lokalem GLB und öffentlichen Ansichten des Spielmotors:

| Fall | Spieler / Breite | Zeichnungen während Überfahrt | größter erfasster Phasenwert |
|---|---|---:|---:|
| Luftschiff | 12 / 1440 | 71 | 81 |
| Luftschiff | 12 / 390 | 70 | 92 |
| Fähre | 12 / 1440 | 121 | 121 |
| Fähre | 12 / 390 | 120 | 121 |
| Luftschiff | 2 / 390 | 50 | 72 |
| Brückenweg | 12 / 1440 | 41 | 41 |
| reduzierte Luftschiffreise | 12 / 390 | 44, statische Ankunft | 44 |

Die Werte sind Zeichenaufrufe in den abgetasteten Zuständen, keine gemessenen Framezeiten oder umfassenden Spitzenlastgrenzen. Alle fünf normalen Fahrzeugfälle laden genau einen Rumpf ohne Modellfehler. Der reine Brückenfall lädt keinen; reduzierte Bewegung darf den vorbereiteten Rumpf behalten, zeigt ihn aber nicht in Bewegung. Kameragrenzen, zwölf tatsächliche Deckpositionen, Reload im Flug, manuelle Übersicht, Phasensampling und vollständige Ankunft sind geprüft. Die statischen Fixture-Zeitpunkte dienen präzisen Vergleichen; sie sind kein Ersatz für reale Netzwerkzeit.

`scripts/check-nature.mjs` besteht zusätzlich erneut: drei Spieler am Desktop, zwei im Touchfenster, zwölf als Crew und drei bei reduzierter Bewegung. Eigene Geländeeingabe in der Nahansicht, öffentliche Bewegung, Emotes und gemeinsame Reise bleiben wirksam. Reduzierte Bewegungsanimation verändert nicht den öffentlichen Zustand eines manuell angeforderten Laufziels.

## Zwei echte Browser und lokales HTTP/D1

`journey-transit-network.json` stammt aus einem neu angelegten lokalen Raum mit zwei echten Sitzungen. Eine Hivemind-Runde wurde vollständig über die echte Raum-API gespielt und ausgewertet; anschließend begann der reguläre Übergang zum Kraken. Beide gerenderten Clients erhielten denselben gespeicherten Startzeitpunkt, dieselben Indizes und dieselben 6500 ms. Beide Crews standen auf derselben Fähre. Bei einer gleichzeitigen Stichprobe unterschieden sich ihre Fahrzeugpositionen um 0,05273 Welteinheiten.

Der zweite Browser wurde während der Überfahrt neu geladen, zeigte den geladenen Rumpf und beide Figuren am aktuellen Reisezeitpunkt und erreichte gemeinsam mit dem ersten Browser die Insel. Disziplinindex und bereits gespeicherte Hivemind-Wertung blieben erhalten. Dies ist eine reale Teilstrecke, keine vollständige Olympiade oder vollständige Kraken-Abnahme.

Visuell geprüft wurden Desktop-/Mobilbilder von Luftschiff und Fähre, Einsteigen und Landen nach der Staffelung sowie die echte Wiedereintrittsansicht: `transit-airship-12-1440.png`, `transit-airship-12-390.png`, `transit-ferry-12-1440.png`, `transit-ferry-12-390.png`, die zugehörigen Boarding-/Landing-Bilder und `transit-network-rejoin.png`. Frühere Berichte `journey-transit-initial.json` und `journey-transit-before-stagger.json` bleiben erhalten.

## Weiterhin offen

Nachfolgender Befund: Beim Schließen einzelner WebSockets entstehen lokale Runtime-Hang-Meldungen, auch ohne Spielcode im isolierten Worker. Die erfolgreichen Reiseprüfungen belegen deshalb keinen sauberen Request-Abschluss; siehe [REALTIME-RUNTIME.md](REALTIME-RUNTIME.md). Der spätere Ausbau der Grafikstufen hebt die bisherige feste Atlasbegrenzung auf 30 Renderupdates auf; Nachweise und Grenzen stehen in [JOURNEY-QUALITY.md](JOURNEY-QUALITY.md).

Weiterer Hafen-/Fahrzeugfeinschliff und Anlegevarianten, größere Gangways/Versammlungsbereiche für besondere Blickwinkel, regionale Musik und räumliche Fahrtatmosphäre, Hörprüfung, echte Mobil- und langsamere Referenzgeräte sowie Kaltstart-/Latenz-/Prozessspeichermessungen. Die bestehende Atlasbegrenzung auf 30 Renderupdates pro Sekunde ist unverändert; eine Desktop-60-FPS-Abnahme ist damit ausdrücklich nicht nachgewiesen.

Die Kamera-/Atlasfunktion ersetzt weiterhin keine vollständige Prüfung aller 21 individuell ausgearbeiteten Spiele. Die gesamte Mehrbrowser-Olympiade, die vollständige Anforderung-für-Anforderung-Abnahme und Veröffentlichung bleiben offen; siehe [ADVENTURE-STATUS.md](ADVENTURE-STATUS.md).


Der nachfolgende Ausbau von Inselwegen, Brückenzugängen, Crewkamera und Namensbedienung steht in [JOURNEY-PLAZAS.md](JOURNEY-PLAZAS.md). Acht aktuelle Reisefälle umfassen nun zusätzlich die mobile Zwölfspieler-Brücke mit tatsächlichen Positions-, Kamera- und Reloadprüfungen. Die vollständige Abenteuer- und Runtime-Abnahme bleibt offen.
