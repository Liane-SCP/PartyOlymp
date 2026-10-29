import { createRoom, player, roomAction, publicRoom } from "../lib/game/room";
import { beginJourney } from "../lib/game/journey";
import { context } from "../lib/game/room";
import { games } from "../lib/game/games";
import { catalog } from "../lib/game/catalog";
import { spacedBosses } from "../lib/game/wheel";
import { journeyLayout } from "../lib/journey-world";
export function fixture(count = 8) {
  const now = Date.now(), first = player("Nova", 0, now, 0), room = createRoom("QA1234", first, now);
  for (let i = 1; i < count; i++) room.players.push(player(`Crew ${i}`, i, now, i));
  room.participantIds = room.players.map(p => p.id); room.startedAt = now; room.phase = "rules";
  room.selection = ["colossus", "kraken", "dragon", "picture", "timing", "herd"].map(id => ({ id: id as any, rounds: 3, seconds: 45 }));
  room.deadline = now + 3600000; beginJourney(room);
  return { room, first: first.id,
    act(action: any) { roomAction(room, first, action, Date.now()); },
    chest() { room.journey!.chests[first.id] = 1; },
    atlas(count = catalog.length) { room.selection = Array.from({ length: count }, (_, i) => ({ id: catalog[i % catalog.length].id, rounds: 3, seconds: 45 })); },
    nature() { room.selection=spacedBosses(catalog.map(g=>({id:g.id,rounds:3,seconds:45}))); },
    layout() { return journeyLayout(room.selection); },
    travel() { room.index=1; room.journey!.travel={from:0,to:1,at:Date.now(),duration:6500}; },
    reveal() {
      room.game = games.colossus.init(context(room, Date.now()));
      room.game.results = room.players.map((p, i) => ({ id: p.id, raw: 1000 - i * 100, valid: true, detail: [] }));
      room.phase = "reveal"; room.deadline = Date.now() + 3600000;
    },
    view() { return { playerId: first.id, room: publicRoom(room, first.id, Date.now()) }; },
  };
}
