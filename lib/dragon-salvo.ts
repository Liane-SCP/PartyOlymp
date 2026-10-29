import {bossStation} from './boss-stations';

export type DragonOutcome={id:string;submitted?:boolean;score?:number;damage?:number};
export const DRAGON_COINS_PER_PLAYER=9;
/** Public score controls presentation, including a hit capped by the remaining boss HP. */
export function dragonShot(outcome:DragonOutcome|undefined,index:number,count:number){
 const score=Number(outcome?.score??0),earned=outcome?.submitted===true&&Number.isFinite(score)&&score>0;
 const power=earned?Math.min(1,score/1600):0;
 const fireAt=3.45+2.7*index/Math.max(1,count-1);
 return {earned,power,coins:earned?3+Math.round(power*6):0,fireAt,impactAt:fireAt+.75};
}
export function dragonCoinOrigin(index:number,count:number):[number,number,number]{
 const p=bossStation(index,count);return [p.x,.58,p.z-.52];
}
