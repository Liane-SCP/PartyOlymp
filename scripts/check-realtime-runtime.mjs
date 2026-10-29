import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as api from 'miniflare';
const {Miniflare,Log,LogLevel}=api;

// Isolate the runtime from Party Olymp, Vinext, D1 and authentication.
const results = [];
for (const manual of [false, true]) {
  let stderr = '';
  const options = {
    modules: true, compatibilityDate: '2026-05-15', port: 0,
    log: new Log(LogLevel.ERROR),
    handleRuntimeStdio(stdout, errors) {
      stdout.on('data', chunk => { stderr += chunk.toString(); });
      errors.on('data', chunk => { stderr += chunk.toString(); });
    },
    script: `export default {fetch(){
      const pair=new WebSocketPair(),server=pair[1];server.accept();
      server.addEventListener('message',event=>{
        if(event.data==='finish')server.close(1000);else server.send('reply');
      });
      server.addEventListener('close',()=>{${manual ? 'if(server.readyState===2)server.close(1000);' : ''}});
      return new Response(null,{status:101,webSocket:pair[0]});
    }}`,
  };
  if(typeof api.convertV4MiniflareOptions==='function'){
    delete options.handleRuntimeStdio;
    options.handleStructuredLogs=entry=>{stderr+=JSON.stringify(entry)+'\n';};
  }
  const mf=new Miniflare(typeof api.convertV4MiniflareOptions==='function'?api.convertV4MiniflareOptions(options):options);
  try {
    const url = await mf.ready;
    for (const initiator of ['client', 'server']) {
      const before = stderr.length;
      const result = await new Promise((resolve, reject) => {
        const socket = new WebSocket(String(url).replace('http:', 'ws:'));
        const timer = setTimeout(() => { socket.close(); reject(Error('Minimal close timed out')); }, 5000);
        socket.onopen = () => socket.send('hello');
        socket.onmessage = () => initiator === 'client' ? socket.close(1000) : socket.send('finish');
        socket.onerror = () => { clearTimeout(timer); reject(Error('Minimal socket failed')); };
        socket.onclose = event => {
          clearTimeout(timer);
          resolve({code: event.code, clean: event.wasClean});
        };
      });
      await new Promise(resolve => setTimeout(resolve, 300));
      const runtimeErrors = stderr.slice(before);
      results.push({manual, initiator, ...result, hangingRequests: (runtimeErrors.match(/Worker.s code had hung/g) ?? []).length, runtimeErrors});
    }
  } finally { await mf.dispose(); }
}
fs.writeFileSync(process.env.REALTIME_RUNTIME_REPORT??'outputs/qa/realtime-minimal-close.json', JSON.stringify({results, scope: 'Minimal local workerd diagnostic; no application or database. A clean client close does not prove a clean runtime request.'}, null, 2));
console.log(JSON.stringify(results.map(({runtimeErrors, ...result}) => result)));
for (const result of results) {
  assert.equal(result.code, 1000);
  assert.equal(result.clean, true);
}
// Diagnostic intentionally reports the platform fault rather than hiding it.
