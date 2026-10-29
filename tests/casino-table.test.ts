import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {casinoPresentation,casinoCameraDistance,casinoBounds} from '../lib/casino-presentation';
import {casinoCardSlot} from '../components/olymp/casino-table';
import {createAdventureScene} from '../components/olymp/adventure-scene';
const crew=[{id:'a',name:'Nova',color:'#bbeeaa'},{id:'b',name:'Luna',color:'#ccbbee'}],dealer=[{rank:2,suit:0},{rank:3,suit:1},{rank:5,suit:2},{rank:8,suit:3}];
const game=()=>({id:'blackjack',round:1,stage:'answer',revealStartedAt:10000,dealer:[dealer[0]],mine:{hand:[{rank:10,suit:0},{rank:9,suit:1}],bet:50},status:{a:{hand:[{rank:10,suit:0},{rank:9,suit:1}],value:19,bet:50},b:{hand:[{rank:7,suit:0},{rank:9,suit:2}],value:16,bet:50}},reveal:{dealer,dealerValue:18,players:[{id:'a',bet:50,payout:100},{id:'b',bet:50,payout:0}]}});
test('One public clock gates every dealer card and payout, including reduced motion and seeks',()=>{
 const g=game();assert.equal(casinoPresentation(g,20000).ready,false);assert.deepEqual(casinoPresentation(g,20000).rows,[]);g.stage='roundReveal';
 for(const[now,visible,ready]of [[10000,1,false],[11499,1,false],[11500,2,false],[13000,3,false],[14500,4,false],[15999,4,false],[16000,4,true]] as const){const f=casinoPresentation(g,now);assert.equal(f.visible,visible);assert.equal(f.ready,ready);assert.equal(f.rows.length,ready?2:0);}
 assert.equal(casinoPresentation(g,16500).payoutProgress,.5);assert.equal(casinoPresentation(g,18000).payoutProgress,1);
 for(let suit=0;suit<4;suit++)for(let rank=1;rank<=13;rank++)assert.equal(casinoCardSlot({suit,rank}),suit*13+rank-1);assert.equal(casinoCardSlot(null),52);
});
test('The table shows public hands, keeps the next card backed, and resumes actual payout instances',()=>{
 const a=createAdventureScene(T,'blackjack',crew,'a'),b=createAdventureScene(T,'blackjack',crew,'a'),g=game();
 a.update(0,9999,g);assert.equal(a.actors[0].root.position.x<1e-6,true);assert.equal(a.actors[0].root.position.z,6.4);assert.ok(a.dealer);assert.equal(a.actors.length,2);
 a.update(.3,9999,g);assert.equal(a.actors[0].root.children[0].position.y,.62);assert.equal((a.actors[0].root.children[0] as T.Sprite).material.rotation,0);
 let state=a.scene.userData.casino;assert.deepEqual(state.publicHands.map((p:any)=>p.count),[2,2]);assert.equal(state.cards,6);assert.equal(state.dealerCards[1].text,'✦');assert.equal(state.returnChips,0);assert.deepEqual(state.returns,[]);
 g.stage='roundReveal';g.dealer=[...dealer];a.update(1,10000,g);a.update(1.5,11500,g);a.update(2,13000,g);b.update(99,13000,g);assert.deepEqual(a.scene.userData.casino.dealerCards,b.scene.userData.casino.dealerCards);assert.equal(a.scene.userData.casino.visibleDealer,3);assert.equal(a.scene.userData.casino.dealerCards[3].hidden,true);assert.equal(a.scene.userData.casino.returnChips,0);
 a.update(3,16500,g);b.update(100,16500,g);state=a.scene.userData.casino;assert.equal(state.resultReady,true);assert.equal(state.returnChips,4);assert.deepEqual(state.payoutPoses,b.scene.userData.casino.payoutPoses);assert.deepEqual(state.returns.map((r:any)=>r.net),[50,-50]);assert.equal(a.scene.userData.tableFaces.a,4);assert.equal(a.scene.userData.tableFaces.b,6);
 a.update(4,18000,g);assert.equal(a.scene.userData.casino.stakeChips,0);assert.equal(a.scene.userData.casino.returnChips,4);g.round=2;g.stage='answer';g.dealer=[dealer[0]];a.update(5,20000,g);assert.equal(a.scene.userData.casino.returnChips,0);assert.equal(a.scene.userData.casino.dealerCards[1].hidden,true);a.dispose();b.dispose();
});

test('Dealer turns a real double-sided card above the felt on the shared clock',()=>{
 const a=createAdventureScene(T,'blackjack',crew,'a'),b=createAdventureScene(T,'blackjack',crew,'a'),g=game();g.stage='roundReveal';g.dealer=[...dealer];
 a.update(0,11499,g);assert.equal(a.scene.userData.casino.dealerCards[1].hidden,true);
 a.update(.1,11675,g);b.update(90,11675,g);const card=a.scene.userData.casino.dealerCards[1];assert.ok(Math.abs(card.rotation[1]-Math.PI/2)<1e-9);assert.ok(Math.abs(card.position[1]-2.345)<1e-9);assert.deepEqual(a.scene.userData.casino.dealerCards,b.scene.userData.casino.dealerCards);
 b.update(91,11675,g,{},true);assert.equal(b.scene.userData.casino.visibleDealer,2);assert.equal(b.scene.userData.casino.resultReady,false);assert.equal(b.scene.userData.casino.returnChips,0);assert.equal(b.scene.userData.casino.dealerCards[1].rotation[1],0);assert.equal(b.scene.userData.casino.dealerCards[2].hidden,true);
 a.update(.2,11850,g);assert.equal(a.scene.userData.casino.dealerCards[1].rotation[1],0);assert.equal(a.scene.userData.casino.dealerCards[1].position[1],1.645);a.dispose();b.dispose();
});
test('Dealer framing retains table, all seat bounds and host through portrait and orbit changes',()=>{
 for(const aspect of[.4,.8,1.5,2.5])for(const yaw of[-.75,.05,.75])for(const pitch of[.22,.58,.8]){const target=new T.Vector3(0,1.9,-.8),d=casinoCameraDistance(aspect,yaw,pitch,target),camera=new T.PerspectiveCamera(42,aspect,.1,180);camera.position.set(target.x+Math.sin(yaw)*d,target.y+Math.sin(pitch)*d,target.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateMatrixWorld();for(const x of casinoBounds.x)for(const y of casinoBounds.y)for(const z of casinoBounds.z){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.88&&Math.abs(p.y)<.78&&p.z> -1&&p.z<1);}}
});

test('Twelve simultaneous returns start in distinct real instance stacks on the bank mat',()=>{
 const people=Array.from({length:12},(_,i)=>({id:`p${i}`,name:`Crew ${i}`,color:'#aaccbb'})),world=createAdventureScene(T,'blackjack',people,'p0'),g:any={id:'blackjack',round:1,stage:'roundReveal',revealStartedAt:10000,dealer:[{rank:10,suit:0},{rank:9,suit:1},{rank:5,suit:2}],mine:{hand:[],bet:50},status:Object.fromEntries(people.map(p=>[p.id,{hand:[],bet:50}]))};g.reveal={dealer:g.dealer,players:people.map(p=>({id:p.id,bet:50,payout:100}))};world.update(0,14500,g);const positions=world.scene.userData.casino.payoutPoses;assert.equal(positions.length,12);assert.equal(new Set(positions.map((p:any)=>JSON.stringify(p.position))).size,12);assert.equal(world.scene.userData.casino.returnChips,48);world.dispose();
});
