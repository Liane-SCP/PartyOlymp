export const checkoutLayout={
 top:1.12,
 customer:[8.5,.3,7.55] as const,
 focus:[9.8,1.9,5.9] as const,
 bounds:{x:[6.9,12.7],y:[.3,4.3],z:[4,8.3]},
};

/** Public conveyor poses are seekable from the common reveal clock, not frame count. */
export function checkoutItemPose(frame:{scanProgress:number;scanned:number},index:number,reduced=false){
 const progress=frame.scanProgress,done=index<frame.scanned,packed=[10.6+(index%3)*.52,1.23,5.5+Math.floor(index/3)*.32];
 if(done){const u=reduced?1:Math.max(0,Math.min(1,(progress-index-1)/.25)),ease=u*u*(3-2*u);return [9.8+(packed[0]-9.8)*ease,1.23+(reduced?0:Math.sin(u*Math.PI)*.08),5.95+(packed[2]-5.95)*ease];}
 if(index===frame.scanned){const u=reduced?1:Math.max(0,Math.min(1,progress-index)),ease=u*u*(3-2*u);return [8.1+1.7*ease,1.23+(reduced?0:Math.sin(u*Math.PI)*.04),5.95];}
 const waiting=index-frame.scanned-1;return [8.1+(waiting%3)*.52,1.23+Math.floor(waiting/3)*.045,5.25];
}

export function checkoutCameraDistance(aspect:number,yaw:number,pitch:number,target:{x:number;y:number;z:number}){
 const raw=[Math.sin(yaw),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],length=Math.hypot(...raw),axis=raw.map(v=>v/length),rlen=Math.hypot(axis[2],axis[0]),right=[axis[2]/rlen,0,-axis[0]/rlen],up=[axis[1]*right[2],axis[2]*right[0]-axis[0]*right[2],-axis[1]*right[0]],tan=Math.tan(21*Math.PI/180);
 let distance=0;
 for(const x of checkoutLayout.bounds.x)for(const y of checkoutLayout.bounds.y)for(const z of checkoutLayout.bounds.z){const v=[x-target.x,y-target.y,z-target.z],dot=(a:number[])=>a.reduce((sum,n,i)=>sum+n*v[i],0);distance=Math.max(distance,dot(axis)+Math.abs(dot(right))/(tan*Math.max(.1,aspect)*.88),dot(axis)+Math.abs(dot(up))/(tan*.78));}
 return (distance+.5)/length;
}
