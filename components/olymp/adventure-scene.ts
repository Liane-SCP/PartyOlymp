import {diceRollAge} from '@/lib/dice-presentation';
import {auctioneer} from '@/lib/auction-presentation';
import {colorPlates} from '@/lib/color-presentation';
import {createSizeMuseum} from "./size-museum";
import {createGeoExpedition} from "./geo-expedition";
import {createColorLaboratory} from "./color-laboratory";
import {createPictureStudio} from "./picture-studio";
﻿import {createPicnicPark} from "./picnic-park";
import {createSpectrumStation} from "./spectrum-station";
import {createWikiLibrary} from "./wiki-library";
import {createBombWorkshop} from "./bomb-workshop";
import {createExpeditionLocation} from "./expedition-location";
import {createIdeasAtelier} from "./ideas-atelier";
import {createVaultLocation} from "./vault-location";
import {createAuctionLocation} from "./auction-location";
import {createObservatoryLocation} from "./observatory-location";
import {createCardTablePresentation} from "./card-table-presentation";
import {casinoPlaceFrame,casinoActionPosition} from '@/lib/casino-place';
import {handValue} from "@/lib/game/games/blackjack";
import {createCasinoLocation} from "./casino-location";
import {createTreehouseLocation} from "./treehouse-location";
import {raceFinishes,raceFinishTitle} from "@/lib/race-presentation";
import {referenceMoments} from "@/lib/reference-moments";
import type * as Three from "three";
import { createShopWalk } from "./shop-walk";
import { shoppingPresentation } from "./shopping-presentation";
import { createSalon } from "./salon-scene";
import {RaceMotorDrive} from '@/lib/race-motor-drive';
import { createDepartmentStore } from "./department-store";
import {checkoutLayout} from "@/lib/checkout-layout";
import {createShoppingDisplays,shoppingPickLayer} from './shopping-displays';
import type {AudioPoint,SceneAudioFrame} from '@/lib/scene-spatial-audio';
import {createCasinoTable} from './casino-table';
import {createColorCardTable} from './color-card-table';
import {colorCardMarks,colorCardNames} from '@/lib/color-table-presentation';
import {casinoDealer,casinoPresentation} from '@/lib/casino-presentation';
import { createCoastalRace } from "./coastal-race";
import { adventureThemes, adventureProgress, bounded, type AdventureId } from "@/lib/adventure";
import { createIslandTerrain } from "./journey-terrain";
import { createMapCharacter, type MapCharacter } from "./journey-characters";
const hues=["#ed9caa","#8bcde4","#bedb99","#ebc187","#b9a6e5","#95d3b9"];
export function createAdventureScene(T:typeof Three,id:AdventureId,crew:MapCharacter[],me:string) {
  const theme=adventureThemes[id]??adventureThemes.hub,scene=new T.Scene(),geometry=new Set<Three.BufferGeometry>(),materials=new Set<Three.Material>(),textures=new Set<Three.Texture>();
  const skyData=new Uint8Array(128*4);for(let y=0;y<128;y++){const c=new T.Color("#496573").lerp(new T.Color(theme.sky),y/127);skyData.set([Math.round(c.r*255),Math.round(c.g*255),Math.round(c.b*255),255],y*4);}const sky=new T.DataTexture(skyData,1,128);sky.needsUpdate=true;sky.magFilter=T.LinearFilter;textures.add(sky);scene.background=sky;scene.fog=new T.FogExp2(theme.sky,0.009);
  const geo=<G extends Three.BufferGeometry>(g:G)=>{geometry.add(g);return g;};
  const palette=new Map<string,Three.MeshStandardMaterial>();
  const mat=(color:string,metal=false,emissive=false)=>{const key=`${color}:${metal}:${emissive}`;if(!palette.has(key)){const m=new T.MeshStandardMaterial({color,roughness:metal?0.32:0.82,metalness:metal?0.65:0.03,...(emissive?{emissive:color,emissiveIntensity:0.45}:{})});palette.set(key,m);materials.add(m);}return palette.get(key)!;};
  const box=geo(new T.BoxGeometry(1,1,1)),cyl=geo(new T.CylinderGeometry(1,1,1,32)),ball=geo(new T.SphereGeometry(1,24,16)),crystal=geo(new T.OctahedronGeometry(1)),torus=geo(new T.TorusGeometry(1,0.045,8,64));
  const cream=mat("#e0dbca"),rock=mat("#526f77"),gold=mat("#d6ad64",true),ink=mat("#162d40"),accent=mat(theme.accent,false,true),wood=mat("#795e51");
  const scenery=new T.Group();scene.add(scenery);const arena=new T.Group();arena.name=`adventure-${theme.mechanic}`;scene.add(arena);
  const group=(parent:Three.Object3D,name:string,x=0,y=0,z=0)=>{const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;};
  const mesh=(parent:Three.Object3D,g:Three.BufferGeometry,m:Three.Material,x:number,y:number,z:number,sx:number,sy=sx,sz=sx)=>{const o=new T.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;};
  const block=(p:Three.Object3D,m:Three.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>mesh(p,box,m,x,y,z,w,h,d);
  const disc=(p:Three.Object3D,m:Three.Material,x:number,y:number,z:number,r:number,h:number)=>mesh(p,cyl,m,x,y,z,r,h,r);
  const ring=(p:Three.Object3D,m:Three.Material,x:number,y:number,z:number,r:number,flat=false)=>{const o=mesh(p,torus,m,x,y,z,r);if(flat)o.rotation.x=Math.PI/2;return o;};
  const labels:{set:(s:string)=>void;object:Three.Mesh}[]=[];
  function label(parent:Three.Object3D,name:string,x:number,y:number,z:number,w=3,h=0.7,color=theme.accent){
    const material=new T.MeshBasicMaterial({transparent:true,depthWrite:false,side:T.DoubleSide});materials.add(material);
    const object=mesh(parent,geo(new T.PlaneGeometry(w,h)),material,x,y,z,1);object.name=name;object.castShadow=false;object.receiveShadow=false;
    let previous="";let context:CanvasRenderingContext2D|null=null,canvas:HTMLCanvasElement|undefined,texture:Three.CanvasTexture|undefined;
    if(typeof document!=="undefined"){canvas=document.createElement("canvas");canvas.width=Math.min(768,Math.max(128,Math.round(w*80)));canvas.height=Math.round(canvas.width*h/w);context=canvas.getContext("2d");texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.add(texture);material.map=texture;}
    const item={object,set(s:string){s=String(s??"").slice(0,70);if(s===previous)return;previous=s;object.userData.text=s;if(!context||!canvas||!texture)return;context.clearRect(0,0,canvas.width,canvas.height);context.fillStyle=color;context.textAlign="center";context.textBaseline="middle";context.font=`600 ${Math.min(canvas.height*0.65,canvas.width/Math.max(6,s.length)*1.65)}px system-ui`;if(name.startsWith("die-")){const pips=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]][Number(s)]??[];for(const pip of pips){context.beginPath();context.arc(canvas.width*(.24+(pip%3)*.26),canvas.height*(.24+Math.floor(pip/3)*.26),Math.min(canvas.width,canvas.height)*.075,0,Math.PI*2);context.fill();}}else context.fillText(s,canvas.width/2,canvas.height/2,canvas.width-24);texture.needsUpdate=true;}};labels.push(item);return item;
  }
  const pickables:Three.Object3D[]=[];const clickable=(o:Three.Object3D,key:string)=>{o.userData.pick=key;pickables.push(o);};
  const pedestal=(p:Three.Object3D,x:number,z:number,r=2,h=0.6)=>{disc(p,rock,x,h/2+0.2,z,r,h);disc(p,gold,x,h+0.22,z,r+0.03,0.08);disc(p,cream,x,h+0.31,z,r*0.96,0.12);};
  scene.add(new T.HemisphereLight(0xc7e7f1,0x454b3e,1.6));const sun=new T.DirectionalLight(0xffe5b3,2.6);sun.position.set(-12,22,16);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:70});sun.shadow.normalBias=.075;sun.shadow.bias=-.0007;sun.shadow.camera.updateProjectionMatrix();scene.add(sun);const rim=new T.DirectionalLight(theme.accent,2);rim.position.set(12,10,-12);scene.add(rim);
  if(!["dice","budget","typer","cards","blackjack","code","auction","timing","bomb","chain","categories","herd","spectrum","wiki","color","picture","geo","size"].includes(id)){
  const terrain=geo(createIslandTerrain(T,13,7,theme.stone)),landMat=new T.MeshStandardMaterial({vertexColors:true,roughness:0.95});materials.add(landMat);mesh(scenery,terrain,landMat,0,0,0,1);
  disc(scenery,rock,0,0.25,0,10.2,0.32);disc(scenery,cream,0,0.44,0,9.9,0.12);ring(scenery,gold,0,0.52,0,9.8,true);ring(scenery,gold,0,0.53,0,8.8,true);
  for(let k=0;k<15;k++){const a=Math.PI+k/14*Math.PI,x=Math.cos(a)*10.5,z=Math.sin(a)*10.5;disc(scenery,cream,x,1.9,z,0.3,2.8);disc(scenery,gold,x,3.4,z,0.48,0.2);if(k%3===0){mesh(scenery,crystal,accent,x,4.1,z,0.23,0.5,0.23);}}
  for(const side of[-1,1]){disc(scenery,cream,side*6.2,4.1,-7.6,0.55,7.3);disc(scenery,gold,side*6.2,7.9,-7.6,0.8,0.3);block(scenery,cream,side*6.2,1,-7.6,1.6,0.6,1.6);block(scenery,mat(theme.accent),side*6.9,5.9,-7.4,1,2.6,0.12);}
  block(scenery,cream,0,8.6,-7.6,14.4,0.7,1.3);block(scenery,gold,0,9,-7.6,14.8,0.12,1.5);const halo=ring(scenery,gold,0,7.5,-9.7,5.5);halo.rotation.z=0.2;
  for(let k=0;k<9;k++){const a=k*2.399,r=12.4;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(z>5)continue;disc(scenery,wood,x,0.7,z,0.13,1.5);for(let j=0;j<3;j++)mesh(scenery,ball,mat(["#638a76","#87a17d","#a3b385"][j]),x+Math.sin(j*2.4)*0.4,1.7+j*0.4,z+Math.cos(j*2.4)*0.35,0.8,0.9,0.75);}
  }
  const salon=id==="dice"?createSalon(scene,crew,me):null;
  const store=id==="budget"?createDepartmentStore(scene,crew.length):null;
  const race=id==="typer"?createCoastalRace(scene,crew.map(p=>p.color)):null;
  const casino=id==="blackjack"?createCasinoLocation(scene,crew.length):null;
  const treehouse=id==="cards"?createTreehouseLocation(scene,crew.length):null;
  const vault=id==="code"?createVaultLocation(scene,crew.length):null;
  const auction=id==="auction"?createAuctionLocation(scene,crew.length):null;
  const observatory=id==="timing"?createObservatoryLocation(scene,crew.length):null;
  const workshop=id==="bomb"?createBombWorkshop(scene,crew.length):null;
  const expedition=id==="chain"?createExpeditionLocation(scene,crew.length):null;
  const atelier=id==="categories"?createIdeasAtelier(scene,crew.length):null;
  const park=id==="herd"?createPicnicPark(scene,crew.length):null;
  const station=id==="spectrum"?createSpectrumStation(scene,crew.map(c=>c.color)):null;
  const museum=id==="size"?createSizeMuseum(scene,crew,me):null;
  const travel=id==="geo"?createGeoExpedition(scene,crew,me):null;
  const laboratory=id==="color"?createColorLaboratory(scene,crew,me):null;
  const studio=id==="picture"?createPictureStudio(scene,crew,me):null;
  const picturePlaceholder=studio?new T.DataTexture(new Uint8Array([255,255,255,255]),1,1):null;
  if(picturePlaceholder){picturePlaceholder.colorSpace=T.SRGBColorSpace;picturePlaceholder.needsUpdate=true;textures.add(picturePlaceholder);(studio!.screen.material as Three.MeshBasicMaterial).map=picturePlaceholder;}
  const releasePictureMap=(material:Three.MeshBasicMaterial)=>{if(material.map&&material.map!==picturePlaceholder){textures.delete(material.map);material.map.dispose();}};
  const library=id==="wiki"?createWikiLibrary(scene,crew.length):null;
  const glowPixels=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const j=(y*64+x)*4,d=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);glowPixels[j]=glowPixels[j+1]=glowPixels[j+2]=255;glowPixels[j+3]=Math.round(Math.max(0,1-d)**2.5*255);}const glowTexture=new T.DataTexture(glowPixels,64,64);glowTexture.needsUpdate=true;textures.add(glowTexture);const haloMat=new T.SpriteMaterial({map:glowTexture,color:theme.accent,transparent:true,opacity:.26,blending:T.AdditiveBlending,depthWrite:false});materials.add(haloMat);const aura=new T.Sprite(haloMat);aura.position.set(0,8,-10);aura.scale.set(21,21,1);scene.add(aura);const cloudMat=new T.SpriteMaterial({map:glowTexture,color:"#d3e4de",transparent:true,opacity:.15,depthWrite:false});materials.add(cloudMat);for(let k=0;k<8;k++){const cloud=new T.Sprite(cloudMat);cloud.position.set(Math.sin(k*4.7)*27,-5-k%3*2,-15+Math.cos(k*3.2)*15);cloud.scale.set(18,4,1);scene.add(cloud);}
  if(!store&&!museum&&!casino&&!atelier&&!laboratory&&!vault&&!library&&!studio&&!workshop&&!station&&!park&&!treehouse&&!expedition&&!travel)for(let k=0;k<10;k++){const a=k*2.4;mesh(scenery,crystal,rock,Math.cos(a)*(16+k%3*3),-4-k%4*2,Math.sin(a)*(17+k%3*4),0.7,1.8,0.9);}
  const starPositions=new Float32Array(180*3);for(let k=0;k<180;k++){starPositions[k*3]=Math.sin(k*12.7)*60;starPositions[k*3+1]=5+(k%31);starPositions[k*3+2]=-15-Math.cos(k*7.3)*45;}
  const starMat=new T.PointsMaterial({color:theme.accent,size:0.07,transparent:true,opacity:0.65});materials.add(starMat);const starGeo=geo(new T.BufferGeometry());starGeo.setAttribute("position",new T.BufferAttribute(starPositions,3));const stars=new T.Points(starGeo,starMat);scene.add(stars);if(salon||casino||vault||auction||observatory||workshop||atelier||station||library||laboratory||studio||museum){stars.visible=false;aura.visible=false;scene.background=new T.Color("#344d51");scene.fog=null;sun.color.set("#ffe9c8");}
  if(laboratory){scene.background=new T.Color('#456573');sun.color.set('#eff4ef');sun.intensity=2;rim.color.set('#dcece2');rim.intensity=.6;scene.traverse(o=>{if(o instanceof T.Sprite&&o.material===cloudMat)o.visible=false;});}
  if(treehouse){stars.visible=false;aura.visible=false;scene.background=new T.Color('#3d5b5e');scene.fog=new T.Fog('#3d5b5e',45,90);sun.color.set('#ffe1b0');sun.intensity=2.1;rim.color.set('#c1d6c6');rim.intensity=.65;}
  if(travel){stars.visible=false;aura.visible=false;scene.background=new T.Color('#506e78');scene.fog=null;sun.color.set('#ffe7bd');sun.intensity=2.1;rim.color.set('#c2d8d5');rim.intensity=.65;scene.traverse(o=>{if(o instanceof T.Sprite&&o.material===cloudMat)o.visible=false;});}
  if(atelier){scene.background=new T.Color('#596d6b');sun.color.set('#fff0d3');sun.intensity=2.1;rim.color.set('#d6e1da');rim.intensity=.65;scene.traverse(o=>{if(o instanceof T.Sprite&&o.material===cloudMat)o.visible=false;});}
  if(workshop){scene.background=new T.Color('#3c5052');sun.color.set('#ffe4bb');sun.intensity=2.1;rim.color.set('#becfc9');rim.intensity=.65;scene.traverse(o=>{if(o instanceof T.Sprite&&o.material===cloudMat)o.visible=false;});}
  if(station){scene.background=new T.Color('#788e91');sun.color.set('#ffe6bf');sun.intensity=2.1;rim.color.set('#c6dcdf');rim.intensity=.65;scene.traverse(o=>{if(o instanceof T.Sprite&&o.material===cloudMat)o.visible=false;});}
  if(salon){scene.background=new T.Color('#4b5149');sun.color.set('#ffe2ad');sun.intensity=2.1;rim.color.set('#c1d0c7');rim.intensity=.65;}
  if(casino){scene.background=new T.Color('#2c413d');sun.color.set('#ffe7bb');sun.intensity=2.05;rim.color.set('#c3d0c8');rim.intensity=.65;scene.traverse(o=>{if(o instanceof T.Sprite&&o.material===cloudMat)o.visible=false;});}
  if(vault){scene.background=new T.Color('#2e454d');sun.color.set('#ffe5bd');sun.intensity=2.1;rim.color.set('#b8d2d5');rim.intensity=.65;scene.traverse(o=>{if(o instanceof T.Sprite&&o.material===cloudMat)o.visible=false;});}
  if(library){scene.background=new T.Color('#45565c');sun.color.set('#ffe8c4');sun.intensity=2.1;rim.color.set('#c6dbd3');rim.intensity=.65;scene.traverse(o=>{if(o instanceof T.Sprite&&o.material===cloudMat)o.visible=false;});}
  if(store){stars.visible=false;aura.visible=false;scene.background=new T.Color('#70877d');scene.fog=null;sun.color.set('#fff0d7');sun.intensity=2.2;rim.color.set('#e9efe6');rim.intensity=.55;scene.traverse(o=>{if(o instanceof T.Sprite&&o.material===cloudMat)o.visible=false;});}
  if(studio){scene.background=new T.Color('#15243c');sun.color.set('#e6edff');sun.intensity=2.2;rim.color.set('#e7bd89');rim.intensity=.8;scene.traverse(o=>{if(o instanceof T.Sprite&&o.material===cloudMat)o.visible=false;});}
  if(park){stars.visible=false;aura.visible=false;scene.background=new T.Color('#9ec3b9');scene.fog=null;sun.color.set('#fff0cf');sun.intensity=2.1;rim.intensity=.7;}
  if(expedition){stars.visible=false;aura.visible=false;scene.background=new T.Color('#86acaa');scene.fog=new T.Fog('#86acaa',42,85);sun.color.set('#ffe8ba');sun.intensity=2.3;rim.color.set('#b7d4c4');rim.intensity=.65;scene.traverse(o=>{if(o instanceof T.Sprite&&o.material===cloudMat)o.visible=false;});}
  if(observatory){stars.visible=true;starMat.color.set("#e8dab6");scene.background=new T.Color("#152b46");sun.color.set("#c6d7e0");sun.intensity=1.8;rim.intensity=.8;}
  // Every stage owns real game objects, updated without rebuilding the renderer.
  const objects:Three.Object3D[]=[],values:ReturnType<typeof label>[]=[],aux:Three.Object3D[]=[];
  const casinoCards=casino?createCasinoTable(arena):null;
  const colorCards=treehouse?createColorCardTable(arena):null;
  const displays=store?createShoppingDisplays(arena,store.offerPositions,cream,wood,'#234b49'):null;
  const panel=(name:string,x:number,y:number,z:number,w:number,h:number)=>{const o=block(arena,ink,x,y,z,w,h,0.25);o.name=name;return o;};
  let casinoEquipment:Three.Group|null=null;const cards: {root:Three.Group;face:ReturnType<typeof label>;plate:Three.Mesh}[]=[];
  function card(x:number,z:number,index:number,back=false){const root=group(arena,`card-${index}`,x,1.7,z);root.rotation.x=-Math.PI/2+.08;const plate=block(root,back?ink:cream,0,0,0,1.35,1.9,0.09);const face=label(root,`card-value-${index}`,0,0,0.065,1.2,1.55,"#16394a");clickable(plate,`card:${index}`);cards.push({root,face,plate});return root;}
  if(id==="hub"){pedestal(arena,0,0,4,1);for(let i=0;i<3;i++){const height=[2.4,3.5,1.7][i];block(arena,cream,(i-1)*2.6,height/2+1,0,2.4,height,2.4);label(arena,`podium-${i}`,(i-1)*2.6,2,-1+2.3,1.8,1.2).set(["II","I","III"][i]);}ring(arena,accent,0,7,-2.5,2.3);mesh(arena,crystal,gold,0,7,-2,0.9,1.5,0.9);}
  else if(salon){objects.push(salon.crewTable.dice);pickables.push(...salon.crewTable.pickables);}
  else if(id==="cards"||id==="blackjack"){const felt=mat("#245d54");disc(arena,wood,0,.9,0,6.9,1.1);disc(arena,gold,0,1.48,0,6.85,.12);disc(arena,felt,0,1.57,0,6.65,.08);if(casinoCards)cards.push(...casinoCards.cards);else if(!colorCards)for(let i=0;i<60;i++)card((i%40-4.5)*1.15,i<40?3.7:-2.4,i,i>=40);if(!casino&&!colorCards)for(let i=0;i<8;i++)disc(arena,mat(hues[i%6]),-5.5+(i%2)*0.55,1.69+Math.floor(i/2)*0.13,1,0.35,0.13);if(casino){casinoEquipment=group(arena,"casino-bank-equipment");const bankMat=block(casinoEquipment,gold,0,1.618,-.15,2.2,.012,1.7);bankMat.name='casino-bank-tray';block(casinoEquipment,ink,0,1.628,-.15,2.1,.012,1.6);block(casinoEquipment,wood,-2.8,1.68,-1.8,.95,.13,2.1);block(casinoEquipment,ink,-2.8,1.8,-2.1,.86,.13,1.3);}values.push(label(arena,"table-total",0,4,-2,6,1));if(casino||colorCards){values[0].object.position.set(0,1.654,1.4);values[0].object.rotation.x=-Math.PI/2;}}
  else if(vault){objects.push(...vault.dials);pickables.push(...vault.pickables);}
  else if(id==="typer"&&race){objects.push(...race.cars);values.push(label(arena,"race-title",0,7,-5,11,1));}
  else if(workshop){objects.push(workshop.bomb);pickables.push(...workshop.pickables);}
  else if(auction){pickables.push(...auction.pickables.filter(o=>o.userData.pick?.startsWith('auctionReview:')||o.userData.pick===`auctionBid:${crew.findIndex(c=>c.id===me)}`));objects.push(auction.gavelRig);}
  else if(observatory){objects.push(observatory.button);pickables.push(...observatory.pickables);}
  else if(travel){objects.push(travel.globe);pickables.push(...travel.pickables);}
  else if(studio){objects.push(studio.screen);pickables.push(...studio.pickables);}
  else if(laboratory){objects.push(...laboratory.plates);pickables.push(...laboratory.pickables);}
  else if(station){objects.push(station.own);pickables.push(...station.pickables);}
  else if(museum){objects.push(...museum.slots.map(s=>s.holder));pickables.push(...museum.pickables);}
  else if(displays){objects.push(...displays.stalls);pickables.push(...displays.photos);values.push(...displays.labels);}
  else if(library){pickables.push(...library.pickables);}
  else if(expedition){objects.push(expedition.bridge);pickables.push(...expedition.pickables);}
  else if(atelier){objects.push(...atelier.pads);pickables.push(...atelier.pickables);}
  else if(park){objects.push(...park.thoughts);pickables.push(...park.pickables);}
  else if(id==="fleet"){for(let i=0;i<8;i++){const ship=group(arena,`ship-${i}`,(i%4-1.5)*3.5,1,Math.floor(i/4)*4-2);mesh(ship,ball,wood,0,0,0,0.65,0.4,1.5);block(ship,gold,0,1.4,0,0.08,2.7,0.08);block(ship,cream,0.5,1.7,0,1,1.4,0.06);objects.push(ship);}}
  else {for(let i=0;i<42;i++){const o=block(arena,mat(hues[i%6]),(i%7-3)*1.1,0.8+Math.floor(i/7)*1.05,0,0.95,0.95,0.95);objects.push(o);}}

  if(store)pickables.push(...store.receiptGallery.pickables);
  const shopping=store?shoppingPresentation(store,objects,pickables,me,crew):null;
  const moments=id==='dice'||id==='typer'?referenceMoments(id,me,crew):null;
  let raceRound:unknown;
  const actors=crew.map((player,i)=>{const actor=createMapCharacter(T,player);actor.root.position.set((i-(crew.length-1)/2)*Math.min(1.4,14/Math.max(1,crew.length-1)),0.58,7.3+Math.abs(i-(crew.length-1)/2)*0.09);if(race)actor.root.children[1].visible=false;if(salon){const seat=(i-Math.max(0,crew.findIndex(p=>p.id===me))+crew.length)%crew.length;actor.root.position.copy(salon.seats[seat]);actor.root.position.y=1.4;actor.root.children[1].visible=false;}if(store)actor.root.position.copy(store.seats[i]);if(casino||treehouse){const local=Math.max(0,crew.findIndex(p=>p.id===me)),index=(i-local+(casino?Math.floor(crew.length/2):0)+crew.length)%crew.length;actor.root.position.copy((casino??treehouse)!.seats[index]);actor.root.children[1].visible=false;}if(vault||auction||observatory){const index=vault?(i-Math.max(0,crew.findIndex(c=>c.id===me))+crew.length)%crew.length:i;actor.root.position.copy((vault??auction??observatory)!.seats[index]);}if(workshop)actor.root.position.copy(workshop.seats[i]);if(atelier)actor.root.position.copy(atelier.seats[i]);if(expedition)actor.root.position.set(-10+(i%2)*1.3,.52,-2+Math.floor(i/2)*.9);if(park)actor.root.position.copy(park.seats[i]);if(station)actor.root.position.copy(station.seats[i]);if(library)actor.root.position.copy(library.seats[i]);if(laboratory)actor.root.position.copy(laboratory.seats[i]);if(studio)actor.root.position.copy(studio.seats[i]);if(travel)actor.root.position.copy(travel.seats[i]);if(museum)actor.root.position.copy(museum.seats[i]);scene.add(actor.root);return {...actor,id:player.id??`crew-${i}`};});
  const tablePresentation=id==="blackjack"?createCardTablePresentation(id,cards,me,mat):null;
  const dealer=casino||auction?createMapCharacter(T,casino?casinoDealer:auctioneer):null;if(dealer){dealer.root.name=casino?'casino-dealer':'auctioneer-host';if(casino)dealer.root.position.set(0,1.45,-5.6);else{dealer.root.position.set(-7.8,3.05,-5.7);dealer.root.scale.setScalar(1.3);}dealer.root.children[1].visible=false;scene.add(dealer.root);}
  const casinoSeats=actors.map((a,i)=>({id:a.id,position:a.root.position,color:crew[i].color}));let casinoWasReady:boolean|undefined;
  const casinoFormatter=casino?new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}):null,chipText=(value:any)=>casinoFormatter?.format(Number(value??0))??String(value??0);
  const tableSeats:{id:string;note:ReturnType<typeof label>;chips:Three.Mesh;ring:Three.Mesh}[]=[];
  if(casino||treehouse)actors.forEach((actor,i)=>{const pos=actor.root.position.clone().multiplyScalar(.75),note=label(arena,`table-player-${i}`,pos.x,1.8,pos.z,2.15,.55,"#efdba6");note.object.rotation.x=-Math.PI/2;const chips=disc(arena,mat(crew[i].color),pos.x+.55,1.7,pos.z,.24,.18),turn=ring(arena,gold,actor.root.position.x,.35,actor.root.position.z,.65,true);tableSeats.push({id:actor.id,note,chips,ring:turn});});
  const casinoActions:{root:Three.Group;key:string}[]=[];
  if(casino){for(const [i,text,key] of [[0,"KARTE ZIEHEN","casino:hit"],[1,"STEHEN BLEIBEN","casino:stand"],[2,"EINSATZ BESTÄTIGEN","casino:bet"]] as const){const p=group(arena,`casino-action-${i}`,i===2?0:i===0?-5.25:5.25,1.75,i===2?3.8:.2);const plate=block(p,mat(i===0?"#b2c99f":"#d6bd85"),0,0,0,i===2?4.3:2.6,.15,1.1);clickable(plate,key);const textFace=label(p,`casino-action-label-${i}`,0,.09,0,i===2?4:2.45,.65,"#213c39");textFace.object.rotation.x=-Math.PI/2;textFace.set(text);casinoActions.push({root:p,key});}}
  if(colorCards){pickables.push(...colorCards.pickables);treehouse!.directionWheel.visible=false;for(const [x,text]of [[-6.25,'<'],[6.25,'>']] as const){const note=label(arena,'card-page-label',x,1.89,4.1,.6,.65,'#203c3d');note.object.rotation.x=-Math.PI/2;note.set(text);aux.push(note.object);}const note=label(arena,'card-draw-label',-3.8,1.69,1.05,2,.45,'#efdba6');note.object.rotation.x=-Math.PI/2;note.set('ZIEHEN');}
  const shopWalk=store?createShopWalk(actors.find(a=>a.id===me)?.root):null;

  const burstPositions=new Float32Array(96*3),burstGeo=geo(new T.BufferGeometry());burstGeo.setAttribute("position",new T.BufferAttribute(burstPositions,3));const burstMat=new T.PointsMaterial({color:theme.accent,size:0.12,transparent:true,opacity:0,depthWrite:false});materials.add(burstMat);scene.add(new T.Points(burstGeo,burstMat));let pictureKey="",burstAt=-100,lastStage="";const burstOrigin=new T.Vector3();
  // Batch the scenery only. Interactive game objects and the crew remain live.
  scene.updateMatrixWorld(true);const batches=new Map<string,{g:Three.BufferGeometry;m:Three.Material;objects:Three.Mesh[]}>();scenery.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material))return;const key=o.geometry.uuid+o.material.uuid;const b=batches.get(key)??{g:o.geometry,m:o.material,objects:[] as Three.Mesh[]};b.objects.push(o);batches.set(key,b);});const instances:Three.InstancedMesh[]=[];
  for(const b of batches.values()){const m=new T.InstancedMesh(b.g,b.m,b.objects.length);b.objects.forEach((o,i)=>{m.setMatrixAt(i,o.matrixWorld);o.removeFromParent();});m.castShadow=true;m.receiveShadow=true;m.computeBoundingSphere();scene.add(m);instances.push(m);}
  let disposed=false;const pendingImages=new Set<HTMLImageElement>(),productSources=new Map<number,string>(),loadedProductSources=new Map<number,string>();let fullPicture="";
  const cardText=(c:any)=>c?.rank?`${["","A","2","3","4","5","6","7","8","9","10","J","Q","K"][c.rank]} ${["♠","♥","♦","♣"][c.suit]}`:c?(["0","1","2","3","4","5","6","7","8","9","⊘","⇄","+2","✦","+4"][c.value]??"?"):"✦";
  const audioPosition=new T.Vector3(),audioForward=new T.Vector3(),audioUp=new T.Vector3(),audioRotation=new T.Quaternion(),raceMotorDrive=race?new RaceMotorDrive():null;
  function audioPoint(object:Three.Object3D,dy=0):AudioPoint{object.getWorldPosition(audioPosition);return [audioPosition.x,audioPosition.y+dy,audioPosition.z];}
  return {scene,actors,dealer,pickables,objects,theme,pickLayer:museum?museum.pickLayer:colorCards?colorCards.pickLayer:displays?shoppingPickLayer:0,
    audioFrame(camera:Three.Camera):SceneAudioFrame{
      const anchors:Record<string,AudioPoint>={};
      if(salon){const f=scene.userData.diceCrew;for(const row of f?.rows??[])anchors['dice:'+row.id]=row.cup;anchors.dice=anchors['dice:'+me]??[0,1.8,3.9];const actor=actors.find(a=>a.id===(scene.userData.moment?.player??me));if(actor){const p=audioPoint(actor.root);anchors.diceCombo=[p[0]*.68,1.8,p[2]*.68];}}
      if(store){anchors.basket=audioPoint(store.basket,.7);const scanner=audioPoint(store.scanner);for(const name of ['checkoutScan','checkoutOver','checkoutClose','checkoutSuccess'])anchors[name]=scanner;}
      if(race){const driver=actors.find(a=>a.id===me),featured=actors.find(a=>a.id===scene.userData.moment?.player)??driver;if(driver){anchors.typeKey=audioPoint(driver.root,.15);anchors.typeError=anchors.typeKey;}if(featured)anchors.raceOvertake=audioPoint(featured.root,.15);anchors.raceFinish=audioPoint(race.finish,1);}
      if(colorCards){for(const cue of['card','cardReverse','cardSkip','cardPenalty','cardLast'])anchors[cue]=[0,1.9,-.8];}
      if(workshop){for(const [i,a] of actors.entries()){const station=workshop.stations[i];anchors[`bombHand:${a.id}`]=station.toArray() as AudioPoint;}anchors.fuse=audioPoint(workshop.bomb);anchors.explosion=anchors.fuse;anchors.wordReview=[0,4.7,-9.8];anchors.wordRejected=anchors.wordReview;}
      if(station){const f=scene.userData.spectrum,own=actors.find(a=>a.id===me);anchors.confirm=f?.psychic&&own?audioPoint(own.root,.9):[0,1.67,4.3];anchors.spectrumDial=[0,3.3,.4];anchors.spectrumReveal=[0,3.35,.4];}
      if(laboratory){anchors.colorMix=[0,2,4.4];anchors.colorClose=[-4,5.1,-6.5];anchors.colorReveal=colorPlates(!!scene.userData.colorLab?.compact,true)[0];for(const a of actors)anchors['colorSeal:'+a.id]=audioPoint(a.root,1);}
      if(travel){anchors.mapPin=[-5,4.1,0];anchors.geoReveal=[-5,4.1,0];for(const a of actors)anchors['geoSeal:'+a.id]=audioPoint(a.root,.6);}
      if(studio){for(const [i,a]of actors.entries())anchors['pictureBuzzer:'+a.id]=[studio.buttons[i].position.x,1.96,studio.buttons[i].position.z];anchors.pictureReveal=[0,6.3,-8.48];}
      if(library){anchors.wikiPage=[-10,2,6.1];for(const [i,a]of actors.entries())anchors['wikiArrival:'+a.id]=[(i-(actors.length-1)/2)*1.3,4.15,-4.5];}
      if(park){const own=actors.find(a=>a.id===me);anchors.confirm=own?audioPoint(own.root,1.9):[0,2,5.5];anchors.herdGather=[0,1.8,0];anchors.herdMatch=[0,1.8,0];anchors.herdTie=[0,1.8,0];}
      if(atelier){anchors.categoryVote=[0,4.8,-6.6];anchors.categoryResult=[0,4.8,-6.6];const own=actors.find(a=>a.id===me);anchors.confirm=own?audioPoint(own.root,.6):[0,1.8,8];anchors.atelierPage=anchors.confirm;}
      if(expedition){const active=actors.find(a=>a.id===scene.userData.chain?.rows.find((r:any)=>r.active)?.id);for(const cue of ['chainWord','chainChallenge'])anchors[cue]=active?audioPoint(active.root,.9):[-4,1.42,.8];const f=scene.userData.chain,p=f?.nextPoint;anchors.chainAccepted=p?[p[0],.7,p[2]]:[-3.45,.7,0];anchors.chainOut=[-6,.8,7.1];}
      if(observatory&&scene.userData.timing?.revealing){anchors.clockReveal=[0,4,-5.65];anchors.clockPerfect=[0,4,-5.65];}
      if(auction){for(const a of actors)anchors[`auctionBid:${a.id}`]=audioPoint(a.root,1.2);anchors.gavel=[-6.8,3.4,-4.4];for(const cue of['auctionWord','auctionJudge','auctionWin','auctionFail'])anchors[cue]=[-2.5,3.2,-3.5];}
      if(museum){anchors.sizeSelect=museum.slots[1].holder.position.toArray() as [number,number,number];anchors.sizeReveal=[0,3,-1.4];}
      if(vault){anchors.codeFeedback=[0,3.8,-6.2];anchors.confirm=[0,2,7.2];anchors.codeSelect=[0,3.45,.5];}
      if(casino){anchors.card=[-2.8,1.8,-1.8];anchors.dealer=[0,1.7,-2];anchors.suspense=anchors.dealer;anchors.casinoPayout=[0,1.671,-.15];for(const name of['stand','win','loss','bust'])anchors[name]=[0,1.7,4.35];}
      camera.getWorldDirection(audioForward);camera.getWorldQuaternion(audioRotation);audioUp.set(0,1,0).applyQuaternion(audioRotation);
      return {listener:audioPoint(camera),forward:audioForward.toArray() as AudioPoint,up:audioUp.toArray() as AudioPoint,anchors,...(race?{motors:scene.userData.raceMotors??[]}: {})};
    },rotateGlobe:(dx:number,dy:number)=>travel?.rotate(dx,dy),globePin:(p:Three.Vector3)=>travel?.pinFromWorld(p),setPanoramaView:(yaw:number,pitch:number,fov:number,aspect:number)=>travel?.setView(yaw,pitch,fov,aspect),navigate:(x:number,z:number)=>shopWalk?.go(x,z),walkStep:(dx:number,dz:number)=>shopWalk?.step(dx,dz),ready:Promise.all([salon?.ready,store?.ready,race?.ready,casino?.ready,treehouse?.ready,vault?.ready,auction?.ready,observatory?.ready,workshop?.ready,expedition?.ready,atelier?.ready,park?.ready,station?.ready,library?.ready,laboratory?.ready,studio?.ready,travel?.ready,museum?.ready]),
    setFullPicture(src:string){if(id!=="picture"||!src||fullPicture===src)return;fullPicture=src;const img=new Image();pendingImages.add(img);img.onload=()=>{pendingImages.delete(img);if(disposed||fullPicture!==src)return;const canvas=document.createElement("canvas");canvas.width=960;canvas.height=624;const c=canvas.getContext("2d")!;c.fillStyle="#142b3c";c.fillRect(0,0,960,624);const fit=Math.min(960/img.naturalWidth,624/img.naturalHeight),w=img.naturalWidth*fit,h=img.naturalHeight*fit;c.drawImage(img,(960-w)/2,(624-h)/2,w,h);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;textures.add(tex);const m=(objects[0] as Three.Mesh).material as Three.MeshBasicMaterial;releasePictureMap(m);m.map=tex;m.color.set("#ffffff");m.needsUpdate=true;objects[0].userData.pictureMode="revealed";};img.onerror=()=>pendingImages.delete(img);img.src=src.startsWith("/")||src.startsWith("data:")?src:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`;},
    productImageState:()=>({requested:productSources.size,ready:[...productSources].filter(([i,src])=>loadedProductSources.get(i)===src).length,pending:pendingImages.size}),
    setProducts(items:any[]){
      if(!displays)return;
      for(const i of productSources.keys())if(i>=Math.min(12,items.length)){displays.clearImage(i);productSources.delete(i);loadedProductSources.delete(i);}
      items.slice(0,12).forEach((item,i)=>{
        if(!item.image){if(productSources.has(i)){displays.clearImage(i);productSources.delete(i);loadedProductSources.delete(i);}return;}
        if(productSources.get(i)===item.image)return;
        displays.clearImage(i);productSources.set(i,item.image);
        const img=new Image();img.crossOrigin="anonymous";pendingImages.add(img);
        img.onload=()=>{pendingImages.delete(img);if(disposed||productSources.get(i)!==item.image)return;if(displays.setImage(i,img))loadedProductSources.set(i,item.image);};
        img.onerror=()=>pendingImages.delete(img);img.src=item.image;
      });
    },
    setWorld(data:any){travel?.setWorld(data);},
    prepareVariants(){return travel?.prepareVariants()??(()=>{});},
    setPicture(source:HTMLCanvasElement){if(id!=="picture"||!objects[0])return;fullPicture="";objects[0].userData.pictureMode="puzzle";const material=(objects[0] as Three.Mesh).material as Three.MeshBasicMaterial;if(!material.map||material.map.image!==source){releasePictureMap(material);const tex=new T.CanvasTexture(source);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;textures.add(tex);material.map=tex;material.color.set("#ffffff");material.needsUpdate=true;}material.map.needsUpdate=true;},
    update(t:number,now:number,game:any,draft:any={},reduced=false,emotes:any[]=[]){
      if(game.stage==='answer')shopWalk?.update(t,reduced);else shopWalk?.stop();
      const shopFrame=shopping?.update(t,now,game,draft,reduced);if(store)scene.userData.budgetReceipts=store.root.userData.budgetReceipts;
      const highlight=moments?.update(now/1000,game);scene.userData.moment=shopFrame?.moment??highlight?.moment??null;
      scene.userData.cameraFocus=store&&store.root.userData.shopping.customer&&!store.root.userData.shopping.summary?[...checkoutLayout.focus]:null;
      const cue=shopFrame?.cue??(highlight?.fresh?highlight.moment?.cue:null);if(cue){scene.userData.cue=cue;scene.userData.cueId=(scene.userData.cueId??0)+1;}
      if(highlight?.fresh){burstAt=t;const source=actors.find(a=>a.id===highlight.moment?.player);burstOrigin.copy(race?.finish.position??source?.root.position??new T.Vector3());}
      if(store&&shopFrame?.cue&&['checkoutClose','checkoutSuccess','checkoutComplete'].includes(shopFrame.cue)){burstAt=t;burstOrigin.copy(store.checkoutSpot);}
      const p=game.mine??{},reveal=["roundReveal","done","turnReveal","explosion"].includes(game.stage);
      if(lastStage&&lastStage!==game.stage&&reveal&&id!=='budget'&&id!=='dice'&&id!=='spectrum'&&id!=='wiki'&&id!=='picture'&&id!=='color'&&!casino&&!highlight?.fresh){burstAt=t;burstOrigin.set(0,0,0);}lastStage=game.stage;

      if(salon){const personal=draft.dicePersonal!==false,age=diceRollAge(p,now);scene.userData.diceRolling=!reduced&&age>=0&&age<.65;const f=salon.crewTable.update(game,now,reduced,personal,draft.diceResult);scene.userData.diceCrew=f;scene.userData.tableFaces=f.finished?Object.fromEntries(f.rows.map((row:any)=>[row.id,row.rank===1?4:5])):undefined;salon.updateScore(game.mine);}
      const casinoPlace=casino?casinoPlaceFrame(game,now,draft.casinoMode??'table',draft.casinoHandPage??0,draft.casinoDealerPage??null,me):null;
      if(tablePresentation){values[0]?.set(tablePresentation.update(t,game,reduced,now,casinoPlace??undefined));if(casino&&values[0]){const personal=casinoPlace?.mode==="hand";values[0].object.position.z=personal?2.4:1.4;values[0].object.scale.setScalar(personal?.8:1);}if(casinoEquipment)casinoEquipment.visible=casinoPlace?.mode!=="hand";if(dealer&&casino)dealer.root.visible=casinoPlace?.mode!=="hand";
       const frame=casino?casinoPresentation(game,now):null;
       if(casinoCards&&frame){const rendered=casinoCards.sync(game,now,casinoSeats,me,reduced,casinoPlace?.mode==="hand");scene.userData.casino={...rendered,dealerReady:!!dealer?.root.userData.avatarReady};scene.userData.tableFaces=Object.fromEntries(actors.map(a=>{const row=frame.rows.find((r:any)=>r.id===a.id);return [a.id,frame.ready?(row?.payout>row?.bet?4:row?.payout<row?.bet?6:7):game.status?.[a.id]?.stood?7:-1];}));scene.userData.tableFaces[casinoDealer.id]=frame.ready?(Number(frame.value)>21?23:4):-1;
        if(frame.revealing){scene.userData.cameraFocus=[0,1.9,-.8];const row=frame.rows.find((r:any)=>r.id===me),net=row?row.payout-row.bet:0;scene.userData.moment={key:`casino:${game.round}:${frame.ready?'payout':frame.visible}`,text:frame.ready?(!row?'AUSZAHLUNGEN':net>0?`GEWINN +${chipText(net)} CHIPS`:net<0?'DIE BANK GEWINNT':'GLEICHSTAND'):`DEALER · ${frame.value??'—'}`,detail:frame.ready?(row?`${chipText(row.payout)} Chips Auszahlung · Einsatz ${chipText(row.bet)}`:`${frame.rows.length} Blätter sind ausgewertet.`):'Die nächste Karte entscheidet …',player:frame.ready&&row?me:undefined,kind:frame.ready?'casino-payout':'dealer',reaction:net>0?4:net<0?6:7};}
        if(frame.ready&&casinoWasReady===false&&Number(frame.value)>21){burstAt=t;burstOrigin.set(0,1.7,0);}casinoWasReady=frame.ready;dealer?.update(t,false,scene.userData.tableFaces[casinoDealer.id],reduced);
       }
       tableSeats.forEach(seat=>{const status=game.status?.[seat.id],count=game.counts?.[seat.id]??0,row=frame?.rows.find((r:any)=>r.id===seat.id),name=crew.find(c=>c.id===seat.id)?.name??'CREW';seat.note.set(casino?`${name.slice(0,9)} · ${frame?.ready?`${chipText(row?.payout)} zurück`:status?.bet?status.value:'EINSATZ'}`:`${name} · ${count} ${count===1?'KARTE!':'KARTEN'}`);seat.note.object.visible=(!casino||seat.id!==me)&&casinoPlace?.mode!=='hand';seat.chips.visible=false;seat.ring.visible=!!treehouse&&game.turnId===seat.id;});casinoActions.forEach(action=>{const personal=casinoPlace?.mode==="hand";action.root.position.set(...casinoActionPosition(action.key,personal));action.root.scale.x=personal&&action.key!=="casino:bet"?.88:1;action.root.visible=!!game.mine&&game.stage==="answer"&&!p.stood&&!draft.casinoPending&&(action.key==="casino:bet"?!p.bet:!!p.bet);});if(casinoPlace)scene.userData.casino.place={mode:casinoPlace.mode,page:casinoPlace.page,pages:casinoPlace.pages,actions:casinoActions.filter(a=>a.root.visible).map(a=>({key:a.key,position:a.root.position.toArray()}))};}
      if(colorCards){const state=colorCards.sync(game,now,actors.map((a,i)=>({id:a.id,name:crew[i].name??'Crew',position:a.root.position,color:crew[i].color})),me,draft,reduced);scene.userData.colorTable=state.stats;scene.userData.tableFaces=state.faces;scene.userData.cameraFocus=[0,1.9,.3];scene.userData.moment=state.moment;if(state.cue){scene.userData.cue=state.cue;scene.userData.cueId=state.cueId;}values[0]?.set(colorCardMarks[state.frame.color]+' '+colorCardNames[state.frame.color].toUpperCase()+' '+(state.frame.direction===1?' >':' <'));aux.forEach(o=>o.visible=state.frame.pages>1&&!state.frame.personal&&!state.frame.viewOnly);actors.forEach(a=>a.root.visible=!(state.frame.personal&&a.id===me));tableSeats.forEach(seat=>{const count=game.counts?.[seat.id]??0,name=crew.find(c=>c.id===seat.id)?.name??'Crew';seat.note.set(name.slice(0,9)+' - '+count+(count===1?' KARTE!':' KARTEN'));seat.note.object.visible=seat.id!==me;seat.chips.visible=false;seat.ring.visible=game.stage==='answer'&&game.turnId===seat.id;});}

      if(id==="typer"&&race){if(raceRound!==game.round){raceRound=game.round;objects.forEach(o=>delete o.userData.visualProgress);}objects.forEach((o,i)=>{const progress=adventureProgress(game,crew[i]?.id??"",me),previous=o.userData.visualProgress??progress,visual=reduced?progress:previous+(progress-previous)*.15;race.position(i,visual);o.userData.visualProgress=visual;o.userData.progress=progress;});const finish=raceFinishes(game);race.badges.forEach((badge,i)=>{const entry=finish.find(f=>f.id===crew[i]?.id);badge.visible=!!entry;badge.position.copy(race.cars[i].position).add(new T.Vector3(0,2.2,0));if(entry)badge.userData.setText(`#${entry.place}`);});values[0]?.set(raceFinishTitle(game,crew));scene.userData.raceLayout=race.cars.map((car,i)=>({id:crew[i]?.id,width:car.userData.modelWidth,length:car.userData.modelLength,bodyMeshes:car.userData.bodyMeshes,boundsError:car.userData.boundsError,bodyGeometry:car.userData.bodyGeometry,spacing:race.laneSpacing,driverWidth:race.avatarScale*1.2,position:car.position.toArray(),heading:car.rotation.y}));}
      vault?.update(now,game,draft,reduced,crew,me);
      if(auction){auction.update(now,game,crew,me,reduced,draft);scene.userData.auction={...auction.root.userData.frame,hostReady:!!dealer?.root.userData.avatarReady,hostVisible:!draft.auctionBookFocused};scene.userData.tableFaces=Object.fromEntries(crew.map(c=>[c.id,game.stage==='roundReveal'&&game.leader===c.id?(game.reveal?.success?4:6):game.leader===c.id?7:-1]));if(scene.userData.auction.onStage&&scene.userData.auction.entrance?.progress===1)scene.userData.cameraFocus=[0,4,-5.5];const reaction=game.stage==='bid'?(game.bid>0?17:5):game.stage==='judge'?16:['roundReveal','done'].includes(game.stage)?(game.reveal?.success?4:23):14;scene.userData.tableFaces[auctioneer.id]=reaction;if(dealer){dealer.root.visible=!draft.auctionBookFocused;dealer.update(t,false,reaction,reduced);}}
      if(workshop){workshop.update(now,game,crew,reduced,me,!!draft.bombFocused);scene.userData.bomb=workshop.root.userData.frame;scene.userData.tableFaces=Object.fromEntries(crew.map(c=>[c.id,game.reveal?.winner===c.id?4:game.stage==='explosion'&&game.turnId===c.id?6:game.turnId===c.id?7:-1]));}
      if(observatory){observatory.update(now,game,me,crew,draft);scene.userData.timing=observatory.root.userData.frame;scene.userData.tableFaces=scene.userData.timing.reactions;if(scene.userData.timing.revealing)scene.userData.cameraFocus=[0,3,0];}
      travel?.update(now,game,draft,reduced);
      if(travel){const selected=travel.root.userData.highlight;for(const a of actors){const active=selected?.id===a.id,base=a.root.children[1] as Three.Mesh<Three.BufferGeometry,Three.MeshBasicMaterial>;a.root.userData.geoHighlighted=!!active;base.material.opacity=selected?(active?.95:.15):.4;base.scale.setScalar(active?1.5:1);}}
      if(laboratory){laboratory.update(now,game,draft,reduced);const f=laboratory.root.userData.frame;scene.userData.colorLab=f;scene.userData.tableFaces=Object.fromEntries(crew.map(c=>[c.id,f.revealed?(f.rows.find((r:any)=>r.id===c.id)?.score>=85?4:7):game.submitted?.[c.id??'']?7:-1]));}
      if(studio){const key=String(game.round)+':'+String(game.image);if(key!==pictureKey){pictureKey=key;fullPicture='';const m=studio.screen.material as Three.MeshBasicMaterial;releasePictureMap(m);m.map=picturePlaceholder;m.needsUpdate=true;m.color.set('#e2d2b2');studio.screen.userData.pictureMode='loading';}}
      if(studio){studio.update(now,game,reduced);scene.userData.picture=studio.root.userData.frame;scene.userData.tableFaces=Object.fromEntries(scene.userData.picture.rows.map((r:any)=>[r.id,r.solved?4:r.active?7:r.out?6:-1]));}
      if(station){station.update(now,game,draft,crew,me,reduced);scene.userData.spectrum=station.root.userData.frame;scene.userData.tableFaces=Object.fromEntries(scene.userData.spectrum.rows.map((r:any)=>[r.id,scene.userData.spectrum.revealed?(r.excluded?7:r.score>0?4:6):r.submitted?7:-1]));}
      if(museum){museum.update(game,draft,now,reduced);const f=museum.root.userData.frame;scene.userData.sizeMuseum=f;scene.userData.tableFaces=Object.fromEntries(f.rows.map((row:any)=>[row.id,f.revealed&&row.estimate!==null?(row.score>=85?4:7):-1]));if(museum.root.userData.cueId){scene.userData.cue=museum.root.userData.cue;scene.userData.cueId=museum.root.userData.cueId;}}
      if(id==="budget"){const list=game.offers??game.items??[];objects.forEach((o,i)=>{o.visible=i<list.length;const revealed=["roundReveal","done"].includes(game.stage)?game.reveal?.items?.find((item:any)=>item.id===list[i]?.id):undefined;values[i]?.set(revealed?`${(revealed.price/100).toFixed(2)} €`:list[i]?.name??list[i]?.title??"SCHATZ");const selected=(draft.basket??p.answer??[]).includes(list[i]?.id);o.userData.selected=selected;o.scale.setScalar(selected?.92:1);});displays?.sync();}
      if(library){library.update(now,game,crew,me,reduced,draft);scene.userData.wiki=library.root.userData.frame;scene.userData.tableFaces=Object.fromEntries(scene.userData.wiki.rows.map((r:any)=>[r.id,r.arrived?4:-1]));}
      if(expedition){expedition.update(now,game,crew,me,reduced,!!draft.chainFocused);scene.userData.chain=expedition.root.userData.frame;scene.userData.cameraFocus=[-4,2.2,1];scene.userData.tableFaces=Object.fromEntries(crew.map(c=>[c.id,game.reveal?.winner===c.id?4:game.lastOutcome?.player===c.id&&!game.lastOutcome?.valid?6:game.turnId===c.id?7:-1]));}
      if(atelier){atelier.update(game,draft,crew,me);scene.userData.cameraFocus=[0,3.5,0];const f=atelier.root.userData.frame;scene.userData.tableFaces=Object.fromEntries(f.rows.map((r:any)=>[r.id,f.summary?(r.score>0?4:6):r.ready?7:-1]));}
      if(park){park.update(now,game,crew,me,reduced,draft.herdGroup??-1);scene.userData.herd=park.root.userData.frame;scene.userData.tableFaces=Object.fromEntries(scene.userData.herd.rows.map((r:any)=>[r.id,scene.userData.herd.revealed?(r.score>0?4:r.missing?6:7):r.submitted?7:-1]));}
      salon?.updateAmbience(now/1000,reduced);
      const still=!!observatory&&game.stage==="answer"&&p.startedAt!=null&&!p.submitted;
      actors.forEach((a,i)=>{if(casino)a.root.visible=casinoPlace?.mode!=="hand";if(laboratory)a.root.visible=draft.view!=='sample'&&draft.view!=='results';a.root.userData.walking=false;if(salon)a.root.visible=!(draft.dicePersonal!==false&&a.id===me);if(museum){a.root.visible=museum.visible(a.id);a.root.position.copy(museum.position(i));const f=scene.userData.sizeMuseum;a.root.userData.walking=!!f?.revealed&&f.progress>0&&f.progress<1;}if(store){const status=store.root.userData.shopping;if(status.customer){const active=status.customer===a.id&&!status.summary,u=active?(reduced?1:Math.max(0,Math.min(1,(status.customerProgress??0)/.18))):0,ease=u*u*(3-2*u);a.root.position.copy(store.seats[i]);if(active)a.root.position.lerp(store.checkoutSpot,ease);a.root.userData.walking=active&&u>0&&u<1;}else if(a.id!==me)a.root.position.copy(store.seats[i]);}if(park){a.root.position.copy(park.position(i,a.id));a.root.userData.walking=scene.userData.herd?.moving;}if(library)a.root.visible=!draft.focused;if(library||station){const position=library?library.position(i,game,a.id):station!.position(i,game,a.id);a.root.userData.walking=a.root.position.distanceTo(position)>.08;if(reduced)a.root.position.copy(position);else a.root.position.lerp(position,.12);}if(workshop){a.root.position.copy(workshop.position(i));const row=scene.userData.bomb?.rows[i];a.root.userData.walking=!!row&&row.leaving>0&&row.leaving<1;}if(expedition){a.root.position.copy(expedition.position(i));const row=scene.userData.chain?.rows[i];a.root.userData.walking=row?.alive?scene.userData.chain?.moving:row?.leaving>0&&row?.leaving<1;}if(observatory)a.root.visible=!(draft.timingFocused&&scene.userData.timing?.revealing||draft.timingStation&&!scene.userData.timing?.revealing);if(auction){a.root.visible=!draft.auctionBookFocused;a.root.position.copy(auction.position(i,a.id));a.root.children[1].visible=game.leader===a.id&&scene.userData.auction.onStage;a.root.userData.walking=game.leader===a.id&&!!scene.userData.auction.entrance?.walking;}if(id==="typer"&&race&&objects[i]){a.root.position.copy(objects[i].position);a.root.position.y+=race.seatHeights[i];a.root.scale.setScalar(race.avatarScale);a.root.userData.heading=objects[i].rotation.y;}const reaction=emotes.findLast(e=>e.player===a.id&&now-e.at>=0&&now-e.at<4500);a.update(expedition||auction?now/1000:t,(a.id===me&&!!shopWalk?.walking)||!!a.root.userData.walking,reaction?.emote??scene.userData.tableFaces?.[a.id]??(scene.userData.moment?.player===a.id?(scene.userData.moment.reaction??4):store?(store.root.userData.shopping.summary?4:null):reveal||(id==="typer"&&game.racers?.[a.id]?.finishedAt!=null)?4:null),reduced||still);a.root.userData.progress=adventureProgress(game,a.id,me);});
      if(raceMotorDrive)scene.userData.raceMotors=raceMotorDrive.update(game,now,actors.map(a=>({id:a.id,position:audioPoint(a.root,.15)})),me);
      if(store){const status=store.root.userData.shopping;status.customerPosition=status.customer?actors.find(a=>a.id===status.customer)?.root.position.toArray()??null:null;}
      park?.follow(actors);station?.follow(actors);library?.follow(actors);
      const age=t-burstAt;burstMat.opacity=!reduced&&!still&&age>=0&&age<1.8?(1-age/1.8)*0.8:0;
      if(burstMat.opacity>0){for(let k=0;k<96;k++){const a=k*2.399;burstPositions[k*3]=burstOrigin.x+Math.cos(a)*age*(2+k%4);burstPositions[k*3+1]=3+burstOrigin.y+age*(4+k%5)-age*age*3;burstPositions[k*3+2]=burstOrigin.z+Math.sin(a)*age*(2+k%4);}burstGeo.attributes.position.needsUpdate=true;}
      if(!reduced&&id!=="timing")stars.rotation.y=t*0.003;
      scene.userData.stage=game.stage;scene.userData.mechanic=theme.mechanic;
    },
    dispose(){disposed=true;salon?.dispose();shopping?.dispose();displays?.dispose();store?.dispose();race?.dispose();casinoCards?.dispose();colorCards?.dispose();dealer?.dispose();casino?.dispose();treehouse?.dispose();vault?.dispose();auction?.dispose();observatory?.dispose();workshop?.dispose();expedition?.dispose();atelier?.dispose();park?.dispose();station?.dispose();library?.dispose();laboratory?.dispose();studio?.dispose();travel?.dispose();museum?.dispose();pendingImages.forEach(img=>{img.onload=null;img.onerror=null;img.src="";});pendingImages.clear();actors.forEach(a=>a.dispose());geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());instances.forEach(m=>m.dispose());}
  };
}
