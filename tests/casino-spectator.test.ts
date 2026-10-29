import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {createAdventureScene} from '../components/olymp/adventure-scene';
test('A spectator gets public hands and payouts without a private betting station or invented result',()=>{
 const crew=[{id:'a',name:'Nova',color:'#bbddaa'},{id:'b',name:'Luna',color:'#ccbbee'}],world=createAdventureScene(T,'blackjack',crew,'watch'),g:any={id:'blackjack',round:1,stage:'answer',dealer:[{rank:8,suit:0}],status:{a:{hand:[{rank:10,suit:0},{rank:9,suit:1}],bet:50,value:19},b:{hand:[{rank:7,suit:0},{rank:9,suit:1}],bet:50,value:16}}};
 world.update(0,1000,g);assert.equal(world.scene.getObjectByName('casino-action-2')!.visible,false);assert.equal(world.scene.userData.casino.cards,6);assert.match(world.scene.getObjectByName('table-total')!.userData.text,/DEALER/);
 g.stage='roundReveal';g.revealStartedAt=1000;g.reveal={dealer:[{rank:8,suit:0},{rank:10,suit:1}],players:[{id:'a',bet:50,payout:100},{id:'b',bet:50,payout:0}]};world.update(1,6000,g);assert.equal(world.scene.userData.moment.text,'AUSZAHLUNGEN');assert.equal(world.scene.userData.moment.player,undefined);world.dispose();
});
