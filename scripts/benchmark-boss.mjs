import fs from "node:fs";
import { build } from "esbuild";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
await build({
  entryPoints: ["tests/browser-game-engine.ts"],
  outfile: "outputs/browser-boss-engine.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { match } = await import("../outputs/browser-boss-engine.mjs");
const label = process.argv[2] || "current";
const width = Number(process.argv[3] || 1920),
  height = Number(process.argv[4] || 1080);
const browser = await chromium.launch({
  headless: true,
  channel: "chromium",
  args: [
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-gpu",
    "--use-angle=d3d11",
  ],
});
const results = [],
  errors = [];
try {
  for (const kind of ["colossus", "kraken", "dragon"]) {
    const m = match(kind, 12),
      g = m.room.game;
    g.deadline = Date.now() - 1;
    m.view();
    g.deadline = Date.now() + 600000;
    const page = await browser.newPage({ viewport: { width, height } });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && /THREE|WebGL|Shader/.test(m.text()))
        errors.push(m.text());
    });
    await page.routeWebSocket("**/api/live", (ws) => ws.close());
    await page.addInitScript((id) => {
      localStorage.setItem(
        "olymp.session",
        JSON.stringify({ code: "QA1234", playerId: id, token: "fixture" }),
      );
      localStorage.setItem(
        "olymp.settings",
        JSON.stringify({ muted: true, motion: false, intense: true }),
      );
      const stats = (window.__measure = {
        samples: [],
        calls: 0,
        triangles: 0,
        backend: "",
      });
      for (const proto of [
        WebGLRenderingContext.prototype,
        WebGL2RenderingContext.prototype,
      ]) {
        for (const key of [
          "drawArrays",
          "drawElements",
          "drawArraysInstanced",
          "drawElementsInstanced",
        ]) {
          const original = proto[key];
          if (!original) continue;
          proto[key] = function (...a) {
            stats.calls++;
            stats.triangles +=
              (a[0] === 4 ? (key.includes("Arrays") ? a[2] : a[1]) / 3 : 0) *
              (key.includes("Instanced") ? a.at(-1) : 1);
            return original.apply(this, a);
          };
        }
      }
      const context = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (...a) {
        const gl = context.apply(this, a);
        if (gl && String(a[0]).includes("webgl")) {
          const ext = gl.getExtension("WEBGL_debug_renderer_info");
          stats.backend = ext
            ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
            : gl.getParameter(gl.RENDERER);
        }
        return gl;
      };
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = (cb) =>
        raf.call(window, (t) => {
          stats.calls = 0;
          stats.triangles = 0;
          const start = performance.now();
          cb(t);
          if (stats.calls)
            stats.samples.push({
              t,
              cpu: performance.now() - start,
              calls: stats.calls,
              triangles: stats.triangles,
            });
        });
    }, m.first);
    let phase = "idle";
    await page.route("**/api/room", (route) => {
      if (label.startsWith("final") && phase === "volley") {
        const at = Math.floor(Date.now() / 3000) * 3000;
        m.room.emotes = m.room.participantIds.map((player, i) => ({
          id: `${at}:${player}`,
          player,
          at,
          emote: [0, 13, 37, 43][i % 4],
        }));
      }
      if (phase !== "idle") {
        g.stage = "roundReveal";
        g.public.revealStartedAt =
          Date.now() - (phase === "volley" ? 4800 : 11200);
        g.public.reveal = {
          outcomes: m.room.participantIds.map((id) => ({
            id,
            score: 1200,
            damage: 450,
            accuracy: 1,
            submitted: true,
            label: "Treffer",
            guess: g.secret.product?.price,
          })),
          totalDamage: 5400,
          hpBefore: 6000,
          hpAfter: 600,
          phaseBroken: phase === "victory",
          victory: phase === "victory",
          price: g.secret.product?.price,
        };
      }
      return route.fulfill({ json: m.view() });
    });
    await page.goto("http://127.0.0.1:5173");
    await page
      .locator(".boss-scene-wrapper.is-ready")
      .waitFor({ timeout: 90000 });
    await page.waitForTimeout(2500);
    for (const state of ["idle", "volley", "victory"]) {
      phase = state;
      await page.waitForTimeout(1800);
      await page.evaluate(() => (window.__measure.samples = []));
      await page.waitForTimeout(6000);
      const data = await page.evaluate(() => {
        const s = window.__measure,
          samples = s.samples,
          intervals = samples
            .slice(1)
            .map((x, i) => x.t - samples[i].t)
            .sort((a, b) => a - b),
          cpu = samples.map((x) => x.cpu).sort((a, b) => a - b);
        const percentile = (a, p) => a[Math.floor((a.length - 1) * p)] || 0;
        return {
          backend: s.backend,
          frames: samples.length,
          fps:
            (1000 * (samples.length - 1)) / (samples.at(-1).t - samples[0].t),
          frameP50: percentile(intervals, 0.5),
          frameP95: percentile(intervals, 0.95),
          cpuP50: percentile(cpu, 0.5),
          cpuP95: percentile(cpu, 0.95),
          calls: Math.round(
            samples.reduce((n, x) => n + x.calls, 0) / samples.length,
          ),
          triangles: Math.round(
            samples.reduce((n, x) => n + x.triangles, 0) / samples.length,
          ),
          diagnostics: {
            ...document.querySelector(".boss-scene-canvas").dataset,
          },
        };
      });
      results.push({ kind, state, width, height, ...data });
      console.log(JSON.stringify(results.at(-1)));
      if (process.env.BOSS_PERF_SHOTS === "1")
        await page.screenshot({
          path: `outputs/qa/performance-${label}-${kind}-${state}.png`,
        });
    }
    await page.close();
  }
  fs.writeFileSync(
    `outputs/qa/boss-performance-${label}.json`,
    JSON.stringify({ results, errors }, null, 2),
  );
  if (errors.length) throw new Error(errors.join("\n"));
  if (label.startsWith("final"))
    for (const result of results) {
      if (/SwiftShader|llvmpipe/i.test(result.backend))
        throw new Error("Hardware benchmark used software rendering.");
      if (result.fps < 59 || result.frameP95 > 25)
        throw new Error(
          `${result.kind}/${result.state}: performance target missed (${result.fps} FPS, p95 ${result.frameP95} ms)`,
        );
    }
} finally {
  await browser.close();
}
