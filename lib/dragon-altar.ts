export type DragonRisk='safe'|'bold'|'risky';
export type DragonDraft={price:string;risk:DragonRisk};
export const dragonChoices=[
 {id:'safe',title:'Sicher',max:'1.000',hint:'Verzeiht Abweichungen',color:'#9cc8ac'},
 {id:'bold',title:'Mutig',max:'1.250',hint:'Genauigkeit zählt doppelt',color:'#d9b86d'},
 {id:'risky',title:'Riskant',max:'1.600',hint:'Nur sehr nah richtig stark',color:'#c18ca7'},
] as const;
export function isDragonRisk(value:unknown):value is DragonRisk{return dragonChoices.some(c=>c.id===value);}
export function dragonEstimate(price:string){const value=Number(price.trim().replace(',','.'));return /^\d{1,7}([.,]\d{1,2})?$/.test(price.trim())&&value>0&&value<=1000000?Math.round(value*100):undefined;}
export function dragonOwnDraft(room:any):DragonDraft{
 const g=room.game,draft=g.mine?.timeoutInput,action=draft?.phase===room.phaseKey?draft.action:undefined;
 if(g.mine?.submitted&&Number.isInteger(g.mine.guess)&&g.mine.guess>0&&isDragonRisk(g.mine.risk))return {price:(g.mine.guess/100).toFixed(2).replace('.',','),risk:g.mine.risk};
 if(action?.type==='estimate'&&action.round===g.round&&Number.isInteger(action.guess)&&action.guess>0&&action.guess<=100000000&&isDragonRisk(action.risk))return {price:(action.guess/100).toFixed(2).replace('.',','),risk:action.risk};
 return {price:'',risk:'safe'};
}
export function dragonDraftKey(room:any,me:string){return `olymp.dragon:${room.code}:${me}`;}
