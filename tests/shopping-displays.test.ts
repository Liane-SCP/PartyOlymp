import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createShoppingDisplays,shoppingPickLayer,shoppingAtlasRect,shoppingAtlas,shoppingLabelLines} from '../components/olymp/shopping-displays';

test('Batched display faces match every transformed hit surface, including selection and hidden offers',()=>{
 const scene=new T.Scene(),parent=new T.Group();parent.position.set(3,2,1);parent.rotation.y=.35;parent.scale.set(1.2,.8,1.1);scene.add(parent);
 const cream=new T.MeshStandardMaterial(),wood=new T.MeshStandardMaterial(),positions=Array.from({length:12},(_,i)=>new T.Vector3((i%4)*4,0,Math.floor(i/4)*3)),d=createShoppingDisplays(parent,positions,cream,wood,'#eeaa55');
 d.stalls[0].scale.setScalar(.92);d.stalls[3].visible=false;d.stalls[10].visible=false;d.sync();scene.updateMatrixWorld(true);
 const photoBatch=parent.getObjectByName('shopping-product-faces') as T.Mesh,labelBatch=parent.getObjectByName('shopping-product-labels') as T.Mesh,base=parent.getObjectByName('shopping-stand-bases') as T.InstancedMesh;
 assert.equal(base.count,10);assert.equal(photoBatch.geometry.drawRange.count,60);
 let out=0;d.stalls.forEach((s,i)=>{if(!s.visible)return;for(const[source,batch]of[[d.photos[i],photoBatch],[d.labels[i].object,labelBatch]] as const){for(let v=0;v<4;v++){const expected=new T.Vector3().fromBufferAttribute(source.geometry.getAttribute('position'),v).applyMatrix4(source.matrixWorld),actual=new T.Vector3().fromBufferAttribute(batch.geometry.getAttribute('position'),out*4+v).applyMatrix4(parent.matrixWorld);assert.ok(expected.distanceTo(actual)<1e-5);const a=source.geometry.getAttribute('uv'),b=batch.geometry.getAttribute('uv');assert.equal(a.getX(v),b.getX(out*4+v));assert.equal(a.getY(v),b.getY(out*4+v));}}out++;});
 const attribute=photoBatch.geometry.getAttribute('position') as T.BufferAttribute,version=attribute.version;d.sync();assert.equal(attribute.version,version,'Unchanged frames do not reupload display geometry');
 const camera=new T.PerspectiveCamera();assert.equal(camera.layers.test(d.photos[0].layers),false);assert.equal(camera.layers.test(photoBatch.layers),true);
 const photo=d.photos[5],center=photo.getWorldPosition(new T.Vector3()),normal=new T.Vector3(0,0,1).transformDirection(photo.matrixWorld),ray=new T.Raycaster(center.clone().addScaledVector(normal,10),normal.clone().negate());
 ray.layers.enable(shoppingPickLayer);assert.equal(ray.intersectObject(photo,false)[0]?.object.userData.pick,'offer:5');
 let releases=0;photoBatch.geometry.addEventListener('dispose',()=>releases++);cream.addEventListener('dispose',()=>releases++);d.dispose();d.dispose();assert.equal(releases,1);cream.dispose();wood.dispose();
});

test('Atlas entries stay separate with a gutter and preserve full photo aspect',()=>{
 const rectangles=Array.from({length:12},(_,i)=>[shoppingAtlasRect(i),shoppingAtlasRect(i,true)]).flat();
 for(const r of rectangles){assert.ok(r.x>=1&&r.y>=1&&r.x+r.width<shoppingAtlas.width&&r.y+r.height<shoppingAtlas.height);for(const q of rectangles){if(r===q)continue;assert.ok(r.x+r.width<q.x||q.x+q.width<r.x||r.y+r.height<q.y||q.y+q.height<r.y);}}
 for(let i=0;i<12;i++)assert.equal(shoppingAtlasRect(i).width/shoppingAtlasRect(i).height,400/260);
});

test('World labels keep prices large and split long titles into two bounded lines',()=>{
 assert.deepEqual(shoppingLabelLines('129.00 €'),['129.00 €']);
 assert.deepEqual(shoppingLabelLines('   Knusper Riegel   '),['Knusper Riegel']);
 for(const title of ['Eine besonders ausführliche Produktbezeichnung mit Hersteller und Modell','ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ','Hersteller Kopfhörer kabellos und faltbar mit Mikrofon']){const lines=shoppingLabelLines(title);assert.equal(lines.length,2);assert.ok(lines.every(line=>line.length>0&&line.length<=20));assert.ok(lines[1].endsWith('…'));}
});
