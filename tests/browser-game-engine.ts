import { player, createRoom, publicRoom, context, roomAction } from "../lib/game/room";
import { games } from "../lib/game/games";
import type { GameId } from "../lib/game/types";
export function match(id: GameId, count = 12) {
  const now = Date.now(),
    first = player("Nova", 0, now, 0),
    room = createRoom("QA1234", first, now);
  for (let i = 1; i < count; i++)
    room.players.push(player(`Crew ${i}`, i, now, i));
  room.participantIds = room.players.map((p) => p.id);
  room.players.forEach((p) => (p.ready = true));
  room.phase = "playing";
  room.index = 0;
  room.startedAt = now;
  room.selection = [{ id, rounds: 2, seconds: 180 }];
  room.game = games[id].init(context(room, now));
  return {
    room,
    first: first.id,
    command(pid: string, action: any) {
      roomAction(room, room.players.find(p=>p.id===pid)!, action, Date.now());
    },
    act(pid: string, action: any) {
      games[id].action(room.game!, pid, action, context(room, Date.now()));
    },
    view(pid = first.id) {
      games[id].tick(room.game!, context(room, Date.now()));
      return { playerId: pid, room: publicRoom(room, pid, Date.now()) };
    },
  };
}
