export type ShopPoint={x:number;z:number};
export const shopBounds={minX:-12,maxX:12,minZ:-1.5,maxZ:10};
export function shopWalkable(p:ShopPoint){
 if(p.x<shopBounds.minX||p.x>shopBounds.maxX||p.z<shopBounds.minZ||p.z>shopBounds.maxZ)return false;
 if(p.x>7.2&&p.z>3.5&&p.z<7.5)return false;
 if(p.x< -7.2&&p.z>4.5&&p.z<7.5)return false;
 for(let i=0;i<12;i++){const x=(i%4-1.5)*3.9,z=Math.floor(i/4)*2.9-1.4;if(Math.abs(p.x-x)<1.65&&Math.abs(p.z-z)<1.35)return false;}
 return true;
}
/** Tiny deterministic navigation grid; no physics loop or network information. */
export function shopPath(from:ShopPoint,to:ShopPoint):ShopPoint[]{
 const nodes:ShopPoint[]=[];for(let x=-12;x<=12;x+=.5)for(let z=-1.5;z<=10;z+=.5)if(shopWalkable({x,z}))nodes.push({x,z});
 const nearest=(p:ShopPoint)=>nodes.reduce((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)<Math.hypot(b.x-p.x,b.z-p.z)?a:b);
 const start=nearest(from),goal=nearest(to),key=(p:ShopPoint)=>`${p.x},${p.z}`,allowed=new Map(nodes.map(p=>[key(p),p])),queue=[start],previous=new Map<string,string|null>([[key(start),null]]);
 for(let i=0;i<queue.length;i++){const p=queue[i];if(key(p)===key(goal))break;for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const q={x:p.x+dx,z:p.z+dz},k=key(q);if(allowed.has(k)&&!previous.has(k)){previous.set(k,key(p));queue.push(q);}}}
 if(!previous.has(key(goal)))return [];
 const path:ShopPoint[]=[];let at:string|null=key(goal);while(at!==null){path.push(allowed.get(at)!);at=previous.get(at)??null;}return path.reverse();
}
