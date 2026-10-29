import { int, palette } from "./game/types";
export interface Appearance {
  shape: number;
  accessory: number;
  color: number;
  detail?: number;
  accent?: number;
}
export const shapeNames = [
  "Katze",
  "Blob",
  "Kristall",
  "Kreis",
  "Stern",
  "Kapsel",
  "Geist",
  "Hase",
  "Wolke",
  "Roboter",
];
export const accessoryNames = [
  "Pur",
  "Sonnenbrille",
  "Krone",
  "Kopfhörer",
  "Cap",
  "Schleife",
  "Schnurrbart",
  "Astronaut",
  "Zauberhut",
  "Pirat",
  "Viking",
  "Zylinder",
  "Beanie",
  "Pilz",
  "Froschhut",
  "Partyhut",
  "Heiligenschein",
  "Teufel",
  "Einhorn",
  "Blumenkranz",
  "Ninja",
  "Taucher",
  "Monokel",
  "Visor",
];
export const detailNames = [
  "Ohne Extra",
  "Halstuch",
  "Fliege",
  "Goldkette",
  "Stern-Pin",
  "Blitz",
  "Pflaster",
  "Sommersprossen",
  "Ohrringe",
  "Flügel",
  "Cape",
  "Bart",
  "Rundbrille",
  "Augenklappe",
  "Maske",
  "Herzbrille",
];
export const characterColors = palette;
export function appearance(value: unknown): Appearance | undefined {
  if (value === undefined || value === null) return undefined;
  const v = value as Appearance;
  return {
    shape: int(v.shape, 0, shapeNames.length - 1),
    accessory: int(v.accessory, 0, accessoryNames.length - 1),
    color: int(v.color, 0, palette.length - 1),
    detail: int(v.detail ?? 0, 0, detailNames.length - 1),
    accent: int(v.accent ?? 3, 0, palette.length - 1),
  };
}
