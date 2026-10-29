export type KrakenOutcome={id:string;submitted?:boolean;score?:number;damage?:number;accuracy?:number};
export function krakenFireAt(index:number,count:number){return 3.45+2.7*index/Math.max(1,count-1);}
/** Only public, confirmed outcomes may create a shot, including a genuine miss. */
export function krakenShot(outcome:KrakenOutcome|undefined,index:number,count:number,elapsed:number){
 const fireAt=krakenFireAt(index,count),age=elapsed-fireAt;
 const confirmed=outcome?.submitted===true;
 return {confirmed,fireAt,impactAt:fireAt+.75,age,flight:age/.75,impactAge:age-.75,hit:confirmed&&Number(outcome.score??0)>0};
}
export function krakenTarget(index:number,hit:boolean,boss:readonly number[]):[number,number,number]{
 return hit?[boss[0],boss[1],boss[2]]:[(index%2?-1:1)*(2.2+(index%3)*.4),.15,boss[2]+1.3+(index%3)*.25];
}
