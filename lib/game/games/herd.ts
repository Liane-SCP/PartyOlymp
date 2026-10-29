import {
  base,
  commonView,
  everyone,
  event,
  finishRound,
  nextOrDone,
  pick,
  rawResults,
  reset,
  submit,
} from "../common";
import { herdQuestions } from "../party-content";
import {
  ensure,
  type Context,
  type GameModule,
  type GameState,
} from "../types";
import {herdKey} from '../herd-rules';
export {herdKey} from '../herd-rules';
function next(g: GameState, c: Context) {
  reset(g, c);
  g.public.question = pick(herdQuestions, c).text;
}
function resolve(g: GameState, c: Context) {
  const groups = new Map<string, { answer: string; ids: string[] }>();
  for (const id of c.ids) {
    const answer = g.players[id].answer;
    if (!answer) continue;
    const key = herdKey(answer);
    const group = groups.get(key) ?? { answer, ids: [] as string[] };
    group.ids.push(id);
    groups.set(key, group);
  }
  const sorted = [...groups.values()].sort(
    (a, b) => b.ids.length - a.ids.length,
  );
  const winner =
    sorted[0]?.ids.length > 1 && sorted[0]?.ids.length !== sorted[1]?.ids.length
      ? sorted[0]
      : null;
  const players = c.ids.map((id) => {
    const score = winner?.ids.includes(id) ? 100 : 0;
    g.scores[id] += score;
    const row = { id, answer: g.players[id].answer, score };
    (g.players[id].history ??= []).push(row);
    return row;
  });
  finishRound(g, c, {
    question: g.public.question,
    groups: sorted,
    tied: !winner,
    players,
  });
  event(g, 'herdGather', undefined, c.now);
}
export const herd: GameModule = {
  init(c) {
    const g = base("herd", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    ensure(
      a.type === "answer" &&
        typeof a.answer === "string" &&
        a.answer.trim().length <= 60 &&
        herdKey(a.answer).length > 0,
      "Schreibe eine kurze Antwort (1–60 Zeichen).",
    );
    submit(g, id, c);
    g.players[id].answer = a.answer.trim();
    if (everyone(g, c)) resolve(g, c);
  },
  tick(g, c) {
    if (g.stage === "answer" && c.now >= g.deadline) resolve(g, c);
    nextOrDone(g, c, () => next(g, c));
  },
  view: commonView,
  results: rawResults,
};
