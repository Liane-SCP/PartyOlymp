export const PICTURE_WIDTH=480,PICTURE_HEIGHT=312;
export function pictureFit(width:number,height:number,targetWidth=PICTURE_WIDTH,targetHeight=PICTURE_HEIGHT){const scale=Math.min(targetWidth/Math.max(1,width),targetHeight/Math.max(1,height));return {x:(targetWidth-width*scale)/2,y:(targetHeight-height*scale)/2,width:width*scale,height:height*scale};}
export function pictureFrame(game:any,crew:{id?:string;name?:string;color?:string}[],me:string,now:number){
 const revealed=['roundReveal','done'].includes(game.stage)&&!!game.reveal,owner=!revealed?game.buzzer??null:null;
 const rows=crew.map((p,i)=>{const guess=game.guesses?.[p.id??'']??{},r=revealed?game.reveal.players?.find((r:any)=>r.id===p.id):null,solved=revealed?!!r?.correct:!!guess.solved,out=!solved&&!!guess.out,active=owner===p.id;return {id:p.id,index:i+1,name:p.name??`Crew ${i+1}`,color:p.color??'#d0ba8b',active,solved,out,abandoned:!!guess.abandoned,attempts:Number(guess.attempts??0),score:revealed?Number(r?.score??0):null,status:revealed?(r?.correct?'ERKANNT':'NICHT ERKANNT'):active?'AM BUZZER':guess.abandoned?'SCHAUT ZU':out?'DIESES BILD AUSGESETZT':'BEREIT'};});
 const own=game.mine,canBuzz=game.stage==='answer'&&!!own&&!own.abandoned&&!own.buzzedOut&&!own.correct&&!owner,canAnswer=game.stage==='answer'&&owner===me&&!own?.abandoned;
 const stamp=owner?Number(game.buzzStartedAt??now):now,span=Math.max(1,Number(game.deadline??now)-Number(game.startedAt??now)),progress=Math.max(0,Math.min(1,(stamp-Number(game.startedAt??now))/span));
 return {revealed,owner,rows,canBuzz,canAnswer,remaining:owner?Math.max(0,Math.min(Number(game.buzzDeadline)-Number(game.buzzStartedAt),Number(game.buzzDeadline??now)-now)):0,buzzProgress:owner?Math.max(0,Math.min(1,(now-Number(game.buzzStartedAt??now))/Math.max(1,Number(game.buzzDeadline)-Number(game.buzzStartedAt)))):0,progress,solution:revealed?String(game.reveal.answer??''):null,winner:revealed?rows.find(r=>r.solved)?.id??null:null};
}
export type PictureView='studio'|'screen'|'seat'|'active';
export function pictureCamera(aspect:number,mode:PictureView,seat:[number,number,number]){
 // An eye-level medium shot shows the participant, their buzzer and nameplate.
 if(mode==='active'){
  const target:[number,number,number]=[seat[0],2.2,seat[2]+.35],pitch=.28,yaw=seat[0]>0?-1:1,tan=Math.tan(21*Math.PI/180);
  // Look across the bank from the central aisle: the nearer seats cannot hide
  // a participant at the back of a twelve-player studio.
  const raw=[Math.sin(yaw),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],length=Math.hypot(...raw),axis=raw.map(n=>n/length),rightLength=Math.hypot(axis[0],axis[2]),right=[axis[2]/rightLength,0,-axis[0]/rightLength],up=[axis[1]*right[2],axis[2]*right[0]-axis[0]*right[2],-axis[1]*right[0]];let distance=0;
  for(const x of[-2.2,2.2])for(const y of[-2.1,2.2])for(const z of[-1.4,2]){
   const dot=(a:number[])=>a[0]*x+a[1]*y+a[2]*z;
   distance=Math.max(distance,dot(axis)+Math.abs(dot(right))/(tan*Math.max(.12,aspect)*.86),dot(axis)+Math.abs(dot(up))/(tan*.72));
  }
  return {target,pitch,yaw,distance:distance+.3};
 }
 const target=(mode==='screen'?[0,6.3,-8.5]:mode==='seat'?[seat[0],2.1,seat[2]+.4]:[0,4.7,-1]) as [number,number,number],pitch=mode==='screen'?0:mode==='seat'?.75:.4,yaw=0,tan=Math.tan(21*Math.PI/180),axis=[0,Math.sin(pitch),Math.cos(pitch)],up=[0,Math.cos(pitch),-Math.sin(pitch)];let distance=0;
 const xs=mode==='screen'?[-6.3,6.3]:mode==='seat'?[seat[0]-2,seat[0]+2]:[-15.6,15.6],ys=mode==='screen'?[1.2,11.5]:mode==='seat'?[.2,3.2]:[.1,11.8],zs=mode==='screen'?[-9.3,-8]:mode==='seat'?[seat[2]-1,seat[2]+2.1]:[-11.5,12];
 for(const x of xs)for(const y of ys)for(const z of zs){const v=[x-target[0],y-target[1],z-target[2]],along=v[1]*axis[1]+v[2]*axis[2],vertical=v[1]*up[1]+v[2]*up[2];distance=Math.max(distance,along+Math.abs(v[0])/(tan*Math.max(.12,aspect)*.91),along+Math.abs(vertical)/(tan*.89));}
 return {target,pitch,yaw,distance:distance+.3};
}
