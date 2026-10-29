export type ChainEntry={id:string;player:string;answer:string;valid:boolean;at?:number;reason?:string};
export type ChainCrew={id?:string;name?:string};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>n*n*(3-2*n);
export function chainPath(step:number){return [-4+step*1.1,.52,Math.sin(step*Math.PI/12)*2.1] as [number,number,number];}
export function chainTravel(entries:ChainEntry[],now:number,reduced=false){
 const accepted=entries.length,last=entries.at(-1),age=last?.at==null?Infinity:Math.max(0,now-last.at);
 const u=reduced?1:clamp((age-350)/700),progress=accepted&&u<1?accepted-1+ease(u):accepted;
 return {accepted,progress,moving:accepted>0&&u>0&&u<1,build:reduced?1:clamp(age/350),scroll:Math.max(0,progress-4)*1.1};
}
export function chainFrame(game:any,crew:ChainCrew[],me:string,now:number,reduced=false,entries:ChainEntry[]=(game.history??[]).filter((e:ChainEntry)=>e.valid===true)){
 const travel=chainTravel(entries,now,reduced),chapter=Math.floor(travel.progress/12),first=Math.max(0,chapter-1),islands=[first,first+1,first+2],cols=Math.min(6,Math.max(1,crew.length));
 const rows=crew.map((p,i)=>{
  const alive=game.roster?.[p.id??'']?.alive!==false,step=travel.progress-Math.floor(i/2)*1.2,point=chainPath(step);point[0]-=travel.scroll;point[2]+=i%2?-.8:.8;
  const at=Number(game.eliminatedAt?.[p.id??'']??0),leaving=!alive?(reduced||!at?1:clamp((now-at)/850)):0;
  if(!alive){const source=chainPath(Number(game.eliminatedStep?.[p.id??'']??travel.accepted)-Math.floor(i/2)*1.2);source[0]-=travel.scroll;source[2]+=i%2?-.8:.8;const ferry=[-6+(i%cols-(cols-1)/2)*1.4,.52,6.5+Math.floor(i/cols)*1.15],u=ease(leaving);for(let a=0;a<3;a++)point[a]=source[a]+(ferry[a]-source[a])*u;point[1]+=Math.sin(u*Math.PI)*1.6;}
  return {id:p.id,name:p.name??'Crew',alive,point,leaving,active:p.id===game.turnId,approved:!!game.roster?.[p.id??'']?.approved,voted:!!game.roster?.[p.id??'']?.voted};
 });
 const start=Math.max(1,Math.floor(travel.progress)-18),planks=entries.slice(start-1,Math.min(entries.length,start+23)).map((entry,i)=>{const number=start+i,p=chainPath(number-.5);p[0]-=travel.scroll;return {number,answer:entry.answer,point:p,build:number===travel.accepted?travel.build:1};});
 const nextPoint=chainPath(travel.accepted+.5);nextPoint[0]-=travel.scroll;
 return {...travel,chapter,islands,rows,planks,nextPoint,canType:!!game.mine&&game.mine.alive!==false&&!game.mine.abandoned&&game.stage==='answer'&&game.turnId===me,reviewing:game.stage==='review',voting:game.stage==='challenge',revealing:['roundReveal','done'].includes(game.stage),ready:rows.filter(r=>r.id!==game.turnId&&(game.stage==='challenge'?r.voted:r.approved)).length};
}
export function chainCameraDistance(aspect:number,personal=false){return personal?Math.max(11,3.4/(Math.tan(21*Math.PI/180)*Math.max(.1,aspect))):Math.max(26,8/(Math.tan(21*Math.PI/180)*Math.max(.1,aspect)));}
