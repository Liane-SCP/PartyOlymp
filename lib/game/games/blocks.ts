import {
  base,
  commonView,
  event,
  finishRound,
  nextOrDone,
  rawResults,
} from "../common";
import {
  blockKinds,
  fits,
  lockBlock,
  moveBlock,
  spawnBlock,
  type BlockInput,
  type BlockPlayer,
} from "../blocks-physics";
import {
  ensure,
  shuffle,
  type Context,
  type GameModule,
  type GameState,
} from "../types";
function refill(p: BlockPlayer, c: Context) {
  while (p.queue.length < 14) p.queue.push(...shuffle(blockKinds, c.random));
}
function next(g: GameState, c: Context) {
  g.stage = "battle";
  g.deadline = 0;
  g.public = { startedAt: c.now, attacks: [] };
  const queue = [
    ...shuffle(blockKinds, c.random),
    ...shuffle(blockKinds, c.random),
    ...shuffle(blockKinds, c.random),
  ];
  for (const id of c.ids) {
    const history = g.players[id].history ?? [];
    const participated = g.players[id].participated;
    g.players[id] = {
      board: Array.from({ length: 22 }, () => Array(10).fill(0)),
      kind: "I",
      x: 3,
      y: 0,
      rotation: 0,
      queue: [...queue],
      hold: null,
      held: false,
      alive: true,
      lines: 0,
      pieces: 0,
      sent: 0,
      incoming: [],
      combo: -1,
      lastClear: 0,
      lastClearAt: 0,
      lastFall: c.now,
      groundedAt: null,
      resets: 0,
      seq: 0,
      participated,
      history,
    };
    spawnBlock(g.players[id], c.now);
  }
}
function attack(g: GameState, id: string, rows: number, c: Context) {
  if (!rows) return;
  const targets = c.ids.filter((pid) => pid !== id && g.players[pid].alive);
  if (!targets.length) return;
  const wanted = g.players[id].target;
  const target = targets.includes(wanted)
    ? wanted
    : targets[(g.players[id].pieces - 1) % targets.length];
  const hole = Math.floor(c.random() * 10);
  g.players[target].incoming.push(...Array(rows).fill(hole));
  g.players[id].sent += rows;
  g.public.attacks.push({ from: id, to: target, rows, at: c.now });
  g.public.attacks = g.public.attacks.slice(-8);
  event(g, "attack", id);
}
function finish(g: GameState, c: Context) {
  const live = c.ids.filter((id) => g.players[id].alive);
  for (const id of c.ids)
    if (!g.players[id].alive && !g.players[id].place)
      g.players[id].place = live.length + 1;
  if (live.length > 1) return;
  if (live[0]) g.players[live[0]].place = 1;
  const players = c.ids.map((id) => {
    const p = g.players[id];
    const score = Math.round(
      ((c.ids.length - p.place) * 1000) / Math.max(1, c.ids.length - 1),
    );
    g.scores[id] += score;
    const row = { id, score, place: p.place, lines: p.lines, sent: p.sent };
    p.history.push(row);
    return row;
  });
  finishRound(g, c, { players, winner: live[0] ?? null });
}
export const blocks: GameModule = {
  init(c) {
    const g = base("blocks", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    const p = g.players[id] as BlockPlayer & { target?: string };
    ensure(
      a.round === undefined || a.round === g.round + 1,
      "Diese Runde ist vorbei.",
    );
    ensure(
      g.stage === "battle" && p.alive,
      "Du schaust dieser Runde jetzt zu.",
    );
    if (a.type === "target") {
      ensure(
        c.ids.includes(a.target) &&
          a.target !== id &&
          g.players[a.target].alive,
        "Wähle einen aktiven Gegner.",
      );
      p.target = a.target;
      return;
    }
    ensure(
      a.type === "inputs" &&
        Array.isArray(a.inputs) &&
        a.inputs.length > 0 &&
        a.inputs.length <= 24,
      "Ungültige Steuerung.",
    );
    for (const command of a.inputs) {
      ensure(
        Number.isSafeInteger(command.seq) &&
          command.seq > 0 &&
          ["left", "right", "down", "cw", "ccw", "drop", "hold"].includes(
            command.key,
          ),
        "Ungültige Bewegung.",
      );
      if (command.seq <= p.seq) continue;
      ensure(
        command.seq === p.seq + 1,
        "Steuerung wird synchronisiert. Bitte kurz warten.",
      );
      p.seq = command.seq;
      if (command.pieceId !== undefined && command.pieceId !== (p.pieceId ?? 1))
        continue;
      p.participated = true;
      refill(p, c);
      const rows = moveBlock(p, command.key as BlockInput, c.now);
      attack(g, id, rows, c);
      if (!p.alive) break;
    }
    finish(g, c);
  },
  tick(g, c) {
    if (g.stage === "battle") {
      const interval = Math.max(
        85,
        850 - Math.floor((c.now - g.public.startedAt) / 20000) * 65,
      );
      for (const id of c.ids) {
        const p = g.players[id] as BlockPlayer;
        if (!p.alive) continue;
        if (p.abandoned) {
          p.alive = false;
          continue;
        }
        let steps = Math.min(22, Math.floor((c.now - p.lastFall) / interval));
        if (steps > 0) p.lastFall += steps * interval;
        while (steps-- > 0 && fits(p, p.x, p.y + 1)) p.y++;
        if (!fits(p, p.x, p.y + 1)) {
          p.groundedAt ??= c.now;
          if (c.now - p.groundedAt >= 500) {
            refill(p, c);
            attack(g, id, lockBlock(p, c.now), c);
          }
        } else p.groundedAt = null;
      }
      finish(g, c);
    }
    nextOrDone(g, c, () => next(g, c));
  },
  view(g, id) {
    return {
      ...commonView(g, id),
      fields: Object.fromEntries(
        Object.entries(g.players).map(([pid, p]) => [
          pid,
          {
            board: p.board,
            kind: p.kind,
            x: p.x,
            y: p.y,
            rotation: p.rotation,
            alive: p.alive,
            lines: p.lines,
            sent: p.sent,
            incoming: p.incoming.length,
            place: p.place,
          },
        ]),
      ),
    };
  },
  results: rawResults,
};
