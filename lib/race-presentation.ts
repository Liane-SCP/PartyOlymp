export interface RaceFinish {id:string;at:number;wpm:number;place:number}
/** Fit the actual course volume, not the surrounding sea, for every overview orbit. */
export function raceOverviewDistance(aspect:number,yaw:number,pitch:number,target:{x:number;y:number;z:number}){
 const raw=[Math.sin(yaw),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],length=Math.hypot(...raw),axis=raw.map(v=>v/length),rlen=Math.hypot(axis[2],axis[0]),right=[axis[2]/rlen,0,-axis[0]/rlen],up=[axis[1]*right[2],axis[2]*right[0]-axis[0]*right[2],-axis[1]*right[0]],tan=Math.tan(21*Math.PI/180);
 let distance=0;
 for(const x of[-18,18])for(const y of[0,8])for(const z of[-12,12]){const v=[x-target.x,y-target.y,z-target.z],dot=(a:number[])=>a.reduce((sum,n,i)=>sum+n*v[i],0);distance=Math.max(distance,dot(axis)+Math.abs(dot(right))/(tan*Math.max(.1,aspect)*.9),dot(axis)+Math.abs(dot(up))/(tan*.7));}
 return (distance+1)/length;
}
/** Ties share place; sorting is based exclusively on the server timestamp. */
export function raceFinishes(game:any):RaceFinish[]{
 const rows=Object.entries(game.racers??{}).flatMap(([id,value])=>{const p=value as any;return typeof p.finishedAt==='number'?[{id,at:p.finishedAt,wpm:Number(p.finishedWpm)||0,place:0}]:[];}).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
 return rows.map(row=>({...row,place:rows.filter(other=>other.at<row.at).length+1}));
}
export function raceFinishTitle(game:any,crew:{id?:string;name?:string}[]){
 const finished=raceFinishes(game);if(!finished.length)return ['roundReveal','done'].includes(game.stage)?'RENNEN BEENDET':'WORT FÜR WORT INS ZIEL';
 const winner=finished[0],name=crew.find(p=>p.id===winner.id)?.name??'CREW';
 return finished.filter(p=>p.place===1).length>1?'FOTOFINISH · GEMEINSAM AUF PLATZ 1':`${name.toUpperCase()} · ${winner.wpm} WPM · PLATZ 1`;
}
