import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {fixture} from './adventure-browser-engine';
import {sizeMuseumFrame,sizeMuseumPosition,sizeMuseumCamera,sizeComparison,createSizeRevealCue} from '../lib/size-presentation';
import {validSizeInput,sizeDragCm} from '../lib/size-input';

test('16:9 museum composition keeps comparison bounds left of the side console',()=>{
 for(const [width,height]of[[1280,720],[1366,768],[1920,1080]])for(const view of['compare','gallery'] as const){
  const bounds={min:[-12,.1,-5],max:[12,9,12]},right=Math.min(500,Math.max(360,width*.3))+48,shot=sizeMuseumCamera(width,height,bounds,view,90,right),c=new T.OrthographicCamera(-shot.half*width/height,shot.half*width/height,shot.half,-shot.half,.1,180);
  c.position.set(shot.target[0],shot.target[1]+Math.sin(shot.pitch)*31,shot.target[2]+Math.cos(shot.pitch)*31);c.lookAt(new T.Vector3(...shot.target));c.updateMatrixWorld();
  for(const x of[bounds.min[0],bounds.max[0]])for(const y of[bounds.min[1],bounds.max[1]])for(const z of[bounds.min[2],bounds.max[2]]){
   const q=new T.Vector3(x,y,z).project(c),px=(q.x+1)*width/2,py=(1-q.y)*height/2;
   assert.ok(px>=20&&px<=width-right,`${width}: comparison under console`);assert.ok(py>=108&&py<=height-90,`${width}: comparison under HUD`);
  }
 }
});

test('The museum cue fires once at the public reveal boundary and never replays on a clock correction',()=>{
 const cue=createSizeRevealCue(),g={round:1,stage:'answer',reveal:null as any,revealStartedAt:1000};
 assert.equal(cue(g,990),false);g.stage='roundReveal';g.reveal={item:{cm:100}};
 assert.equal(cue(g,1000),false);assert.equal(cue(g,1400),false);assert.equal(cue(g,1474),false);assert.equal(cue(g,1475),true);
 assert.equal(cue(g,1475),false);assert.equal(cue(g,1200),false);assert.equal(cue(g,1500),false);g.stage='done';assert.equal(cue(g,1510),false);
});
test('A joined or suspended museum seeks the visible result without playing historical audio',()=>{
 const g={round:1,stage:'roundReveal',reveal:{item:{cm:100}},revealStartedAt:1000},joined=createSizeRevealCue(),paused=createSizeRevealCue();
 assert.equal(joined(g,1600),false);assert.equal(joined(g,1200),false);assert.equal(joined(g,1500),false);
 assert.equal(paused(g,1000),false);assert.equal(paused(g,1600),false);assert.equal(paused(g,1200),false);assert.equal(paused(g,1500),false);
});
test('A continuously observed answer may arrive just past the boundary; a new round has its own reveal',()=>{
 const cue=createSizeRevealCue(),g={round:1,stage:'answer',reveal:null as any,revealStartedAt:1000};
 cue(g,1450);g.stage='roundReveal';g.reveal={item:{cm:100}};assert.equal(cue(g,1500),true);
 g.round=2;g.stage='answer';cue(g,2000);g.stage='roundReveal';g.revealStartedAt=2000;assert.equal(cue(g,2000),false);cue(g,2400);assert.equal(cue(g,2475),true);
 const cold=createSizeRevealCue();assert.equal(cold(g,2500),false);g.revealStartedAt=NaN;assert.equal(cold(g,2600),false);
});

test('Exact input accepts the server range, and dragging keeps the current value until the pointer moves',()=>{
 for(const value of [.00001,.01,8.56,100,1e8])assert.equal(validSizeInput(String(value)),value);
 for(const value of ['', ' ',0,-1,1e8+1,Infinity,NaN,null,undefined,true,{},'1e999'])assert.equal(validSizeInput(value),null);
 for(const value of [.001,.01,8.56,100,1e8])assert.ok(Math.abs(sizeDragCm(value,0,0,'x')/value-1)<1e-12);
 assert.ok(Math.abs(sizeDragCm(50,120*Math.log(2),0,'x')-100)<1e-10);
 assert.ok(Math.abs(sizeDragCm(50,0,-120*Math.log(2),'y')-100)<1e-10);
 assert.ok(Math.abs(sizeDragCm(50,100,0,'y')-50)<1e-10);
 assert.equal(sizeDragCm(1e8,1000000,0,'x'),1e8);assert.ok(sizeDragCm(.00001,-1000000,0,'x')>0);
 const m=fixture('size',2);for(const value of [.00001,1e8]){m.command(m.first,{type:'game',action:{type:'timeoutDraft',action:{type:'answer',value,round:1}}});assert.equal(m.room.game!.players[m.first].timeoutInput?.action.value,value);assert.equal(m.view(m.room.players[1].id).room.game.mine.answer,null);}
});

test('A hidden large solution cannot dwarf the visible reference comparison, while measurement ratios stay exact',()=>{
 const overview=sizeComparison(8.56,100,605.8),reference=sizeComparison(8.56,100,605.8,[0,1]),actual=sizeComparison(1000000,100,605.8,[1,2]);
 assert.ok(overview.spans[1]<reference.spans[1]);assert.ok(Math.abs(reference.spans[1]-6.4)<1e-10);assert.ok(Math.abs(actual.spans[2]-6.4)<1e-10);
 assert.ok(Math.abs(reference.spans[1]/reference.spans[0]-100/8.56)<1e-10);
 assert.ok(Math.abs(actual.spans[2]/actual.spans[1]-605.8/100)<1e-10);
});

test('Private estimates and stale solutions never enter the museum before the authoritative reveal',()=>{
 const m=fixture('size',12),ids=m.room.participantIds;
 m.command(ids[1],{type:'game',action:{type:'answer',value:1234567}});
 for(const id of [ids[0],ids[1],'spectator']){
  const g=m.view(id).room.game;
  g.reveal={item:{cm:7654321},players:[{id:ids[1],estimate:1234567,score:100}]};
  const f=sizeMuseumFrame(g,m.room.players,id,Date.now(),{size:50,sizeSelected:ids[1],sizeView:'gallery'});
  assert.equal(f.revealed,false);assert.equal(f.actual,null);assert.ok(f.rows.every(r=>r.estimate===null));
  assert.equal(f.rows[1].submitted,true);
  assert.equal(f.estimate,id===ids[1]?1234567:id==='spectator'?null:50);
  assert.equal(f.canChange,id===ids[0]);
 }
});

test('All public tips, missing answers, ties and participant selection survive a real round resolution',()=>{
 for(const count of [2,8,12]){
  const m=fixture('size',count),ids=m.room.participantIds,actual=m.room.game!.secret.item.cm;
  for(const id of ids.slice(0,-1))m.command(id,{type:'game',action:{type:'answer',value:actual}});
  m.next();const g=m.view().room.game;
  assert.equal(g.stage,'roundReveal');
  for(let i=0;i<count;i++){
   const f=sizeMuseumFrame(g,m.room.players,m.first,g.revealStartedAt+950,{sizeSelected:ids[i],sizeView:'gallery'});
   assert.equal(f.selected?.id,ids[i]);assert.equal(f.page,Math.floor(i/3));assert.ok(f.visibleRows.some(r=>r.id===ids[i]));
   assert.equal(f.actual,actual);assert.equal(f.estimate,i===count-1?null:actual);
   assert.equal(f.rows[i].score,g.reveal.players.find((r:any)=>r.id===ids[i]).score);
   if(i<count-1)assert.equal(f.rows[i].place,1);
  }
  const f=sizeMuseumFrame(g,m.room.players,m.first,g.revealStartedAt+950,{sizeSelected:'departed'});
  assert.equal(f.selected?.id,m.first);
  m.next();const reset=sizeMuseumFrame(m.view().room.game,m.room.players,m.first,Date.now());
  assert.equal(reset.actual,null);assert.ok(reset.rows.every(r=>r.estimate===null));
 }
});

test('Reload and late clients seek the shared reveal movement; reduced clock age cannot reverse it below zero',()=>{
 const m=fixture('size',12);m.resolve();const g=m.view().room.game,at=g.revealStartedAt;
 assert.equal(sizeMuseumFrame(g,m.room.players,m.first,at-200).progress,0);
 assert.equal(sizeMuseumFrame(g,m.room.players,m.first,at+475).progress,.5);
 assert.equal(sizeMuseumFrame(g,m.room.players,m.first,at+5000).progress,1);
 for(const count of [2,8,12])for(let i=0;i<count;i++){
  const position=sizeMuseumPosition(i,count,1);assert.equal(position[1],.35);assert.ok(Math.abs(position[0])<=12);
  assert.deepEqual(sizeMuseumPosition(i,count,100),position);
 }
});

test('The fixed comparison envelope fits above navigation from mobile to desktop',()=>{
 for(const view of ['compare','gallery'] as const)for(const [width,height,reserved] of [[390,720,250],[1440,640,150],[2560,780,150]]){
  const bounds={min:[-14,.1,-4],max:[14,8.4,13]},v=sizeMuseumCamera(width,height,bounds,view,reserved),a=width/height;
  const camera=new T.OrthographicCamera(-v.half*a,v.half*a,v.half,-v.half,.1,180);
  camera.position.set(v.target[0],v.target[1]+Math.sin(v.pitch)*60,v.target[2]+Math.cos(v.pitch)*60);camera.lookAt(new T.Vector3(...v.target));camera.updateMatrixWorld();
  for(const x of bounds.min.slice(0,1).concat(bounds.max.slice(0,1)))for(const y of [bounds.min[1],bounds.max[1]])for(const z of [bounds.min[2],bounds.max[2]]){
   const q=new T.Vector3(x,y,z).project(camera),px=(q.x+1)*width/2,py=(1-q.y)*height/2;
   assert.ok(px>=20&&px<=width-70,`horizontal clipping ${view}/${width}`);
   assert.ok(py>=108&&py<=height-reserved,`navigation overlap ${view}/${width}: ${py}`);
  }
 }
});
