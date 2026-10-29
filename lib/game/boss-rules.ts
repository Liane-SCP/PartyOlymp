import type { GameId } from "./types";

export type BossId = "colossus" | "kraken" | "dragon";
export type DragonRisk = "safe" | "bold" | "risky";
export type ColossusWeakness = "pairs" | "straight" | "kind";

export function isBoss(id: string): id is BossId {
  return id === "colossus" || id === "kraken" || id === "dragon";
}

export function minimumRounds(id: GameId) {
  return isBoss(id) ? 3 : id === "spectrum" ? 2 : 1;
}

export const bossPhaseNames: Record<BossId, [string, string, string]> = {
  colossus: ["Der steinerne Helm", "Der Runenpanzer", "Das Herz des Berges"],
  kraken: ["Arme aus der Tiefe", "Im Auge des Mahlstroms", "Der letzte Sturm"],
  dragon: ["Goldene Schuppen", "Flügel aus Feuer", "Das Herz des Horts"],
};

export const colossusWeaknesses: {
  id: ColossusWeakness;
  label: string;
  description: string;
}[] = [
  {
    id: "pairs",
    label: "Paare knacken Stein",
    description: "Mindestens ein Paar: +300 Schwäche-Punkte.",
  },
  {
    id: "straight",
    label: "Straßen brechen Runen",
    description:
      "Vier oder fünf aufeinanderfolgende Augen: +300 Schwäche-Punkte.",
  },
  {
    id: "kind",
    label: "Gleiche Augen treffen das Herz",
    description: "Mindestens drei gleiche Augen: +300 Schwäche-Punkte.",
  },
];

/** Pure scoring preview, also used by the authoritative game engine. */
export function colossusScore(
  dice: number[],
  weakness: ColossusWeakness | { id: ColossusWeakness },
) {
  if (
    dice.length !== 5 ||
    dice.some((value) => !Number.isInteger(value) || value < 1 || value > 6)
  )
    return {
      score: 0,
      label: "Zuerst würfeln",
      comboScore: 0,
      weaknessBonus: 0,
      weaknessMatched: false,
    };
  const counts = Array.from(
    { length: 6 },
    (_, i) => dice.filter((value) => value === i + 1).length,
  );
  const largest = Math.max(...counts);
  const set = new Set(dice);
  const straight = [1, 2, 3].some((start) =>
    [start, start + 1, start + 2, start + 3].every((value) => set.has(value)),
  );
  const largeStraight =
    set.size === 5 && Math.max(...dice) - Math.min(...dice) === 4;
  let comboScore = 100;
  let label = "Fünf Einzelne";
  if (largest === 5) [comboScore, label] = [1200, "Fünferpasch"];
  else if (largest === 4) [comboScore, label] = [950, "Viererpasch"];
  else if (largeStraight) [comboScore, label] = [900, "Große Straße"];
  else if (counts.includes(3) && counts.includes(2))
    [comboScore, label] = [800, "Full House"];
  else if (straight) [comboScore, label] = [650, "Kleine Straße"];
  else if (largest === 3) [comboScore, label] = [450, "Dreierpasch"];
  else if (counts.filter((count) => count === 2).length === 2)
    [comboScore, label] = [350, "Zwei Paare"];
  else if (largest === 2) [comboScore, label] = [200, "Ein Paar"];
  const id = typeof weakness === "string" ? weakness : weakness.id;
  const weaknessMatched =
    id === "pairs" ? largest >= 2 : id === "straight" ? straight : largest >= 3;
  const weaknessBonus = weaknessMatched ? 300 : 0;
  return {
    score: comboScore + weaknessBonus,
    label,
    comboScore,
    weaknessBonus,
    weaknessMatched,
  };
}

/** Measured relative to each player's local pointer-down, never server polling. */
export function krakenGauge(elapsedMs: number, phase: number, seed: number) {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const level = Math.max(0, Math.min(2, Math.floor(phase)));
  const cycle = (elapsed % 3000) / 3000;
  const position = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
  const offset = ((seed % 1000) / 1000) * Math.PI * 2;
  const target =
    level === 0
      ? 0.68
      : level === 1
        ? 0.6 + 0.14 * Math.sin(elapsed / 1100 + offset)
        : 0.5 + 0.23 * Math.sin(elapsed / 900 + offset);
  const width = [0.24, 0.18, 0.14][level];
  // The highlighted zone awards at least 80%; its central fifth is perfect.
  const distance = Math.abs(position - target);
  const accuracy = Math.max(
    0,
    Math.min(1, 1 - Math.max(0, distance - width * 0.1) / (width * 2)),
  );
  return { position, target, width, accuracy };
}

export const dragonRisks: {
  id: DragonRisk;
  label: string;
  multiplier: number;
  exponent: number;
}[] = [
  { id: "safe", label: "Sicher", multiplier: 1, exponent: 1 },
  { id: "bold", label: "Mutig", multiplier: 1.25, exponent: 2 },
  { id: "risky", label: "Alles riskieren", multiplier: 1.6, exponent: 4 },
];

export function dragonScore(guess: number, price: number, risk: DragonRisk) {
  const option =
    dragonRisks.find((entry) => entry.id === risk) ?? dragonRisks[0];
  if (
    !Number.isFinite(guess) ||
    guess <= 0 ||
    !Number.isFinite(price) ||
    price <= 0
  )
    return {
      score: 0,
      accuracy: 0,
      error: 1,
      label: "Kein Tipp",
      multiplier: option.multiplier,
    };
  const error = Math.abs(guess - price) / price;
  const accuracy = Math.max(0, 1 - error);
  return {
    score: Math.round(1000 * option.multiplier * accuracy ** option.exponent),
    accuracy,
    error,
    label:
      error <= 0.02
        ? "Goldener Volltreffer"
        : error <= 0.1
          ? "Fast punktgenau"
          : error <= 0.3
            ? "Gute Schätzung"
            : error < 1
              ? "Weit daneben"
              : "Am Schatz vorbei",
    multiplier: option.multiplier,
  };
}
