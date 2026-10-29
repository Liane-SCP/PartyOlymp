"use client";
import { Avatar } from "./art";
import { byId } from "@/lib/game/catalog";
import { Die } from "./showtime";

const guides: Record<string, { steps: string[]; goal: string }> = {
  code: {
    steps: ["Farben setzen", "Gemeinsam aufdecken", "Code knacken"],
    goal: "Rot: Farbe und Position richtig. Weiß: Farbe am falschen Platz. Weniger Versuche gewinnen, gleiche Versuchszahl teilt den Platz.",
  },
  auction: {
    steps: ["Kategorie & Gebot", "Begriffe liefern", "Crew entscheidet"],
    goal: "Dein Gebot ist verbindlich: Erfolg +10 × Gebot, Fehlschlag −10 × Gebot.",
  },
  timing: {
    steps: ["Zeit merken", "Unsichtbare Uhr", "Moment treffen"],
    goal: "Jeder misst unabhängig. Alle Zeiten bleiben bis zur gemeinsamen Auflösung geheim.",
  },
  bomb: {
    steps: ["Folge lesen", "Neues Wort", "Bombe weitergeben"],
    goal: "Die geheime Lunte läuft bei jeder Übergabe weiter. Wer sie bei der Explosion hält, scheidet aus.",
  },
  chain: {
    steps: ["Reihum antworten", "Begriff prüfen", "Als Letzter bleiben"],
    goal: "Neuer passender Begriff: weiter. Wiederholung, Zeit vorbei oder abgelehnter Begriff: ausgeschieden.",
  },
  categories: {
    steps: ["Antworten schreiben", "Gemeinsam abstimmen", "Punkte einsammeln"],
    goal: "Die Crew entscheidet, ob die Begriffe passen. Einzigartige Antworten bringen mehr Punkte.",
  },
  geo: {
    steps: ["Umsehen", "Pin auf Karte setzen", "Ort festlegen"],
    goal: "Je näher du am echten Aufnahmeort liegst, desto mehr Punkte erhältst du.",
  },
  blocks: {
    steps: ["Stein platzieren", "Reihen abbauen", "Gegner überleben"],
    goal: "Zwei oder mehr Reihen schicken Strafreihen. Der letzte aktive Spieler gewinnt.",
  },
  typer: {
    steps: ["Text lesen", "Exakt abtippen", "Ins Ziel fahren"],
    goal: "Fehler korrigieren, dann weiter. Vollständig richtige Texte schlagen unvollständige.",
  },
  herd: {
    steps: ["Wie die Crew denken", "Geheim antworten", "Mehrheit finden"],
    goal: "Die eindeutig größte Antwortgruppe bekommt je 100 Punkte.",
  },
  spectrum: {
    steps: ["Hinweis geben", "Zeiger festlegen", "Ziel aufdecken"],
    goal: "Jeder Ratende setzt seinen eigenen geheimen Zeiger. Dein persönlicher Punkteschnitt entscheidet.",
  },
  dice: {
    steps: ["Würfeln", "Würfel halten", "Kategorie eintragen"],
    goal: "Sammle auf deinem Blatt die meisten Punkte. Jede Kategorie gibt es nur einmal.",
  },
  wiki: {
    steps: ["Ziel merken", "Artikellinks folgen", "Ziel erreichen"],
    goal: "Erreiche den Zielartikel vor der Crew. Mehr Klicks bedeuten nicht automatisch mehr Fortschritt.",
  },
  picture: {
    steps: ["Bild erkennen", "Zuerst buzzern", "In 8 Sekunden lösen"],
    goal: "Der erste Buzzer darf antworten. Eine falsche Antwort oder Zeitablauf sperrt dich für dieses Bild. Eine richtige Antwort beendet die Runde.",
  },
  budget: {
    steps: ["Preise schätzen", "Korb packen", "Verbindlich abgeben"],
    goal: "Mehr Produkte gewinnen – aber nur unter dem Budget. Bei Gleichstand gewinnt der vollere Geldbetrag.",
  },
  blackjack: {
    steps: ["Einsatz wählen", "Ziehen oder stehen", "Dealer vergleichen"],
    goal: "Schlage den Dealer, ohne über 21 zu kommen. Ihr spielt alle gegen denselben Dealer.",
  },
  cards: {
    steps: ["Farbe oder Zahl", "Passende Karte spielen", "Hand leeren"],
    goal: "Werde deine Karten zuerst los. Leuchtende Karten passen; sonst ziehst du eine Karte.",
  },
  fleet: {
    steps: ["Flotte verstecken", "Ziel bestätigen", "Beute kassieren"],
    goal: "Triff die versteckten Schiffe der anderen. Ein Feld kann mehrere Gegner gleichzeitig treffen.",
  },
  color: {
    steps: ["Farbe merken", "Farbe nachmischen", "Festlegen"],
    goal: "Mische die gemerkte Farbe möglichst genau nach. Das Ergebnis bleibt bis zur Auflösung geheim.",
  },
  size: {
    steps: ["Maß lesen", "Mit Referenz vergleichen", "Größe festlegen"],
    goal: "Schätze das genannte Maß. Halb so groß und doppelt so groß sind gleich weit daneben.",
  },
};
function instruction(
  g: any,
  me: string,
  now: number,
): [number, string, string] {
  const p = g.mine;
  if (!p)
    return [
      0,
      "Du bist live dabei",
      "Verfolge die Aktionen und Ergebnisse der Crew.",
    ];
  switch (g.id) {
    case "code":
      return [
        p.solved || p.gaveUp ? 2 : p.submitted ? 1 : 0,
        p.solved
          ? "Gelöst — jetzt kannst du fremde Bretter ansehen"
          : p.gaveUp
            ? "Du schaust der Crew zu"
            : p.submitted
              ? "Dein Tipp wartet auf die Crew"
              : "Setze vier Farbsteine",
        "Kein Zeitdruck. Die Trefferpunkte werden nach allen Abgaben gemeinsam aufgedeckt.",
      ];
    case "auction":
      if(g.stage==='topic')return [0,g.setter===me?'Wähle die Aufgabe für die Auktion':'Die Aufgabe wird gewählt',g.setter===me?'Wähle eine der angebotenen Kategorien. Danach beginnt das Bieten.':'Ein Crewmitglied wählt die Kategorie. Danach kannst du mitbieten.'];
      if(g.stage==='bid')return [0,g.leader===me?'Du hältst das verbindliche Höchstgebot':p.passed?'Du hast für diese Auktion gepasst':'Wie viele Begriffe schaffst du?',g.leader===me?'Du bietest erst wieder, wenn dich jemand überbietet. Dein aktuelles Gebot bleibt verbindlich.':p.passed?'Verfolge die weiteren Gebote. Nach dem Auftritt entscheidest du als Jurymitglied mit.':'Überbiete das aktuelle Gebot oder passe für diese Auktion.'];
      if(g.stage==='perform')return [1,g.leader===me?'Jetzt lieferst du deine Begriffe':'Der Höchstbietende steht auf der Bühne',g.leader===me?'Jeder verschiedene passende Begriff zählt. Anschließend prüft die Crew.':'Verfolge den Auftritt. Anschließend prüfst du die abgegebenen Begriffe im Jurybuch.'];
      if(g.stage==='judge')return [2,g.leader===me?'Die Jury prüft deinen Auftritt':p.submitted?'Dein Urteil ist abgegeben':'Prüfe die Begriffe im Jurybuch',g.leader===me?'Du stimmst über deinen eigenen Auftritt nicht ab. Die Urteile werden gemeinsam aufgedeckt.':p.submitted?'Deine Bewertungen bleiben bis zur gemeinsamen Auswertung privat.':'Bewerte jeden Begriff oder enthalte dich bewusst. Lege anschließend dein Urteil fest.'];
      return [
        g.stage === "topic" || g.stage === "bid"
          ? 0
          : g.stage === "perform"
            ? 1
            : 2,
        g.stage === "topic"
          ? "Eine Aufgabe für die Crew"
          : g.stage === "bid"
            ? "Wie viele Begriffe schaffst du?"
            : g.stage === "perform"
              ? "Jetzt zählt jeder Begriff"
              : "Gültig, ungültig oder enthalten?",
        "Gleiche Begriffe zählen nur einmal. Bei der Prüfung hat der Bieter keine Stimme.",
      ];
    case "timing":
      return [
        p.submitted ? 2 : p.startedAt != null ? 1 : 0,
        p.submitted
          ? "Deine Zeit bleibt geheim"
          : p.startedAt != null
            ? "Stoppe nach deinem Gefühl"
            : "Starte, sobald du bereit bist",
        "Klicken oder Leertaste. Ablenkungen zeigen niemals die echte Zeit.",
      ];
    case "bomb":
      return [
        g.stage === "judge" ? 1 : 2,
        g.stage === "judge"
          ? "Die Crew prüft, die Lunte pausiert"
          : g.turnId === me
            ? "Tippe ein neues Wort und gib die Bombe weiter"
            : "Behalte die Reihenfolge im Blick",
        "Unbekannte Wörter prüft die Crew. Wiederholungen bleiben gesperrt.",
      ];
    case "chain":
      return [
        g.stage === "answer" ? 0 : g.stage === "turnReveal" ? 2 : 1,
        g.stage === "answer"
          ? g.turnId === me
            ? "Du bist dran!"
            : "Die Kette geht reihum"
          : g.stage === "challenge"
            ? "Die Crew stimmt ab"
            : "Jeder Begriff wird geprüft",
        "Auch ausgeschiedene Spieler dürfen anfechten und abstimmen. Niemand prüft seinen eigenen Begriff.",
      ];
    case "categories":
      if(g.stage==='answer'&&p.submitted)return [0,'Dein Schreibblatt ist abgegeben','Deine Antworten stehen fest. Die gemeinsame Prüfung beginnt, sobald die Schreibphase endet.'];
      if(g.stage==='vote'&&(p.voteCommitted||g.progress?.[me]?.voted))return [1,'Deine Stimmen sind abgegeben','Die aktuelle Kategorie wird gemeinsam ausgewertet. Danach geht es zur nächsten Kategorie.'];
      return [
        g.stage === "answer" ? 0 : g.stage === "vote" ? 1 : 2,
        g.stage === "answer"
          ? "Sieben Kategorien, ein gemeinsamer Buchstabe"
          : g.stage === "vote"
            ? "Welche Antworten sind gültig?"
            : "Eure Stimmen entscheiden",
        "20 allein gültig · 10 einzigartig · 5 mehrfach genannt · 0 ungültig. Bei Gleichstand ist die Antwort ungültig.",
      ];
    case "geo":
      return [
        p.submitted ? 2 : 1,
        p.submitted
          ? "Dein Ort ist festgelegt"
          : "Welche Hinweise verrät die Umgebung?",
        "Panorama ziehen und zoomen. Dann auf der Weltkarte einen Pin setzen und bestätigen.",
      ];
    case "blocks":
      return [
        p.alive ? 1 : 2,
        p.alive
          ? "Lücken schließen und Reihen abbauen"
          : "Ausgeschieden – die Crew spielt weiter",
        "Leertaste lässt den Stein auf die Landehilfe fallen. Mit C hältst du einen Stein für später.",
      ];
    case "typer":
      return [
        p.submitted ? 2 : 1,
        p.submitted ? "Im Ziel – stark getippt!" : "Tippe den Text exakt ab",
        "Grün ist richtig, Rot muss korrigiert werden. Die Wagen zeigen den Fortschritt deiner Crew.",
      ];
    case "herd":
      return [
        p.submitted ? 2 : 1,
        p.submitted
          ? "Dein Gedanke ist versiegelt"
          : "Was werden die anderen antworten?",
        "Eine kurze, alltägliche Antwort ist oft besser als eine ausgefallene Idee.",
      ];
    case "spectrum":
      if(g.stage==='clue'&&g.psychic!==me)return [0,'Der Hinweisgeber sucht einen Begriff','Nur der Hinweisgeber kennt das Ziel. Dein eigener Zeiger wird nach seinem Hinweis freigegeben.'];
      if(g.stage==='guess'&&g.psychic===me)return [1,'Dein Hinweis ist bei der Crew','Die anderen setzen ihre geheimen Zeiger. Du gibst in dieser Runde keinen eigenen Tipp ab.'];
      if(g.stage==='guess'&&p.submitted)return [1,'Dein Zeiger ist versiegelt','Dein Tipp steht fest. Die Auflösung beginnt gemeinsam mit der Crew.'];
      return [
        g.stage === "clue" ? 0 : g.stage === "guess" ? 1 : 2,
        g.stage === "clue"
          ? "Ein Begriff für den geheimen Zielbereich"
          : g.stage === "guess"
            ? "Wo gehört der Hinweis auf die Skala?"
            : "Alle Zeiger werden aufgedeckt",
        "Nur der Hinweisgeber kennt das Ziel. Alle anderen tippen unabhängig und sammeln eigene Punkte.",
      ];
    case "dice":
      return p.submitted || g.stage === "turnReveal"
        ? [
            2,
            "Eintrag gesichert",
            "Sobald alle fertig sind, würfelt ihr gemeinsam weiter.",
          ]
        : p.rolls
          ? [
              p.rolls < 3 ? 1 : 2,
              p.rolls < 3
                ? "Gute Würfel halten. Den Rest neu würfeln."
                : "Jetzt eine Kategorie eintragen",
              "Die Zahl rechts zeigt, wie viele Punkte dein aktueller Wurf bringt. Einträge sind endgültig.",
            ]
          : [
              0,
              "Dein erster Wurf wartet",
              "Du hast bis zu drei Würfe. Nach jedem Wurf kannst du Würfel festhalten.",
            ];
    case "blackjack":
      return !p.bet
        ? [
            0,
            "Setze Chips, um deine Karten zu bekommen",
            "Wähle einen Einsatz und bestätige ihn. Danach entscheidest du über deine Hand.",
          ]
        : p.stood
          ? [
              2,
              "Deine Hand ist fertig",
              "Der Dealer deckt auf, sobald alle fertig sind oder die Zeit abläuft.",
            ]
          : [
              1,
              "Näher an 21 – ohne darüber zu kommen",
              "Ziehen gibt dir eine weitere Karte. Stehen sichert deinen aktuellen Wert.",
            ];
    case "cards":
      return [
        1,
        g.turnId === me
          ? "Dein Zug: spiele eine leuchtende Karte"
          : "Die Crew ist am Zug",
        g.turnId === me
          ? "Keine passende Karte? Eine ziehen. Beim Joker wählst du anschließend die Farbe."
          : "Oben siehst du, wer dran ist und was die letzte Karte ausgelöst hat.",
      ];
    case "fleet":
      return g.stage === "placement"
        ? [
            0,
            p.submitted
              ? "Deine Flotte ist startklar"
              : "Platziere erst deine drei Schiffe",
            "Andere Spieler sehen deine Positionen nicht. Bestätige die Flotte, wenn alles sitzt.",
          ]
        : g.stage === "volleyReveal"
          ? [
              2,
              "Die Crew feuert gleichzeitig",
              "Die Salvenliste zeigt, wer getroffen und Beute gesammelt hat.",
            ]
          : [
              1,
              p.submitted
                ? "Dein Schuss ist bereit"
                : "Ein Feld wählen, dann den Schuss bestätigen",
              "Alle schießen gleichzeitig. Bereits beschossene Felder bleiben auf deiner Karte markiert.",
            ];
    case "wiki":
      return p.arrival
        ? [
            2,
            "Im Ziel! Schau der Crew beim Rennen zu.",
            "Die Zeit ist gespeichert. Das Rennen endet, sobald alle ankommen oder die Zeit abläuft.",
          ]
        : [
            1,
            "Finde einen Link, der dich Richtung Ziel bringt",
            "Grüne Links im Artikel öffnen den nächsten Artikel. Dein Ziel bleibt oben sichtbar.",
          ];
    case "picture":
      return p.correct
        ? [
            2,
            "Erkannt! Deine Punkte sind gesichert.",
            "Du hast die Runde entschieden. Die Lösung erscheint gemeinsam.",
          ]
        : [
            1,
            p.buzzedOut ? "Für dieses Bild ausgeschieden" : g.buzzer===me ? "Deine 8 Sekunden laufen!" : g.buzzer ? "Ein anderer Spieler ist am Buzzer" : "Erkannt? Jetzt buzzern!",
            p.buzzedOut ? "Nach einem Fehler oder Zeitablauf dürfen nur die anderen noch antworten." : g.buzzer===me ? "Tippe deinen Begriff und bestätige mit Enter. Bei Ablauf zählt deine vorhandene Antwort." : g.buzzer ? "Nur der aktive Buzzer darf antworten. Bei einem Fehlversuch oder Zeitablauf wird das Bild wieder freigegeben." : "Wer zuerst buzzert, bekommt das Antwortfeld. Das Bild bleibt währenddessen stehen.",
          ];
    case "color":
      if (now < g.previewUntil)
        return [
          0,
          "Präg dir diese Farbe ein",
          "Gleich verschwindet sie. Merke dir Helligkeit und Farbton.",
        ];
      break;
  }
  if (p.submitted)
    return [
      2,
      "Deine Antwort ist gesichert",
      "Verfolge unten, wer noch überlegt. Die Auflösung beginnt gemeinsam.",
    ];
  if (g.id === "budget")
    return [
      1,
      "Welche Produkte passen zusammen ins Budget?",
      "Die Preise sind verborgen. Klicke Produkte zum Einpacken oder Entfernen; danach den Korb bestätigen.",
    ];
  if (g.id === "color")
    return [
      1,
      "Mische deine Erinnerung nach",
      "Die farbigen Regler verändern Rot, Grün und Blau. Deine Vorschau reagiert sofort.",
    ];
  return [
    1,
    "Wie groß ist das Objekt im Vergleich?",
    "Verschiebe das Objekt und ziehe seine Ecke. Mit dem Regler oder ×½ / ×2 kannst du fein abstimmen.",
  ];
}
export function PlayGuide({ g, me, now }: { g: any; me: string; now: number }) {
  const guide = guides[g.id];
  if (!guide) return null;
  const [step, title, detail] = instruction(g, me, now);
  return (
    <section className="play-guide" aria-label="Dein nächster Schritt">
      <div className="guide-steps">
        {guide.steps.map((label, i) => (
          <span
            key={label}
            className={i === step ? "current" : i < step ? "complete" : ""}
          >
            <b>{i < step ? "✓" : i + 1}</b>
            {label}
          </span>
        ))}
      </div>
      <div className="guide-copy" key={`${g.stage}:${step}:${title}`}>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <details className="guide-rules">
        <summary>So gewinnst du · Regeln</summary>
        <p>{guide.goal}</p>
        <p>{byId(g.id)?.rules}</p>
      </details>
    </section>
  );
}
function crewState(
  g: any,
  id: string,
  now: number,
): {
  text: string;
  detail?: string;
  done?: boolean;
  active?: boolean;
  value?: string;
} {
  const done = !!g.submitted?.[id];
  switch (g.id) {
    case "auction":
      return {
        text:
          g.stage === "topic"
            ? id === g.setter
              ? "Wählt die Aufgabe"
              : "Wartet auf die Kategorie"
            : g.stage === "bid"
              ? id === g.leader
                ? "Höchstgebot"
                : g.roster[id].passed
                  ? "Ausgestiegen"
                  : "Kann bieten"
              : g.stage === "perform"
                ? id === g.leader
                  ? "Zählt Begriffe auf"
                  : "Schaut zu und prüft danach"
                : id === g.leader
                  ? "Wartet auf das Urteil"
                  : g.roster[id].submitted
                    ? "Bewertung versiegelt"
                    : "Bewertet die Begriffe",
        active: id === g.leader,
        done: g.stage === "judge" && g.roster[id].submitted,
      };
    case "timing":
      return {
        text: g.roster[id].submitted
          ? "Stopp versiegelt"
          : g.roster[id].started
            ? "Vertraut seinem Gefühl"
            : "Merkt sich die Zielzeit",
        done: g.roster[id].submitted,
        active: g.roster[id].started && !g.roster[id].submitted,
      };
    case "bomb":
      return {
        text:
          g.stage === "judge"
            ? id === g.turnId
              ? "Wartet auf Prüfung"
              : g.roster[id].voted
                ? "Stimme versiegelt"
                : "Prüft das Wort"
            : !g.roster[id].alive
              ? "Ausgeschieden · prüft mit"
              : id === g.turnId
                ? "Hält die Bombe"
                : "Bereit zur Übergabe",
        active: g.stage === "word" && id === g.turnId,
        done: !g.roster[id].alive,
        value: `${g.roster[id].words}`,
      };
    case "chain":
      return {
        text:
          g.stage === "challenge"
            ? id === g.turnId
              ? "Wartet auf das Urteil"
              : g.roster[id].voted
                ? "Stimme abgegeben"
                : "Stimmt ab"
            : g.stage === "review"
              ? id === g.turnId
                ? "Antwort wird geprüft"
                : g.roster[id].approved
                  ? "Bestätigt"
                  : "Prüft neuen Begriff"
              : id === g.turnId && g.roster[id].alive
                ? "Am Zug"
                : !g.roster[id].alive
                  ? "Ausgeschieden · prüft mit"
                  : "Wartet auf den Zug",
        detail: `${g.roster[id].words} gültige Begriffe`,
        active: id === g.turnId && g.roster[id].alive,
        done: !g.roster[id].alive,
      };
    case "categories":
      return {
        text:
          g.stage === "answer"
            ? g.progress[id]?.submitted
              ? "Blatt abgegeben"
              : "Sammelt Wörter"
            : g.stage === "vote"
              ? g.progress[id]?.voted
                ? "Stimmen abgegeben"
                : "Bewertet Antworten"
              : "Sieht das Ergebnis",
        detail:
          g.stage === "answer"
            ? `${g.progress[id]?.filled ?? 0} / 7 ausgefüllt`
            : g.category,
        done,
      };
    case "geo":
      return { text: done ? "Ort festgelegt" : "Erkundet die Umgebung", done };
    case "blocks":
      return {
        text: g.fields?.[id]?.alive
          ? "Stapelt & greift an"
          : `Platz ${g.fields?.[id]?.place ?? "–"}`,
        value: `${g.fields?.[id]?.lines ?? 0} Reihen`,
        done: !g.fields?.[id]?.alive,
      };
    case "typer":
      return {
        text: g.racers?.[id]?.finishedAt != null ? "Im Ziel" : "Tippt",
        value: `${Math.round((100 * (g.racers?.[id]?.progress ?? 0)) / Math.max(1, g.text?.length ?? 1))}%`,
        done,
      };
    case "herd":
      return { text: done ? "Antwort versiegelt" : "Denkt wie die Crew", done };
    case "spectrum":
      return {
        text:
          g.psychic === id
            ? "Hinweisgeber"
            : done
              ? "Tipp versiegelt"
              : g.stage === "clue"
                ? "Wartet auf den Hinweis"
                : "Stellt eigenen Zeiger ein",
        active: g.psychic === id,
        done,
      };
    case "dice": {
      const p = g.opponents?.[id];
      return {
        text: p?.submitted ? "Eingetragen" : `${p?.rolls ?? 0}/3 Würfe`,
        detail: p?.submitted
          ? `${p.lastEntry?.category ?? "Kategorie"} · ${p.lastEntry?.value ?? 0} Punkte`
          : "Würfelt und wählt",
        done: p?.submitted,
        value: `${p?.total ?? 0} P.`,
      };
    }
    case "blackjack": {
      const p = g.status?.[id];
      return {
        text: !p?.bet
          ? "Wählt Einsatz"
          : p.value > 21
            ? "Überkauft"
            : p.stood
              ? "Bleibt stehen"
              : "Spielt seine Hand",
        detail: p?.bet
          ? `${p.value ?? "?"} auf der Hand · ${p.bet} gesetzt`
          : "Noch keine Karten",
        done: p?.stood,
        value: p?.bet ? `${p.value ?? "?"}` : "—",
      };
    }
    case "cards":
      return {
        text:
          g.turnId === id
            ? "Am Zug"
            : g.counts?.[id] === 1
              ? "Letzte Karte!"
              : "Wartet auf den Zug",
        value: `${g.counts?.[id] ?? 0}`,
        detail: "Karten auf der Hand",
        active: g.turnId === id,
      };
    case "wiki": {
      const p = g.racers?.[id];
      return {
        text: p?.arrived
          ? "Ziel erreicht!"
          : `${p?.clicks ?? 0} ${p?.clicks === 1 ? "Klick" : "Klicks"}`,
        detail: p?.article ?? g.start,
        done: p?.arrived,
        value: p?.arrived ? `${(p.elapsed / 1000).toFixed(1)} s` : "↗",
      };
    }
    case "picture": {
      const p = g.guesses?.[id];
      return {
        text: done
          ? "Richtig erkannt!"
          : p?.attempts
            ? `${p.attempts} ${p.attempts === 1 ? "Versuch" : "Versuche"}`
            : g.buzzer===id ? "Hat gebuzzert" : "Bereit zum Buzzern",
        detail: done ? "Runde entschieden" : p?.attempts ? "Für dieses Bild ausgeschieden" : g.buzzer===id ? "8 Sekunden zum Antworten" : "Wartet auf den Buzzer",
        done,
      };
    }
    case "fleet": {
      const row =
        g.stage === "volleyReveal"
          ? g.reveal?.players?.find((p: any) => p.id === id)
          : null;
      return {
        text:
          g.stage === "placement"
            ? done
              ? "Flotte startklar"
              : "Platziert Schiffe"
            : row
              ? row.hits
                ? `${row.hits} Treffer!`
                : row.missed
                  ? "Kein Schuss"
                  : "Wasser"
              : done
                ? "Schuss bereit"
                : "Sucht ein Ziel",
        detail:
          g.stage === "placement"
            ? "Positionen geheim"
            : `${g.remaining?.[id] ?? 0} Schiffe intakt`,
        value:
          g.stage !== "placement"
            ? `${Math.round(g.scores?.[id] ?? 0)} Beute`
            : undefined,
        done,
      };
    }
    case "color":
      return {
        text:
          now < g.previewUntil
            ? "Prägt sich die Farbe ein"
            : done
              ? "Farbe festgelegt"
              : "Mischt seine Farbe",
        detail: "Farbe bleibt geheim",
        done,
      };
    case "budget":
      return {
        text: done ? "Korb abgegeben" : "Packt seinen Korb",
        detail: "Produkte bleiben geheim",
        done,
      };
    default:
      return {
        text: done ? "Größe festgelegt" : "Vergleicht die Größen",
        detail: "Schätzung bleibt geheim",
        done,
      };
  }
}
const verbs: Record<string, string> = {
  dice: "hat gewürfelt",
  correct: "hat es geschafft!",
  wrong: "versucht es weiter",
  confirm: "hat bestätigt",
  navigate: "öffnet den nächsten Artikel",
  card: "hat eine Kartenaktion gespielt",
  stand: "bleibt stehen",
  score: "hat eingetragen",
};
export function LiveCrew({
  room,
  me,
  now,
}: {
  room: any;
  me: string;
  now: number;
}) {
  const g = room.game;
  const players = room.players.filter((p: any) =>
    room.participantIds.includes(p.id),
  );
  const rows = players.map((p: any) => ({ p, state: crewState(g, p.id, now) }));
  const done = rows.filter((x: any) => x.state.done).length;
  const latest = g.events
    ?.filter((e: any) => e.round === g.round && e.player && verbs[e.type])
    .at(-1);
  const person = players.find((p: any) => p.id === latest?.player);
  return (
    <section className="live-crew" aria-label="Was die Crew gerade macht">
      <div className="live-crew-heading">
        <strong>
          <i />
          Die Crew · live
        </strong>
        <span>
          {g.id === "cards"
            ? "Reihum am Zug"
            : `${done}/${players.length} fertig`}
        </span>
      </div>
      <div
        className="live-crew-track"
        tabIndex={0}
        aria-label="Spielerstatus, seitlich scrollbar"
      >
        {rows.map(({ p, state }: any) => (
          <article
            key={p.id}
            className={`live-player ${state.done ? "is-done" : ""} ${state.active ? "is-active" : ""}`}
            style={{ "--player-color": p.color } as any}
          >
            <header>
              <Avatar avatar={p.avatar} look={p.look} color={p.color} />
              <strong>{p.id === me ? "Du" : p.name}</strong>
              {state.value && <b key={state.value}>{state.value}</b>}
            </header>
            <div
              key={`${state.text}:${state.detail}`}
              className="live-player-state"
            >
              <span>
                {state.done ? "✓ " : state.active ? "▶ " : ""}
                {state.text}
              </span>
              <small title={state.detail}>{state.detail}</small>
            </div>
            {g.id === "dice" && g.opponents?.[p.id]?.rolls > 0 && (
              <div className="live-dice">
                {g.opponents[p.id].dice.map((v: number, i: number) => (
                  <Die
                    key={i}
                    value={v}
                    held={g.opponents[p.id].held[i]}
                    roll={g.opponents[p.id].rollId ?? 0}
                    mini
                  />
                ))}
              </div>
            )}
            {g.id === "blackjack" && (
              <div className="live-hand" aria-label={`Karten von ${p.name}`}>
                {g.status?.[p.id]?.hand?.map((c: any, i: number) => (
                  <span
                    key={`${i}:${c.rank}:${c.suit}`}
                    className={c.suit === 1 || c.suit === 2 ? "red-suit" : ""}
                  >
                    {
                      [
                        "A",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "10",
                        "J",
                        "Q",
                        "K",
                      ][c.rank - 1]
                    }
                    {["♠", "♥", "♦", "♣"][c.suit]}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      {latest && person && (
        <div className="crew-event" key={latest.id} role="status">
          <span>↳</span> {person.id === me ? "Du" : person.name}{" "}
          {person.id === me
            ? (
                {
                  dice: "hast gewürfelt",
                  correct: "hast es geschafft!",
                  wrong: "kannst es erneut versuchen",
                  confirm: "hast bestätigt",
                  navigate: "öffnest den nächsten Artikel",
                  card: "hast eine Kartenaktion gespielt",
                  stand: "bleibst stehen",
                  score: "hast eingetragen",
                } as any
              )[latest.type]
            : verbs[latest.type]}
        </div>
      )}
    </section>
  );
}
