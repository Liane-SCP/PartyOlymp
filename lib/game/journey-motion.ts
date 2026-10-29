import type { Room } from "./types";
import { ensure } from "./types";
import { mapAvailable,PARTY_FLOW } from './party-flow';
export interface MapPoint { x: number; z: number }
export interface MapMove { index: number; from: MapPoint; to: MapPoint; at: number; duration: number }
export interface CrewTravel { from: number; to: number; at: number; duration: number; starts?:Record<string,MapPoint> }
export const TRAVEL_MS = PARTY_FLOW.travel;
export function mapSpawn(slot: number, count: number): MapPoint {
  const angle = 0.45 + slot * Math.PI * 2 / Math.max(1,count);
  return {x:Math.cos(angle)*0.68,z:Math.sin(angle)*0.68};
}
/** The clear walking ring avoids central monuments and the irregular cliff edges. */
export function mapDestination(x: unknown, z: unknown): MapPoint {
  ensure(typeof x === "number" && typeof z === "number" && Number.isFinite(x) && Number.isFinite(z),"Ungültiges Laufziel.");
  ensure(Math.abs(x)<=1.5 && Math.abs(z)<=1.5,"Das Laufziel liegt außerhalb der Insel.");
  const a = Math.atan2(z,x), r = Math.max(0.56,Math.min(0.75,Math.hypot(x,z)));
  return {x:Math.cos(a)*r,z:Math.sin(a)*r};
}
const delta = (a:number,b:number) => Math.atan2(Math.sin(b-a),Math.cos(b-a));
/** Follow the clear ring, never cut straight through a temple or a volcano. */
export function sampleMapMove(move: MapMove, now: number): MapPoint {
  const t=Math.max(0,Math.min(1,(now-move.at)/move.duration)), f=t*t*(3-2*t);
  const a=Math.atan2(move.from.z,move.from.x), b=Math.atan2(move.to.z,move.to.x);
  const angle=a+delta(a,b)*f, radius=Math.hypot(move.from.x,move.from.z)+(Math.hypot(move.to.x,move.to.z)-Math.hypot(move.from.x,move.from.z))*f;
  return {x:Math.cos(angle)*radius,z:Math.sin(angle)*radius};
}
export function moveOnMap(r: Room, player: string, a: any, now: number) {
  ensure(r.journey && r.participantIds.includes(player) && !r.players.find(p=>p.id===player)?.spectator,"Nur die aktive Crew kann auf der Insel laufen.");
  ensure(mapAvailable(r.phase),"Die Karte ist nur auf der Reise oder in einer Pause verfügbar.");
  ensure(a.index===r.index,"Dieses Laufziel gehört zu einer vergangenen Insel.");
  ensure(!r.journey.travel || now>=r.journey.travel.at+r.journey.travel.duration,"Die Crew ist noch auf dem Weg zur Insel.");
  const moves=r.journey.moves??={}, previous=moves[player];
  ensure(!previous || now-previous.at>=250,"Deine Figur setzt sich gerade in Bewegung.");
  const from=previous?.index===r.index?sampleMapMove(previous,now):mapSpawn(r.participantIds.indexOf(player),r.participantIds.length), to=mapDestination(a.x,a.z);
  const distance=Math.abs(delta(Math.atan2(from.z,from.x),Math.atan2(to.z,to.x)))*0.68;
  moves[player]={index:r.index,from,to,at:now,duration:Math.max(650,Math.round(distance*1700))};
}
export function beginCrewTravel(r: Room, from: number, now: number) {
  if(!r.journey)return;
  const starts=Object.fromEntries(r.participantIds.map((id,i)=>{const previous=r.journey!.moves?.[id];return [id,previous?.index===from?sampleMapMove(previous,now):mapSpawn(i,r.participantIds.length)];}));
  r.journey.travel={from,to:r.index,at:now,duration:TRAVEL_MS,starts}; r.journey.moves={};
}
