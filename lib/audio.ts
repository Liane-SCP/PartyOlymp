import { playEmoteVoice } from "./emote-audio";
import { BossAudioController, type BossKind } from "./boss-audio";
import { MusicController } from "./music-controller";
import { musicKey } from "./game-music";
import { AdventureAmbience,adventureAcoustics } from "./adventure-audio";
import { createHallImpulse } from "./adventure-reverb";
import {SceneSpatialAudio,type SceneAudioFrame,type SpatialCueRoute} from './scene-spatial-audio';
import {RaceMotorAudio} from './race-motor-audio';
import {emoteNames} from './emotes';
export interface AudioSettings {
  master: number;
  music: number;
  effects: number;
  emotes: number;
  muted: boolean;
  motion: boolean;
  intense: boolean;
  favorites: number[];
  mutedPlayers: string[];
}
export const defaults: AudioSettings = {
  master: 0.5,
  music: 0.12,
  effects: 0.7,
  emotes: 0.45,
  muted: false,
  motion: false,
  intense: true,
  favorites: [0, 3, 4, 5, 9, 10],
  mutedPlayers: [],
};
/** Stored preferences may come from an older version or an interrupted write. */
export function normalizeAudioSettings(value: unknown): AudioSettings {
  const saved=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
  const volume=(key:'master'|'music'|'effects'|'emotes')=>{
    const amount=saved[key];
    return typeof amount==='number'&&Number.isFinite(amount)?Math.max(0,Math.min(1,amount)):defaults[key];
  };
  const flag=(key:'muted'|'motion'|'intense')=>{
    const enabled=saved[key];
    return typeof enabled==='boolean'?enabled:defaults[key];
  };
  const favorites=Array.isArray(saved.favorites)?[...new Set(saved.favorites.filter((id):id is number=>typeof id==='number'&&Number.isInteger(id)&&id>=0&&id<emoteNames.length))].slice(0,6):[...defaults.favorites];
  const mutedPlayers=Array.isArray(saved.mutedPlayers)?[...new Set(saved.mutedPlayers.filter((id):id is string=>typeof id==='string'&&id.length>0))]:[];
  return {master:volume('master'),music:volume('music'),effects:volume('effects'),emotes:volume('emotes'),muted:flag('muted'),motion:flag('motion'),intense:flag('intense'),favorites,mutedPlayers};
}
export class Sound {
  private clockQuiet=false;
  quietClock(enabled:boolean){if(this.clockQuiet===enabled)return;this.clockQuiet=enabled;this.musicController?.refresh();this.spatial?.refresh();}
  private hallWet:GainNode|null=null;
  private ambience: AdventureAmbience | null = null;
  private adventureKind:string|null=null;
  private spatial:SceneSpatialAudio|null=null;
  private spatialFrame:SceneAudioFrame|null=null;
  private cueRoute:SpatialCueRoute|null=null;
  private raceMotors:RaceMotorAudio|null=null;
  adventure(kind: string | null) {
    if(this.adventureKind!==kind){this.ambience?.stop();this.ambience=null;this.spatial?.stop();this.spatial=null;this.raceMotors?.stop();this.raceMotors=null;this.spatialFrame=null;this.adventureKind=kind;}
    this.ensureAdventure();this.ambience?.refresh();this.spatial?.refresh();
    if(this.ctx&&this.hallWet)this.hallWet.gain.setTargetAtTime(this.settings.muted||(typeof document!=='undefined'&&document.hidden)?0:adventureAcoustics(kind).wet,this.ctx.currentTime,.03);
  }
  sceneFrame(kind:string,frame:SceneAudioFrame){if(kind!==this.adventureKind)return;this.spatialFrame=frame;this.spatial?.update(frame);this.ambience?.refresh();if(kind==='typer'&&frame.motors?.length){this.ensureRaceMotors();this.raceMotors?.update(frame.motors,frame.listener);}else{this.raceMotors?.stop();this.raceMotors=null;}}
  raceAudioStats(){return this.raceMotors?.stats()??{slots:0,voices:0,active:[],gain:0};}
  private ensureRaceMotors(){if(this.raceMotors||this.adventureKind!=='typer'||!this.ctx||this.ctx.state!=='running'||!this.master||this.settings.muted||this.settings.effects<=0||!this.spatialFrame?.motors?.length)return;this.raceMotors=new RaceMotorAudio(this.ctx,this.master,()=>({effects:this.settings.effects,muted:this.settings.muted||(typeof document!=='undefined'&&document.hidden)}));}
  sceneAudioStats(){return this.spatial?.stats()??{kind:this.adventureKind,groups:0,voices:0,anchors:[]};}
  private ensureAdventure(){
    const kind=this.adventureKind;if(!kind||!this.ctx||!this.master)return;
    if(!this.ambience)this.ambience=new AdventureAmbience(this.ctx,this.master,kind,()=>({muted:this.settings.muted||(typeof document!=='undefined'&&document.hidden),effects:this.settings.effects,ducked:Date.now()<this.duckUntil}));
    if(!this.spatial){this.spatial=new SceneSpatialAudio(this.ctx,this.master,kind,()=>({effects:this.settings.effects,muted:this.settings.muted||this.clockQuiet||(typeof document!=='undefined'&&document.hidden)}));if(this.spatialFrame)this.spatial.update(this.spatialFrame);}
    this.ensureRaceMotors();
  }
  ctx: AudioContext | null = null;
  tension = false;
  private preferences = defaults;
  master: GainNode | null = null;
  emoteBus: GainNode | null = null;
  private bossController: BossAudioController | null = null;
  private bossState: { kind: BossKind; phase: number; stage: string } | null =
    null;
  private musicPhase = "";
  private musicGame?: string;
  private musicController: MusicController | null = null;
  get settings() {
    return this.preferences;
  }
  set settings(value: AudioSettings) {
    this.preferences = value;
    this.refreshMix();
  }
  /** Also mute already scheduled voices and reverb tails in a hidden tab. */
  refreshMix() {
    const value=this.preferences;
    const muted=value.muted||(typeof document!=='undefined'&&document.hidden);
    if (this.ctx && this.master)
      this.master.gain.setTargetAtTime(
        muted ? 0 : value.master,
        this.ctx.currentTime,
        0.008,
      );
    this.bossController?.refresh();
    this.musicController?.refresh();
    this.ambience?.refresh();
    this.spatial?.refresh();
    this.raceMotors?.refresh();
    if(this.ctx&&this.hallWet)this.hallWet.gain.setTargetAtTime(muted?0:adventureAcoustics(this.adventureKind).wet,this.ctx.currentTime,0.008);
  }
  last: Record<string, number> = {};
  active = 0;
  duckUntil = 0;
  noise(duration: number, volume: number, cutoff = 1800, delay = 0) {
    if (
      !Number.isFinite(volume) || volume <= 0 ||
      !this.ctx ||
      this.ctx.state !== "running" ||
      this.settings.muted ||
      this.active >= 24
    )
      return;
    const ctx = this.ctx,
      buffer = ctx.createBuffer(
        1,
        Math.ceil(ctx.sampleRate * duration),
        ctx.sampleRate,
      );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain(),
      t = ctx.currentTime + delay;
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter);
    filter.connect(gain);
    const route=this.cueRoute;gain.connect(route?.output??this.master!);
    source.start(t);
    this.active++;
    const cleanup = () => {
      this.active--;
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    if(route)route.track(source,cleanup);else source.onended=cleanup;
  }
  init() {
    if (typeof window === "undefined" || this.settings.muted) return;
    const activation=navigator.userActivation;
    if(!this.ctx&&(document.hidden||(activation&&!activation.isActive&&!activation.hasBeenActive)))return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 18;
      limiter.ratio.value = 4;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.2;
      this.master.gain.value = this.settings.muted ? 0 : this.settings.master;
      this.master.connect(limiter);
      const hall=this.ctx.createConvolver();hall.buffer=createHallImpulse(this.ctx);
      this.hallWet=this.ctx.createGain();this.hallWet.gain.value=this.settings.muted?0:adventureAcoustics(this.adventureKind).wet;
      this.master.connect(hall);hall.connect(this.hallWet);this.hallWet.connect(limiter);
      limiter.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended"&&!document.hidden) void this.ctx.resume();
    this.ensureBoss();
    this.ensureMusic();
    this.ensureAdventure();
  }
  private ensureMusic() {
    const key = musicKey(this.musicPhase, this.musicGame);
    if(this.bossState || !key || !this.ctx || !this.master) return;
    if(this.musicController?.key === key) return;
    this.musicController?.stop();
    this.musicController = new MusicController(this.ctx, this.master, key, () => ({
      music: this.settings.music, muted: this.settings.muted||this.clockQuiet||(typeof document!=='undefined'&&document.hidden), ducked: Date.now() < this.duckUntil,
    }));
  }
  private ensureBoss() {
    if (!this.ctx || !this.master || !this.bossState) return;
    if (!this.bossController)
      this.bossController = new BossAudioController(
        this.ctx,
        this.master,
        this.bossState.kind,
        () => ({
          music: this.settings.music,
          effects: this.settings.effects,
          muted: this.settings.muted||(typeof document!=='undefined'&&document.hidden),
          ducked: Date.now() < this.duckUntil,
        }),
      );
    this.bossController.update(
      this.bossState.kind,
      this.bossState.phase,
      this.bossState.stage,
    );
  }
  boss(kind: BossKind | null, phase = 0, stage = "answer") {
    if (kind === null) {
      if (!this.bossState && !this.bossController) return;
      this.bossState = null;
      this.bossController?.stop();
      this.bossController = null;
      this.music(this.musicPhase, this.musicGame);
      return;
    }
    this.bossState = { kind, phase, stage };
    this.musicController?.stop();
    this.musicController = null;
    this.ensureBoss();
  }
  bossCue(kind: BossKind, cue: string, strength = 1) {
    if (!this.bossState || this.bossState.kind !== kind) return;
    this.ensureBoss();
    this.bossController?.cue(kind, cue, strength);
  }
  tone(
    freq: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
    delay = 0,
    slide?: number,
  ) {
    if (
      !Number.isFinite(volume) || volume <= 0 ||
      !this.ctx ||
      this.ctx.state !== "running" ||
      this.settings.muted ||
      this.active >= 24
    )
      return;
    const ctx = this.ctx,
      osc = ctx.createOscillator(),
      gain = ctx.createGain(),
      t = ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + duration);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    const route=this.cueRoute;gain.connect(route?.output??this.master!);
    osc.start(t);
    osc.stop(t + duration + 0.02);
    this.active++;
    const cleanup = () => {
      this.active--;
      osc.disconnect();
      gain.disconnect();
    };
    if(route)route.track(osc,cleanup);else osc.onended=cleanup;
  }
  play(name: string, emote?: number, anchor=name) {
    if(this.settings.muted)return;
    if(typeof document!=='undefined'&&document.hidden)return;
    if(typeof navigator!=='undefined'&&navigator.userActivation?.isActive&&(typeof document==='undefined'||!document.hidden)&&(!this.ctx||this.ctx.state==='suspended'))this.init();
    const now = Date.now();
    if (now - (this.last[name] ?? 0) < (name === "emote" ? 300 : 120)) return;
    this.last[name] = now;
    const spatial=this.spatial?.hasAnchor(anchor),route=spatial?this.spatial!.begin(anchor):null;
    if(spatial&&!route)return;
    this.cueRoute=route;
    try{this.renderCue(name,emote,now);}finally{this.cueRoute=null;route?.close();}
  }
  private renderCue(name:string,emote:number|undefined,now:number){
    const v = (this.cueRoute?1:this.settings.effects) * 0.18;
    if(name==='journeyBoard'){this.noise(.045,v*.15,1400);this.noise(.07,v*.12,900,.08);return;}
    if(name==='journeyAirship'){this.noise(.35,v*.15,1400);this.tone(110,.3,v*.13,'sine',0,160);return;}
    if(name==='journeyFerry'){this.tone(659.25,.18,v*.15,'triangle');this.tone(523.25,.28,v*.1,'sine',.15);return;}
    if(name==='journeyLand'){this.noise(.12,v*.2,700);this.tone(392,.18,v*.13,'sine',.1);this.tone(523.25,.18,v*.11,'sine',.24);return;}
    if(name==='spectrumDial'){this.noise(.025,v*.3,2800);this.tone(620,.045,v*.14,'triangle',0,390);return;}
    if(name==='sizeSelect'){this.noise(.035,v*.14,2100);this.tone(520,.065,v*.11,'triangle',0,390);return;}
    if(name==='sizeReveal'){this.noise(.16,v*.12,800);this.tone(392,.2,v*.13,'sine',.08);this.tone(587.33,.22,v*.1,'sine',.21);return;}
    if(name==='colorMix'){this.noise(.04,v*.1,1800);this.tone(440,.045,v*.1,'sine',0,520);return;}
    if(name==='colorClose'){this.noise(.12,v*.18,700);this.tone(330,.14,v*.14,'triangle',0,220);return;}
    if(name==='colorSeal'){this.tone(660,.12,v*.17,'triangle');this.tone(880,.15,v*.13,'sine',.08);return;}
    if(name==='colorReveal'){this.noise(.15,v*.13,1800);[392,523.25,659.25].forEach((n,i)=>this.tone(n,.3,v*.16,'sine',i*.14));return;}
    if(name==='pictureBuzz'){this.noise(.055,v*.3,1100);this.tone(660,.16,v*.32,'triangle',0,440);return;}
    if(name==='pictureWrong'){this.tone(330,.17,v*.24,'triangle',0,180);this.noise(.08,v*.1,900,.1);return;}
    if(name==='pictureWin'){[523.25,659.25,783.99].forEach((n,i)=>this.tone(n,.25,v*.23,'sine',i*.11));return;}
    if(name==='pictureReveal'){this.noise(.2,v*.22,1700);this.tone(392,.3,v*.15,'sine',.15);this.tone(523.25,.35,v*.16,'sine',.35);return;}
    if(name==='wikiPage'){this.noise(.12,v*.3,1700);this.noise(.07,v*.18,2800,.07);this.tone(280,.08,v*.1,'sine',.12);return;}
    if(name==='wikiArrival'){this.noise(.16,v*.16,900);[392,493.88,659.25].forEach((n,i)=>this.tone(n,.32,v*.22,'sine',.1+i*.14));return;}
    if(name==='spectrumReveal'){this.noise(.14,v*.22,1100);[440,554.37,659.25].forEach((n,i)=>this.tone(n,.28,v*.23,'sine',.1+i*.14));return;}
    if(name==='herdMatch'||name==='herdTie'){this.noise(.2,v*.18,1500);const notes=name==='herdMatch'?[392,523.25,659.25,783.99]:[392,440,392];notes.forEach((n,i)=>this.tone(n,.24,v*.22,'sine',.12+i*.13));return;}
    if(name==='chainWord'){this.noise(.055,v*.25,1800);this.tone(520,.09,v*.2,'sine',0,680);return;}
    if(name==='chainChallenge'){this.tone(660,.2,v*.35,'triangle');this.tone(440,.22,v*.25,'triangle',.13);return;}
    if(name==='chainAccepted'){this.noise(.08,v*.45,850);this.noise(.06,v*.25,1500,.12);this.tone(587,.18,v*.2,'sine',.2);this.tone(784,.24,v*.22,'sine',.32);return;}
    if(name==='chainOut'){this.tone(320,.25,v*.25,'triangle',0,110);this.noise(.3,v*.18,1400,.18);return;}
    if(name==='auctionOpen'){[392,493.88,587.33].forEach((f,i)=>this.tone(f,.15,v*.3,'sine',i*.07));return;}
    if(name==='auctionJudge'){this.noise(.14,v*.2,2800);this.tone(880,.18,v*.2,'sine',.12);return;}
    if(name==='codeSelect'){this.noise(.025,v*.25,2400);this.tone(640,.045,v*.13,'sine',0,380);return;}
    if(name==='codeFeedback'){for(let i=0;i<4;i++){this.noise(.035,v*.3,1600,i*.065);this.tone(260+i*85,.08,v*.15,'triangle',i*.065);}this.noise(.13,v*.13,450,.3);return;}
    if(name==='card'){this.noise(.09,v*.35,5200);this.noise(.025,v*.16,1000,.085);return;}
    if(name==='cardReverse'){this.noise(.13,v*.25,2300);this.tone(440,.11,v*.25,'sine',0,660);this.tone(660,.11,v*.25,'sine',.12,440);return;}
    if(name==='cardSkip'){this.tone(330,.1,v*.25,'triangle');this.noise(.045,v*.2,850,.08);return;}
    if(name==='cardPenalty'){for(let i=0;i<4;i++)this.noise(.035,v*.22,4200,i*.075);return;}
    if(name==='cardLast'){this.tone(783.99,.13,v*.3,'sine');this.tone(1046.5,.22,v*.3,'sine',.14);return;}
    if(name==='casinoPayout'){for(const delay of[0,.12,.24]){this.noise(.018,v*.16,4200,delay);this.tone(1400,.08,v*.1,'sine',delay);this.tone(2100,.045,v*.04,'sine',delay+.01);}return;}
    if(name==='diceCombo'){
      this.duckUntil=now+750;[523.25,783.99,1046.5].forEach((f,i)=>this.tone(f,.3,v*.5,'triangle',i*.09));this.noise(.12,v*.12,1800);return;
    }
    if(name==='raceOvertake'){
      this.tone(180,.22,v*.35,'triangle',0,560);this.noise(.18,v*.1,2200);return;
    }
    if(['checkoutOver','checkoutClose','checkoutSuccess','checkoutComplete'].includes(name)){
      this.duckUntil=now+600;
      const notes=name==='checkoutOver'?[392,293.66,196]:name==='checkoutClose'?[587.33,783.99,1174.66]:name==='checkoutComplete'?[523.25,659.25,783.99,1046.5]:[523.25,783.99];
      if(name!=='checkoutComplete')this.tone(1568,.06,v*.3,'sine');
      notes.forEach((f,i)=>this.tone(f,.21,v*.4,'sine',.1+i*.09));if(name==='checkoutOver')this.noise(.1,v*.12,500);return;
    }
    if(name==="raceFinish") {
      this.duckUntil=now+650;
      [523.25,659.25,783.99,1046.5].forEach((frequency,i)=>this.tone(frequency,.22,v*.6,"triangle",i*.07));
      return;
    }
    if(name==="checkoutScan") {
      this.tone(1568,.09,v*.48,"sine");
      this.tone(2093,.055,v*.22,"sine",.07);
      return;
    }
    if(name==="sceneResolve") {
      this.duckUntil=now+1100;
      [392,587.33,783.99].forEach((frequency,i)=>this.tone(frequency,0.65,v*0.35,"sine",i*0.075));
      this.noise(0.4,v*0.13,2500);return;
    }
    if(name==="timeWarning"||name==="timeUrgent"||name==="timeUp") {
      if(name==="timeUp") [880,660,440].forEach((frequency,i)=>this.tone(frequency,.22,v,"triangle",i*.15));
      else {this.tone(name==="timeUrgent"?980:660,.14,v,"triangle");if(name==="timeWarning")this.tone(880,.14,v,"triangle",.18);}
      return;
    }
    if (name === "bid") {
      this.tone(440, 0.13, v, "triangle", 0, 660);
      this.tone(880, 0.16, v * 0.6, "sine", 0.08);
      return;
    }
    if (name === "gavel") {
      this.noise(0.12, v * 1.3, 900);
      this.tone(135, 0.24, v, "triangle", 0, 65);
      this.noise(0.1, v * 0.7, 1200, 0.2);
      return;
    }
    if (name === "auctionWord") {
      this.tone(580, 0.07, v * 0.5, "sine", 0, 840);
      return;
    }
    if (name === "auctionWin") {
      [392, 494, 587, 784].forEach((f, i) =>
        this.tone(f, 0.3, v, "triangle", i * 0.13),
      );
      this.noise(0.45, v * 0.5, 4800, 0.4);
      return;
    }
    if (name === "auctionFail") {
      this.tone(220, 0.65, v, "triangle", 0, 55);
      this.noise(0.22, v * 0.5, 700, 0.1);
      return;
    }
    if (name === "clockOn") {
      this.tone(720, 0.12, v * 0.6, "sine");
      return;
    }
    if (name === "clockOff") {
      this.tone(260, 0.11, v * 0.7, "triangle");
      return;
    }
    if (name === "clockDecoy") {
      this.tone(260 + Math.random() * 500, 0.06, v * 0.28, "sine");
      return;
    }
    if (name === "clockReveal") {
      this.tone(660, 0.18, v * 0.7, "sine", 0, 880);
      return;
    }
    if (name === "clockPerfect") {
      [523, 659, 784, 1047].forEach((f, i) =>
        this.tone(f, 0.45, v * 0.65, "sine", i * 0.12),
      );
      return;
    }
    if (name === "fuse") {
      this.noise(0.055, v * 0.16, 6000);
      this.tone(150, 0.035, v * 0.1, "triangle");
      return;
    }
    if (name === "bombPass") {
      this.noise(0.15, v * 0.4, 2400);
      this.tone(280, 0.14, v * 0.6, "sine", 0, 720);
      return;
    }
    if (name === "explosion") {
      this.duckUntil = now + 2200;
      this.noise(0.85, v * 1.7, 1600);
      this.tone(95, 0.75, v * 1.4, "sine", 0, 28);
      return;
    }
    if (name === "categoryVote") {
      this.noise(.16,v*.3,1900);
      this.tone(540,.14,v*.35,"triangle",.06,720);
      return;
    }
    if (name === "categoryResult") {
      this.noise(.07,v*.4,800);
      this.tone(660,.2,v*.4,"sine",.04);
      this.tone(880,.25,v*.3,"sine",.12);
      return;
    }
    if (name === "wordReview") {
      this.tone(440, 0.17, v * 0.6, "triangle");
      this.tone(330, 0.2, v * 0.5, "triangle", 0.15);
      return;
    }
    if (name === "wordRejected") {
      this.tone(180, 0.2, v * 0.65, "triangle", 0, 100);
      return;
    }
    if (
      [
        "reveal",
        "score",
        "win",
        "lead",
        "overtake",
        "price",
        "dealer",
        "suspense",
        "bust",
      ].includes(name)
    )
      this.duckUntil = now + 1800;
    if (name === "suspense") {
      [0, 0.23].forEach((d) => this.tone(62, 0.23, v * 0.55, "sine", d, 38));
      this.tone(196, 1.1, v * 0.15, "triangle", 0, 207.65);
      return;
    }
    if (name === "dealer") {
      this.noise(0.18, v * 0.6, 5500);
      this.tone(180, 0.16, v * 0.7, "sine", 0.07, 72);
      this.tone(880, 0.36, v * 0.25, "triangle", 0.12, 1320);
      return;
    }
    if (name === "bust" || name === "loss") {
      [293.66, 277.18, 220, 146.83].forEach((f, i) =>
        this.tone(f, 0.38, v * 0.65, "triangle", i * 0.16),
      );
      this.tone(75, 0.8, v * 0.6, "sine", 0.25, 35);
      this.noise(0.4, v * 0.25, 800, 0.45);
      return;
    }
    if (name === "price" || name === "coins" || name === "basket") {
      const register = name === "price",
        count = register ? 5 : name === "coins" ? 8 : 2;
      for (let i = 0; i < count; i++) {
        const d = i * 0.085,
          f = [1568, 2093, 2637, 1760][i % 4];
        this.tone(f, 0.25, v * 0.35, "sine", d);
        this.tone(f * 1.48, 0.11, v * 0.12, "sine", d);
        this.noise(0.027, v * 0.2, 6500, d);
      }
      if (register) {
        this.noise(0.13, v * 0.35, 1300);
        this.tone(1046.5, 0.65, v * 0.4, "triangle", 0.32);
      }
      return;
    }
    if (name === "stand") {
      this.tone(240, 0.14, v * 0.45, "triangle");
      this.tone(360, 0.2, v * 0.3, "sine", 0.08);
      return;
    }
    if (name === "typeKey" || name === "typeError") {
      this.noise(0.025, v * 0.12, name === "typeKey" ? 4200 : 900);
      this.tone(name === "typeKey" ? 620 : 150, 0.055, v * 0.12, "triangle");
      return;
    }
    if (name === "blockDrop") {
      this.noise(0.08, v * 0.4, 1300);
      this.tone(100, 0.15, v * 0.5, "sine", 0, 45);
      return;
    }
    if(name==='geoSeal'){
      this.noise(.065,v*.22,2500);
      this.tone(330,.09,v*.24,'triangle',.015,220);
      return;
    }
    if(name==='geoReveal'){
      this.noise(.28,v*.14,1700);
      [392,523.25,659.25].forEach((f,i)=>this.tone(f,.35,v*.21,'sine',i*.13));
      return;
    }
    if (name === "mapPin") {
      this.tone(520, 0.12, v * 0.35, "sine", 0, 1040);
      this.tone(1560, 0.3, v * 0.15, "triangle", 0.08);
      return;
    }
    if (name === "blockClear") {
      [523, 784, 1046].forEach((f, i) =>
        this.tone(f, 0.22, v * 0.35, "triangle", i * 0.06),
      );
      this.noise(0.15, v * 0.15, 5000);
      return;
    }
    if (name === "dice") {
      [0, 0.065, 0.14, 0.23, 0.35, 0.49].forEach((d, i) => {
        this.noise(0.055, v * 0.6, 1800 + i * 350, d);
        this.tone(190 + i * 43, 0.06, v * 0.4, "triangle", d);
      });
      return;
    }
    if (name === "card" || name === "navigate")
      this.noise(0.12, v * 0.35, 6500);
    if (name === "hit" || name === "collision") {
      this.noise(0.45, v * 0.9, name === "hit" ? 2600 : 900);
      this.tone(95, 0.5, v * 0.8, "sine", 0, 32);
      this.tone(210, 0.2, v * 0.35, "sawtooth", 0.06, 50);
      return;
    }
    if (
      ["reveal", "score", "win", "lead", "overtake", "finish"].includes(name)
    ) {
      if (name === "reveal") {
        [0, 0.14, 0.27, 0.39, 0.49, 0.58].forEach((d, i) =>
          this.noise(0.1, v * (0.2 + i * 0.05), 1800 + i * 450, d),
        );
        this.tone(98, 0.8, v * 0.5, "triangle", 0, 196);
        this.tone(55, 0.9, v * 0.85, "sine", 0.7);
        [392, 466.16, 587.33].forEach((f) =>
          this.tone(f, 0.8, v * 0.28, "triangle", 0.72),
        );
        return;
      }
      if (name === "overtake") {
        this.tone(180, 0.42, v * 0.5, "triangle", 0, 1100);
        this.noise(0.45, v * 0.3, 6000);
      }
      [0, 0.16, 0.32].forEach((d) => this.noise(0.08, v * 0.25, 2200, d));
      this.noise(0.7, v * 0.16, 3500);
      const notes =
        name === "win"
          ? [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5]
          : name === "lead"
            ? [392, 493.88, 587.33, 783.99]
            : [261.63, 329.63, 392, 523.25];
      notes.forEach((f, i) => {
        this.tone(f, 0.45, v * 0.6, "triangle", i * 0.16);
        this.tone(f * 2, 0.2, v * 0.12, "sine", i * 0.16);
      });
      this.tone(65.4, 0.9, v * 0.8, "sine", 0.12);
      const end = notes.length * 0.16;
      [261.63, 392, 523.25].forEach((f) =>
        this.tone(f, name === "win" ? 1.4 : 0.7, v * 0.28, "triangle", end),
      );
      return;
    }
    if (emote !== undefined) {
      if (
        !this.ctx ||
        this.ctx.state !== "running" ||
        !this.master ||
        this.settings.muted
      )
        return;
      const ev = this.settings.emotes * 0.6;
      if (ev <= 0) return;
      this.emoteBus?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.015);
      const voiceBus = this.ctx.createGain();
      voiceBus.connect(this.master);
      this.emoteBus = voiceBus;
      const duration = playEmoteVoice(this.ctx, voiceBus, emote, ev) ?? 1;
      setTimeout(
        () => {
          voiceBus.disconnect();
          if (this.emoteBus === voiceBus) this.emoteBus = null;
        },
        (duration + 0.15) * 1000,
      );
      this.duckUntil = Date.now() + duration * 1000;
      this.tone(140, 0.13, ev * 0.22, "sine", 0, 65);
      if ([9, 20, 31, 35, 37, 44].includes(emote))
        [0.2, 0.45, 0.7].forEach((d) => this.noise(0.055, ev * 0.35, 2600, d));
      if ([11, 13, 30, 41, 46].includes(emote))
        [1047, 1568, 2093, 2637].forEach((f, i) =>
          this.tone(f, 0.25, ev * 0.3, "sine", 0.3 + i * 0.11),
        );
      if ([19, 25, 29, 36, 45].includes(emote)) {
        this.noise(0.5, ev * 0.25, 1700, 0.15);
        this.tone(90, 0.5, ev * 0.24, "triangle", 0.12, 850);
      }
      if ([12, 24].includes(emote))
        this.tone(1100, 0.12, ev * 0.3, "sine", 0.35, 1900);
      if ([2, 21, 26].includes(emote)) this.noise(0.22, ev * 0.4, 1400, 0.1);
      if (emote === 33) {
        this.noise(0.13, ev * 0.7, 1800, 0.8);
        this.tone(80, 0.3, ev * 0.45, "sine", 0.8, 35);
      }
      if (emote === 38)
        [587, 554, 523].forEach((f, i) =>
          this.tone(f, 0.4, ev * 0.13, "triangle", 0.2 + i * 0.3, f * 0.94),
        );
      if (emote === 39) this.noise(0.28, ev * 0.17, 3200, 0.12);
      if (emote === 42) {
        this.noise(0.06, ev * 0.4, 900, 0.55);
        this.tone(260, 0.15, ev * 0.2, "triangle", 0.55, 110);
      }
      if (emote === 47)
        [660, 494, 330, 165].forEach((f, i) =>
          this.tone(f, 0.18, ev * 0.22, "triangle", 0.2 + i * 0.18),
        );
      return;
    }
    const patterns: Record<string, number[]> = {
      click: [450],
      confirm: [440, 660],
      attack: [180, 360, 720],
      join: [330, 440, 660],
      ready: [550, 880],
      countdown: [660],
      start: [440, 660, 880],
      dice: [170, 260, 200, 340],
      card: [400, 550],
      hit: [120, 80],
      collision: [120, 55],
      correct: [523, 659, 784],
      wrong: [220, 180],
      reveal: [330, 440, 550, 660],
      score: [660, 880],
      lead: [550, 740, 990],
      overtake: [330, 440, 660, 880],
      win: [523, 659, 784, 1047],
      navigate: [380, 500],
      price: [660, 990, 1320],
    };
    (patterns[name] ?? patterns.click).forEach((f, i) =>
      this.tone(
        f,
        name === "collision" ? 0.3 : 0.12,
        v,
        name === "hit" || name === "dice" ? "triangle" : "sine",
        i * 0.075,
      ),
    );
  }
  music(phase: string, game?: string) {
    this.musicPhase = phase;
    this.musicGame = game;
    const key = musicKey(phase, game);
    if (this.bossState || !key) {
      this.musicController?.stop();
      this.musicController = null;
      return;
    }
    this.ensureMusic();
  }
}
export const sound = new Sound();
