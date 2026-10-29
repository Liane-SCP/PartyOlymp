import type { Result } from "./types";
import { isBoss } from "./boss-rules";

export const olympiadMultiplier = (game: string) => isBoss(game) ? 3 : 1;
const sameScore = (a: number, b: number) =>
  Math.abs(a - b) <=
  Number.EPSILON * 32 * Math.max(1, Math.abs(a), Math.abs(b));
export function award(results: Result[], n: number, multiplier = 1): Result[] {
  const sorted = results
    .filter((r) => r.valid && Number.isFinite(r.raw))
    .sort((a, b) => b.raw - a.raw);
  const out = results.map((r) => ({
    ...r,
    points: 0,
    rank: undefined as number | undefined,
  }));
  if (n < 2 || !sorted.length) return out;
  for (let i = 0; i < sorted.length;) {
    let j = i + 1;
    // Fractional round points can arrive in different addition orders. Only
    // ignore floating-point noise, preserving meaningful score differences.
    while (j < sorted.length && sameScore(sorted[j].raw, sorted[i].raw)) j++;
    let sum = 0;
    for (let k = i; k < j; k++) sum += (100 * (n - (k + 1))) / (n - 1);
    for (let k = i; k < j; k++) {
      const r = out.find((x) => x.id === sorted[k].id)!;
      r.rank = i + 1;
      r.points = (sum / (j - i)) * multiplier;
    }
    i = j;
  }
  return out;
}
export function ranking<T extends {points:number}>(players: T[]) {
  // Base awards plus 25% relic boosts lie on the exact lattice 12.5 / (N - 1).
  // Compare integer units so addition order cannot break a mathematical tie.
  const units = (p: T) =>
    Math.round(p.points * 8 * Math.max(1, players.length - 1));
  const sorted = [...players].sort(
    (a, b) => units(b) - units(a),
  );
  let rank = 1;
  return sorted.map((p, i) => {
    if (
      i &&
      units(p) !== units(sorted[i - 1])
    )
      rank = i + 1;
    return { ...p, rank };
  });
}
