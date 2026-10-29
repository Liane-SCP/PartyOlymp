import { dealerDuration } from "../presentation";
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
  int,
  shuffle,
  type GameModule,
  type Context,
  type GameState,
} from "../types";
export interface Card {
  rank: number;
  suit: number;
}
export function handValue(cards: Card[]) {
  let n = cards.reduce(
      (s, c) => s + (c.rank === 1 ? 11 : Math.min(c.rank, 10)),
      0,
    ),
    aces = cards.filter((c) => c.rank === 1).length;
  while (n > 21 && aces-- > 0) n -= 10;
  return n;
}
function next(g: GameState, c: Context) {
  g.stage = "answer";
  g.deadline = c.now + c.settings.seconds * 1000;
  g.secret.deck = shuffle(
    Array.from({ length: 312 }, (_, i) => ({
      rank: (i % 13) + 1,
      suit: Math.floor(i / 13) % 4,
    })),
    c.random,
  );
  g.secret.dealer = [g.secret.deck.pop(), g.secret.deck.pop()];
  g.public = { dealer: [g.secret.dealer[0]] };
  for (const id of c.ids) {
    const p = g.players[id];
    p.chips = (p.chips ?? 1000) + 100;
    p.hand = [];
    p.bet = 0;
    p.stood = false;
    p.submitted = false;
  }
}
function settle(g: GameState, c: Context) {
  const d = g.secret.dealer;
  while (handValue(d) < 17) d.push(g.secret.deck.pop());
  const dv = handValue(d),
    db = d.length === 2 && dv === 21;
  const rows = c.ids.map((id) => {
    const p = g.players[id],
      v = handValue(p.hand),
      bj = p.hand.length === 2 && v === 21;
    let payout = 0;
    if (p.bet && v <= 21) {
      if (bj && !db) payout = p.bet * 2.5;
      else if ((v === dv && !db) || (bj && db)) payout = p.bet;
      else if (dv > 21 || (v > dv && !db)) payout = p.bet * 2;
    }
    p.chips += payout;
    g.scores[id] = p.chips;
    p.history ??= [];
    const row = {
      id,
      hand: p.hand,
      value: v,
      bet: p.bet,
      payout,
      chips: p.chips,
    };
    p.history.push(row);
    return row;
  });
  g.public.dealer = d;
  finishRound(g, c, { dealer: d, dealerValue: dv, players: rows });
  g.deadline = c.now + dealerDuration(d.length);
}
export const blackjack: GameModule = {
  init(c) {
    const g = base("blackjack", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    ensure(g.stage === "answer" && c.now < g.deadline, "Hand beendet.");
    const p = g.players[id];
    ensure(!p.stood, "Bereits stehen geblieben.");
    if (a.type === "bet") {
      ensure(!p.bet, "Einsatz bereits gewählt.");
      p.bet = int(a.value, 10, 100);
      ensure(p.bet <= p.chips, "Nicht genug Chips.");
      p.chips -= p.bet;
      p.hand = [g.secret.deck.pop(), g.secret.deck.pop()];
      p.participated = true;
      if (handValue(p.hand) === 21) p.stood = true;
      event(g, "card", id);
    } else {
      ensure(p.bet, "Wähle zuerst den Einsatz.");
      if (a.type === "hit") {
        p.hand.push(g.secret.deck.pop());
        if (handValue(p.hand) >= 21) p.stood = true;
        event(g, "card", id);
      } else if (a.type === "stand") {
        p.stood = true;
        event(g, "stand", id);
      } else throw new Error("Unbekannte Kartenaktion.");
    }
  },
  tick(g, c) {
    nextOrDone(g, c, () => next(g, c));
    if (
      g.stage === "answer" &&
      (c.now >= g.deadline || c.ids.every((id) => g.players[id].stood))
    )
      settle(g, c);
  },
  view(g, id) {
    return {
      ...commonView(g, id),
      status: Object.fromEntries(
        Object.entries(g.players).map(([id, p]) => [
          id,
          {
            bet: p.bet,
            stood: p.stood,
            hand: p.hand,
            value: handValue(p.hand),
            chips: p.chips,
          },
        ]),
      ),
    };
  },
  results: rawResults,
};
