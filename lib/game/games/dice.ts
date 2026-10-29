import { base, commonView, event, rawResults } from "../common";
import {
  ensure,
  int,
  type GameModule,
  type GameState,
  type Context,
} from "../types";
export const categories = [
  "Einser",
  "Zweier",
  "Dreier",
  "Vierer",
  "Fünfer",
  "Sechser",
  "Dreierpasch",
  "Viererpasch",
  "Full House",
  "Kleine Straße",
  "Große Straße",
  "Fünferpasch",
  "Chance",
];
export function diceScore(d: number[], k: number) {
  const counts = Array.from(
      { length: 6 },
      (_, i) => d.filter((v) => v === i + 1).length,
    ),
    sum = d.reduce((a, b) => a + b, 0),
    set = new Set(d);
  if (k < 6) return counts[k] * (k + 1);
  if (k === 6) return Math.max(...counts) >= 3 ? sum : 0;
  if (k === 7) return Math.max(...counts) >= 4 ? sum : 0;
  if (k === 8) return counts.includes(3) && counts.includes(2) ? 25 : 0;
  if (k === 9)
    return [1, 2, 3].some((s) =>
      [s, s + 1, s + 2, s + 3].every((v) => set.has(v)),
    )
      ? 30
      : 0;
  if (k === 10)
    return set.size === 5 && (Math.min(...d) === 1 || Math.min(...d) === 2)
      ? 40
      : 0;
  if (k === 11) return Math.max(...counts) === 5 ? 50 : 0;
  return sum;
}
export function diceTotal(sheet: (number | null)[]) {
  const upper = sheet.slice(0, 6).reduce<number>((a, b) => a + (b ?? 0), 0);
  return (
    sheet.reduce<number>((a, b) => a + (b ?? 0), 0) + (upper >= 63 ? 35 : 0)
  );
}
function start(g: GameState, c: Context) {
  g.stage = "answer";
  g.public = {};
  g.public.turn = 1;
  g.public.turns = 13;
  g.public.turnDeadline = c.now + c.settings.seconds * 1000;
  for (const id of c.ids)
    g.players[id] = {
      ...g.players[id],
      dice: [1, 1, 1, 1, 1],
      held: [false, false, false, false, false],
      rolls: 0,
      rollStartedAt: null,
      sheet: Array(13).fill(null),
      deadline: c.now + c.settings.seconds * 1000,
      done: false,
      submitted: false,
      lastEntry: null,
    };
  g.deadline = c.now + c.settings.seconds * 13000;
}
function write(
  g: GameState,
  id: string,
  k: number,
  c: Context,
  timeout = false,
) {
  const p = g.players[id];
  const value = !timeout && p.rolls ? diceScore(p.dice, k) : 0;
  p.sheet[k] = value;
  if (!timeout) p.participated = true;
  if (!g.public.best || value > g.public.best.value)
    g.public.best = { id, category: categories[k], value };
  p.submitted = true;
  p.lastEntry = { category: categories[k], value };
  event(g, "score", id);
  if (p.sheet.every((v: any) => v !== null)) {
    p.done = true;
    g.scores[id] += diceTotal(p.sheet);
    p.history ??= [];
    p.history.push({ sheet: p.sheet, total: diceTotal(p.sheet) });
  }
}
export const dice: GameModule = {
  init(c) {
    const g = base("dice", c);
    start(g, c);
    return g;
  },
  action(g, id, a, c) {
    const p = g.players[id];
    ensure(
      g.stage === "answer" &&
        !p.submitted &&
        !p.done &&
        c.now < g.public.turnDeadline,
      "Warte auf den nächsten gemeinsamen Zug.",
    );
    if (a.type === "roll") {
      ensure(p.rolls < 3, "Drei Würfe sind bereits gespielt.");
      p.dice = p.dice.map((v: number, i: number) =>
        p.held[i] ? v : 1 + Math.floor(c.random() * 6),
      );
      p.rolls++;
      p.rollStartedAt = c.now;
      p.rollId = (p.rollId ?? 0) + 1;
      p.participated = true;
      event(g, "dice", id, c.now);
    } else if (a.type === "hold") {
      ensure(p.rolls > 0, "Würfle zuerst.");
      const k = int(a.index, 0, 4);
      p.held[k] = !p.held[k];
    } else if (a.type === "category") {
      const k = int(a.index, 0, 12);
      ensure(p.sheet[k] === null && p.rolls > 0, "Kategorie nicht verfügbar.");
      write(g, id, k, c);
    } else throw new Error("Unbekannte Würfelaktion.");
  },
  tick(g, c) {
    if (g.stage === "answer" && g.public.turnDeadline === undefined) {
      // Keep rooms from the previous release playable after the rules upgrade.
      const progress = c.ids.map(
        (id) => g.players[id].sheet.filter((v: any) => v !== null).length,
      );
      g.public.turn = Math.min(...progress) + 1;
      g.public.turns = 13;
      g.public.turnDeadline = c.now + c.settings.seconds * 1000;
      for (const id of c.ids) {
        g.players[id].submitted = !!g.players[id].done;
        g.players[id].deadline = g.public.turnDeadline;
      }
    }
    if (g.stage === "roundReveal") {
      if (c.now >= g.deadline) {
        g.round++;
        if (g.round >= g.totalRounds) g.stage = "done";
        else start(g, c);
      }
      return;
    }
    for (const id of c.ids) {
      const p = g.players[id];
      if (!p.done && !p.submitted && c.now >= g.public.turnDeadline)
        write(
          g,
          id,
          p.sheet.findIndex((v: any) => v === null),
          c,
          true,
        );
    }
    if (g.stage === "turnReveal") {
      if (c.now < g.public.turnDeadline) return;
      g.public.turn++;
      g.stage = "answer";
      g.public.turnDeadline = c.now + c.settings.seconds * 1000;
      for (const id of c.ids) {
        const p = g.players[id];
        p.submitted = !!p.done;
        p.rolls = 0;
        p.rollStartedAt = null;
        p.held.fill(false);
        p.deadline = g.public.turnDeadline;
      }
      return;
    }
    if (c.ids.every((id) => g.players[id].done)) {
      g.stage = "roundReveal";
      g.deadline = c.now + 11000;
      g.public.reveal = {
        players: c.ids.map((id) => ({
          id,
          ...g.players[id].history.at(-1),
        })),
      };
    } else if (c.ids.every((id) => g.players[id].submitted)) {
      g.stage = "turnReveal";
      g.public.turnDeadline = c.now + 3500;
    }
  },
  view(g, id) {
    return {
      ...commonView(g, id),
      categories,
      opponents: Object.fromEntries(
        Object.entries(g.players).map(([key, p]) => [
          key,
          {
            dice: p.dice,
            held: p.held,
            rolls: p.rolls,
            rollId: p.rollId,
            rollStartedAt: p.rollStartedAt,
            submitted: p.submitted,
            lastEntry: p.lastEntry,
            total: diceTotal(p.sheet),
            sheet: p.sheet,
          },
        ]),
      ),
      progress: Object.fromEntries(
        Object.entries(g.players).map(([id, p]) => [
          id,
          p.sheet.filter((v: any) => v !== null).length,
        ]),
      ),
    };
  },
  results: rawResults,
};
