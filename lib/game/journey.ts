import { isBoss, type BossId } from "./boss-rules";
import { ensure, uid, type Result, type Room } from "./types";

export const relics = [
  { id: "laurel", name: "Goldener Lorbeer", symbol: "✦", color: "#ffd483", title: "Dein großer Auftritt",
    description: "+25 % auf deine erspielten Olympiadenpunkte. Bei Bossen ebenfalls wirksam." },
  { id: "phoenix", name: "Phönixfeder", symbol: "❧", color: "#ff967b", title: "Ein zweiter Aufstieg",
    description: "Hebt deine Wertung auf mindestens 40 Punkte an, bei Bossen auf 120. Nur mit gültigem Ergebnis." },
  { id: "comet", name: "Sternensplitter", symbol: "✧", color: "#92dfff", title: "Greif nach den Sternen",
    description: "+20 Olympiadenpunkte, wenn du die obere Hälfte erreichst. Bei Bossen +60. Geteilte Plätze zählen." },
] as const;
export type RelicKind = typeof relics[number]["id"];
export interface Relic { id: string; kind: RelicKind }
export interface Journey {
  orderVersion?: number;
  moves?: Record<string, import("./journey-motion").MapMove>;
  travel?: import("./journey-motion").CrewTravel;
  inventories: Record<string, Relic[]>;
  chests: Record<string, number>;
  equipped: Record<string, { relic: Relic; index: number }>;
  trophies: { boss: BossId; index: number; victory: boolean }[];
  lastRewards?: { index: number; rows: { player: string; kind: RelicKind; base: number; bonus: number }[]; chest: boolean };
}
export const relicInfo = (kind: string) => relics.find(r => r.id === kind);

/** Shared by the authoritative award and the reveal preview. */
export function relicBonus(kind: RelicKind, result: Result, count: number, multiplier: number) {
  if (!result.valid) return 0;
  const base = result.points ?? 0;
  return kind === "laurel" ? base * 0.25
    : kind === "phoenix" ? Math.max(0, 40 * multiplier - base)
    : (result.rank ?? Infinity) <= Math.ceil(count / 2) ? 20 * multiplier : 0;
}

export function beginJourney(r: Room) {
  r.journey = { orderVersion:3, moves:{}, inventories: {}, chests: {}, equipped: {}, trophies: [] };
  for (const id of r.participantIds) {
    r.journey.inventories[id] = relics.map(relic => ({ id: uid(), kind: relic.id }));
    r.journey.chests[id] = 0;
  }
}

/** All effects run once, inside the room's existing exactly-once result transaction. */
export function journeyAwards(r: Room, results: Result[]) {
  const j = r.journey;
  if (!j) return results;
  const multiplier = isBoss(r.selection[r.index].id) ? 3 : 1;
  const rows: NonNullable<Journey["lastRewards"]>["rows"] = [];
  const awarded = results.map(result => {
    const equipped = j.equipped[result.id];
    if (!equipped || equipped.index !== r.index) return result;
    const base = result.points ?? 0;
    const kind = equipped.relic.kind;
    const bonus = relicBonus(kind, result, r.participantIds.length, multiplier);
    rows.push({ player: result.id, kind, base, bonus });
    return { ...result, points: base + bonus };
  });
  const chest = (r.index + 1) % 2 === 0 && r.index + 1 < r.selection.length;
  if (chest) for (const id of r.participantIds) j.chests[id] = (j.chests[id] ?? 0) + 1;
  const boss = r.game;
  if (boss && isBoss(boss.id)) j.trophies.push({ boss: boss.id, index: r.index, victory: !!boss.public.boss?.victory });
  j.lastRewards = { index: r.index, rows, chest };
  return awarded;
}

export function journeyAction(r: Room, player: string, a: { type: string; item?: string; kind?: string }) {
  const j = r.journey;
  ensure(j && r.participantIds.includes(player), "Nur die aktive Crew kann Relikte verwenden.");
  if (a.type === "relic") {
    ensure(r.phase === "rules", "Relikte werden vor einer Disziplin ausgerüstet.");
    ensure(!r.players.find(p => p.id === player)?.ready, "Wähle dein Relikt, bevor du dich bereit meldest.");
    ensure(j.equipped[player]?.index !== r.index, "Für diese Disziplin ist bereits ein Relikt versiegelt.");
    const inventory = j.inventories[player] ?? [];
    const index = inventory.findIndex(item => item.id === a.item);
    ensure(index >= 0, "Dieses Relikt liegt nicht in deinem Rucksack.");
    const [relic] = inventory.splice(index, 1);
    j.equipped[player] = { relic, index: r.index };
  } else {
    ensure(["standings", "paused", "rules"].includes(r.phase), "Öffne Schatztruhen zwischen den Disziplinen.");
    ensure((j.chests[player] ?? 0) > 0, "Du hast keine ungeöffnete Schatztruhe.");
    ensure(relicInfo(a.kind ?? ""), "Wähle ein bekanntes Relikt.");
    ensure((j.inventories[player]?.length ?? 0) < 5, "Dein Rucksack ist voll. Setze zuerst ein Relikt ein.");
    (j.inventories[player] ??= []).push({ id: uid(), kind: a.kind as RelicKind });
    j.chests[player]--;
  }
}

export function journeyView(r: Room, player: string) {
  const j = r.journey;
  if (!j) return null;
  return {
    inventory: j.inventories[player] ?? [], chests: j.chests[player] ?? 0,
    equipped: Object.entries(j.equipped).filter(([, e]) => e.index === r.index).map(([player, e]) => ({ player, kind: e.relic.kind })),
    trophies: j.trophies, lastRewards: j.lastRewards,
    moves:j.moves??{}, travel:j.travel,
  };
}

export function journeyRealm(id: string) {
  return id === "colossus" ? { name: "Der Runentempel", color: "#c8b3ff", subtitle: "Wo uralte Wächter erwachen", short: "Runentempel" }
    : id === "kraken" ? { name: "Das Sturmmeer", color: "#7cdeed", subtitle: "Gemeinsam durch die tosende Tiefe", short: "Sturmmeer" }
    : id === "dragon" ? { name: "Die Goldene Kammer", color: "#ffd483", subtitle: "Hier wird aus Mut eine Legende", short: "Goldkammer" }
    : { name: "Die Himmelsinseln", color: "#c4e5b0", subtitle: "Jede Disziplin bringt euch dem Olymp näher", short: "Himmelsinsel" };
}
