import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = process.env.QA_BASE ?? 'http://127.0.0.1:5173';
const logPath = process.env.QA_WORKER_LOG;
const readLog = () => {
  if (!logPath || !fs.existsSync(logPath)) return '';
  const bytes = fs.readFileSync(logPath);
  return bytes.toString(bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf16le' : 'utf8');
};
const hangs = () => (readLog().match(/Worker.s code had hung/g) ?? []).length;
const before = hangs();
const repeats=Number(process.env.REALTIME_CLOSE_REPEATS??1);
assert.ok(Number.isInteger(repeats)&&repeats>=1&&repeats<=10,'REALTIME_CLOSE_REPEATS must be an integer from 1 to 10');
const response = await fetch(base + '/api/room', {
  method: 'POST', headers: {'content-type': 'application/json'},
  body: JSON.stringify({type: 'create', name: 'Socket lifecycle QA', avatar: 0}),
});
assert.ok(response.ok);
const room = await response.json();
// Session secrets stay in memory; the report contains only lifecycle evidence.
const credentials = {code: room.room.code, playerId: room.playerId, token: room.token};
const results = [];
for(let repeat=0;repeat<repeats;repeat++)for (const mode of ['before-auth', 'snapshot', 'frame', 'snapshot', 'frame', 'invalid-auth', 'auth-timeout']) {
  const result = await new Promise((resolve, reject) => {
    const socket = new WebSocket(base.replace(/^http/, 'ws') + '/api/live');
    let snapshots = 0;
    const started = Date.now();
    const timer = setTimeout(() => { socket.close(); reject(Error('Socket lifecycle timed out: ' + mode)); }, 10000);
    socket.onopen = () => {
      if (mode === 'before-auth') socket.close(1000);
      else if (mode !== 'auth-timeout') socket.send(JSON.stringify(mode === 'invalid-auth' ? {...credentials, token: 'invalid'} : credentials));
    };
    socket.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.type !== 'snapshot') return;
      snapshots++;
      if (mode === 'frame') socket.send(JSON.stringify({type: 'frame'}));
      socket.close(1000);
    };
    socket.onerror = () => { clearTimeout(timer); reject(Error('Socket error: ' + mode)); };
    socket.onclose = event => {
      clearTimeout(timer);
      resolve({mode, snapshots, code: event.code, clean: event.wasClean, elapsedMs: Date.now() - started});
    };
  });
  results.push({...result,repeat});
  await new Promise(resolve => setTimeout(resolve, 150));
}
await new Promise(resolve => setTimeout(resolve, 1000));
const report = {workerd:JSON.parse(fs.readFileSync('node_modules/workerd/package.json','utf8')).version,results, runtimeLogChecked: !!logPath, runtimeHangDelta: logPath ? hangs() - before : null};
fs.writeFileSync(process.env.REALTIME_CLOSE_REPORT??'outputs/qa/realtime-close.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
for (const result of results) {
  assert.equal(result.code, ['invalid-auth', 'auth-timeout'].includes(result.mode) ? 1008 : 1000, result.mode);
  assert.equal(result.clean, true, result.mode);
  if (['snapshot', 'frame'].includes(result.mode)) assert.ok(result.snapshots >= 1);
  else assert.equal(result.snapshots, 0);
}
if (logPath) assert.equal(report.runtimeHangDelta, 0, 'Worker reported a hanging request during socket close');
