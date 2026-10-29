export const CEREMONY_DURATION = 14;
export function ceremonyReveal(rank: number,available?:number[]) {
  if(available){const ranks=[...new Set(available)].filter(r=>r>=1&&r<=3).sort((a,b)=>b-a),index=ranks.indexOf(rank);if(index>=0)return ranks.length===3?[2,4,6.4][index]:index===0?2:4.4;}
  return rank === 1 ? 6.4 : rank === 2 ? 4 : 2;
}
export function ceremonyProgress(time: number, rank: number,available?:number[]) {
  const t = Math.max(0, Math.min(1, (time - ceremonyReveal(rank,available)) / 1.6));
  return 1 - (1 - t) ** 3;
}
export function ceremonyHeight(rank: number) {
  return rank === 1 ? 2.15 : rank === 2 ? 1.35 : 0.85;
}

/** Everyone keeps their server rank. Equal ranks share one platform, including twelve champions. */
export function ceremonyLayout(players:{id:string;rank:number}[]){
 const groups=[2,1,3].map(rank=>{const members=players.filter(p=>p.rank===rank),columns=members.length===2?2:Math.min(6,Math.ceil(members.length/2)),rows=columns?Math.ceil(members.length/columns):0;return {rank,members,columns,rows,width:columns?columns*1.6+1+(rows>1?.8:0):0,depth:rows*1.7+1+(rows>1?.4:0),x:0};}).filter(g=>g.members.length);
 const total=groups.reduce((n,g)=>n+g.width,0)+Math.max(0,groups.length-1)*.6;let cursor=-total/2;
 const places:{id:string;rank:number;position:[number,number,number]}[]=[];
 for(const group of groups){group.x=cursor+group.width/2;cursor+=group.width+.6;group.members.forEach((p,i)=>{const row=Math.floor(i/group.columns),columns=Math.min(group.columns,group.members.length-row*group.columns);places.push({id:p.id,rank:p.rank,position:[group.x+(i%group.columns-(columns-1)/2)*1.6+(group.rows>1?(row? .4:-.4):0),ceremonyHeight(p.rank),(row-(group.rows-1)/2)*1.7]});});}
 const audience=players.filter(p=>p.rank>3);audience.forEach((p,i)=>{const row=Math.floor(i/6),columns=Math.min(6,audience.length-row*6);places.push({id:p.id,rank:p.rank,position:[(i%6-(columns-1)/2)*1.55,.04,3.1+row*1.55]});});
 const bounds:[number,number,number][]=[];for(const p of places)for(const x of[-.95,.95])for(const y of[0,2])for(const z of[-.95,.95])bounds.push([p.position[0]+x,p.position[1]+y,p.position[2]+z]);for(const g of groups)for(const x of[-g.width/2,g.width/2])for(const z of[-g.depth/2,g.depth/2])bounds.push([g.x+x,0,z]);
 const gold=groups.find(g=>g.rank===1);for(const x of[-1,1])for(const y of[3.7,6])for(const z of[-3,-1.4])bounds.push([(gold?.x??0)+x,y,z]);
 return {groups,places,bounds};
}

/** Fit all actual crew bounds between the heading and the result controls. */
export function ceremonyCrewCamera(time:number,width:number,height:number,reduced:boolean,layout:ReturnType<typeof ceremonyLayout>){
 const t=reduced?14:Math.max(0,Math.min(14,time)),yaw=reduced?0:Math.sin(t*.35)*.14*(1-t/14),pitch=.62,axis=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],right=[Math.cos(yaw),0,-Math.sin(yaw)],up=[-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),-Math.cos(yaw)*Math.sin(pitch)],tan=Math.tan(18.5*Math.PI/180),w=Math.max(1,width),h=Math.max(1,height),upper=Math.min(155,h*.26),lower=Math.min(245,h*.38),safe=Math.max(.2,1-(upper+lower)/h),high=1-2*upper/h,low=-1+2*lower/h,center=[0,2,1];let distance=5;
 for(const p of layout.bounds){const v=p.map((n,i)=>n-center[i]),dot=(a:number[])=>v.reduce((n,c,i)=>n+c*a[i],0),along=dot(axis),vertical=dot(up);distance=Math.max(distance,along+Math.abs(dot(right))/(tan*w/h*.9),(vertical/tan+high*along)/safe,(-vertical/tan-low*along)/safe);}
 distance+=.4;const offset=distance*tan*(upper-lower)/h,target=center.map((n,i)=>n+up[i]*offset),position=target.map((n,i)=>n+axis[i]*distance);
 return {position,target,safe:{top:upper,bottom:h-lower,left:w*.05,right:w*.95}};
}

/** Authored crane/orbit shots; the final composition always returns to the complete podium. */
export function ceremonyCamera(time: number, aspect: number, reduced: boolean) {
  const shots = [
    { t: 0, p: [-10, 10, 22], look: [0, 1.6, -1] },
    { t: 2, p: [6.2, 5.2, 13.5], look: [1.2, 2, 0] },
    { t: 4, p: [-5.5, 5.1, 13], look: [-0.9, 2.2, 0] },
    { t: 6.4, p: [-1.8, 4.9, 12], look: [0, 2.7, 0] },
    { t: 9, p: [2.4, 6.6, 15], look: [0, 2.7, 0] },
    { t: 14, p: [0, 6.3, 15.5], look: [0, 2.55, 0] },
  ];
  const t = reduced ? 14 : Math.max(0, Math.min(14, time));
  const end = shots.findIndex(s => s.t > t);
  const a = shots[end < 0 ? shots.length - 1 : Math.max(0, end - 1)], b = shots[end < 0 ? shots.length - 1 : end];
  const f = a === b ? 0 : (t - a.t) / (b.t - a.t), blend = f * f * (3 - 2 * f);
  const mix = (x: number[], y: number[]) => x.map((v, i) => v + (y[i] - v) * blend);
  const position = mix(a.p, b.p), target = mix(a.look, b.look);
  if (aspect < 0.85) { position[0] *= 0.45; position[1] += 1.4; position[2] *= 1.5; target[0] *= 0.45; }
  return { position, target };
}
