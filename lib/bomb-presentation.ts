export interface BombPose {weights:Record<string,number>;lift:number}
export interface BombHandoff {from:string;to:string;at:number;turn:number;origin:BombPose}
/** A fixed flight, unrelated to the hidden fuse. Weights preserve rapid handoffs. */
export function bombPose(handoff:BombHandoff|null|undefined,now:number,holder:string):BombPose{
 if(!handoff)return {weights:{[holder]:1},lift:0};
 const u=Math.max(0,Math.min(1,(now-handoff.at)/500));if(u===1)return {weights:{[handoff.to]:1},lift:0};
 const weights:Record<string,number>={};for(const[id,w]of Object.entries(handoff.origin.weights))weights[id]=w*(1-u);weights[handoff.to]=(weights[handoff.to]??0)+u;
 return {weights,lift:handoff.origin.lift*(1-u)+Math.sin(u*Math.PI)*1.4};
}
export function bombSeat(index:number,count:number){const a=Math.PI/2+index/Math.max(1,count)*Math.PI*2;return [Math.cos(a)*8.8,.3,Math.sin(a)*5.7] as [number,number,number];}
/** A low side bench keeps the bomb and the original avatar face separate. */
export function bombStation(index:number,count:number){const seat=bombSeat(index,count);return [seat[0]+1.15,1.8,seat[2]] as [number,number,number];}
export function bombCameraTarget(seat:{x:number;z:number}){return [seat.x+.575,2,seat.z] as [number,number,number];}
export function bombCameraDistance(aspect:number){return Math.max(12,3.9/(Math.tan(21*Math.PI/180)*Math.max(.1,aspect)));}
export function bombFrame(game:any,crew:{id?:string;name?:string}[],me:string,now:number){
 const exploding=game.stage==='explosion',revealing=['roundReveal','done'].includes(game.stage),at=Number(game.explosionAt??0),age=exploding&&at?Math.max(0,(now-at)/1000):Infinity,pose=bombPose(game.handoff,exploding&&at?at:now,game.turnId??''),position=[0,1.8+pose.lift,0];
 crew.forEach((p,i)=>{const station=bombStation(i,crew.length),w=pose.weights[p.id??'']??0;position[0]+=station[0]*w;position[2]+=station[2]*w;});
 const rows=crew.map(p=>{const r=game.roster?.[p.id??'']??{},eliminated=Number(game.eliminatedAt?.[p.id??'']??0),u=r.alive===false?(eliminated?Math.max(0,Math.min(1,(now-eliminated-700)/800)):1):0;return {id:p.id,name:p.name??'Crew',alive:r.alive!==false,words:Number(r.words??0),voted:!!r.voted,leaving:u,bench:u*u*(3-2*u)};});
 const judges=rows.filter(r=>r.id!==game.turnId),verdict=game.lastVerdict&&now-game.lastVerdict.at>=0&&now-game.lastVerdict.at<3000?{word:String(game.lastVerdict.word),yes:Number(game.lastVerdict.yes),no:Number(game.lastVerdict.no),valid:!!game.lastVerdict.valid}:null;
 return {position,exploding,revealing,smokeAge:age,smoke:age<1.6,rows,alive:rows.filter(r=>r.alive).length,judging:game.stage==='judge',ready:judges.filter(r=>r.voted).length,judges:judges.length,verdict,canType:!!game.mine&&!game.mine.abandoned&&game.mine.alive!==false&&game.stage==='word'&&game.turnId===me};
}
