export type QualityChoice='auto'|'high'|'medium'|'low';
export type QualityTier=Exclude<QualityChoice,'auto'>;
export const qualityProfiles={
 high:{dpr:1.5,fps:60,shadows:true,shadowSize:1024},
 medium:{dpr:1.15,fps:30,shadows:true,shadowSize:512},
 low:{dpr:1,fps:30,shadows:false,shadowSize:256},
} as const;
export function validQuality(value:unknown):QualityChoice{return ['auto','high','medium','low'].includes(String(value))?value as QualityChoice:'auto';}
/** Measurements are local render evidence, never a claim about a reference device. */
export class AdventureQuality {
 tier:QualityTier;private times:number[]=[];private renderTimes:number[]=[];private badWindows=0;
 metrics={p95:0,renderP95:0,samples:0};
 constructor(readonly mobile:boolean){this.tier=mobile?'medium':'high';}
 choose(choice:QualityChoice){return choice==='auto'?this.tier:choice;}
 sample(frameMs:number,renderMs:number,choice:QualityChoice){
  if(frameMs<=0||frameMs>250)return;
  this.times.push(frameMs);this.renderTimes.push(renderMs);
  if(this.times.length<90)return;
  const percentile=(list:number[])=>list.sort((a,b)=>a-b)[Math.floor(list.length*.95)];
  this.metrics={p95:percentile(this.times),renderP95:percentile(this.renderTimes),samples:this.times.length};this.times=[];this.renderTimes=[];
  if(choice!=='auto')return;
  const slow=this.metrics.renderP95>(this.tier==='high'?14:25)||this.metrics.p95>(this.tier==='high'?28:48);
  this.badWindows=slow?this.badWindows+1:0;
  if(this.badWindows>=2){this.tier=this.tier==='high'?'medium':'low';this.badWindows=0;}
 }
 resetWindow(){this.times=[];this.renderTimes=[];this.badWindows=0;}
}
