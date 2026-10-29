import {raceFinishes} from './race-presentation';
export interface ReferenceMoment {key:string;text:string;detail:string;player?:string;cue?:string;kind:string;reaction?:number}
export function diceCombination(values:number[]){
 if(values.length!==5||values.some(n=>!Number.isInteger(n)||n<1||n>6))return null;
 const counts=Array.from({length:6},(_,i)=>values.filter(n=>n===i+1).length),set=new Set(values);
 if(counts.includes(5))return {title:'FÜNFERPASCH!',rank:5};
 if(set.size===5&&(Math.min(...values)===1||Math.min(...values)===2))return {title:'GROSSE STRASSE',rank:4};
 if(counts.includes(4))return {title:'VIERERPASCH',rank:3};
 if(counts.includes(3)&&counts.includes(2))return {title:'FULL HOUSE',rank:2};
 return null;
}
/** Uses public rolls/race snapshots; a late join establishes a baseline without replaying old effects. */
export function referenceMoments(kind:'dice'|'typer',me:string,crew:{id?:string;name?:string}[]){
 let round:unknown,initialized=false,seen=new Set<string>(),previous=new Map<string,number>(),finished=new Set<string>(),active:ReferenceMoment|null=null,until=0,lastPass=-100;
 const name=(id:string)=>crew.find(p=>p.id===id)?.name??'Crew';
 return {update(t:number,g:any):{moment:ReferenceMoment|null;fresh:boolean}{
  if(round!==g.round){round=g.round;initialized=false;seen.clear();previous.clear();finished.clear();active=null;until=0;lastPass=-100;}
  let candidate:ReferenceMoment|null=null;
  if(kind==='dice'){
   const events=(g.events??[]).filter((e:any)=>e.type==='dice');
   if(initialized){let rank=-1;for(const e of events){if(seen.has(e.id))continue;const p=g.opponents?.[e.player],combo=p?.rolls?diceCombination(p.dice??[]):null;if(combo&&combo.rank>=rank){rank=combo.rank;candidate={key:e.id,text:`${name(e.player)} · ${combo.title}`,detail:'Ein großer Wurf für eure Tischrunde.',player:e.player,cue:'diceCombo',kind:'dice'};}}}
   events.forEach((e:any)=>seen.add(e.id));if(seen.size>128)seen=new Set([...seen].slice(-64));
  }else{
   const finishes=raceFinishes(g),newFinish=finishes.filter(f=>!finished.has(f.id));
   if(initialized&&newFinish.length){
    const own=newFinish.find(f=>f.id===me),row=own??newFinish.at(-1)!;
    const past=(g.mine?.history??[]).slice(0,Math.max(0,Number(g.round)-1)).filter((r:any)=>r.finished);
    const best=Math.max(0,...past.map((r:any)=>Number(r.wpm)||0)),close=finishes.length>1&&finishes[1].at-finishes[0].at<=250&&newFinish.some(f=>f.id===finishes[0].id||f.id===finishes[1].id);
    candidate={key:`${g.round}:finish:${row.id}:${row.at}`,text:own&&best>0&&own.wpm>best?`DEIN OLYMPIADENREKORD · ${own.wpm} WPM`:close?'FOTOFINISH!':`${name(row.id)} IST IM ZIEL`,detail:close?`${((finishes[1].at-finishes[0].at)/1000).toLocaleString('de-DE',{maximumFractionDigits:3})} Sekunden zwischen den ersten beiden.`:`Platz ${row.place} · ${row.wpm} Wörter pro Minute`,player:row.id,cue:'raceFinish',kind:'finish'};
   }
   const entries=Object.entries(g.racers??{}).map(([id,r]:[string,any])=>({id,progress:Number(r.progress)||0,finished:r.finishedAt!=null})),margin=Math.max(1,(g.text?.length??100)*.005);
   if(initialized&&!candidate&&t>until&&t-lastPass>2){
    const passes=entries.flatMap(a=>entries.filter(b=>a.id!==b.id&&!a.finished&&!b.finished&&(previous.get(b.id)??0)>(previous.get(a.id)??0)+margin&&a.progress>b.progress+margin).map(b=>({a,b})));
    const pass=passes.find(p=>p.a.id===me)??passes[0];if(pass){candidate={key:`${g.round}:pass:${pass.a.id}:${pass.a.progress}`,text:`${name(pass.a.id)} ÜBERHOLT ${name(pass.b.id)}`,detail:'Die nächste Kurve gehört dir.',player:pass.a.id,cue:'raceOvertake',kind:'pass'};lastPass=t;}
   }
   previous=new Map(entries.map(p=>[p.id,p.progress]));finished=new Set(finishes.map(f=>f.id));
  }
  initialized=true;
  if(candidate){active=candidate;until=t+3;}
  if(t>=until)active=null;
  return {moment:active,fresh:!!candidate};
 }};
}
