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
import { wheelDraw, WHEEL_MS } from "../wheel";
import {
  ensure,
  type Context,
  type GameModule,
  type GameState,
} from "../types";
function turn(g: GameState, c: Context, index: number) {
  while (!g.players[c.ids[index % c.ids.length]].alive) index++;
  g.secret.cursor = index % c.ids.length;
  g.public.turn++;
  g.public.turnId = c.ids[g.secret.cursor];
  g.public.candidate = null;
  g.public.challengeBy = null;
  g.public.verdict = null;
  g.secret.votes = {};
  g.secret.approvals = [];
  for (const id of c.ids) {
    g.players[id].ballot = null;
    g.players[id].approved = false;
  }
  g.stage = "answer";
  g.deadline = c.now + c.settings.seconds * 1000;
  event(g, "turn", g.public.turnId);
}
function next(g: GameState, c: Context) {
  g.public = {
    topic: null,
    suggestions: [],
    turn: 0,
    turnId: null,
    history: [],
    candidate: null,
    lastOutcome: null,
    acceptedCount: 0,
    eliminatedAt: {},
    eliminatedStep: {},
  };
  g.secret.eliminated = [];
  for (const id of c.ids)
    Object.assign(g.players[id], {
      alive: true,
      words: 0,
      reason: null,
      ballot: null,
      approved: false,
      submitted: false,
      topicSubmitted: false,
    });
  g.stage = "topicSuggest";
  g.deadline = c.now + 35000;
}
function spinTopic(g: GameState, c: Context) {
  const proposals = c.ids.map(id => {
    const suggestion = g.public.suggestions.find((s: any) => s.player === id);
    return suggestion ?? { ...pick(chainTopics, c), player: id, fallback: true };
  });
  g.secret.topicChoices = proposals;
  g.public.topicWheel = wheelDraw(`chain:${g.round}:${c.now}`, proposals.map(topic => ({
    id: topic.id, name: topic.name, player: topic.player,
  })), c.now, c.random);
  g.stage = "topicSpin";
  g.deadline = c.now + WHEEL_MS;
  event(g, "topicSpin");
}
function finish(g: GameState, c: Context) {
  const winner = c.ids.find((id) => g.players[id].alive);
  const players = c.ids.map((id) => {
    const place =
      id === winner ? 1 : c.ids.length - g.secret.eliminated.indexOf(id);
    const score = Math.round(
      (100 * (c.ids.length - place)) / Math.max(1, c.ids.length - 1),
    );
    g.scores[id] += score;
    const row = {
      id,
      place,
      score,
      words: g.players[id].words,
      reason: g.players[id].reason,
    };
    (g.players[id].history ??= []).push(row);
    return row;
  });
  finishRound(g, c, {
    winner,
    topic: g.public.topic,
    players,
    history: g.public.history,
  });
}
function outcome(g: GameState, c: Context, valid: boolean, reason: string) {
  const id = g.public.turnId,
    candidate = g.public.candidate;
  const acceptedBefore=g.public.acceptedCount??g.public.history.filter((e:any)=>e.valid===true).length;
  const entry = {
    id: `chain-${g.round}-${g.public.turn}`,
    player: id,
    answer: candidate?.answer ?? "",
    valid,
    reason,
    at: c.now,
  };
  g.public.history.push(entry);
  g.public.lastOutcome = entry;
  g.public.acceptedCount=acceptedBefore+(valid?1:0);
  if (valid) g.players[id].words++;
  else {
    g.players[id].alive = false;
    g.players[id].reason = reason;
    g.secret.eliminated.push(id);
    (g.public.eliminatedAt??={})[id]=c.now;
    (g.public.eliminatedStep??={})[id]=acceptedBefore;
  }
  g.stage = "turnReveal";
  g.deadline = c.now + 3000;
  event(g, valid ? "chainAccepted" : "chainOut", id, c.now);
}
function resolveVotes(g: GameState, c: Context) {
  const votes = Object.values(g.secret.votes);
  const yes = votes.filter((v) => v === true).length,
    no = votes.filter((v) => v === false).length;
  g.public.verdict = { yes, no };
  outcome(
    g,
    c,
    no <= yes,
    no > yes
      ? "Von der Mehrheit abgelehnt"
      : no === yes
        ? "Gleichstand: Antwort bleibt gültig"
        : "Von der Mehrheit bestätigt",
  );
}
export const chain: GameModule = {
  init(c) {
    const g = base("chain", c);
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
    if (a.type === "suggestTopic") {
      ensure(g.stage === "topicSuggest" && !g.players[id].topicSubmitted, "Dein Vorschlag ist bereits im Rad.");
      ensure(typeof a.name === "string" && a.name.trim().length >= 2 && a.name.trim().length <= 48 && wordKey(a.name), "Die Kategorie braucht 2–48 Zeichen.");
      ensure(a.hint === undefined || (typeof a.hint === "string" && a.hint.length <= 140), "Die Erklärung darf höchstens 140 Zeichen haben.");
      const name = a.name.trim();
      const known = chainTopics.find(t => wordKey(t.name) === wordKey(name));
      g.public.suggestions.push({ id: `topic-${g.round}-${id}`, name,
        hint: a.hint?.trim() || known?.hint || "Nennt passende Begriffe. Die Gruppe prüft wie gewohnt, ob sie zur Kategorie gehören.", player: id });
      g.players[id].topicSubmitted = true;
      if (c.ids.every(pid => g.players[pid].topicSubmitted)) spinTopic(g, c);
      return;
    }
    if (a.type === "answer") {
      ensure(
        g.stage === "answer" && id === g.public.turnId && g.players[id].alive,
        "Du bist noch nicht am Zug.",
      );
      ensure(
        typeof a.answer === "string" &&
          a.answer.trim().length <= 60 &&
          wordKey(a.answer).length > 0,
        "Schreibe einen Begriff mit höchstens 60 Zeichen.",
      );
      const answer = a.answer.trim();
      g.players[id].participated = true;
      g.public.candidate = { answer, player: id };
      if (
        g.public.history.some(
          (entry: any) => wordKey(entry.answer) === wordKey(answer),
        )
      )
        return outcome(g, c, false, "Doppelt genannt");
      g.stage = "review";
      g.deadline = c.now + 7000;
      event(g, "chainWord", id, c.now);
      return;
    }
    ensure(id !== g.public.turnId, "Die anderen prüfen deine Antwort.");
    if (a.type === "approve") {
      ensure(
        g.stage === "review" && !g.players[id].approved,
        "Diese Prüfung ist bereits geschlossen.",
      );
      g.players[id].approved = true;
      g.players[id].participated = true;
      g.secret.approvals.push(id);
      if (
        c.ids
          .filter((pid) => pid !== g.public.turnId)
          .every((pid) => g.players[pid].approved)
      )
        outcome(g, c, true, "Von allen bestätigt");
      return;
    }
    if (a.type === "challenge") {
      ensure(g.stage === "review", "Diese Antwort wird schon geprüft.");
      g.stage = "challenge";
      g.players[id].participated = true;
      g.public.challengeBy = id;
      g.secret.votes = { [id]: false };
      g.players[id].ballot = false;
      g.deadline = c.now + 20000;
      event(g, "chainChallenge", id, c.now);
      if (c.ids.length === 2) resolveVotes(g, c);
      return;
    }
    ensure(
      a.type === "vote" &&
        g.stage === "challenge" &&
        typeof a.valid === "boolean" &&
        g.players[id].ballot === null,
      "Diese Stimme ist bereits abgegeben.",
    );
    g.secret.votes[id] = a.valid;
    g.players[id].participated = true;
    g.players[id].ballot = a.valid;
    if (
      c.ids
        .filter((pid) => pid !== g.public.turnId)
        .every((pid) => g.players[pid].ballot !== null)
    )
      resolveVotes(g, c);
  },
  tick(g, c) {
    if (c.now >= g.deadline) {
      if (g.stage === "topicSuggest") spinTopic(g, c);
      else if (g.stage === "topicSpin") {
        g.public.topic = g.secret.topicChoices[g.public.topicWheel.selected];
        turn(g, c, g.round % c.ids.length);
      }
      else if (g.stage === "answer") outcome(g, c, false, "Antwortzeit abgelaufen");
      else if (g.stage === "review") outcome(g, c, true, "Nicht angefochten");
      else if (g.stage === "challenge") resolveVotes(g, c);
      else if (g.stage === "turnReveal") {
        if (c.ids.filter((id) => g.players[id].alive).length <= 1) finish(g, c);
        else turn(g, c, g.secret.cursor + 1);
      }
    }
    nextOrDone(g, c, () => next(g, c));
  },
  view(g, id) {
    return {
      ...commonView(g, id),
      roster: Object.fromEntries(
        Object.entries(g.players).map(([pid, p]) => [
          pid,
          {
            alive: p.alive,
            words: p.words,
            reason: p.reason,
            approved: p.approved,
            voted: p.ballot !== null,
          },
        ]),
      ),
    };
  },
  results: rawResults,
};
