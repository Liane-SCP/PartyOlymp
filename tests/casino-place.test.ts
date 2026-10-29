import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {casinoPlaceFrame,casinoActionPosition,casinoDraftState} from '../lib/casino-place';
import {createCasinoTable} from '../components/olymp/casino-table';
import {createCardTablePresentation} from '../components/olymp/card-table-presentation';
const hand=Array.from({length:7},(_,i)=>({rank:2,suit:i%4}));

test('An outstanding old action cannot shadow the dealer or activate a new hand',()=>{
 const old={casinoPhase:'round-one',casinoBet:100,casinoPending:true,casinoError:'old failure'};
 const reveal=casinoDraftState({stage:'roundReveal'},'round-one-reveal',old);assert.equal(reveal.pending,false);assert.equal(reveal.error,undefined);
 const next=casinoDraftState({stage:'answer'},'round-two',old);assert.equal(next.bet,50);assert.equal(next.pending,true);assert.equal(next.error,undefined);
 const ready=casinoDraftState({stage:'answer'},'round-two',{casinoPhase:'round-two',casinoBet:75,casinoPending:false});assert.equal(ready.bet,75);assert.equal(ready.pending,false);
});

test('Place frame keeps unshown dealer values and payouts behind the public clock',()=>{
 const game:any={stage:'answer',round:1,mine:{hand,bet:50,chips:950},dealer:[{rank:5,suit:0}]};
 let frame=casinoPlaceFrame(game,1000,'dealer');assert.equal(frame.dealerValue,5);assert.equal(frame.dealerHidden,true);assert.equal(frame.result,null);
 game.stage='roundReveal';game.mine.chips=1050;game.revealStartedAt=1000;game.reveal={dealer:[{rank:5,suit:0},{rank:6,suit:1},{rank:8,suit:2}],players:[{id:'a',bet:50,payout:100}]};
 frame=casinoPlaceFrame(game,2499,'dealer',0,null,'a');assert.equal(frame.dealerValue,5);assert.equal(frame.dealerShown.length,1);assert.equal(frame.result,null);assert.equal(frame.chips,950);
 frame=casinoPlaceFrame(game,2500,'dealer',0,null,'a');assert.equal(frame.dealerValue,11);assert.equal(frame.result,null);
 frame=casinoPlaceFrame(game,5500,'dealer',0,null,'a');assert.equal(frame.dealerValue,19);assert.equal(frame.dealerHidden,false);assert.equal(frame.result.payout,100);assert.equal(frame.chips,1050);
});

test('Long hands clamp pages, spectators get no private place or actions, action anchors restore',()=>{
 const game={stage:'answer',mine:{hand,bet:50,chips:950}};
 const frame=casinoPlaceFrame(game,0,'hand',99);assert.equal(frame.pages,3);assert.equal(frame.page,2);assert.equal(frame.canPlay,true);
 const spectator=casinoPlaceFrame({...game,mine:null},0,'hand');assert.equal(spectator.mode,'dealer');assert.equal(spectator.canBet,false);assert.equal(spectator.canPlay,false);assert.deepEqual(spectator.hand,[]);
 assert.deepEqual(casinoActionPosition('casino:hit',true),[-1.5,1.75,5.55]);assert.deepEqual(casinoActionPosition('casino:hit',false),[-5.25,1.75,.2]);
});

test('Actual printed proxies page and restore without exposing scheduled dealer faces',()=>{
 const root=new T.Group(),table=createCasinoTable(root),owned=new Map<string,T.Material>(),mat=(color:string)=>{if(!owned.has(color))owned.set(color,new T.MeshStandardMaterial({color}));return owned.get(color)!;};
 const view=createCardTablePresentation('blackjack',table.cards,'a',mat),game:any={stage:'answer',round:1,mine:{hand,bet:50},dealer:[{rank:5,suit:0}]};
 view.update(1,game,true,1000,{mode:'hand',page:1});assert.deepEqual(table.cards.slice(0,40).map((c,i)=>c.root.visible?i:-1).filter(i=>i>=0),[3,4,5]);assert.ok(table.cards.slice(3,6).every((c,i)=>Math.abs(c.root.position.x-[-1.6,0,1.6][i])<1e-8));assert.ok(table.cards.slice(3,6).every(c=>Math.abs(c.root.position.z-3.95)<1e-8));
 view.update(2,game,true,2000,{mode:'table',page:0});assert.equal(table.cards.slice(0,40).filter(c=>c.root.visible).length,7);assert.ok(table.cards.slice(0,7).every(c=>Math.abs(c.root.position.z-4.35)<1e-8));
 game.stage='roundReveal';game.revealStartedAt=1000;game.reveal={dealer:Array.from({length:7},(_,i)=>({rank:i+1,suit:i%4})),players:[]};
 view.update(4,game,true,4000,{mode:'dealer',page:1});const shown=table.cards.slice(40).filter(c=>c.root.visible);assert.equal(shown.length,1);assert.equal(shown[0].root.userData.hidden,true);assert.equal(shown[0].root.userData.displayedCard,null);assert.equal(shown[0].face.object.userData.text,'✦');
 table.dispose();owned.forEach(m=>m.dispose());
});

test('Personal stakes stay beside the hand; the shared table restores every stake',()=>{
 const root=new T.Group(),table=createCasinoTable(root),game:any={stage:'answer',round:1,mine:{hand,bet:100},dealer:[{rank:5,suit:0}],status:{a:{hand,bet:100},b:{hand:hand.slice(0,2),bet:50}}};
 const seats=[{id:'a',position:new T.Vector3(0,1.3,6.4),color:'#aadd88'},{id:'b',position:new T.Vector3(4,1.3,5),color:'#aa88dd'}];
 const personal=table.sync(game,1000,seats,'a',true,true)!;assert.equal(personal.stakeChips,4);assert.equal(personal.publicHands.length,2);
 const chips=root.getObjectByName('casino-stakes') as T.InstancedMesh,matrix=new T.Matrix4(),point=new T.Vector3();chips.getMatrixAt(0,matrix);point.setFromMatrixPosition(matrix);assert.ok(Math.abs(point.x+3.1)<1e-6&&Math.abs(point.z-4.3)<1e-6);
 const shared=table.sync(game,1000,seats,'a',true,false)!;assert.equal(shared.stakeChips,6);chips.getMatrixAt(8,matrix);point.setFromMatrixPosition(matrix);assert.ok(Math.abs(point.x-.55)<1e-6&&Math.abs(point.z-4.8)<1e-6);table.dispose();
});
