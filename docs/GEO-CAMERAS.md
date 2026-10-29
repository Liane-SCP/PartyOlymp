# Weltreise: Werkstatt, Globus und eigener Kartenplatz

Die Navigationswerkstatt besitzt drei lokale Ansichten derselben Szene. „Werkstatt“ zeigt Globus, echtes Panoramafenster und alle Teilnehmer. „Globus“ vergrößert das geografische Spielobjekt. „Mein Platz“ zeigt die ursprüngliche eigene Figur und ihr tatsächlich vorhandenes Kartenpult von der Blattseite aus. Zu Beginn einer neuen Runde kehrt die Ansicht zur Werkstatt zurück; Escape führt ebenfalls dorthin.

Die Kamera passt die tatsächlichen Interaktionsgrenzen perspektivisch in den freien Bildbereich ein. Sie berücksichtigt Tisch und Figur am gewählten Sitzplatz, die Gruppengröße, das Seitenverhältnis, die Überschrift und die gemessene Höhe der Ansichtsleiste. Die Anpassung wird nach diesen Größen zwischengespeichert. Ein Ansichtswechsel erzeugt keine neue Szene und lädt keine Modelle erneut.

In der persönlichen Ansicht werden Globus und Meridianring ausgeblendet, damit sie nicht vor dem Arbeitsplatz stehen. Ausschließlich die UV-Koordinaten des eigenen Namensfeldes werden um 180 Grad gedreht. Die vorhandene Atlastextur, das Material und die zusammengefasste Geometrie bleiben bestehen. Beim Verlassen der Ansicht werden die ursprünglichen UV-Koordinaten wiederhergestellt.

Das eigene Kartenblatt öffnet per Maus, Touch oder Enter die genaue Karte im Spielpult. Am Globus drehen die Pfeiltasten die Kugel; Enter wählt einen eigenen Pin auf ihrer Vorderseite. Diese Auswahl ist vor Ablauf der Eingabephase ein privater Entwurf. „Festlegen“ verwendet die vorhandene verbindliche Abgabe. Nach der Abgabe kann die Karte weiterhin betrachtet werden. Beschriftungen und Tastaturhinweise unterscheiden Eingabe und reine Betrachtung.

Der bestehende serverseitig gespeicherte Zeitablauf-Entwurf wird nach dem Neuladen wiederhergestellt. Es werden nur eigene, gültige Koordinaten aus der aktuellen Phase übernommen. Fremde Antworten, ältere Phasen und ungültige Koordinaten sind ausgeschlossen. Die vorhandene automatische Verarbeitung eines gespeicherten Entwurfs beim Phasenende bleibt erhalten.

Die schmale Ansicht hatte zunächst zwei übereinanderliegende Reservierungen für die Überschrift: einen CSS-Abstand über dem Canvas und zusätzlich den Sicherheitsbereich der Kamera. Die Weltreise verwendet nun den vollständigen Canvas mit einem einzigen internen Sicherheitsbereich. In den beiden Nahansichten wird das Bild an dessen oberer Grenze abgeschnitten, damit auch eine weiter hinten sitzende Nachbarfigur die Kopfzeile nicht überlagert. Die Grafikauswahl sitzt neben der Überschrift und überlagert die Ansichtsleiste nicht mehr.

## Nachweise

- `outputs/qa/geo-camera-unit-verified.log`: sechs Prüfungen, darunter Projektion aller Interaktionsgrenzen bei 2/8/12 Teilnehmern und jedem Sitzplatz, tatsächlicher Raycast auf das eigene Blatt, Vordergrundausblendung und unveränderte fremde Atlasfelder.
- `outputs/qa/geo-camera-layout-native.json`: sechs Chromium-Abläufe mit Maus, Touch und Tastatur; zwei Teilnehmer sowie vorderer und hinterer Platz bei zwölf Teilnehmern, jeweils 1440/390 Pixel breit. Private Entwurfswiederherstellung, bewusste Abgabe, gesperrte weitere Abgabe, Ergebniskarte, Escape, Rundenreset und unveränderte Canvas-/Modellressourcen bestehen.
- `outputs/qa/geo-camera-high-normal.json`: zwei zusätzliche Abläufe mit hoher Qualität und normaler Bewegung; die Überschrift bleibt außerhalb der Interaktionsgrenzen, Grafik- und Ansichtsbedienung überlagern sich nicht.
- `outputs/qa/geo-camera-header-native.json`: abschließende vier Zwölfspielerabläufe einschließlich vorderem und hinterem Platz in beiden Bildschirmbreiten, nach der visuellen Abgrenzung der Kopfzeile. Alle Eingaben, privaten Entwürfe, Wiederherstellung, explizite Abgabe und Ansichtswechsel bestehen weiterhin. Die aktuellen Renderbilder wurden kontrolliert.
- `outputs/qa/geo-camera-navigation.json`: vier bestehende Navigationsabläufe mit je zwei getrennten Browseransichten, echten Engine-Befehlen, privaten Tipps, öffentlicher Auflösung, gemeinsam getaktetem Flug, Wiedereintritt und Rundenreset bestehen erneut.
- `outputs/qa/geo-camera-lifecycle-final.json`: 18 Wechsel zwischen Weltreise, Kategorien-Kette, Farbwechsel und Stadt Land Fluss. Bei jedem Weltreisebesuch werden Globus, eigener Platz und Werkstatt durchlaufen. Über fünf Besuche bleiben 22 Texturen und 54 Geometrien konstant; die Ansichten benötigen 67/25/95 Zeichenaufrufe in sparsamer Qualität. Keine WebGL-Fehler und jeweils genau ein aktives Canvas.

Diese Browserabläufe verwenden kontrollierte HTTP-Spielansichten und geschlossene WebSockets. Sie ersetzen keine Prüfung des realen Mehrbrowser-Netzwerkbetriebs.

Der Produktionsbuild (`geo-camera-header-build.log`), TypeScript (`geo-camera-types-verified.log`) und die Prüfung der betroffenen Änderungen auf Whitespacefehler bestehen. Die vorangegangene reine Prompt-Antwort war kein Implementierungsfortschritt; dieser Ausbau setzt die Arbeit am unveränderten vollständigen Ziel fort.

`outputs/qa/geo-camera-shaders.json` bestätigt 14 vorbereitete Programme in Hoch und 12 in Sparsam, jeweils ohne zusätzliche Programme im ersten sichtbaren Frame. `outputs/qa/geo-camera-audio-final.json` prüft beide Bildschirmbreiten mit räumlichem Audio an der persönlichen Kamera, einem AudioContext, echten eigenen und gemeinsamen Spielklängen sowie jeweils drei Rückwechseln über eine andere Szene. Verspätete Historie bleibt in diesen Abläufen stumm; sämtliche 14 dabei angelegten Umgebungsschleifen werden beim Ausblenden getrennt.

Ein vorausgegangener Audiolauf zeigte beim Szenenrückwechsel drei zusätzliche Oszillatoren und einen Effektbuffer; der unmittelbar folgende Lauf war unauffällig. Die Zeichenroutine ist deshalb gegen das Übergangsfenster zwischen neuem React-Spielzustand und dem Abbau der vorherigen Szene abgesichert: Eine Szene verarbeitet keinen Zustand mit einer anderen Spiel-ID. Die Hub-Vorschau bleibt ausgenommen. Der nachfolgende Audiolauf mit drei Rückwechseln pro Breite besteht. Das ist kein Ersatz für eine lange Hör- oder Live-Netzwerkprüfung.

## Kurze Hardwaremessungen

`geo-camera-desk-final-hardware.json` und `geo-camera-globe-final-hardware.json` verwenden tatsächlich die RTX 4080 SUPER über D3D11, hohe Qualität, zwölf geladene Figuren, das normale Seitenlayout und stummes Audio. Der eigene Platz gehört Teilnehmer elf, also dem hinteren Randplatz. Pro Fall werden nach dem Aufwärmen vier Sekunden gemessen. Diese abschließenden Stichproben enthalten auch die korrigierte Kopfzeile und deren Bildbegrenzung.

| Ansicht / Viewport | Zeichenpuffer | Zeichenaufrufe / Dreiecke | App-Bildzeit P95 / Render-CPU P95 |
|---|---|---|---|
| Eigener Platz / 1920 | 1040 × 797 | 67 / 14.251 | 16,7 / 0,6 ms |
| Eigener Platz / 390 | 364 × 418 | 65 / 14.201 | 16,8 / 0,6 ms |
| Globus / 1920 | 1040 × 797 | 83 / 20.249 | 16,7 / 0,7 ms |
| Globus / 390 | 364 × 418 | 86 / 20.393 | 16,7 / 0,6 ms |

Die Stichproben enthalten jeweils 240–241 rAF-Intervalle. Drei Fälle haben höchstens 16,8 ms Abstand; am schmalen eigenen Platz tritt einmal ein Abstand von 33,3 ms auf. Kein Fall enthält Intervalle über 33,5 oder 50 ms. Sie belegen warme Ansichten auf dieser Desktop-GPU. Sie messen weder kalte Downloads noch vollständige GPU-Bildzeit, Eingabelatenz, Prozessspeicher oder physische Mobilhardware.

## Verbleibender Umfang

Weitere Arbeitsplatzgestaltung, gut lesbare Gruppentischkarten, zusätzliche Figurenreaktionen, Hörprüfung, echte Referenzgeräte, Kaltstart-/Latenz-/Langzeitmessungen und eine vollständige Live-Mehrbrowser-Olympiade bleiben erforderlich. Das Ziel umfasst weiterhin alle 21 Disziplinen, die Reise, sozialen Funktionen, Sound und zuverlässigen Multiplayer. Diese lokale Arbeitsfassung ist nicht veröffentlicht und keine Gesamtabnahme.
