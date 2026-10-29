import { writeFile, mkdir } from "node:fs/promises";
import { player, createRoom, publicRoom, context } from "../lib/game/room";
import { games } from "../lib/game/games";
import { catalog } from "../lib/game/catalog";
import { award } from "../lib/game/scoring";
const now = Date.now(),
  first = player("Nova", 0, now, 0),
  r = createRoom("QA1234", first, now);
[
  "Pixel",
  "Echo",
  "Lumi",
  "Orbit",
  "Cosmo",
  "Kiki",
  "Milo",
  "Zippy",
  "Komet",
  "Funk",
  "Zora",
].forEach((n, i) => r.players.push(player(n, i + 1, now, i + 1)));
r.participantIds = r.players.map((p) => p.id);
r.players.forEach((p) => (p.ready = true));
r.startedAt = now;
r.selection = catalog.map((g) => ({ id: g.id, rounds: 3, seconds: 60 }));
const fixtures: any[] = [];
// Capture each view now; later engine actions must not mutate earlier fixtures.
const add = (value: any) =>
  Array.prototype.push.call(fixtures, structuredClone(value));
r.phase = "lobby";
add({
  name: "lobby-12",
  response: { playerId: first.id, room: publicRoom(r, first.id, now) },
});
for (let i = 0; i < catalog.length; i++) {
  r.index = i;
  r.phase = "playing";
  const c = context(r, now);
  r.game = games[c.settings.id].init(c);
  const g = r.game;
  if (["auction", "timing", "bomb"].includes(g.id)) {
    const save = (name: string, id = first.id) =>
      add({ name, response: { playerId: id, room: publicRoom(r, id, c.now) } });
    const advance = () => {
      c.now = g.deadline + 1;
      games[g.id].tick(g, c);
    };
    const play = (id: string, a: any) =>
      games[g.id].action(
        g,
        id,
        { round: g.round + 1, turn: g.public.turn, ...a },
        c,
      );
    if (g.id === "auction") {
      save("auction-topic");
      play(first.id, { type: "topic", name: "Pokémon" });
      play(c.ids[1], { type: "bid", value: 8 });
      save("auction-bid");
      play(first.id, { type: "bid", value: 10 });
      for (const id of c.ids.slice(1)) play(id, { type: "pass" });
      [
        "Pikachu",
        "Evoli",
        "Bisasam",
        "Glumanda",
        "Schiggy",
        "Relaxo",
        "Mew",
        "Mewtu",
        "Enton",
        "Glurak",
      ].forEach((word) => play(first.id, { type: "word", word }));
      save("auction-perform");
      play(first.id, { type: "finish" });
      save("auction-judge", c.ids[1]);
      for (const id of c.ids.slice(1))
        play(id, { type: "judge", votes: g.public.answers.map(() => true) });
      save("auction-reveal");
    } else if (g.id === "timing") {
      g.public.mode = "decoy";
      save("timing");
      for (const id of c.ids) play(id, { type: "start" });
      save("timing-running");
      c.now += g.public.target;
      for (const [i, id] of c.ids.entries())
        play(id, { type: "stop", elapsed: g.public.target + (i - 5) * 100 });
      save("timing-reveal");
    } else {
      g.public.fragment = "BRA";
      save("bomb");
      play(first.id, { type: "word", word: "Zebrakuschelkissen" });
      save("bomb-judge", c.ids[1]);
      for (const id of c.ids.slice(1)) play(id, { type: "judge", valid: true });
      advance();
      save("bomb-explosion");
      while (g.stage !== "roundReveal") advance();
      save("bomb-reveal");
    }
    continue;
  }
  if (g.id === "categories") g.public.letter = "A";
  if (g.id === "chain") {
    for (const id of c.ids) games.chain.action(g, id, {type:"suggestTopic", name:"Automarken", round:1, turn:0}, c);
    c.now = g.deadline;
    games.chain.tick(g,c);
    g.public.topic = {
      name: "Automarken",
      hint: "Marken, unter denen Autos verkauft werden. Keine Modellnamen.",
    };
  }
  if (g.id === "dice") games.dice.action(g, first.id, { type: "roll" }, c);
  if (g.id === "blackjack")
    games.blackjack.action(g, first.id, { type: "bet", value: 50 }, c);
  if (g.id === "color") g.public.previewUntil = now - 1;
  add({
    name: g.id,
    response: { playerId: first.id, room: publicRoom(r, first.id, now) },
  });
  if (g.id === "chain") {
    games.chain.action(
      g,
      first.id,
      { type: "answer", round: 1, turn: g.public.turn, answer: "BMW" },
      c,
    );
    add({
      name: "chain-review",
      response: { playerId: c.ids[1], room: publicRoom(r, c.ids[1], c.now) },
    });
    games.chain.action(
      g,
      c.ids[1],
      { type: "challenge", round: 1, turn: g.public.turn },
      c,
    );
    add({
      name: "chain-challenge",
      response: { playerId: c.ids[2], room: publicRoom(r, c.ids[2], c.now) },
    });
    for (const id of c.ids.slice(2))
      games.chain.action(
        g,
        id,
        { type: "vote", round: 1, turn: g.public.turn, valid: true },
        c,
      );
    while (g.stage !== "roundReveal") {
      c.now = g.deadline + 1;
      games.chain.tick(g, c);
      if (g.stage === "answer")
        games.chain.action(
          g,
          g.public.turnId,
          { type: "answer", round: 1, turn: g.public.turn, answer: "BMW" },
          c,
        );
    }
    add({
      name: "chain-reveal",
      response: { playerId: first.id, room: publicRoom(r, first.id, c.now) },
    });
  }
  if (["typer", "herd", "spectrum", "blocks", "geo"].includes(g.id)) {
    if (g.id === "typer")
      for (const id of c.ids)
        games.typer.action(
          g,
          id,
          { type: "type", seq: 1, text: g.public.text },
          { ...c, now: now + 5000 },
        );
    if (g.id === "herd")
      for (const [j, id] of c.ids.entries())
        games.herd.action(
          g,
          id,
          {
            type: "answer",
            answer: j < 8 ? "Banane" : j < 11 ? "Zitrone" : "Ananas",
          },
          c,
        );
    if (g.id === "spectrum") {
      games.spectrum.action(
        g,
        g.public.psychic,
        { type: "clue", clue: "Kaffee von gestern" },
        c,
      );
      add({
        name: "spectrum-guess",
        response: { playerId: c.ids[1], room: publicRoom(r, c.ids[1], c.now) },
      });
      for (const [i, id] of c.ids.entries())
        if (id !== g.public.psychic)
          games.spectrum.action(
            g,
            id,
            {
              type: "lock",
              value: Math.max(0, Math.min(100, g.secret.target + (i - 5) * 3)),
            },
            c,
          );
    }
    if (g.id === "blocks") {
      c.ids.slice(1).forEach((id) => (g.players[id].alive = false));
      games.blocks.tick(g, c);
    }
    if (g.id === "geo")
      for (const [j, id] of c.ids.entries())
        games.geo.action(
          g,
          id,
          {
            type: "pin",
            lat: g.secret.place.lat + j * 0.5,
            lon: g.secret.place.lon + j * 0.8,
          },
          c,
        );
    add({
      name: g.id + "-reveal",
      response: {
        playerId: first.id,
        room: publicRoom(r, first.id, now + 6000),
      },
    });
  }
  if (g.id === "categories") {
    const countries = [
      "Argentinien",
      "Australien",
      "Albanien",
      "Afghanistan",
      "Algerien",
      "Andorra",
      "Angola",
      "Antigua und Barbuda",
      "Armenien",
      "Aserbaidschan",
      "Ägypten",
      "Äthiopien",
    ];
    for (const [j, id] of c.ids.entries())
      games.categories.action(
        g,
        id,
        {
          type: "answer",
          round: 1,
          seq: 1,
          answers: [
            countries[j],
            "ApoRed",
            "Apfel",
            "Affe",
            "Apfelsaft",
            "Arzt",
            "Among Us",
          ],
        },
        c,
      );
    add({
      name: "categories-vote",
      response: { playerId: first.id, room: publicRoom(r, first.id, now) },
    });
    while (g.stage !== "roundReveal") {
      if (g.stage === "vote")
        for (const id of c.ids)
          games.categories.action(
            g,
            id,
            {
              type: "vote",
              round: 1,
              categoryIndex: g.public.categoryIndex,
              ballot: Object.fromEntries(
                g.public.options
                  .filter((o: any) => o.formatValid)
                  .map((o: any) => [o.key, true]),
              ),
            },
            c,
          );
      else {
        c.now = g.deadline + 1;
        games.categories.tick(g, c);
      }
    }
    add({
      name: "categories-reveal",
      response: { playerId: first.id, room: publicRoom(r, first.id, c.now) },
    });
  }
  if (g.id === "blackjack") {
    for (const id of c.ids.slice(1))
      games.blackjack.action(g, id, { type: "bet", value: 25 }, c);
    games.blackjack.tick(g, { ...c, now: g.deadline + 1 });
  }
  if (g.id === "cards") {
    const id = g.public.turnId;
    const last = { id: "fixture-last", color: g.public.color, value: 3 };
    g.players[id].hand = [last];
    games.cards.action(g, id, { type: "play", card: last.id }, c);
  }
  if (g.id === "wiki") {
    for (const id of c.ids.slice(0, 3))
      for (const title of g.secret.task.path.slice(1))
        games.wiki.action(
          g,
          id,
          { type: "navigate", title },
          { ...c, now: c.now + 1000 },
        );
    games.wiki.tick(g, { ...c, now: g.deadline + 1 });
  }
  if (g.id === "dice") {
    let time = now;
    for (let turn = 0; turn < 13; turn++) {
      for (const id of c.ids) {
        if (!g.players[id].rolls)
          games.dice.action(g, id, { type: "roll" }, { ...c, now: time });
        games.dice.action(
          g,
          id,
          { type: "category", index: turn },
          { ...c, now: time },
        );
      }
      games.dice.tick(g, { ...c, now: time });
      if (turn < 12) {
        time = g.public.turnDeadline + 1;
        games.dice.tick(g, { ...c, now: time });
      }
    }
  }
  if (g.id === "fleet") {
    for (const id of c.ids)
      games.fleet.action(
        g,
        id,
        {
          type: "place",
          ships: [
            { cell: 0 },
            { cell: g.public.size * 2 },
            { cell: g.public.size * 4 },
          ],
        },
        c,
      );
    games.fleet.tick(g, c);
    for (const id of c.ids)
      games.fleet.action(g, id, { type: "shoot", cell: 0 }, c);
    games.fleet.tick(g, c);
    add({
      name: "fleet-salvo",
      response: { playerId: first.id, room: publicRoom(r, first.id, now) },
    });
    g.public.volley = g.public.maxVolleys - 1;
    games.fleet.tick(g, { ...c, now: g.deadline + 1 });
    games.fleet.tick(g, { ...c, now: g.deadline + 1 });
  }
  if (["blackjack", "cards", "wiki", "dice", "fleet"].includes(g.id))
    add({
      name: g.id + "-reveal",
      response: { playerId: first.id, room: publicRoom(r, first.id, now) },
    });
  if (
    g.id === "picture" ||
    g.id === "budget" ||
    g.id === "color" ||
    g.id === "size"
  ) {
    // Pixelblitz has one authorized buzzer answer; a correct answer ends the round.
    for (const id of g.id === "picture" ? c.ids.slice(0, 1) : c.ids) {
      if(g.id==='picture')games.picture.action(g,id,{type:'buzz'},{...c,now:now+5000});
      const value =
        g.id === "picture"
          ? g.secret.item.answer
          : g.id === "budget"
            ? g.secret.items.slice(0, 3).map((p: any) => p.id)
            : g.id === "color"
              ? g.secret.target
              : g.secret.item.cm;
      games[g.id].action(
        g,
        id,
        { type: "answer", value },
        { ...c, now: now + 5000 },
      );
    }
    games[g.id].tick(g, { ...c, now: now + 6000 });
    add({
      name: g.id + "-reveal",
      response: {
        playerId: first.id,
        room: publicRoom(r, first.id, now + 6000),
      },
    });
  }
}
r.history = catalog.map((g, i) => ({
  id: "fixture-" + i,
  game: g.id,
  results: award(
    r.players.map((p, k) => ({
      id: p.id,
      raw: (12 - k + i) % 12,
      valid: true,
      detail: null,
    })),
    12,
  ),
}));
for (const p of r.players) {
  p.points = r.history.reduce(
    (s, h) => s + h.results.find((x) => x.id === p.id)!.points!,
    0,
  );
  p.wins = r.history.filter(
    (h) => h.results.find((x) => x.id === p.id)!.rank === 1,
  ).length;
  p.seconds = r.history.filter(
    (h) => h.results.find((x) => x.id === p.id)!.rank === 2,
  ).length;
  p.lastPoints = r.history.at(-1)!.results.find((x) => x.id === p.id)!.points!;
  p.previousRank = 12;
}
r.index = catalog.length - 1;
r.phase = "podium";
add({
  name: "podium-12",
  response: { playerId: first.id, room: publicRoom(r, first.id, now) },
});
await mkdir("outputs/qa", { recursive: true });
await writeFile("outputs/qa/view-fixtures.json", JSON.stringify(fixtures));
