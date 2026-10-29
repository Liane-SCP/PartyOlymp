import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {ScenePreloader,nextSceneTarget} from '../lib/scene-preload';import {scenePreloadAssets} from '../lib/scene-preload-assets';
const asset=(path:string,bytes=4)=>({path:`/adventure-models/props/${path}.glb`,bytes});
test('All 21 plans bind to actual local model bytes and remain under the one-scene budget',()=>{
 assert.equal(Object.keys(scenePreloadAssets).length,21);for(const rows of Object.values(scenePreloadAssets)){assert.ok(rows.length>0);assert.ok(rows.reduce((n,r)=>n+r.bytes,0)<=24*1024*1024);for(const row of rows)assert.equal(fs.statSync('public'+row.path).size,row.bytes);}
 for(const phase of['lobby','wheel','podium'])assert.equal(nextSceneTarget({phase,index:0,selection:[{id:'dice'}]}),null);
 const room={code:'A',index:0,selection:[{id:'dice'},{id:'budget'}]};for(const phase of['rules','countdown','playing'])assert.equal(nextSceneTarget({...room,phase})?.id,'dice');for(const phase of['reveal','standings','paused'])assert.equal(nextSceneTarget({...room,phase})?.id,'budget');assert.equal(nextSceneTarget({...room,index:1,phase:'standings'}),null);
});
test('Two workers deduplicate and budget bytes; consuming transfers ownership out of the cache',async()=>{
 let active=0,max=0,calls=0;const pre=new ScenePreloader((async()=>{calls++;max=Math.max(max,++active);await new Promise(r=>setTimeout(r,5));active--;return new Response(new Uint8Array(4));}) as typeof fetch,12);
 await pre.start({key:'a',id:'dice',assets:[asset('a'),asset('a'),asset('b'),asset('c'),asset('too-big',30),{path:'/api/room',bytes:1}]});assert.equal(calls,3);assert.equal(max,2);assert.equal(pre.stats().bytes,12);assert.equal(pre.take(asset('a').path)?.byteLength,4);assert.equal(pre.stats().bytes,8);assert.equal(pre.take(asset('a').path),undefined);pre.stop();assert.equal(pre.stats().bytes,0);
});
test('Changed targets and stopped requests cannot retain late old bytes; pause preserves ready handoff',async()=>{
 const resolvers:Array<(r:Response)=>void>=[];const pre=new ScenePreloader((()=>new Promise(r=>resolvers.push(r))) as typeof fetch);
 const old=pre.start({key:'old',id:'dice',assets:[asset('old')]});const next=pre.start({key:'next',id:'budget',assets:[asset('next')]});resolvers[0](new Response(new Uint8Array(4)));await old;assert.equal(pre.stats().files,0);resolvers[1](new Response(new Uint8Array(4)));await next;pre.pause();assert.equal(pre.take(asset('next').path)?.byteLength,4);assert.equal(pre.take(asset('old').path),undefined);
 const stopped=pre.start({key:'stop',id:'dice',assets:[asset('stop')]});pre.stop();resolvers[2](new Response(new Uint8Array(4)));await stopped;assert.equal(pre.stats().files,0);
});
test('Network failures and changed sizes leave the normal scene loader free to fetch',async()=>{
 let n=0;const pre=new ScenePreloader((async()=>{n++;if(n===1)throw Error('offline');return new Response(new Uint8Array(8));}) as typeof fetch);await pre.start({key:'a',id:'dice',assets:[asset('a'),asset('b')]});assert.equal(pre.stats().failed,2);assert.equal(pre.stats().bytes,0);assert.equal(pre.take(asset('a').path),undefined);
});
test('An early scene start joins in-flight requests and cancels speculative queued work',async()=>{
 const resolvers:Array<(r:Response)=>void>=[];let calls=0;const pre=new ScenePreloader((()=>{calls++;return new Promise(r=>resolvers.push(r));}) as typeof fetch);
 const pending=pre.start({key:'a',id:'dice',assets:[asset('a'),asset('b'),asset('unused')]});pre.pause();const demanded=pre.read(asset('a').path);resolvers[0](new Response(new Uint8Array(4)));resolvers[1](new Response(new Uint8Array(4)));assert.equal((await demanded)?.byteLength,4);await pending;assert.equal(calls,2);assert.equal(pre.take(asset('a').path),undefined);assert.equal(pre.stats().files,1);pre.stop();
});
