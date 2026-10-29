import * as T from 'three';
import {locationKit} from './location-kit';
import {batchStaticMeshes} from './static-batches';
import {bossStation} from '@/lib/boss-stations';
import {createRuneDice} from './rune-dice';
import type {BossArena,BossKind,ArenaFrame} from './boss-models';
import type {RuneHand} from '@/lib/colossus-runes';
import {createColossusRuneCharge} from './colossus-rune-charge';
import {createDragonAltar} from './dragon-altar';
import type {DragonRisk} from '@/lib/dragon-altar';

type Player={id:string;color:string};
export interface BossVenueFrame extends ArenaFrame {
 submitted:Record<string,boolean>;
 outcomes:{id:string;damage?:number;dice?:number[]}[];
 mineDice?:RuneHand;
 now?:number;
 product?:{id:string;name:string;image:string};
 price?:number;
 active?:boolean;
 portraitFocus?:boolean;
 mineDragon?:{risk:DragonRisk;guess?:number;sealed?:boolean};
}

/** The playable workstations use public readiness and explicitly scoped own inputs only. */
export function createBossVenue(scene:T.Scene,arena:BossArena,kind:BossKind,players:Player[],me:string,initialProduct?:BossVenueFrame['product']){
 const k=locationKit(scene,`boss-venue-${kind}`),{root,block,sign,model}=k,props=new T.Group();root.add(props);
 if(arena.crewParent)arena.crewParent.add(root);
 const stations=players.map((_,i)=>bossStation(i,players.length,kind==='kraken')),pickables:T.Object3D[]=[],ports:T.Mesh[]=[],local=players.findIndex(p=>p.id===me),gates:T.Group[]=[];
 const ownDice=new T.Group();ownDice.name='private-colossus-dice';root.add(ownDice);
 const runeDice=kind==='colossus'&&local>=0?createRuneDice(ownDice,k):undefined;
 if(runeDice)pickables.push(...runeDice.dice);
 const charge=kind==='colossus'?createColossusRuneCharge(k,players,stations):undefined;
 let ownNumbers:T.Mesh|undefined;
 players.forEach((player,i)=>{
  const p=stations[i],y=kind==='kraken'?.76:.03,workZ=p.z+(kind==='colossus'?.65:-.52);
  if(kind!=='kraken'){const pedestal=block(kind==='colossus'?'personal-rune-stone':'personal-treasure-plinth','#6b7473',[p.x,y+.16,workZ],[.72,.3,.7]);if(i===local&&kind==='dragon'){pedestal.userData.dynamic=true;pedestal.userData.pick='price';pickables.push(pedestal);}}
  const port=block('public-ready-sigil',player.color,[p.x,y+.32,workZ],[.3,.05,.25]);port.userData.dynamic=true;port.name=`public-ready-${i}`;ports.push(port);
  if(i===local&&kind==='colossus'){
   ownDice.position.set(p.x,y+.46,workZ);
   ownNumbers=sign('DEIN WURF',[p.x,y+.25,workZ+.45],.85,.19,'#f2e3be','#395a60');
   const roll=block('own-rune-roll','#d6bb78',[p.x-.35,y+.4,workZ+.4],[.22,.12,.22]);roll.userData.dynamic=true;roll.userData.pick='roll';pickables.push(roll);
   sign('WURF',[p.x-.35,y+.4,workZ+.515],.22,.09,'#263c43','#d6bb78');
   const strike=block('own-rune-strike','#b4cfae',[p.x+.45,y+.4,workZ+.4],[.3,.18,.3]);strike.userData.dynamic=true;strike.userData.pick='strike';pickables.push(strike);
   sign('ANGRIFF',[p.x+.45,y+.4,workZ+.555],.3,.1,'#263c43','#b4cfae');
  }
 });
 if(kind==='colossus'){
  for(let i=0;i<3;i++){const gate=new T.Group();gate.name=`temple-phase-seal-${i}`;gate.position.set((i-1)*2.45,2.4,-6.9);root.add(gate);block('runic-gate-slab','#627878',[0,0,0],[2.1,4.6,.3],gate);for(let j=0;j<3;j++)block('temple-rune-inlay','#b0c5a0',[0,-1.2+j*1.1,.18],[.8,.11,.04],gate);gates.push(gate);}
  for(const side of[-1,1])model('nature/rock_largeC',[side*7.3,-.05,-3.2],3.2,side,props);
 }
 const placementTasks:Promise<unknown>[]=[];
 const dragonAltar=kind==='dragon'?createDragonAltar(k):undefined;
 if(dragonAltar){placementTasks.push(dragonAltar.ready);pickables.push(...dragonAltar.pickables);dragonAltar.ready.then(()=>{for(const p of dragonAltar.pickables)if(!pickables.includes(p))pickables.push(p);},()=>{});}
 const cannonModels:T.Group[]=[],cannonErrors:string[]=[];
 if(kind==='kraken'){
  placementTasks.push(model('watercraft/ship-hull',[0,0,5.1],1,Math.PI/2,props).then(hull=>{if(!hull)return;const scale=14/hull.userData.nativeSize[2];hull.scale.setScalar(scale);hull.position.y=.75-2.1*scale;root.userData.hullLength=14;}));
  stations.forEach((p,i)=>{const deck=block('reinforced-gun-platform',i===local?'#b29a6f':'#8a7d62',[p.x,.725,p.cannonZ+.5],[Math.min(.94,p.spacing*.94),.06,1.65]);if(i===local){deck.userData.dynamic=true;deck.userData.pick='cannon';pickables.push(deck);}});
  arena.cannons?.forEach((gun,i)=>{
   const fallback=[...gun.children];
   placementTasks.push(k.models.place({id:'props/ship-cannon',parent:gun,position:[0,0,0],origin:'authored',name:`authored-kraken-cannon-${i}`}).then(body=>{
    if(!body)return;fallback.forEach(object=>object.visible=false);cannonModels[i]=body;gun.userData.authoredCannon=true;
    // Hidden original siblings remain in the arena owner's disposal traversal.
    if(i===local)body.traverse(object=>{if(object instanceof T.Mesh){object.userData.pick='cannon';pickables.unshift(object);}});
   }).catch(()=>cannonErrors.push('props/ship-cannon')));
  });
 }
 if(kind==='kraken'&&local>=0)arena.cannons?.[local]?.traverse(object=>{if(object instanceof T.Mesh){object.userData.pick='cannon';pickables.unshift(object);}});
 let photo:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>|undefined,productName:T.Mesh|undefined,price:T.Mesh|undefined;
 const images=new Set<HTMLImageElement>();let productId='',source='',photoTexture:T.Texture|undefined,disposed=false;
 function loadProduct(product:BossVenueFrame['product']){
  if(!photo||!product?.image||typeof Image==='undefined')return Promise.resolve();productId=product.id;if(source===product.image){if(photo.visible)photo.userData.product=product.id;return Promise.resolve();}source=product.image;const expected=source;photo.visible=false;photo.userData.product='';
  return new Promise<void>(resolve=>{const image=new Image();images.add(image);image.onload=()=>{images.delete(image);if(!disposed&&expected===source){const canvas=document.createElement('canvas');canvas.width=500;canvas.height=380;const c=canvas.getContext('2d')!,fit=Math.min(500/image.naturalWidth,380/image.naturalHeight),w=image.naturalWidth*fit,h=image.naturalHeight*fit;c.fillStyle='#ffffff';c.fillRect(0,0,500,380);c.drawImage(image,(500-w)/2,(380-h)/2,w,h);photoTexture?.dispose();photoTexture=new T.CanvasTexture(canvas);photoTexture.colorSpace=T.SRGBColorSpace;photo!.material.map=photoTexture;photo!.material.needsUpdate=true;photo!.visible=true;photo!.userData.product=productId;}resolve();};image.onerror=()=>{images.delete(image);resolve();};image.src=expected;});
 }
 if(kind==='dragon'){
  block('treasure-product-altar','#746347',[-4.65,.72,.5],[2.8,1.4,1.8]);block('altar-gold-trim','#bba064',[-4.65,1.45,.5],[3,.12,2]);
  const geometry=new T.PlaneGeometry(2.5,1.9);k.geometries.add(geometry);photo=new T.Mesh(geometry,new T.MeshBasicMaterial({color:'#ffffff',toneMapped:false}));photo.position.set(-4.65,3.4,.8);photo.name='actual-dragon-price-product';photo.userData.pick='price';root.add(photo);pickables.unshift(photo);
  productName=sign('DER SCHATZPREIS',[-4.65,4.65,.8],4.2,.45,'#f0ddb1','#514936');price=sign('PREIS VERSCHLOSSEN',[-4.65,2.15,2.4],2.5,.32,'#e7d4a6','#514936');
  for(const side of[-1,1])model('nature/rock_largeA',[side*7.4,-.15,-2.5],3.5,side,props);
 }
 let release=()=>{};const ready=Promise.all([k.ready(),loadProduct(initialProduct),...placementTasks]).then(()=>{if(!disposed){release=batchStaticMeshes(props);if(kind==='kraken'){root.userData.cannonAssetsReady=cannonModels.filter(Boolean).length;root.userData.assetErrors=[...(root.userData.assetErrors??[]),...cannonErrors];root.userData.assetsReady=root.userData.assetErrors.length===0;}}});
 return {...k,pickables,ready,dragonFrame:()=>dragonAltar?.snapshot(),cannonFrame(){return cannonModels.map((body,i)=>{const meshes:T.Mesh[]=[];body.traverse(object=>{if(object instanceof T.Mesh)meshes.push(object);});return {index:i,asset:body.userData.asset,width:body.userData.nativeSize[0]*body.scale.x,scale:body.scale.x,meshes:meshes.length,geometry:meshes[0]?.geometry.uuid,material:(meshes[0]?.material as T.Material)?.uuid,muzzle:body.localToWorld(new T.Vector3(0,.455,-.72)).toArray(),floor:body.localToWorld(new T.Vector3(0,-.09,0)).toArray()};});},update(f:BossVenueFrame){
  const reveal=['roundReveal','done'].includes(f.stage);ports.forEach((port,i)=>{const row=reveal?f.outcomes.find(o=>o.id===players[i].id):undefined,lit=!!f.submitted[players[i].id];port.scale.y=lit?.16:.05;port.material=k.mat(row&&Number(row.damage)>0?'#efd391':lit?'#b4d2ad':players[i].color);});
  ownDice.visible=kind==='colossus'&&local>=0&&!!f.mineDice?.rolls;root.userData.ownRoll=runeDice?.update(f.mineDice?.dice??[],f.mineDice?.held??[],f.mineDice,f.now??0,!!f.motion);root.userData.runeCharge=charge?.update(f);ownNumbers?.userData.setText(root.userData.ownRoll?.rolling?'RUNENWURF …':f.mineDice?.rolls?(f.mineDice.dice??[]).join(' · '):'DEIN WURF');
  gates.forEach((gate,i)=>{gate.position.y=i<f.phase?-3:2.4-(i===f.phase?f.breakProgress*5.4:0);gate.visible=gate.position.y>=0;});
  pickables.forEach(p=>{p.userData.pickDisabled=!f.active||(p.userData.pick==='roll'&&(Number(f.mineDice?.rolls)>=3||f.mineDice?.held?.every(Boolean)))||(p.userData.pick==='strike'&&!f.mineDice?.rolls)||(String(p.userData.pick).startsWith('hold')&&(!f.mineDice?.rolls||f.mineDice.rolls>=3));});
  if(photo){void loadProduct(f.product);const name=f.product?.name??'DER SCHATZPREIS';productName?.userData.setText(name.length>40?`${name.slice(0,39).trimEnd()}…`:name);price?.userData.setText(reveal&&f.elapsed>=2.8&&typeof f.price==='number'?`${(f.price/100).toFixed(2)} €`:'PREIS VERSCHLOSSEN');root.userData.product=photo.userData.product??'';root.userData.priceVisible=reveal&&f.elapsed>=2.8&&typeof f.price==='number';}
  dragonAltar?.update({now:f.now??0,risk:f.mineDragon?.risk??'safe',guess:f.mineDragon?.guess,active:!!f.active,motion:!!f.motion,sealed:!!f.mineDragon?.sealed});
  if(productName)productName.scale.x=f.portraitFocus?.6:1;
  if(productName)productName.visible=!f.portraitFocus;
  if(price)price.scale.x=f.portraitFocus?.77:1;
  root.userData.readyCount=players.filter(p=>f.submitted[p.id]).length;root.userData.ownDice=ownDice.visible?f.mineDice?.dice??[]:[];root.userData.ownHeld=ownDice.visible?f.mineDice?.held??[]:[];root.userData.phase=f.phase;root.userData.phaseSeals=gates.filter(g=>g.position.y>0).length;

 },dispose(){disposed=true;release();images.forEach(image=>{image.onload=null;image.onerror=null;image.src='';});images.clear();photoTexture?.dispose();runeDice?.dispose();charge?.dispose();dragonAltar?.dispose();k.dispose();}};
}
