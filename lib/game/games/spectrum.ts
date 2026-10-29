import {
  base,
  commonView,
  event,
  finishRound,
  nextOrDone,
  pick,
} from "../common";
import { spectrumAxes } from "../party-content";
import { spectrumClueError } from "../spectrum-clue";
import {
  ensure,
  int,
  type Context,
  type GameModule,
  type GameState,
} from "../types";
export function spectrumPoints(guess: number, target: number) {
  const d = Math.abs(guess - target);
  return d <= 2 ? 4 : d <= 6 ? 3 : d <= 10 ? 2 : 0;
}
function next(g: GameState, c: Context) {
  g.public = {
    psychic: c.ids[g.round % c.ids.length],
    axis: pick(spectrumAxes, c),
    clue: "",
    individual: true,
  };
  g.secret.target = 10 + Math.floor(c.random() * 81);
  g.stage = "clue";
  g.deadline = c.now + c.settings.seconds * 1000;
  for (const id of c.ids)
    Object.assign(g.players[id], { submitted: false, dial: 50, guess: null });
}
function resolve(g: GameState, c: Context, missingClue = false) {
  const players = c.ids.map((id) => {
    const p = g.players[id],
      psychic = id === g.public.psychic,
      eligible = !psychic && !missingClue,
      score =
        eligible && p.guess !== null
          ? spectrumPoints(p.guess, g.secret.target)
          : 0;
    if (eligible) {
      p.opportunities = (p.opportunities ?? 0) + 1;
      p.total = (p.total ?? 0) + score;
    }
    g.scores[id] = p.opportunities
      ? Math.round((1000 * p.total) / p.opportunities)
      : 0;
    const row = {
      id,
      score,
      psychic,
      guess: p.guess,
      distance: p.guess === null ? null : Math.abs(p.guess - g.secret.target),
      average: p.opportunities ? p.total / p.opportunities : 0,
    };
    (p.history ??= []).push(row);
    return row;
  });
  finishRound(g, c, {
    players,
    target: g.secret.target,
    missingClue,
    individual: true,
  });
  event(g, 'spectrumReveal', undefined, c.now);
}
export const spectrum: GameModule = {
  init(c) {
    const g = base("spectrum", c);
    g.totalRounds = Math.max(2, c.settings.rounds);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    ensure(
      c.ids.includes(id) &&
        (a.round === undefined || a.round === g.round + 1) &&
        c.now < g.deadline,
      "Diese Eingabephase ist vorbei.",
    );
    const p = g.players[id];
    if (a.type === "clue") {
      ensure(
        g.stage === "clue" && g.public.psychic === id,
        "Nur der Hinweisgeber nennt den Begriff.",
      );
      ensure(typeof a.clue === "string", "Gib einen Begriff ein.");
      ensure(!spectrumClueError(a.clue), spectrumClueError(a.clue));
      g.public.clue = a.clue.trim();
      g.stage = "guess";
      g.deadline = c.now + c.settings.seconds * 1000;
      p.participated = true;
      event(g, "confirm", id);
      return;
    }
    ensure(
      (a.type === "dial" || a.type === "lock") &&
        g.stage === "guess" &&
        id !== g.public.psychic &&
        !p.submitted,
      "Nur die anderen Spieler geben je einen eigenen Tipp ab.",
    );
    p.dial = int(a.value, 0, 100);
    if (a.type === "lock") {
      p.guess = p.dial;
      p.submitted = true;
      p.participated = true;
      event(g, "confirm", id);
      if (
        c.ids
          .filter((pid) => pid !== g.public.psychic)
          .every((pid) => g.players[pid].submitted || g.players[pid].abandoned)
      )
        resolve(g, c);
    }
  },
  tick(g, c) {
    // A room can survive a deployment. Restart legacy team matches fairly instead
    // of leaving their obsolete side-bet phase stuck forever.
    if (!g.public.individual && g.stage !== "done") {
      g.round = 0;
      g.totalRounds = Math.max(2, g.totalRounds);
      g.results = [];
      for (const id of c.ids) {
        const abandoned = g.players[id]?.abandoned;
        g.players[id] = { participated: false, abandoned };
        g.scores[id] = 0;
      }
      next(g, c);
      g.public.notice =
        "Spectrum spielt jetzt jeder für sich. Die Partie startet mit persönlichen Zeigern neu.";
      return;
    }
    if (c.now >= g.deadline) {
      if (g.stage === "clue") resolve(g, c, true);
      else if (g.stage === "guess") resolve(g, c);
    }
    nextOrDone(g, c, () => next(g, c));
  },
  view(g, id) {
    const v = commonView(g, id);
    if (
      g.public.psychic === id ||
      g.stage === "roundReveal" ||
      g.stage === "done"
    )
      v.target = g.secret.target;
    return v;
  },
  results(g, c) {
    return c.ids.map((id) => ({
      id,
      raw: g.scores[id],
      valid: !!g.players[id].participated && !!g.players[id].opportunities,
      detail: g.players[id].history ?? [],
    }));
  },
};
