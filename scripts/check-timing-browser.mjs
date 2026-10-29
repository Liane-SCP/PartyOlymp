import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "../../.tools/qa/node_modules/playwright/index.mjs";
const base = "http://127.0.0.1:5173",
  api = async (body) => {
    const r = await fetch(base + "/api/room", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      }),
      d = await r.json();
    assert.ok(r.ok, d.error);
    return d;
  },
  command = (s, action) =>
    api({ ...s, type: "action", requestId: crypto.randomUUID(), action });
const first = await api({ type: "create", name: "Clock A", avatar: 0 }),
  a = { code: first.room.code, playerId: first.playerId, token: first.token },
  second = await api({
    type: "join",
    code: a.code,
    name: "Clock B",
    avatar: 1,
  }),
  b = { code: a.code, playerId: second.playerId, token: second.token };
await command(a, {
  type: "configure",
  selection: [{ id: "timing", rounds: 1, seconds: 45 }],
});
for (const s of [a, b]) await command(s, { type: "ready" });
await command(a, { type: "start" });
// The journey wheel now precedes the rules; ready is only valid in the latter.
async function phase(name,timeout=90000){const end=Date.now()+timeout;while(Date.now()<end){const room=(await api({...a,type:'poll'})).room;if(room.phase===name)return room;await new Promise(resolve=>setTimeout(resolve,150));}throw Error(`Timed out waiting for ${name}`);}
await phase('rules');
for (const s of [a, b]) await command(s, { type: "ready" });
await phase('playing');
const browser = await chromium.launch({ headless: true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'] }),
  pages = [],
  errors = [],clients=[];
let summary=null,failure=null;
try {
  for (const [index,s] of [a, b].entries()) {
    const page = await browser.newPage({
      viewport: { width: index?390:1440, height: index?844:1100 },hasTouch:!!index,
    });
    const client={width:index?390:1440,connections:0,snapshots:0,actions:0,acks:0};clients.push(client);
    page.on('websocket',socket=>{socket.on('framesent',frame=>{try{if(JSON.parse(String(frame.payload)).type==='action')client.actions++;}catch{}});socket.on('framereceived',frame=>{try{const body=JSON.parse(String(frame.payload));if(body.type==='connected')client.connections++;if(body.type==='snapshot')client.snapshots++;if(body.type==='ack'){assert.equal(body.ok,true);client.acks++;}if(body.type==='error')errors.push(body.error);}catch(error){errors.push(error.message);}});});
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript((s) => {
      localStorage.setItem("olymp.session", JSON.stringify(s));
      localStorage.setItem(
        "olymp.settings",
        JSON.stringify({ muted: true, motion: true }),
      );
      localStorage.setItem('olymp.graphics','low');
    }, s);
    await page.goto(base);
    await page.locator('.adventure-ready').waitFor({timeout:60000});
    await page.waitForFunction(()=>document.querySelector('.connection.online')&&document.querySelector('.adventure-canvas canvas')?.dataset.readyAvatars==='2');
    pages.push(page);
  }
  await Promise.all(
    pages.map((p) =>
      p.getByRole("button", { name: "Meine Uhr starten" }).waitFor(),
    ),
  );
  const run = async (page, index) => {
    const start=page.getByRole("button", { name: "Meine Uhr starten" });
    if(index)await start.tap();else await start.click();
    await page.getByRole("button", { name: "STOPP", exact: true }).waitFor();
    const started = await page.evaluate(() =>
      Number(
        sessionStorage.getItem(
          Object.keys(sessionStorage).find((k) => k.startsWith("olymp.clock:")),
        ),
      ),
    );
    assert.ok(started>0,'The actual local monotonic-clock origin must be persisted');
    const r = (await api({ ...a, type: "poll" })).room,
      target = r.game.target;
    if (index === 0) {
      await page.reload();
      await page.locator('.adventure-ready').waitFor({timeout:60000});
      await page.getByRole("button", { name: "STOPP", exact: true }).waitFor();
    }
    const delay = Math.max(0, started + target + index * 250 - Date.now());
    await page.waitForTimeout(delay);
    const stop=page.getByRole("button", { name: "STOPP", exact: true });
    if(index)await stop.tap();else await stop.click();
  };
  await Promise.all(pages.map(run));
  await pages[0].locator(".trio-results").waitFor();
  const r = (await api({ ...a, type: "poll" })).room;
  assert.equal(r.game.stage, "roundReveal");
  for (const p of r.game.reveal.players)
    assert.ok(Math.abs(p.error) < 1200, `unexpected error ${p.error}`);
  for(const client of clients){assert.ok(client.connections>0&&client.snapshots>0);assert.equal(client.actions,client.acks);assert.ok(client.actions>=2);}
  assert.deepEqual(errors, []);
  summary={players:2,target:r.game.target,results:r.game.reveal.players.map(p=>({error:p.error,score:p.score})),clients,rejoin:true,errors};
  console.log(
    "PASS actual browser timing: independent starts, reload resumes local clock, pointer stops, secret results, shared reveal",
    r.game.reveal.players.map((p) => ({ error: p.error, score: p.score })),
  );
} catch(error){failure=error.message;throw error;} finally {
  fs.writeFileSync('outputs/qa/timing-live-session.json',JSON.stringify({summary,failure,limits:'One actual local two-player round, native desktop mouse/mobile-layout touch, HTTP/D1 and browser WebSockets, real clocks and reload; no interception or game-state edits. Not physical mobile hardware, long sessions, all 21 games or resolution of the known workerd close defect.'},null,2));
  await browser.close();
}
