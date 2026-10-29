import {herdGroupCenter,herdMemberPosition} from './herd-layout';

export const HERD_GATHER_MS=1700;
export function herdSeat(index:number,count:number){const angle=Math.PI/2+index/Math.max(1,count)*Math.PI*2;return {x:Math.cos(angle)*8.5,z:Math.sin(angle)*5.5};}
export function herdThoughtCamera(index:number,count:number,aspect:number){const p=herdSeat(index,count);return {target:[p.x,1.4,p.z] as [number,number,number],yaw:0,pitch:.28,distance:Math.max(6.8,1.7/(Math.tan(21*Math.PI/180)*Math.max(.1,aspect)))};}
export function herdFrame(game:any,crew:{id?:string}[],now:number,reduced=false){
 const revealed=['roundReveal','done'].includes(game.stage)&&!!game.reveal;
 const groups:{answer:string;ids:string[];score:number;winner:boolean}[]=revealed?(game.reveal.groups??[]).map((g:any)=>{const score=Math.max(0,...g.ids.map((id:string)=>Number(game.reveal.players?.find((p:any)=>p.id===id)?.score??0)));return {answer:String(g.answer??''),ids:[...g.ids],score,winner:score>0};}):[];
 const age=revealed&&Number.isFinite(game.revealStartedAt)?Math.max(0,now-game.revealStartedAt):HERD_GATHER_MS;
 const progress=!revealed?0:reduced?1:Math.min(1,age/HERD_GATHER_MS),ease=progress*progress*(3-2*progress);
 const rows=crew.map((p,i)=>{const from=herdSeat(i,crew.length),group=groups.findIndex(g=>g.ids.includes(p.id??'')),to=revealed?herdMemberPosition(groups,p.id??''):null,missing=revealed&&!to,spot=missing?{x:-6+i*12/Math.max(1,crew.length-1),z:9}:to??from;return {id:p.id,group,submitted:!!game.submitted?.[p.id??''],missing,score:revealed?Number(game.reveal.players?.find((r:any)=>r.id===p.id)?.score??0):null,x:from.x+(spot.x-from.x)*ease,z:from.z+(spot.z-from.z)*ease};});
 return {revealed,groups,rows,age,progress,moving:revealed&&progress<1,ready:revealed&&progress===1,round:game.round??1,question:revealed?game.reveal.question??game.question:game.question,winners:groups.filter(g=>g.winner).length,missing:rows.filter(r=>r.missing).length};
}

/** Fixed view directions keep group signs legible; fit both figures and signs. */
export function herdCamera(aspect:number,groups:{ids:string[]}[],selected=-1){
 const close=selected>=0&&selected<groups.length,center=close?herdGroupCenter(selected,groups.length):{x:0,z:0},target=[center.x,close?2.7:3.6,center.z] as [number,number,number],yaw=0,pitch=close?.28:.48;
 const axis=[0,Math.sin(pitch),Math.cos(pitch)],up=[0,Math.cos(pitch),-Math.sin(pitch)],tan=Math.tan(21*Math.PI/180);let distance=0;
 const points:number[][]=[];
 if(close){for(const x of[-3.25,3.25])for(const y of[3.4,5.9])points.push([x,y,-2.8]);for(const id of groups[selected].ids){const p=herdMemberPosition(groups,id)!;for(const y of[.2,2.65])points.push([p.x-center.x,y,p.z-center.z]);}for(const x of[-3.4,3.4])for(const z of[-3.4,3.4])points.push([x,.2,z]);}
 else for(const x of[-15.8,15.8])for(const y of[.1,10.7])for(const z of[-13,10.5])points.push([x,y,z]);
 for(const [x,y,z] of points){const v=[x,y-target[1],z],along=v[1]*axis[1]+v[2]*axis[2],vertical=v[1]*up[1]+v[2]*up[2];distance=Math.max(distance,along+Math.abs(x)/(tan*Math.max(.12,aspect)*.9),along+Math.abs(vertical)/(tan*.86));}
 return {target,yaw,pitch,distance:distance+.4,close};
}

/** Preserve every glyph; canvas supplies real glyph widths. */
export function herdWrap(text:string,width:number,measure:(s:string)=>number){const lines:string[]=[];let line='';for(const glyph of text){if(line&&measure(line+glyph)>width){lines.push(line);line='';}line+=glyph;}if(line)lines.push(line);return lines;}
