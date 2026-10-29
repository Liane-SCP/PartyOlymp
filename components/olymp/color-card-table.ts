import * as T from 'three';
import {createPrintedCardBatch,printedCardPickLayer} from './printed-card-batch';
import {colorCardPalette,colorCardMarks,colorCardNames,colorCardSymbol,colorCardSlot,colorTableFrame,colorHandPageSize,colorMoveCue} from '@/lib/color-table-presentation';

type Seat={id:string;name:string;position:T.Vector3;color:string};
export function createColorCardTable(parent:T.Group){
 const canvas=typeof document==='undefined'?null:document.createElement('canvas');if(canvas){canvas.width=1024;canvas.height=1232;}const c=canvas?.getContext('2d');
 if(c)for(let slot=0;slot<55;slot++){
  const x=slot%8*128,y=Math.floor(slot/8)*176,card=slot<52?{color:Math.floor(slot/13),value:slot%13}:slot<54?{color:4,value:slot-52+13}:null;
  c.save();c.translate(x,y);c.beginPath();c.roundRect(3,3,122,170,11);c.clip();c.fillStyle='#fff4de';c.fillRect(0,0,128,176);
  if(!card){c.fillStyle='#355b53';c.fillRect(9,9,110,158);for(let j=0;j<4;j++)for(let i=0;i<3;i++){c.fillStyle=colorCardPalette[(i+j)%4];c.beginPath();c.arc(30+i*34,33+j*36,9,0,Math.PI*2);c.fill();}c.strokeStyle='#f5d7a1';c.lineWidth=3;c.strokeRect(13,13,102,150);}
  else{if(card.color===4){for(let i=0;i<4;i++){c.fillStyle=colorCardPalette[i];c.fillRect(i%2*64,Math.floor(i/2)*88,64,88);}}else{c.fillStyle=colorCardPalette[card.color];c.fillRect(9,9,110,158);}c.fillStyle='#fff4de';c.beginPath();c.ellipse(64,88,45,55,.35,0,Math.PI*2);c.fill();c.fillStyle='#203c3d';c.textAlign='center';c.textBaseline='middle';c.font=`800 ${card.value>=12?43:58}px sans-serif`;c.fillText(colorCardSymbol(card),64,88,94);c.font='800 22px sans-serif';c.fillText(colorCardSymbol(card),25,27,42);c.save();c.translate(128,176);c.rotate(Math.PI);c.fillText(colorCardSymbol(card),25,27,42);c.restore();if(card.color<4){c.font='18px sans-serif';c.fillText(colorCardMarks[card.color],26,51);c.save();c.translate(128,176);c.rotate(Math.PI);c.fillText(colorCardMarks[card.color],26,51);c.restore();}}
  c.restore();
 }
 const texture=canvas?new T.CanvasTexture(canvas):null;if(texture){texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;}
 const printed=createPrintedCardBatch(parent,texture,54,192,colorHandPageSize,'color-card'),pose=new T.Object3D(),matrix=new T.Matrix4();
 const root=new T.Group();root.name='color-card-mechanism';root.userData.dynamic=true;parent.add(root);
 const wood=new T.MeshStandardMaterial({color:'#715a43',roughness:.8}),brass=new T.MeshStandardMaterial({color:'#ddc18b',roughness:.6}),ink=new T.MeshStandardMaterial({color:'#28524e',roughness:.75});
 const cylinder=new T.CylinderGeometry(1,1,1,32),box=new T.BoxGeometry(1,1,1),torus=new T.TorusGeometry(1,.035,6,32);
 const platform=new T.Mesh(cylinder,wood);platform.position.set(0,1.72,-.8);platform.scale.set(1.5,.2,1.6);root.add(platform);
 const collar=new T.Mesh(torus,brass);collar.rotation.x=-Math.PI/2;collar.position.set(0,1.85,-.8);collar.scale.set(1.44,1.53,1);root.add(collar);
 const drawPlate=new T.Mesh(box,wood);drawPlate.position.set(-3.8,1.68,-.5);drawPlate.scale.set(1.7,.12,2.35);root.add(drawPlate);drawPlate.userData.pick='cardDraw';
 const cardPickables=printed.cards.map(c=>c.plate),pickables:T.Object3D[]=[drawPlate,...cardPickables];
 const buttons=([-1,1] as const).map(direction=>{const button=new T.Mesh(box,brass);button.name=`color-hand-page-${direction}`;button.position.set(direction*6.25,1.78,4.1);button.scale.set(.85,.18,1.1);button.userData.pick=direction<0?'cardPage:previous':'cardPage:next';root.add(button);pickables.push(button);return button;});
 // All playable cards share a single opaque outline batch, avoiding per-card materials.
 const outlineShape=new T.Shape(),ow=.74,oh=1.015,or=.16;outlineShape.moveTo(-ow+or,-oh);outlineShape.lineTo(ow-or,-oh);outlineShape.quadraticCurveTo(ow,-oh,ow,-oh+or);outlineShape.lineTo(ow,oh-or);outlineShape.quadraticCurveTo(ow,oh,ow-or,oh);outlineShape.lineTo(-ow+or,oh);outlineShape.quadraticCurveTo(-ow,oh,-ow,oh-or);outlineShape.lineTo(-ow,-oh+or);outlineShape.quadraticCurveTo(-ow,-oh,-ow+or,-oh);
 const outlineMaterial=new T.MeshBasicMaterial({color:'#ffeab2',toneMapped:false}),outlineGeometry=new T.ShapeGeometry(outlineShape,5),outlines=new T.InstancedMesh(outlineGeometry,outlineMaterial,8);root.add(outlines);
 const arrowShape=new T.Shape();arrowShape.moveTo(-.10,-.3);arrowShape.lineTo(.10,-.3);arrowShape.lineTo(.10,.03);arrowShape.lineTo(.23,.03);arrowShape.lineTo(0,.34);arrowShape.lineTo(-.23,.03);arrowShape.lineTo(-.10,.03);arrowShape.closePath();
 const arrowGeometry=new T.ShapeGeometry(arrowShape),arrows=new T.InstancedMesh(arrowGeometry,brass,12);arrows.name='color-turn-arrows';root.add(arrows);
 let seenMove:string|undefined,initialized=false,round:unknown,disposed=false;
 function add(position:T.Vector3,slot:number,scale=1,angle=0){pose.position.copy(position);pose.rotation.set(-Math.PI/2,0,angle);pose.scale.setScalar(scale);pose.updateMatrix();printed.add(pose.matrix,slot);}
 function sync(game:any,now:number,seats:Seat[],me:string,draft:any,reduced:boolean){
  const frame=colorTableFrame(game,me,now,draft),name=(id:string)=>seats.find(s=>s.id===id)?.name??'Spieler';if(round!==game.round){round=game.round;initialized=false;seenMove=undefined;}
  printed.begin();let outlineCount=0;
  printed.cards.forEach((card,i)=>{const entry=frame.own[i];card.root.visible=!!entry;if(!entry)return;const scale=frame.personal?1.4:1,x=(i-(frame.own.length-1)/2)*(frame.personal?2.2:1.38);card.root.scale.setScalar(scale);card.root.position.set(x,1.68+(entry.playable?.10:0),4.15+Math.abs(i-(frame.own.length-1)/2)*.035);card.root.rotation.set(-Math.PI/2,0,0);card.root.userData.displayedCard=entry.card;card.root.userData.playable=entry.playable;card.plate.userData.pick=`card:${entry.index}`;card.plate.userData.pickDisabled=!entry.playable;card.face.set(colorCardSymbol(entry.card));card.root.updateMatrix();printed.add(card.root.matrix,colorCardSlot(entry.card));if(entry.playable){pose.position.copy(card.root.position);pose.position.y-=.045;pose.rotation.set(-Math.PI/2,0,0);pose.scale.setScalar(scale);pose.updateMatrix();outlines.setMatrixAt(outlineCount++,pose.matrix);}});
  outlines.count=outlineCount;outlines.visible=outlineCount>0;outlines.instanceMatrix.needsUpdate=true;outlines.computeBoundingSphere();
  buttons.forEach((button,i)=>{button.visible=frame.pages>1&&!frame.personal&&!frame.viewOnly;button.userData.pickDisabled=i===0?frame.page===0:frame.page===frame.pages-1;button.material=button.userData.pickDisabled?ink:brass;});drawPlate.userData.pickDisabled=!frame.ownTurn||frame.wild;
  const visibleBacks:{id:string;count:number;shown:number}[]=[];for(const seat of seats){const count=Number(game.counts?.[seat.id]??0),shown=seat.id===me?0:Math.min(3,count),a=Math.atan2(seat.position.x,seat.position.z);visibleBacks.push({id:seat.id,count,shown});for(let j=0;j<shown;j++)add(new T.Vector3(seat.position.x*.72+Math.cos(a)*(j-(shown-1)/2)*.25,1.66+j*.018,seat.position.z*.72-Math.sin(a)*(j-(shown-1)/2)*.25),54,.5,-a);}
  for(let i=0;i<3;i++)add(new T.Vector3(-3.8,1.78+i*.045,-.5),54,1);
  const move=frame.move,progress=reduced?1:Math.min(1,Math.max(0,frame.age/700));
  const playFlight=move?.kind==='play'&&progress<1;if(game.top&&!playFlight)add(new T.Vector3(0,1.87,-.8),colorCardSlot(game.top));
  const flightPoses:{hidden:boolean;slot:number;position:number[]}[]=[];
  if(move&&!reduced){const seat=seats.find(s=>s.id===move.player);if(seat){const draw=move.kind!=='play'||move.count>0,target=move.kind==='play'&&move.count>0?seats.find(s=>s.id===move.target):seat;
   if(playFlight){const from=seat.position.clone().multiplyScalar(.72).setY(1.8),to=new T.Vector3(0,1.87,-.8),p=from.lerp(to,progress);p.y+=Math.sin(progress*Math.PI)*1.1;add(p,colorCardSlot(move.card));flightPoses.push({hidden:false,slot:colorCardSlot(move.card),position:p.toArray()});}
   if(draw&&target)for(let j=0;j<Math.min(4,Number(move.count)||1);j++){const p=Math.max(0,Math.min(1,(frame.age-j*100)/700));if(p>=1)continue;const position=new T.Vector3(-3.8,1.9,-.5).lerp(target.position.clone().multiplyScalar(.72).setY(1.8),p);position.y+=Math.sin(p*Math.PI)*.8+j*.04;add(position,54,.75);flightPoses.push({hidden:true,slot:54,position:position.toArray()});}
  }}
  // Arrow tangents follow the actual seat order, including reversal with two participants.
  seats.forEach((seat,i)=>{const next=seats[(i+1)%seats.length],a=Math.atan2(seat.position.x,seat.position.z),b=Math.atan2(next.position.x,next.position.z);let delta=b-a;if(delta>=0)delta-=Math.PI*2;const mid=a+delta/2;pose.position.set(Math.sin(mid)*5.9,1.66,Math.cos(mid)*4.55);pose.rotation.set(-Math.PI/2,0,mid+frame.direction*Math.PI/2);pose.scale.setScalar(.9);pose.updateMatrix();arrows.setMatrixAt(i,pose.matrix);});arrows.count=seats.length;arrows.instanceMatrix.needsUpdate=true;arrows.computeBoundingSphere();
  collar.material=brass;collar.rotation.z=frame.direction===1?0:Math.PI/4;
  const faces=Object.fromEntries(seats.map(s=>[s.id,frame.winner?(s.id===frame.winner?4:7):move?.target===s.id?6:frame.lastCard===s.id?7:-1]));
  let moment:any=null;if(frame.winner)moment={key:`cards:${game.round}:winner`,text:`${name(frame.winner)} GEWINNT DIE HAND`,detail:'Die Restkarten entscheiden die weiteren Plätze.',player:frame.winner,kind:'cards-result',reaction:4};
  else if(frame.lastCard)moment={key:`cards:${move?.id??game.lastMove?.id}:last`,text:`${name(frame.lastCard)} · LETZTE KARTE!`,detail:'Nur noch eine Karte auf der Hand.',player:frame.lastCard,kind:'cards-last',reaction:7};
  else if(move){const symbol=colorCardSymbol(move.card),target=name(move.target);moment={key:`cards:${move.id}`,text:move.kind!=='play'?`${name(move.player)} ZIEHT`:move.card?.value===11?'RICHTUNG GEWECHSELT':move.target?`${name(move.player)} SPIELT ${symbol}`:`${name(move.player)} LEGT ${symbol}`,detail:move.target?`${target} ${move.count?`zieht ${move.count} und `:''}setzt aus.`:move.card?.color===4?`Neue Farbe: ${colorCardNames[frame.color]}.`:`${name(game.turnId)} ist jetzt dran.`,player:move.player,kind:'cards-action',reaction:7};}
  const cue=initialized&&move&&seenMove!==move.id?colorMoveCue(game):null;seenMove=game.lastMove?.id;initialized=true;
  const cards=printed.flush();return {frame,faces,moment,cue,cueId:cue?move.id:null,stats:{personal:frame.personal,viewOnly:frame.viewOnly,pageSize:frame.pageSize,page:frame.page,pages:frame.pages,own:frame.own.map((e:any)=>({id:e.card.id,index:e.index,slot:colorCardSlot(e.card),playable:e.playable,scale:printed.cards[e.index-frame.offset].root.scale.x,position:printed.cards[e.index-frame.offset].root.position.toArray()})),opponents:visibleBacks,flightPoses,active:game.turnId,next:frame.next,direction:frame.direction,color:frame.color,lastCard:frame.lastCard,winner:frame.winner,cards,move:move?.id??null}};
 }
 return {sync,pickables,pickLayer:printedCardPickLayer,dispose(){if(disposed)return;disposed=true;printed.dispose();root.removeFromParent();for(const g of[cylinder,box,torus,outlineGeometry,arrowGeometry])g.dispose();for(const m of[wood,brass,ink,outlineMaterial])m.dispose();outlines.dispose();arrows.dispose();}};
}
