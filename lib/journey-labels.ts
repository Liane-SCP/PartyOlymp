export interface MapRect {left:number;top:number;width:number;height:number}
export interface MapLabel {id:string;x:number;y:number;width:number;height:number}
export function mapRectsOverlap(a:MapRect,b:MapRect,gap=5){return a.left<b.left+b.width+gap&&a.left+a.width+gap>b.left&&a.top<b.top+b.height+gap&&a.top+a.height+gap>b.top;}
/** Caller orders priorities. Measure text on view/size changes, never per frame. */
export function layoutJourneyLabels(labels:MapLabel[],width:number,height:number,obstacles:MapRect[]){
 const occupied=[...obstacles],placed=new Map<string,MapRect>();
 for(const label of labels){
  if(!Number.isFinite(label.x+label.y+label.width+label.height)||label.width<=0||label.height<=0||label.x<0||label.x>width||label.y<0||label.y+label.height>height-8||label.width>width-16)continue;
  const box={left:Math.max(8,Math.min(width-label.width-8,label.x-label.width/2)),top:label.y,width:label.width,height:label.height};
  if(occupied.some(other=>mapRectsOverlap(box,other)))continue;
  occupied.push(box);placed.set(label.id,box);
 }
 return placed;
}
