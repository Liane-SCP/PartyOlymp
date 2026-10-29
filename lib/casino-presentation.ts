import {dealerDuration,dealerInterval,dealerProgress} from './game/presentation';
import {handValue} from './game/games/blackjack';

export const casinoDealer={id:'house-dealer',name:'Jules',avatar:5,color:'#e8d7a5',look:{shape:5,accessory:22,color:3,detail:2,accent:0}};
export const casinoBounds={x:[-8.5,8.5],y:[.3,4],z:[-6.5,7]};
export function casinoCameraDistance(aspect:number,yaw:number,pitch:number,target:{x:number;y:number;z:number}){
 const raw=[Math.sin(yaw),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],length=Math.hypot(...raw),axis=raw.map(v=>v/length),rlen=Math.hypot(axis[2],axis[0]),right=[axis[2]/rlen,0,-axis[0]/rlen],up=[axis[1]*right[2],axis[2]*right[0]-axis[0]*right[2],-axis[1]*right[0]],tan=Math.tan(21*Math.PI/180);let distance=0;
 for(const x of casinoBounds.x)for(const y of casinoBounds.y)for(const z of casinoBounds.z){const v=[x-target.x,y-target.y,z-target.z],dot=(a:number[])=>a.reduce((sum,n,i)=>sum+n*v[i],0);distance=Math.max(distance,dot(axis)+Math.abs(dot(right))/(tan*Math.max(.1,aspect)*.88),dot(axis)+Math.abs(dot(up))/(tan*.78));}return Math.max(22,(distance+.5)/length);
}
/** The same public clock drives the table, result panel and payout choreography. */
export function casinoPresentation(game:any,now:number){
 const revealing=['roundReveal','done'].includes(game.stage),dealer=revealing?(game.reveal?.dealer??game.dealer??[]):game.dealer??[],count=dealer.length;
 const start=Number(game.revealStartedAt??(game.deadline?game.deadline-dealerDuration(count):0));
 const visible=revealing?dealerProgress(now,start,count):count,ready=revealing&&count>0&&visible===count&&now>=start+count*dealerInterval;
 const shown=dealer.slice(0,visible),payoutProgress=ready?Math.max(0,Math.min(1,(now-start-count*dealerInterval)/1000)):0;
 return {revealing,start,visible,ready,shown,value:shown.length?handValue(shown):null,payoutProgress,rows:ready?game.reveal?.players??[]:[]};
}
