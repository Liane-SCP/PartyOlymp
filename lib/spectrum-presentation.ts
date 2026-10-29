export const SPECTRUM_REVEAL_MS=1100;
export function spectrumX(value:number){return -8+Math.max(0,Math.min(100,value))*.16;}
type Crew={id?:string;name?:string;color?:string};
export function spectrumFrame(game:any,crew:Crew[],me:string,now:number,page=0,compact=false){
 const revealed=['roundReveal','done'].includes(game.stage)&&!!game.reveal,psychic=game.psychic===me;
 const rawTarget=revealed?game.reveal.target:psychic?game.target:null,target=typeof rawTarget==='number'&&Number.isFinite(rawTarget)?Math.max(0,Math.min(100,rawTarget)):null;
 const rows=crew.map((p,i)=>{const r=revealed?game.reveal.players?.find((r:any)=>r.id===p.id):null,guess=typeof r?.guess==='number'&&Number.isFinite(r.guess)?r.guess:null,role=p.id===game.psychic,excluded=role||!!game.reveal?.missingClue;
  return {id:p.id,index:i+1,name:p.name??`Crew ${i+1}`,color:p.color??'#c8d9b0',psychic:role,submitted:!!game.submitted?.[p.id??''],guess:revealed?guess:null,score:revealed?Number(r?.score??0):null,distance:revealed&&guess!==null?Number(r?.distance??Math.abs(guess-(target??guess))):null,excluded:revealed&&excluded,status:revealed?(game.reveal.missingClue?'Kein Hinweis · keine Wertungsrunde':role?'Hinweisgeber · keine Wertungsrunde':guess===null?'Kein Tipp · 0 Punkte':`${r?.score??0} Punkte · ${r?.distance??Math.abs(guess-(target??guess))} Abstand`):role?'Hinweisgeber':game.submitted?.[p.id??'']?'Versiegelt':'Denkt nach'};
 });
 const pageSize=compact?1:3,pages=Math.max(1,Math.ceil(rows.length/pageSize)),current=Math.max(0,Math.min(pages-1,Number.isFinite(page)?Math.floor(page):0));
 const age=revealed&&Number.isFinite(game.revealStartedAt)?Math.max(0,now-game.revealStartedAt):SPECTRUM_REVEAL_MS;
 const estimate=!psychic?Math.max(0,Math.min(100,Number(game.mine?.submitted?game.mine.guess??game.mine.dial??50:game.mine?.dial??50))):null;
 return {revealed,psychic,target,known:target!==null,estimate,canDial:game.stage==='guess'&&!psychic&&!game.mine?.submitted&&!game.mine?.abandoned,rows:revealed?rows:rows.map(r=>({...r,excluded:false})),cards:revealed?rows.slice(current*pageSize,(current+1)*pageSize):[],page:current,pages,pageSize,compact,age,progress:Math.min(1,age/SPECTRUM_REVEAL_MS),missingClue:revealed&&!!game.reveal.missingClue,clue:String(game.clue??''),axis:game.axis??{left:'LINKER POL',right:'RECHTER POL'}};
}

export function spectrumCamera(aspect:number,focused=false,compact=false,revealed=false){
 // A portrait result lens keeps the crew's foreground seats below the machine
 // in view. Short, wide lenses retain the higher instrument reading center.
 const readingCenter=compact&&revealed?4.4+1.65*Math.max(0,Math.min(1,(aspect-1.5)/.5)):4.9;
 const target=[0,focused?readingCenter:5,-1] as [number,number,number],yaw=0,pitch=focused?0:.4,axis=[0,Math.sin(pitch),Math.cos(pitch)],up=[0,Math.cos(pitch),-Math.sin(pitch)],tan=Math.tan(21*Math.PI/180);let distance=0;
 for(const x of focused?[-9,9]:[-14.3,14.3])for(const y of focused?[1.1,compact&&revealed?10.8:8.8]:[.1,11.6])for(const z of focused?[.1,revealed?1.2:4.95]:[-9,8.5]){const v=[x,y-target[1],z-target[2]],along=v[1]*axis[1]+v[2]*axis[2],vertical=v[1]*up[1]+v[2]*up[2];distance=Math.max(distance,along+Math.abs(x)/(tan*Math.max(.12,aspect)*.91),along+Math.abs(vertical)/(tan*.88));}
 return {target,yaw,pitch,distance:distance+.3};
}

export function spectrumWrap(text:string,width:number,measure:(s:string)=>number){const lines:string[]=[];let line='';for(const glyph of text){if(line&&measure(line+glyph)>width){lines.push(line);line='';}line+=glyph;}if(line)lines.push(line);return lines;}
