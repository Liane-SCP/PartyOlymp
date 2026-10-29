export function spectrumClueError(value: string) {
  const clue = value.trim();
  if (!clue) return "Gib zuerst einen Begriff ein.";
  if (clue.length > 80)
    return "Dein Hinweis darf höchstens 80 Zeichen lang sein.";
  if (!/\p{L}/u.test(clue))
    return "Nenne einen Begriff statt nur eines Zahlenwerts. Namen wie GTA 5 sind erlaubt.";
  return "";
}
