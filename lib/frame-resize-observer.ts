/** Apply size-dependent layout on the next frame, outside ResizeObserver delivery. */
export class FrameResizeObserver {
 private frame=0;
 private observer:ResizeObserver;
 constructor(update:()=>void){
  this.observer=new ResizeObserver(()=>{
   if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;update();});
  });
 }
 observe(node:Element){this.observer.observe(node);}
 disconnect(){this.observer.disconnect();cancelAnimationFrame(this.frame);this.frame=0;}
}
