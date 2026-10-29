import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {checkoutPresentation,checkoutOutcome} from '../lib/checkout-presentation';
import {referenceMoments,diceCombination} from '../lib/reference-moments';
import {createAdventureScene} from '../components/olymp/adventure-scene';
const crew=[{id:'a',name:'Nova',color:'#bcff5c'},{id:'b',name:'Luna',color:'#bca6ee'},{id:'c',name:'Cosmo',color:'#e5a4b1'}];

test('Checkout conceals stale solutions during input and seeks every public customer within the existing reveal',()=>{
 for(const count of[2,8,12]){
  const g:any={stage:'answer',round:1,budget:10000,revealStartedAt:10000,reveal:{players:Array.from({length:count},(_,i)=>({id:String(i),items:[String(i)],sum:i===0?9900:10001,over:i!==0,count:1})),items:Array.from({length:count},(_,i)=>({id:String(i),price:i===0?9900:10001}))}};
  assert.equal(checkoutPresentation(g,13000),null);g.stage='roundReveal';const slot=Math.min(3400,14000/count);
  const first=checkoutPresentation(g,10800+slot*.7)!;assert.equal(first.row.id,'0');assert.equal(first.outcome,'close');assert.equal(first.total,9900);
  for(let i=0;i<count;i++){const a=checkoutPresentation(g,10800+slot*(i+.7))!,b=checkoutPresentation({...g,mine:{answer:['secret']}},10800+slot*(i+.7))!;assert.equal(a.row.id,String(i));assert.equal(a.complete,true);assert.deepEqual(a,b,'Clients seek the same customer regardless of their private basket');}
  const final=checkoutPresentation(g,25000)!;assert.equal(final.summary,true);assert.ok(final.rows.every(r=>r.complete));assert.equal(final.successful,1);
  delete g.revealStartedAt;assert.equal(checkoutPresentation(g,100000)!.summary,true,'Older reveals remain readable instead of freezing at the first scan');
 }
 assert.equal(checkoutOutcome(10001,10000,1),'over');assert.equal(checkoutOutcome(10000,10000,1),'close');assert.equal(checkoutOutcome(0,10000,0),'empty');
});

test('Public dice combinations celebrate new events once, skip stale events and reject invalid faces',()=>{
 const c=referenceMoments('dice','a',crew),g:any={round:1,events:[{id:'old',type:'dice',player:'a'}],opponents:{a:{rolls:1,dice:[6,6,6,6,6]}}};
 assert.equal(c.update(0,g).moment,null,'A rejoin cannot replay an old celebration');
 g.events.push({id:'new',type:'dice',player:'a'});assert.match(c.update(1,g).moment!.text,/FÜNFERPASCH/);assert.equal(c.update(2,g).fresh,false);
 g.events=[];c.update(5,g);g.events=[{id:'new',type:'dice',player:'a'}];assert.equal(c.update(6,g).fresh,false,'A delayed snapshot cannot replay an already seen event');
 assert.equal(diceCombination([0,0,0,0,0]),null);assert.equal(diceCombination([1,2,3,4,5])!.title,'GROSSE STRASSE');assert.equal(diceCombination([2,2,2,3,3])!.title,'FULL HOUSE');
});

test('Race moments use public progress, recognize overtakes and compare a finish against earlier completed races',()=>{
 const c=referenceMoments('typer','a',crew),g:any={round:2,text:'x'.repeat(100),racers:{a:{progress:10},b:{progress:30}},mine:{history:[{finished:true,wpm:100}]}};
 assert.equal(c.update(0,g).moment,null);g.racers.a.progress=50;g.racers.b.progress=35;assert.equal(c.update(1,g).moment!.kind,'pass');assert.equal(c.update(2,g).fresh,false);
 g.racers.a={progress:100,finishedAt:10000,finishedWpm:120};const finish=c.update(3,g);assert.equal(finish.moment!.kind,'finish');assert.match(finish.moment!.text,/REKORD/);assert.equal(c.update(4,g).fresh,false);
 const rejoin=referenceMoments('typer','a',crew);assert.equal(rejoin.update(4,g).moment,null);
 g.round=3;g.racers={a:{progress:0},b:{progress:0}};assert.equal(c.update(5,g).moment,null);
});

test('A third finisher cannot replay the earlier photo finish',()=>{
 const c=referenceMoments('typer','c',crew),g:any={round:1,text:'abc',racers:{a:{progress:0},b:{progress:0},c:{progress:0}}};c.update(0,g);
 g.racers.a={progress:3,finishedAt:10000,finishedWpm:50};g.racers.b={progress:3,finishedAt:10100,finishedWpm:49};assert.match(c.update(1,g).moment!.text,/FOTOFINISH/);
 g.racers.c={progress:3,finishedAt:15000,finishedWpm:40};assert.doesNotMatch(c.update(6,g).moment!.text,/FOTOFINISH/);
});

test('The very first confirmed salon roll animates; held dice remain still and motion reduction stops the throw',()=>{
 const world=createAdventureScene(T,'dice',crew,'a'),g:any={id:'dice',round:1,stage:'answer',mine:{rolls:0,dice:[1,1,1,1,1],held:[true,false,false,false,false]},opponents:{},events:[]};world.update(0,10000,g);
 g.mine.rolls=1;g.mine.rollId=1;g.mine.rollStartedAt=10100;world.update(.1,10100,g);world.update(.2,10200,g);
 assert.equal(world.scene.userData.diceRolling,true);const dice=world.scene.getObjectByName('public-crew-dice') as T.InstancedMesh,matrix=new T.Matrix4(),moving=new T.Matrix4();dice.getMatrixAt(0,matrix);dice.getMatrixAt(1,moving);assert.notDeepEqual(matrix.toArray(),moving.toArray());assert.equal(world.scene.userData.diceCrew.rows[0].held[0],true);
 world.update(.3,10300,g,{},true);assert.equal(world.scene.userData.diceRolling,false);dice.getMatrixAt(1,moving);assert.equal(world.scene.userData.diceCrew.rows[0].rolling,false);assert.deepEqual(new T.Vector3().setFromMatrixPosition(moving).toArray().map(n=>Math.round(n*1e5)),world.scene.userData.diceCrew.rows[0].dicePositions[1].map((n:number)=>Math.round(n*1e5)));world.dispose();
});

test('Public shopping selects the shared customer, not the local hidden basket, and resets immediately',()=>{
 const world=createAdventureScene(T,'budget',crew,'a'),g:any={id:'budget',round:1,stage:'answer',budget:10000,items:[{id:'p'},{id:'q'}],mine:{answer:['p'],submitted:true},revealStartedAt:10000,reveal:{players:[{id:'b',items:['q'],sum:10100,over:true,count:1}],items:[{id:'p',price:1},{id:'q',price:10100}]}};
 world.update(0,10000,g,{},true);const root=world.scene.getObjectByName('budget-department-store')!;assert.equal(root.userData.shopping.total,null);
 g.stage='roundReveal';world.update(1,13300,g,{},true);assert.equal(root.userData.shopping.customer,'b');assert.equal(root.userData.shopping.total,10100);assert.equal(root.userData.shopping.outcome,'over');assert.equal(world.scene.userData.moment.reaction,6);assert.ok(world.scene.userData.cameraFocus);
 g.round=2;g.stage='answer';world.update(2,14000,g,{basket:[]},true);assert.equal(root.userData.shopping.total,null);assert.equal(world.scene.userData.moment,null);assert.equal(world.scene.userData.cameraFocus,null);world.dispose();
});
