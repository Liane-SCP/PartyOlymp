import test from "node:test";
import assert from "node:assert/strict";
import {catalog} from "../lib/game/catalog";
import {isBoss} from "../lib/game/boss-rules";
import {musicProfiles,musicStep,musicVariant,musicKey} from "../lib/game-music";
import {bossMusicVariants,bossMusicVariant} from "../lib/boss-music-variants";

test("Every available game has three distinct musical sections",()=>{
  const identities=new Set<string>();
  for(const game of catalog) {
    if(isBoss(game.id)) {
      const variants=bossMusicVariants[game.id];assert.equal(variants.length,3);
      assert.equal(new Set(variants.map(v=>JSON.stringify(v))).size,3);
      assert.equal(musicKey("playing",game.id),null);continue;
    }
    const p=musicProfiles[game.id];assert.ok(p,game.id);
    assert.equal(musicKey("playing",game.id),game.id);
    const sections=[0,1,2].map(v=>JSON.stringify(Array.from({length:128},(_,i)=>musicStep(p,v*128+i))));
    assert.equal(new Set(sections).size,3,game.id);
    const signature=JSON.stringify([p.bpm,sections]);assert.ok(!identities.has(signature),game.id);identities.add(signature);
    for(let step=0;step<384;step++)for(const n of musicStep(p,step)) {
      assert.ok(Number.isFinite(n.note)&&n.note>=20&&n.note<108);
      assert.ok(n.duration>0&&n.duration<12&&n.level>0&&n.level<0.2);
    }
  }
});
test("Menu, reveals and finale have scores; pause and unknown modes are silent",()=>{
  for(const phase of ["lobby","standings","reveal","podium"])assert.equal(musicKey(phase),phase);
  assert.equal(musicKey("rules","dice"),"dice");
  assert.equal(musicKey("paused","dice"),null);
  assert.equal(musicKey("playing","unknown"),null);
  assert.equal(musicVariant(0),0);assert.equal(musicVariant(128),1);assert.equal(musicVariant(256),2);assert.equal(musicVariant(384),0);
  for(const kind of ["colossus","kraken","dragon"] as const) {
    const section=(kind==="colossus"?16:12)*8;
    assert.equal(bossMusicVariant(kind,section),1);assert.equal(bossMusicVariant(kind,section*2),2);
  }
});
test("Zeitgefühl has uneven ambient entrances without rhythmic accompaniment",()=>{
  const p=musicProfiles.timing;assert.equal(p.ambient,true);assert.deepEqual(p.drums,[]);
  const starts:number[]=[];
  for(let step=0;step<384;step++) {
    const notes=musicStep(p,step);
    if(notes.length)starts.push(step);
    assert.ok(notes.every(n=>n.instrument==="pad"&&n.duration>=6));
  }
  const gaps=starts.slice(1).map((s,i)=>s-starts[i]);assert.ok(new Set(gaps).size>3);
});
