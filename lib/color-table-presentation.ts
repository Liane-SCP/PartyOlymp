import {playable} from './game/games/cards';

export const colorCardPalette=['#ed9caa','#8bcde4','#bedb99','#ebc187'];
export const colorCardMarks=['◆','●','▲','■'];
export const colorCardNames=['Koralle','Blau','Limette','Orange'];
export const colorHandPageSize=8;
export const colorHandClosePageSize=3;
export const colorHandBounds={x:[-3.5,3.5],y:[1.5,2.2],z:[2.65,5.65]};
export function colorHandDistance(aspect:number,pitch=1.05){
 const target=[0,1.85,4.15],axis=[0,Math.sin(pitch),Math.cos(pitch)],up=[0,axis[2],-axis[1]],tan=Math.tan(21*Math.PI/180);let distance=5;
 for(const x of colorHandBounds.x)for(const y of colorHandBounds.y)for(const z of colorHandBounds.z){const v=[x-target[0],y-target[1],z-target[2]],dot=(a:number[])=>a.reduce((sum,n,i)=>sum+n*v[i],0);distance=Math.max(distance,dot(axis)+Math.abs(x)/(tan*Math.max(.1,aspect)*.9),dot(axis)+Math.abs(dot(up))/(tan*.84));}return distance+.15;
}
export const colorCardSymbol=(card:any)=>!card?'✦':card.value<10?String(card.value):['⊘','⇄','+2','✦','+4'][card.value-10]??'?';
export function colorMoveCue(game:any){const move=game.lastMove;if(move?.kind!=='play')return 'card';return game.counts?.[move.player]===1?'cardLast':move.card?.value===11?'cardReverse':move.count?'cardPenalty':move.card?.value===10?'cardSkip':'card';}
export function colorCardSlot(card:any){return card?.color>=0&&card.color<4&&Number.isInteger(card.value)&&card.value>=0&&card.value<=12?card.color*13+card.value:card?.color===4&&[13,14].includes(card.value)?52+card.value-13:54;}
export function colorTableFrame(game:any,me:string,now:number,draft:any={}){
 const personal=!!draft.cardFocused&&!!game.mine&&game.stage==='answer',viewOnly=!!draft.cardExpanded&&!personal,pageSize=personal?colorHandClosePageSize:colorHandPageSize;
 const hand=game.mine?.hand??[],pages=Math.max(1,Math.ceil(hand.length/pageSize)),page=Math.max(0,Math.min(pages-1,Math.floor(Number(draft.cardPage)||0))),offset=page*pageSize;
 const ownTurn=game.stage==='answer'&&game.turnId===me&&!!game.mine&&!viewOnly&&!draft.cardPending,wild=!!draft.cardWild&&hand.some((c:any)=>c.id===draft.cardWild&&c.color===4);
 const own=hand.slice(offset,offset+pageSize).map((card:any,i:number)=>({card,index:offset+i,playable:ownTurn&&!wild&&!!game.top&&playable(card,game.top,game.color)}));
 const move=game.lastMove,age=now-Number(move?.at??-Infinity),liveMove=move&&age>=0&&age<1200?move:null;
 const lastCard=move?.kind==='play'&&game.counts?.[move.player]===1&&age>=0&&age<3000?move.player:null;
 const revealing=['roundReveal','done'].includes(game.stage),winner=revealing?game.reveal?.winner:null;
 const order=game.order??Object.keys(game.counts??{}),at=order.indexOf(game.turnId),next=at>=0?order[(at+(game.direction===-1?-1:1)+order.length)%order.length]:null;
 return {own,pages,page,offset,pageSize,personal,viewOnly,ownTurn,wild,move:liveMove,age,lastCard,revealing,winner,next,direction:game.direction===-1?-1:1,color:Math.max(0,Math.min(3,Number(game.color)||0))};
}
