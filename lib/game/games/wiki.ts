import bank from "../data/wiki.json";
import {
  base,
  commonView,
  event,
  finishRound,
  nextOrDone,
  pick,
} from "../common";
import {
  ensure,
  type GameModule,
  type Context,
  type GameState,
} from "../types";
const articles = bank.articles as Record<
  string,
  {
    title: string;
    text: string;
    url: string;
    revision: number;
    links: string[];
  }
>;
export function wikiRoundScore(elapsed: number | null, seconds: number) {
  if (elapsed === null || !Number.isFinite(elapsed)) return 0;
  return (
    100 +
    Math.round(900 * Math.max(0, 1 - Math.max(0, elapsed) / (seconds * 1000)))
  );
}
export const wikiTitleKey = (title: string) =>
  title.normalize("NFC").replaceAll("_", " ").trim();
function next(g: GameState, c: Context) {
  const task = pick(bank.tasks, c);
  g.stage = "answer";
  g.deadline = c.now + c.settings.seconds * 1000;
  g.secret.task = task;
  g.secret.start = c.now;
  delete g.secret.targetCanonical;
  delete g.secret.nextArticle;
  g.secret.liveLinks = {};
  g.public = { start: task.start, target: task.target };
  for (const id of c.ids) {
    const p = g.players[id];
    p.path = [task.start];
    p.arrival = 0;
    p.lastNavigateAt = null;
    p.submitted = false;
  }
}
function resolve(g: GameState, c: Context) {
  const rows = c.ids.map((id) => {
    const p = g.players[id];
    const elapsed = p.arrival ? Math.max(0, p.arrival - g.secret.start) : null;
    const score = wikiRoundScore(elapsed, c.settings.seconds);
    p.history ??= [];
    p.history.push({
      path: p.path,
      clicks: p.path.length - 1,
      arrival: elapsed,
      score,
    });
    g.scores[id] = p.history.reduce(
      (sum: number, h: any) =>
        sum + wikiRoundScore(h.arrival, c.settings.seconds),
      0,
    );
    return { id, ...p.history.at(-1) };
  });
  finishRound(g, c, { players: rows, examplePath: g.secret.task.path });
}
export const wiki: GameModule = {
  init(c) {
    const g = base("wiki", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    const p = g.players[id];
    ensure(
      p &&
        (a.round === undefined || a.round === g.round + 1) &&
        (a.from === undefined || a.from === p.path.at(-1)) &&
        (a.step === undefined || a.step === p.path.length),
      "Dein Artikel hat sich inzwischen geändert. Wähle einen Link im aktuellen Artikel.",
    );
    ensure(
      g.stage === "answer" && c.now < g.deadline && !p.arrival,
      "Rennen beendet.",
    );
    ensure(
      a.type === "navigate" && typeof a.title === "string",
      "Ungültiger Artikel.",
    );
    const current =
      g.secret.liveLinks?.[id]?.title === p.path.at(-1)
        ? g.secret.liveLinks[id]
        : articles[p.path.at(-1)];
    ensure(
      current?.links.includes(a.title),
      "Dieser Navigationsschritt ist nicht erlaubt.",
    );
    ensure(p.path.length < 150, "Zu viele Navigationsschritte.");
    p.path.push(
      g.secret.nextArticle?.requested === a.title
        ? g.secret.nextArticle.canonical
        : a.title,
    );
    delete g.secret.nextArticle;
    p.participated = true;
    p.lastNavigateAt = c.now;
    event(g, "navigate", id, c.now);
    if (
      wikiTitleKey(p.path.at(-1)) ===
      wikiTitleKey(g.secret.targetCanonical ?? g.public.target)
    ) {
      p.arrival = c.now;
      p.submitted = true;
      event(g, "correct", id, c.now);
    }
  },
  tick(g, c) {
    nextOrDone(g, c, () => next(g, c));
    if (
      g.stage === "answer" &&
      (c.now >= g.deadline || c.ids.every((id) => g.players[id].arrival))
    )
      resolve(g, c);
  },
  view(g, id) {
    const v = commonView(g, id),
      p = g.players[id];
    const title = p?.path.at(-1) ?? g.public.start;
    return {
      ...v,
      article: articles[title],
      attribution: {
        license: bank.license,
        authors: bank.attribution,
        fetchedAt: bank.fetchedAt,
      },
      path: p?.path ?? [],
      racers: Object.fromEntries(
        Object.entries(g.players).map(([key, player]) => [
          key,
          {
            article: player.path.at(-1),
            clicks: player.path.length - 1,
            arrived: !!player.arrival,
            movedAt: player.lastNavigateAt ?? null,
            arrivalAt: player.arrival || null,
            elapsed: player.arrival ? player.arrival - g.secret.start : null,
          },
        ]),
      ),
    };
  },
  results(g, c) {
    return c.ids.map((id) => ({
      id,
      raw: (g.players[id].history ?? []).reduce(
        (sum: number, h: any) =>
          sum + wikiRoundScore(h.arrival, c.settings.seconds),
        0,
      ),
      valid:
        (g.players[id].history ?? []).some((h: any) => h.arrival !== null) &&
        g.players[id].history?.length > 0,
      detail: g.players[id].history ?? [],
    }));
  },
};
