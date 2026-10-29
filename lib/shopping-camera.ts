export type ShoppingView='overview'|'offer';

/** Shared with the physical display placement: camera targets the actual offer. */
export function shoppingOfferPosition(index:number):[number,number,number]{
 const i=Math.max(0,Math.min(11,Math.trunc(index)||0));
 return [(i%4-1.5)*3.9,0,Math.floor(i/4)*2.9-1.4];
}

export function shoppingOfferIndex(index:number,count:number){
 return Math.max(0,Math.min(Math.max(0,count-1),Math.trunc(index)||0));
}

export function shoppingOfferCamera(index:number,aspect:number){
 const [x,,z]=shoppingOfferPosition(index),pitch=.7;
 // Fit the complete stand and caption, with room around both. The elevated
 // sight line clears the nearer display rows without hiding their geometry.
 const distance=Math.max(6.8,2.15/(Math.tan(21*Math.PI/180)*Math.max(.25,aspect)));
 return {target:[x,1.95,z+.35] as [number,number,number],yaw:0,pitch,distance};
}
