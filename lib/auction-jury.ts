export type JuryMark=boolean|null|'open';
export type JurySheet={marks:JuryMark[];page:number;active:number};
const mark=(v:unknown):v is JuryMark=>v===true||v===false||v===null||v==='open';
export function jurySheet(count:number):JurySheet{return {marks:Array(count).fill('open'),page:0,active:0};}
export function jurySummary(marks:JuryMark[]){return {yes:marks.filter(v=>v===true).length,no:marks.filter(v=>v===false).length,abstain:marks.filter(v=>v===null).length,open:marks.filter(v=>v==='open').length,reviewed:marks.filter(v=>v!=='open').length};}
export function juryBallot(marks:JuryMark[]){return marks.map(v=>v==='open'?null:v);}
export function restoreJurySheet(raw:unknown,words:string[]):JurySheet|null{
 if(!raw||typeof raw!=='object')return null;const s=raw as any;
 if(s.version!==1||JSON.stringify(s.words)!==JSON.stringify(words)||!Array.isArray(s.marks)||s.marks.length!==words.length||!s.marks.every(mark))return null;
 const pages=Math.max(1,Math.ceil(words.length/6));
 return {marks:[...s.marks],page:Number.isInteger(s.page)?Math.max(0,Math.min(pages-1,s.page)):0,active:Number.isInteger(s.active)?Math.max(0,Math.min(words.length-1,s.active)):0};
}
export function serverJurySheet(game:any,phase:string):JurySheet{
 const count=game.answers.length,base=jurySheet(count),draft=game.mine?.timeoutInput;
 if(game.mine?.submitted&&Array.isArray(game.mine.ballot)&&game.mine.ballot.length===count&&game.mine.ballot.every((v:unknown)=>v===null||typeof v==='boolean'))return {...base,marks:[...game.mine.ballot]};
 const a=draft?.action;
 if(draft?.phase!==phase||a?.type!=='judge'||a.round!==game.round||!Array.isArray(a.votes)||a.votes.length!==count||!a.votes.every((v:unknown)=>v===null||typeof v==='boolean'))return base;
 const reviewed=Array.isArray(a.reviewed)&&a.reviewed.length===count&&a.reviewed.every((v:unknown)=>typeof v==='boolean')?a.reviewed:null;
 return {...base,marks:a.votes.map((v:boolean|null,i:number)=>reviewed?reviewed[i]?v:'open':v===null?'open':v)};
}
export function nextOpenJuryPage(marks:JuryMark[],page:number){
 const start=Math.min(marks.length,(page+1)*6);
 for(let offset=0;offset<marks.length;offset++){const index=(start+offset)%marks.length;if(marks[index]==='open')return Math.floor(index/6);}
 return page;
}
