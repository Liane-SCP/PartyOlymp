# Vorbereitung der nächsten Spielszene

Die bisherige Plattform lud sämtliche ausgewählten Bossmodelle einschließlich der gemeinsamen HDR-Umgebung bereits während der Spielauswahl vor. Normale Disziplinmodelle hatten keine entsprechende Vorbereitung. Dieser pauschale Boss-Preload ist entfernt.

Die Plattform bereitet jetzt die tatsächlich anstehende Szene vor: die aktuelle Disziplin während Regeln und Countdown, die folgende Disziplin während Gesamtergebnis, Zwischenwertung und Pause. Lobby, noch nicht entschiedene Drehs und Podium starten keine spekulative Vorbereitung. Während des aktiven Spiels beginnt keine neue spekulative Warteschlange.

## Begrenzung und Übergabe

`ScenePreloader` hält ausschließlich rohe lokale GLB-Dateien, keine dekodierten Szenen, Mixer, Renderer oder GPU-Ressourcen. Pro Vorbereitung laufen höchstens zwei Downloads; das Budget der vorbereiteten Rohdaten beträgt 24 MiB. Es existiert nur ein Ziel. Ein Zielwechsel oder vollständiger Abbau bricht alte Anfragen ab und verwirft alte Rohdaten. Verspätete Antworten dürfen keine alten Daten wieder eintragen.

Beim Eintritt in die Szene wird die spekulative Warteschlange angehalten. Bereits laufende Anfragen dürfen abschließen und werden von den tatsächlichen Szenenladern übernommen. Fertige Puffer werden beim Lesen aus dem Vorbereitungsspeicher entfernt; laufende Anforderungen werden abgewartet, statt denselben Download ein zweites Mal zu starten. Der tatsächliche Bedarfslader bleibt für noch nicht vorbereitete, fehlgeschlagene oder wegen des Budgets ausgelassene Dateien zuständig.

Ein ausgeblendeter Tab oder aktivierter Datensparmodus hält ebenfalls die Warteschlange an. Fertige Daten bleiben für dasselbe Ziel erhalten; beim Fortsetzen arbeiten weiterhin höchstens zwei Downloads gleichzeitig. Ein Zielwechsel verwirft die alten Daten wie bisher. Diese Ergänzung wurde ohne neue Testläufe umgesetzt; die historischen Nachweise unten belegen das neue Pausieren und Fortsetzen nicht.

`createAdventureModels` und `loadBossRig` verwenden diese Übergabe. Sie parsen dieselben ursprünglichen GLB-Daten mit demselben Basisverzeichnis für externe Paletten und behalten ihre bisherige szenenbezogene Material-/Animations-/Geometrieverantwortung. Netzwerkfehler und unerwartete Dateigrößen werden als fehlgeschlagene Vorbereitung gezählt und nicht in den Puffer übernommen.

Die Vorbereitung beginnt nach einer kurzen Verzögerung von 700 ms. Verborgene Dokumente, aktivierter Datensparmodus und als 2G beziehungsweise langsamer gemeldete Verbindungen starten keine spekulativen Downloads. Sichtbarkeits- und Verbindungsänderungen werden während der Vorbereitungsphase berücksichtigt. Das ist keine Abbruchlogik für sämtliche bereits benötigten Spielressourcen: Der normale Bedarfslader bleibt für die aktive Szene verfügbar.

## Quellengebundene Pläne für alle 21 Disziplinen

`scripts/prepare-scene-preloads.mjs` erzeugt `lib/scene-preload-assets.ts` anhand der tatsächlichen Ortsquellen, ihrer lokalen Abhängigkeiten und des vorhandenen Assetmanifests. Dateigrößen sind an die tatsächlich lokal vorhandenen Dateien gebunden. Die interpolierte Warenregalliste wird ausdrücklich ergänzt. Die drei Bosspläne enthalten jeweils das eigene Kreaturenmodell und die tatsächlich benötigten importierten Ortsmodelle. Die Generierung ist in `prepare-adventure-assets.mjs` nach dem Schreiben des Assetmanifests eingebunden.

Alle 21 Pläne passen derzeit vollständig in das Budget. Beispiele: Würfelsalon nach dem Ausbau zur Würfelstube zwölf Dateien / 125.904 Byte, Kaufhaus nach dem Abteilungsausbau zwanzig / 201.728 Byte, Rennstrecke zehn / 429.728 Byte, Museum zehn / 702.196 Byte und Kraken drei / 15.394.272 Byte. Der Rohdatenpuffer enthält keine Fragen, geheimen Antworten, Produktpreise, fremden Karten oder persönlichen Entwürfe. Der untenstehende ursprüngliche Browsernachweis verwendete noch neun Salonmodelle; die aktuellen Raumgestaltungen und ihre Prüfungen stehen in [DICE-SALON-ROOM.md](DICE-SALON-ROOM.md) und [STORE-DEPARTMENTS.md](STORE-DEPARTMENTS.md).

Die Pläne sind gezielte Modelleinstiegslisten. Externe Paletten, HDR-Bilddaten, Shaderkompilierung und dynamische Rätsel-/Produktbilder werden damit nicht vollständig vorbereitet. Die spätere gemeinsame Vorbereitung der vorhandenen JavaScript-Ladergruppen steht in [SCENE-MODULE-PREPARATION.md](SCENE-MODULE-PREPARATION.md). Änderungen an Szenen beziehungsweise Assets erfordern erneute Generierung. Diese Vorbereitung ersetzt keine vollständige Ladezeit- oder Prozessspeicherabnahme.

## Nachweise

Fünf Node-Prüfungen bestehen für alle 21 vorhandenen Pläne und exakten lokalen Dateigrößen, Phasenzuordnung, Budget und Deduplizierung, höchstens zwei Arbeiter, Übergabe mit Entfernung aus dem Rohdatenpuffer, Zielwechsel/Abbruch, verspätete alte Antworten, Fehler/Größenabweichungen sowie Übernahme laufender Downloads bei frühem Szenenstart. Acht bestehende Modell-/Batching-/Truhenprüfungen bestehen ebenfalls. TypeScript und Produktionsbuild bestehen; die bestehende Chunkgrößenwarnung bleibt sichtbar.

Die erste echte Browserprüfung fand einen ungebundenen nativen Fetch-Aufruf, der in Node-Mocks nicht auftrat. Der Standardabruf ist jetzt an `globalThis` gebunden. Der anschließende Durchgang besteht in `outputs/qa/scene-preload.json` mit deaktiviertem HTTP-Cache:

| Ablauf | Vorbereitete GLBs | Vorbereitete Bytes | Erneute GLB-Anfragen beim Eintritt |
|---|---:|---:|---:|
| Regeln → Würfelsalon, zwei Spieler | 9 | 88.468 | 0 |
| Regeln → Kraken, zwei Spieler | 3 | 15.394.272 | 0 |
| Regeln → Würfelsalon, Datensparmodus | 0 | 0 | 9 reguläre Bedarfsladevorgänge |

Alle drei Szenen laden tatsächlich; der Kraken erhält sein animiertes Originalmodell und die importierten Ortsmodelle. Die regulären Regeln-/Reisedarstellungen dürfen weiterhin ihre eigenen benötigten Modelle laden; der Datensparnachweis unterscheidet diese Abrufe von der neuen spekulativen Vorbereitung. Die tatsächlichen geladenen Renderbilder des Salons und Kraken wurden visuell kontrolliert. Keine erfassten Browserfehler.

Die Browserabläufe verwenden koordinierte Regeln-/Spiel-Snapshots aus der echten Engine und einen geschlossenen Live-WebSocket. Sie belegen keine vollständige Live-Olympiade, keine Netzwerklatenzverbesserung in Millisekunden, keine Mobilgeräte-FPS und keine Prozessspeicherobergrenze. Native Hintergrundtab-/2G-Verbindungswechsel und lange Szenenfolgen bleiben gesondert zu prüfen. Die vollständige Gestaltung und Abnahme aller 21 Disziplinen bleibt offen; keine neue Veröffentlichung.

## Nachprüfung nach dem Kaufhausausbau

Der zusätzliche Kaufhausfall fand einen erneuten Szenenaufbau durch die initial gesetzte reduzierte Bewegung. Die bereits vorbereiteten Rohdaten waren vom ersten Besitzer übernommen; der zweite lud alle zwanzig Modelle erneut. Die Bewegungseinstellung ist jetzt ein laufend gelesenes Ref und keine Aufbauabhängigkeit der gesamten Adventure-Szene mehr. Das gilt auch für das manuelle Umschalten und Änderungen der Betriebssystem-Präferenz: Die Darstellung aktualisiert sich im vorhandenen Renderer.

`outputs/qa/store-preload-lifecycle-all.json` enthält fünf bestandene Fälle: Salon und Kraken normal sowie jeweils im Datensparmodus, dazu das Kaufhaus. Bei allen drei normalen Einstiegen gibt es mit deaktiviertem HTTP-Cache keine erneute Anfrage für vorbereitete Modelle. Der Salon verwendet jetzt zwölf Modelle, das Kaufhaus zwanzig. Die normalen Adventure-Fälle und der Salon-Datensparfall schalten zusätzlich die ruhige Ansicht um und prüfen die Identität des tatsächlichen Canvas sowie unveränderte Modellabrufzahl. Diese Prüfung schützt die Ressourcenübergabe und den Szenenlebenszyklus; sie ersetzt keine Langzeit- oder vollständige Geräteprüfung.

Nach dem Casinoraumausbau besteht zusätzlich der gezielt ausgeführte Club-21-Fall: 13 vorbereitete GLBs/131.352 Byte, keine erneute Anfrage vorbereiteter GLBs beim Eintritt trotz deaktiviertem HTTP-Cache und derselbe Renderer beim Umschalten der ruhigen Ansicht. Bericht: `outputs/qa/casino-room-preparation.json`; Raumgestaltung und weitere Nachweise in [CASINO-ROOM.md](CASINO-ROOM.md). Die Standardfallliste enthält jetzt auch diesen Casinofall; damit wird keine erneute gemeinsame Ausführung aller früheren Fälle auf diesem Stand behauptet.
