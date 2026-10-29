import { emoteNames } from "../emotes";
import { games } from "./games";
import { isBoss } from "./boss-rules";
import { beginJourney, journeyAction, journeyAwards, journeyView } from "./journey";
import { beginCrewTravel, moveOnMap } from "./journey-motion";
import { PARTY_FLOW, partyPlanKey } from './party-flow';
import { gameShow, updatePersonalBests } from "./gameshow";
import { inputDeadline } from "./deadline";
import { appearance } from "../appearance";
import { award, ranking, olympiadMultiplier } from "./scoring";
import { preset, catalog } from "./catalog";
import {chooseRematch,prepareRematch,chooseParticipation,rematchView} from './rematch';
import {
  ensure,
  int,
  uid,
  random,
  palette,
  type Room,
  type Player,
  type Context,
  type Selection,
} from "./types";
export const REJOIN_MS = 90000;
export function player(
  name: unknown,
  avatar: unknown,
  now: number,
  index: number,
  look?: unknown,
): Player {
  ensure(
    typeof name === "string" &&
      name.trim().length >= 1 &&
      name.trim().length <= 20,
    "Name muss 1–20 Zeichen haben.",
  );
  const custom = appearance(look);
  return {
    id: uid(),
    token: uid() + uid(),
    name: name.trim(),
    avatar: int(avatar ?? 0, 0, 11),
    look: custom,
    color: palette[custom?.color ?? index % 12],
    ready: false,
    spectator: false,
    lastSeen: now,
    points: 0,
    wins: 0,
    seconds: 0,
    lastPoints: 0,
    previousRank: 1,
  };
}
export function createRoom(code: string, p: Player, now: number): Room {
  return {
    rulesVersion: 7,
    code,
    host: p.id,
    players: [p],
    selection: preset(20),
    phase: "lobby",
    deadline: 0,
    startedAt: 0,
    participantIds: [],
    index: 0,
    game: null,
    history: [],
    used: [],
    emotes: [],
    receipts: [],
    revision: 0,
    createdAt: now,
  };
}
export function context(r: Room, now: number): Context {
  return {
    now,
    ids: r.participantIds,
    settings: r.selection[r.index],
    used: r.used,
    random,
  };
}
export function phaseKey(r: Room) {
  return `${r.startedAt}:${r.index}:${r.phase}:${r.game?.round ?? 0}:${r.game?.stage ?? ""}:${r.game?.id==="cards" ? r.game.public.lastMove?.id??0 : r.game?.public.buzzTurn ?? r.game?.public.turn ?? r.game?.public.volley ?? 0}`;
}
function rules(r: Room, now: number) {
  r.phase = "rules";
  r.deadline = now + PARTY_FLOW.rules;
  r.game = null;
  r.players.forEach((p) => (p.ready = false));
}
function startGame(r: Room, now: number) {
  r.phase = "playing";
  r.deadline = 0;
  r.game = games[r.selection[r.index].id].init(context(r, now));
}
function nextDiscipline(r: Room, now: number) {
  r.game = null;
  r.draw = undefined;
  r.wheelEnabled = false;
  r.phase = 'travel';
  r.deadline = Math.max(now + PARTY_FLOW.arrival, r.journey?.travel ? r.journey.travel.at + r.journey.travel.duration : 0);
}
export function tickRoom(r: Room, now: number) {
  if (!r.journey && r.phase !== "lobby" && r.participantIds.length) {beginJourney(r);r.journey!.orderVersion=1;}
  if(r.journey) r.journey.orderVersion=3;
  if ((r.rulesVersion ?? 1) < 2) {
    r.selection = r.selection.map((s) =>
      s.id === "fleet" ? { ...s, rounds: 1 } : s,
    );
    r.rulesVersion = 2;
  }
  if ((r.rulesVersion ?? 2) < 5) {
    // Retired discipline: migrate stored rooms before looking up their module.
    const retired = (value: unknown) =>
      value === "curve" || value === "fleet" || value === "blocks";
    const removedBefore = r.selection
      .slice(0, r.index)
      .filter((s) => retired(s.id)).length;
    const currentRemoved =
      retired(r.game?.id) ||
      (retired(r.selection[r.index]?.id) && r.phase !== "lobby");
    r.selection = r.selection.filter((s) => !retired(s.id));
    r.index = Math.max(0, r.index - removedBefore);
    const oldCount = r.history.length;
    r.history = r.history.filter((h) => !retired(h.game));
    if (r.history.length !== oldCount) {
      for (const p of r.players) {
        const results = r.history.flatMap((h) =>
          h.results.filter((x) => x.id === p.id),
        );
        p.points = results.reduce((sum, x) => sum + (x.points ?? 0), 0);
        p.wins = results.filter((x) => x.rank === 1).length;
        p.seconds = results.filter((x) => x.rank === 2).length;
        p.lastPoints =
          r.history.at(-1)?.results.find((x) => x.id === p.id)?.points ?? 0;
      }
      r.previousStandings = undefined;
    }
    if (!r.selection.length) {
      r.selection = [{ id: "picture", rounds: 1, seconds: 25 }];
      r.index = 0;
    }
    if (currentRemoved) {
      r.game = null;
      if (r.phase === "podium" || r.index >= r.selection.length) {
        r.index = r.selection.length - 1;
        r.phase = "podium";
        r.deadline = 0;
      } else rules(r, now);
    }
    r.rulesVersion = 5;
  }
  if ((r.rulesVersion ?? 5) < 6) {
    if (r.previousStandings) {
      r.previousStandings = ranking(r.previousStandings);
      for (const p of r.players) p.previousRank = r.previousStandings.find(s=>s.id===p.id)?.rank ?? 0;
    }
    r.rulesVersion = 6;
  }
  if ((r.rulesVersion ?? 6) < 7) {
    // Existing rooms keep their displayed route, current game and awarded history.
    r.wheelEnabled = false;
    r.draw = undefined;
    if (r.phase === 'wheel') nextDiscipline(r, now);
    r.rulesVersion = 7;
  }
  const host = r.players.find((p) => p.id === r.host);
  if (!host || now - host.lastSeen > REJOIN_MS) {
    const next = r.players
      .filter((p) => now - p.lastSeen < REJOIN_MS && !p.spectator)
      .sort((a, b) => b.lastSeen - a.lastSeen)[0];
    if (next) r.host = next.id;
  }
  r.emotes = r.emotes.filter((e) => now - e.at < 4500);
  if (r.phase === 'wheel') nextDiscipline(r, now);
  if (r.phase === 'travel' && now >= r.deadline) rules(r, now);
  if (r.phase === "rules") {
    const active = r.players.filter((p) => r.participantIds.includes(p.id));
    if (
      active.every((p) => p.ready || now - p.lastSeen > REJOIN_MS) ||
      now >= r.deadline
    ) {
      r.phase = "countdown";
      r.deadline = now + PARTY_FLOW.countdown;
    }
  }
  if (r.phase === "countdown" && now >= r.deadline) startGame(r, now);
  if (r.phase === "playing" && r.game) {
    for (const id of r.participantIds) {
      const p = r.players.find((p) => p.id === id)!;
      if (p.kicked || now - p.lastSeen > REJOIN_MS) r.game.players[id].abandoned = true;
    }
    for(const id of r.participantIds) {
      const p=r.game.players[id],draft=p.timeoutInput;
      if(draft && draft.phase!==phaseKey(r))delete p.timeoutInput;
      if(draft && !p.abandoned && draft.phase===phaseKey(r))draft.deadline=inputDeadline(r.game,id);
      if(draft && !p.abandoned && draft.phase===phaseKey(r) && now>=draft.deadline) {
        delete p.timeoutInput;
        try {games[r.game.id].action(r.game,id,draft.action,context(r,draft.deadline-1));} catch { /* Invalid or superseded drafts keep the normal timeout rule. */ }
      }
    }
    games[r.game.id].tick(r.game, context(r, now));
    if (r.game.stage === "done") {
      r.phase = "reveal";
      r.deadline = now + PARTY_FLOW.reveal;
      r.game.results = games[r.game.id]
        .results(r.game, context(r, now))
        .map((result) => ({
          ...result,
          valid: result.valid && !r.game!.players[result.id].abandoned,
        }));
    }
  }
  if (r.phase === "reveal" && now >= r.deadline && r.game) {
    const key = `${r.startedAt}:${r.index}`;
    if (!r.history.some((h) => h.id === key)) {
      const before = ranking(
        r.players.filter((p) => r.participantIds.includes(p.id)),
      );
      const results = journeyAwards(r, award(r.game.results, r.participantIds.length, olympiadMultiplier(r.game.id)));
      r.previousStandings = before.map(
        ({ id, rank, points, wins, seconds }) => ({
          id,
          rank,
          points,
          wins,
          seconds,
        }),
      );
      for (const p of r.players) {
        p.lastPoints = 0;
        p.previousRank = before.find((x) => x.id === p.id)?.rank ?? 0;
        const result = results.find((x) => x.id === p.id);
        if (result) {
          p.points += result.points ?? 0;
          p.lastPoints = result.points ?? 0;
          if (result.rank === 1) p.wins++;
          if (result.rank === 2) p.seconds++;
        }
      }
      r.game.results = results;
      const recordBreaks = updatePersonalBests(r.personalBests ??= {}, r.selection[r.index], r.participantIds.length, results);
      r.history.push({ id: key, game: r.game.id, results, recordBreaks });
    }
    r.phase = "standings";
    r.deadline = now + PARTY_FLOW.standings;
  }
  if (r.phase === "standings" && now >= r.deadline) {
    if (r.index + 1 >= r.selection.length) {
      r.phase = "podium";
      r.deadline = 0;
    } else {
      const previousIndex=r.index;
      r.index++;
      beginCrewTravel(r,previousIndex,now);
      nextDiscipline(r, now);
    }
  }
}
export function roomAction(r: Room, p: Player, a: any, now: number) {
  ensure(!p.kicked, "Du wurdest vom Gastgeber aus dem Raum entfernt.");
  ensure(a && typeof a.type === "string", "Ungültige Aktion.");
  const isHost = p.id === r.host;
  if(a.type==="mapMove") {moveOnMap(r,p.id,a,now);return;}
  if (a.type === "relic" || a.type === "chest") {
    ensure(a.phase === undefined || a.phase === phaseKey(r), "Diese Reliktauswahl gehört zu einer früheren Spielphase.");
    ensure(!p.spectator, "Zuschauer können keine Relikte einsetzen.");
    journeyAction(r, p.id, a);
    return;
  }
  const host = () => ensure(isHost, "Nur der Gastgeber kann das.");
  if(a.type === "kick") {
    host();
    const target=r.players.find(x=>x.id===a.player && !x.kicked);
    ensure(target && target.id!==r.host,"Du kannst dich nicht selbst entfernen.");
    target.kicked=true;target.spectator=true;target.ready=false;target.lastSeen=now-REJOIN_MS-1;
    if(r.game?.players[target.id])r.game.players[target.id].abandoned=true;
    if(!r.participantIds.includes(target.id))r.players=r.players.filter(x=>x.id!==target.id);
    return;
  }
  if (a.type === "heartbeat") return;
  if (a.type === "emote") {
    ensure(!(r.phase==='playing'&&r.game?.id==='timing'),'Während Zeitgefühl bleiben Reaktionen ausgeschaltet.');
    const e = int(a.emote, 0, emoteNames.length - 1);
    ensure(
      !r.emotes.some((e) => e.player === p.id && now - e.at < 2500),
      "Emote ist gleich wieder bereit.",
    );
    r.emotes.push({ id: uid(), player: p.id, emote: e, at: now });
    r.emotes = r.emotes.slice(-12);
    return;
  }
  if (a.type === "transfer") {
    host();
    ensure(
      r.players.some(
        (x) =>
          x.id === a.player && !x.spectator && now - x.lastSeen < REJOIN_MS,
      ),
      "Spieler nicht verfügbar.",
    );
    r.host = a.player;
    return;
  }
  if (a.type === "ready") {
    ensure(a.phase === undefined || a.phase === phaseKey(r), "Diese Bereitschaft gehört zu einer früheren Spielphase.");
    ensure(a.plan === undefined || a.plan === partyPlanKey(r.selection), "Der Spielplan wurde inzwischen geändert. Prüfe die aktuelle Auswahl und melde dich erneut bereit.");
    ensure(
      r.phase === "lobby" || r.phase === "rules",
      "Bereitschaft aktuell nicht verfügbar.",
    );
    ensure(!p.spectator, "Zuschauer können nicht bereit melden.");
    p.ready = !p.ready;
    return;
  }
  if(a.type==='rematchIntent'){
    ensure(r.phase==='podium'&&a.phase===phaseKey(r),'Diese Revanche-Abfrage ist bereits vorbei.');
    chooseRematch(r,p,a.choice,now,REJOIN_MS);return;
  }
  if(a.type==='participation'){
    ensure(r.phase==='lobby'&&a.phase===phaseKey(r),'Die Teilnahme kann nur in der aktuellen Lobby geändert werden.');
    chooseParticipation(r,p,a.choice,now,REJOIN_MS);return;
  }
  if (a.type === "configure") {
    host();
    ensure(a.phase === undefined || a.phase === phaseKey(r), "Diese Planänderung gehört zu einer früheren Lobby.");
    ensure(a.plan === undefined || a.plan === partyPlanKey(r.selection), "Der Spielplan wurde inzwischen geändert. Prüfe die aktuelle Auswahl und ändere sie erneut.");
    ensure(r.phase === "lobby", "Konfiguration nur in der Lobby.");
    ensure(
      Array.isArray(a.selection) &&
        a.selection.length >= 1 &&
        a.selection.length <= 40,
      "Wähle 1–40 Disziplinen.",
    );
    const selection: Selection[] = a.selection.map((s: any) => {
      ensure(
        catalog.some((g) => g.id === s.id),
        "Unbekannte Disziplin.",
      );
      return {
        id: s.id,
        rounds: Math.max(
          isBoss(s.id) ? 3 : s.id === "spectrum" ? 2 : 1,
          int(s.rounds, 1, 30),
        ),
        seconds: Math.max(isBoss(s.id) ? 20 : 8, int(s.seconds, 8, 180)),
      };
    });
    if (JSON.stringify(selection) !== JSON.stringify(r.selection)) {
      r.selection = selection;
      r.players.forEach(player => { player.ready = false; });
    }
    return;
  }
  if (a.type === "start") {
    host();
    ensure(a.phase === undefined || a.phase === phaseKey(r), "Dieser Start gehört zu einer früheren Lobby.");
    ensure(a.plan === undefined || a.plan === partyPlanKey(r.selection), "Der Spielplan wurde inzwischen geändert. Prüfe die aktuelle Auswahl vor dem Start.");
    ensure(r.phase === "lobby", "Olympiade läuft bereits.");
    const players = r.players.filter(
      (p) => !p.spectator && now - p.lastSeen < REJOIN_MS,
    );
    ensure(
      players.length >= 2 && players.length <= 12,
      "Für den Start braucht ihr 2–12 verbundene Spieler.",
    );
    ensure(
      players.every((p) => p.ready),
      "Alle aktiven Spieler müssen bereit sein.",
    );
    r.participantIds = players.map((p) => p.id);
    beginJourney(r);
    r.players.forEach((p) => {
      p.spectator = !r.participantIds.includes(p.id);
      p.points = 0;
      p.wins = 0;
      p.seconds = 0;
      p.lastPoints = 0;
    });
    r.startedAt = now;
    r.rematch = undefined;
    r.history = [];
    r.previousStandings = undefined;
    r.index = 0;
    r.used = [];
    nextDiscipline(r, now);
    return;
  }
  // Temporary host testing control; discard unfinished results without awarding points.
  if (a.type === "testSkip") {
    host();
    ensure(a.phase === phaseKey(r), "Diese Disziplin ist bereits vorbei. Bitte erneut versuchen.");
    ensure(["travel", "rules", "countdown", "playing", "reveal"].includes(r.phase), "Aktuell gibt es keine Disziplin zu überspringen.");
    r.game = null;
    r.players.forEach(player => { player.ready = false; player.lastPoints = 0; });
    if (r.index + 1 >= r.selection.length) {
      r.phase = "podium";
      r.deadline = 0;
    } else {
      const previousIndex = r.index;
      r.index++;
      beginCrewTravel(r, previousIndex, now);
      nextDiscipline(r, now);
    }
    return;
  }
  if (a.type === "pause") {
    host();
    ensure(a.phase === undefined || a.phase === phaseKey(r), "Diese Pause gehört zu einer früheren Zwischenwertung.");
    ensure(r.phase === "standings", "Pause ist zwischen Disziplinen möglich.");
    r.phase = "paused";
    r.deadline = 0;
    return;
  }
  if (a.type === "continue") {
    host();
    ensure(a.phase === undefined || a.phase === phaseKey(r), "Dieses Fortsetzen gehört zu einer früheren Spielphase.");
    ensure(
      r.phase === "paused" || r.phase === "standings",
      "Fortsetzen aktuell nicht möglich.",
    );
    r.phase = "standings";
    r.deadline = now;
    tickRoom(r, now);
    return;
  }
  if (a.type === "rematch") {
    host();
    ensure(r.phase === "podium", "Revanche erst nach der Siegerehrung.");
    if(a.phase!==undefined)ensure(a.phase===phaseKey(r),'Diese Siegerehrung ist bereits vorbei.');
    prepareRematch(r,now,REJOIN_MS);
    r.phase = "lobby";
    r.journey = undefined;
    r.draw = undefined;
    r.wheelEnabled = false;
    r.game = null;
    r.deadline = 0;
    r.participantIds = [];
    return;
  }
  if (a.type === "game") {
    if(a.action?.type==="timeoutDraft" && (r.phase!=="playing" || !r.game || a.phase!==phaseKey(r)))return;
    ensure(
      r.phase === "playing" &&
        r.game &&
        !p.spectator &&
        r.participantIds.includes(p.id),
      "Keine aktive Spielteilnahme.",
    );
    ensure(
      !r.game.players[p.id].abandoned,
      "Wiederbeitrittsfrist verstrichen. Du kannst ab der nächsten Disziplin wieder mitspielen.",
    );
    ensure(
      a.phase === phaseKey(r),
      "Diese Eingabe gehört zu einer vergangenen Spielphase.",
    );
    if(a.action?.type === "timeoutDraft") {
      const deadline=inputDeadline(r.game,p.id);
      if(deadline<=now)return;
      if(a.action.action===null){delete r.game.players[p.id].timeoutInput;return;}
      ensure(a.action.action && !["timeoutDraft","draft"].includes(a.action.action.type),"Ungültige automatische Eingabe.");
      const copy=structuredClone(r.game);
      try {games[r.game.id].action(copy,p.id,a.action.action,{...context(r,now),used:[...r.used]});}
      catch {delete r.game.players[p.id].timeoutInput;return;}
      r.game.players[p.id].timeoutInput={phase:phaseKey(r),deadline,action:structuredClone(a.action.action)};
      return;
    }
    delete r.game.players[p.id].timeoutInput;
    games[r.game.id].action(r.game, p.id, a.action, context(r, now));
    return;
  }
  throw new Error("Unbekannte Aktion.");
}
export function publicRoom(r: Room, id: string, now: number) {
  const standings = ranking(r.players.filter((p) => r.participantIds.includes(p.id))).map(({token,...p})=>p);
  return {
    code: r.code,
    host: r.host,
    players: r.players.map(({ token, ...p }) => ({
      ...p,
      connected: now - p.lastSeen < 12000,
      rejoinUntil: p.lastSeen + REJOIN_MS,
    })),
    selection: r.selection,
    draw: r.phase === "wheel" ? r.draw : undefined,
    phase: r.phase,
    phaseKey: phaseKey(r),
    rematch: rematchView(r,id,now,REJOIN_MS),
    deadline: r.deadline,
    index: r.index,
    participantIds: r.participantIds,
    game: r.game
      ? {
          id: r.game.id,
          ...games[r.game.id].view(r.game, id, r.phase !== "playing"),
          results:
            r.phase === "reveal" ||
            r.phase === "standings" ||
            r.phase === "paused" ||
            r.phase === "podium"
              ? r.game.results
              : [],
        }
      : null,
    history: r.history,
    previousStandings: r.previousStandings,
    standings,
    gameShow: gameShow({...r, standings}),
    journey: journeyView(r, id),
    emotes: r.emotes,
    revision: r.revision,
    serverTime: now,
  };
}
