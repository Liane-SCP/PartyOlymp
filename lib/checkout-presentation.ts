export interface CheckoutRow {id:string;items:string[];sum:number;over:boolean;count:number}
export type CheckoutOutcome='empty'|'over'|'close'|'within';
export function checkoutOutcome(sum:number,budget:number,count:number):CheckoutOutcome{
 if(!count)return 'empty';if(sum>budget)return 'over';return budget-sum<=Math.max(100,budget*.03)?'close':'within';
}
/** A shared, seekable checkout fits inside the existing 19-second public reveal. */
export function checkoutPresentation(game:any,now:number){
 if(!['roundReveal','done'].includes(game.stage)||!game.reveal)return null;
 const rows:CheckoutRow[]=game.reveal.players??[],items:any[]=game.reveal.items??[],budget=Number(game.budget)||0;
 if(!rows.length)return null;
 const started=Number.isFinite(game.revealStartedAt)?game.revealStartedAt:now-16000;
 const slot=Math.min(3400,14000/rows.length),age=Math.max(0,now-started),intro=age<800,elapsed=Math.max(0,age-800);
 const index=Math.min(rows.length-1,Math.floor(elapsed/slot)),row=rows[index],ids=row.items??[],local=elapsed-index*slot;
 const scanProgress=Math.max(0,local/(slot*.65)*ids.length),scanned=Math.min(ids.length,Math.floor(scanProgress));
 const chosen=ids.map(id=>items.find(item=>item.id===id)).filter(Boolean),total=chosen.slice(0,scanned).reduce((n,item)=>n+item.price,0);
 const summary=elapsed>=slot*rows.length,complete=summary||scanned>=ids.length;
 const finalTotal=Number.isFinite(row.sum)?row.sum:chosen.reduce((n,item)=>n+item.price,0);
 const completed=summary?rows.length:index;
 return {row,index,ids,chosen,scanProgress,customerProgress:Math.max(0,Math.min(1,local/slot)),scanned:summary?ids.length:scanned,total:summary?finalTotal:total,remaining:budget-(summary?finalTotal:total),budget,complete,summary,intro,completed,count:rows.length,
  outcome:complete?checkoutOutcome(finalTotal,budget,ids.length):null,
  successful:rows.filter(r=>(r.items??[]).length>0&&!r.over).length,
  rows:rows.map((r,i)=>({id:r.id,complete:summary||i<index||(i===index&&complete),sum:i<index||summary?r.sum:i===index?total:null,over:i<index||summary?r.over:i===index&&complete?r.over:null}))};
}
