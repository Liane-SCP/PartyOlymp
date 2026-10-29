export const wordCategories = [
  "Land",
  "YouTuber",
  "Essen",
  "Tier",
  "Getränk",
  "Beruf",
  "Game",
];
export function wordKey(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("de")
    .replace(/^(der|die|das|the)\s+/, "")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}
export const startsWithLetter = (answer: string, letter: string) =>
  wordKey(answer).startsWith(letter.toLowerCase());
