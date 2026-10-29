import {
  base,
  commonView,
  event,
  finishRound,
  nextOrDone,
  rawResults,
  pick,
  reset,
  submit,
  everyone,
} from "../common";
import { pictures, sizes } from "../content";
import amazonProducts from "../data/amazon-products.json";
const sizeCategoryCounts = new Map<string, number>();
for (const item of sizes) {
  const category = item.kind ?? "everyday";
  sizeCategoryCounts.set(category, (sizeCategoryCounts.get(category) ?? 0) + 1);
}
import {
  ensure,
  int,
  shuffle,
  type GameId,
  type GameModule,
  type GameState,
  type Context,
} from "../types";
export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}
export function distance(a: string, b: string) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = d[j];
      d[j] = Math.min(
        d[j] + 1,
        d[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = old;
    }
  }
  return d[b.length];
}
export function accepts(input: string, answers: string[]) {
  const s = normalize(input);
  return answers.some((a) => {
    const n = normalize(a);
    return s === n || (n.length >= 5 && distance(s, n) <= 1);
  });
}
export function rgbLab(rgb: number[]) {
  const [r, g, b] = rgb.map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const f = (v: number) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  const x = f((r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047),
    y = f(r * 0.2126729 + g * 0.7151522 + b * 0.072175),
    z = f((r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
export function deltaE(a: number[], b: number[]) {
  const x = rgbLab(a),
    y = rgbLab(b);
  return Math.hypot(...x.map((v, i) => v - y[i]));
}
export function sizeAccuracy(guess: number, actual: number) {
  return Math.exp(-Math.abs(Math.log(guess / actual)));
}
function next(g: GameState, c: Context) {
  reset(g, c);
  g.secret.start = c.now;
  if (g.id === "picture") {
    const item = pick(pictures, c);
    g.secret.item = item;
    g.public.image = item.image;
    g.public.startedAt = c.now;
    g.public.buzzer = null;
    g.public.buzzDeadline = 0;
    g.public.buzzTurn = 0;
    for (const id of c.ids) {
      g.players[id].nextGuess = 0;
      g.players[id].correct = 0;
      g.players[id].attempts = 0;
      g.players[id].buzzedOut = false;
    }
  }
  if (g.id === "budget") {
    const pool = shuffle(
      amazonProducts.filter((p) => !c.used.includes(p.id)),
      c.random,
    );
    const recent = new Set(c.used.slice(-10));
    const items = (
      pool.length >= 10
        ? pool
        : shuffle(
            amazonProducts.filter((p) => !recent.has(p.id)),
            c.random,
          )
    ).slice(0, 10);
    items.forEach((p) => c.used.push(p.id));
    g.secret.items = items;
    g.public.items = items.map(({ id, name, image, category }) => ({
      id,
      name,
      image,
      category,
    }));
    g.public.budget =
      Math.round((items.reduce((s, p) => s + p.price, 0) * 0.38) / 100) * 100;
    g.public.priceNotice = `Amazon.de · Preisstand ${items[0].priceDate.split("-").reverse().join(".")} · ${amazonProducts.length} Artikel · Preise heute können abweichen`;
  }
  if (g.id === "color") {
    g.secret.target = Array.from({ length: 3 }, () =>
      Math.floor(25 + c.random() * 205),
    );
    g.public.previewUntil = c.now + 4000;
    g.deadline += 4000;
  }
  if (g.id === "size") {
    // Keep familiar everyday objects present despite larger landmark archives.
    g.secret.item = pick(
      sizes,
      c,
      (item) => 1 / sizeCategoryCounts.get(item.kind ?? "everyday")!,
    );
    g.public.item = {
      name: g.secret.item.name,
      measure: g.secret.item.measure,
      kind: g.secret.item.kind,
    };
    const actual = g.secret.item.cm;
    const references =
      actual < 20
        ? [
            { name: "Kreditkarte", icon: "Kreditkarte", cm: 8.56 },
            { name: "Tennisball", icon: "Tennisball", cm: 6.7 },
            { name: "2-Euro-Münze", icon: "2-Euro-Münze", cm: 2.575 },
          ]
        : actual < 250
          ? [
              { name: "A4-Blatt · lange Seite", icon: "A4-Blatt", cm: 29.7 },
              {
                name: "Tischtennisplatte · Länge",
                icon: "Tischtennisplatte",
                cm: 274,
              },
              { name: "Fußball · Durchmesser", icon: "Fußball", cm: 22 },
            ]
          : actual < 10000
            ? [
                { name: "Container · Länge", icon: "Container", cm: 605.8 },
                { name: "Fußballtor · Breite", icon: "Fußballtor", cm: 732 },
                { name: "Giraffe · Höhe", icon: "Giraffe", cm: 550 },
              ]
            : [
                { name: "Eiffelturm · Höhe", icon: "Eiffelturm", cm: 33000 },
                {
                  name: "Olympisches Becken · Länge",
                  icon: "Olympisches Schwimmbecken",
                  cm: 5000,
                },
                { name: "Container · Länge", icon: "Container", cm: 605.8 },
              ];
    const alternatives = references.filter(
      (r) => r.icon !== g.secret.item.name,
    );
    g.public.reference =
      alternatives[Math.floor(c.random() * alternatives.length)];
  }
}
function resolve(g: GameState, c: Context) {
  const rows = c.ids.map((id) => {
    const p = g.players[id];
    let score = 0,
      detail: any = {};
    if (g.id === "picture") {
      score = p.correct
        ? Math.max(
            100,
            1000 -
              Math.round(
                ((p.correct - g.secret.start) / (c.settings.seconds * 1000)) *
                  900,
              ),
          )
        : 0;
      detail = { answer: p.answer, correct: !!p.correct };
    }
    if (g.id === "color" && p.submitted) {
      const error = deltaE(p.answer, g.secret.target);
      score = Math.max(0, 100 - error);
      detail = { estimate: p.answer, target: g.secret.target, error };
    }
    if (g.id === "size" && p.submitted) {
      score = 100 * sizeAccuracy(p.answer, g.secret.item.cm);
      detail = {
        estimate: p.answer,
        actual: g.secret.item.cm,
        accuracy: score,
        source: g.secret.item.source,
      };
    }
    if (g.id === "budget" && p.submitted) {
      const items = g.secret.items.filter((x: any) => p.answer.includes(x.id)),
        sum = items.reduce((s: number, x: any) => s + x.price, 0),
        valid = sum <= g.public.budget;
      score = valid ? items.length * 100 + sum / g.public.budget : 0;
      detail = {
        items: items.map((x: any) => x.id),
        sum,
        count: items.length,
        over: !valid,
      };
    }
    g.scores[id] += score;
    p.history ??= [];
    p.history.push({ round: g.round + 1, score, ...detail });
    return { id, score, ...detail };
  });
  const reveal: any = { players: rows };
  if (g.id === "picture") {
    reveal.answer = g.secret.item.answer;
    const { author, license, licenseUrl, source, changes } = g.secret.item;
    reveal.photoCredit = { author, license, licenseUrl, source, changes };
  }
  if (g.id === "budget") reveal.items = g.secret.items;
  if (g.id === "color") reveal.target = g.secret.target;
  if (g.id === "size") reveal.item = g.secret.item;
  finishRound(g, c, reveal);
}
export function quiz(id: GameId): GameModule {
  return {
    init(c) {
      const g = base(id, c);
      next(g, c);
      return g;
    },
    action(g, id, a, c) {
      const p = g.players[id];
      if(g.id === "picture" && a.type === "buzz") {
        ensure(c.ids.includes(id) && g.stage==="answer" && c.now<g.deadline && !p.buzzedOut && !p.abandoned && !g.public.buzzer,"Der Buzzer ist gerade nicht verfügbar.");
        g.public.buzzer=id;g.public.buzzTurn=(g.public.buzzTurn??0)+1;g.public.buzzStartedAt=c.now;
        g.public.buzzDeadline=Math.min(g.deadline,c.now+8000);
        event(g,"buzz",id,c.now);
        return;
      }
      ensure(a.type === "answer", "Unbekannte Aktion.");
      if (g.id === "picture") {
        ensure(
          g.stage === "answer" && c.now < g.deadline && c.now<g.public.buzzDeadline && g.public.buzzer===id && !p.correct,
          "Runde bereits beendet.",
        );
        ensure(c.now >= (p.nextGuess ?? 0), "Bitte kurz warten.");
        ensure(
          typeof a.value === "string" && a.value.length <= 100,
          "Antwort zu lang.",
        );
        p.nextGuess = c.now + 1200;
        p.attempts = (p.attempts ?? 0) + 1;
        p.answer = a.value;
        p.participated = true;
        if (accepts(a.value, g.secret.item.aliases)) {
          p.correct = c.now;
          p.submitted = true;
          event(g, "correct", id,c.now);
          resolve(g,c);
        } else {
          p.buzzedOut=true;g.public.buzzer=null;g.public.buzzDeadline=0;
          event(g, "wrong", id,c.now);
          if(c.ids.every(pid=>g.players[pid].buzzedOut||g.players[pid].abandoned))resolve(g,c);
        }
        return;
      }
      if (g.id === "color")
        ensure(
          c.now >= g.public.previewUntil,
          "Präge dir zuerst die Farbe ein.",
        );
      if (g.id === "budget") {
        ensure(
          Array.isArray(a.value) && a.value.length <= 10,
          "Ungültiger Warenkorb.",
        );
        const items = [...new Set(a.value)];
        ensure(
          items.every((x) => g.secret.items.some((p: any) => p.id === x)),
          "Unbekanntes Produkt.",
        );
        submit(g, id, c);
        p.answer = items;
      }
      if (g.id === "color") {
        ensure(
          Array.isArray(a.value) && a.value.length === 3,
          "Ungültige Farbe.",
        );
        const rgb = a.value.map((v: any) => int(v, 0, 255));
        submit(g, id, c);
        p.answer = rgb;
      }
      if (g.id === "size") {
        const v = Number(a.value);
        ensure(Number.isFinite(v) && v > 0 && v <= 1e8, "Ungültige Größe.");
        submit(g, id, c);
        p.answer = v;
      }
    },
    tick(g, c) {
      nextOrDone(g, c, () => next(g, c));
      if(g.id==="picture" && g.stage==="answer" && g.public.buzzer &&
        (c.now>=g.public.buzzDeadline || g.players[g.public.buzzer].abandoned)) {
        g.players[g.public.buzzer].buzzedOut=true;
        event(g,"buzzTimeout",g.public.buzzer,c.now);
        g.public.buzzer=null;g.public.buzzDeadline=0;
        if(c.ids.every(id=>g.players[id].buzzedOut||g.players[id].abandoned))resolve(g,c);
      }
      if (g.stage === "answer" && (c.now >= g.deadline || everyone(g, c)))
        resolve(g, c);
    },
    view(g, id) {
      const v = commonView(g, id);
      if (g.id === "picture")
        v.guesses = Object.fromEntries(
          Object.entries(g.players).map(([key, p]) => [
            key,
            { attempts: p.attempts ?? 0, solved: !!p.correct, out: !!p.buzzedOut, abandoned: !!p.abandoned },
          ]),
        );
      if (g.id === "color" && g.stage === "answer")
        v.target = Date.now() < g.public.previewUntil ? g.secret.target : null;
      return v;
    },
    results: rawResults,
  };
}
