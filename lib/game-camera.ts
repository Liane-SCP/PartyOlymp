/** Small, event-driven camera impulses; values are CSS pixels, not frame loops. */
export function gameImpact(game: string, event: string) {
  if (["colossus", "kraken", "dragon"].includes(game)) return null;
  // The measuring instrument stays still. A CSS transform on its parent would
  // also change the containing block of its fixed, compact reading view.
  if (game === "spectrum") return null;
  if (game === "wiki") return null;
  if (game === "picture") return null;
  if (game === "color") return null;
  if (game === "geo") return null;
  // The casino owns a fixed place view. Moving its ancestor would change the
  // dialog's containing block; cards and payouts already provide feedback.
  if (game === "blackjack") return null;
  if (game === "timing" && event !== "roundReveal") return null;
  const impacts: Record<string, [number, number]> = {
    explosion: [7, 360],
    chainOut: [4, 260],
    wrong: [2, 160],
    dice: [3, 240],
    score: [3, 240],
    card: [2, 180],
    gavel: [5, 270],
    bid: [1.5, 140],
    bombPass: [2, 180],
    correct: [3, 230],
    finish: [3, 260],
    codeFeedback: [3, 240],
    categoryResult: [3, 220],
    chainAccepted: [2, 180],
    roundReveal: [3.5, 280],
  };
  return impacts[event] ?? null;
}
