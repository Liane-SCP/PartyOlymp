import {
  ensure,
  uid,
  type Context,
  type GameId,
  type GameState,
  type Result,
} from "./types";
export function base(id: GameId, c: Context): GameState {
  return {
    id,
    round: 0,
    totalRounds: c.settings.rounds,
    deadline: 0,
    stage: "init",
    public: {},
    secret: {},
    players: Object.fromEntries(
      c.ids.map((id) => [id, { participated: false }]),
    ),
    scores: Object.fromEntries(c.ids.map((id) => [id, 0])),
    results: [],
    events: [],
  };
}
export function event(g: GameState, type: string, player?: string, at?: number) {
  g.events.push({ id: uid(), type, player, round: g.round + 1, ...(at === undefined ? {} : { at }) });
  g.events = g.events.slice(-12);
}
export function pick<T extends { id: string }>(
  pool: T[],
  c: Context,
  weight?: (item: T) => number,
): T {
  ensure(pool.length > 0, "Dieser Inhaltspool ist leer.");
  const used = new Set(c.used);
  let choices = pool.filter((x) => !used.has(x.id));
  if (!choices.length) {
    const poolIds = new Set(pool.map((x) => x.id));
    const previous = c.used.findLast((id) => poolIds.has(id));
    // Start another complete cycle; leave the other games' histories intact.
    const retained = c.used.filter((id) => !poolIds.has(id));
    c.used.splice(0, c.used.length, ...retained);
    choices = pool.filter((x) => x.id !== previous);
    if (!choices.length) choices = pool;
  }
  let item: T;
  if (weight) {
    const weights = choices.map(weight);
    let position = c.random() * weights.reduce((sum, value) => sum + value, 0);
    let index = 0;
    for (; index < choices.length - 1; index++) {
      position -= weights[index];
      if (position < 0) break;
    }
    item = choices[index];
  } else item = choices[Math.floor(c.random() * choices.length)];
  c.used.push(item.id);
  return item;
}
export function rawResults(g: GameState, c: Context): Result[] {
  return c.ids.map((id) => ({
    id,
    raw: g.scores[id],
    valid: g.players[id].participated,
    detail: g.players[id].history ?? [],
  }));
}
export function finishRound(g: GameState, c: Context, reveal: any) {
  g.stage = "roundReveal";
  g.public.reveal = reveal;
  g.public.revealStartedAt = c.now;
  g.deadline = c.now + (g.id === "budget" ? 19000 : 11000);
  event(g, "reveal", undefined, c.now);
}
export function nextOrDone(g: GameState, c: Context, next: () => void) {
  if (g.stage === "roundReveal" && c.now >= g.deadline) {
    g.round++;
    if (g.round >= g.totalRounds) {
      g.stage = "done";
      return;
    }
    next();
  }
}
export function submit(g: GameState, id: string, c: Context) {
  ensure(
    g.stage === "answer" && c.now < g.deadline,
    "Die Eingabephase ist vorbei.",
  );
  ensure(!g.players[id].submitted, "Bereits abgegeben.");
  g.players[id].submitted = true;
  g.players[id].participated = true;
  event(g, "confirm", id, c.now);
}
export function everyone(g: GameState, c: Context) {
  return c.ids.every((id) => g.players[id].submitted);
}
export function reset(g: GameState, c: Context) {
  g.stage = "answer";
  g.deadline = c.now + c.settings.seconds * 1000;
  g.public = {};
  for (const id of c.ids) {
    g.players[id].submitted = false;
    g.players[id].answer = null;
  }
}
export function commonView(g: GameState, id: string): Record<string, any> {
  return {
    ...g.public,
    round: g.round + 1,
    totalRounds: g.totalRounds,
    stage: g.stage,
    deadline: g.deadline,
    mine: g.players[id] ?? null,
    scores: g.scores,
    submitted: Object.fromEntries(
      Object.entries(g.players).map(([id, p]) => [id, !!p.submitted]),
    ),
    events: g.events,
  };
}
