import * as T from 'three';
import type {createDepartmentStore} from './department-store';
import {checkoutPresentation} from '@/lib/checkout-presentation';
import type {ReferenceMoment} from '@/lib/reference-moments';
import {checkoutItemPose} from '@/lib/checkout-layout';
import {shoppingPickLayer} from './shopping-displays';

/** Only receives the local publicRoom view and the local unsent basket. */
export function shoppingPresentation(store:ReturnType<typeof createDepartmentStore>,offers:T.Object3D[],pickables:T.Object3D[],me:string,crew:{id?:string;name?:string}[]=[]){
 const tokens=new Map<number,T.Mesh>(),selectedBefore=new Set<string>();let round:unknown,lastScan='',previousCustomer='',previousMoment='',initialized=false;
 const currency=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}),money=(value:number)=>currency.format(value/100);
 const tokenGeometry=new T.BufferGeometry(),positions=new Float32Array(offers.length*12),uvs=new Float32Array(offers.length*8),indices:number[]=[];for(let i=0;i<offers.length;i++){const n=i*4;indices.push(n,n+2,n+1,n+2,n+3,n+1);}tokenGeometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));tokenGeometry.setAttribute('uv',new T.BufferAttribute(uvs,2).setUsage(T.DynamicDrawUsage));tokenGeometry.setIndex(indices);
 let tokenBatch:T.Mesh|undefined;const point=new T.Vector3();
 function syncTokens(){if(!tokenBatch)return;let count=0;for(const token of tokens.values()){if(!token.visible)continue;token.updateMatrix();const p=token.geometry.getAttribute('position'),uv=token.geometry.getAttribute('uv');for(let i=0;i<4;i++){point.fromBufferAttribute(p,i).applyMatrix4(token.matrix);tokenGeometry.getAttribute('position').setXYZ(count*4+i,point.x,point.y,point.z);tokenGeometry.getAttribute('uv').setXY(count*4+i,uv.getX(i),uv.getY(i));}count++;}tokenBatch.visible=count>0;tokenGeometry.setDrawRange(0,count*6);if(count){tokenGeometry.getAttribute('position').needsUpdate=true;tokenGeometry.getAttribute('uv').needsUpdate=true;tokenGeometry.computeBoundingSphere();}}
 return {
  update(t:number,now:number,game:any,draft:any,reduced:boolean){
   if(round!==game.round){round=game.round;lastScan='';previousCustomer='';previousMoment='';initialized=false;selectedBefore.clear();}
   const own=game.mine??{},checkout=checkoutPresentation(game,now);
   const receipts=store.receiptGallery.update(game,crew,me,now,draft.receipts);store.root.userData.budgetReceipts=receipts;
   const ids:string[]=checkout?.ids??(own.submitted?own.answer:draft.basket??own.answer)??[];
   const customerKey=checkout?.row.id??me;if(customerKey!==previousCustomer){previousCustomer=customerKey;selectedBefore.clear();}
   store.basket.visible=!checkout;store.basketTitle.visible=!checkout;store.display.userData.setText(checkout?money(checkout.total):'BEREIT');
   store.packBag.visible=receipts.mode==='checkout'&&!!checkout&&!checkout.summary&&checkout.complete&&ids.length>0;
   store.root.userData.checkout.bagVisible=store.packBag.visible;
   const glow=!reduced&&checkout&&!checkout.complete&&checkout.scanProgress%1>.8?1.2:0;store.scanLight.material.emissive.set('#74c4bf');store.scanLight.material.emissiveIntensity=glow;
   const items=game.items??[];
   offers.forEach((offer,i)=>{
    const photo=offer.getObjectByName(`product-photo-${i}`) as T.Mesh|undefined;if(!photo)return;
    let token=tokens.get(i);if(!token){token=new T.Mesh(photo.geometry,photo.material);token.name=`basket-item-${i}`;token.userData.pick=`offer:${i}`;token.layers.set(shoppingPickLayer);store.root.add(token);tokens.set(i,token);pickables.push(token);if(!tokenBatch){tokenBatch=new T.Mesh(tokenGeometry,photo.material);tokenBatch.name='batched-private-shopping-items';tokenBatch.visible=false;store.root.add(tokenBatch);}}token.userData.pickDisabled=!!checkout;
    const index=ids.indexOf(items[i]?.id),selected=index>=0;token.visible=selected&&receipts.mode==='checkout';
    if(!selected){selectedBefore.delete(items[i]?.id);return;}
    const target=checkout?new T.Vector3(...checkoutItemPose(checkout,index,reduced)):new T.Vector3(-9+(index%3-1)*.45,.9+Math.floor(index/3)*.16,6+Math.floor(index/3)*.12);
    if(!selectedBefore.has(items[i]?.id)){photo.getWorldPosition(token.position);selectedBefore.add(items[i]?.id);}
    if(checkout||reduced)token.position.copy(target);else token.position.lerp(target,.18);token.scale.setScalar(checkout?.24:.22);token.rotation.set(checkout?-Math.PI/2:-.2,0,0);
   });
   syncTokens();
   if(!checkout){store.root.userData.shopping={selected:ids.length,scanned:0,total:null};lastScan='';previousMoment='';initialized=true;store.customer.userData.setText('DEIN EINKAUF');store.receipt.userData.setText(`${ids.length} ARTIKEL IM KORB`);store.balance.userData.setText(`BUDGET ${money(game.budget??0)}`);return {cue:null,moment:null};}
   const {scanned:scan,total,remaining,outcome,complete,summary,row}=checkout,name=crew.find(c=>c.id===row.id)?.name??'Crew';
   store.root.userData.shopping={...checkout,selected:ids.length,customer:row.id,tokenPoses:[...tokens].filter(([,token])=>token.visible).map(([index,token])=>({index,position:token.position.toArray()}))};
   store.customer.userData.setText(`${checkout.index+1}/${checkout.count} · ${name.toUpperCase()}`);
   store.receipt.userData.setText(`${scan}/${ids.length} · ${money(total)}`);
   store.balance.userData.setText(complete?(remaining<0?`${money(-remaining)} ÜBER BUDGET`:`${money(remaining)} ÜBRIG`):`BUDGET ${money(checkout.budget)}`);
   const title=outcome==='close'?'KNAPP GESCHAFFT!':outcome==='over'?'ÜBER DEM BUDGET!':outcome==='empty'?'LEERER KORB':'BUDGET GEHALTEN';
   const key=`${round}:${row.id}:${summary?'summary':checkout.intro?'arrival':complete?'result':`scan:${scan}`}`;
   const last=checkout.chosen[scan-1],fullName=String(last?.name??last?.title??'Artikel'),shortName=fullName.length>32?fullName.slice(0,31)+'…':fullName;
   const moment:ReferenceMoment={key,text:checkout.intro?'AB ZUR KASSE!':summary?`${checkout.successful}/${checkout.count} EINKÄUFE IM BUDGET`:complete?`${name} · ${title}`:`${name} · ${money(total)} / ${money(checkout.budget)}`,detail:checkout.intro?'Die Crew vergleicht ihre Einkäufe.':summary?'Alle Kassenbons stehen zum Vergleichen bereit.':complete?`${money(total)} · ${remaining<0?`${money(-remaining)} zu viel`:`${money(remaining)} übrig`}`:last?`${scan}/${ids.length} Artikel · ${shortName} · ${money(last.price)}`:`${ids.length} Artikel gehen über den Scanner.`,player:summary||checkout.intro?undefined:row.id,kind:summary?'checkout-summary':outcome??(total>checkout.budget?'over':'checkout'),reaction:!complete?16:outcome==='over'?6:outcome==='close'?7:outcome==='empty'?23:4};
   const scanKey=`${row.id}:${scan}`,seek=now-Number(game.revealStartedAt??now)>1800&&!previousMoment;
   let cue:string|null=null;if(initialized&&!seek){if(key!==previousMoment&&complete)cue=summary?'checkoutComplete':outcome==='over'?'checkoutOver':outcome==='close'?'checkoutClose':outcome==='empty'?null:'checkoutSuccess';else if(scanKey!==lastScan&&scan>0)cue='checkoutScan';}
   previousMoment=key;lastScan=scanKey;initialized=true;return {cue,moment};
  },
  dispose(){tokens.forEach(token=>{const i=pickables.indexOf(token);if(i>=0)pickables.splice(i,1);token.removeFromParent();});tokens.clear();tokenBatch?.removeFromParent();tokenGeometry.dispose();}
 };
}
