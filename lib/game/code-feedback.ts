export type CodeFeedback = { exact: number; misplaced: number };

/** Feedback is an unordered count; a peg is consumed at most once. */
export function codeFeedback(
  secret: readonly number[],
  guess: readonly number[],
): CodeFeedback {
  if (secret.length !== guess.length) throw new Error("Code lengths differ");
  let exact = 0,
    misplaced = 0;
  const remaining = new Map<number, number>();
  secret.forEach((color, i) => {
    if (color === guess[i]) exact++;
    else remaining.set(color, (remaining.get(color) ?? 0) + 1);
  });
  guess.forEach((color, i) => {
    if (color === secret[i]) return;
    const count = remaining.get(color) ?? 0;
    if (count > 0) {
      misplaced++;
      remaining.set(color, count - 1);
    }
  });
  return { exact, misplaced };
}
