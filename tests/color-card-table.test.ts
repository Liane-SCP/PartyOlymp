import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {colorTableFrame,colorCardSlot,colorHandDistance,colorHandBounds} from '../lib/color-table-presentation';
import {createAdventureScene} from '../components/olymp/adventure-scene';
import {casinoCameraDistance} from '../lib/casino-presentation';
const people=(n:number)=>Array.from({length:n},(_,i)=>({id:`p${i}`,name:`Crew ${i}`,color:'#aaccbb'}));
const card=(color:number,value:number,id=`${color}-${value}`)=>({color,value,id});
test('Club terrace keeps private card corners, draw pile and 2/8/12 seated faces clear',()=>{
 for(const n of[2,8,12]){const world=createAdventureScene(T,'cards',people(n),'p0'),club=world.scene.getObjectByName('treehouse-club-terrace')!;assert.ok(club);let lights=0;club.traverse(o=>{if(o instanceof T.Light)lights++;});assert.equal(lights,0);world.scene.updateMatrixWorld(true);
  for(const aspect of[1440/628,390/570])for(const personal of[false,true]){const camera=new T.PerspectiveCamera(42,aspect,.1,180),target=personal?new T.Vector3(0,1.85,4.15):new T.Vector3(0,1.9,.3),pitch=personal?1.05:.7,d=personal?colorHandDistance(aspect):casinoCameraDistance(aspect,0,pitch,target);camera.position.set(0,target.y+Math.sin(pitch)*d,target.z+Math.cos(pitch)*d);camera.lookAt(target);camera.updateMatrixWorld();
   const points=personal?colorHandBounds.x.flatMap(x=>colorHandBounds.y.flatMap(y=>colorHandBounds.z.map(z=>new T.Vector3(x,y,z)))):[new T.Vector3(-3.8,1.9,-.5),new T.Vector3(0,1.9,-.8),...world.actors.map(a=>a.root.position.clone().add(new T.Vector3(0,1,0)))];
   for(const point of points){const ray=new T.Raycaster(camera.position,point.clone().sub(camera.position).normalize(),0,camera.position.distanceTo(point)-.02);assert.equal(ray.intersectObject(club,true).length,0,`${n}/${aspect}/${personal}/${point.toArray()}`);}
  }world.dispose();
 }
});
function game(n=12):any{return {id:'cards',round:1,stage:'answer',top:card(0,5),color:0,direction:1,turnId:'p0',order:people(n).map(p=>p.id),counts:Object.fromEntries(people(n).map(p=>[p.id,7])),mine:{hand:[card(0,11),card(1,3),card(4,14)]}};}
test('Color table paginates every private card, marks actual playable cards and ignores foreign hands',()=>{
 const g=game();g.mine.hand=Array.from({length:19},(_,i)=>card(i%4,i%10,`own-${i}`));g.foreignSecret={hand:[card(3,12,'do-not-render')]};let f=colorTableFrame(g,'p0',1000,{cardPage:99});assert.equal(f.page,2);assert.deepEqual(f.own.map((e:any)=>e.index),[16,17,18]);assert.equal(colorTableFrame(g,'spectator',1000).ownTurn,false);f=colorTableFrame(g,'p0',1000,{cardWild:'missing'});assert.equal(f.wild,false);assert.equal(f.own[0].playable,true);
 for(let c=0;c<4;c++)for(let v=0;v<13;v++)assert.equal(colorCardSlot(card(c,v)),c*13+v);assert.equal(colorCardSlot(card(4,13)),52);assert.equal(colorCardSlot(card(4,14)),53);assert.equal(colorCardSlot(null),54);
});
test('Public draw/penalty cards remain backs; actual flight poses resume and reduced motion preserves counts',()=>{
 const crew=people(12),a=createAdventureScene(T,'cards',crew,'p0'),b=createAdventureScene(T,'cards',crew,'p0'),g=game();a.update(0,1000,g);assert.equal(a.scene.userData.colorTable.own.length,3);assert.equal(a.scene.userData.colorTable.opponents.filter((p:any)=>p.shown>0).length,11);assert.equal(a.scene.userData.cueId,undefined);
 g.lastMove={id:'draw-four',at:1000,kind:'play',card:card(4,14),player:'p1',target:'p2',count:4,color:0};g.top=g.lastMove.card;g.counts.p2=11;a.update(.2,1200,g);b.update(100,1200,g);const f=a.scene.userData.colorTable;assert.deepEqual(f.flightPoses,b.scene.userData.colorTable.flightPoses);assert.equal(f.flightPoses.filter((p:any)=>p.hidden).length,4);assert.ok(f.flightPoses.filter((p:any)=>p.hidden).every((p:any)=>p.slot===54));assert.equal(a.scene.userData.tableFaces.p2,6);assert.equal(a.scene.userData.cue,'cardPenalty');
 b.update(101,1200,g,{},true);assert.equal(b.scene.userData.colorTable.flightPoses.length,0);assert.deepEqual(b.scene.userData.colorTable.opponents,f.opponents);a.update(2,2400,g);assert.equal(a.scene.userData.colorTable.flightPoses.length,0);a.dispose();b.dispose();
});
test('Last-card and winner moments use confirmed public state and reset in the next round',()=>{
 const world=createAdventureScene(T,'cards',people(2),'p0'),g=game(2);world.update(0,1000,g);g.lastMove={id:'last',at:1100,kind:'play',player:'p1',card:card(0,11)};g.counts.p1=1;g.direction=-1;world.update(.2,1200,g);assert.equal(world.scene.userData.moment.kind,'cards-last');assert.equal(world.scene.userData.moment.player,'p1');assert.equal(world.scene.userData.colorTable.direction,-1);assert.equal(world.scene.userData.cue,'cardLast');
 g.stage='roundReveal';g.reveal={winner:'p1',players:[]};world.update(1,1300,g);assert.equal(world.scene.userData.moment.kind,'cards-result');assert.equal(world.scene.userData.tableFaces.p1,4);g.round=2;g.stage='answer';delete g.lastMove;g.counts.p1=7;world.update(2,1500,g);assert.equal(world.scene.userData.moment,null);assert.equal(world.scene.userData.colorTable.winner,null);world.dispose();
});
test('Actual direction arrows occupy distinct segments and reverse their tangent with 2/8/12 seats',()=>{
 for(const n of[2,8,12]){const world=createAdventureScene(T,'cards',people(n),'p0'),g=game(n);world.update(0,1000,g);const arrows=world.scene.getObjectByName('color-turn-arrows') as T.InstancedMesh,matrix=new T.Matrix4(),positions:string[]=[],directions:T.Vector3[]=[];assert.equal(arrows.count,n);
  for(let i=0;i<n;i++){arrows.getMatrixAt(i,matrix);positions.push(new T.Vector3().setFromMatrixPosition(matrix).toArray().map(v=>v.toFixed(4)).join(','));const direction=new T.Vector3(0,1,0).transformDirection(matrix),next=world.actors[(i+1)%n].root.position.clone().sub(world.actors[i].root.position).normalize();assert.ok(direction.dot(next)>.4);directions.push(direction);}assert.equal(new Set(positions).size,n);
  g.direction=-1;world.update(1,1100,g);for(let i=0;i<n;i++){arrows.getMatrixAt(i,matrix);assert.ok(new T.Vector3(0,1,0).transformDirection(matrix).dot(directions[i])<-.99);}world.dispose();
 }
});
test('Personal hand keeps real cards large and reachable, restores crew, and can page the entire deck',()=>{
 for(const [width,height]of[[320,301],[390,570],[844,174],[1440,628]]){
  const aspect=width/height,d=colorHandDistance(aspect),camera=new T.PerspectiveCamera(42,aspect,.1,180);camera.position.set(0,1.85+Math.sin(1.05)*d,4.15+Math.cos(1.05)*d);camera.lookAt(0,1.85,4.15);camera.updateMatrixWorld();
  for(const x of colorHandBounds.x)for(const y of colorHandBounds.y)for(const z of colorHandBounds.z){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.9&&Math.abs(p.y)<.84);}
  for(const x of[-2.2,0,2.2]){const positions=[[-.675,-.95],[.675,-.95],[-.675,.95],[.675,.95]].map(([a,b])=>new T.Vector3(x+a*1.4,1.82,4.15+b*1.4).project(camera)).map(p=>new T.Vector2(p.x*width/2,p.y*height/2));assert.ok(positions[0].distanceTo(positions[1])>=44);assert.ok(positions[0].distanceTo(positions[2])>=44);}
 }
 const world=createAdventureScene(T,'cards',people(12),'p0'),g=game();g.mine.hand=Array.from({length:108},(_,i)=>card(i%4,i%13,`own-${i}`));world.update(0,1000,g,{cardFocused:true,cardPage:35});let f=world.scene.userData.colorTable;assert.equal(f.personal,true);assert.equal(f.pages,36);assert.deepEqual(f.own.map((r:any)=>r.index),[105,106,107]);assert.equal(world.actors[0].root.visible,false);assert.ok(world.actors.slice(1).every(a=>a.root.visible));world.update(1,1100,g,{cardFocused:false});f=world.scene.userData.colorTable;assert.equal(f.own.length,8);assert.equal(f.personal,false);assert.ok(world.actors.every(a=>a.root.visible));world.dispose();
});
test('Expanded group view restores every participant and keeps play decisions in the hand view',()=>{
 const world=createAdventureScene(T,'cards',people(2),'p0'),g=game(2);world.update(0,1000,g,{cardExpanded:true,cardFocused:false});assert.equal(world.scene.userData.colorTable.viewOnly,true);assert.ok(world.scene.userData.colorTable.own.every((c:any)=>!c.playable));assert.ok(world.actors.every(a=>a.root.visible));assert.ok(world.pickables.filter(o=>o.userData.pick==='cardDraw'||o.userData.pick?.startsWith('card:')).every(o=>o.userData.pickDisabled));world.update(1,1100,g,{cardExpanded:true,cardFocused:true});assert.equal(world.scene.userData.colorTable.viewOnly,false);assert.equal(world.scene.userData.colorTable.own[0].playable,true);world.dispose();
});
