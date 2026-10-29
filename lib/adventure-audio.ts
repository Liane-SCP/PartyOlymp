/** A quiet environmental layer, below music and action cues. */
type Texture='room'|'air'|'sea';
interface AmbientLayer {texture:Texture;filter:BiquadFilterType;cutoff:number;pan:number;level:number}
interface AmbientProfile {title:string;wet:number;layers:AmbientLayer[];hum?:number}
const room=(cutoff:number,pan:number,level:number):AmbientLayer=>({texture:'room',filter:'lowpass',cutoff,pan,level});
const profiles:Record<string,AmbientProfile>={
 geo:{title:'Offene Navigationswerkstatt mit ruhiger Fensterluft',wet:.025,layers:[room(480,-.3,.4),{texture:'air',filter:'bandpass',cutoff:1800,pan:.35,level:.1}]},
 size:{title:'Gedämpfte Museumsgalerie mit ruhiger Raumluft',wet:.045,layers:[room(410,-.3,.45),{texture:'air',filter:'bandpass',cutoff:1400,pan:.35,level:.08}]},
 color:{title:'Helles Farbenlabor mit leiser Lüftung und Mischtechnik',wet:.025,layers:[room(620,-.3,.4),{texture:'air',filter:'bandpass',cutoff:1900,pan:.35,level:.1}]},
 picture:{title:'Gedämpftes Fernsehstudio mit leiser Lichttechnik',wet:.035,layers:[room(380,-.35,.4),{texture:'air',filter:'bandpass',cutoff:1900,pan:.35,level:.08}]},
 wiki:{title:'Stille Bibliothek mit gedämpften Holzregalen und Fensterluft',wet:.05,layers:[room(360,-.3,.45),{texture:'air',filter:'bandpass',cutoff:1600,pan:.35,level:.07}]},
 spectrum:{title:'Gedämpfte Messhalle mit leiser Instrumentenlüftung',wet:.04,layers:[room(560,-.3,.5),{texture:'air',filter:'bandpass',cutoff:2100,pan:.35,level:.08}]},
 herd:{title:'Offener Picknickgarten mit sanftem Blätterwind',wet:.012,layers:[{texture:'air',filter:'lowpass',cutoff:2100,pan:-.4,level:.35},{texture:'air',filter:'bandpass',cutoff:3100,pan:.4,level:.08}]},
 categories:{title:'Helles Ideenatelier mit leiser Fensterluft und gedämpftem Holzraum',wet:.04,layers:[room(520,-.3,.5),{texture:'air',filter:'bandpass',cutoff:1700,pan:.35,level:.13}]},
 chain:{title:'Blätterwind und offene Flussschlucht',wet:.015,layers:[{texture:'air',filter:'lowpass',cutoff:2300,pan:-.4,level:.4},{texture:'sea',filter:'lowpass',cutoff:950,pan:.4,level:.3}]},
 bomb:{title:'Leise Werkstattlüftung und gedämpfter Maschinenraum',wet:.04,layers:[room(480,-.35,.5),{texture:'air',filter:'bandpass',cutoff:1300,pan:.4,level:.14}]},
 auction:{title:'Gedämpfter Auktionssaal mit Holz und schweren Vorhängen',wet:.065,layers:[room(310,-.3,.6),{texture:'air',filter:'bandpass',cutoff:1500,pan:.35,level:.09}]},
 code:{title:'Gedämpfte Tresorwerkstatt mit Lüftung und Transformator',wet:.045,layers:[room(420,-.3,.55),{texture:'air',filter:'bandpass',cutoff:2100,pan:.4,level:.14}],hum:50},
 cards:{title:'Blätterluft und Holzraum in der Baumrunde',wet:.018,layers:[{texture:'air',filter:'lowpass',cutoff:1900,pan:-.4,level:.4},room(550,.4,.3)]},
 blackjack:{title:'Gedämpfte Casino-Lounge mit leisem Raumton',wet:.055,layers:[room(280,-.4,.6),{texture:'air',filter:'bandpass',cutoff:1300,pan:.35,level:.1}]},
 dice:{title:'Warmer Salonraum mit leiser Fensterluft',wet:.065,layers:[room(340,-.35,.7),{texture:'air',filter:'bandpass',cutoff:1600,pan:.35,level:.13}]},
 budget:{title:'Kaufhauslüftung und elektrische Haustechnik',wet:.035,layers:[{texture:'air',filter:'bandpass',cutoff:1100,pan:-.3,level:.55},room(2600,.45,.4)],hum:50},
 typer:{title:'Küstenbrandung und offener Fahrtwind',wet:.008,layers:[{texture:'sea',filter:'lowpass',cutoff:1450,pan:-.45,level:.8},{texture:'air',filter:'lowpass',cutoff:3400,pan:.45,level:.25}]},
};
export function adventureAcoustics(kind:string|null){return {title:profiles[kind??'']?.title??'Bestehende Schauplatzatmosphäre',wet:kind==='timing'?0:profiles[kind??'']?.wet??.11};}
export class AdventureAmbience {
 private bus:GainNode;private sources:AudioScheduledSourceNode[]=[];private nodes:AudioNode[]=[];private stopped=false;private target=-1;
 constructor(private ctx:AudioContext,output:AudioNode,readonly kind:string,private read:()=>{muted:boolean;effects:number;ducked:boolean}){
  this.bus=ctx.createGain();this.bus.gain.value=0;this.bus.connect(output);this.nodes.push(this.bus);
  const profile=profiles[kind]??{title:'Bestehende Atmosphäre',wet:.11,layers:[room(kind==='wiki'?420:kind==='geo'?1800:850,kind==='wiki'?-.25:.15,1)],hum:kind==='code'?146.83:kind==='color'?174.61:kind==='hub'?130.81:98};
  let seed=[...kind].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(const layer of profile.layers){
   const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0),fade=Math.floor(ctx.sampleRate*.12);let last=0;
   for(let i=0;i<data.length;i++){const noise=random()*2-1;last=(last+noise*.03)/1.02;if(layer.texture==='sea'){const phase=i/data.length*Math.PI*2,wave=.65+.2*Math.sin(phase-.7)+.15*Math.sin(phase*3+.8);data[i]=(noise*.3+last)*wave;}else data[i]=layer.texture==='room'?last*2:noise*.28;}
   for(let i=0;i<fade;i++){const t=i/fade;data[data.length-fade+i]=data[data.length-fade+i]*(1-t)+data[i]*t;}
   const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),pan=ctx.createStereoPanner(),gain=ctx.createGain();
   source.buffer=buffer;source.loop=true;source.loopStart=fade/ctx.sampleRate;source.loopEnd=buffer.duration;filter.type=layer.filter;filter.frequency.value=layer.cutoff;filter.Q.value=.25;pan.pan.value=layer.pan;gain.gain.value=layer.level;
   source.connect(filter);filter.connect(pan);pan.connect(gain);gain.connect(this.bus);this.sources.push(source);this.nodes.push(source,filter,pan,gain);source.start(0,source.loopStart);
  }
  if(profile.hum){const hum=ctx.createOscillator(),gain=ctx.createGain();hum.type='sine';hum.frequency.value=profile.hum;gain.gain.value=profiles[kind]?.hum ? .025 : .045;hum.connect(gain);gain.connect(this.bus);this.sources.push(hum);this.nodes.push(hum,gain);hum.start();}
  this.refresh();
 }
 refresh(){if(this.stopped)return;const s=this.read(),silent=s.muted||s.effects<=0||this.ctx.state!=='running'||this.kind==='timing',level=silent?0:s.effects*(s.ducked?.018:.045);if(level===this.target)return;this.target=level;this.bus.gain.setTargetAtTime(level,this.ctx.currentTime,silent ? .008 : .4);}
 stop(){if(this.stopped)return;this.stopped=true;const now=this.ctx.currentTime,running=this.ctx.state==='running';this.bus.gain.setTargetAtTime(0,now,.035);let remaining=this.sources.length;const release=()=>{if(--remaining===0)this.nodes.forEach(n=>n.disconnect());};for(const source of this.sources){source.onended=release;source.stop(now+(running?.2:0));}if(!running)this.nodes.forEach(n=>n.disconnect());}
}
