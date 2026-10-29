export function herdGroupCenter(index:number,total:number){
 if(total===1)return {x:0,z:0};
 if(total===2)return {x:index===0?-4.5:4.5,z:0};
 if(total===3)return {x:[0,-8.5,8.5][index],z:0};
 if(total<=6)return {x:(index%3-1)*8,z:Math.floor(index/3)*8-4};
 return {x:(index%4-1.5)*6.6,z:Math.floor(index/4)*5-5};
}
export function herdMemberPosition(groups:{ids:string[]}[],id:string){
 const index=groups.findIndex(g=>g.ids.includes(id));if(index<0)return null;
 const group=groups[index],center=herdGroupCenter(index,groups.length),member=group.ids.indexOf(id),n=group.ids.length;
 const radius=n===1?0:n<=3?1.1:n<=6?1.5:2.6,angle=member/Math.max(1,n)*Math.PI*2;
 return {x:center.x+Math.sin(angle)*radius,z:center.z+Math.cos(angle)*radius};
}
