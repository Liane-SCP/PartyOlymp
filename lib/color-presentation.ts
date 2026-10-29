export type LabView='sample'|'machine'|'group'|'results';
type Crew={id?:string;name?:string;color?:string};
export function colorRgb(value:unknown):number[]|null{return Array.isArray(value)&&value.length===3&&value.every(v=>typeof v==='number'&&Number.isFinite(v))?value.map(v=>Math.max(0,Math.min(255,Math.round(v)))):null;}
export function colorFrame(game:any,crew:Crew[],me:string,now:number,draft:any={}){
 const revealed=['roundReveal','done'].includes(game.stage)&&!!game.reveal,memorizing=game.stage==='answer'&&now<Number(game.previewUntil),mine=game.mine;
 const target=revealed?colorRgb(game.reveal.target):memorizing?colorRgb(game.target):null;
 const own=mine?colorRgb(mine.submitted?mine.answer:draft.rgb)??[128,128,128]:null;
 const rows=crew.map((p,i)=>{const r=revealed?game.reveal.players?.find((r:any)=>r.id===p.id):null,estimate=revealed?colorRgb(r?.estimate):null;return {id:p.id,index:i+1,name:p.name??`Crew ${i+1}`,color:p.color??'#b6c9af',submitted:!!game.submitted?.[p.id??''],estimate,score:revealed?Number(r?.score??0):null,error:revealed&&estimate&&typeof r?.error==='number'?r.error:null};});
 const wanted=draft.colorSelected??me,selected=rows.find(r=>r.id===wanted)??rows[0]??null;
 return {revealed,memorizing,target,own,rows,selected,comparison:revealed?selected?.estimate??null:own,compact:!!draft.colorCompact,canMix:game.stage==='answer'&&!memorizing&&!!mine&&!mine.submitted&&!mine.abandoned,remaining:Math.max(0,(memorizing?Number(game.previewUntil):Number(game.deadline))-now),submitted:rows.filter(r=>r.submitted).length,phase:revealed?'reveal':memorizing?'memorize':mine?.submitted?'sealed':'mix',progress:revealed?Math.max(0,Math.min(1,(now-Number(game.revealStartedAt??now-700))/650)):0};
}
export function colorPlates(compact=false,revealed=false):[number,number,number][]{return compact&&revealed?[[0,10.1,-6.56],[0,3.7,-6.56]]:[[-4,5.1,-6.56],[4,5.1,-6.56]];}
export function colorCamera(aspect:number,view:LabView,memorizing=false,compact=false){
 const focused=view==='sample',results=view==='results',group=view==='group',target=(focused?[memorizing?-4:4,5.1,-6.6]:results?[0,compact?6.9:5.1,-6.6]:group?[0,5.5,-1]:[0,2.2,4.5]) as [number,number,number],pitch=focused||results?0:group?.42:1.05,tan=Math.tan(21*Math.PI/180),axis=[0,Math.sin(pitch),Math.cos(pitch)],up=[0,Math.cos(pitch),-Math.sin(pitch)];
 const xs=focused?[target[0]-3.9,target[0]+3.9]:results?(compact?[-3.9,3.9]:[-7.9,7.9]):group?[-14.5,14.5]:[-8,8],ys=focused?[2,8.2]:results?(compact?[.3,13.1]:[2,8.2]):group?[.1,13.7]:[.4,3.5],zs=focused||results?[-6.9,-6.3]:group?[-11,12.5]:[1,9.3];let distance=0;
 for(const x of xs)for(const y of ys)for(const z of zs){const v=[x-target[0],y-target[1],z-target[2]],along=v[1]*axis[1]+v[2]*axis[2],vertical=v[1]*up[1]+v[2]*up[2];distance=Math.max(distance,along+Math.abs(v[0])/(tan*Math.max(.12,aspect)*.91),along+Math.abs(vertical)/(tan*.9));}
 return {target,yaw:0,pitch,distance:distance+.2};
}
