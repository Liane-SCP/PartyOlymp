import {sizeComparison,measureAxis,sizeModelKey} from "../lib/size-presentation";
import {createSizeModelLibrary} from "../components/olymp/size-model-library";
import {locationKit} from "../components/olymp/location-kit";
import {globePoint,globeLocation,globeRoute} from "../lib/globe-math";
﻿import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {adventureThemes,adventureProgress,adventureEventKey} from "../lib/adventure";
import {createAdventureScene} from "../components/olymp/adventure-scene";
import {AdventureQuality,qualityProfiles} from "../lib/adventure-quality";
import {shopPath,shopWalkable} from "../lib/shop-navigation";
import {raceFinishes,raceFinishTitle} from "../lib/race-presentation";
import {bomb} from "../lib/game/games/bomb";
import {herdGroupCenter,herdMemberPosition} from "../lib/herd-layout";
const crew=[{id:"a",name:"Nova",color:"#b5d69d",avatar:0},{id:"b",name:"Luna",color:"#b5a5dc",avatar:7}];
test("Scene profiles produce finite geometry and preserve boss-style crew identities",()=>{
  const mechanics=new Set<string>();
  for(const id of Object.keys(adventureThemes) as (keyof typeof adventureThemes)[]){if(["colossus","kraken","dragon"].includes(id))continue;
    const world=createAdventureScene(T,id,crew,"a");mechanics.add(world.theme.mechanic);
    world.update(1,1000,{id,stage:"answer",mine:{},categories:["A"],target:id==="color"?[100,150,200]:undefined}, {}, false);world.scene.updateMatrixWorld(true);
    world.scene.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite),`${id}: invalid geometry`);});
    assert.equal(world.actors.length,2);assert.ok(world.actors.every(a=>a.root.userData.avatarStyle==="boss-sprite"));const locations:Record<string,string>={dice:'dice-salon',size:'size-measurement-museum',geo:'geo-expedition-base',picture:'picture-reveal-studio',color:'color-neutral-laboratory',code:'code-mechanical-vault',auction:'auction-theatre',timing:'timing-still-observatory',bomb:'bomb-inventors-workshop',chain:'chain-jungle-expedition',categories:'categories-ideas-atelier',herd:'herd-thoughts-picnic-park',spectrum:'spectrum-measuring-station',wiki:'wiki-linked-library'};assert.ok(world.scene.getObjectByName(locations[id]??`adventure-${world.theme.mechanic}`)!.children.length>0);world.dispose();
  }assert.equal(mechanics.size,21);
});
test("Race vehicles follow confirmed shared progress and held dice remain stable during a new roll",()=>{
  const race=createAdventureScene(T,"typer",crew,"a");race.update(1,1000,{id:"typer",text:"1234567890",racers:{a:{progress:5},b:{progress:10}}});
  assert.equal(race.objects[0].userData.progress,.5);assert.equal(race.objects[1].userData.progress,1);assert.ok(race.objects[0].position.distanceTo(race.objects[1].position)>5);const end=race.objects[1].position.clone();race.update(2,2000,{id:"typer",text:"1234567890",racers:{a:{progress:5},b:{progress:10}}});assert.ok(race.objects[1].position.distanceTo(end)<.001);race.dispose();
  const dice=createAdventureScene(T,"dice",crew,"a"),game={id:"dice",mine:{dice:[1,2,3,4,5],held:[true,false,false,false,false],rolls:1,rollId:1,rollStartedAt:1000}};
  dice.update(1,1000,game);const cubes=dice.scene.getObjectByName('public-crew-dice') as T.InstancedMesh,heldBefore=new T.Matrix4(),otherBefore=new T.Matrix4();cubes.getMatrixAt(0,heldBefore);cubes.getMatrixAt(1,otherBefore);game.mine.rollId=2;game.mine.rollStartedAt=2000;dice.update(2,2000,game);dice.update(2.2,2200,game);
  const heldAfter=new T.Matrix4(),otherAfter=new T.Matrix4();cubes.getMatrixAt(0,heldAfter);cubes.getMatrixAt(1,otherAfter);assert.deepEqual(heldAfter.toArray(),heldBefore.toArray());assert.notDeepEqual(otherAfter.toArray(),otherBefore.toArray());dice.dispose();
});
test("Shop routes avoid shelves and reach all departments from the crew entrance",()=>{
 for(const goal of [{x:-7.8,z:0},{x:0,z:0},{x:7.8,z:0},{x:6.8,z:7.8}]){const path=shopPath({x:-5.8,z:7.5},goal);assert.ok(path.length>0);assert.ok(path.every(shopWalkable));assert.ok(Math.hypot(path.at(-1)!.x-goal.x,path.at(-1)!.z-goal.z)<.4);for(let i=1;i<path.length;i++)assert.ok(Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z)<=.501);}
});
test("Automatic graphics react to sustained load while manual choice remains authoritative",()=>{
 const q=new AdventureQuality(false);assert.equal(q.choose('auto'),'high');assert.equal(qualityProfiles.high.fps,60);
 for(let i=0;i<180;i++)q.sample(40,24,'auto');assert.equal(q.choose('auto'),'medium');assert.equal(q.choose('high'),'high');
 for(let i=0;i<180;i++)q.sample(80,45,'high');assert.equal(q.choose('auto'),'medium');
 for(let i=0;i<180;i++)q.sample(60,35,'auto');assert.equal(q.choose('auto'),'low');assert.equal(qualityProfiles.low.fps,30);
 const paused=new AdventureQuality(false);for(let i=0;i<500;i++)paused.sample(1000,1,'auto');assert.equal(paused.choose('auto'),'high');
});
test("Race finish presentation uses confirmed timestamps and shares tied places",()=>{
 const game={stage:'answer',racers:{a:{progress:100,finishedAt:null},b:{finishedAt:200,finishedWpm:64},c:{finishedAt:200,finishedWpm:64},d:{finishedAt:300,finishedWpm:50}}};
 assert.deepEqual(raceFinishes(game).map(p=>[p.id,p.place]),[['b',1],['c',1],['d',3]]);assert.match(raceFinishTitle(game,[]),/GEMEINSAM/);assert.equal(raceFinishTitle({stage:'done',racers:{a:{finishedAt:null}}},[]),'RENNEN BEENDET');
});
test("A secret clock never drives scene events or a player's public completion",()=>{
  const a={id:"timing",round:1,stage:"answer",deadline:1000,mine:{startedAt:0}},b={...a,deadline:2000};assert.equal(adventureEventKey(a),adventureEventKey(b));assert.equal(adventureProgress(a,"b","a"),0);
});
test("Casino never renders a hidden dealer face and reveals confirmed cards in order",()=>{
 const world=createAdventureScene(T,'blackjack',crew,'a'),game:any={id:'blackjack',round:0,stage:'answer',mine:{hand:[{rank:7,suit:0},{rank:5,suit:2}],bet:50},dealer:[{rank:8,suit:1}],status:{}};
 world.update(1,1000,game);const back=world.scene.getObjectByName('card-41')!;assert.equal(back.visible,true);assert.equal(back.userData.hidden,true);assert.equal(world.scene.getObjectByName('card-value-41')!.userData.text,'✦');
 game.stage='roundReveal';game.revealStartedAt=2000;game.dealer.push({rank:9,suit:2});world.update(2,2000,game);assert.equal(back.visible,true);assert.equal(back.userData.hidden,true);world.update(3.6,3600,game);assert.equal(back.visible,true);assert.equal(back.userData.hidden,false);assert.equal(world.scene.getObjectByName('card-value-41')!.userData.text,'9 ♦');world.dispose();
});
test("Secret bomb deadlines do not alter the public view or warn about remaining fuse time",()=>{
 const game:any={id:'bomb',stage:'word',round:0,totalRounds:1,deadline:Date.now()+60000,public:{turnId:'a',turn:1,fragment:'HA',history:[]},secret:{explodesAt:Date.now()+60000},players:{a:{alive:true,words:0,ballot:null}},scores:{a:0},events:[]};
 const far=bomb.view(game,'a',false);game.deadline=Date.now()+1000;game.secret.explodesAt=game.deadline;const near=bomb.view(game,'a',false);assert.deepEqual(near,far);assert.equal(near.deadline,0);assert.equal(near.urgent,undefined);
});
test("Only accepted expedition answers add physical bridge segments",()=>{
 const world=createAdventureScene(T,'chain',crew,'a'),game:any={id:'chain',stage:'review',mine:{},turnId:'a',history:[],candidate:{answer:'Prüfung'},roster:{a:{alive:true},b:{alive:true}}};
 const bridge=world.scene.getObjectByName('accepted-word-bridge') as T.InstancedMesh;world.update(1,1000,game);assert.equal(bridge.count,0);game.history.push({answer:'Falsch',valid:false});world.update(2,2000,game);assert.equal(bridge.count,0);game.history.push({answer:'Bestätigt',valid:true});world.update(3,3000,game);assert.equal(bridge.count,1);world.dispose();
});
test("Hivemind preserves identities and separates twelve individual or shared thoughts",()=>{
 const ids=Array.from({length:12},(_,i)=>String(i));for(const groups of [ids.map(id=>({ids:[id]})),[{ids}], [{ids:ids.slice(0,6)},{ids:ids.slice(6)}]]){const points=ids.map(id=>herdMemberPosition(groups,id)!);assert.ok(points.every(p=>Number.isFinite(p.x)&&Math.abs(p.x)<15&&Number.isFinite(p.z)&&Math.abs(p.z)<10));for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)assert.ok(Math.hypot(points[i].x-points[j].x,points[i].z-points[j].z)>1.1);}
 assert.equal(herdMemberPosition([{ids:['a']}],'hidden'),null);assert.deepEqual(herdGroupCenter(0,1),{x:0,z:0});
});
test("Spectrum shows target geometry only when the server view authorizes it",()=>{
 const world=createAdventureScene(T,'spectrum',crew,'b'),game:any={id:'spectrum',stage:'guess',psychic:'a',mine:{dial:60},axis:{left:'A',right:'B'},clue:'Test'};
 world.update(1,1000,game,{spectrum:60});const target=world.scene.getObjectByName('private-spectrum-target')!;assert.equal(target.visible,false);
 game.stage='roundReveal';game.target=42;game.reveal={players:[{id:'b',guess:60}]};world.update(2,2000,game);assert.equal(target.visible,false,'A stale private target cannot substitute for the public reveal');
 game.reveal.target=42;world.update(2,2000,game);assert.equal(target.visible,true);assert.ok(Math.abs(target.position.x-(-8+42*.16))<.001);delete game.target;delete game.reveal;game.stage='clue';world.update(3,3000,game);assert.equal(target.visible,false);world.dispose();
});

test("Color samples bypass lighting and tone mapping, and conceal a stale preview immediately",()=>{
 const world=createAdventureScene(T,'color',crew,'a'),game:any={id:'color',stage:'answer',previewUntil:2000,target:[25,120,229],mine:{},submitted:{}};
 world.update(1,1000,game,{rgb:[70,150,210]});const target=world.scene.getObjectByName('target-neutral-color') as T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>,own=world.scene.getObjectByName('own-neutral-color') as T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
 assert.equal(target.visible,true);assert.equal(own.visible,false);assert.ok(target.material instanceof T.MeshBasicMaterial);assert.equal(target.material.toneMapped,false);assert.equal(own.material.toneMapped,false);
 const srgb=target.material.color.clone().getRGB(new T.Color(),T.SRGBColorSpace);assert.ok(Math.abs(srgb.r*255-25)<.01&&Math.abs(srgb.b*255-229)<.01);
 world.update(2,2100,game,{rgb:[70,150,210]});assert.equal(target.visible,false);assert.equal(own.visible,true);assert.equal(world.pickables.find(o=>o.userData.pick==='colorScale:0')!.userData.pickDisabled,false);
 game.mine={submitted:true,answer:[70,150,210]};world.update(3,3000,game,{rgb:[0,0,0]});assert.equal(world.pickables.find(o=>o.userData.pick==='colorScale:0')!.userData.pickDisabled,true);assert.deepEqual(world.scene.getObjectByName('color-neutral-laboratory')!.userData.rgb,[70,150,210]);
 game.stage='roundReveal';game.reveal={target:[25,120,229]};world.update(4,4000,game);assert.equal(target.visible,true);assert.equal(own.visible,false,'Missing public results must not reuse a private draft');
 game.reveal.players=[{id:'a',estimate:[70,150,210],score:90}];world.update(4,4000,game);assert.equal(own.visible,true);world.dispose();
});

test("Studio exposes only the local buzzer and follows the authoritative lock and reset",()=>{
 const world=createAdventureScene(T,'picture',crew,'a'),game:any={id:'picture',stage:'answer',mine:{},guesses:{},buzzer:null};
 assert.equal(world.pickables.length,1);world.update(1,1000,game);assert.equal(world.pickables[0].userData.pickDisabled,false);game.buzzer='b';world.update(2,2000,game);assert.equal(world.pickables[0].userData.pickDisabled,true);
 game.buzzer=null;game.mine.buzzedOut=true;world.update(3,3000,game);assert.equal(world.pickables[0].userData.pickDisabled,true);game.mine={};world.update(4,4000,game);assert.equal(world.pickables[0].userData.pickDisabled,false);game.stage='roundReveal';world.update(5,5000,game);assert.equal(world.pickables[0].userData.pickDisabled,true);world.dispose();
});

test("Globe coordinates match texture orientation and routes remain stable at the date line and antipodes",()=>{
 for(const pin of[{lat:0,lon:0},{lat:48.85,lon:2.35},{lat:-33.87,lon:151.21},{lat:89.9,lon:-179.9}]){const q=globeLocation(globePoint(pin,3.3));assert.ok(Math.abs(q.lat-pin.lat)<1e-8&&Math.abs(q.lon-pin.lon)<1e-8);}
 assert.deepEqual(globePoint({lat:0,lon:0}),{x:1,y:0,z:-0});
 for(const [a,b] of [[{lat:0,lon:0},{lat:0,lon:180}],[{lat:20,lon:179},{lat:20,lon:-179}],[{lat:90,lon:0},{lat:90,lon:0}]])for(let j=0;j<=36;j++){const q=globeRoute(a,b,j/36,3.56);assert.ok(Object.values(q).every(Number.isFinite));assert.ok(Math.abs(Math.hypot(q.x,q.y,q.z)-3.56)<1e-7);}
});

test("Expedition shows private and published pins in separate phases and clears old routes",()=>{
 const world=createAdventureScene(T,'geo',crew,'a'),game:any={id:'geo',round:1,stage:'answer',mine:{},image:''};world.update(1,1000,game,{pin:{lat:30,lon:40}});const root=world.scene.getObjectByName('geo-expedition-base')!,target=world.scene.getObjectByName('revealed-world-destination')!;assert.equal(target.visible,false);assert.equal(root.userData.revealCount,0);
 game.stage='roundReveal';game.reveal={place:{lat:0,lon:0,name:'Ziel'},players:[{id:'a',guess:{lat:30,lon:40},distance:100},{id:'b',guess:{lat:-30,lon:179},distance:200}]};world.update(2,2000,game,{},true);assert.equal(target.visible,true);assert.equal(root.userData.revealCount,2);assert.equal(world.scene.getObjectByName('public-great-circle-0')!.visible,true);
 game.round=2;game.stage='answer';delete game.reveal;world.update(3,3000,game,{});assert.equal(target.visible,false);assert.equal(root.userData.revealCount,0);assert.equal(world.scene.getObjectByName('public-great-circle-0')!.visible,false);world.dispose();
});

test("Museum keeps exact ratios across tiny and very large estimates and selects the requested measurement axis",()=>{
 for(const [reference,guess,actual]of[[2.575,.96,8.56],[605.8,1e8,1],[33000,.37,4219500]]){const c=sizeComparison(reference,guess,actual);assert.ok(c.spans.every(Number.isFinite));assert.ok(Math.abs(c.spans[1]/c.spans[0]-guess/reference)<1e-6);assert.ok(Math.abs(Math.max(...c.spans)-6.4)<1e-7);}
 assert.equal(measureAxis('Höhe mit Antenne'),'y');assert.equal(measureAxis('Spannweite'),'x');assert.equal(sizeModelKey('Fußballtor'),'goal');assert.equal(sizeModelKey('Kreditkarte'),'card');assert.equal(sizeModelKey('Ein Schiff','ship'),'ship');
 const world=createAdventureScene(T,'size',crew,'a'),game:any={id:'size',round:1,stage:'answer',item:{name:'Container',measure:'Außenlänge'},reference:{name:'Kreditkarte',cm:8.56},mine:{}};world.update(1,1000,game,{size:17.12});const root=world.scene.getObjectByName('size-measurement-museum')!;assert.equal(root.userData.comparison.actual,null);assert.equal(world.scene.getObjectByName('revealed-measurement-model')!.visible,false);assert.ok(Math.abs(root.userData.comparison.spans[1]/root.userData.comparison.spans[0]-2)<1e-9);
 game.stage='roundReveal';game.reveal={item:{cm:605.8}};world.update(2,2000,game,{size:17.12});assert.equal(root.userData.comparison.actual,605.8);assert.equal(world.scene.getObjectByName('revealed-measurement-model')!.visible,true);game.round=2;game.stage='answer';game.item={name:'Giraffe',measure:'Höhe'};delete game.reveal;world.update(3,3000,game,{size:10});assert.equal(root.userData.comparison.axis,'y');assert.equal(root.userData.comparison.actual,null);assert.equal(world.scene.getObjectByName('revealed-measurement-model')!.visible,false);world.dispose();
});

test("Measured features exclude studs, the goal frame and the basketball backboard",()=>{
 const k=locationKit(new T.Scene(),'measurement-anchor-test'),library=createSizeModelLibrary(k);
 for(const [name,measure]of[['Fußballtor','innere Höhe'],['Basketballkorb','Ringhöhe'],['LEGO-Stein','Höhe ohne Noppen']]){const model=library.get(name,'','y',measure);model.updateMatrixWorld(true);const a=new T.Vector3().fromArray(model.userData.measureFrom),b=new T.Vector3().fromArray(model.userData.measureTo);model.localToWorld(a);model.localToWorld(b);assert.ok(Math.abs(a.distanceTo(b)-1)<1e-8);assert.ok(new T.Box3().setFromObject(model).getSize(new T.Vector3()).y>1.05,`${name}: decorative geometry should extend beyond the measured feature`);}
 k.dispose();
});
