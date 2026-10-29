import {
  base,
  commonView,
  event,
  finishRound,
  nextOrDone,
  rawResults,
} from "../common";
import {
  ensure,
  type Context,
  type GameModule,
  type GameState,
} from "../types";
function next(g: GameState, c: Context) {
  const target = (40 + Math.floor(c.random() * 111)) * 100;
  g.public = {
    target,
    mode: g.round === 0 ? "calm" : g.round % 2 ? "echo" : "decoy",
    seed: Math.floor(c.random() * 100000),
  };
  g.stage = "answer";
  g.deadline = c.now + Math.max(45000, c.settings.seconds * 1000);
  for (const id of c.ids)
    Object.assign(g.players[id], {
      startedAt: null,
      elapsed: null,
      submitted: false,
    });
}
function finish(g: GameState, c: Context) {
  const players = c.ids.map((id) => {
    const p = g.players[id],
      error = p.elapsed === null ? null : p.elapsed - g.public.target,
      score =
        error === null
          ? 0
          : Math.round(1000 * Math.exp(-Math.abs(error) / 900));
    g.scores[id] += score;
    const row = { id, elapsed: p.elapsed, error, score };
    (p.history ??= []).push(row);
    return row;
  });
  finishRound(g, c, { target: g.public.target, players });
  g.deadline = c.now + 15000;
}
export const timing: GameModule = {
  init(c) {
    const g = base("timing", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    ensure(
      c.ids.includes(id) &&
        a.round === g.round + 1 &&
        g.stage === "answer" &&
        c.now < g.deadline,
      "Diese Zeitrunde ist vorbei.",
    );
    const p = g.players[id];
    ensure(!p.submitted, "Dein Stopp ist schon festgelegt.");
    if (a.type === "start") {
      ensure(p.startedAt === null, "Deine Uhr läuft bereits.");
      ensure(
        g.deadline - c.now >= g.public.target + 3000,
        "Zu spät zum Starten. Die nächste Runde kommt gleich.",
      );
      p.startedAt = c.now;
      p.participated = true;
      event(g, "clockStart", id);
      return;
    }
    ensure(
      a.type === "stop" && p.startedAt !== null,
      "Starte zuerst deine Uhr.",
    );
    const elapsed = Number(a.elapsed),
      serverElapsed = c.now - p.startedAt;
    ensure(
      Number.isFinite(elapsed) &&
        elapsed >= 0 &&
        elapsed <= 40000 &&
        Math.abs(elapsed - serverElapsed) <= 2500,
      "Die Zeitmessung wurde unterbrochen. Bitte stoppe erneut.",
    );
    p.elapsed = Math.round(elapsed);
    p.submitted = true;
    event(g, "clockStop", id);
    if (c.ids.every((pid) => g.players[pid].submitted)) finish(g, c);
  },
  tick(g, c) {
    if (g.stage === "answer" && c.now >= g.deadline) {
      for(const id of c.ids) {
        const p=g.players[id];
        if(!p.submitted && !p.abandoned && p.startedAt!==null) {
          p.elapsed=g.deadline-p.startedAt;p.submitted=true;
        }
      }
      finish(g, c);
    }
    nextOrDone(g, c, () => next(g, c));
  },
  view(g, id) {
    const view = commonView(g, id);
    return {
      ...view,
      mine: view.mine
        ? {
            ...view.mine,
            elapsed: g.stage === "answer" ? null : view.mine.elapsed,
          }
        : null,
      roster: Object.fromEntries(
        Object.entries(g.players).map(([pid, p]) => [
          pid,
          { started: p.startedAt !== null, submitted: p.submitted },
        ]),
      ),
    };
  },
  results: rawResults,
};
