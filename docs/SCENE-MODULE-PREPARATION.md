# Gemeinsam vorbereitete Szenenmodule

Die Modellvorbereitung wird um den tatsächlichen Szenencode ergänzt. `components/olymp/scene-modules.ts` stellt dieselben Importfunktionen für die Vorbereitung und die späteren Renderer bereit. Normale Spielorte verwenden die vorhandene Adventure-Ladergruppe; Bosskämpfe verwenden ihre vorhandene Ladergruppe aus Arena, Rig, Spielort, Effekten und Nachbearbeitung. Der bisher separat gestartete HDR-Loader verwendet ebenfalls einen gemeinsamen Importvorgang.

Die Vorbereitung wird zusammen mit den Modelldateien in den bereits festgelegten ruhigen Phasen gestartet. Datensparmodus, als 2G oder langsamer gemeldete Verbindungen und ein verborgenes Dokument verhindern den Beginn. Während aktiver Spielhandlungen wird keine neue spekulative Vorbereitung begonnen. Der Bedarfslader bleibt verfügbar.

## Verhalten und Ressourcen

`createModuleLoader` teilt einen laufenden Import und anschließend dieselben aufgelösten Exporte zwischen allen Aufrufern. Gleichzeitige Vorbereitung und Szeneneintritt erzeugen keine getrennten Importvorgänge. Ein fehlgeschlagener Vorbereitungsvorgang wird aus diesem Promise-Cache entfernt, sodass der tatsächliche Einstieg erneut anfordern kann. Der optionale Umgebungs-Loader behält dabei seinen bisherigen Fehlerpfad mit vorhandener direkter Beleuchtung.

Es werden ausschließlich Moduldefinitionen importiert. Szenenaufbau, Figuren, Modelle, Renderer, Audioaktionen und Animationsschleifen bleiben beim tatsächlich montierten Spielort. Es wird kein zusätzlicher verborgener Bossrenderer zum Aufwärmen angelegt.

JavaScript-Module verbleiben im normalen ESM-Modulcache des Browsers. Ihre bereits gestarteten Imports lassen sich durch einen nachfolgenden Tabwechsel nicht wie die vorbereiteten GLB-Fetches abbrechen oder wieder entladen. Die 24-MiB-Grenze der Modellvorbereitung beschreibt ausschließlich rohe Modelldateien und ist keine Speichergrenze für JavaScript, dekodierte Szenen oder GPU-Ressourcen.

Die bestehenden normalen Spielorte liegen weiterhin in einer gemeinsamen Adventure-Ladergruppe. Die Vorbereitung ist damit keine neu eingeführte individuelle Codeaufteilung aller 18 normalen Spielorte. Ebenso ist das Einlesen des HDR-Codes keine Vorbereitung des tatsächlichen HDR-Bildes oder seiner GPU-Umwandlung. Die spätere Anpassung der normalen Shader-Vorbereitung an die tatsächlich gewählte Grafikstufe steht in [ADVENTURE-SHADER-PREPARATION.md](ADVENTURE-SHADER-PREPARATION.md). Weitere Textur-/Bildressourcen und langfristige Speicher-/Ladezeitmessungen bleiben gesonderte Arbeit.

## Prüfung

Zwei neue Node-Prüfungen bestehen: Vorbereitung und Konstruktion erhalten denselben noch laufenden Import und dieselben Exporte, ohne die exportierte Szenenfabrik aufzurufen; eine fehlgeschlagene Vorbereitung kann bei Eintritt erneut versuchen zu laden. Die fünf Modellvorbereitungsprüfungen bestehen weiterhin. TypeScript und Produktionsbuild bestehen; die bestehende Chunkgrößenwarnung bleibt sichtbar.

Der abschließende Browserdurchgang mit deaktiviertem HTTP-Cache besteht für Würfelsalon und Kraken sowie beide Spiele mit Datensparmodus. Bericht `outputs/qa/module-preparation.json`, Log `outputs/qa/module-preparation-browser.log`. Er beobachtet tatsächlich angeforderte Einstiegs-, Arena-, Rig-, Effekt-, Nachbearbeitungs- und HDR-Loader-Chunks während Regeln und Spiel. Die bereits vorhandene Regelvorschau benötigt selbst Adventure-Module; diese regulären Abrufe werden nicht als unterdrückbare Spekulation gewertet.

| Ablauf | Beobachtete Szenenchunks in Regeln | Weitere beobachtete Szenenchunks bei Eintritt |
|---|---:|---:|
| Würfelsalon mit Vorbereitung | 3 | 0 |
| Kraken mit Vorbereitung | 15 | 0 |
| Würfelsalon mit Datensparmodus | 3 für bestehende Vorschau | 0 |
| Kraken mit Datensparmodus | 3 für bestehende Vorschau | 12 |

Die vorbereiteten neun Salon- und drei Kraken-GLBs werden weiterhin ohne neue GLB-Anfrage beim Eintritt übernommen. In beiden Datensparfällen bleiben spekulative GLB-Abrufe aus und der tatsächliche Bedarfslader funktioniert. Vor dem Kraken-Eintritt existiert kein Boss-Canvas. Alle vier tatsächlichen Szenen werden geladen; keine erfassten Browserfehler. Das endgültige geladene Kraken-Renderbild wurde visuell kontrolliert. Die Chunksummen sind beobachtete Dateien dieses Builds und keine garantierte Zahl für zukünftige Bündelungen oder sämtliche Ressourcen.

Die Prüfung verwendet koordinierte Snapshots aus der tatsächlichen Engine und einen geschlossenen Live-WebSocket. Sie belegt keine vollständige Live-Olympiade, keine Eingabelatenzverbesserung in Millisekunden, keine native Mobilgeräte-Leistung und keine Prozessspeicherobergrenze. Der Gesamtauftrag mit allen 21 individuell ausgearbeiteten Disziplinen bleibt offen. Keine neue Veröffentlichung.
