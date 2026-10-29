"use client";

import { byId } from "@/lib/game/catalog";
import { raceFinishes } from "@/lib/race-presentation";
import { LiveCrew } from "./play-context";

/** Describe public play without guessing private answers, targets or timing. */
function moment(game: any, name: (id: string) => string, now: number): [string, string] {
  switch (game.id) {
    case "code":
      return ["Die Crew knackt den Tresor", "Farbsteine werden geheim gesetzt und gemeinsam geprüft. Gelöste Werkbänke bleiben sichtbar."];
    case "auction":
      if (game.stage === "topic") return ["Eine Aufgabe für die Auktion", "Gleich bietet die Crew darauf, wie viele passende Begriffe sie liefern kann."];
      if (game.stage === "bid") return ["Die Gebote steigen", "Das höchste verbindliche Gebot führt auf die Bühne."];
      if (game.stage === "perform") return [`${name(game.leader)} steht auf der Bühne`, "Jetzt müssen genügend verschiedene Begriffe zusammenkommen. Anschließend prüft die Jury."];
      return ["Die Jury prüft die Begriffe", "Der Bieter wartet auf das Urteil. Die Bewertungen bleiben bis zur Auswertung privat."];
    case "bomb":
      if (game.stage === "judge") return ["Die Crew prüft das Wort", "Während der Prüfung pausiert die geheime Lunte. Danach geht die Bombe weiter."];
      if (game.stage === "explosion") return ["Die Bombe ist explodiert", "Die übrige Crew spielt gleich weiter. Ausgeschiedene Spieler bleiben bei der Wortprüfung dabei."];
      return [`${name(game.turnId)} hält die Bombe`, "Ein neues gültiges Wort gibt die Bombe weiter. Die verbleibende Zündzeit bleibt geheim."];
    case "chain":
      if (game.stage === "review") return [`Die Antwort von ${name(game.turnId)} wird geprüft`, "Erst ein bestätigter Begriff verlängert den gemeinsamen Wortpfad."];
      if (game.stage === "challenge") return ["Die Crew stimmt über den Begriff ab", "Das Urteil entscheidet, ob die Expedition weitergeht oder jemand ausscheidet."];
      if (game.stage === "turnReveal") return ["Der Zug ist entschieden", "Gleich ist der nächste Spieler an der Reihe."];
      return [`${name(game.turnId)} ist am Zug`, "Die Crew sucht reihum neue Begriffe zum gemeinsamen Thema."];
    case "cards":
      return [`${name(game.turnId)} ist am Zug`, "Die Tischrunde zeigt Ablage, Spielrichtung und Kartenanzahl. Die Handkarten bleiben privat."];
    case "categories":
      return game.stage === "answer"
        ? ["Die Crew füllt ihre sieben Kategorien", "Die Blätter bleiben bis zur gemeinsamen Bewertung privat."]
        : ["Die Crew bewertet ihre Antworten", "Jetzt entscheiden die Stimmen über gültige Begriffe und Mehrfachnennungen."];
    case "spectrum":
      return game.stage === "clue"
        ? [`${name(game.psychic)} gibt den Hinweis`, "Nur der Hinweisgeber kennt den Zielbereich. Danach setzt jeder seinen eigenen Zeiger."]
        : ["Die Crew setzt ihre Zeiger", "Alle Tipps bleiben bis zur Aufdeckung geheim."];
    case "typer": {
      const finishes = raceFinishes(game);
      return finishes.length
        ? [`${finishes.length} / ${Object.keys(game.racers ?? {}).length} im Ziel`, "Die bestätigten Zieleinläufe sind gesichert. Die übrigen Fahrzeuge sind noch unterwegs."]
        : ["Das Rennen läuft", "Jedes richtig getippte Zeichen bringt das eigene Fahrzeug weiter."];
    }
    case "wiki":
      return ["Die Crew reist durch Wikipedia", "Verfolge die aktuellen Artikel und Zielankünfte. Jeder wählt seinen eigenen Weg."];
    case "timing":
      return ["Jeder vertraut seinem Zeitgefühl", "Alle messen unabhängig. Zeiten und Abweichungen werden gemeinsam aufgedeckt."];
    case "herd":
      return ["Welcher Gedanke verbindet die Crew?", "Die Antworten bleiben versiegelt, bis alle abgegeben haben oder die Denkzeit endet."];
    case "color":
      return now < game.previewUntil
        ? ["Die Crew merkt sich die Zielprobe", "Gleich schließt die Probe und jeder mischt seine Farbe aus der Erinnerung."]
        : ["Die Crew mischt aus der Erinnerung", "Die Mischungen bleiben bis zum gemeinsamen Vergleich privat."];
    case "size":
      return ["Die Crew vergleicht die Maßstäbe", "Jeder schätzt das genannte Maß. Die echten Größen erscheinen bei der Auflösung."];
    case "geo":
      return ["Wo wurde dieses Bild aufgenommen?", "Die Crew sucht Hinweise im Panorama und legt ihre Orte unabhängig fest."];
    case "budget":
      return ["Die Crew packt ihre Einkaufskörbe", "Auswahl und geschätzte Preise bleiben privat. An der Kasse zeigt sich, wer im Budget bleibt."];
    case "dice":
      if (game.stage === "turnReveal") return ["Die Einträge sind gesichert", "Die Crew vergleicht ihre Kategorien. Gleich beginnt der nächste gemeinsame Wurf."];
      return ["Die Würfelrunde läuft", "Jeder würfelt am eigenen Platz, hält passende Augen und trägt eine Kategorie ein."];
    case "blackjack":
      return ["Die Crew spielt gegen den Dealer", "Alle entscheiden unabhängig über Ziehen und Stehen. Die verdeckte Dealerkarte bleibt bis zur Auflösung geheim."];
    default:
      return ["Die Crew spielt weiter", "Verfolge die Aktionen auf der Bühne und die öffentlichen Spielstände."];
  }
}

export function SpectatorPanel({ room, me, now }: { room: any; me: string; now: number }) {
  const game = room.game;
  const name = (id: string) => room.players.find((player: any) => player.id === id)?.name ?? "Die Crew";
  const [title, detail] = moment(game, name, now);
  const abandoned = !!game.mine?.abandoned;
  return (
    <section className="party-spectator-panel" aria-label={`${byId(game.id)?.name ?? "Spiel"} live verfolgen`}>
      <span>{abandoned ? "DEIN PLATZ BLEIBT ERHALTEN" : "DU SCHAUST LIVE ZU"}</span>
      <h2 aria-live="polite">{title}</h2>
      <p>{detail}</p>
      <details className="party-crew-progress">
        <summary>Was macht die Crew?</summary>
        <LiveCrew room={room} me={me} now={now} />
      </details>
      <small>{abandoned ? "Die Wiederbeitrittsfrist dieses Spiels ist vorbei. Beim nächsten Spiel bist du wieder dabei." : "Bei der nächsten Olympiade kannst du mitspielen."}</small>
    </section>
  );
}
