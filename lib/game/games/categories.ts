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
import {
  ensure,
  type Context,
  type GameModule,
  type GameState,
} from "../types";
import { wordCategories, wordKey, startsWithLetter } from "../category-rules";
const letters = [..."ABCDEFGHIJKLMNOPRSTUVWZ"].map((letter) => ({
  id: `word-letter-${letter}`,
  letter,
}));
type Option = {
  key: string;
  answer: string;
  owners: string[];
  formatValid: boolean;
};
function next(g: GameState, c: Context) {
  reset(g, c);
  g.public = {
    letter: pick(letters, c).letter,
    categories: wordCategories,
    categoryIndex: -1,
    options: [],
    reviews: [],
  };
  g.secret.ballots = {};
  for (const id of c.ids)
    Object.assign(g.players[id], {
      answers: wordCategories.map(() => ""),
      seq: -1,
      voteCommitted: false,
      ballot: null,
    });
}
function finish(g: GameState, c: Context) {
  const players = c.ids.map((id) => {
    const categories = g.public.reviews.map((review: any) => {
      const option = review.options.find((o: Option) => o.owners.includes(id));
      return {
        category: review.category,
        answer: g.players[id].answers[review.index],
        score: option?.points ?? 0,
        accepted: option?.accepted ?? false,
        yes: option?.yes ?? 0,
        no: option?.no ?? 0,
        reason: option?.reason ?? "Leer",
      };
    });
    const row = {
      id,
      score: categories.reduce((sum: number, item: any) => sum + item.score, 0),
      categories,
    };
    g.scores[id] += row.score;
    (g.players[id].history ??= []).push(row);
    return row;
  });
  finishRound(g, c, {
    letter: g.public.letter,
    reviews: g.public.reviews,
    players,
  });
  g.deadline = c.now + 20000;
}
function openCategory(g: GameState, c: Context) {
  g.public.categoryIndex++;
  if (g.public.categoryIndex >= wordCategories.length) return finish(g, c);
  const index = g.public.categoryIndex;
  const groups = new Map<string, Option>();
  for (const id of c.ids) {
    const answer = g.players[id].answers[index];
    if (!wordKey(answer)) continue;
    const normalized = wordKey(answer);
    const option: Option = groups.get(normalized) ?? {
      key: `option-${groups.size}`,
      answer,
      owners: [],
      formatValid: startsWithLetter(answer, g.public.letter),
    };
    option.owners.push(id);
    groups.set(normalized, option);
  }
  g.public.options = [...groups.values()];
  g.public.category = wordCategories[index];
  g.secret.ballots = {};
  for (const id of c.ids)
    Object.assign(g.players[id], { voteCommitted: false, ballot: null });
  g.stage = "vote";
  g.deadline =
    c.now + Math.max(25, Math.min(50, g.public.options.length * 4)) * 1000;
  event(g, "categoryVote", undefined, c.now);
  if (!g.public.options.some((o: Option) => o.formatValid))
    resolveCategory(g, c);
}
function resolveCategory(g: GameState, c: Context) {
  const options = g.public.options.map((option: Option) => {
    const votes = Object.values(g.secret.ballots) as Record<
      string,
      boolean | null
    >[];
    const yes = votes.filter((b) => b[option.key] === true).length;
    const no = votes.filter((b) => b[option.key] === false).length;
    const accepted = option.formatValid && yes > no;
    const reason = !option.formatValid
      ? "Falscher Anfangsbuchstabe"
      : !yes && !no
        ? "Keine Stimmen"
        : yes === no
          ? "Gleichstand"
          : accepted
            ? "Mehrheit dafür"
            : "Mehrheit dagegen";
    return { ...option, yes, no, accepted, reason, points: 0 };
  });
  const validPlayers = options
    .filter((o: any) => o.accepted)
    .reduce((sum: number, o: Option) => sum + o.owners.length, 0);
  for (const option of options)
    if (option.accepted)
      option.points =
        validPlayers === 1 ? 20 : option.owners.length > 1 ? 5 : 10;
  const review = {
    index: g.public.categoryIndex,
    category: g.public.category,
    options,
  };
  g.public.reviews.push(review);
  g.public.lastReview = review;
  g.stage = "voteReveal";
  g.deadline = c.now + 5000;
  event(g, "categoryResult", undefined, c.now);
}
function beginVoting(g: GameState, c: Context) {
  g.public.categoryIndex = -1;
  openCategory(g, c);
}
export const categories: GameModule = {
  init(c) {
    const g = base("categories", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    ensure(c.ids.includes(id), "Du spielst diese Runde nicht mit.");
    ensure(a.round === g.round + 1, "Diese Runde ist bereits vorbei.");
    const p = g.players[id];
    if (a.type === "draft" || a.type === "answer") {
      ensure(
        g.stage === "answer" && c.now < g.deadline && !p.submitted,
        "Dein Blatt ist bereits geschlossen.",
      );
      ensure(
        Number.isSafeInteger(a.seq) &&
          a.seq >= 0 &&
          Array.isArray(a.answers) &&
          a.answers.length === wordCategories.length &&
          a.answers.every(
            (v: unknown) => typeof v === "string" && v.length <= 60,
          ),
        "Ungültiges Antwortblatt.",
      );
      if (a.seq <= p.seq) return;
      p.seq = a.seq;
      p.answers = a.answers.map((value: string) => value.trim());
      if (p.answers.some((value: string) => wordKey(value)))
        p.participated = true;
      if (a.type === "answer") {
        p.submitted = true;
        event(g, "confirm", id);
      }
      if (c.ids.every((pid) => g.players[pid].submitted)) beginVoting(g, c);
      return;
    }
    ensure(
      a.type === "vote" &&
        g.stage === "vote" &&
        c.now < g.deadline &&
        a.categoryIndex === g.public.categoryIndex &&
        !p.voteCommitted,
      "Diese Abstimmung ist bereits geschlossen.",
    );
    const options = g.public.options.filter((o: Option) => o.formatValid);
    ensure(
      a.ballot &&
        typeof a.ballot === "object" &&
        !Array.isArray(a.ballot) &&
        Object.keys(a.ballot).length === options.length &&
        options.every(
          (o: Option) =>
            Object.hasOwn(a.ballot, o.key) &&
            [true, false, null].includes(a.ballot[o.key]),
        ),
      "Bewerte jede Antwort oder enthalte dich.",
    );
    g.secret.ballots[id] = Object.fromEntries(
      options.map((o: Option) => [o.key, a.ballot[o.key]]),
    );
    p.ballot = g.secret.ballots[id];
    p.voteCommitted = true;
    event(g, "confirm", id);
    if (c.ids.every((pid) => g.players[pid].voteCommitted))
      resolveCategory(g, c);
  },
  tick(g, c) {
    if (g.stage === "answer" && c.now >= g.deadline) beginVoting(g, c);
    else if (g.stage === "vote" && c.now >= g.deadline) resolveCategory(g, c);
    else if (g.stage === "voteReveal" && c.now >= g.deadline)
      openCategory(g, c);
    nextOrDone(g, c, () => next(g, c));
  },
  view(g, id) {
    return {
      ...commonView(g, id),
      progress: Object.fromEntries(
        Object.entries(g.players).map(([pid, p]) => [
          pid,
          {
            filled: p.answers.filter((value: string) => wordKey(value)).length,
            submitted: !!p.submitted,
            voted: !!p.voteCommitted,
          },
        ]),
      ),
      submitted: Object.fromEntries(
        Object.entries(g.players).map(([pid, p]) => [
          pid,
          g.stage === "answer" ? !!p.submitted : !!p.voteCommitted,
        ]),
      ),
    };
  },
  results: rawResults,
};
