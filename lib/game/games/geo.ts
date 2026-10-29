import {
  base,
  commonView,
  everyone,
  finishRound,
  nextOrDone,
  pick,
  rawResults,
  reset,
  submit,
} from "../common";
import archive from "../data/world-panoramas.json";
const places = archive.filter(
  (place) => place.environment === "outdoor" && place.outdoorReviewed === true,
);
const region = (p: { lat: number; lon: number }) =>
  `${Math.floor(p.lat / 5)},${Math.floor(p.lon / 5)}`;
const regionCounts = new Map<string, number>();
for (const place of places)
  regionCounts.set(region(place), (regionCounts.get(region(place)) ?? 0) + 1);
import {
  ensure,
  type Context,
  type GameModule,
  type GameState,
} from "../types";
export function geoDistance(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const rad = Math.PI / 180,
    dlat = (b.lat - a.lat) * rad,
    dlon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlon / 2) ** 2;
  return (
    6371 *
    2 *
    Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)))
  );
}
export const geoScore = (km: number) =>
  km <= 1 ? 5000 : Math.round(5000 * Math.exp(-km / 1800));
function next(g: GameState, c: Context) {
  reset(g, c);
  // Soften the source archive's regional imbalance while keeping every place
  // eligible and exhausting the complete pool before repeating a location.
  g.secret.place = pick(
    places,
    c,
    (place) => 1 / Math.sqrt(regionCounts.get(region(place))!),
  );
  g.public.image = g.secret.place.image;
  g.public.credit = {
    author: g.secret.place.author,
    license: g.secret.place.license,
    licenseUrl: g.secret.place.licenseUrl,
  };
}
function resolve(g: GameState, c: Context) {
  const players = c.ids.map((id) => {
    const p = g.players[id],
      distance = p.answer ? geoDistance(p.answer, g.secret.place) : null,
      score = distance === null ? 0 : geoScore(distance);
    g.scores[id] += score;
    const row = { id, guess: p.answer, distance, score };
    (p.history ??= []).push(row);
    return row;
  });
  finishRound(g, c, { players, place: g.secret.place });
}
export const geo: GameModule = {
  init(c) {
    const g = base("geo", c);
    next(g, c);
    return g;
  },
  action(g, id, a, c) {
    ensure(
      a.type === "pin" &&
        typeof a.lat === "number" &&
        Number.isFinite(a.lat) &&
        Math.abs(a.lat) <= 90 &&
        typeof a.lon === "number" &&
        Number.isFinite(a.lon) &&
        Math.abs(a.lon) <= 180,
      "Setze einen gültigen Pin auf die Karte.",
    );
    submit(g, id, c);
    g.players[id].answer = { lat: a.lat, lon: a.lon };
    if (everyone(g, c)) resolve(g, c);
  },
  tick(g, c) {
    if (g.stage === "answer" && c.now >= g.deadline) resolve(g, c);
    nextOrDone(g, c, () => next(g, c));
  },
  view: commonView,
  results: rawResults,
};
