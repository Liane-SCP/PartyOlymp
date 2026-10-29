import { isBoss } from "./boss-rules";
import type { Selection } from "./types";

export interface WheelDraw {
  id: string;
  startedAt: number;
  spinMs: number;
  entries: { id: string; name: string; player?: string }[];
  selected: number;
}
export const WHEEL_MS = 10000;
export function wheelDraw(id: string, entries: WheelDraw["entries"], now: number, random: () => number): WheelDraw {
  if (!entries.length) throw new Error("Der Lostopf ist leer.");
  return { id, entries, startedAt: now, spinMs: 7000, selected: Math.floor(random() * entries.length) };
}
/** Boss order follows the configured pool; normal entries stay available for later draws. */
export function spacedBosses(selection: Selection[]): Selection[] {
  const bosses = selection.filter(s => isBoss(s.id));
  const normal = selection.filter(s => !isBoss(s.id));
  if (!bosses.length) return [...selection];
  // A warm-up before the first boss and at least one real discipline between bosses.
  // Boss-only pools receive short, fully scored interludes rather than a boss rush.
  const interludes: Selection[] = [{id:"picture",rounds:1,seconds:25},{id:"herd",rounds:1,seconds:25},{id:"color",rounds:1,seconds:20},{id:"timing",rounds:1,seconds:45}];
  let added = 0;
  while (normal.length < bosses.length) normal.push({...interludes[added++ % interludes.length]});
  const count = normal.length + bosses.length;
  const slots = new Map(bosses.map((s, i) => [Math.floor((i + 1) * count / bosses.length) - 1, s]));
  let next = 0;
  return Array.from({length:count}, (_, i) => slots.get(i) ?? normal[next++]);
}
export function wheelAngle(draw: WheelDraw, now: number): number {
  const progress = Math.max(0, Math.min(1, (now - draw.startedAt - 600) / draw.spinMs));
  return (2160 + (360 - draw.selected * 360 / draw.entries.length) % 360) * (1 - (1 - progress) ** 4);
}
export function wheelSettled(draw: WheelDraw, now: number) {
  return now >= draw.startedAt + 600 + draw.spinMs;
}
