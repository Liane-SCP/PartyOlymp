import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const base=process.env.QA_BASE??'http://127.0.0.1:5173',root=path.resolve('dist/client'),results=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
try{
 const htmlResponse=await fetch(base,{signal:AbortSignal.timeout(15000)});assert.equal(htmlResponse.status,200);const html=await htmlResponse.text();
 const initial=[...new Set([...html.matchAll(/(?:href|src)="([^\"]+\.(?:js|css)(?:\?[^\"]*)?)"/g)].map(m=>m[1]))];assert.ok(initial.some(p=>p.includes('.css'))&&initial.some(p=>p.includes('.js')),'Initial CSS and JS references are required');
 const paths=[...initial,'/favicon.svg','/adventure-models/furniture/chairCushion.glb','/adventure-models/props/auction-gavel.glb'];
 for(const source of paths){
  const url=new URL(source,base);assert.equal(url.origin,new URL(base).origin);const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));assert.ok(file.startsWith(root+path.sep),'Asset must stay inside client build');
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)}),bytes=Buffer.from(await response.arrayBuffer()),contentType=response.headers.get('content-type'),disk=fs.readFileSync(file),entry={path:url.pathname,status:response.status,contentType,bytes:bytes.length,sha256:sha(bytes),matchesBuild:sha(bytes)===sha(disk)};results.push(entry);
  assert.equal(response.status,200,url.pathname);assert.ok(bytes.length>0,url.pathname);assert.equal(entry.matchesBuild,true,url.pathname);
  if(url.pathname.endsWith('.css'))assert.match(contentType??'',/text\/css/);if(url.pathname.endsWith('.js'))assert.match(contentType??'',/(?:java|ecma)script/);
 }
 const versions=Object.fromEntries(['workerd','wrangler','@cloudflare/vite-plugin'].map(name=>[name,JSON.parse(fs.readFileSync('node_modules/'+name+'/package.json','utf8')).version]));
 fs.writeFileSync(process.env.RUNTIME_ASSET_REPORT??'outputs/qa/realtime-sdk-assets.json',JSON.stringify({passed:true,versions,serverBinaryOverride:process.env.QA_SERVER_BINARY??null,versionScope:'Installed project package versions; separately launched server binary overrides are recorded explicitly.',results,scope:'Actual local HTTP delivery of initial self-hosted CSS/JS and selected binary models; exact SHA-256 comparison with client build. No browser rendering, physical device or hosted edge acceptance.'},null,2));console.log(`PASS ${results.length} runtime assets: HTTP 200, expected MIME types and exact build bytes`);
}catch(e){fs.writeFileSync('outputs/qa/realtime-sdk-assets-failure.json',JSON.stringify({passed:false,error:e.message,results},null,2));throw e;}
