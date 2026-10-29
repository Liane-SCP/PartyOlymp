import {bossStation} from './boss-stations';

export type ColossusCameraOutcome={id:string;submitted?:boolean;damage?:number};
export function colossusPortrait(width:number,height:number){return width<=600&&height>=600;}
/** Frame the crew below the temple guardian, with a separate close rune-table view. */
export function colossusActionPose(height:number,x:number,reveal:boolean|number){
 const amount=Number(reveal),distance=22-1.5*amount+Math.max(0,844-height)*.035;
 return {position:[x*1.5,8.3,distance] as [number,number,number],aim:[x*.4,3.2+amount*.3,.5] as [number,number,number]};
}
export function colossusTrackedStation(elapsed:number,outcomes:ColossusCameraOutcome[],ids:string[],own:number){
 let current=own;
 for(let i=0;i<outcomes.length;i++){
  const outcome=outcomes[i],fireAt=3.45+2.7*i/Math.max(1,outcomes.length-1);
  if(outcome.submitted===true&&Number(outcome.damage)>0&&elapsed>=fireAt&&elapsed<7.8){const index=ids.indexOf(outcome.id);if(index>=0)current=index;}
 }
 return bossStation(Math.max(0,current),ids.length).x;
}
