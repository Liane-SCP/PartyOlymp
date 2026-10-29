import * as T from 'three';
import {locationKit} from './location-kit';
import {checkoutLayout} from '@/lib/checkout-layout';
import {batchStaticMeshes} from './static-batches';
import {createBudgetReceiptGallery} from './budget-receipt-gallery';
import {createStoreDepartments} from './store-departments';
import {shoppingOfferPosition} from '@/lib/shopping-camera';

export function createDepartmentStore(scene:T.Scene,players:number){
 const k=locationKit(scene,'budget-department-store'),{root,block,sign,model}=k;
 block('department-floor','#ddd5bd',[0,.08,0],[27,.3,23]);
 for(let x=-12;x<=12;x+=3)for(let z=-9;z<=9;z+=3)if((x+z)%2===0)block('floor-tile','#b6c8bc',[x,.245,z],[2.96,.012,2.96]);
 block('back-wall','#587c77',[0,4,-10.7],[27,8,.35]);
 block('left-wall','#e4d3ad',[-13.3,3.5,-1],[.35,7,20]);
 block('mezzanine','#a96d54',[0,5.6,-8.5],[27,.35,4]);
 for(let x=-12;x<=12;x+=2)block('gallery-baluster','#ead7ae',[x,6.5,-6.5],[.08,1.5,.08]);
 block('gallery-rail','#e8c18e',[0,7.25,-6.5],[27,.1,.1]);
 sign('OLYMP · KAUFHAUS',[0,8.2,-10.4],13,1.2);
 createStoreDepartments(k);
 // Front display islands hold the actual identifiable offers, not random food substitutes.
 const offerPositions=Array.from({length:12},(_,i)=>new T.Vector3(...shoppingOfferPosition(i)));
 block('checkout-base','#447872',[10,.66,5.5],[4.5,.72,2.2]);
 block('checkout-counter','#eadfc7',[10,1.06,5.5],[4.7,.12,2.4]);
 block('conveyor-belt','#263d42',[9.05,1.15,5.9],[2.7,.06,1.4]);
 for(const x of[7.77,10.33])block('belt-brass-edge','#bba16c',[x,1.19,5.9],[.05,.06,1.4]);
 const scanner=block('checkout-scanner','#d8b16f',[9.8,1.37,5.4],[.45,.5,.4]);
 const scanLight=block('scanner-window','#74c4bf',[9.8,1.43,5.615],[.31,.24,.03]);scanLight.userData.dynamic=true;
 const scanStrip=block('scanner-strip','#74c4bf',[9.8,1.19,5.95],[.04,.025,.9]);scanStrip.userData.dynamic=true;
 block('register-cash-drawer','#284c50',[11.05,1.2,4.65],[1.1,.16,.65]);
 root.userData.checkout={top:checkoutLayout.top,monitorWidth:0,keyboardWidth:0};
 model('furniture/computerScreen',[11.05,1.28,4.65],.76,0).then(o=>{if(o)root.userData.checkout.monitorWidth=o.userData.nativeSize[0]*o.scale.x;});
 model('furniture/computerKeyboard',[11.05,1.13,5.12],.075,0).then(o=>{if(o)root.userData.checkout.keyboardWidth=o.userData.nativeSize[0]*o.scale.x;});
 // The bundled monitor face leans back by eight degrees; keep the LCD on its plane.
 const display=sign('BEREIT',[11.05,1.72345,4.65775],.83,.42,'#dcebb5','#163f43');display.rotation.x=-.13962634;
 const packBag=new T.Group();packBag.name='checkout-paper-bag';packBag.userData.dynamic=true;root.add(packBag);model('food/bag',[12,1.12,4.8],.65,0,packBag);packBag.visible=false;
 sign('KASSE · SELBSTSCAN',[9.8,3.95,5],5.4,.45);
 const receipt=sign('DEIN EINKAUF',[9.8,2.95,5.04],5.4,.5);
 const balance=sign('PREISE BLEIBEN GEHEIM',[9.8,2.45,5.06],5.4,.4);
 const customer=sign('DEIN EINKAUF',[9.8,3.48,5.02],5.4,.45);
 scanner.userData.dynamic=true;
 const basket=new T.Group();basket.name='private-shopping-basket';basket.userData.dynamic=true;basket.position.set(-9,.3,6);basket.scale.setScalar(.65);root.add(basket);
 const basketShell=new T.Group();basketShell.name='basket-rigid-shell';basket.add(basketShell);
 block('basket-bottom','#c98a55',[0,0,0],[2.6,.15,1.7],basketShell);
 for(let i=0;i<5;i++){for(const z of[-.85,.85])block('basket-weave','#d9a86c',[-1.2+i*.6,.5,z],[.1,1,.1],basketShell);}
 for(const z of[-.85,.85])block('basket-rim','#e6bd81',[0,1,z],[2.7,.12,.12],basketShell);
 for(const x of[-1.3,1.3])block('basket-side','#d9a86c',[x,.5,0],[.12,1,1.7],basketShell);
 const basketTitle=sign('DEIN KORB',[-9,1.65,6.1],2.7,.45);
 model('furniture/pottedPlant',[-12,.3,-9.4],2.6);model('furniture/pottedPlant',[12,.3,-9.4],2.6);
 const seats=Array.from({length:players},(_,i)=>new T.Vector3(-5.8+(i%6)*2.1,.3,7.5+Math.floor(i/6)*1.6));
 const checkoutSpot=new T.Vector3(...checkoutLayout.customer);
 const receiptGallery=createBudgetReceiptGallery(k);
 let disposed=false,release=()=>{};
 const ready=k.ready().then(()=>{if(!disposed){const releases=[batchStaticMeshes(basketShell),batchStaticMeshes(root,{mergeUnique:true})];release=()=>releases.forEach(fn=>fn());}});return {...k,offerPositions,seats,checkoutSpot,basket,scanner,scanLight,packBag,display,receipt,receiptGallery,balance,customer,basketTitle,ready,dispose(){disposed=true;release();receiptGallery.dispose();k.dispose();}};
}
