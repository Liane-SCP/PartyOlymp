/** Shared server-clock timing: reconnects resume the reveal instead of restarting it. */
export const dealerInterval = 1500;
export const dealerDuration = (count: number) => count * dealerInterval + 8500;
export function dealerProgress(now: number, start: number, count: number) {
  return Math.min(
    count,
    1 + Math.max(0, Math.floor((now - start) / dealerInterval)),
  );
}
export function countdownValue(deadline: number, now: number) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

/** Public clock copy follows the phase; hidden clocks never become countdowns. */
export function gameClockText(game: any, now: number): string {
  const { id, stage } = game;
  if (id === "timing" && stage === "answer") return "Zeit verborgen";
  if (id === "bomb" && stage === "word") return "Lunte geheim";
  if (id === "code" && stage === "guess") return "Ohne Zeitdruck";
  if (stage === "intro") return ["colossus", "kraken", "dragon"].includes(id) ? "Der Boss erwacht" : "Die Bühne erwacht";
  if (stage === "volley") return "Gemeinsame Salve";
  if (stage === "roundReveal") return ["colossus", "kraken", "dragon"].includes(id) ? "Gemeinsame Salve" : "Gemeinsame Auflösung";
  if (stage === "voteReveal") return "Stimmen werden aufgedeckt";
  if (stage === "done") return "Runde abgeschlossen";
  if (stage === "topicSpin") return "Das Thema wird gezogen";
  const deadline = id === "dice" && ["answer", "turnReveal"].includes(stage)
    ? game.turnDeadline
    : id === "picture" && game.buzzer ? game.buzzDeadline : game.deadline;
  if (!(deadline > 0)) return "Die Crew spielt";
  const seconds = countdownValue(deadline, now);
  if (stage === "turnReveal") return `Nächster Zug · ${seconds} s`;
  if (stage === "explosion") return `Nächste Übergabe · ${seconds} s`;
  return seconds > 0 ? `${seconds} s` : "Zeit abgelaufen";
}

/** Urgency belongs only to an outstanding personal action, never to waiting. */
export function personalActionDeadline(game: any, me: string): number {
  const mine = game?.mine;
  if (!mine || mine.abandoned || ["timing", "picture", "color"].includes(game.id)) return 0;
  const deadline = game.id === "dice" ? game.turnDeadline : game.deadline;
  if (!(deadline > 0)) return 0;
  switch (game.id) {
    case "bomb":
      return game.stage === "judge" && game.turnId !== me && mine.ballot == null ? deadline : 0;
    case "chain":
      if (game.stage === "topicSuggest") return !mine.topicSubmitted ? deadline : 0;
      if (game.stage === "answer") return game.turnId === me && mine.alive ? deadline : 0;
      if (game.stage === "review") return game.turnId !== me && !mine.approved ? deadline : 0;
      if (game.stage === "challenge") return game.turnId !== me && mine.ballot == null ? deadline : 0;
      return 0;
    case "auction":
      if (game.stage === "topic") return game.setter === me ? deadline : 0;
      if (game.stage === "bid") return game.leader !== me && !mine.passed ? deadline : 0;
      if (game.stage === "perform") return game.leader === me ? deadline : 0;
      if (game.stage === "judge") return game.leader !== me && !mine.submitted ? deadline : 0;
      return 0;
    case "spectrum":
      if (game.stage === "clue") return game.psychic === me ? deadline : 0;
      return game.stage === "guess" && game.psychic !== me && !mine.submitted ? deadline : 0;
    case "categories":
      if (game.stage === "vote") return !game.progress?.[me]?.voted ? deadline : 0;
      break;
    case "cards":
      return game.stage === "answer" && game.turnId === me ? deadline : 0;
    case "blackjack":
      return game.stage === "answer" && !game.status?.[me]?.stood ? deadline : 0;
  }
  return game.stage === "answer" && !mine.submitted ? deadline : 0;
}
export function turnOrder(ids: string[], current: string, direction: number) {
  const start = Math.max(0, ids.indexOf(current));
  return ids.map(
    (_, i) => ids[(start + i * direction + ids.length * i) % ids.length],
  );
}
