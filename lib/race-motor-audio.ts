import {audibleRaceMotors,type RaceMotorFrame} from './race-motor-drive';
import type {AudioPoint,SceneAudioMix} from './scene-spatial-audio';

type Motor={id:string|null;oscillators:OscillatorNode[];filter:BiquadFilterNode;panner:PannerNode;gain:GainNode;nodes:AudioNode[];frequency:number;cutoff:number;level:number};

/** Four reusable two-oscillator toy motors; no buffers, timers or per-key sources. */
export class RaceMotorAudio {
 private bus:GainNode;private motors:Motor[]=[];private stopped=false;private target=-1;private last=-Infinity;
 constructor(private ctx:AudioContext,output:AudioNode,private read:()=>SceneAudioMix){
  this.bus=ctx.createGain();this.bus.gain.value=0;this.bus.connect(output);this.refresh();
 }
 private make(){
  const filter=this.ctx.createBiquadFilter(),panner=this.ctx.createPanner(),gain=this.ctx.createGain();
  filter.type='lowpass';filter.frequency.value=220;filter.Q.value=.35;gain.gain.value=0;
  panner.panningModel='equalpower';panner.distanceModel='inverse';panner.refDistance=16;panner.maxDistance=180;panner.rolloffFactor=.8;
  const oscillators=[this.ctx.createOscillator(),this.ctx.createOscillator()],harmonic=this.ctx.createGain();harmonic.gain.value=.22;
  oscillators[0].type='triangle';oscillators[1].type='sine';oscillators[0].frequency.value=58;oscillators[1].frequency.value=116;
  oscillators[0].connect(filter);oscillators[1].connect(harmonic);harmonic.connect(filter);filter.connect(gain);gain.connect(panner);panner.connect(this.bus);
  const motor:Motor={id:null,oscillators,filter,panner,gain,nodes:[...oscillators,harmonic,filter,gain,panner],frequency:-1,cutoff:-1,level:-1};
  oscillators.forEach(source=>source.start());this.motors.push(motor);return motor;
 }
 private value(parameter:AudioParam,value:number,previous:number,time=.08){if(value===previous)return;const now=this.ctx.currentTime;parameter.cancelScheduledValues(now);parameter.setTargetAtTime(value,now,time);}
 update(drivers:RaceMotorFrame[],listener:AudioPoint){
  if(this.stopped)return;this.refresh();
  if(this.ctx.state!=='running')return;
  const selected=audibleRaceMotors(drivers,listener);
  // Identity/position updates remain immediate; timbre automation is capped at 20 Hz.
  const automate=this.ctx.currentTime-this.last>=.05;if(automate)this.last=this.ctx.currentTime;
  const ids=new Set(selected.map(row=>row.id));for(const motor of this.motors)if(motor.id&&!ids.has(motor.id)){motor.id=null;this.value(motor.gain.gain,0,motor.level,.04);motor.level=0;}
  for(const row of selected){
   const motor=this.motors.find(m=>m.id===row.id)??this.motors.find(m=>m.id===null)??this.make(),fresh=motor.id!==row.id;
   motor.id=row.id;[motor.panner.positionX.value,motor.panner.positionY.value,motor.panner.positionZ.value]=row.position;
   if(!automate&&!fresh)continue;
   const power=Math.max(0,Math.min(1,row.power)),variation=[...row.id].reduce((sum,c)=>sum+c.charCodeAt(0),0)%7;
   const frequency=Math.round(58+variation+power*85),cutoff=Math.round((220+power*680)/10)*10,level=Math.round((row.own?.008:.0035)*(1+power*.75)*100000)/100000;
   this.value(motor.oscillators[0].frequency,frequency,motor.frequency);this.value(motor.oscillators[1].frequency,frequency*2,motor.frequency*2);
   this.value(motor.filter.frequency,cutoff,motor.cutoff);this.value(motor.gain.gain,level,motor.level,fresh?.06:.1);
   motor.frequency=frequency;motor.cutoff=cutoff;motor.level=level;
  }
 }
 refresh(){if(this.stopped)return;const mix=this.read(),level=mix.muted||this.ctx.state!=='running'?0:Math.max(0,Math.min(1,mix.effects));if(level===this.target)return;this.value(this.bus.gain,level,this.target,.008);this.target=level;}
 stats(){return {slots:this.motors.length,voices:this.motors.length*2,active:this.motors.filter(m=>m.id!==null).map(m=>({id:m.id,frequency:m.frequency,level:m.level,position:[m.panner.positionX.value,m.panner.positionY.value,m.panner.positionZ.value]})),gain:this.target};}
 stop(){
  if(this.stopped)return;this.stopped=true;const now=this.ctx.currentTime,running=this.ctx.state==='running';this.bus.gain.cancelScheduledValues(now);this.bus.gain.setTargetAtTime(0,now,.008);
  let remaining=this.motors.length*2;const release=()=>{if(--remaining<=0)this.bus.disconnect();};
  for(const motor of this.motors){let ended=0;for(const source of motor.oscillators){source.onended=()=>{if(++ended===2)motor.nodes.forEach(node=>node.disconnect());release();};source.stop(now+(running?.05:0));}if(!running)motor.nodes.forEach(node=>node.disconnect());}
  if(!remaining||!running)this.bus.disconnect();this.motors=[];
 }
}
