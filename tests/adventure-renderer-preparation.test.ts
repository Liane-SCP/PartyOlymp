import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {qualityProfiles} from '../lib/adventure-quality';import {configureAdventureRenderer,prepareAdventureRenderer} from '../components/olymp/adventure-renderer-preparation';

test('The selected profile configures shadows and pixel ratio before compilation',()=>{
 for(const tier of['high','medium','low'] as const){const scene=new T.Scene(),light=new T.DirectionalLight();light.castShadow=true;let disposed=0;const old=new T.WebGLRenderTarget(4,4);old.addEventListener('dispose',()=>disposed++);light.shadow.map=old;scene.add(light);const material=new T.MeshStandardMaterial(),mesh=new T.Mesh(new T.BoxGeometry(),material);scene.add(mesh);let ratio=0;const renderer={shadowMap:{enabled:true},setPixelRatio:(value:number)=>{ratio=value;}} as unknown as T.WebGLRenderer;
  configureAdventureRenderer(T,renderer,scene,qualityProfiles[tier],2);assert.equal(renderer.shadowMap.enabled,qualityProfiles[tier].shadows);assert.equal(ratio,qualityProfiles[tier].dpr);assert.equal(light.shadow.mapSize.x,qualityProfiles[tier].shadowSize);assert.equal(light.shadow.map,null);assert.equal(disposed,1);assert.equal(material.version,1);mesh.geometry.dispose();material.dispose();}
});
test('Warm draw uses the actual scene and canvas without switching output targets',async()=>{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(),events:string[]=[];
 const renderer={compileAsync:async(s:T.Scene,c:T.Camera)=>{assert.equal(s,scene);assert.equal(c,camera);events.push('compile');},setRenderTarget:()=>{throw Error('A separate target changes the output shader variant');},render:(s:T.Scene,c:T.Camera)=>{assert.equal(s,scene);assert.equal(c,camera);events.push('draw');}} as unknown as T.WebGLRenderer;
 assert.equal(await prepareAdventureRenderer(T,renderer,scene,camera,()=>false),true);assert.deepEqual(events,['compile','draw']);
});
test('Warm-render failure propagates to the scene owner without allocating another target',async()=>{
 const renderer={compileAsync:async()=>{},setRenderTarget:()=>{throw Error('Must retain the canvas target');},render:()=>{throw Error('context lost');}} as unknown as T.WebGLRenderer;
 await assert.rejects(prepareAdventureRenderer(T,renderer,new T.Scene(),new T.PerspectiveCamera(),()=>false),/context lost/);
});
test('A scene removed while compiling never draws into its disposed renderer',async()=>{
 let draws=0;const renderer={compileAsync:async()=>{},render:()=>{draws++;},getRenderTarget:()=>{throw Error('Must not allocate a target after cancellation');}} as unknown as T.WebGLRenderer;
 assert.equal(await prepareAdventureRenderer(T,renderer,new T.Scene(),new T.PerspectiveCamera(),()=>true),false);assert.equal(draws,0);
});
