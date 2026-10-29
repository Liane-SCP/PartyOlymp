import products from "../data/amazon-products.json";
import { base, commonView, event, pick, rawResults } from "../common";
import {
  bossPhaseNames,
  colossusScore,
  colossusWeaknesses,
  dragonRisks,
  dragonScore,
  krakenGauge,
  type BossId,
} from "../boss-rules";
import {
  ensure,
  int,
  type Context,
  type GameModule,
  type GameState,
} from "../types";

const INTRO_MS = 6000;
const REVEAL_MS = 12000;

function beginAnswer(g: GameState, c: Context) {
  g.stage = "answer";
  g.public.answerStartedAt = c.now;
  g.deadline = c.now + Math.max(20, c.settings.seconds) * 1000;
}

function beginAttack(g: GameState, c: Context, introduction: boolean) {
  const id = g.id as BossId;
  const boss = g.public.boss;
  boss.phaseName = bossPhaseNames[id][boss.phase];
  g.public = {
    boss,
    seed: Math.floor(c.random() * 1000000),
    answerStartedAt: null,
    introStartedAt: introduction ? c.now : null,
  };
  for (const playerId of c.ids) {
    const p = g.players[playerId];
    Object.assign(p, {
      submitted: !!p.abandoned,
      passed: !!p.abandoned,
      dice: [0, 0, 0, 0, 0],
      held: [false, false, false, false, false],
      rolls: 0,
      rollId: 0,
      rollStartedAt: null,
      chargingStartedAt: null,
      elapsed: null,
      guess: null,
      risk: "safe",
      streak: p.streak ?? 0,
    });
  }
  if (id === "colossus") g.public.weakness = colossusWeaknesses[boss.phase];
  if (id === "dragon") {
    const product = pick(products, c);
    g.secret.product = product;
    // Explicit allow-list: the catalog also contains the solution and external links.
    g.public.product = {
      id: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      priceDate: product.priceDate,
    };
  }
  if (introduction) {
    g.stage = "intro";
    g.deadline = c.now + INTRO_MS;
    event(g, `${id}Intro`);
  } else beginAnswer(g, c);
}

function allReady(g: GameState, c: Context) {
  return c.ids.every(
    (id) => g.players[id].submitted || g.players[id].abandoned,
  );
}

function finishAttack(g: GameState, c: Context) {
  const boss = g.public.boss;
  const outcomes = c.ids.map((id) => {
    const p = g.players[id];
    const submitted = p.submitted && !p.passed;
    let row: Record<string, any> = {
      id,
      score: 0,
      damage: 0,
      submitted,
      label: "Kein Angriff",
    };
    if (submitted && g.id === "colossus") {
      row = {
        ...row,
        ...colossusScore(p.dice, g.public.weakness),
        dice: [...p.dice],
        rolls: p.rolls,
      };
    } else if (submitted && g.id === "kraken") {
      const gauge = krakenGauge(p.elapsed, boss.phase, g.public.seed);
      p.streak = gauge.accuracy >= 0.8 ? p.streak + 1 : 0;
      const streakBonus = Math.min(3, Math.max(0, p.streak - 1)) * 100;
      row = {
        ...row,
        score: Math.round(1000 * gauge.accuracy) + streakBonus,
        accuracy: gauge.accuracy,
        elapsed: p.elapsed,
        position: gauge.position,
        target: gauge.target,
        streak: p.streak,
        streakBonus,
        label:
          gauge.accuracy >= 0.98
            ? "Perfekter Treffer"
            : gauge.accuracy >= 0.8
              ? "Direkter Treffer"
              : gauge.accuracy >= 0.35
                ? "Streifschuss"
                : "Gischt und Hoffnung",
      };
    } else if (submitted && g.id === "dragon") {
      row = {
        ...row,
        ...dragonScore(p.guess, g.secret.product.price, p.risk),
        guess: p.guess,
        risk: p.risk,
      };
    } else if (g.id === "kraken") p.streak = 0;
    g.scores[id] += row.score;
    return row;
  });
  const hpBefore = boss.hp;
  const phaseFloor = boss.segmentHp * (2 - boss.phase);
  const totalScore = outcomes.reduce((sum, row) => sum + row.score, 0);
  const totalDamage = Math.min(hpBefore - phaseFloor, totalScore);
  // Integer proportional shares sum exactly to the actual armor damage.
  let cumulative = 0;
  let allocated = 0;
  for (const row of outcomes) {
    cumulative += row.score;
    const target = totalScore
      ? Math.round((cumulative / totalScore) * totalDamage)
      : 0;
    row.damage = target - allocated;
    allocated = target;
    (g.players[row.id].history ??= []).push({ round: g.round + 1, ...row });
  }
  boss.hp = hpBefore - totalDamage;
  boss.victory = boss.hp === 0;
  const phaseBroken = totalDamage > 0 && boss.hp === phaseFloor;
  g.public.reveal = {
    outcomes,
    totalDamage,
    totalScore,
    hpBefore,
    hpAfter: boss.hp,
    phaseBroken,
    victory: boss.victory,
    finalAttack: boss.victory || g.round + 1 >= g.totalRounds,
    ...(g.id === "dragon"
      ? {
          price: g.secret.product.price,
          source: g.secret.product.source,
          priceDate: g.secret.product.priceDate,
        }
      : {}),
  };
  g.public.revealStartedAt = c.now;
  g.stage = "roundReveal";
  // Let the authored defeat animation finish before the final scoreboard.
  g.deadline =
    c.now + (boss.victory ? 20000 : g.id === "dragon" ? 14000 : REVEAL_MS);
  event(g, `${g.id}Volley`);
}

function bossGame(id: BossId): GameModule {
  return {
    init(c) {
      const g = base(id, c);
      g.totalRounds = Math.max(3, Math.min(30, Math.floor(c.settings.rounds)));
      const maxHp = 450 * g.totalRounds * c.ids.length;
      g.public.boss = {
        hp: maxHp,
        maxHp,
        segmentHp: maxHp / 3,
        phase: 0,
        phaseName: bossPhaseNames[id][0],
        victory: false,
      };
      beginAttack(g, c, true);
      return g;
    },
    action(g, playerId, a, c) {
      const p = g.players[playerId];
      ensure(
        c.ids.includes(playerId) && p && !p.abandoned,
        "Du schaust diesem Kampf zu.",
      );
      ensure(
        a.round === g.round + 1 && g.stage === "answer" && c.now < g.deadline,
        "Dieser Angriff ist bereits vorbei.",
      );
      ensure(!p.submitted, "Dein Angriff ist schon festgelegt.");
      if (a.type === "pass") {
        p.submitted = true;
        p.passed = true;
      } else if (id === "colossus") {
        if (a.type === "roll") {
          ensure(p.rolls < 3, "Du hast bereits dreimal gewürfelt.");
          // Selection travels atomically with the throw: no round trip per die.
          if (a.held !== undefined) {
            ensure(
              Array.isArray(a.held) &&
                a.held.length === 5 &&
                a.held.every((held: unknown) => typeof held === "boolean") &&
                (p.rolls > 0 || a.held.every((held: boolean) => !held)),
              "Ungültige Würfelauswahl.",
            );
            p.held = [...a.held];
          }
          p.dice = p.dice.map((value: number, i: number) =>
            p.held[i] ? value : 1 + Math.floor(c.random() * 6),
          );
          p.rolls++;
          p.rollId++;
          p.rollStartedAt = c.now;
          event(g, "colossusRoll", playerId, c.now);
          return;
        }
        if (a.type === "hold") {
          ensure(
            p.rolls > 0 && p.rolls < 3,
            "Würfel können nur vor einem weiteren Wurf gehalten werden.",
          );
          const index = int(a.index, 0, 4);
          p.held[index] = !p.held[index];
          return;
        }
        ensure(
          a.type === "strike" && p.rolls > 0,
          "Würfle zuerst und löse dann deinen Angriff aus.",
        );
        p.submitted = true;
        p.participated = true;
      } else if (id === "kraken") {
        if (a.type === "start") {
          ensure(
            g.deadline - c.now >= 1000,
            "Dieser Angriff endet gleich. Lade beim nächsten Angriff.",
          );
          // A new gesture after reloading or cancelling replaces the unfinished charge.
          p.chargingStartedAt = c.now;
          event(g, "krakenCharge", playerId);
          return;
        }
        ensure(
          a.type === "fire" && p.chargingStartedAt !== null,
          "Lade zuerst deine Kanone.",
        );
        const elapsed = Number(a.elapsed);
        ensure(
          Number.isFinite(elapsed) &&
            elapsed >= 0 &&
            elapsed <= 15000 &&
            elapsed <= c.now - p.chargingStartedAt + 2500 &&
            c.now - p.chargingStartedAt - elapsed <= 10000,
          "Die Ladung wurde unterbrochen. Lass die Taste los und bestätige deinen gemessenen Schuss erneut.",
        );
        p.elapsed = Math.round(elapsed);
        p.submitted = true;
        p.participated = true;
      } else {
        ensure(a.type === "estimate", "Gib einen Preis und dein Risiko an.");
        const guess = int(a.guess, 1, 100000000);
        ensure(
          dragonRisks.some((risk) => risk.id === a.risk),
          "Wähle Sicher, Mutig oder Alles riskieren.",
        );
        p.guess = guess;
        p.risk = a.risk;
        p.submitted = true;
        p.participated = true;
      }
      event(g, `${id}Ready`, playerId);
      if (allReady(g, c)) finishAttack(g, c);
    },
    tick(g, c) {
      if (g.stage === "intro" && c.now >= g.deadline) {
        beginAnswer(g, c);
        return;
      }
      if (g.stage === "answer" && (c.now >= g.deadline || allReady(g, c))) {
        if(c.now>=g.deadline)for(const playerId of c.ids) {
          const p=g.players[playerId];
          if(p.submitted || p.abandoned)continue;
          if(id==="colossus" && p.rolls>0) {p.submitted=true;p.participated=true;}
          if(id==="kraken" && p.chargingStartedAt!==null) {
            p.elapsed=Math.min(15000,Math.max(0,g.deadline-p.chargingStartedAt));
            p.submitted=true;p.participated=true;
          }
        }
        finishAttack(g, c);
        return;
      }
      if (g.stage === "roundReveal" && c.now >= g.deadline) {
        if (g.public.reveal.finalAttack) {
          g.stage = "done";
          return;
        }
        const phaseBroken = g.public.reveal.phaseBroken;
        g.round++;
        if (phaseBroken) g.public.boss.phase++;
        beginAttack(g, c, phaseBroken);
      }
    },
    view(g, playerId) {
      return {
        ...commonView(g, playerId),
        roster: Object.entries(g.players).map(([id, p]) => ({
          id,
          submitted: !!p.submitted || !!p.abandoned,
          charging:
            g.stage === "answer" &&
            p.chargingStartedAt !== null &&
            !p.submitted &&
            !p.abandoned,
          rolls: p.rolls,
          streak: p.streak,
          abandoned: !!p.abandoned,
        })),
      };
    },
    results: rawResults,
  };
}

export const colossus = bossGame("colossus");
export const kraken = bossGame("kraken");
export const dragon = bossGame("dragon");
