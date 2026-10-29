import test from 'node:test';import assert from 'node:assert/strict';
import {layoutJourneyLabels,mapRectsOverlap} from '../lib/journey-labels';
test('Measured long labels respect screen edges and their real neighboring widths',()=>{
 const placed=layoutJourneyLabels([{id:'crew',x:22,y:100,width:180,height:32},{id:'boss',x:170,y:105,width:160,height:32},{id:'next',x:280,y:150,width:100,height:30}],320,620,[]);
 assert.deepEqual([...placed.keys()],['crew','next']);assert.equal(placed.get('crew')!.left,8);assert.equal(placed.get('next')!.left,212);
 assert.equal(mapRectsOverlap(placed.get('crew')!,placed.get('next')!),false);
});
test('The destination and HUD reserve their actual rectangles before island labels',()=>{
 const placed=layoutJourneyLabels([{id:'olympus',x:190,y:230,width:110,height:40},{id:'dragon',x:230,y:245,width:150,height:28},{id:'under-tools',x:280,y:80,width:60,height:30},{id:'under-caption',x:100,y:500,width:120,height:30}],320,620,[{left:260,top:20,width:50,height:200},{left:15,top:480,width:240,height:110}]);
 assert.deepEqual([...placed.keys()],['olympus']);
});
test('Invalid, unmeasured and offscreen anchors never become floating visible labels',()=>{
 const labels=[{id:'hidden',x:10,y:10,width:0,height:0},{id:'nan',x:NaN,y:10,width:40,height:20},{id:'outside',x:-10,y:80,width:40,height:20},{id:'bottom',x:100,y:600,width:50,height:30}];assert.equal(layoutJourneyLabels(labels,320,620,[]).size,0);
});
