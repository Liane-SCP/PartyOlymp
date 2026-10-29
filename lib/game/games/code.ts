import {
  base,
  commonView,
  event,
  finishRound,
  nextOrDone,
  pick,
} from "../common";
import { codeFeedback } from "../code-feedback";
import {
  ensure,
  type Context,
  type GameModule,
  type GameState,
} from "../types";
const combinations = Array.from({ length: 1296 }, (_, n) => ({
  id: `code-${n}`,
  colors: Array.from({ length: 4 }, (_, i) => Math.floor(n / 6 ** i) % 6),
}));
function next(g: GameState, c: Context) {
  g.secret.code = [...pick(combinations, c).colors];
  g.public = { turn: 1, positions: 4, colors: 6, firstSolvedAt:null, feedbackAt:null };
  g.stage = "guess";
  g.deadline = 0;
  for (const id of c.ids)
    Object.assign(g.players[id], {
      guesses: [],
      pending: null,
      solved: false,
      gaveUp: !!g.players[id].abandoned,
      submitted: !!g.players[id].abandoned,
    });
}
function settle(g: GameState, c: Context) {
  if (!c.ids.every((id) => g.players[id].submitted || g.players[id].abandoned))
    return;
  for (const id of c.ids) {
    const p = g.players[id];
    if (p.pending && !p.abandoned) {
      const feedback = codeFeedback(g.secret.code, p.pending);
      p.guesses.push({ turn: g.public.turn, colors: p.pending, ...feedback });
      p.solved = feedback.exact === 4;
      if(p.solved&&g.public.firstSolvedAt==null)g.public.firstSolvedAt=c.now;
    }
    p.pending = null;
    if (p.abandoned) p.gaveUp = true;
    p.submitted = p.solved || p.gaveUp;
  }
  g.public.feedbackAt=c.now;
  event(g, "codeFeedback");
  if (c.ids.every((id) => g.players[id].submitted)) {
    const players = c.ids.map((id) => {
      const p = g.players[id],
        attempts = p.guesses.length;
      p.solvedRounds = (p.solvedRounds ?? 0) + (p.solved ? 1 : 0);
      p.totalGuesses = (p.totalGuesses ?? 0) + (p.solved ? attempts : 0);
      // Lexicographic: more solved rounds first, then fewer guesses. Never time.
      g.scores[id] =
        p.solvedRounds * (1296 * g.totalRounds + 1) - p.totalGuesses;
      const row = {
        id,
        solved: p.solved,
        gaveUp: p.gaveUp,
        attempts,
        solvedRounds: p.solvedRounds,
        totalGuesses: p.totalGuesses,
      };
      (p.history ??= []).push(row);
      return row;
    });
    finishRound(g, c, { code: g.secret.code, players });
    g.deadline = c.now + 15000;
  } else g.public.turn++;
}
export const code: GameModule = {
  init(c) {
    const g = base("code", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    ensure(
      c.ids.includes(id) && a.round === g.round + 1 && g.stage === "guess",
      "Diese Coderunde ist vorbei.",
    );
    ensure(
      Number.isSafeInteger(a.turn) && a.turn > 0 && a.turn <= g.public.turn,
      "Dieser Zug ist nicht aktuell.",
    );
    if (a.turn < g.public.turn) return;
    const p = g.players[id];
    ensure(!p.solved && !p.gaveUp && !p.abandoned, "Du schaust jetzt zu.");
    if (p.submitted) return;
    if (a.type === "giveUp") {
      p.gaveUp = true;
      p.submitted = true;
      p.participated = true;
      event(g, "confirm", id);
      settle(g, c);
      return;
    }
    ensure(
      a.type === "guess" &&
        Array.isArray(a.colors) &&
        a.colors.length === 4 &&
        a.colors.every(
          (v: unknown) =>
            Number.isInteger(v) && Number(v) >= 0 && Number(v) < 6,
        ),
      "Wähle vier Farben.",
    );
    ensure(
      !p.guesses.some((r: any) =>
        r.colors.every((v: number, i: number) => v === a.colors[i]),
      ),
      "Diese Kombination hast du bereits geprüft.",
    );
    p.pending = [...a.colors];
    p.submitted = true;
    p.participated = true;
    event(g, "confirm", id);
    settle(g, c);
  },
  tick(g, c) {
    if (g.stage === "guess") {
      for (const id of c.ids)
        if (g.players[id].abandoned)
          Object.assign(g.players[id], {
            gaveUp: true,
            submitted: true,
            pending: null,
          });
      settle(g, c);
    }
    nextOrDone(g, c, () => next(g, c));
  },
  view(g, id) {
    const v = commonView(g, id),
      canSpectate =
        !g.players[id] ||
        !!(
          g.players[id].solved ||
          g.players[id].gaveUp ||
          g.players[id].abandoned
        ) ||
        g.stage !== "guess";
    return {
      ...v,
      canSpectate,
      roster: Object.fromEntries(
        Object.entries(g.players).map(([pid, p]) => [
          pid,
          {
            solved: p.solved,
            gaveUp: p.gaveUp,
            ready: p.submitted,
            feedback: p.guesses.map((r: any) => ({
              turn: r.turn,
              exact: r.exact,
              misplaced: r.misplaced,
            })),
            ...(canSpectate ? { guesses: p.guesses, pending: p.pending } : {}),
          },
        ]),
      ),
    };
  },
  results(g, c) {
    return c.ids.map((id) => ({
      id,
      raw: g.scores[id],
      valid: !!g.players[id].solvedRounds,
      detail: {
        solvedRounds: g.players[id].solvedRounds ?? 0,
        totalGuesses: g.players[id].totalGuesses ?? 0,
        rounds: g.players[id].history ?? [],
      },
    }));
  },
};
