import {bossStation} from './boss-stations';
import {krakenFireAt,type KrakenOutcome} from './kraken-salvo';

export function krakenPortrait(width:number,height:number){return width<=600&&height>=600;}
/** Keep the portrait action between the header and the bottom controls. */
export function krakenActionPose(height:number,x:number,reveal:boolean|number){
 const amount=Number(reveal),distance=25-4*amount+Math.max(0,844-height)*(.055+.01*amount);
 return {position:[x*1.8,9,distance] as [number,number,number],aim:[x*.4,2.8+1.3*amount,1] as [number,number,number]};
}
export function krakenTrackedStation(elapsed:number,outcomes:KrakenOutcome[],ids:string[],own:number){
 let current=own;
 for(let i=0;i<outcomes.length;i++)if(outcomes[i].submitted&&elapsed>=krakenFireAt(i,outcomes.length)&&elapsed<7.8){const index=ids.indexOf(outcomes[i].id);if(index>=0)current=index;}
 return bossStation(Math.max(0,current),ids.length,true).x;
}
