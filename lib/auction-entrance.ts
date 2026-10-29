type Point=[number,number,number];
export const auctionRowSpacing=3.4;
export const auctionRowLevel=(row:number)=>.25+row*.5;

/** The two seating banks always leave the 2.3-unit central aisle clear. */
export function auctionSeat(index:number,count:number):Point{
 const row=Math.floor(index/4),columns=Math.min(4,count-row*4),xs=columns===4?[-7.2,-2.8,2.8,7.2]:columns===3?[-7.2,-2.8,2.8]:columns===2?[-2.8,2.8]:[-2.8];
 return [xs[index%4],auctionRowLevel(row)+.9,1+row*auctionRowSpacing];
}

/** Authored foot positions: leave the chair, take the row passage, descend the aisle, climb the stage. */
export function auctionEntranceRoute(index:number,count:number){
 const seat=auctionSeat(index,count),row=Math.floor(index/4),level=auctionRowLevel(row),exit=seat[0]-Math.sign(seat[0])*1.15;
 const points:{position:Point;area:string}[]=[],add=(x:number,y:number,z:number,area:string)=>points.push({position:[x,y,z],area});
 add(...seat,'seat');add(exit,seat[1]+.08,seat[2],'seat');add(exit,level+.02,seat[2],'seat');
 add(exit,level+.02,seat[2]+1,'row');add(0,level+.02,seat[2]+1,'row');
 for(let r=row;r>0;r--){const edge=1+r*auctionRowSpacing-auctionRowSpacing/2,lower=auctionRowLevel(r-1);add(0,auctionRowLevel(r)+.02,edge-.02,'aisle');add(0,lower+.27,edge-.02,'aisle');add(0,lower+.27,edge-.32,'aisle');add(0,lower+.02,edge-.32,'aisle');}
 add(0,.27,1.12,'aisle');add(0,.52,1.12,'stairs');add(0,.52,.48,'stairs');add(0,.92,.48,'stairs');add(0,.92,-.12,'stairs');add(0,1.32,-.12,'stairs');add(0,1.32,-.98,'stairs');add(0,1.55,-.98,'stairs');add(0,1.55,-1.4,'stage');add(-2.5,1.55,-3.5,'stage');
 const lengths=points.slice(1).map((p,i)=>Math.hypot(...p.position.map((n,c)=>n-points[i].position[c]))),length=lengths.reduce((a,b)=>a+b,0);
 return {seat,index,points,lengths,length,duration:Math.ceil(Math.max(1600,Math.min(3800,length/7*1000)))};
}

/** Server milliseconds make seeking, separate viewers and late rejoining agree. No local animation clock. */
export function auctionEntranceFrame(game:any,now:number,route:ReturnType<typeof auctionEntranceRoute>,reduced=false){
 const onStage=!!game.leader&&['perform','judge','roundReveal','done'].includes(game.stage),stamp=game.performStartedAt,progress=!onStage?0:reduced||!Number.isFinite(stamp)?1:Math.max(0,Math.min(1,(now-stamp)/route.duration));
 let distance=progress*progress*(3-2*progress)*route.length,segment=0;
 while(segment<route.lengths.length-1&&distance>route.lengths[segment])distance-=route.lengths[segment++];
 const from=route.points[segment].position,to=route.points[segment+1].position,t=progress===1?1:Math.min(1,distance/Math.max(.0001,route.lengths[segment])),position=progress===0?[...route.seat] as Point:from.map((n,i)=>n+(to[i]-n)*t) as Point;
 return {progress,position,walking:onStage&&progress>0&&progress<1,area:progress===1?'stage':route.points[segment+1].area,segment,duration:route.duration,length:route.length,seat:route.index};
}
