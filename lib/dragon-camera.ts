import {bossStation} from './boss-stations';
import {dragonShot,type DragonOutcome} from './dragon-salvo';

export function dragonPortrait(width:number,height:number){return width<=600&&height>=600;}
/** A close crew/boss composition; the full-hort view remains an explicit choice. */
export function dragonActionPose(height:number,x:number,reveal:boolean|number){
 const amount=Number(reveal),distance=20.5-1.5*amount+Math.max(0,844-height)*.035;
 return {position:[x*1.5,7.8,distance] as [number,number,number],aim:[x*.4,2.5+amount*.5,1] as [number,number,number]};
}
export function dragonTrackedStation(elapsed:number,outcomes:DragonOutcome[],ids:string[],own:number){
 let current=own;
 for(let i=0;i<outcomes.length;i++)if(dragonShot(outcomes[i],i,outcomes.length).earned&&elapsed>=dragonShot(outcomes[i],i,outcomes.length).fireAt&&elapsed<7.8){const index=ids.indexOf(outcomes[i].id);if(index>=0)current=index;}
 return bossStation(Math.max(0,current),ids.length).x;
}
