export type MeasureAxis='x'|'y';
export type SizeMuseumView='compare'|'gallery';
export const SIZE_REVEAL_AT=475;
/** Seek old outcomes silently; consume a crossed boundary even when a frame or sound was skipped. */
export function createSizeRevealCue(){
 const history=new Map<string,number>();let previousAt:number|null=null,previousStage='';
 return (game:any,now:number)=>{
  const lastAt=previousAt,lastStage=previousStage;previousAt=now;previousStage=game.stage;
  if(!['roundReveal','done'].includes(game.stage)||!game.reveal||!Number.isFinite(game.revealStartedAt))return false;
  const key=`${game.round}:${game.revealStartedAt}`,age=Math.max(0,now-game.revealStartedAt),high=history.get(key);
  history.set(key,Math.max(high??0,age));if(history.size>32)history.delete(history.keys().next().value!);
  const fresh=lastAt!==null&&now-lastAt>=0&&now-lastAt<=450;
  return fresh&&age>=SIZE_REVEAL_AT&&age<=950&&(high===undefined?lastStage==='answer':high<SIZE_REVEAL_AT);
 };
}
type SizeCrew={id?:string;name?:string;color?:string};
export const validSize=(value:unknown):number|null=>typeof value==='number'&&Number.isFinite(value)&&value>0?value:null;
export function sizeMuseumFrame(game:any,crew:SizeCrew[],me:string,now:number,draft:any={}){
 const revealed=['roundReveal','done'].includes(game.stage)&&!!game.reveal,actual=revealed?validSize(game.reveal.item?.cm):null;
 const rows=crew.map((player,index)=>{const result=revealed?game.reveal.players?.find((r:any)=>r.id===player.id):null;return {id:player.id??String(index),name:player.name??`Crew ${index+1}`,color:player.color??'#b8c8ae',index,place:0,estimate:revealed?validSize(result?.estimate):null,score:revealed&&Number.isFinite(result?.score)?Math.max(0,result.score):0,submitted:!!game.submitted?.[player.id??'']};});
 const ranked=[...rows].sort((a,b)=>b.score-a.score||a.index-b.index);let place=0,last=-1;ranked.forEach((row,i)=>{if(row.score!==last){place=i+1;last=row.score;}row.place=place;});
 const selected=rows.find(row=>row.id===(draft.sizeSelected??me))??rows[0]??null;
 const own=game.mine?(game.mine.submitted?validSize(game.mine.answer):validSize(draft.size)??validSize(game.mine.answer)??validSize(game.reference?.cm)):null;
 const estimate=revealed?selected?.estimate??null:own,view:SizeMuseumView=draft.sizeView==='gallery'?'gallery':'compare',reference=validSize(game.reference?.cm)??100;
 const age=revealed&&Number.isFinite(game.revealStartedAt)?Math.max(0,now-game.revealStartedAt):1000,progress=revealed?Math.min(1,age/950):0;
 const selectedIndex=Math.max(0,rows.findIndex(row=>row.id===selected?.id)),page=Math.floor(selectedIndex/3);
 return {revealed,actual,estimate,reference,rows,ranked:ranked as (typeof rows[number]&{place:number})[],selected,selectedIndex,page,pages:Math.max(1,Math.ceil(rows.length/3)),visibleRows:rows.slice(page*3,page*3+3),view,referenceMode:!revealed||!!draft.sizeReference,progress,age,canChange:game.stage==='answer'&&!!game.mine&&!game.mine.submitted&&!game.mine.abandoned};
}
export function sizeMuseumPosition(index:number,count:number,progress:number){
 const start=[(index%2?1:-1)*12.7,.35,-4+Math.floor(index/2)*4.3],finish=[(index-(count-1)/2)*Math.min(2.1,24/Math.max(1,count-1)),.35,8.5+Math.abs(index-(count-1)/2)*.13],t=Math.max(0,Math.min(1,progress)),s=t*t*(3-2*t);
 return start.map((v,i)=>v+(finish[i]-v)*s) as [number,number,number];
}
/** Fit an orthographic comparison with a fixed per-item envelope, never to the changing guess. */
export function sizeMuseumCamera(width:number,height:number,bounds:{min:number[];max:number[]}|undefined,view:SizeMuseumView,reservedBottom=150,reservedRight=70){
 const pitch=view==='gallery'?.34:.14,c=Math.cos(pitch),s=Math.sin(pitch),b=bounds??{min:[-16,.2,-5],max:[16,9,12]},xs:number[]=[],ys:number[]=[];
 for(const x of[b.min[0],b.max[0]])for(const y of[b.min[1],b.max[1]])for(const z of[b.min[2],b.max[2]]){xs.push(x);ys.push(y*c-z*s);}
 const top=108,bottom=reservedBottom,left=20,right=reservedRight,half=Math.max(4,(Math.max(...xs)-Math.min(...xs)+1)*height/Math.max(100,width-left-right)/2,(Math.max(...ys)-Math.min(...ys)+1)*height/Math.max(100,height-top-bottom)/2),u=(Math.min(...ys)+Math.max(...ys))/2-(bottom-top)*half/height,z=-1.4;
 return {target:[(Math.min(...xs)+Math.max(...xs))/2+(right-left)*half/height,(u+z*s)/c,z] as [number,number,number],pitch,yaw:0,half};
}
export function measureAxis(measure=''):MeasureAxis{return /h[oö]he|schulter|ringh/i.test(measure)?'y':'x';}
export function sizeComparison(reference:number,estimate:number,actual?:number,visible=[0,1,2]){
 const values=[reference,estimate,...(actual===undefined?[]:[actual])].map(n=>Number.isFinite(n)&&n>0?n:1),largest=Math.max(1e-12,...values.filter((_,i)=>visible.includes(i))),unit=6.4/largest;
 return {unit,spans:values.map(n=>n*unit)};
}
export function sizeModelKey(name='',kind=''){
 const n=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll('\u00df','ss');
 if(kind)return ({ship:'ship',bridge:'bridge',building:'building',tower:'tower',statue:'statue',aircraft:'aircraft'} as Record<string,string>)[kind]??'exhibit';
 if(/container/.test(n))return 'container';if(/schwimmbecken/.test(n))return 'pool';if(/platte/.test(n))return 'table';if(/netz/.test(n))return 'net';if(/fussballtor/.test(n))return 'goal';if(/korb/.test(n))return 'basket';
 if(/ball|kugel/.test(n))return 'ball';if(/blatt|schein|karte/.test(n))return /sd/.test(n)?'chip':/kredit/.test(n)?'card':'paper';
 if(/munze|euro|cent/.test(n))return 'coin';if(/cd|dvd|vinyl/.test(n))return 'disc';if(/phone|switch/.test(n))return 'device';if(/lego/.test(n))return 'brick';if(/schach/.test(n))return 'chess';
 if(/giraffe|elefant|blauwal/.test(n))return /giraffe/.test(n)?'giraffe':/elefant/.test(n)?'elephant':'whale';
 if(/airbus|shuttle/.test(n))return 'aircraft';if(/saturn/.test(n))return 'rocket';if(/sherman/.test(n))return 'tree';if(/bridge/.test(n))return 'bridge';if(/arch/.test(n))return 'arch';if(/turm|monument/.test(n))return 'tower';if(/statue/.test(n))return 'statue';if(/teleskop/.test(n))return 'telescope';if(/marathon/.test(n))return 'track';return 'exhibit';
}
