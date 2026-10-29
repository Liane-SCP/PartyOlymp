import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from '../../.tools/qa/node_modules/playwright/index.mjs';

await build({entryPoints: ['tests/journey-browser-engine.ts', 'tests/adventure-browser-engine.ts'], outdir: 'outputs/quality-fixture', bundle: true, platform: 'node', format: 'esm'});
const {fixture} = await import('../outputs/quality-fixture/journey-browser-engine.js');
const {fixture: adventure} = await import('../outputs/quality-fixture/adventure-browser-engine.js');
const hardware = process.env.QA_HARDWARE === '1';
const browser = await chromium.launch({headless: true, args: hardware ? ['--use-angle=d3d11', '--enable-webgl'] : ['--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader']});
const results = [], errors = [];
const read = page => page.locator('.journey-canvas canvas').evaluate(canvas => ({quality: canvas.dataset.quality, fps: +canvas.dataset.targetFps, count: +canvas.dataset.renderCount, ratio: +canvas.dataset.pixelRatio, width: canvas.width, height: canvas.height, frameP95: +canvas.dataset.frameP95, cpuP95: +canvas.dataset.renderP95}));
async function attach(page, model) {
  page.on('pageerror', error => errors.push(error.message));
  await page.routeWebSocket('**/api/live', socket => socket.close());
  await page.addInitScript(({code, id}) => {
    localStorage.setItem('olymp.session', JSON.stringify({code, playerId: id, token: 'fixture'}));
    localStorage.setItem('olymp.settings', JSON.stringify({muted: true}));
    if (localStorage.getItem('olymp.graphics') === null) localStorage.setItem('olymp.graphics', 'auto');
  }, {code: model.room.code, id: model.first});
  await page.route('**/api/room', route => route.fulfill({json: model.view()}));
  await page.goto('http://127.0.0.1:5173');
}
async function ready(page) {
  await page.locator('.journey-ready').waitFor();
  await page.locator('.journey-atlas').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.journey-canvas canvas')?.dataset.readyAvatars === '12');
}
async function measure(page, duration = 3500) {
  const before = await read(page), started = Date.now();
  await page.waitForTimeout(duration);
  const after = await read(page);
  return {...after, observedFps: (after.count - before.count) / ((Date.now() - started) / 1000)};
}
try {
  for (const width of [1440, 390, 320]) {
    const model = fixture(12); model.atlas(21);
    const context = await browser.newContext({viewport: {width, height: 1100}, deviceScaleFactor: 2, hasTouch: width < 600});
    const page = await context.newPage();
    await attach(page, model); await ready(page);
    const canvas = page.locator('.journey-canvas canvas');
    const gpu = await canvas.evaluate(canvas => { const gl = canvas.getContext('webgl2'), ext = gl.getExtension('WEBGL_debug_renderer_info'); return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); });
    if (hardware) assert.ok(!/swiftshader|software|basic render driver|llvmpipe/i.test(gpu), 'Hardware rendering unavailable: ' + gpu);
    const initial = await read(page);
    assert.equal(initial.quality, width < 600 ? 'medium' : 'high');
    await canvas.evaluate(canvas => { window.__qualityCanvas = canvas; });
    const choice = page.getByRole('combobox', {name: 'Grafikqualit\u00e4t der Weltkarte', exact: true});
    await choice.scrollIntoViewIfNeeded();
    assert.equal(await choice.evaluate(select => {
      const box = select.getBoundingClientRect();
      return box.height >= 44 && document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === select;
    }), true, 'Graphics control is covered or too small');
    await choice.selectOption('high');
    await page.waitForFunction(() => document.querySelector('.journey-canvas canvas')?.dataset.targetFps === '60');
    const high = await measure(page);
    assert.equal(high.ratio, 1.5);
    await choice.selectOption('low');
    await page.waitForFunction(() => document.querySelector('.journey-canvas canvas')?.dataset.quality === 'low');
    const low = await measure(page);
    assert.equal(low.ratio, 1); assert.equal(low.fps, 30);
    assert.ok(low.width < high.width && low.height < high.height);
    assert.equal(await canvas.evaluate(canvas => canvas === window.__qualityCanvas), true, 'Quality change rebuilt the world');
    await page.locator('.journey-atlas').screenshot({path: `outputs/qa/journey-quality-${width}.png`});
    await page.evaluate(() => { document.querySelector('.journey-atlas').style.visibility = 'hidden'; document.querySelector('.journey-atlas').style.transform = 'translateY(20000px)'; });
    await page.waitForTimeout(200);
    const paused = await measure(page, 500);
    assert.equal(paused.observedFps, 0, 'An offscreen world kept rendering');
    await page.evaluate(() => { const root = document.querySelector('.journey-atlas'); root.style.visibility = ''; root.style.transform = ''; });
    await page.locator('.journey-atlas').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    assert.ok((await measure(page, 500)).observedFps > 0);
    await page.reload(); await ready(page);
    await page.waitForFunction(() => document.querySelector('.journey-canvas canvas')?.dataset.quality === 'low');
    assert.equal(await choice.inputValue(), 'low');
    if (width === 1440) {
      const sibling = await page.context().newPage();
      await sibling.route('**/qa-graphics-preference', route => route.fulfill({contentType: 'text/html', body: '<title>Preference event fixture</title>'}));
      await sibling.goto('http://127.0.0.1:5173/qa-graphics-preference');
      await sibling.evaluate(() => localStorage.setItem('olymp.graphics', 'medium'));
      await page.waitForFunction(() => document.querySelector('.atlas-quality select')?.value === 'medium');
      await sibling.close();
      await page.bringToFront();
      await choice.selectOption('low');
    }
    if (width < 600) {
      await page.getByRole('button', {name: 'Karte im Vollbild \u00f6ffnen', exact: true}).click();
      await ready(page);
      await choice.scrollIntoViewIfNeeded();
      assert.equal(await choice.evaluate(select => {
        const box = select.getBoundingClientRect();
        return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === select;
      }), true, 'Fullscreen graphics control is covered');
      await page.locator('.journey-atlas').screenshot({path: `outputs/qa/journey-quality-${width}-fullscreen.png`});
    }
    results.push({width, gpu, initial, high, low, offscreenPaused: true, resumed: true, persisted: true, sameCanvas: true, crossTabChecked: width === 1440});
    await context.close();
  }
  const model = adventure('dice', 12), page = await browser.newPage({viewport: {width: 1440, height: 1100}});
  await attach(page, model);
  await page.locator('.adventure-ready').waitFor();
  await page.getByRole('button', {name: 'Reisekarte anzeigen', exact: true}).click();
  await ready(page);
  await page.getByRole('combobox', {name: 'Grafikqualit\u00e4t der Weltkarte', exact: true}).selectOption('low');
  assert.equal(await page.getByRole('combobox', {name: 'Grafikqualit\u00e4t', exact: true}).inputValue(), 'low');
  await page.getByRole('combobox', {name: 'Grafikqualit\u00e4t', exact: true}).selectOption('high');
  assert.equal(await page.getByRole('combobox', {name: 'Grafikqualit\u00e4t der Weltkarte', exact: true}).inputValue(), 'high');
  results.push({sharedPreference: true, directions: ['world-to-game', 'game-to-world']});
  assert.deepEqual(errors, []);
  fs.writeFileSync(`outputs/qa/journey-quality${hardware ? '-hardware' : ''}.json`, JSON.stringify({results, errors, limit: hardware ? 'This desktop GPU with the listed viewport sizes; no physical phone or reference-device acceptance.' : 'SwiftShader functional checks and render scheduling; not hardware FPS acceptance.'}, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
