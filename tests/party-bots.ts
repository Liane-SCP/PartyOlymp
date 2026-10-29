import {games} from "../lib/game/games";
import {context} from "../lib/game/room";
import type {Room} from "../lib/game/types";
import bombWords from "../lib/game/data/bomb-words.json";
export function bots(r: Room, now: number) {
  if (r.phase !== "playing" || !r.game) return;
  const g = r.game,
    c = context(r, now),
    module = games[g.id];
  for (const id of r.participantIds) {
    const p = g.players[id];
    if (g.stage === "roundReveal" || g.stage === "done") continue;
    let a: any;
    if (g.stage === "answer" && !p.submitted) {
      if (g.id === "colossus")
        a = { type: p.rolls ? "strike" : "roll", round: g.round + 1 };
      if (g.id === "dragon")
        a = {
          type: "estimate",
          guess: g.secret.product.price,
          risk: "bold",
          round: g.round + 1,
        };
      if (g.id === "kraken")
        a =
          p.chargingStartedAt === null
            ? { type: "start", round: g.round + 1 }
            : {
                type: "fire",
                elapsed: now - p.chargingStartedAt,
                round: g.round + 1,
              };
    }
    if (g.id === "herd" && !p.submitted)
      a = { type: "answer", answer: "Kaffee" };
    if (g.id === "geo" && !p.submitted)
      a = { type: "pin", lat: g.secret.place.lat, lon: g.secret.place.lon };
    if (g.id === "typer" && !p.submitted)
      a = { type: "type", text: g.public.text, seq: 1 };
    if (g.id === "spectrum") {
      if (g.stage === "clue" && g.public.psychic === id)
        a = { type: "clue", clue: "GTA 5" };
      else if (g.stage === "guess" && g.public.psychic !== id && !p.submitted)
        a = { type: "lock", value: g.secret.target };
    }
    if (g.id === "timing" && g.stage === "answer" && !p.submitted) {
      if (p.startedAt === null) a = { type: "start", round: g.round + 1 };
      else if (now - p.startedAt >= g.public.target)
        a = { type: "stop", round: g.round + 1, elapsed: now - p.startedAt };
    }
    if (g.id === "categories") {
      if (g.stage === "answer" && !p.submitted)
        a = {
          type: "answer",
          round: g.round + 1,
          seq: 1,
          answers: Array(7).fill(g.public.letter + "Test"),
        };
      if (g.stage === "vote" && !p.voteCommitted)
        a = {
          type: "vote",
          round: g.round + 1,
          categoryIndex: g.public.categoryIndex,
          ballot: Object.fromEntries(
            g.public.options
              .filter((o: any) => o.formatValid)
              .map((o: any) => [o.key, true]),
          ),
        };
    }
    if (g.id === "auction") {
      if (g.stage === "topic" && id === g.public.setter)
        a = { type: "topic", choice: g.public.choices[0].id };
      else if (g.stage === "bid" && !p.passed && id !== g.public.leader)
        a = g.public.leader ? { type: "pass" } : { type: "bid", value: 1 };
      else if (g.stage === "perform" && id === g.public.leader)
        a = g.public.answers.length
          ? { type: "finish" }
          : { type: "word", word: "Testbegriff" };
      else if (g.stage === "judge" && id !== g.public.leader && !p.submitted)
        a = { type: "judge", votes: g.public.answers.map(() => true) };
      if (a) a.round = g.round + 1;
    }
    if (g.id === "chain") {
      if (g.stage === "answer" && id === g.public.turnId)
        a = { type: "answer", answer: "Testbegriff" };
      else if (g.stage === "review" && id !== g.public.turnId && !p.approved)
        a = { type: "approve" };
      if (a) Object.assign(a, { round: g.round + 1, turn: g.public.turn });
    }
    if (
      g.id === "bomb" &&
      g.stage === "word" &&
      id === g.public.turnId &&
      !p.words
    ) {
      const word = bombWords.find(
        (w) =>
          w.includes(g.public.fragment.toLowerCase()) &&
          !g.secret.used.includes(w),
      );
      if (word)
        a = { type: "word", round: g.round + 1, turn: g.public.turn, word };
    }
    if (g.id === "code" && !p.submitted)
      a = {
        type: "guess",
        round: g.round + 1,
        turn: g.public.turn,
        colors: g.secret.code,
      };
    if (g.id === "dice" && g.stage === "answer" && !p.done && !p.submitted) {
      if (!p.rolls) a = { type: "roll" };
      else
        a = {
          type: "category",
          index: p.sheet.findIndex((v: any) => v === null),
        };
    }
    if (g.id === "blackjack" && !p.stood)
      a = !p.bet ? { type: "bet", value: 50 } : { type: "stand" };
    if (g.id === "wiki" && !p.arrival) {
      const path = g.secret.task.path,
        k = path.indexOf(p.path.at(-1));
      a = { type: "navigate", title: path[k + 1] };
    }
    if (g.id === "picture" && !p.correct && !p.buzzedOut)
      a = g.public.buzzer === id ? { type: "answer", value: g.secret.item.answer } : !g.public.buzzer ? {type:"buzz"} : null;
    if (g.id === "budget" && !p.submitted)
      a = {
        type: "answer",
        value: g.secret.items.slice(0, 2).map((x: any) => x.id),
      };
    if (g.id === "size" && !p.submitted)
      a = {
        type: "answer",
        value: g.secret.item.cm * (1 + r.participantIds.indexOf(id) / 10),
      };
    if (g.id === "color" && !p.submitted && now >= g.public.previewUntil)
      a = { type: "answer", value: g.secret.target };
    if (g.id === "fleet") {
      if (g.stage === "placement" && !p.submitted)
        a = {
          type: "place",
          ships: [
            { cell: 0 },
            { cell: g.public.size * 2 },
            { cell: g.public.size * 4 },
          ],
        };
      else if (g.stage === "answer" && !p.submitted)
        a = {
          type: "shoot",
          cell: Array.from(
            { length: g.public.size * g.public.size },
            (_, k) => k,
          ).find(
            (k) =>
              !g.public.shots.some((s: any) => s.id === id && s.cell === k),
          ),
        };
    }
    if (g.id === "cards" && g.public.turnId === id) {
      const top = g.public.top,
        k = p.hand.findIndex(
          (x: any) =>
            x.color === 4 ||
            x.color === g.public.color ||
            x.value === top.value,
        );
      a =
        k >= 0
          ? { type: "play", card: p.hand[k].id, color: 0 }
          : { type: "draw" };
    }
    if (a) module.action(g, id, a, c);
  }
}
