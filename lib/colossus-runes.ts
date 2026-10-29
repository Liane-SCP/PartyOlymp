export interface RuneHand {dice:number[];held:boolean[];rolls:number;rollStartedAt?:number|null;rollId?:number}
/** Charge belongs to the attack control, clear of the seated character's face. */
export function colossusRuneOrigin(station:{x:number;z:number}):[number,number,number]{return [station.x+.45,.64,station.z+1.05];}
export function runeRollFrame(hand:RuneHand|undefined,now:number,motion:boolean){
 const age=hand?.rolls&&typeof hand.rollStartedAt==='number'&&Number.isFinite(hand.rollStartedAt)?(now-hand.rollStartedAt)/1000:Infinity;
 const rolling=!!motion&&age>=0&&age<.74;
 return {age:Number.isFinite(age)?age:null,rolling,progress:rolling?Math.min(1,age/.74):1};
}

/** Only public readiness during input; damage becomes meaningful at reveal. */
export function runeChargeFrame(stage:string,elapsed:number,submitted:boolean,outcome:{damage?:number}|undefined,index:number,count:number,motion:boolean){
 const reveal=['roundReveal','done'].includes(stage),launch=3.45+Math.max(0,index)*2.7/Math.max(1,count-1);
 const ready=stage==='answer'?submitted:reveal?Number(outcome?.damage)>0:false;
 const charge=!ready?0:!reveal?1:motion?Math.max(0,Math.min(1,(launch-elapsed)/.45)):Number(elapsed<launch);
 return {ready,charge,launch,reveal};
}
