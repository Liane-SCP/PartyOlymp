import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { build } from "esbuild";
await mkdir("outputs/qa", { recursive: true });
await build({
  entryPoints: ["lib/game/content.ts"],
  outfile: "outputs/qa-content.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { pictures } = await import("../outputs/qa-content.mjs");
const bank = JSON.parse(await readFile("lib/game/data/wiki.json", "utf8"));
const base = process.env.QA_URL ?? "http://127.0.0.1:5173",
  delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function call(body, ok = true) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(base + "/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      if (i < 4) {
        console.log("Transient invalid response; retrying same request");
        await delay(300 + i * 300);
        continue;
      }
      throw new Error("Non-JSON response: " + res.status);
    }
    if (res.status === 409 || res.status >= 500) {
      await delay(100 + i * 100);
      continue;
    }
    if (ok) assert.equal(res.status, 200, data.error);
    return { status: res.status, ...data };
  }
  throw new Error("Persistent conflict");
}
function path(start, target) {
  const queue = [[start]],
    seen = new Set([start]);
  while (queue.length) {
    const p = queue.shift();
    if (p.at(-1) === target) return p;
    for (const link of bank.articles[p.at(-1)].links)
      if (!seen.has(link)) {
        seen.add(link);
        queue.push([...p, link]);
      }
  }
  throw new Error("No Wiki path");
}
async function run(n, full) {
  const initial = await call({ type: "create", name: `Host ${n}`, avatar: 0 }),
    members = [
      {
        code: initial.room.code,
        playerId: initial.playerId,
        token: initial.token,
      },
    ];
  const joined = await Promise.all(
    Array.from({ length: n - 1 }, (_, i) =>
      call({
        type: "join",
        code: initial.room.code,
        name: `Gast ${i + 1}`,
        avatar: (i + 1) % 12,
      }),
    ),
  );
  for (const p of joined)
    members.push({
      code: initial.room.code,
      playerId: p.playerId,
      token: p.token,
    });
  const host = members[0],
    act = async (s, a, id = crypto.randomUUID()) => {
      const response = await call(
        { type: "action", ...s, requestId: id, action: a },
        a.type !== "game",
      );
      if (a.type === "game" && response.status !== 200) {
        assert.equal(response.status, 400);
        assert.match(
          response.error,
          /vergangenen|abgelaufen|beendet|Spielteilnahme|nicht am Zug|Eingabephase|Kategorie nicht verfügbar|Du schaust bis zur nächsten Runde zu/,
        );
      }
      return response;
    };
  const forbidden = await call(
    {
      type: "action",
      ...members[1],
      requestId: crypto.randomUUID(),
      action: { type: "configure", selection: [] },
    },
    false,
  );
  assert.equal(forbidden.status, 400);
  const duplicate = crypto.randomUUID();
  await Promise.all([
    act(host, { type: "ready" }, duplicate),
    act(host, { type: "ready" }, duplicate),
  ]);
  let check = await call({ type: "poll", ...host });
  assert.equal(
    check.room.players.find((p) => p.id === host.playerId).ready,
    true,
  );
  await Promise.all(members.slice(1).map((s) => act(s, { type: "ready" })));
  await act(host, {
    type: "configure",
    selection: (full
      ? [
          "dice",
          "wiki",
          "picture",
          "budget",
          "blackjack",
          "cards",
          "color",
          "size",
        ]
      : ["color"]
    ).map((id) => ({
      id,
      rounds: id === "picture" ? 2 : 1,
      seconds: id === "dice" ? 45 : 20,
    })),
  });
  await act(host, { type: "start" });
  const spectator = await call({
    type: "join",
    code: host.code,
    name: "Zuschauer",
    avatar: 4,
  });
  assert.equal(
    spectator.room.players.find((p) => p.id === spectator.playerId).spectator,
    true,
  );
  let phase = "",
    round = "",
    color = null,
    cycle = 0,
    lastProgress = Date.now(),
    start = Date.now(),
    result;
  while (Date.now() - start < 1800000) {
    const states = await Promise.all(
      members.map((s) => call({ type: "poll", ...s })),
    );
    const room = states[0].room;
    result = room;
    if (room.phase !== phase) {
      phase = room.phase;
      console.log(
        `${n} Spieler: ${room.index + 1} ${room.selection[room.index].id} → ${phase}`,
      );
    }
    if (room.phase === "podium") break;
    if (room.phase === "rules")
      await Promise.all(
        states
          .filter((x) => !x.room.players.find((p) => p.id === x.playerId).ready)
          .map((x) =>
            act(
              members.find((s) => s.playerId === x.playerId),
              { type: "ready" },
            ),
          ),
      );
    if (room.phase === "standings") await act(host, { type: "continue" });
    if (room.phase === "playing") {
      const tasks = [];
      for (let i = 0; i < states.length; i++) {
        const r = states[i].room,
          g = r.game,
          s = members[i];
        if (r.phase !== "playing" || !g) continue;
        const p = g.mine;
        assert.ok(!JSON.stringify(r).includes('"token"'));
        assert.ok(!JSON.stringify(r).includes('"secret"'));
        if (g.stage === "done" || g.stage === "roundReveal" || p.abandoned)
          continue;
        let a;
        if (g.id === "dice" && g.stage === "answer" && !p.done && !p.submitted)
          a = p.rolls
            ? { type: "category", index: p.sheet.findIndex((v) => v === null) }
            : { type: "roll" };
        if (g.id === "wiki" && !p.arrival) {
          const route = path(p.path.at(-1), g.target);
          a = { type: "navigate", title: route[1] };
        }
        if (g.id === "picture" && !p.correct) {
          const pic = pictures.find((x) => x.image === g.image);
          assert.ok(pic);
          a = { type: "answer", value: pic.answer };
        }
        if (g.id === "budget" && !p.submitted)
          a = { type: "answer", value: g.items.slice(0, 2).map((x) => x.id) };
        if (g.id === "blackjack" && !p.stood)
          a = p.bet ? { type: "stand" } : { type: "bet", value: 50 };
        if (g.id === "cards" && g.turnId === s.playerId) {
          const k = p.hand.findIndex(
            (x) =>
              x.color === 4 || x.color === g.color || x.value === g.top.value,
          );
          const colors = [0, 1, 2, 3].map(
            (color) => p.hand.filter((x) => x.color === color).length,
          );
          const preferredColor = colors.indexOf(Math.max(...colors));
          a =
            k < 0
              ? { type: "draw" }
              : { type: "play", card: p.hand[k].id, color: preferredColor };
        }
        if (g.id === "fleet") {
          if (g.stage === "placement" && !p.submitted)
            a = {
              type: "place",
              ships: [{ cell: 0 }, { cell: g.size * 2 }, { cell: g.size * 4 }],
            };
          else if (g.stage === "answer" && !p.submitted)
            a = { type: "shoot", cell: 0 };
        }
        if (g.id === "color") {
          if (round !== r.phaseKey) {
            round = r.phaseKey;
            color = g.target ?? color;
          }
          if (g.target) color = g.target;
          if (!p.submitted && r.serverTime >= g.previewUntil)
            a = { type: "answer", value: color ?? [128, 128, 128] };
        }
        if (g.id === "size" && !p.submitted)
          a = { type: "answer", value: 100 + i * 10 };
        if (a)
          tasks.push(act(s, { type: "game", phase: r.phaseKey, action: a }));
      }
      await Promise.all(tasks);
    }
    cycle++;
    if (Date.now() - lastProgress > 20000) {
      console.log(
        `${n} Spieler: läuft · ${Math.round((Date.now() - start) / 1000)} s`,
      );
      lastProgress = Date.now();
    }
    await delay(200);
  }
  assert.equal(result.phase, "podium");
  assert.equal(result.history.length, full ? 8 : 1);
  for (const p of result.standings) {
    const expected = result.history.reduce(
      (s, h) => s + (h.results.find((x) => x.id === p.id)?.points ?? 0),
      0,
    );
    assert.equal(p.points, expected);
  }
  const refreshed = await call({
    type: "join",
    ...host,
    name: "Host",
    avatar: 0,
  });
  assert.equal(refreshed.playerId, host.playerId);
  assert.equal(refreshed.room.phase, "podium");
  await writeFile(
    `outputs/qa/network-${n}.json`,
    JSON.stringify(
      {
        base,
        players: n,
        full,
        passed: true,
        seconds: (Date.now() - start) / 1000,
        history: result.history,
        standings: result.standings.map(({ lastSeen, ...p }) => p),
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS: ${n} Spieler, ${result.history.length} Disziplinen, reales HTTP/D1, Gleichzeitigkeit, Idempotenz, Rechte, Zuschauer, Refresh.`,
  );
}
const full = process.env.QA_FULL === "1";
await Promise.all(
  (process.env.QA_PLAYERS
    ? process.env.QA_PLAYERS.split(",").map(Number)
    : [2, 8, 12]
  ).map((n) => run(n, full)),
);
