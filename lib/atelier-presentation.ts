import {wordKey} from './game/category-rules';
export const ATELIER_PAGE_SIZE=3;
type Crew={id?:string;name?:string};
export function atelierSeat(i:number,count:number){const a=Math.PI/2+i/Math.max(1,count)*Math.PI*2;return [Math.cos(a)*11.1,1.2,Math.sin(a)*9.3] as [number,number,number];}
/** No foreign drafts or ballots are read by the presentation. */
export function atelierFrame(game:any,crew:Crew[],me:string,draft:any={},page=0){
 const writing=game.stage==='answer',summary=['roundReveal','done'].includes(game.stage),resolved=game.stage==='voteReveal'||summary;
 const review=game.stage==='voteReveal'?game.lastReview:null;
 const options=summary?[...(game.reveal?.players??[])].sort((a,b)=>b.score-a.score).map(p=>({key:p.id,answer:crew.find(c=>c.id===p.id)?.name??'Crew',owners:[p.id],score:p.score,categories:p.categories})):writing?[]:review?.options??game.options??[];
 const compact=!!draft.atelierCompact,pageSize=compact?1:ATELIER_PAGE_SIZE,pages=Math.max(1,Math.ceil(options.length/pageSize)),current=Math.max(0,Math.min(pages-1,Number.isFinite(page)?Math.floor(page):0));
 const cards=options.slice(current*pageSize,(current+1)*pageSize).map((o:any)=>({key:o.key,answer:String(o.answer??''),owners:o.owners??[],names:(o.owners??[]).map((id:string)=>crew.find(c=>c.id===id)?.name??'Crew'),same:(o.owners?.length??0)>1,formatValid:o.formatValid!==false,accepted:resolved&&!summary?!!o.accepted:null,points:summary?o.score:resolved?o.points:null,yes:resolved&&!summary?o.yes:null,no:resolved&&!summary?o.no:null,reason:summary?`${o.categories?.filter((c:any)=>c.accepted).length??0} / 7 gültig`:resolved?o.reason:null}));
 const own=writing?(draft.categories??game.mine?.answers??[]):[],rows=crew.map((p,i)=>({id:p.id,point:atelierSeat(i,crew.length),filled:writing?(p.id===me?own.filter((s:string)=>wordKey(s)).length:Number(game.progress?.[p.id??'']?.filled??0)):null,ready:!!(writing?game.progress?.[p.id??'']?.submitted:game.progress?.[p.id??'']?.voted),score:summary?game.reveal?.players?.find((r:any)=>r.id===p.id)?.score:null}));
 return {writing,summary,resolved,compact,pageSize,category:summary?`RUNDENERGEBNIS · ${game.reveal?.letter??game.letter??''}`:writing?`BUCHSTABE ${game.letter??''}`:review?.category??game.category??game.categories?.[game.categoryIndex]??'EURE IDEEN',categoryIndex:review?.index??game.categoryIndex,letter:game.letter??'',page:current,pages,total:options.length,cards,rows,ready:rows.filter(r=>r.ready).length,filled:own.map((s:string)=>!!wordKey(s)),canWrite:writing&&!!game.mine&&!game.mine.submitted&&!game.mine.abandoned};
}
export function atelierNotebookCamera(index:number,count:number,aspect:number){const seat=atelierSeat(index,count);return {target:[seat[0]*.87,2,seat[2]*.87] as [number,number,number],yaw:Math.atan2(seat[0],seat[2]),pitch:.65,distance:Math.max(8.8,2.6/(Math.tan(21*Math.PI/180)*Math.max(.1,aspect)))};}
/** Fit the actual bounds under the same non-unit orbit convention as AdventureStage. */
export function atelierCameraDistance(aspect:number,yaw:number,pitch:number,target:{x:number;y:number;z:number},close=false){
 const raw=[Math.sin(yaw),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],len=Math.hypot(...raw),axis=raw.map(v=>v/len),rlen=Math.hypot(axis[2],axis[0]),right=[axis[2]/rlen,0,-axis[0]/rlen],up=[axis[1]*right[2],axis[2]*right[0]-axis[0]*right[2],-axis[1]*right[0]],tan=Math.tan(21*Math.PI/180);let distance=0;
 for(const x of close?[-7.9,7.9]:[-12.4,12.4])for(const y of close?[.8,9]:[.2,9])for(const z of close?[-7.4,-6.4]:[-10.3,10.4]){const v=[x-target.x,y-target.y,z-target.z],dot=(a:number[])=>a.reduce((s,n,i)=>s+n*v[i],0);distance=Math.max(distance,dot(axis)+Math.abs(dot(right))/(tan*Math.max(.1,aspect)*.91),dot(axis)+Math.abs(dot(up))/(tan*.79));}return(distance+.3)/len;
}
/** Preserve even long unbroken answers; caller supplies actual canvas glyph widths. */
export function atelierWrap(text:string,width:number,measure:(s:string)=>number){const lines:string[]=[];let line='';for(const char of text){if(line&&measure(line+char)>width){lines.push(line);line='';}line+=char;}if(line)lines.push(line);return lines;}

/** The public review board sits beside the private ballot, within the full-size world. */
export function atelierVotingCamera(width:number,height:number){
 const left=24,right=Math.min(500,Math.max(340,width*.3))+width*.04+24;
 const distance=atelierCameraDistance(Math.max(.2,(width-left-right)/height),0,0,{x:0,y:4.8,z:-6.7},true);
 return {target:[(right-left)*distance*Math.tan(21*Math.PI/180)/height,4.8,-6.7] as [number,number,number],yaw:0,pitch:0,distance};
}
