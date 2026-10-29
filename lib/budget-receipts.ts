import {checkoutPresentation,checkoutOutcome} from './checkout-presentation';
export type BudgetReceiptView='auto'|'checkout'|'gallery'|'receipt';
export type BudgetReceiptOptions={view?:BudgetReceiptView;selected?:string|null;compact?:boolean};
const euro=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'});
export const receiptMoney=(cents:number|null)=>cents===null?'—':euro.format(cents/100);

/** Only the published reveal is a receipt source; stale reveals in answer are ignored. */
export function budgetReceiptFrame(game:any,crew:{id?:string;name?:string}[],me:string,now:number,options:BudgetReceiptOptions={}){
 const publicPhase=['roundReveal','done'].includes(game.stage)&&!!game.reveal,source:any[]=publicPhase?(game.reveal.players??[]):[],catalog:any[]=publicPhase?(game.reveal.items??[]):[],budget=publicPhase?Number(game.budget??0):0;
 const rows=source.map((row,index)=>{const ids:string[]=row.items??[],sum=typeof row.sum==='number'&&Number.isFinite(row.sum)?row.sum:null,score=typeof row.score==='number'&&Number.isFinite(row.score)?row.score:null;
  return {id:String(row.id),index,name:crew.find(p=>p.id===row.id)?.name??'Crew',sum,score,budget,count:ids.length,remaining:sum===null?null:budget-sum,outcome:sum===null?null:checkoutOutcome(sum,budget,ids.length),rank:score===null?null:1+source.filter(other=>Number.isFinite(other.score)&&other.score>score).length,
   items:ids.map(id=>{const item=catalog.find(p=>p.id===id);return {id,name:String(item?.name??item?.title??'Artikel'),price:typeof item?.price==='number'&&Number.isFinite(item.price)?item.price:null};})};});
 const own=rows.find(r=>r.id===me),selected=rows.find(r=>r.id===options.selected)??own??rows[0],size=options.compact?1:3,page=selected?Math.floor(selected.index/size):0,pages=Math.max(1,Math.ceil(rows.length/size)),checkout=checkoutPresentation(game,now),requested=options.view??'auto',mode=!rows.length?'checkout':requested==='auto'?(checkout?.summary?'gallery':'checkout'):requested;
 const visible=rows.slice(page*size,page*size+size),cards=visible.map((row,slot)=>({...row,slot,position:[(slot-(visible.length-1)/2)*3.3,4.8,6.65] as [number,number,number]}));
 return {public:!!rows.length,mode,rows,cards,selected:selected??null,own:own?.id??null,page,pages,size,budget,summary:!!checkout?.summary,successful:rows.filter(r=>r.count>0&&r.sum!==null&&r.sum<=budget).length};
}

export function budgetReceiptCamera(frame:ReturnType<typeof budgetReceiptFrame>,aspect:number){
 if(frame.mode==='checkout'||!frame.selected)return null;
 const selected=frame.cards.find(c=>c.id===frame.selected!.id),focus=frame.mode==='receipt',target=focus?(selected?.position??[0,4.8,6.65]):[0,4.4,6.65],halfWidth=focus?1.5:6.4,halfHeight=focus?2.9:4.4,tan=Math.tan(21*Math.PI/180);
 return {target:target as [number,number,number],yaw:0,pitch:0,distance:Math.max(halfWidth/(tan*Math.max(.1,aspect)*.9),halfHeight/(tan*(focus?.9:.68)))+.3};
}
