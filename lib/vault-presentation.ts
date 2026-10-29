export function vaultWorkbenchDistance(aspect:number){
 const sin=Math.sin(.95),cos=Math.cos(.95),tan=Math.tan(21*Math.PI/180);let distance=0;
 for(const x of[-4.9,4.9])for(const y of[1.2,4.3])for(const z of[.2,7.9]){
  const dy=y-2.6,dz=z-3.3,depth=dy*sin+dz*cos,up=dy*cos-dz*sin;
  distance=Math.max(distance,depth+Math.abs(x)/(tan*Math.max(.1,aspect)*.95),depth+Math.abs(up)/(tan*.65));
 }
 return distance+.2;
}
/** Public progress never reads another participant's colors or pending guess. */
export function vaultFrame(game:any,now:number){
 const roster=Object.entries(game.roster??{}).map(([id,p]:[string,any])=>{const f=p.feedback?.at(-1);return {id,solved:!!p.solved,gaveUp:!!p.gaveUp,ready:!!p.ready,attempts:p.feedback?.length??0,feedback:f?{turn:Number(f.turn),exact:Number(f.exact),misplaced:Number(f.misplaced)}:null};});
 const solved=roster.filter(p=>p.solved),start=Number(game.firstSolvedAt??0),elapsed=start?Math.max(0,(now-start)/1000):0,progress=solved.length?(start?Math.min(1,elapsed/1.2):1):0;
 const own=game.mine,canUse=!!own&&game.stage==='guess'&&!own.submitted&&!own.solved&&!own.gaveUp&&!own.abandoned;
 return {roster,solved:solved.length,ready:roster.filter(p=>p.ready).length,canUse,progress,angle:progress>.2?-Math.PI*.72*Math.min(1,(progress-.2)/.8):0,wheel:Math.min(1,progress/.3)*Math.PI*1.5};
}
