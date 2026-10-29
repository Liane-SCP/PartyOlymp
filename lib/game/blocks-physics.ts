// Pure physics shared by authoritative simulation and immediate input prediction.
export type BlockKind = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type BlockInput =
  "left" | "right" | "down" | "cw" | "ccw" | "drop" | "hold";
export const blockColors = [
  "transparent",
  "#54dfff",
  "#ffe06d",
  "#c29aff",
  "#a7ed68",
  "#ff8097",
  "#7c9dff",
  "#ffb56b",
  "#64718b",
];
export const blockKinds: BlockKind[] = ["I", "O", "T", "S", "Z", "J", "L"];
const shapes: Record<BlockKind, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [2, 2],
    [2, 2],
  ],
  T: [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  S: [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  Z: [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  J: [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
};
export interface BlockPlayer {
  board: number[][];
  kind: BlockKind;
  x: number;
  y: number;
  rotation: number;
  queue: BlockKind[];
  hold: BlockKind | null;
  held: boolean;
  alive: boolean;
  lines: number;
  pieces: number;
  sent: number;
  incoming: number[];
  combo: number;
  lastClear: number;
  lastClearAt: number;
  lastFall: number;
  groundedAt: number | null;
  resets: number;
  seq: number;
  pieceId?: number;
  participated: boolean;
  abandoned?: boolean;
  place?: number;
}
function rotateShape(kind: BlockKind, rotation = 0): number[][] {
  let matrix = shapes[kind].map((row) => [...row]);
  if (kind === "O") return matrix;
  for (let i = 0; i < ((rotation % 4) + 4) % 4; i++)
    matrix = matrix[0].map((_, x) => matrix.map((row) => row[x]).reverse());
  return matrix;
}
const rotations = Object.fromEntries(
  blockKinds.map((kind) => [
    kind,
    Array.from({ length: 4 }, (_, r) => rotateShape(kind, r)),
  ]),
) as Record<BlockKind, number[][][]>;
export function blockShape(kind: BlockKind, rotation = 0) {
  return rotations[kind][((rotation % 4) + 4) % 4];
}
export function fits(p: BlockPlayer, x = p.x, y = p.y, rotation = p.rotation) {
  return blockShape(p.kind, rotation).every((row, dy) =>
    row.every(
      (cell, dx) =>
        !cell ||
        (x + dx >= 0 &&
          x + dx < 10 &&
          y + dy < 22 &&
          (y + dy < 0 || !p.board[y + dy][x + dx])),
    ),
  );
}
export function ghostY(p: BlockPlayer) {
  let y = p.y;
  while (fits(p, p.x, y + 1)) y++;
  return y;
}
export function spawnBlock(p: BlockPlayer, now: number, kind?: BlockKind) {
  const next = kind ?? p.queue.shift();
  if (!next) {
    p.alive = false;
    return;
  }
  p.kind = next;
  p.pieceId = (p.pieceId ?? 0) + 1;
  p.rotation = 0;
  p.x = next === "O" ? 4 : 3;
  p.y = 0;
  p.groundedAt = null;
  p.resets = 0;
  p.lastFall = now;
  if (!fits(p)) p.alive = false;
}
export function lockBlock(p: BlockPlayer, now: number) {
  for (const [dy, row] of blockShape(p.kind, p.rotation).entries())
    for (const [dx, cell] of row.entries())
      if (cell && p.y + dy >= 0) p.board[p.y + dy][p.x + dx] = cell;
  const remaining = p.board.filter((row) => row.some((cell) => !cell));
  const cleared = 22 - remaining.length;
  p.board = [
    ...Array.from({ length: cleared }, () => Array(10).fill(0)),
    ...remaining,
  ];
  p.lines += cleared;
  p.pieces++;
  p.combo = cleared ? p.combo + 1 : -1;
  p.lastClear = cleared;
  p.lastClearAt = now;
  let attack =
    [0, 0, 1, 2, 4][cleared] +
    (cleared && p.combo >= 2 ? Math.min(4, Math.floor(p.combo / 2)) : 0);
  while (attack > 0 && p.incoming.length) {
    p.incoming.shift();
    attack--;
  }
  // Cancellation happens first; uncancelled incoming rows rise only on a non-clear.
  if (!cleared) {
    for (const hole of p.incoming.splice(0, 8)) {
      if (p.board.shift()!.some(Boolean)) p.alive = false;
      p.board.push(Array.from({ length: 10 }, (_, x) => (x === hole ? 0 : 8)));
    }
  }
  p.held = false;
  if (p.alive) spawnBlock(p, now);
  return attack;
}
// Rotation kick offsets: small horizontal/vertical adjustments keep wall rotations usable.
export function moveBlock(
  p: BlockPlayer,
  input: BlockInput,
  now: number,
): number {
  if (!p.alive) return 0;
  if (input === "drop") {
    p.y = ghostY(p);
    return lockBlock(p, now);
  }
  if (input === "hold") {
    if (!p.held) {
      const old = p.kind,
        held = p.hold;
      p.hold = old;
      spawnBlock(p, now, held ?? undefined);
      p.held = true;
    }
    return 0;
  }
  let moved = false;
  if (input === "left" || input === "right" || input === "down") {
    const x = p.x + (input === "left" ? -1 : input === "right" ? 1 : 0),
      y = p.y + (input === "down" ? 1 : 0);
    if (fits(p, x, y)) {
      p.x = x;
      p.y = y;
      moved = true;
    }
  } else {
    const rotation = (p.rotation + (input === "cw" ? 1 : 3)) % 4;
    for (const [dx, dy] of [
      [0, 0],
      [-1, 0],
      [1, 0],
      [-2, 0],
      [2, 0],
      [0, -1],
      [-1, -1],
      [1, -1],
      [0, -2],
    ]) {
      if (fits(p, p.x + dx, p.y + dy, rotation)) {
        p.x += dx;
        p.y += dy;
        p.rotation = rotation;
        moved = true;
        break;
      }
    }
  }
  if (moved && p.groundedAt !== null && p.resets < 15) {
    p.groundedAt = now;
    p.resets++;
  }
  if (fits(p, p.x, p.y + 1)) p.groundedAt = null;
  else p.groundedAt ??= now;
  return 0;
}
// Falling is predicted locally; locking remains authoritative to avoid retracting
// cleared rows when an older server snapshot arrives.
export function predictFall(p: BlockPlayer, now: number, startedAt: number) {
  if (!p.alive) return;
  const interval = Math.max(
    85,
    850 - Math.floor((now - startedAt) / 20000) * 65,
  );
  let steps = Math.min(
    22,
    Math.max(0, Math.floor((now - p.lastFall) / interval)),
  );
  if (steps > 0) p.lastFall += steps * interval;
  while (steps-- > 0 && fits(p, p.x, p.y + 1)) p.y++;
}
