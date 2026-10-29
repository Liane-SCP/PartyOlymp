/** A missing legacy timestamp and an old roll both settle without replaying. */
export function diceRollAge(player:any,now:number){
 return player?.rolls>0&&typeof player.rollStartedAt==='number'&&Number.isFinite(player.rollStartedAt)?(now-player.rollStartedAt)/1000:Infinity;
}

/** Keep the same full-size working places, with a smaller shared table for small crews. */
export function diceTableLayout(count:number){
 const n=Math.max(2,Math.min(12,count)),growth=Math.min(1,(n-2)/6);
 return {radiusX:3+4.5*growth,radiusZ:3.4+2*growth,placeScale:Math.min(1,10/n)};
}

/** Fit scene-space bounds using the same orbit convention as the stage camera. */
function diceBoundsDistance(aspect:number,yaw:number,pitch:number,target:{x:number;y:number;z:number},xs:number[],ys:number[],zs:number[]){
 const raw=[Math.sin(yaw),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],length=Math.hypot(...raw),axis=raw.map(v=>v/length),rlen=Math.hypot(axis[2],axis[0]),right=[axis[2]/rlen,0,-axis[0]/rlen],up=[axis[1]*right[2],axis[2]*right[0]-axis[0]*right[2],-axis[1]*right[0]],tan=Math.tan(21*Math.PI/180);
 let distance=0;
 for(const x of xs)for(const y of ys)for(const z of zs){const v=[x-target.x,y-target.y,z-target.z],dot=(a:number[])=>a.reduce((sum,n,i)=>sum+n*v[i],0);distance=Math.max(distance,dot(axis)+Math.abs(dot(right))/(tan*Math.max(.1,aspect)*.9),dot(axis)+Math.abs(dot(up))/(tan*.86));}
 return (distance+.3)/length;
}

/** Fit the actual front seat: cup, rolled dice, hold tray and score card. */
export function dicePlaceDistance(aspect:number,yaw:number,pitch:number,target:{x:number;y:number;z:number},originZ=3.888,scale=1){
 return diceBoundsDistance(aspect,yaw,pitch,target,[-1.15*scale,1.15*scale],[1.5,1.56+.59*scale],[originZ-1.088*scale,originZ+1.012*scale]);
}

export function diceGroupDistance(aspect:number,yaw:number,pitch:number,target:{x:number;y:number;z:number},count:number){
 const {radiusX:x,radiusZ:z}=diceTableLayout(count);
 return diceBoundsDistance(aspect,yaw,pitch,target,[-x-1,x+1],[.3,4.3],[-z-1,z+1]);
}
