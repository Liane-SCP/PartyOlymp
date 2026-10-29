// Treat typographic variants produced by keyboards consistently on both sides.
// Preserve letter case and punctuation; ignore only invisible formatting noise.
export function normalizeRaceText(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\u200b-\u200d\ufeff\u00ad]/g, "")
    .replace(/[\u2018\u2019\u201a\u2032]/g, "'")
    .replace(/[\u201c\u201d\u201e\u00ab\u00bb]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\s+/g, " ")
    .trimStart();
}
export function racePrefix(input: string, target: string) {
  const a = normalizeRaceText(input),
    b = normalizeRaceText(target).trimEnd();
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}
export function raceFinished(input: string, target: string) {
  return (
    normalizeRaceText(input).trimEnd() === normalizeRaceText(target).trimEnd()
  );
}
export function raceMetrics(
  progress: number,
  length: number,
  startedAt: number,
  now: number,
  finishedAt?: number | null,
) {
  const correct = Math.min(length, Math.max(0, progress || 0));
  const finished =
    typeof finishedAt === "number" && Number.isFinite(finishedAt);
  const seconds = Math.max(
    1,
    ((finished ? finishedAt : now) - startedAt) / 1000,
  );
  return {
    percent: finished
      ? 100
      : Math.min(99, Math.floor((100 * correct) / Math.max(1, length))),
    wpm: Math.round((correct * 12) / seconds),
    finished,
  };
}
