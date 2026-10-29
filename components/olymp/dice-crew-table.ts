import * as T from 'three';
import {diceRollAge} from '@/lib/dice-presentation';
import {diceTotal} from '@/lib/game/games/dice';
import {diceResultRows,diceResultsVisible} from '@/lib/dice-results';
import type {createAdventureModels} from './adventure-models';
import {batchStaticMeshes} from './static-batches';

type Player={id?:string;name?:string;color:string};
const pips=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
const topRotations=[new T.Euler(),new T.Euler(-Math.PI/2,0,0),new T.Euler(0,0,Math.PI/2),new T.Euler(0,0,-Math.PI/2),new T.Euler(Math.PI/2,0,0),new T.Euler(Math.PI,0,0)].map(e=>new T.Quaternion().setFromEuler(e));

/** Public, individually equipped places. One dice atlas and one instanced dice draw. */
export function createDiceCrewTable(parent:T.Group,assets:ReturnType<typeof createAdventureModels>,players:Player[],me:string,seats:T.Vector3[]){
 const root=new T.Group();root.name='dice-crew-equipment';root.userData.dynamic=true;parent.add(root);
 const furniture=new T.Group();furniture.name='dice-crew-furniture';root.add(furniture);
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>(),instances:T.InstancedMesh[]=[];
 const box=new T.BoxGeometry(1,1,1);geometries.add(box);
 const felt=new T.MeshStandardMaterial({color:'#385e58',roughness:.95}),rim=new T.MeshStandardMaterial({color:'#bd9863',roughness:.85}),hold=new T.MeshStandardMaterial({color:'#688375',roughness:.95});materials.add(felt);materials.add(rim);materials.add(hold);
 const scale=Math.min(1,10/players.length);
 const local=Math.max(0,players.findIndex(p=>p.id===me));
 const stations=players.map((player,i)=>{const seat=(i-local+players.length)%players.length,p=seats[seat],origin=p.clone().multiplyScalar(.72);origin.y=1.56;return {id:player.id??'',name:player.name??'Crew',color:player.color,origin,yaw:Math.atan2(p.x,p.z),seat};});
 function at(index:number,x:number,y:number,z:number){const s=stations[index],sin=Math.sin(s.yaw),cos=Math.cos(s.yaw);return new T.Vector3(s.origin.x+(x*cos+z*sin)*scale,s.origin.y+y*scale,s.origin.z+(-x*sin+z*cos)*scale);}
 function block(index:number,name:string,material:T.Material,x:number,z:number,w:number,d:number,h:number,y=0){const mesh=new T.Mesh(box,material);mesh.name=name;mesh.position.copy(at(index,x,y,z));mesh.rotation.y=stations[index].yaw;mesh.scale.set(w*scale,h*scale,d*scale);mesh.receiveShadow=true;furniture.add(mesh);return mesh;}
 const cups:T.Group[]=[],errors:string[]=[];
 const jobs=stations.map((_,i)=>{
  block(i,'individual-dice-felt',felt,0,0,1.9,1.05,.035);
  block(i,'individual-held-dice-tray',hold,0,.7,1.9,.4,.045);
  for(const side of[-1,1])block(i,'dice-tray-side',rim,side*.97,.25,.06,1.6,.07,.025);
  block(i,'dice-tray-rim',rim,0,.93,2,.06,.07,.025);
  return assets.place({id:'food/cup',parent:furniture,position:at(i,-.77,.035,-.22).toArray() as [number,number,number],height:.42*scale,rotation:stations[i].yaw}).then(cup=>{if(cup)cups[i]=cup;}).catch(()=>{errors.push('food/cup');});
 });
 // All six authored face values share one atlas. Opposite sides add to seven.
 const canvas=typeof document==='undefined'?null:document.createElement('canvas');if(canvas){canvas.width=288;canvas.height=192;}const context=canvas?.getContext('2d');
 if(context){context.fillStyle='#f4ead4';context.fillRect(0,0,288,192);context.fillStyle='#263d3b';for(let value=1;value<=6;value++)for(const pip of pips[value]){context.beginPath();context.arc(((value-1)%3)*96+23+(pip%3)*25,Math.floor((value-1)/3)*96+23+Math.floor(pip/3)*25,7,0,Math.PI*2);context.fill();}}
 const map=canvas?new T.CanvasTexture(canvas):null;if(map){map.colorSpace=T.SRGBColorSpace;textures.add(map);}
 const diceMaterial=new T.MeshStandardMaterial({map,color:map?'#ffffff':'#f4ead4',roughness:.82});materials.add(diceMaterial);
 const dieGeometry=new T.BoxGeometry(.25,.25,.25),uv=dieGeometry.getAttribute('uv');geometries.add(dieGeometry);
 for(const [face,value]of [3,4,1,6,2,5].entries())for(let corner=0;corner<4;corner++){const k=face*4+corner,v=value-1;uv.setXY(k,((v%3)+uv.getX(k))/3,(1-Math.floor(v/3)+uv.getY(k))/2);}dieGeometry.clearGroups();
 const dice=new T.InstancedMesh(dieGeometry,diceMaterial,players.length*5);dice.name='public-crew-dice';dice.castShadow=true;dice.receiveShadow=true;root.add(dice);instances.push(dice);
 const pose=new T.Object3D(),yaw=new T.Quaternion(),spin=new T.Quaternion(),spinEuler=new T.Euler(),tint=new T.Color(),axis=new T.Vector3(0,1,0);
 // Flat place cards keep names/status below the faces, with a shared texture.
 const paper=typeof document==='undefined'?null:document.createElement('canvas');if(paper){paper.width=512;paper.height=(players.length+1)*96;}const pen=paper?.getContext('2d'),paperMap=paper?new T.CanvasTexture(paper):null;if(paperMap){paperMap.colorSpace=T.SRGBColorSpace;textures.add(paperMap);}
 const paperMaterial=new T.MeshBasicMaterial({map:paperMap,color:paperMap?'#ffffff':'#e6d6af',toneMapped:false,side:T.DoubleSide});materials.add(paperMaterial);
 const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
 stations.forEach((_,i)=>{const n=positions.length/3;for(const [x,z]of [[-.95,-.98],[.95,-.98],[.95,-.58],[-.95,-.58]])positions.push(...at(i,x,.035,z).toArray());const lo=1-(i+1)/(players.length+1),hi=1-i/(players.length+1);uvs.push(0,hi,1,hi,1,lo,0,lo);indices.push(n,n+2,n+1,n,n+3,n+2);});
 const centerStart=positions.length/3;positions.push(-1.8,1.615,-.35,1.8,1.615,-.35,1.8,1.615,.35,-1.8,1.615,.35);uvs.push(0,1/(players.length+1),1,1/(players.length+1),1,0,0,0);indices.push(centerStart,centerStart+2,centerStart+1,centerStart,centerStart+3,centerStart+2);
 const paperGeometry=new T.BufferGeometry();paperGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));paperGeometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));paperGeometry.setIndex(indices);paperGeometry.computeBoundingSphere();geometries.add(paperGeometry);const placeCards=new T.Mesh(paperGeometry,paperMaterial);placeCards.name='public-dice-place-cards';root.add(placeCards);
 const hitGeometry=new T.BoxGeometry(.32,.32,.32),hitMaterial=new T.MeshBasicMaterial({visible:false});geometries.add(hitGeometry);materials.add(hitMaterial);const pickables:T.Mesh[]=[];
 const own=players.findIndex(p=>p.id===me);if(own>=0){const cup=new T.Mesh(hitGeometry,hitMaterial);cup.position.copy(at(own,-.77,.27,-.22));cup.scale.set(1.5,1.8,1.5);cup.userData.pick='diceRoll';cup.scale.multiplyScalar(scale);root.add(cup);pickables.push(cup);for(let i=0;i<5;i++){const die=new T.Mesh(hitGeometry,hitMaterial);die.scale.setScalar(scale);die.userData.pick=`die:${i}`;root.add(die);pickables.push(die);}}
 if(own>=0){const sheet=new T.Mesh(box,hitMaterial);sheet.position.copy(at(own,0,.06,-.78));sheet.rotation.y=stations[own].yaw;sheet.scale.set(1.9*scale,.07,.4*scale);sheet.userData.pick='diceSheet';root.add(sheet);pickables.push(sheet);}
 const resultPicks=stations.map((station,i)=>{const hit=new T.Mesh(box,hitMaterial);hit.position.copy(at(i,0,.06,-.78));hit.rotation.y=station.yaw;hit.scale.set(1.9*scale,.07,.4*scale);hit.userData.pick=`diceResult:${station.id}`;hit.userData.pickDisabled=true;root.add(hit);pickables.push(hit);return hit;});
 const cache:string[]=[];let release=()=>{},disposed=false,lastKey='',lastNow=-Infinity,centerKey='';
 const ready=Promise.all(jobs).then(()=>{if(!disposed){release=batchStaticMeshes(furniture,{mergeUnique:true});root.userData.assetsReady=errors.length===0;root.userData.assetErrors=errors;}});
 function update(game:any,now:number,reduced:boolean,personal:boolean,selection?:string){
  const finished=diceResultsVisible(game),results=diceResultRows(game,players),selected=results.find(r=>r.id===selection)?.id??results.find(r=>r.id===me)?.id??results[0]?.id;
  root.visible=true;const key=JSON.stringify([personal,selected,results.map(r=>[r.id,r.total,r.rank]),game.stage,game.turn,!!game.mine,...stations.map(s=>{const p=game.opponents?.[s.id]??(s.id===me?game.mine:null);return p?[p.dice,p.held,p.rolls,p.rollStartedAt,p.rollId,p.sheet,p.submitted,p.lastEntry,p.total]:null;})]);const previous=root.userData.frame;if(key===lastKey&&previous&&(now===lastNow||!previous.rows.some((r:any)=>r.dice.length&&r.age!==null&&r.age<.65)))return previous;lastKey=key;lastNow=now;const rows=stations.map((s,i)=>{const p=game.opponents?.[s.id]??(s.id===me?game.mine:null),age=diceRollAge(p,now),rolling=!reduced&&age>=0&&age<.65,shown=!!p?.rolls;let dirty=false;const dicePositions:number[][]=[];
   for(let j=0;j<5;j++){const held=!!p?.held?.[j],moving=rolling&&!held,u=Math.min(1,Math.max(0,age/.65)),x=-.36+j*.27,target=at(i,x,.16,held?.7:(j%2)*.28-.2);pose.position.copy(target);if(moving){const start=at(i,-.77,.37,-.22);pose.position.lerpVectors(start,target,u);pose.position.y+=Math.sin(Math.PI*u)*.38;}yaw.setFromAxisAngle(axis,s.yaw);pose.quaternion.copy(yaw).multiply(topRotations[Math.max(0,Math.min(5,(p?.dice?.[j]??1)-1))]);if(moving){spin.setFromEuler(spinEuler.set(age*15+j,age*11,age*9));pose.quaternion.multiply(spin);}pose.scale.setScalar(shown?scale:0);dicePositions.push(pose.position.toArray());pose.updateMatrix();dice.setMatrixAt(i*5+j,pose.matrix);dice.setColorAt(i*5+j,tint.set(held?'#e9ca7d':'#ffffff'));if(i===own&&pickables[j+1]){pickables[j+1].position.copy(pose.position);pickables[j+1].userData.pickDisabled=!shown||p?.submitted||game.stage!=='answer';}}
   const result=results.find(r=>r.id===s.id),chosen=finished&&selected===s.id,status=finished&&result?`BLATTPLATZ ${result.rank}`:p?.submitted?`${p.lastEntry?.category??'EINTRAG'} +${p.lastEntry?.value??0}`:shown?`WURF ${p.rolls}/3`:'BEREIT',total=result?.total??(p?.sheet?diceTotal(p.sheet):Number(p?.total??0)),key=JSON.stringify([s.name,status,total,chosen,result?.rank]);if(cache[i]!==key){cache[i]=key;dirty=true;if(pen){const y=i*96;pen.fillStyle=chosen?'#d7c58b':result?.rank===1?'#f1deb3':'#efdfba';pen.fillRect(0,y,512,96);pen.fillStyle='#2a4e48';pen.textAlign='center';pen.textBaseline='middle';pen.font='700 30px sans-serif';pen.fillText(`${chosen?'› ':''}${s.name}`,256,y+28,484);pen.font='600 23px sans-serif';pen.fillText(`${status} · ${total} P.`,256,y+68,484);}}if(dirty&&paperMap)paperMap.needsUpdate=true;
   return {id:s.id,seat:s.seat,origin:s.origin.toArray(),cup:at(i,-.77,.27,-.22).toArray(),dice:shown?[...(p.dice??[])]:[],dicePositions,sheet:at(i,0,.06,-.78).toArray(),held:shown?[...(p.held??[])]:[],rolling,age:Number.isFinite(age)?age:null,rollId:p?.rollId??0,total,status,rank:result?.rank??null,selected:chosen};
  });
  const winners=results.filter(r=>r.rank===1),readyCount=rows.filter(r=>game.opponents?.[r.id]?.submitted??(r.id===me&&game.mine?.submitted)).length,centerText=finished?(winners.length>1?`${winners.length} GLEICH STARKE SPITZENBLÄTTER`:'DAS BESTE BLATT IST GEFUNDEN'):`WÜRFELWERK · ZUG ${game.turn??1} / 13`,centerStatus=finished?`${results[0]?.total??0} BLATTPUNKTE · BLÄTTER VERGLEICHEN`:`${readyCount} / ${players.length} EINTRÄGE GESICHERT`,nextCenter=centerText+centerStatus;if(nextCenter!==centerKey){centerKey=nextCenter;if(pen){const y=players.length*96;pen.fillStyle='#385e58';pen.fillRect(0,y,512,96);pen.fillStyle='#f2dfb2';pen.font='700 27px sans-serif';pen.textAlign='center';pen.textBaseline='middle';pen.fillText(centerText,256,y+29,488);pen.font='600 22px sans-serif';pen.fillText(centerStatus,256,y+68,488);}if(paperMap)paperMap.needsUpdate=true;}
  if(own>=0&&pickables[0]){const p=game.mine;pickables[0].userData.pickDisabled=!p||game.stage!=='answer'||p.submitted||p.done||p.rolls>=3;}
  if(own>=0&&pickables[6])pickables[6].userData.pickDisabled=!game.mine||finished;
  resultPicks.forEach((hit,i)=>hit.userData.pickDisabled=!finished||!results.some(r=>r.id===stations[i].id));
  dice.instanceMatrix.needsUpdate=true;if(dice.instanceColor)dice.instanceColor.needsUpdate=true;dice.computeBoundingSphere();root.userData.frame={personal,rows,finished,selected,ready:readyCount,cupsReady:cups.filter(Boolean).length};return root.userData.frame;
 }
 return {root,ready,pickables,dice,at,update,dispose(){if(disposed)return;disposed=true;release();instances.forEach(i=>i.dispose());root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
