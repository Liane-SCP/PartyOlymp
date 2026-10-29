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
  type GameModule,
  type GameState,
  type Context,
} from "../types";
function auto(size: number) {
  return [0, 1, 2, size * 2 + 2, size * 2 + 3, size * 4 + 4];
}
function battle(g: GameState, c: Context) {
  g.stage = "answer";
  g.deadline = c.now + c.settings.seconds * 1000;
  for (const id of c.ids) {
    const p = g.players[id];
    p.submitted = false;
    p.shot = null;
  }
  g.public.shots = g.public.shots ?? [];
}
function placement(g: GameState, c: Context) {
  g.stage = "placement";
  g.deadline = c.now + 45000;
  g.public.shots = [];
  g.public.volley = 1;
  g.public.maxVolleys = Math.max(12, Math.ceil(c.ids.length * 1.5));
  for (const id of c.ids)
    Object.assign(g.players[id], { ships: [], submitted: false, shot: null });
}
function resolve(g: GameState, c: Context) {
  const rows = c.ids
    .filter((id) => g.players[id].shot !== null)
    .map((id) => ({ id, cell: g.players[id].shot, hits: 0, sunk: 0, loot: 0 }));
  for (const target of c.ids)
    for (const ship of g.players[target].ships) {
      const contributors = new Set<string>();
      let touched = false;
      for (const cell of ship.cells) {
        if (ship.hits.includes(cell)) continue;
        const attackers = rows.filter(
          (r) => r.id !== target && r.cell === cell,
        );
        if (!attackers.length) continue;
        ship.hits.push(cell);
        touched = true;
        for (const a of attackers) {
          a.hits++;
          a.loot += 10 / attackers.length;
          contributors.add(a.id);
        }
      }
      if (touched && ship.hits.length === ship.cells.length)
        for (const id of contributors) {
          const a = rows.find((r) => r.id === id)!;
          a.sunk++;
          a.loot += 25 / contributors.size;
        }
    }
  for (const row of rows) {
    g.scores[row.id] += row.loot;
    const p = g.players[row.id];
    p.history ??= [];
    p.history.push(row);
  }
  g.public.shots.push(...rows);
  const revealRows = c.ids.map(
    (id) =>
      rows.find((row) => row.id === id) ?? {
        id,
        cell: null,
        hits: 0,
        sunk: 0,
        loot: 0,
        missed: true,
      },
  );
  g.public.reveal = { players: revealRows };
  if (
    g.public.volley >= g.public.maxVolleys ||
    c.ids.every((id) =>
      g.players[id].ships.every((s: any) => s.hits.length === s.cells.length),
    )
  ) {
    finishRound(g, c, { players: revealRows });
  } else {
    g.stage = "volleyReveal";
    g.deadline = c.now + 6000;
  }
  event(g, "hit");
}
export const fleet: GameModule = {
  init(c) {
    const g = base("fleet", c);
    g.stage = "placement";
    g.deadline = c.now + 45000;
    g.public = {
      size: Math.max(8, Math.ceil(Math.sqrt(c.ids.length * 14))),
      lengths: [3, 2, 1],
      shots: [],
    };
    for (const id of c.ids)
      g.players[id] = {
        ships: [],
        submitted: false,
        shot: null,
        participated: false,
      };
    placement(g, c);
    return g;
  },
  action(g, id, a, c) {
    const p = g.players[id],
      size = g.public.size;
    if (g.stage === "placement") {
      ensure(
        a.type === "place" && !p.submitted,
        "Platzierung bereits bestätigt.",
      );
      ensure(
        Array.isArray(a.ships) && a.ships.length === 3,
        "Platziere drei Schiffe.",
      );
      const used = new Set<number>();
      p.ships = a.ships.map((s: any, i: number) => {
        const origin = int(s.cell, 0, size * size - 1),
          vertical = !!s.vertical,
          len = [3, 2, 1][i];
        ensure(
          vertical
            ? Math.floor(origin / size) + len <= size
            : (origin % size) + len <= size,
          "Schiff außerhalb des Meers.",
        );
        const cells = Array.from(
          { length: len },
          (_, k) => origin + k * (vertical ? size : 1),
        );
        for (const cell of cells) {
          ensure(!used.has(cell), "Deine Schiffe überschneiden sich.");
          used.add(cell);
        }
        return { cells, hits: [] };
      });
      p.submitted = true;
      p.participated = true;
      event(g, "confirm", id);
      return;
    }
    ensure(
      g.stage === "answer" &&
        c.now < g.deadline &&
        !p.submitted &&
        a.type === "shoot",
      "Schuss nicht möglich.",
    );
    const cell = int(a.cell, 0, size * size - 1);
    ensure(
      !g.public.shots.some((s: any) => s.id === id && s.cell === cell),
      "Du hast dort bereits geschossen.",
    );
    p.shot = cell;
    p.submitted = true;
    p.participated = true;
    event(g, "confirm", id);
  },
  tick(g, c) {
    if (g.public.maxVolleys === undefined) {
      // Previous releases counted individual shots as rounds. Preserve ships
      // and loot while converting an in-progress room to one complete match.
      g.public.volley = 1;
      g.public.maxVolleys = Math.max(12, g.totalRounds - g.round);
      g.round = 0;
      g.totalRounds = 1;
      if (g.stage === "roundReveal") g.stage = "volleyReveal";
    }
    if (
      g.stage === "placement" &&
      (c.now >= g.deadline || c.ids.every((id) => g.players[id].submitted))
    ) {
      for (const id of c.ids)
        if (!g.players[id].ships.length) {
          const cells = auto(g.public.size);
          g.players[id].ships = [
            { cells: cells.slice(0, 3), hits: [] },
            { cells: cells.slice(3, 5), hits: [] },
            { cells: cells.slice(5), hits: [] },
          ];
        }
      battle(g, c);
    }
    nextOrDone(g, c, () => placement(g, c));
    if (g.stage === "volleyReveal" && c.now >= g.deadline) {
      g.public.volley++;
      battle(g, c);
    }
    if (
      g.stage === "answer" &&
      (c.now >= g.deadline || c.ids.every((id) => g.players[id].submitted))
    )
      resolve(g, c);
  },
  view(g, id) {
    return {
      ...commonView(g, id),
      remaining: Object.fromEntries(
        Object.entries(g.players).map(([id, p]) => [
          id,
          p.ships.filter((s: any) => s.hits.length < s.cells.length).length,
        ]),
      ),
    };
  },
  results: rawResults,
};
