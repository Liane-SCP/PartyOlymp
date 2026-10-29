import type { GameId, Selection } from "./types";
import { isBoss, minimumRounds } from "./boss-rules";
import {PARTY_FLOW,suggestedPartyRoute} from './party-flow';
export const catalog: {
  id: GameId;
  name: string;
  tag: string;
  icon: string;
  description: string;
  controls: string;
  win: string;
  rules: string;
  defaultRounds: number;
  defaultSeconds: number;
}[] = [
  {
    id: "colossus",
    name: "Der Würfelkoloss",
    tag: "Boss · Würfel × Runen",
    icon: "colossus",
    description:
      "Zerlegt einen uralten Steinwächter – Würfelwurf für Würfelwurf.",
    controls:
      "Alle würfeln gleichzeitig fünf Würfel. Würfel anklicken zum Halten, bis zu zweimal nachwürfeln und dann Angriff festlegen.",
    win: "Deine Kombinationen plus Schwäche-Boni ergeben deine Punkte. Die höchste Summe gewinnt die Einzelwertung.",
    rules:
      "Jeder hat fünf eigene Würfel und bis zu drei Würfe pro Angriff. Kombinationen: Einzelne 100, Paar 200, zwei Paare 350, Dreierpasch 450, kleine Straße 650, Full House 800, große Straße 900, Viererpasch 950, Fünferpasch 1.200. Die sichtbare Schwäche bringt +300: Helm = Paar, Runenpanzer = Straße, Kern = mindestens drei gleiche Augen. Der Angriff muss festgelegt werden; ohne Abgabe 0. Alle Angriffe werden gemeinsam aufgelöst. Drei Rüstungsphasen, mindestens drei gemeinsame Angriffe; pro Salve kann nur eine Phase brechen. Überzähliger Schaden bleibt als persönliche Punktzahl erhalten. Nach den eingestellten Angriffen endet der Kampf, auch wenn noch Rüstung steht. Kein zusätzlicher Spielabbruch-Timer.",
    defaultRounds: 6,
    defaultSeconds: 45,
  },
  {
    id: "kraken",
    name: "Krakensturm",
    tag: "Boss · Kanonen × Präzision",
    icon: "kraken",
    description: "Zwölf Kanonen. Eine Crew. Ein Monster unter eurem Schiff.",
    controls:
      "Laden gedrückt halten. Loslassen, wenn der Zeiger die Mitte des leuchtenden Zielbereichs trifft. Touch, Maus oder Leertaste funktionieren gleich.",
    win: "Bis zu 1.000 Punkte pro Schuss nach Genauigkeit. Treffserien bringen zusätzlich bis zu 300 Punkte pro Schuss.",
    rules:
      "Jeder misst seine eigene Ladezeit lokal: Eure Verbindung bestimmt nicht die Präzision. Der Zeiger pendelt alle drei Sekunden hin und zurück. In Phase zwei und drei bewegt sich auch der Zielbereich und wird kleiner. Die Mitte ist perfekt; innerhalb des markierten Bereichs erhältst du mindestens 80 %. Ab 80 % wächst deine Serie: ab dem zweiten Treffer +100, dann +200, ab dem vierten +300. Ein schwächerer oder fehlender Schuss setzt die Serie zurück. Alle feuern in einer gemeinsamen Salve. Drei Bossphasen; pro Salve kann nur eine brechen. Ohne abgegebenen Schuss 0. Maximal die eingestellte Anzahl gemeinsamer Angriffe; Punkte bleiben auch bei einem Rückzug erhalten. Der Antworttimer beträgt mindestens 20 Sekunden.",
    defaultRounds: 6,
    defaultSeconds: 30,
  },
  {
    id: "dragon",
    name: "Der Münzdrache",
    tag: "Boss · Preise × Risiko",
    icon: "dragon",
    description:
      "Schätze echte Produkte und verwandle deinen Mut in goldene Treffer.",
    controls:
      "Den Produktpreis in Euro schätzen, Sicher, Mutig oder Alles riskieren wählen und deinen Tipp geheim festlegen.",
    win: "Die Summe deiner Genauigkeits- und Risikopunkte entscheidet die Einzelwertung.",
    rules:
      "Über 500 echte Produkte mit Bildern und datierten Referenzpreisen; keine Live-Angebote. Alle schätzen dasselbe Produkt verdeckt. Genauigkeit = 1 minus prozentualer Preisabweichung, mindestens 0. Sicher: 1.000 × Genauigkeit. Mutig: 1.250 × Genauigkeit². Alles riskieren: 1.600 × Genauigkeit⁴. Risiko belohnt genaue Schätzungen stärker und lässt große Abweichungen härter zählen. Fehlende Tipps: 0. Eure Münzsalven brechen gemeinsam Schuppen, Flügel und den Schutz des Horts. Pro Salve kann nur eine Phase brechen; individuelle Punkte werden dabei nie gekürzt. Maximal die eingestellte Anzahl gemeinsamer Angriffe, mindestens drei. Alle erhalten gleich viele Gelegenheiten. Euer persönlicher Rang bleibt auch bei einem Rückzug bestehen.",
    defaultRounds: 6,
    defaultSeconds: 40,
  },
  {
    id: "code",
    name: "Codeknacker",
    tag: "Farben × Logik",
    icon: "code",
    description:
      "Vier Farben im Verborgenen. Knack den Code mit wenigen Versuchen.",
    controls:
      "Position anklicken, Farbe wählen und vier Farben geheim abgeben. Alle aktiven Spieler spielen denselben Zug gleichzeitig.",
    win: "Die wenigsten Versuche zum richtigen Code gewinnen. Gleiche Versuchszahl: gleicher Platz, unabhängig vom Tempo.",
    rules:
      "Alle lösen denselben Code auf eigenen Brettern: 4 Positionen, 6 Farben, Wiederholungen erlaubt. Rückmeldung erst nach allen Abgaben: Farbe + Position richtig; richtige Farbe am falschen Platz. Jeder Stein zählt nur einmal; die Rückmeldung verrät keine Position. Während du rätselst, siehst du fremde Trefferzahlen pro Versuch. Nach Lösung oder Aufgabe kannst du fremde Bretter ansehen. Keine Uhr und kein Versuchslimit; identische Tipps werden nicht erneut gezählt. Ende, wenn alle gelöst oder aufgegeben haben. Bei mehreren Runden zählen zuerst mehr gelöste Codes, dann weniger Versuche insgesamt in diesen Runden. Ohne Lösung: keine Olympiadenpunkte.",
    defaultRounds: 3,
    defaultSeconds: 90,
  },
  {
    id: "auction",
    name: "Kopf-Auktion",
    tag: "Wissen × Pokern",
    icon: "auction",
    description: "Wie viele schaffst du? Überbiete die Crew – und liefere ab.",
    controls:
      "Kategorie wählen, Anzahl bieten oder passen. Der Höchstbietende tippt Begriffe einzeln ein; die anderen bewerten danach.",
    win: "Erfülltes Gebot: +10 Punkte pro gebotenem Begriff. Gescheitert: genauso viele Minuspunkte.",
    rules:
      "Die Aufgabenwahl wechselt jede Runde: drei Vorschläge oder eine eigene neue Kategorie. 25 Sekunden Auktion; späte Gebote verlängern bis maximal 60 Sekunden. Passen gilt für diese Auktion. Höchstgebote sind verbindlich. Danach läuft der eingestellte Antworttimer. Gleiche Schreibweisen zählen nur einmal. Die Crew bewertet jeden Begriff geheim; der Bieter stimmt nicht mit. Mehr Ja als Nein: gültig; Gleichstand oder keine Stimmen: ungültig. Extra-Antworten dürfen ungültige ersetzen. Ohne Gebot: keine Punkte. Keine Zeitgrenze für die gesamte Disziplin.",
    defaultRounds: 6,
    defaultSeconds: 30,
  },
  {
    id: "timing",
    name: "Zeitgefühl",
    tag: "Bauchgefühl × Präzision",
    icon: "timing",
    description:
      "Merk dir die Zeit. Lass die Uhr verschwinden. Triff den Moment.",
    controls:
      "Zielzeit merken, selbst starten und mit Stopp oder Leertaste anhalten. Jeder misst für sich.",
    win: "Je kleiner die Abweichung, desto mehr Punkte – bis zu 1.000 pro Runde.",
    rules:
      "Zufällige Zielzeiten von 4 bis 15 Sekunden. Während der Messung sind Uhr und Countdown verborgen. Die Zeit wird lokal gemessen, der Server prüft ihre Plausibilität. Ergebnisse bleiben bis zur Auflösung geheim. Ab Runde zwei lenken unregelmäßige Töne oder falsche Zahlen ab. Sie sind keine echte Uhr! Punkte: 1.000 × exp(−Abweichung in ms / 900). Nicht gestoppt: 0. Der Antworttimer schließt nur diese Runde; mindestens 45 Sekunden Start- und Antwortfenster.",
    defaultRounds: 6,
    defaultSeconds: 45,
  },
  {
    id: "bomb",
    name: "Bombenwort",
    tag: "Wörter × Nervenkitzel",
    icon: "bomb",
    description: "Ein neues Wort. Eine kurze Lunte. Gib die Bombe weiter!",
    controls:
      "Ein Wort mit der Buchstabenfolge eintippen und bestätigen. Wiederholungen reichen die Bombe nicht weiter.",
    win: "Überlebe die anderen. Eure Rundenplätze ergeben die Spielpunkte.",
    rules:
      "Nach jedem richtigen oder von der Crew bestätigten Wort geht die Bombe weiter und eine neue Buchstabenfolge erscheint. Falsche oder abgelehnte Wörter ändern die Folge nicht. Über 48.000 Wörter werden lokal erkannt; weitere Wörter kann die Crew bestätigen. Keine Namen, Abkürzungen oder erfundenen Wörter. Bei der Prüfung pausiert die Lunte; der Autor stimmt nicht mit, Ausgeschiedene dürfen mitprüfen. Mehr Ja als Nein bestätigt das Wort; sonst bleibt die Bombe beim Autor. Großschreibung und ß/ss zählen gleich. Benutzte Wörter bleiben die ganze Runde gesperrt. Geheime zufällige Lunte: eingestellte Sekunden (mindestens 15) plus 0–20. Die Lunte läuft über alle Übergaben weiter. Explosion: Ausscheiden, neue Folge und Lunte. Kein Abbruch der gesamten Disziplin.",
    defaultRounds: 3,
    defaultSeconds: 20,
  },
  {
    id: "chain",
    name: "Kategorien-Kette",
    tag: "Reihum × Rausfliegen",
    icon: "chain",
    description: "Eure Kategorie kommt aufs Glücksrad. Immer ein neuer Begriff. Wer bleibt übrig?",
    controls:
      "Schlagt zuerst eine Kategorie vor. Nach dem Wheelspin antwortest du, wenn du dran bist. Prüfe neue Antworten mit Passt oder Anfechten.",
    win: "Als letzter Spieler übrig bleiben. Eure Rundenplätze bestimmen die Gesamtwertung.",
    rules:
      "Vor jeder Runde: 35 Sekunden für einen Vorschlag pro Spieler, dann entscheidet das Glücksrad. Eigene Kategorien und 50 Ideen stehen bereit. Bei Zeitablauf bekommen fehlende Vorschläge eine Idee; jedes Spieler-Los hat dieselbe Chance. Gleiche Begriffe werden automatisch erkannt (Großschreibung, Artikel und Satzzeichen zählen nicht). Wiederholung oder verpasster Zug: raus. Jede neue Antwort hat ein 7-Sekunden-Prüffenster; alle anderen, auch Ausgeschiedene, dürfen sie anfechten. Dann stimmen die anderen geheim ab, der Anfechtende stimmt automatisch für ungültig. Mehr Nein als Ja: raus; Gleichstand: gültig. Zu zweit entscheidet der andere Spieler. Synonyme oder inhaltliche Doppelungen könnt ihr ebenfalls anfechten. Kein Zeitlimit für das gesamte Spiel.",
    defaultRounds: 3,
    defaultSeconds: 20,
  },
  {
    id: "categories",
    name: "Stadt Land Fluss",
    tag: "Wörter × Crew-Voting",
    icon: "categories",
    description: "Ein Buchstabe. Sieben Kategorien. Eure Crew entscheidet.",
    controls:
      "Alle schreiben gleichzeitig. Anschließend bewertet ihr jede Kategorie mit Ja, Nein oder Enthaltung.",
    win: "Sammle mit gültigen, möglichst einzigartigen Antworten die meisten Punkte.",
    rules:
      "Kategorien: Land, YouTuber, Essen, Tier, Getränk, Beruf, Game. Ein zufälliger Buchstabe pro Runde; kein vorgefertigter Antwortkatalog. Entwürfe werden automatisch gespeichert. Danach geheime Abstimmung pro Kategorie, auch über eigene Antworten. Mehrheit der abgegebenen Ja/Nein-Stimmen entscheidet; Gleichstand und keine Stimmen: ungültig. Leere Antworten oder falscher Anfangsbuchstabe: 0. Allein gültig: 20; einzigartige gültige Antwort: 10; mehrfach genannt: 5. Artikel der/die/das/the zählen nicht, Umlaute wie A/O/U. Gleiche Schreibweisen werden gemeinsam bewertet. Schreib- und Abstimmungstimer beenden nur die jeweilige Phase.",
    defaultRounds: 3,
    defaultSeconds: 90,
  },
  {
    id: "geo",
    name: "Weltreise",
    tag: "Entdecken × Verorten",
    icon: "geo",
    description:
      "Dreh dich um. Lies die Spuren. Finde deinen Ort auf der Welt.",
    controls:
      "Draußen im echten 360°-Panorama umsehen. Auf der Straßenkarte bis zu Ortsnamen und Straßen hineinzoomen, Pin setzen und bestätigen.",
    win: "Je näher dein Tipp am Aufnahmeort liegt, desto mehr Punkte.",
    rules:
      "Alle sehen denselben echten Aufnahmeort und erkunden das Panorama unabhängig. Eure Pins bleiben bis zur Auflösung geheim. Bis 1 km: 5.000 Punkte; danach 5.000 × exp(−Entfernung/1.800 km). Keine Antwort: 0. Summe aller Orte entscheidet. Panoramen sind feste Aussichtspunkte, frei drehbar und zoombar.",
    defaultRounds: 5,
    defaultSeconds: 90,
  },
  {
    id: "typer",
    name: "Typeracer",
    tag: "Tempo × Präzision",
    icon: "typer",
    description: "Ein Text. Eine Rennstrecke. Wer tippt sich zuerst ins Ziel?",
    controls:
      "Den angezeigten Text exakt abtippen. Fehler mit der Rücktaste korrigieren.",
    win: "Zuerst fehlerfrei fertig werden; danach zählt der korrekte Fortschritt.",
    rules:
      "Alle tippen denselben Text. Großschreibung und Satzzeichen zählen; typografische Anführungszeichen, Bindestriche und Leerzeichen werden vereinheitlicht. Zusätzliche Leerzeichen am Ende verhindern den Zieleinlauf nicht. Fertig: 1.000–2.000 Punkte nach Tempo. Unfertig: bis zu 900 nach korrektem Fortschritt. Der Antworttimer beendet nur diese Runde. Einfügen ist gesperrt.",
    defaultRounds: 3,
    defaultSeconds: 90,
  },
  {
    id: "herd",
    name: "Hivemind",
    tag: "Gedanken × Gemeinsam",
    icon: "herd",
    description: "Nicht besonders clever. Sondern genau wie die anderen.",
    controls: "Eine kurze Antwort eingeben und geheim festlegen.",
    win: "In der eindeutig größten Antwortgruppe sein.",
    rules:
      "Die größte Gruppe bekommt je 100 Punkte, mindestens zwei gleiche Antworten sind nötig. Gleich große größte Gruppen: niemand punktet. Großschreibung, Leerzeichen und Satzzeichen werden ignoriert; ä/ae, ö/oe und ü/ue zählen gleich. Synonyme bleiben getrennt. Feste Runden, keine Kuh-Sonderregel.",
    defaultRounds: 6,
    defaultSeconds: 35,
  },
  {
    id: "spectrum",
    name: "Spectrum",
    tag: "Hinweise × Bauchgefühl",
    icon: "spectrum",
    description:
      "Ein geheimer Zielbereich. Ein Hinweis. Ein gemeinsames Gefühl.",
    controls:
      "Hinweisgeber nennt einen Begriff. Jeder andere Spieler verschiebt seinen eigenen geheimen Zeiger und bestätigt ihn.",
    win: "Bis zu vier Punkte pro eigenem Tipp. Der persönliche Durchschnitt entscheidet die Disziplin.",
    rules:
      "Einzelwertung für 2–12 Spieler. Der Hinweisgeber wechselt reihum und sieht als Einziger das Ziel. Alle anderen raten gleichzeitig und geheim. Bis 2 Abstand: 4 Punkte; bis 6: 3; bis 10: 2; sonst 0. Erst nach allen Tipps wird aufgedeckt. Nicht abgegebene Tipps zählen 0; Hinweisgeberrunden und Runden ohne Hinweis werden aus dem persönlichen Durchschnitt ausgenommen. Mindestens zwei Runden, damit jeder raten kann. Namen mit Ziffern sind erlaubt; reine Zahlenwerte nicht.",
    defaultRounds: 6,
    defaultSeconds: 45,
  },
  {
    id: "dice",
    name: "Würfelwerk",
    tag: "Glück × Taktik",
    icon: "dice",
    description: "Fünf Würfel. Drei Versuche. Ein perfekter Eintrag.",
    controls: "Würfeln, Würfel zum Halten anklicken, freie Kategorie wählen.",
    win: "Die höchste Summe auf dem Wertungsblatt gewinnt.",
    rules:
      "13 gemeinsame Züge: alle würfeln gleichzeitig und warten nach ihrem Eintrag auf die anderen. Würfel und Wertungsblätter sind sichtbar. Oberer Bonus ab 63: +35. Fehlende Einträge zählen 0.",
    defaultRounds: 1,
    defaultSeconds: 45,
  },
  {
    id: "wiki",
    name: "Wiki-Sprint",
    tag: "Wissen × Entdecken",
    icon: "wiki",
    description: "Von einem Artikel zum Ziel – nur über echte Links.",
    controls: "Verlinkte Artikel in der Spielansicht anklicken.",
    win: "Wer das Ziel früher erreicht, liegt vorn.",
    rules:
      "Keine Suche. Jeder Schritt wird geprüft. Ziel erreicht: 100–1000 Spielpunkte, je schneller desto mehr. Nicht am Ziel: 0 für diese Runde. Erfolgreiche Runden bleiben erhalten; ihre Summe bestimmt den Disziplinplatz. Ohne eine Zielankunft: 0 Olympiadenpunkte.",
    defaultRounds: 3,
    defaultSeconds: 90,
  },
  {
    id: "picture",
    name: "Pixelblitz",
    tag: "Erkennen × Tempo",
    icon: "picture",
    description: "Aus buntem Rauschen wird die richtige Idee.",
    controls: "Zuerst buzzern, dann innerhalb von 8 Sekunden antworten.",
    win: "Schnelle richtige Antworten bringen mehr Rohpunkte.",
    rules:
      "Über 500 echte Fotomotive. Wer zuerst buzzert, erhält bis zu 8 Sekunden für eine Antwort; das Bild bleibt dabei stehen. Eine richtige Antwort beendet die Runde. Nach einem Fehler oder Zeitablauf bist du für dieses Bild gesperrt und die anderen dürfen buzzern. Synonyme und kleine Tippfehler sind erlaubt. Lösung und Bildquelle erscheinen bei der Auflösung.",
    defaultRounds: 8,
    defaultSeconds: 25,
  },
  {
    id: "budget",
    name: "Budget-Bande",
    tag: "Schätzen × Risiko",
    icon: "budget",
    description: "Pack den Korb voll. Bleib unter dem Limit.",
    controls: "Produkte auswählen und den Warenkorb verbindlich abgeben.",
    win: "Mehr Produkte gewinnen; bei Gleichstand zählt die Budgetausnutzung.",
    rules:
      "Über 500 echte Amazon.de-Artikel mit lokal gespeicherten Produktbildern. Datierte Referenzpreise vom 10.10.2026, keine aktuellen Angebote. Über Budget: 0 Rundenpunkte. Mehr Produkte gewinnen, danach Budgetausnutzung.",
    defaultRounds: 5,
    defaultSeconds: 35,
  },
  {
    id: "blackjack",
    name: "Club 21",
    tag: "Karten × Nerven",
    icon: "blackjack",
    description: "Du, der Dealer und die magische Einundzwanzig.",
    controls: "Einsatz wählen, Karte ziehen oder stehen bleiben.",
    win: "Das beste Chip-Ergebnis nach allen Händen gewinnt.",
    rules:
      "1.000 Startchips. 10–100 Einsatz; jede Hand +100 Teilnahmechips verhindert Ausscheiden. Ass 1/11; Blackjack 3:2; Gleichstand Einsatz zurück. Dealer steht auf 17, auch soft 17. Keine Geldwerte.",
    defaultRounds: 10,
    defaultSeconds: 35,
  },
  {
    id: "cards",
    name: "Farbwechsel",
    tag: "Taktik × Chaos",
    icon: "cards",
    description: "Farbe passt. Zahl passt. Hand leer!",
    controls:
      "Leuchtende passende Karte anklicken, sonst ziehen. Nach dem Joker eine der vier Farben anklicken.",
    win: "Leere Hand zuerst; danach weniger Resthand-Strafpunkte.",
    rules:
      "Eigene Variante: Ziehen beendet den Zug. Kein Stapeln. +2/+4 ziehen und aussetzen; Joker +4 jederzeit erlaubt. Wechsel bei zwei Spielern setzt den Gegner aus. Zahlen ihren Wert, Aktionen 20, Joker 50. Rundenrang wird gleichmäßig in 0–100 Rohpunkte umgerechnet; Nur wenn keine Karte mehr gezogen werden kann, zählt die Resthand. Kein Zuglimit für die Runde.",
    defaultRounds: 3,
    defaultSeconds: 15,
  },
  {
    id: "color",
    name: "Farbgedächtnis",
    tag: "Wahrnehmung × Gefühl",
    icon: "color",
    description: "Ein kurzer Blick. Wie gut bleibt die Farbe hängen?",
    controls: "Farbe ansehen, danach mit drei Reglern rekonstruieren.",
    win: "Die geringste wahrnehmungsbasierte Farbabweichung gewinnt.",
    rules:
      "Eigene Variante: Ziel 4 Sekunden sichtbar; anschließend verborgen. Genauigkeit mit CIELAB ΔE76. Keine Antwort: 0 Rundenpunkte.",
    defaultRounds: 8,
    defaultSeconds: 25,
  },
  {
    id: "size",
    name: "Größengefühl",
    tag: "Schätzen × Staunen",
    icon: "size",
    description: "Wie groß ist das wirklich? Bring es ins Verhältnis.",
    controls:
      "Objekt neben die wechselnde Referenz ziehen; Ecke ziehen oder Größenregler benutzen.",
    win: "Das beste Größenverhältnis über alle Aufgaben gewinnt.",
    rules:
      "Über 1.200 Objekte: Alltagsdinge, Brücken, Schiffe, Flugzeuge und Bauwerke. Die Abbildung zeigt ein Symbol der Kategorie; gesucht ist das genannte Maß. Wertung exp(−|ln(Schätzung/Ziel)|); doppelt und halb so groß zählen gleich. Quellen in der Auflösung.",
    defaultRounds: 8,
    defaultSeconds: 25,
  },
];
export const byId = (id: GameId) => catalog.find((g) => g.id === id)!;
export const duration = (list: Selection[], n: number) =>
  Math.round(
    list.reduce(
      (s, g) =>
        s +
        Math.max(minimumRounds(g.id), g.rounds) *
          (isBoss(g.id)
            ? Math.max(20, g.seconds) + (g.id === "dragon" ? 14 : 12) + 6
            : g.id === "code"
              ? 240
              : g.id === "auction"
                ? 20 + 35 + g.seconds + 45 + 16
                : g.id === "timing"
                  ? Math.max(45, g.seconds) + 15
                  : g.id === "bomb"
                    ? Math.max(1, n - 1) * (Math.max(15, g.seconds) + 15) + 11
                    : g.id === "chain"
                      ? 45 + Math.max(12, n * 3) * (g.seconds + 7)
                      : g.id === "categories"
                        ? g.seconds +
                          7 * (Math.max(25, Math.min(50, n * 4)) + 5) +
                          20
                        : g.id === "blocks"
                          ? 180
                          : g.id === "spectrum"
                            ? g.seconds * 2 + 20
                            : g.id === "dice"
                              ? 13 * (g.seconds + 2)
                              : g.id === "cards"
                                ? Math.max(8, n * 4) * g.seconds
                                : g.id === "fleet"
                                  ? 45 +
                                    Math.max(12, Math.ceil(n * 1.5)) *
                                      (g.seconds + 6)
                                  : g.seconds + 6) +
        (PARTY_FLOW.rules+PARTY_FLOW.countdown+PARTY_FLOW.reveal+PARTY_FLOW.standings+PARTY_FLOW.travel)/1000,
      0,
    ) / 60,
  );
export function preset(minutes: number): Selection[] {
  const ids: GameId[] =
    minutes === 20 ? ["picture", "budget", "color"] : catalog.map((g) => g.id);
  const list = ids.map((id) => {
    const g = byId(id);
    return {
      id,
      rounds: minutes === 20 ? 3 : g.defaultRounds,
      seconds: g.defaultSeconds,
    };
  });
  while (duration(list, 6) > minutes) {
    const candidates = list
      .filter((s) => s.rounds > minimumRounds(s.id))
      .sort(
        (a, b) =>
          duration([{ ...b, rounds: 1 }], 6) -
          duration([{ ...a, rounds: 1 }], 6),
      );
    if (!candidates.length) {
      // A growing catalog may no longer fit even with one round per game.
      // Keep the advertised preset duration by omitting its longest discipline.
      if (list.length <= 1) break;
      const longest = list.reduce(
        (best, game, i) =>
          duration([game], 6) > duration([list[best]], 6) ? i : best,
        0,
      );
      list.splice(longest, 1);
      continue;
    }
    candidates[0].rounds--;
  }
  let turn = 0;
  while (duration(list, 6) < minutes && turn < 300) {
    const i = turn++ % list.length;
    if (list[i].rounds >= 30 || list[i].id === "dice" || list[i].id === "cards")
      continue;
    list[i].rounds++;
    if (duration(list, 6) > minutes) list[i].rounds--;
  }
  return suggestedPartyRoute(list);
}
