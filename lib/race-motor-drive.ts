import type {AudioPoint} from './scene-spatial-audio';

export interface RaceMotorFrame {id:string;position:AudioPoint;power:number;own:boolean}
type Motion={progress:number;at:number;advance:number;power:number};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

/** Only confirmed, public typing progress can accelerate a motor. */
export class RaceMotorDrive {
 private key='';private rows=new Map<string,Motion>();
 update(game:any,now:number,drivers:{id:string;position:AudioPoint}[],me:string):RaceMotorFrame[]{
  const key=`${game.round}:${game.startedAt}`;
  if(key!==this.key){this.key=key;this.rows.clear();}
  if(game.stage!=='answer'){this.rows.clear();return [];}
  const live=new Set(drivers.map(driver=>driver.id));for(const id of this.rows.keys())if(!live.has(id))this.rows.delete(id);
  const result:RaceMotorFrame[]=[];
  for(const driver of drivers){
   const racer=game.racers?.[driver.id];
   if(!racer||racer.finishedAt!=null||!Number.isFinite(racer.progress)||driver.position.some(n=>!Number.isFinite(n))){this.rows.delete(driver.id);continue;}
   const progress=Math.max(0,racer.progress);let row=this.rows.get(driver.id);
   if(!row||now<row.at||now-row.at>2500){row={progress,at:now,advance:-Infinity,power:0};this.rows.set(driver.id,row);}
   else if(progress!==row.progress){
    if(progress>row.progress){row.power=clamp((progress-row.progress)/(Math.max(.15,(now-row.at)/1000)*9));row.advance=now;}
    row.progress=progress;row.at=now;
   }
   // A stopped typist coasts down; mistakes/backspaces cannot add engine power.
   const age=Math.max(0,(now-row.advance)/1000),power=age<.22?row.power:row.power*Math.exp(-(age-.22)*3.6);
   result.push({id:driver.id,position:[...driver.position],power:power<.01?0:power,own:driver.id===me});
  }
  return result;
 }
}

/** Own vehicle plus nearest rivals. Stable identity breaks equal-distance ties. */
export function audibleRaceMotors(drivers:RaceMotorFrame[],listener:AudioPoint,limit=4){
 const distance=(row:RaceMotorFrame)=>row.position.reduce((sum,n,i)=>sum+(n-listener[i])**2,0);
 return drivers.filter(row=>row.position.every(Number.isFinite)&&Number.isFinite(row.power))
  .sort((a,b)=>Number(b.own)-Number(a.own)||distance(a)-distance(b)||a.id.localeCompare(b.id))
  .slice(0,Math.max(0,Math.min(4,limit)));
}
