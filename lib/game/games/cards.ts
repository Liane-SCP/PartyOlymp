import {
  base,
  commonView,
  event,
  finishRound,
  nextOrDone,
  rawResults,
} from "../common";
import { award } from "../scoring";
import {
  ensure,
  int,
  shuffle,
  uid,
  type GameModule,
  type GameState,
  type Context,
} from "../types";
export interface ColorCard {
  color: number;
  value: number;
  id: string;
}
export function penalty(hand: ColorCard[]) {
  return hand.reduce(
    (s, c) => s + (c.color === 4 ? 50 : c.value > 9 ? 20 : c.value),
    0,
  );
}
export function playable(card: ColorCard, top: ColorCard, color: number) {
  return card.color === 4 || card.color === color || card.value === top.value;
}
function draw(g: GameState) {
  if (!g.secret.deck.length) {
    const old = g.secret.discard.slice(0, -1);
    g.secret.deck = shuffle(old, () => {
      const b = new Uint32Array(1);
      crypto.getRandomValues(b);
      return b[0] / 2 ** 32;
    });
    g.secret.discard = g.secret.discard.slice(-1);
  }
  return g.secret.deck.pop();
}
function next(g: GameState, c: Context) {
  const deck: ColorCard[] = [];
  for (let color = 0; color < 4; color++)
    for (let value = 0; value <= 12; value++)
      for (let k = 0; k < (value === 0 ? 1 : 2); k++)
        deck.push({ color, value, id: `${color}-${value}-${k}` });
  for (let value = 13; value <= 14; value++)
    for (let k = 0; k < 4; k++)
      deck.push({ color: 4, value, id: `4-${value}-${k}` });
  g.secret.deck = shuffle(deck, c.random);
  g.secret.discard = [];
  for (const id of c.ids) {
    g.players[id].hand = Array.from({ length: 7 }, () => draw(g));
    g.players[id].submitted = false;
  }
  let first: ColorCard;
  do {
    first = draw(g);
    if (first.value > 9) g.secret.deck.unshift(first);
  } while (first.value > 9);
  g.secret.discard = [first];
  g.public = {
    top: first,
    color: first.color,
    turn: 0,
    direction: 1,
    turnId: c.ids[0],
    counts: {},
  };
  g.stage = "answer";
  g.deadline = c.now + c.settings.seconds * 1000;
  g.secret.turns = 0;
}
function advance(g: GameState, c: Context, steps = 1) {
  const n = c.ids.length;
  g.public.turn = (g.public.turn + g.public.direction * steps + n * steps) % n;
  g.public.turnId = c.ids[g.public.turn];
  g.deadline = c.now + c.settings.seconds * 1000;
  g.secret.turns++;
}
function recordMove(g: GameState, c: Context) {
  const move = {
    ...g.public.lastMove,
    id: uid(),
    at: c.now,
    next: g.public.turnId,
    direction: g.public.direction,
  };
  g.public.lastMove = move;
  g.public.moves = [...(g.public.moves ?? []), move].slice(-8);
}
function end(g: GameState, c: Context, winner?: string) {
  const rows = c.ids.map((id) => ({
    id,
    penalty: penalty(g.players[id].hand),
    hand: g.players[id].hand,
  }));
  const sorted = [...rows].sort((a, b) =>
    a.id === winner ? -1 : b.id === winner ? 1 : a.penalty - b.penalty,
  );
  for (const row of rows) {
    const value = award(
      rows.map((r) => ({
        id: r.id,
        raw: r.id === winner ? 100000 : -r.penalty,
        valid: true,
        detail: null,
      })),
      c.ids.length,
    ).find((r) => r.id === row.id)!.points!;
    g.scores[row.id] += value;
    g.players[row.id].history ??= [];
    g.players[row.id].history.push({ ...row, points: value });
  }
  finishRound(g, c, { winner, players: sorted });
}
export const cards: GameModule = {
  init(c) {
    const g = base("cards", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    ensure(
      g.stage === "answer" && g.public.turnId === id && c.now < g.deadline,
      "Du bist nicht am Zug.",
    );
    const p = g.players[id];
    if (a.type === "draw") {
      const drawn = draw(g);
      if (drawn) p.hand.push(drawn);
      else {
        end(g, c);
        return;
      }
      p.participated = true;
      g.public.lastMove = { player: id, kind: "draw", count: 1 };
      advance(g, c);
      event(g, "card", id);
      recordMove(g, c);
      return;
    }
    ensure(a.type === "play", "Unbekannte Aktion.");
    const i = p.hand.findIndex((x: ColorCard) => x.id === a.card);
    ensure(i >= 0, "Karte nicht in deiner Hand.");
    const card = p.hand[i];
    ensure(playable(card, g.public.top, g.public.color), "Karte passt nicht.");
    const chosen = card.color === 4 ? int(a.color, 0, 3) : card.color;
    p.hand.splice(i, 1);
    p.participated = true;
    g.public.top = card;
    g.public.color = chosen;
    g.secret.discard.push(card);
    g.public.lastMove = { player: id, kind: "play", card, color: chosen };
    event(g, "card", id);
    let steps = 1;
    if (card.value === 10) {
      steps = 2;
      g.public.lastMove.target =
        c.ids[
          (g.public.turn + g.public.direction + c.ids.length) % c.ids.length
        ];
    }
    if (card.value === 11) {
      g.public.direction *= -1;
      if (c.ids.length === 2) {
        steps = 2;
        g.public.lastMove.target = c.ids[(g.public.turn + 1) % c.ids.length];
      }
    }
    if (card.value === 12 || card.value === 14) {
      const target =
        c.ids[
          (g.public.turn + g.public.direction + c.ids.length) % c.ids.length
        ];
      g.public.lastMove.target = target;
      g.public.lastMove.count = 0;
      for (let k = 0; k < (card.value === 12 ? 2 : 4); k++) {
        const drawn = draw(g);
        if (drawn) {
          g.players[target].hand.push(drawn);
          g.public.lastMove.count++;
        }
      }
      steps = 2;
    }
    advance(g, c, steps);
    recordMove(g, c);
    if (!p.hand.length) end(g, c, id);
  },
  tick(g, c) {
    nextOrDone(g, c, () => next(g, c));
    if (g.stage === "answer" && c.now >= g.deadline) {
      const drawn = draw(g);
      if (drawn) {
        g.public.lastMove = {
          player: g.public.turnId,
          kind: "timeout",
          count: 1,
        };
        g.players[g.public.turnId].hand.push(drawn);
        event(g, "card", g.public.turnId);
        advance(g, c);
        recordMove(g, c);
      } else end(g, c);
    }
  },
  view(g, id) {
    return {
      ...commonView(g, id),
      order: Object.keys(g.players),
      counts: Object.fromEntries(
        canonical(g).map(([id, p]) => [id, p.hand.length]),
      ),
    };
  },
  results: rawResults,
};
function canonical(g: GameState): [string, any][] {
  return Object.entries(g.players);
}
