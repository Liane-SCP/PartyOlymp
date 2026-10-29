import {
  base,
  commonView,
  event,
  finishRound,
  nextOrDone,
  pick,
  rawResults,
} from "../common";
import { chainTopics } from "../chain-content";
import { wordKey } from "../category-rules";
import {
  ensure,
  int,
  type Context,
  type GameModule,
  type GameState,
} from "../types";
const topics = [
  ...chainTopics.map((t) => ({ ...t, id: `auction-${t.id}` })),
  {
    id: "auction-pokemon",
    name: "Pokémon",
    hint: "Deutsche Pokémon-Namen; jedes Pokémon einmal, keine Formvarianten.",
  },
];
function next(g: GameState, c: Context) {
  g.public = {
    setter: c.ids[g.round % c.ids.length],
    choices: Array.from({ length: 3 }, () => pick(topics, c)),
    topic: null,
    bid: 0,
    leader: null,
    bids: [],
    answers: [],
    review: null,
    performStartedAt: null,
  };
  g.secret.votes = {};
  for (const id of c.ids)
    Object.assign(g.players[id], {
      passed: false,
      submitted: false,
      ballot: null,
    });
  g.stage = "topic";
  g.deadline = c.now + 20000;
}
function open(g: GameState, c: Context, topic: any) {
  g.public.topic = topic;
  g.stage = "bid";
  g.secret.auctionEnd = c.now + 60000;
  g.deadline = c.now + 25000;
  event(g, "auctionOpen");
}
function result(g: GameState, c: Context) {
  const judgeIds = c.ids.filter((id) => id !== g.public.leader);
  const answers = g.public.answers.map((a: any, i: number) => {
    const votes = judgeIds
        .map((id) => g.secret.votes[id]?.[i])
        .filter((v) => typeof v === "boolean"),
      yes = votes.filter((v) => v).length,
      no = votes.length - yes;
    return { ...a, yes, no, valid: yes > no };
  });
  const count = answers.filter((a: any) => a.valid).length,
    success = !!g.public.leader && count >= g.public.bid;
  const stake = g.public.bid * 10;
  const players = c.ids.map((id) => {
    const score = id === g.public.leader ? (success ? stake : -stake) : 0;
    g.scores[id] += score;
    const row = { id, score };
    (g.players[id].history ??= []).push(row);
    return row;
  });
  finishRound(g, c, {
    players,
    answers,
    count,
    success,
    stake,
    bid: g.public.bid,
    leader: g.public.leader,
    topic: g.public.topic,
  });
  g.deadline = c.now + 16000;
}
function perform(g: GameState, c: Context) {
  if (!g.public.leader) {
    result(g, c);
    return;
  }
  g.stage = "perform";
  g.public.performStartedAt=c.now;
  g.deadline = c.now + c.settings.seconds * 1000;
  event(g, "gavel", g.public.leader);
}
function review(g: GameState, c: Context) {
  if (!g.public.answers.length) {
    result(g, c);
    return;
  }
  g.stage = "judge";
  g.deadline =
    c.now + Math.max(25000, Math.min(60000, g.public.answers.length * 3000));
  event(g, "auctionJudge");
}
export const auction: GameModule = {
  init(c) {
    const g = base("auction", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    ensure(
      c.ids.includes(id) && a.round === g.round + 1 && c.now < g.deadline,
      "Diese Phase ist bereits vorbei.",
    );
    const p = g.players[id];
    if (a.type === "topic") {
      ensure(
        g.stage === "topic" && id === g.public.setter,
        "Gerade wählt jemand anderes die Aufgabe.",
      );
      let topic = g.public.choices.find((t: any) => t.id === a.choice);
      if (!topic) {
        ensure(
          typeof a.name === "string" &&
            a.name.trim().length >= 3 &&
            a.name.trim().length <= 80,
          "Gib eine klare Kategorie mit 3–80 Zeichen ein.",
        );
        topic = {
          name: a.name.trim(),
          hint: "Eigene Crew-Kategorie. Einzigartige passende Begriffe zählen; die Crew prüft.",
        };
      }
      p.participated = true;
      open(g, c, topic);
      return;
    }
    if (a.type === "bid" || a.type === "pass") {
      ensure(
        g.stage === "bid" && !p.passed,
        "Du bist aus dieser Auktion ausgestiegen.",
      );
      if (a.type === "pass") {
        ensure(g.public.leader !== id, "Dein Höchstgebot ist verbindlich.");
        p.passed = true;
      } else {
        ensure(g.public.leader !== id, "Du führst schon.");
        const bid = int(a.value, g.public.bid + 1, 50);
        g.public.bid = bid;
        g.public.leader = id;
        g.public.bids.push({ id, bid });
        g.public.bids = g.public.bids.slice(-24);
        g.deadline = Math.min(
          g.secret.auctionEnd,
          Math.max(g.deadline, c.now + 5000),
        );
        event(g, "bid", id);
      }
      p.participated = true;
      if (
        c.ids.every((pid) => pid === g.public.leader || g.players[pid].passed)
      )
        perform(g, c);
      return;
    }
    if (a.type === "word" || a.type === "finish") {
      ensure(
        g.stage === "perform" && id === g.public.leader,
        "Nur der Höchstbietende zählt jetzt auf.",
      );
      if (a.type === "finish") {
        review(g, c);
        return;
      }
      ensure(
        typeof a.word === "string" &&
          a.word.trim().length <= 60 &&
          wordKey(a.word).length > 0,
        "Schreibe einen Begriff (max. 60 Zeichen).",
      );
      ensure(
        !g.public.answers.some((x: any) => wordKey(x.word) === wordKey(a.word)),
        "Diesen Begriff hast du schon genannt.",
      );
      ensure(g.public.answers.length < 50, "Maximal 50 Begriffe pro Versuch.");
      g.public.answers.push({ word: a.word.trim() });
      event(g, "auctionWord", id);
      return;
    }
    ensure(
      a.type === "judge" &&
        g.stage === "judge" &&
        id !== g.public.leader &&
        !p.submitted,
      "Deine Bewertung ist bereits abgegeben.",
    );
    ensure(
      Array.isArray(a.votes) &&
        a.votes.length === g.public.answers.length &&
        a.votes.every((v: any) => v === true || v === false || v === null),
      "Bewerte jeden Begriff oder enthalte dich.",
    );
    g.secret.votes[id] = a.votes;
    p.submitted = true;
    p.participated = true;
    p.ballot = a.votes;
    if (
      c.ids
        .filter((pid) => pid !== g.public.leader)
        .every((pid) => g.players[pid].submitted)
    )
      result(g, c);
  },
  tick(g, c) {
    if (c.now >= g.deadline) {
      if (g.stage === "topic") open(g, c, g.public.choices[0]);
      else if (g.stage === "bid") perform(g, c);
      else if (g.stage === "perform") review(g, c);
      else if (g.stage === "judge") result(g, c);
    }
    nextOrDone(g, c, () => next(g, c));
  },
  view(g, id) {
    return {
      ...commonView(g, id),
      roster: Object.fromEntries(
        Object.entries(g.players).map(([pid, p]) => [
          pid,
          { passed: p.passed, submitted: p.submitted },
        ]),
      ),
    };
  },
  results: rawResults,
};
