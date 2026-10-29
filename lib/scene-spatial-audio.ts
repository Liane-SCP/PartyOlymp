export type AudioPoint=[number,number,number];
export interface SceneAudioFrame {listener:AudioPoint;forward:AudioPoint;up:AudioPoint;anchors:Record<string,AudioPoint>;motors?:import('./race-motor-drive').RaceMotorFrame[]}
export interface SceneAudioMix {effects:number;muted:boolean}

/** A cue owns its scheduled sources until they end, or its scene cancels them. */
export class SpatialCueRoute {
 readonly output:PannerNode;
 private voices=new Map<AudioScheduledSourceNode,()=>void>();
 private closed=false;private released=false;
 constructor(private ctx:BaseAudioContext,bus:AudioNode,position:AudioPoint,private release:()=>void){
  this.output=ctx.createPanner();this.output.panningModel='equalpower';this.output.distanceModel='inverse';this.output.refDistance=16;this.output.maxDistance=200;this.output.rolloffFactor=.15;
  [this.output.positionX.value,this.output.positionY.value,this.output.positionZ.value]=position;
  this.output.connect(bus);
 }
 track(source:AudioScheduledSourceNode,cleanup:()=>void){
  if(this.released){try{source.stop();}catch{}cleanup();return;}
  this.voices.set(source,cleanup);source.onended=()=>this.finish(source);
 }
 private finish(source:AudioScheduledSourceNode){const cleanup=this.voices.get(source);if(!cleanup)return;this.voices.delete(source);source.onended=null;cleanup();this.maybeRelease();}
 private maybeRelease(){if(!this.closed||this.voices.size||this.released)return;this.released=true;this.output.disconnect();this.release();}
 close(){this.closed=true;this.maybeRelease();}
 cancel(){if(this.released)return;this.closed=true;for(const source of [...this.voices.keys()]){try{source.stop(this.ctx.currentTime);}catch{}this.finish(source);}this.maybeRelease();}
 get size(){return this.voices.size;}
}

/** Shared effects gain, bounded simultaneous cues; no scheduler or background timer. */
export class SceneSpatialAudio {
 private bus:GainNode;private routes=new Set<SpatialCueRoute>();private anchors:Record<string,AudioPoint>={};private stopped=false;
 constructor(private ctx:BaseAudioContext,output:AudioNode,readonly kind:string,private read:()=>SceneAudioMix){this.bus=ctx.createGain();this.bus.gain.value=0;this.bus.connect(output);this.refresh();}
 update(frame:SceneAudioFrame){
  if(this.stopped)return;this.anchors=frame.anchors;
  const listener=this.ctx.listener;
  [listener.positionX.value,listener.positionY.value,listener.positionZ.value]=frame.listener;
  [listener.forwardX.value,listener.forwardY.value,listener.forwardZ.value]=frame.forward;
  [listener.upX.value,listener.upY.value,listener.upZ.value]=frame.up;
 }
 hasAnchor(name:string){return Object.hasOwn(this.anchors,name);}
 begin(name:string){
  const position=this.anchors[name],mix=this.read();
  if(this.stopped||!position||position.some(n=>!Number.isFinite(n))||mix.muted||mix.effects<=0||this.ctx.state!=='running'||this.routes.size>=8)return null;
  let route:SpatialCueRoute;route=new SpatialCueRoute(this.ctx,this.bus,position,()=>this.routes.delete(route));this.routes.add(route);return route;
 }
 refresh(){if(this.stopped)return;const mix=this.read(),now=this.ctx.currentTime;this.bus.gain.cancelScheduledValues(now);this.bus.gain.setTargetAtTime(mix.muted?0:Math.max(0,Math.min(1,mix.effects)),now,.008);}
 stats(){return {kind:this.kind,groups:this.routes.size,voices:[...this.routes].reduce((n,r)=>n+r.size,0),anchors:Object.keys(this.anchors)};}
 stop(){if(this.stopped)return;this.stopped=true;this.bus.gain.cancelScheduledValues(this.ctx.currentTime);this.bus.gain.value=0;for(const route of [...this.routes])route.cancel();this.routes.clear();this.anchors={};this.bus.disconnect();}
}
