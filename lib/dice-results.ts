import {diceTotal} from './game/games/dice';
export const diceResultsVisible=(game:any)=>['roundReveal','done'].includes(game.stage);
export function diceHistoryGame(entry:any){
 const players=(entry?.results??[]).flatMap((result:any)=>{const detail=Array.isArray(result.detail)?result.detail.findLast((row:any)=>Array.isArray(row?.sheet)):null;return detail?[{id:result.id,sheet:[...detail.sheet],total:Number.isFinite(detail.total)?detail.total:result.raw}]:[];});
 return {id:'dice',stage:'done',reveal:{players}};
}
export function diceResultRows(game:any,crew:{id?:string;name?:string}[]=[]){
 if(!diceResultsVisible(game))return [];
 const revealed:any[]=game.reveal?.players??[],ids=revealed.length?revealed.map(p=>p.id):Object.keys(game.opponents??{});
 const rows=ids.map((id:string)=>{
  const result=revealed.find(p=>p.id===id),publicPlayer=game.opponents?.[id],source=result?.sheet??publicPlayer?.sheet??[],sheet:(number|null)[]=Array.from({length:13},(_,i)=>Number.isFinite(source[i])&&source[i]>=0?source[i]:null);
  const upper=sheet.slice(0,6).reduce<number>((a,b)=>a+(b??0),0),lower=sheet.slice(6).reduce<number>((a,b)=>a+(b??0),0),bonus=upper>=63?35:0,complete=sheet.every(v=>v!==null),total=Number.isFinite(result?.total)?result.total:complete?diceTotal(sheet):Number(publicPlayer?.total??0);
  return {id,name:crew.find(p=>p.id===id)?.name??'Crew',sheet,upper,lower,bonus,total,complete,rank:0};
 }).sort((a,b)=>b.total-a.total);
 rows.forEach((row,i)=>row.rank=i>0&&row.total===rows[i-1].total?rows[i-1].rank:i+1);
 return rows;
}
