import * as T from 'three';
import {createPrintedCardBatch} from './printed-card-batch';
import {casinoPresentation} from '@/lib/casino-presentation';

type Seat={id:string;position:T.Vector3;color:string};
const capacity=384,cellW=128,cellH=176,atlasW=1024,atlasH=1232;
export function casinoCardSlot(card:any){return Number.isInteger(card?.rank)&&card.rank>=1&&card.rank<=13&&Number.isInteger(card?.suit)&&card.suit>=0&&card.suit<4?card.suit*13+card.rank-1:52;}

/** Printed cards, public hands and chips share scene-owned render batches. */
export function createCasinoTable(parent:T.Group){
 const canvas=typeof document==='undefined'?null:document.createElement('canvas');if(canvas){canvas.width=atlasW;canvas.height=atlasH;}
 const context=canvas?.getContext('2d');
 if(context)for(let slot=0;slot<53;slot++){
  const x=slot%8*cellW,y=Math.floor(slot/8)*cellH,c=context;c.save();c.translate(x,y);c.beginPath();c.roundRect(3,3,cellW-6,cellH-6,11);c.clip();c.fillStyle=slot===52?'#234f56':'#fff7e4';c.fillRect(0,0,cellW,cellH);
  if(slot===52){c.strokeStyle='#c9ac6e';c.lineWidth=2;c.strokeRect(11,11,cellW-22,cellH-22);for(let j=0;j<5;j++)for(let i=0;i<4;i++){c.save();c.translate(25+i*26,32+j*28);c.rotate(Math.PI/4);c.strokeRect(-6,-6,12,12);c.restore();}c.fillStyle='#e5cb8b';c.font='700 30px serif';c.textAlign='center';c.textBaseline='middle';c.fillText('✦',64,88);}
  else{const suit=Math.floor(slot/13),rank=slot%13+1,mark=['♠','♥','♦','♣'][suit],value=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'][rank];c.fillStyle=suit===1||suit===2?'#ae3e49':'#213e43';c.textAlign='center';c.textBaseline='middle';c.font='700 25px serif';c.fillText(value,23,23);c.font='24px serif';c.fillText(mark,23,48);c.save();c.translate(cellW,cellH);c.rotate(Math.PI);c.font='700 25px serif';c.fillText(value,23,23);c.font='24px serif';c.fillText(mark,23,48);c.restore();c.font='62px serif';c.fillText(mark,64,89);}
  c.restore();
 }
 const texture=canvas?new T.CanvasTexture(canvas):null;if(texture){texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;}
 const printed=createPrintedCardBatch(parent,texture,52,capacity,60,'casino-card'),cards=printed.cards;
 const chipMaterial=new T.MeshStandardMaterial({color:'#ffffff',roughness:.65}),gold=new T.MeshStandardMaterial({color:'#e0b76b',roughness:.5,metalness:.25});
 const chipGeometry=new T.CylinderGeometry(.22,.22,.065,20),stakes=new T.InstancedMesh(chipGeometry,chipMaterial,60),returns=new T.InstancedMesh(chipGeometry,gold,120);stakes.name='casino-stakes';returns.name='casino-payouts';for(const batch of[stakes,returns]){batch.castShadow=batch.receiveShadow=true;batch.instanceMatrix.setUsage(T.DynamicDrawUsage);parent.add(batch);}
 // Allocate instance colors before shader preparation, including empty initial stakes.
 for(let i=0;i<60;i++)stakes.setColorAt(i,new T.Color('#d5bc82'));stakes.count=returns.count=0;
 const inverse=new T.Matrix4(),matrix=new T.Matrix4(),point=new T.Vector3(),pose=new T.Object3D(),rotation=new T.Euler(),color=new T.Color();let disposed=false;
 function sync(game:any,now:number,seats:Seat[],me:string,reduced:boolean,personal=false){
  if(disposed)return;const frame=casinoPresentation(game,now);parent.updateWorldMatrix(true,true);inverse.copy(parent.matrixWorld).invert();let count=0;printed.begin();
  const add=(m:T.Matrix4,card:any,back=false)=>{if(count>=capacity)return;printed.add(m,back?52:casinoCardSlot(card));count++;};
  for(const card of cards)if(card.root.visible){matrix.multiplyMatrices(inverse,card.root.matrixWorld);add(matrix,card.root.userData.displayedCard,!!card.root.userData.hidden);}
  const spacing=seats.length>1?Math.min(...seats.slice(1).map((s,i)=>s.position.distanceTo(seats[i].position)))*.45:2,scale=Math.min(.52,spacing*.85/1.35),publicHands:{id:string;count:number}[]=[];
  for(const seat of seats){const hand=game.status?.[seat.id]?.hand??[];publicHands.push({id:seat.id,count:hand.length});if(seat.id===me)continue;const angle=Math.atan2(seat.position.x,seat.position.z),span=Math.max(.3,spacing*.9);rotation.set(-Math.PI/2,-angle,0,'YXZ');pose.quaternion.setFromEuler(rotation);pose.scale.setScalar(scale);
   if(!personal)hand.forEach((card:any,j:number)=>{const row=Math.floor(j/6),inRow=Math.min(6,hand.length-row*6),step=Math.min(scale*.7,Math.max(.025,(span-1.35*scale)/Math.max(1,inRow-1))),offset=(j%6-(inRow-1)/2)*step;pose.position.set(seat.position.x*.45+Math.cos(angle)*offset-Math.sin(angle)*row*.38,1.645+row*.008,seat.position.z*.45-Math.sin(angle)*offset-Math.cos(angle)*row*.38);pose.updateMatrix();add(pose.matrix,card);});
  }
  printed.flush();
  let bets=0,payouts=0;const progress=reduced&&frame.ready?1:frame.payoutProgress,ease=progress*progress*(3-2*progress);
  pose.quaternion.identity();pose.scale.set(1.6,2,1.6);
  const bankColors=['#ed9caa','#8bcde4','#bedb99','#ebc187','#b9a6e5','#95d3b9'];
  const bankCount=personal?0:8;for(let i=0;i<bankCount;i++){pose.position.set(-5.5+(i%2)*.55,1.69+Math.floor(i/2)*.13,1);pose.updateMatrix();stakes.setMatrixAt(bets,pose.matrix);stakes.setColorAt(bets++,color.set(bankColors[i%6]));}pose.scale.setScalar(1);
  const payoutPoses:{id:string;position:number[]}[]=[];
  for(const [i,seat]of seats.entries()){
   if(personal&&seat.id!==me)continue;
   const status=game.status?.[seat.id],row=frame.rows.find((r:any)=>r.id===seat.id),bet=Number(status?.bet??0),target=personal?new T.Vector3(-3.1,1.648,4.3):new T.Vector3(seat.position.x*.75+.55,1.648,seat.position.z*.75),origin=new T.Vector3((i%4-1.5)*.5,1.671,-.65+Math.floor(i/4)*.5);
   if(bet>0&&(!frame.ready||progress<1))for(let j=0;j<Math.ceil(bet/25);j++){pose.position.copy(target).lerp(origin,ease);pose.position.y+=j*.067;pose.updateMatrix();stakes.setMatrixAt(bets,pose.matrix);stakes.setColorAt(bets++,color.set(seat.color));}
   if(row?.payout>0)for(let j=0;j<Math.min(10,Math.ceil(row.payout/25));j++){pose.position.copy(origin).lerp(target,ease);pose.position.y+=Math.sin(ease*Math.PI)*.45+j*.067;pose.updateMatrix();returns.setMatrixAt(payouts,pose.matrix);if(j===0){returns.getMatrixAt(payouts,matrix);payoutPoses.push({id:seat.id,position:point.setFromMatrixPosition(matrix).toArray()});}payouts++;}
  }
  for(const[batch,n]of [[stakes,bets],[returns,payouts]] as const){batch.count=n;batch.visible=n>0;batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();}if(stakes.instanceColor)stakes.instanceColor.needsUpdate=true;
  return {visibleDealer:frame.visible,dealerValue:frame.value,resultReady:frame.ready,payoutProgress:progress,publicHands,cards:count,bankChips:bankCount,stakeChips:bets-bankCount,returnChips:payouts,payoutPoses,ownCards:cards.slice(0,40).filter(c=>c.root.visible).map(c=>({index:cards.indexOf(c),text:c.face.object.userData.text,position:c.root.position.toArray(),rotation:c.root.rotation.toArray().slice(0,3)})),dealerCards:cards.slice(40).filter(c=>c.root.visible).map(c=>({hidden:!!c.root.userData.hidden,text:c.face.object.userData.text,position:c.root.position.toArray(),rotation:c.root.rotation.toArray().slice(0,3)})),returns:frame.rows.map((r:any)=>({id:r.id,payout:r.payout,net:r.payout-r.bet}))};
 }
 return {cards,sync,dispose(){if(disposed)return;disposed=true;printed.dispose();for(const m of[stakes,returns]){m.removeFromParent();m.dispose();}chipGeometry.dispose();chipMaterial.dispose();gold.dispose();}};
}
