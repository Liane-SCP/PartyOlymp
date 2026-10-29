import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {geoCamera,type GeoView} from '../lib/geo-camera';import {geoCrewSeat} from '../lib/geo-presentation';import {createAdventureScene} from '../components/olymp/adventure-scene';
import {gameImpact} from '../lib/game-camera';
import {geoPrivatePin} from '../lib/geo-presentation';
test('Rejoining restores only the own validated pin draft from the current phase',()=>{
 const g:any={stage:'answer',mine:{submitted:false,answer:null,timeoutInput:{phase:'current',action:{type:'pin',lat:12.3,lon:-179}}},players:{other:{answer:{lat:55,lon:77}}}};assert.deepEqual(geoPrivatePin(g,'current'),{lat:12.3,lon:-179});assert.equal(geoPrivatePin(g,'old'),null);assert.equal(geoPrivatePin({...g,mine:null},'current'),null);g.mine.timeoutInput.action.lat=91;assert.equal(geoPrivatePin(g,'current'),null);g.mine.submitted=true;g.mine.answer={lat:0,lon:180};assert.deepEqual(geoPrivatePin(g,'current'),g.mine.answer);
});
test('The precision globe and desk do not shake on the public reveal',()=>assert.equal(gameImpact('geo','roundReveal'),null));
function camera(w:number,h:number,n:number,i:number,view:GeoView){const f=geoCamera(w,h,n,i,view),c=new T.PerspectiveCamera(42,w/h,.1,180);c.position.set(f.target[0]+Math.sin(f.yaw)*f.distance,f.target[1]+Math.sin(f.pitch)*f.distance,f.target[2]+Math.cos(f.yaw)*Math.cos(f.pitch)*f.distance);c.lookAt(new T.Vector3(...f.target));c.updateMatrixWorld();return {f,c};}
test('Every interaction bound fits below the heading and above the actual view controls',()=>{
 for(const [w,h]of [[771,805],[364,418],[771,717],[364,330],[1040,797],[756,260],[320,480]])for(const n of [2,8,12])for(let i=0;i<n;i++)for(const view of ['crew','globe','desk'] as GeoView[]){const {f,c}=camera(w,h,n,i,view);for(const p of f.points){const q=new T.Vector3(...p).project(c),x=(q.x+1)*w/2,y=(1-q.y)*h/2;assert.ok(x>=f.safe.left-.01&&x<=f.safe.right+.01&&y>=f.safe.top-.01&&y<=f.safe.bottom+.01,`${w}/${h}/${n}/${i}/${view}: ${x},${y}`);}}
});
test('The private desk view enlarges each original player while preserving a usable group and globe view',()=>{
 for(const n of [2,12])for(const [w,h]of [[364,330],[771,717]])for(let i=0;i<n;i++){const s=geoCrewSeat(i,n),a=camera(w,h,n,i,'crew'),b=camera(w,h,n,i,'desk'),size=(c:T.Camera)=>{const low=new T.Vector3(s[0],1.12,s[2]).project(c),high=new T.Vector3(s[0],2.32,s[2]).project(c);return Math.abs(high.y-low.y)*h/2;};assert.ok(size(b.c)>size(a.c)*2,`${n}/${i}: ${size(a.c)} -> ${size(b.c)}`);}
 assert.equal(geoCamera(364,330,2,-1,'desk').view,'crew');
});
test('The actual own paper is ray-pickable from every desk view and the foreground globe cuts away',()=>{
 for(const n of [2,8,12])for(let i=0;i<n;i++){
  const people=Array.from({length:n},(_,j)=>({id:`p${j}`,name:`Crew ${j}`,color:'#aacbbc'})),world=createAdventureScene(T,'geo',people,people[i].id),g={id:'geo',round:1,stage:'answer',mine:{},submitted:{}};world.update(0,1000,g,{geoView:'desk'});world.scene.updateMatrixWorld(true);assert.equal(world.scene.getObjectByName('geographic-globe')!.visible,false);const paper=world.scene.getObjectByName('geo-own-chart-action') as T.Mesh;assert.equal((paper.material as T.Material).visible,false);
  for(const [w,h]of [[364,330],[771,717]]){const {c}=camera(w,h,n,i,'desk'),p=paper.position.clone().project(c),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(p.x,p.y),c);const hits=ray.intersectObjects(world.pickables.filter(o=>!o.userData.pickDisabled),false);assert.equal(hits[0]?.object,paper,`${n}/${i}/${w}`);}
  world.update(1,1100,g,{geoView:'globe'});assert.equal(world.scene.getObjectByName('geographic-globe')!.visible,true);assert.equal(paper.userData.pickDisabled,true);world.dispose();
 }
});
test('Personal reading rotates only the own atlas slot and restores it without replacing the geometry',()=>{
 const people=Array.from({length:12},(_,i)=>({id:`p${i}`,name:`Crew ${i}`,color:'#aacbbc'})),world=createAdventureScene(T,'geo',people,'p7'),g={id:'geo',round:1,stage:'answer',mine:{},submitted:{}};world.update(0,1000,g,{geoView:'crew'});const mesh=world.scene.getObjectByName('crew-navigation-status-cards') as T.Mesh,uv=mesh.geometry.attributes.uv,original=[...uv.array];world.update(1,1100,g,{geoView:'desk'});assert.notDeepEqual([...uv.array],original);for(let v=0;v<uv.count;v++)if(v<28||v>=32){assert.equal(uv.getX(v),original[v*2]);assert.equal(uv.getY(v),original[v*2+1]);}world.update(2,1200,g,{geoView:'crew'});assert.deepEqual([...uv.array],original);assert.equal(world.scene.getObjectByName('crew-navigation-status-cards'),mesh);world.dispose();
});
