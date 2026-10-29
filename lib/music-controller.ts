import { musicProfiles, musicStep, type MusicNote } from "./game-music";
export interface MusicMix { music: number; muted: boolean; ducked: boolean; }
type Voice={source:AudioScheduledSourceNode;nodes:AudioNode[]};
/** Dedicated music bus, bounded voices and clock-based scheduling for every normal mode. */
export class MusicController {
  private output: GainNode;
  private voices=new Set<Voice>();
  private noise:AudioBuffer;
  private timer:ReturnType<typeof setInterval>|null=null;
  private nextAt:number;
  private step=0;
  private stopped=false;
  constructor(private ctx:AudioContext,master:AudioNode,readonly key:string,private mix:()=>MusicMix, autoStart=true) {
    this.output=ctx.createGain();this.output.gain.value=0;this.output.connect(master);
    this.nextAt=ctx.currentTime+0.04;
    this.noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
    const data=this.noise.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
    this.refresh();if(autoStart){this.timer=setInterval(()=>this.schedule(),100);this.schedule();}
  }
  refresh() {
    if(this.stopped)return;
    const mix=this.mix();
    const hidden=typeof document!=="undefined"&&document.hidden;
    this.output.gain.setTargetAtTime(mix.muted||hidden?0:mix.music*(mix.ducked?0.22:0.8),this.ctx.currentTime,0.12);
  }
  private remember(voice:Voice) {
    this.voices.add(voice);
    voice.source.onended=()=>{if(!this.voices.delete(voice))return;voice.nodes.forEach(n=>n.disconnect());};
  }
  /** Used both by the live scheduler and offline score verification. */
  renderStep(at:number,step:number) {
    const profile=musicProfiles[this.key];if(!profile)return;
    for(const note of musicStep(profile,step))this.note(at,note);
    const beat=step%8;
    if(profile.drums.includes(beat)) {
      if(beat===0||beat===4) this.note(at,{note:34,duration:0.18,level:0.12,instrument:"bass",pan:0},24);
      else this.hat(at,profile.style==="lounge"?0.025:0.045,beat%2===0?1600:4800);
    }
    if(!profile.ambient && profile.style==="arcade"&&beat%2===1)this.hat(at,0.022,7000);
  }
  private allowed() {return !this.stopped&&this.voices.size<32&&this.ctx.state==="running"&&!this.mix().muted&&this.mix().music>0;}
  private note(at:number,n:MusicNote,slide?:number) {
    if(!this.allowed())return;
    const ctx=this.ctx,t=Math.max(ctx.currentTime+0.002,at);
    const source=ctx.createOscillator(),filter=ctx.createBiquadFilter(),envelope=ctx.createGain(),pan=ctx.createStereoPanner();
    source.type=n.instrument==="chip"?"square":["reed","strings"].includes(n.instrument)?"sawtooth":n.instrument==="pluck"?"triangle":"sine";
    source.frequency.setValueAtTime(440*2**((n.note-69)/12),t);
    if(slide!==undefined)source.frequency.exponentialRampToValueAtTime(440*2**((slide-69)/12),t+n.duration);
    filter.type="lowpass";filter.Q.value=0.4;
    const cutoff=n.instrument==="pad"?700:n.instrument==="bass"?220:n.instrument==="chip"?2300:n.instrument==="strings"?1300:4000;
    filter.frequency.setValueAtTime(cutoff,t);
    if(n.instrument==="pluck"||n.instrument==="keys")filter.frequency.exponentialRampToValueAtTime(450,t+n.duration);
    const attack=n.instrument==="pad"?Math.min(1.2,n.duration*0.2):n.instrument==="strings"?0.06:0.008;
    envelope.gain.setValueAtTime(0.0001,t);
    envelope.gain.exponentialRampToValueAtTime(n.level*(n.instrument==="chip"?0.4:1),t+attack);
    if(n.instrument==="pad")envelope.gain.setValueAtTime(n.level*0.8,t+n.duration*0.65);
    envelope.gain.exponentialRampToValueAtTime(0.0001,t+n.duration);
    pan.pan.value=n.pan;
    source.connect(filter);filter.connect(envelope);envelope.connect(pan);pan.connect(this.output);
    this.remember({source,nodes:[source,filter,envelope,pan]});source.start(t);source.stop(t+n.duration+0.03);
  }
  private hat(at:number,level:number,cutoff:number) {
    if(!this.allowed())return;
    const t=Math.max(this.ctx.currentTime+0.002,at),source=this.ctx.createBufferSource();source.buffer=this.noise;
    const filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();filter.type="highpass";filter.frequency.value=cutoff;
    gain.gain.setValueAtTime(level,t);gain.gain.exponentialRampToValueAtTime(0.0001,t+0.09);
    source.connect(filter);filter.connect(gain);gain.connect(this.output);
    this.remember({source,nodes:[source,filter,gain]});source.start(t);source.stop(t+0.11);
  }
  private schedule() {
    if(this.stopped)return;
    this.refresh();const now=this.ctx.currentTime;
    if(this.ctx.state!=="running"||(typeof document!=="undefined"&&document.hidden)) {this.nextAt=now+0.06;return;}
    if(this.nextAt<now-0.12)this.nextAt=now+0.025;
    const eighth=30/musicProfiles[this.key].bpm;
    while(this.nextAt<now+0.18){this.renderStep(this.nextAt,this.step++);this.nextAt+=eighth;}
  }
  stop() {
    if(this.stopped)return;this.stopped=true;
    if(this.timer)clearInterval(this.timer);this.timer=null;
    this.output.gain.cancelScheduledValues(this.ctx.currentTime);
    this.output.gain.setTargetAtTime(0,this.ctx.currentTime,0.045);
    setTimeout(()=>{for(const voice of this.voices){voice.source.onended=null;try{voice.source.stop();}catch{}voice.nodes.forEach(n=>n.disconnect());}
      this.voices.clear();this.output.disconnect();},250);
  }
}
