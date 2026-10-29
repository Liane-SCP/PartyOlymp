import {
  base,
  commonView,
  event,
  finishRound,
  nextOrDone,
  pick,
  rawResults,
} from "../common";
import words from "../data/bomb-words.json";
import fragments from "../data/bomb-fragments.json";
import {bombPose} from '../../bomb-presentation';
import {
  ensure,
  type Context,
  type GameModule,
  type GameState,
} from "../types";
const dictionary = new Set(words);
export const bombKey = (s: string) =>
  s.normalize("NFC").toLocaleLowerCase("de").replaceAll("ß", "ss");
function changeFragment(g: GameState, c: Context) {
  const previous = g.public.fragment;
  g.public.fragment = pick(
    fragments.filter((f) => f.text.toUpperCase() !== previous),
    c,
    (f) => Math.sqrt(f.count),
  ).text.toUpperCase();
}
function fuse(g: GameState, c: Context, index: number) {
  while (!g.players[c.ids[index % c.ids.length]].alive) index++;
  g.secret.cursor = index % c.ids.length;
  g.public.turnId = c.ids[g.secret.cursor];
  g.public.turn++;
  changeFragment(g, c);
  g.secret.explodesAt =
    c.now +
    Math.round((Math.max(15, c.settings.seconds) + c.random() * 20) * 1000);
  g.deadline = g.secret.explodesAt;
  g.stage = "word";
  g.public.candidate = null;
  g.public.verdict = null;
  g.public.handoff = null;
  g.public.explosionAt = null;
  g.public.lastVerdict = null;
}
function next(g: GameState, c: Context) {
  g.public = {
    turn: 0,
    turnId: null,
    history: [],
    outcome: null,
    fragment: "",
    candidate: null,
    eliminatedAt: {},
  };
  g.secret.eliminated = [];
  g.secret.used = [];
  g.secret.rejected = [];
  for (const id of c.ids)
    Object.assign(g.players[id], {
      alive: true,
      words: 0,
      submitted: false,
      ballot: null,
    });
  fuse(g, c, g.round % c.ids.length);
}
function explode(g: GameState, c: Context) {
  const id = g.public.turnId;
  g.players[id].alive = false;
  g.public.explosionAt=c.now;
  (g.public.eliminatedAt??={})[id]=c.now;
  g.secret.eliminated.push(id);
  g.public.outcome = { id, reason: "Die Bombe ist explodiert!" };
  g.stage = "explosion";
  g.deadline = c.now + 3500;
  event(g, "explosion", id);
}
function pass(g: GameState, c: Context, word: string) {
  const id = g.public.turnId;
  const origin=bombPose(g.public.handoff,c.now,id);
  g.secret.used.push(bombKey(word));
  g.public.history.push({ id, word, fragment: g.public.fragment });
  g.players[id].words++;
  let index = g.secret.cursor + 1;
  while (!g.players[c.ids[index % c.ids.length]].alive) index++;
  g.secret.cursor = index % c.ids.length;
  g.public.turnId = c.ids[g.secret.cursor];
  g.public.turn++;
  g.public.handoff={from:id,to:g.public.turnId,at:c.now,turn:g.public.turn,origin};
  g.public.candidate = null;
  g.public.verdict = null;
  g.public.outcome = null;
  changeFragment(g, c);
  g.stage = "word";
  g.deadline = g.secret.explodesAt;
  event(g, "bombPass", id);
}
function judged(g: GameState, c: Context) {
  const votes = Object.values(g.secret.votes),
    yes = votes.filter((v) => v === true).length,
    no = votes.filter((v) => v === false).length;
  g.public.verdict = { yes, no, valid: yes > no };
  g.public.lastVerdict={word:g.public.candidate.word,yes,no,valid:yes>no,at:c.now};
  g.secret.explodesAt = c.now + g.secret.remaining;
  if (yes > no) pass(g, c, g.public.candidate.word);
  else {
    g.public.outcome = {
      id: g.public.turnId,
      reason: "Wort nicht bestätigt. Du behältst die Bombe.",
    };
    g.public.candidate = null;
    g.stage = "word";
    g.deadline = g.secret.explodesAt;
    event(g, "wordRejected", g.public.turnId);
  }
}
function finish(g: GameState, c: Context) {
  const winner = c.ids.find((id) => g.players[id].alive),
    players = c.ids.map((id) => {
      const place =
          id === winner ? 1 : c.ids.length - g.secret.eliminated.indexOf(id),
        score = Math.round(
          (100 * (c.ids.length - place)) / Math.max(1, c.ids.length - 1),
        );
      g.scores[id] += score;
      const row = { id, place, score, words: g.players[id].words };
      (g.players[id].history ??= []).push(row);
      return row;
    });
  finishRound(g, c, { players, winner, history: g.public.history });
}
export const bomb: GameModule = {
  init(c) {
    const g = base("bomb", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    ensure(
      c.ids.includes(id) &&
        a.round === g.round + 1 &&
        a.turn === g.public.turn &&
        c.now < g.deadline,
      "Dieser Zug ist bereits vorbei.",
    );
    if (a.type === "word") {
      ensure(
        g.stage === "word" && id === g.public.turnId && g.players[id].alive,
        "Die Bombe ist bei jemand anderem.",
      );
      ensure(typeof a.word === "string", "Schreibe ein Wort.");
      const word = a.word.trim(),
        key = bombKey(word);
      ensure(
        /^[a-zäöü]{3,24}$/.test(key),
        "Ein einzelnes Wort mit 3–24 Buchstaben.",
      );
      ensure(
        key.includes(g.public.fragment.toLowerCase()),
        `Das Wort muss ${g.public.fragment} enthalten.`,
      );
      ensure(
        !g.secret.used.includes(key),
        "Dieses Wort wurde schon benutzt. Die Bombe bleibt bei dir.",
      );
      g.players[id].participated = true;
      if (dictionary.has(key)) {
        pass(g, c, word);
        return;
      }
      ensure(
        !g.secret.rejected?.includes(key),
        "Dieses Wort wurde bereits abgelehnt. Versuche ein anderes.",
      );
      g.stage = "judge";
      g.secret.remaining = g.secret.explodesAt - c.now;
      g.public.candidate = { word, id };
      g.secret.votes = {};
      g.secret.rejected = [...(g.secret.rejected ?? []), key];
      for (const pid of c.ids) g.players[pid].ballot = null;
      g.deadline = c.now + 12000;
      event(g, "wordReview", id);
      return;
    }
    ensure(
      a.type === "judge" &&
        g.stage === "judge" &&
        id !== g.public.turnId &&
        g.players[id].ballot === null &&
        typeof a.valid === "boolean",
      "Diese Stimme ist nicht möglich.",
    );
    g.players[id].ballot = a.valid;
    g.players[id].participated = true;
    g.secret.votes[id] = a.valid;
    if (
      c.ids
        .filter((pid) => pid !== g.public.turnId)
        .every((pid) => g.players[pid].ballot !== null)
    )
      judged(g, c);
  },
  tick(g, c) {
    if (c.now >= g.deadline) {
      if (g.stage === "word") explode(g, c);
      else if (g.stage === "judge") judged(g, c);
      else if (g.stage === "explosion") {
        if (c.ids.filter((id) => g.players[id].alive).length <= 1) finish(g, c);
        else fuse(g, c, g.secret.cursor + 1);
      }
    }
    nextOrDone(g, c, () => next(g, c));
  },
  view(g, id) {
    return {
      ...commonView(g, id),
      deadline: g.stage === "word" ? 0 : g.deadline,
      history: g.public.history.slice(-60),
      roster: Object.fromEntries(
        Object.entries(g.players).map(([pid, p]) => [
          pid,
          { alive: p.alive, words: p.words, voted: p.ballot !== null },
        ]),
      ),
    };
  },
  results: rawResults,
};
