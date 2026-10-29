import assert from 'node:assert/strict';import fs from 'node:fs';import * as api from 'miniflare';
const {Miniflare,Log,LogLevel}=api;
const results=[];
function options(mode,append){
 const config={modules:true,compatibilityDate:mode==='legacy-manual'?'2026-04-06':'2026-05-15',port:0,log:new Log(LogLevel.ERROR),script:`export default {fetch(){const pair=new WebSocketPair(),server=pair[1];server.accept(${mode==='half-open'?'{allowHalfOpen:true}':''});let closed=false;server.addEventListener('close',event=>{closed=true;${mode!=='automatic'?'if(server.readyState===2)server.close(event.code===1005||event.code===1006?1000:event.code);':''}});server.addEventListener('message',event=>{if(event.data==='capture'){console.error('RUNTIME_CAPTURE_SENTINEL');server.send('captured');}else if(event.data==='finish')server.close(1000);else if(event.data==='later')setTimeout(()=>{if(!closed)server.send('reply');},50);else server.send('reply');});return new Response(null,{status:101,webSocket:pair[0]});}}`};
 if(typeof api.convertV4MiniflareOptions==='function')return api.convertV4MiniflareOptions({...config,handleStructuredLogs:entry=>append(JSON.stringify(entry)+'\n')});
 return {...config,handleRuntimeStdio(stdout,errors){stdout.on('data',b=>append(b.toString()));errors.on('data',b=>append(b.toString()));}};
}
for(const mode of ['automatic','half-open','legacy-manual']){
 let stderr='';const mf=new Miniflare(options(mode,s=>stderr+=s));
 try{const url=await mf.ready;
 if(typeof api.convertV4MiniflareOptions==='function'){
  await new Promise((resolve,reject)=>{const ws=new WebSocket(String(url).replace('http:','ws:')),timer=setTimeout(()=>{ws.close();reject(Error('Runtime log capture control timed out'));},5000);ws.onopen=()=>ws.send('capture');ws.onmessage=()=>ws.close(1000);ws.onclose=()=>{clearTimeout(timer);resolve();};ws.onerror=()=>{clearTimeout(timer);reject(Error('Runtime log capture failed'));};});
  await new Promise(r=>setTimeout(r,120));assert.ok(stderr.includes('RUNTIME_CAPTURE_SENTINEL'),'Structured runtime log collector must observe an emitted error');
 }
 for(const scenario of ['client','empty-code','server','inflight'])for(let repeat=0;repeat<3;repeat++){
  const start=stderr.length,result=await new Promise((resolve,reject)=>{const socket=new WebSocket(String(url).replace('http:','ws:')),timer=setTimeout(()=>{socket.close();reject(Error('Close timeout '+mode+'/'+scenario));},5000);socket.onopen=()=>{socket.send(scenario==='inflight'?'later':'hello');if(scenario==='inflight')socket.close(1000);};socket.onmessage=()=>scenario==='server'?socket.send('finish'):scenario==='empty-code'?socket.close():socket.close(1000);socket.onerror=()=>{clearTimeout(timer);reject(Error('Socket failed '+mode+'/'+scenario));};socket.onclose=e=>{clearTimeout(timer);resolve({code:e.code,clean:e.wasClean});};});
  await new Promise(r=>setTimeout(r,120));const runtimeErrors=stderr.slice(start);results.push({mode,scenario,repeat,...result,hangingRequests:(runtimeErrors.match(/Worker.s code had hung/g)??[]).length,runtimeErrors});
 }}finally{const before=stderr.length;await mf.dispose();await new Promise(r=>setTimeout(r,100));const extra=stderr.slice(before);if(extra)results.push({mode,scenario:'dispose',hangingRequests:(extra.match(/Worker.s code had hung/g)??[]).length,runtimeErrors:extra});}
}
const summary=['automatic','half-open','legacy-manual'].map(mode=>({mode,cases:results.filter(r=>r.mode===mode&&r.scenario!=='dispose').length,hangingRequests:results.filter(r=>r.mode===mode).reduce((n,r)=>n+r.hangingRequests,0),unclean:results.filter(r=>r.mode===mode&&r.clean===false).length}));
fs.writeFileSync(process.env.REALTIME_HALF_OPEN_REPORT??'outputs/qa/realtime-half-open.json',JSON.stringify({binary:process.env.MINIFLARE_WORKERD_PATH??'installed workerd',installedVersion:JSON.parse(fs.readFileSync('node_modules/workerd/package.json','utf8')).version,summary,results,scope:'Isolated local workerd WebSocketPair diagnostic; no Party Olymp, D1, framework or authentication.'},null,2));console.log(JSON.stringify(summary));
if(process.env.REALTIME_EXPECT_BASELINE_FAULT==='1')assert.ok(summary.find(r=>r.mode==='automatic').hangingRequests>0,'Baseline must reproduce the observed runtime fault');else for(const row of summary){assert.equal(row.hangingRequests,0,row.mode);assert.equal(row.unclean,0,row.mode);}
