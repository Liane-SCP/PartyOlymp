import {
  base,
  commonView,
  event,
  finishRound,
  nextOrDone,
  pick,
  rawResults,
  reset,
} from "../common";
import { raceTexts } from "../party-content";
import {
  normalizeRaceText,
  racePrefix,
  raceFinished,
  raceMetrics,
} from "../typing";
import {
  ensure,
  type Context,
  type GameModule,
  type GameState,
} from "../types";
function next(g: GameState, c: Context) {
  reset(g, c);
  g.public.text = normalizeRaceText(pick(raceTexts, c).text).trim();
  g.public.startedAt = c.now;
  for (const id of c.ids)
    Object.assign(g.players[id], {
      text: "",
      progress: 0,
      errors: 0,
      strokes: 0,
      finishedAt: null,
      finishedWpm: null,
      seq: 0,
    });
}
export function correctPrefix(input: string, target: string) {
  return racePrefix(input, target);
}
function resolve(g: GameState, c: Context) {
  const players = c.ids.map((id) => {
    const p = g.players[id];
    const elapsed = Math.max(
      1,
      ((p.finishedAt ?? c.now) - g.public.startedAt) / 1000,
    );
    const score =
      p.finishedAt !== null
        ? 1000 +
          Math.round(1000 * Math.max(0, 1 - elapsed / c.settings.seconds))
        : Math.round((900 * p.progress) / g.public.text.length);
    g.scores[id] += score;
    const row = {
      id,
      score,
      progress: p.progress,
      length: g.public.text.length,
      finished: p.finishedAt !== null,
      seconds: Math.round(elapsed * 10) / 10,
      wpm: raceMetrics(
        p.progress,
        g.public.text.length,
        g.public.startedAt,
        c.now,
        p.finishedAt,
      ).wpm,
      accuracy: p.strokes ? Math.round(100 * (1 - p.errors / p.strokes)) : 0,
    };
    (p.history ??= []).push(row);
    return row;
  });
  finishRound(g, c, { players });
}
export const typer: GameModule = {
  init(c) {
    const g = base("typer", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    const p = g.players[id];
    ensure(
      p && (a.round === undefined || a.round === g.round + 1),
      "Dieses Rennen ist bereits vorbei.",
    );
    if (p.submitted && a.type === "type") return;
    ensure(
      g.stage === "answer" && c.now < g.deadline && !p.submitted,
      "Dieses Rennen ist für dich beendet.",
    );
    ensure(
      a.type === "type" &&
        typeof a.text === "string" &&
        a.text.length <= g.public.text.length + 10,
      "Ungültige Texteingabe.",
    );
    ensure(Number.isSafeInteger(a.seq) && a.seq > 0, "Ungültige Texteingabe.");
    if (a.seq <= p.seq) return;
    // The server derives progress and finish time, never trusts a client score.
    const prefix = correctPrefix(a.text, g.public.text);
    const added = Math.max(0, a.text.length - p.text.length);
    p.strokes += added;
    p.errors += Math.max(0, added - Math.max(0, prefix - p.progress));
    p.errors = Math.min(p.strokes, p.errors);
    Object.assign(p, {
      text: a.text,
      progress: prefix,
      seq: a.seq,
      participated: true,
    });
    if (raceFinished(a.text, g.public.text)) {
      p.submitted = true;
      p.finishedAt = c.now;
      p.finishedWpm = raceMetrics(
        prefix,
        g.public.text.length,
        g.public.startedAt,
        c.now,
        c.now,
      ).wpm;
      event(g, "finish", id);
    }
    if (
      c.ids.every((pid) => g.players[pid].submitted || g.players[pid].abandoned)
    )
      resolve(g, c);
  },
  tick(g, c) {
    if (g.stage === "answer" && c.now >= g.deadline) resolve(g, c);
    nextOrDone(g, c, () => next(g, c));
  },
  view(g, id) {
    return {
      ...commonView(g, id),
      racers: Object.fromEntries(
        Object.entries(g.players).map(([pid, p]) => [
          pid,
          {
            progress: p.progress,
            finishedAt: p.finishedAt,
            finishedWpm: p.finishedWpm,
          },
        ]),
      ),
    };
  },
  results: rawResults,
};
