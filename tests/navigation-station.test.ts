import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {geoCrewSeat,geoCrewCards,geoFlightFrame} from '../lib/geo-presentation';import {createAdventureScene} from '../components/olymp/adventure-scene';
const crew=(n:number)=>Array.from({length:n},(_,i)=>({id:`p${i}`,name:`Crew ${i}`,color:'#aacbbc'}));
const game=(n=12):any=>({id:'geo',round:1,stage:'answer',mine:{submitted:false,answer:null},submitted:Object.fromEntries(crew(n).map(p=>[p.id,false])),image:''});

test('Every 2–12 crew layout is centered and keeps the real chart desks clear of the precise map and confirmation controls',()=>{
 for(let n=2;n<=12;n++){const points=Array.from({length:n},(_,i)=>geoCrewSeat(i,n));for(const z of new Set(points.map(p=>p[2]))){const row=points.filter(p=>p[2]===z);assert.ok(Math.abs(row.reduce((s,p)=>s+p[0],0))<1e-8);for(let i=1;i<row.length;i++)assert.ok(row[i][0]-row[i-1][0]>=3.8-1e-8);}for(const p of points){assert.ok(p[2]-.65-.55>4.6);assert.ok(Math.abs(p[0])+1.3<14);assert.ok(p[2]+.6<11);}}
});

test('Crew chart states never read foreign answers and publish distances only with the actual result',()=>{
 const g=game(2);g.submitted.p1=true;g.players={p1:{answer:{lat:12.345678,lon:98.765432},secret:'NEVER-READ'}};g.secret={place:{name:'Hidden place'}};const before=geoCrewCards(g,crew(2));assert.ok(!JSON.stringify(before).includes('12.345678'));assert.ok(!JSON.stringify(before).includes('Hidden'));assert.match(before[0].text,/ORT WÄHLEN/);assert.match(before[1].text,/VERSIEGELT/);g.stage='roundReveal';g.reveal={players:[{id:'p0',guess:{lat:0,lon:0},distance:1234.4},{id:'p1',guess:null,distance:null}]};const after=geoCrewCards(g,crew(2));assert.match(after[0].text,/1234 KM/);assert.match(after[1].text,/OHNE TIPP/);
});

test('All crew desk states share one map and mesh and release their own resources exactly once',()=>{
 const world=createAdventureScene(T,'geo',crew(12),'p0'),g=game();world.update(0,1000,g);const mesh=world.scene.getObjectByName('crew-navigation-status-cards') as T.Mesh,material=mesh.material as T.MeshBasicMaterial;assert.equal(mesh.geometry.index!.count,12*6);const disposed={geometry:0,material:0,texture:0};mesh.geometry.addEventListener('dispose',()=>disposed.geometry++);material.addEventListener('dispose',()=>disposed.material++);material.map!.addEventListener('dispose',()=>disposed.texture++);g.submitted.p1=true;world.update(1,1100,g);assert.equal(world.scene.getObjectByName('crew-navigation-status-cards'),mesh);assert.equal(mesh.userData.cards[1].sealed,true);world.dispose();assert.deepEqual(disposed,{geometry:1,material:1,texture:1});
});

test('Flight progress derives from published milliseconds and settles legacy, late and reduced views',()=>{
 const g={stage:'roundReveal',revealStartedAt:1000,mine:{answer:{lat:30,lon:179}},reveal:{place:{lat:-10,lon:-179}}};assert.deepEqual(geoFlightFrame(g,1500),{progress:.25,visible:true});assert.deepEqual(geoFlightFrame(g,3000),{progress:1,visible:false});assert.equal(geoFlightFrame({...g,revealStartedAt:undefined},1500).visible,false);assert.equal(geoFlightFrame(g,1500,true).visible,false);assert.equal(geoFlightFrame({...g,stage:'answer'},1500).visible,false);
});

test('A fresh world seeks exactly the same flight and unsubmitted drafts never become a result flight',()=>{
 const a=createAdventureScene(T,'geo',crew(2),'p0'),b=createAdventureScene(T,'geo',crew(2),'p0'),g=game(2);g.stage='roundReveal';g.revealStartedAt=1000;g.mine={submitted:true,answer:{lat:30,lon:179}};g.reveal={place:{lat:-10,lon:-179},players:[{id:'p0',guess:g.mine.answer,distance:1234}]};a.update(0,1500,g);b.update(100,1500,g);const rootA=a.scene.getObjectByName('geo-expedition-base')!,rootB=b.scene.getObjectByName('geo-expedition-base')!;assert.deepEqual(rootA.userData.flight,rootB.userData.flight);assert.equal(rootA.userData.flight.visible,true);a.update(1,4000,g);assert.equal(rootA.userData.flight.visible,false);b.update(1,1500,g,{},true);assert.equal(rootB.userData.flight.visible,false);
 g.mine={submitted:false,answer:null};a.update(2,1500,g,{pin:{lat:12,lon:34}});assert.equal(rootA.userData.flight.visible,false);assert.equal(rootA.userData.pin,null);a.dispose();b.dispose();
});

test('New workstations and room structure leave every crew face and all four original 3D actions clear',()=>{
 for(const n of[2,8,12]){const world=createAdventureScene(T,'geo',crew(n),'p0'),g=game(n);world.update(0,1000,g);world.scene.updateMatrixWorld(true);const props=world.scene.getObjectByName('expedition-provisions')!;for(const aspect of[.5,1.1,1.8]){const d=aspect<.8?46:aspect<1.25?38:31,origin=new T.Vector3(Math.sin(.05)*d,2.5+Math.sin(.42)*d,Math.cos(.05)*Math.cos(.42)*d),targets=[...world.actors.map(a=>a.root.position.clone().add(new T.Vector3(0,.8,0))),new T.Vector3(-5,4.1,3.3),new T.Vector3(5.2,5.2,-4.37),new T.Vector3(5,1.32,3.1),new T.Vector3(0,1.27,3)];for(const target of targets){const ray=new T.Raycaster(origin,target.clone().sub(origin).normalize(),0,origin.distanceTo(target)-.02);assert.equal(ray.intersectObject(props,true).length,0,`${n}/${aspect}/${target.toArray()}`);}}world.dispose();}
});
test('Hidden renderer preparation restores every reveal object without publishing a target',()=>{
 const world=createAdventureScene(T,'geo',crew(2),'p0'),root=world.scene.getObjectByName('geo-expedition-base')!;
 const objects=world.scene.getObjectByName('geographic-globe')!.children.filter(o=>/^(revealed-world-|public-great-circle-|world-reveal-flight)/.test(o.name));
 assert.equal(objects.length,6);assert.ok(objects.every(o=>!o.visible));
 const restore=world.prepareVariants();assert.ok(objects.every(o=>o.visible));restore();assert.ok(objects.every(o=>!o.visible));
 assert.equal(world.scene.getObjectByName('geo-highlighted-crew-desk')!.visible,false);
 assert.equal(root.userData.targetVisible,undefined);assert.equal(root.userData.revealCount,undefined);
 world.dispose();
});
test('Only an existing published guess with the current result key can be inspected',async()=>{
 const {geoResultKey,geoResultSelection}=await import('../lib/geo-presentation'),g=game(2),people=crew(2);
 g.players={p0:{answer:{lat:20,lon:30}}};g.reveal={place:{lat:0,lon:180},players:[{id:'p0',guess:{lat:0,lon:0},distance:20000},{id:'p1',guess:null,distance:null}]};g.revealStartedAt=1000;
 assert.equal(geoResultKey(g),null);assert.equal(geoResultSelection(g,people,{geoHighlight:{key:null,player:'p0'}}),null);
 g.stage='roundReveal';const key=geoResultKey(g);assert.ok(key);assert.equal(geoResultSelection(g,people,{geoHighlight:{key,player:'p0'}})?.index,0);
 for(const player of ['p1','unknown'])assert.equal(geoResultSelection(g,people,{geoHighlight:{key,player}}),null);
 assert.equal(geoResultSelection(g,people,{geoHighlight:{key:'old',player:'p0'}}),null);g.round++;assert.equal(geoResultSelection(g,people,{geoHighlight:{key,player:'p0'}}),null);
});

test('Map selection highlights the same public route, marker, crew desk and original actor without creating objects',async()=>{
 const {geoResultKey}=await import('../lib/geo-presentation'),{globeRoute}=await import('../lib/globe-math');
 for(const n of [2,8,12]){
  const people=crew(n),world=createAdventureScene(T,'geo',people,'p0'),g=game(n);g.stage='roundReveal';g.revealStartedAt=1000;g.mine.answer={lat:0,lon:0};g.reveal={place:{lat:0,lon:180},players:people.map((p,i)=>({id:p.id,guess:{lat:i*3,lon:i?160+i:0},distance:1000+i}))};world.update(0,5000,g);
  const root=world.scene.getObjectByName('geo-expedition-base')!,globe=world.scene.getObjectByName('geographic-globe')!,ring=world.scene.getObjectByName('geo-highlighted-crew-desk')!,atlas=world.scene.getObjectByName('crew-navigation-status-cards')!;
  const resources=()=>{const ids:string[]=[];world.scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line)ids.push(o.uuid+o.geometry.uuid);});return ids;},before=resources();
  for(let i=0;i<n;i++){
   const draft={geoHighlight:{key:geoResultKey(g),player:people[i].id}};world.update(i,5100+i,g,draft);world.scene.updateMatrixWorld(true);
   assert.equal(root.userData.highlight.id,people[i].id);assert.equal(root.userData.highlight.index,i);assert.equal(ring.visible,true);assert.deepEqual(ring.position.toArray(),[geoCrewSeat(i,n)[0],1.238,geoCrewSeat(i,n)[2]-.65]);
   assert.equal(atlas.userData.cards.filter((c:any)=>c.highlighted).length,1);assert.equal(atlas.userData.cards[i].highlighted,true);assert.equal(world.actors.filter(a=>a.root.userData.geoHighlighted).length,1);assert.equal(world.actors[i].root.userData.geoHighlighted,true);
   for(const [j,row]of root.userData.highlight.routes.entries()){assert.equal(row.opacity,j===i?1:.18);assert.equal(row.scale,j===i?1.8:1);}
   const midpoint=globeRoute(g.reveal.players[i].guess,g.reveal.place,.5,1),facing=new T.Vector3(midpoint.x,midpoint.y,midpoint.z).applyEuler(globe.rotation);assert.ok(facing.z>.999999);assert.ok(Math.abs(facing.x)<1e-6&&Math.abs(facing.y)<1e-6);
   globe.rotation.y+=.12;const manual=globe.rotation.toArray();world.update(i+.1,5200+i,g,draft);assert.deepEqual(globe.rotation.toArray(),manual,'User rotation is not overwritten by the next frame');assert.equal(root.userData.flight.visible,false);
  }
  assert.deepEqual(resources(),before);world.update(20,6000,g,{geoHighlight:null});assert.equal(root.userData.highlight,null);assert.equal(ring.visible,false);assert.ok(world.actors.every(a=>!a.root.userData.geoHighlighted));
  g.stage='answer';g.round++;world.update(21,6100,g,{geoHighlight:{key:'stale',player:'p0'}});assert.equal(root.userData.highlight,null);assert.equal(ring.visible,false);world.dispose();
 }
});
test('Inspecting another player never labels the own in-progress flight as their route or restarts the clock',async()=>{
 const {geoResultKey}=await import('../lib/geo-presentation'),world=createAdventureScene(T,'geo',crew(2),'p0'),g=game(2);g.stage='roundReveal';g.revealStartedAt=1000;g.mine.answer={lat:0,lon:0};g.reveal={place:{lat:10,lon:40},players:[{id:'p0',guess:g.mine.answer,distance:1000},{id:'p1',guess:{lat:30,lon:20},distance:2000}]};
 const root=world.scene.getObjectByName('geo-expedition-base')!;world.update(0,1500,g);assert.equal(root.userData.flight.visible,true);const position=root.userData.flight.position;
 world.update(1,1500,g,{geoHighlight:{key:geoResultKey(g),player:'p1'}});assert.equal(root.userData.flight.visible,false);assert.equal(root.userData.flight.progress,.25);
 world.update(2,1500,g,{geoHighlight:{key:geoResultKey(g),player:'p0'}});assert.equal(root.userData.flight.visible,true);assert.deepEqual(root.userData.flight.position,position);assert.equal(root.userData.flight.progress,.25);world.dispose();
});
