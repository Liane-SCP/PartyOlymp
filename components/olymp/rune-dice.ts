import * as T from 'three';
import type {locationKit} from './location-kit';
import {runeRollFrame,type RuneHand} from '@/lib/colossus-runes';

const pips=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];

/** Two shared atlases keep each die to one draw call; only confirmed top values enter. */
export function createRuneDice(parent:T.Group,k:ReturnType<typeof locationKit>){
 const textures:T.Texture[]=[];
 const materials=[false,true].map(held=>{
  const material=new T.MeshStandardMaterial({color:held?'#e7c777':'#f1e9d3',roughness:.72});
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=288;canvas.height=192;const c=canvas.getContext('2d')!;
   c.fillStyle=held?'#e7c777':'#f1e9d3';c.fillRect(0,0,288,192);c.fillStyle='#263a40';
   for(let value=1;value<=6;value++)for(const pip of pips[value]){c.beginPath();c.arc(((value-1)%3)*96+23+(pip%3)*25,Math.floor((value-1)/3)*96+23+Math.floor(pip/3)*25,6.5,0,Math.PI*2);c.fill();}
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);material.map=texture;material.color.set('#ffffff');
  }
  return material;
 });
 const geometries=Array.from({length:6},(_,index)=>{
  const top=index+1,side=[1,2,3,4,5,6].find(n=>n!==top&&n!==7-top)!,front=[1,2,3,4,5,6].find(n=>![top,7-top,side,7-side].includes(n))!;
  const geometry=new T.BoxGeometry(.11,.11,.11),uv=geometry.getAttribute('uv'),faces=[side,7-side,top,7-top,front,7-front];
  for(let face=0;face<6;face++)for(let vertex=0;vertex<4;vertex++){const at=face*4+vertex,value=faces[face]-1;uv.setXY(at,((value%3)+uv.getX(at))/3,(1-Math.floor(value/3)+uv.getY(at))/2);}
  geometry.clearGroups();k.geometries.add(geometry);return geometry;
 });
 const dice=Array.from({length:5},(_,i)=>{const die=new T.Mesh(geometries[0],materials[0]);die.position.x=(i-2)*.13;die.name=`own-rune-die-${i}`;die.userData.pick=`hold${i}`;parent.add(die);return die;});
 return {dice,update(values:number[],held:boolean[],hand?:RuneHand,now=0,motion=false){const roll=runeRollFrame(hand,now,motion);dice.forEach((die,i)=>{
  const top=Math.max(1,Math.min(6,values[i]||1)),locked=!!held[i];
  die.position.y=locked?.055:0;die.userData.value=values[i]??0;die.userData.held=locked;
  die.geometry=geometries[top-1];die.material=materials[Number(locked)];
  die.position.x=(i-2)*.13;die.position.z=0;die.rotation.set(0,0,0);
  if(roll.rolling&&!locked){const u=roll.progress,ease=1-(1-u)**3,rest=1-ease,seed=i+(hand?.rollId??0)*.73;die.position.y=Math.sin(Math.PI*u)*.1+Math.abs(Math.sin(Math.PI*u*4))*.025*(1-u);die.position.x+=Math.sin(seed*2.3)*.012*Math.sin(Math.PI*u);die.position.z=Math.cos(seed*1.7)*.025*rest;die.rotation.set(rest*Math.PI*(4+i*.3),rest*Math.PI*(2+i*.4),rest*Math.PI*(3+i*.2));}
 });return {rolling:roll.rolling,progress:roll.progress,age:roll.age,positions:dice.map(die=>die.position.toArray()),rotations:dice.map(die=>die.rotation.toArray().slice(0,3))};},dispose(){materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
