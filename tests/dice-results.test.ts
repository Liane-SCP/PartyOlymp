import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {diceResultRows,diceHistoryGame} from '../lib/dice-results';import {diceTotal} from '../lib/game/games/dice';
import {diceResultsFixture} from './dice-results-fixture';import {createAdventureScene} from '../components/olymp/adventure-scene';
test('all supported crews finish thirteen actual game turns; rows retain every category and the correct bonus',()=>{
 for(let count=2;count<=12;count++){
  const f=diceResultsFixture(count),game=f.view().room.game!,rows=diceResultRows(game,f.room.players);
  assert.equal(game.stage,'roundReveal');assert.equal(rows.length,count);assert.ok(rows.every(row=>row.complete&&row.sheet.length===13&&row.total===diceTotal(row.sheet)));
  assert.equal(rows[0].total,375);assert.equal(rows[0].upper,105);assert.equal(rows[0].bonus,35);assert.equal(rows[0].lower,235);assert.equal(rows[0].rank,1);assert.equal(rows[1].rank,1);
  if(count>2)assert.equal(rows[2].rank,3);for(const row of rows)assert.equal(f.room.game!.scores[row.id],row.total);
 }
});
test('partial legacy sheets are not invented; bonus boundary and authoritative completed totals are respected',()=>{
 assert.deepEqual(diceResultRows({stage:'answer',opponents:{a:{sheet:Array(13).fill(1)}}}),[]);
 const game={stage:'done',reveal:{players:[{id:'a',sheet:[63],total:99},{id:'b',sheet:[62,...Array(12).fill(0)],total:62},{id:'c',sheet:[63,...Array(12).fill(0)],total:98}]}};
 const rows=diceResultRows(game);assert.equal(rows[0].total,99);assert.equal(rows[0].complete,false);assert.equal(rows[0].sheet[1],null);assert.equal(rows.find(r=>r.id==='b')!.bonus,0);assert.equal(rows.find(r=>r.id==='c')!.bonus,35);
});
test('every result place is independently selectable, with tied ranks and clean return to the next game state',()=>{
 const f=diceResultsFixture(12),game=f.view().room.game!,crew=f.room.players,world=createAdventureScene(T,'dice',crew,crew[5].id);
 for(const selected of crew){world.update(1,f.now,game,{diceResult:selected.id,dicePersonal:false},true);const frame=world.scene.userData.diceCrew;assert.equal(frame.finished,true);assert.equal(frame.selected,selected.id);assert.deepEqual(frame.rows.filter((r:any)=>r.selected).map((r:any)=>r.id),[selected.id]);assert.equal(frame.rows.find((r:any)=>r.id===crew[0].id).rank,1);assert.equal(world.pickables.filter(p=>p.userData.pick?.startsWith('diceResult:')&&!p.userData.pickDisabled).length,12);assert.equal(world.pickables.find(p=>p.userData.pick==='diceSheet')!.userData.pickDisabled,true);}
 world.update(1,f.now,{...game,stage:'answer',reveal:null},{},true);assert.equal(world.scene.userData.diceCrew.finished,false);assert.equal(world.scene.userData.tableFaces,undefined);assert.ok(world.pickables.filter(p=>p.userData.pick?.startsWith('diceResult:')).every(p=>p.userData.pickDisabled));world.dispose();
});
test('spectators may inspect public result cards without gaining roll or hold controls',()=>{
 const f=diceResultsFixture(2,false),view=f.view('observer').room.game!,world=createAdventureScene(T,'dice',f.room.players,'observer');world.update(1,f.now,view,{},true);
 assert.equal(world.scene.userData.diceCrew.selected,f.room.players[0].id);assert.equal(world.pickables.filter(p=>p.userData.pick?.startsWith('diceResult:')&&!p.userData.pickDisabled).length,2);assert.equal(world.pickables.some(p=>p.userData.pick==='diceRoll'),false);world.dispose();
});
test('saved history recovers completed sheets after the live game has changed, without mutating the history',()=>{
 const f=diceResultsFixture(12);f.archive();const history=structuredClone(f.room.history),entry=f.room.history[0],game=diceHistoryGame(entry),rows=diceResultRows(game,f.room.players);
 assert.equal(rows.length,12);assert.ok(rows.every(row=>row.complete&&row.total===diceTotal(row.sheet)));game.reveal.players[0].sheet[0]=999;assert.deepEqual(f.room.history,history);
 assert.deepEqual(diceHistoryGame({results:[{id:'legacy',raw:12,detail:null}]}).reveal.players,[]);
});
