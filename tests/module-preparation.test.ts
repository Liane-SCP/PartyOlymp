import test from 'node:test';import assert from 'node:assert/strict';import {createModuleLoader} from '../lib/module-preparation';

test('Preparation and scene construction share one in-flight import and the same exports',async()=>{
 let calls=0,resolve!:(value:{factory:()=>void})=>void;const load=createModuleLoader(()=>{calls++;return new Promise<{factory:()=>void}>(r=>resolve=r);});
 const preparation=load(),scene=load();assert.equal(preparation,scene);await Promise.resolve();assert.equal(calls,1);let built=0;const exports={factory:()=>{built++;}};resolve(exports);assert.equal(await preparation,exports);assert.equal(await scene,exports);assert.equal(built,0,'Loading module definitions must not construct a scene');assert.equal(await load(),exports);exports.factory();assert.equal(built,1);assert.equal(calls,1);
});
test('An unsuccessful preparation releases its failed promise so scene entry can retry',async()=>{
 let calls=0;const value={ready:true},load=createModuleLoader(async()=>{if(++calls===1)throw Error('temporary import failure');return value;});await assert.rejects(load(),/temporary/);assert.equal(await load(),value);assert.equal(await load(),value);assert.equal(calls,2);
});
