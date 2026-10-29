export type WikiGalleryMode='links'|'path'|'crew';
type Crew={id?:string;name?:string;color?:string};
const titleKey=(s:string)=>s.normalize('NFC').replaceAll('_',' ').trim();
export function wikiFrame(game:any,crew:Crew[],me:string,now:number,draft:any={}){
 const mode:WikiGalleryMode=['path','crew'].includes(draft.wikiMode)?draft.wikiMode:'links',compact=!!draft.wikiCompact,size=compact?1:3,revealed=['roundReveal','done'].includes(game.stage)&&!!game.reveal;
 const path=(game.path??[]).map((title:string,index:number)=>({index,title,kind:'path',current:index===(game.path??[]).length-1}));
 const current=titleKey(game.article?.title??path.at(-1)?.title??''),links=(game.article?.links??[]).map((title:string,index:number)=>({index,title,kind:'link'})).filter((r:{title:string})=>titleKey(r.title)!==current).map((r:any,ordinal:number)=>({...r,ordinal}));
 const rows=crew.map((p,i)=>{const r=game.racers?.[p.id??'']??{},result=revealed?game.reveal.players?.find((x:any)=>x.id===p.id):null;return {id:p.id,index:i+1,name:p.name??`Crew ${i+1}`,color:p.color??'#d8c59d',article:String(r.article??game.start??''),clicks:Math.max(0,Number(r.clicks??0)),arrived:!!r.arrived,elapsed:r.arrived?Number(r.elapsed??0):null,movedAt:typeof r.movedAt==='number'?r.movedAt:null,arrivalAt:r.arrived&&typeof r.arrivalAt==='number'?r.arrivalAt:null,score:revealed?Number(result?.score??0):null};});
 const items=mode==='links'?links:mode==='path'?path:rows.map(r=>({index:r.index-1,title:r.name,kind:'crew',row:r})),pages=Math.max(1,Math.ceil(items.length/size));
 const requested=mode==='links'?draft.wikiLinkPage??0:mode==='path'?draft.wikiPathPage??-1:draft.wikiCrewPage??0,page=Math.max(0,Math.min(pages-1,requested<0?pages-1:Math.floor(Number.isFinite(requested)?requested:0)));
 const arrivalTimes=rows.filter(r=>r.arrivalAt!==null).map(r=>r.arrivalAt!),arrivalAt=arrivalTimes.length?Math.min(...arrivalTimes):null,anyArrived=rows.some(r=>r.arrived),gate=anyArrived?(arrivalAt===null?1:Math.min(1,Math.max(0,(now-arrivalAt)/900))):0;
 const movedAt=game.racers?.[me]?.movedAt,age=typeof movedAt==='number'?now-movedAt:Infinity,shelfMotion=age>=0&&age<800?Math.sin(age/800*Math.PI):0;
 return {mode,currentArticle:String(game.article?.title??path.at(-1)?.title??game.start??''),compact,size,page,pages,total:items.length,cards:items.slice(page*size,(page+1)*size),pathLength:path.length,linkCount:links.length,rows,ownArrived:!!game.mine?.arrival,anyArrived,gate,shelfMotion,canNavigate:game.stage==='answer'&&!!game.mine&&!game.mine.arrival&&!game.mine.abandoned,canRead:game.stage==='answer'&&!!game.mine&&!!game.article,revealed,start:String(game.start??''),target:String(game.target??'')};
}
export function wikiCamera(aspect:number,focused=false,compact=false){
 const target=[0,focused?2.8:4.5,focused?-1:0] as [number,number,number],pitch=focused?0:.42,yaw=0,tan=Math.tan(21*Math.PI/180),up=[0,Math.cos(pitch),-Math.sin(pitch)],axis=[0,Math.sin(pitch),Math.cos(pitch)];let distance=0;
 for(const x of focused?compact?[-4.5,4.5]:[-8.2,8.2]:[-15.5,15.5])for(const y of focused?[.15,5.8]:[.05,13.1])for(const z of focused?[-1.4,-.6]:[-12.2,9.3]){const v=[x,y-target[1],z-target[2]],along=v[1]*axis[1]+v[2]*axis[2],vertical=v[1]*up[1]+v[2]*up[2];distance=Math.max(distance,along+Math.abs(x)/(tan*Math.max(.12,aspect)*.91),along+Math.abs(vertical)/(tan*.89));}
 return {target,pitch,yaw,distance:distance+.3};
}
export function wikiWrap(text:string,width:number,measure:(s:string)=>number){const lines:string[]=[];let line='';for(const glyph of text){if(line&&measure(line+glyph)>width){lines.push(line);line='';}line+=glyph;}if(line)lines.push(line);return lines;}
