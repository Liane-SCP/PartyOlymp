export const auctioneer={id:'house-auctioneer',name:'Miro',avatar:9,color:'#d6b575',look:{shape:9,accessory:11,color:3,detail:2,accent:0}};
export function auctionGavelAngle(game:any,now:number,reduced=false){
 if(reduced)return 0;if(game.stage==='bid')return -.26;
 if(!['perform','judge','roundReveal','done'].includes(game.stage)||!Number.isFinite(game.performStartedAt))return 0;
 const age=now-game.performStartedAt;return age>0&&age<360?-.12*Math.sin(Math.PI*age/360):0;
}
export function auctionBookDistance(aspect:number){const tan=Math.tan(21*Math.PI/180);return Math.max(4.65/(tan*Math.max(.1,aspect)*.95),3.6/(tan*.68));}
export function auctionStageDistance(aspect:number,yaw:number,pitch:number,target:{x:number;y:number;z:number}){
 const raw=[Math.sin(yaw),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],length=Math.hypot(...raw),axis=raw.map(v=>v/length),rlen=Math.hypot(axis[2],axis[0]),right=[axis[2]/rlen,0,-axis[0]/rlen],up=[axis[1]*right[2],axis[2]*right[0]-axis[0]*right[2],-axis[1]*right[0]],tan=Math.tan(21*Math.PI/180);let distance=0;
 for(const x of[-9,9])for(const y of[1.4,7.7])for(const z of[-8.6,-2.5]){const v=[x-target.x,y-target.y,z-target.z],dot=(a:number[])=>a.reduce((sum,n,i)=>sum+n*v[i],0);distance=Math.max(distance,dot(axis)+Math.abs(dot(right))/(tan*Math.max(.1,aspect)*.9),dot(axis)+Math.abs(dot(up))/(tan*.65));}
 return (distance+.3)/length;
}
/** The room display uses public bids and sealed/submitted states, never ballots. */
export function auctionFrame(game:any,crew:{id?:string;name?:string}[],me:string,now:number,page=-1){
 const revealing=['roundReveal','done'].includes(game.stage),onStage=!!game.leader&&['perform','judge','roundReveal','done'].includes(game.stage),stamp=Number(game.performStartedAt??0),entry=onStage?(stamp?Math.max(0,Math.min(1,(now-stamp)/900)):1):0;
 const words:any[]=revealing?(game.reveal?.answers??[]):(game.answers??[]),pages=Math.max(1,Math.ceil(words.length/6)),current=page<0?pages-1:Math.max(0,Math.min(pages-1,Math.floor(page)));
 const rows=crew.map(p=>{const r=game.roster?.[p.id??'']??{},leading=game.leader===p.id,bid=game.bids?.filter((b:any)=>b.id===p.id).at(-1)?.bid??null;return {id:p.id,name:p.name??'Crew',bid,leading,passed:!!r.passed,submitted:!!r.submitted,status:revealing?(leading?(game.reveal?.success?'GESCHAFFT':'NICHT ERFÜLLT'):'APPLAUS'):game.stage==='judge'?(leading?'AUF DER BÜHNE':r.submitted?'VERSIEGELT':'PRÜFT'):leading?'HÖCHSTGEBOT':r.passed?'AUSGESTIEGEN':game.stage==='topic'?'THEMENWAHL':'BIETET MIT'};});
 const judgeRows=rows.filter(r=>r.id!==game.leader),ready=judgeRows.filter(r=>r.submitted).length;
 return {onStage,entry,ease:entry*entry*(3-2*entry),rows,ready,judges:judgeRows.length,revealing,pages,page:current,total:words.length,bid:Number(game.bid??0),canBid:!!game.mine&&game.stage==='bid'&&!game.mine.passed&&game.leader!==me,
  words:words.slice(current*6,current*6+6).map((a:any,i)=>({index:current*6+i,word:String(a.word??''),valid:revealing?!!a.valid:null,yes:revealing?Number(a.yes??0):null,no:revealing?Number(a.no??0):null})),
  caption:revealing?(game.leader?`${game.reveal?.count??0} GÜLTIG · ${game.bid} VERSPROCHEN · ${game.reveal?.success?'GESCHAFFT!':'NICHT ERFÜLLT'}`:'KEIN GEBOT · KEIN EINSATZ'):game.stage==='judge'?`BEWERTUNG VERSIEGELT: ${ready} / ${judgeRows.length}`:game.stage==='perform'?`${words.length} GENANNT · ${game.bid} VERSPROCHEN · DIE CREW PRÜFT DANACH`:game.stage==='bid'?`HÖCHSTGEBOT: ${game.bid??0} BEGRIFFE`:'DIE AUFGABENWAHL WECHSELT JEDE RUNDE'};
}
