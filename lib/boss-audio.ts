/** Original, procedurally orchestrated scores. No recordings or external assets. */
import { bossMusicVariant, bossMusicVariants } from "./boss-music-variants";
export type BossKind = "colossus" | "kraken" | "dragon";

type Mix = { music: number; effects: number; muted: boolean; ducked: boolean };
type Instrument = "brass" | "strings" | "choir" | "bell" | "pluck" | "sub";
type Bus = "music" | "effects";
type Voice = {
  bus: Bus;
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  end: number;
};

const midi = (note: number) => 440 * 2 ** ((note - 69) / 12);
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/**
 * A short look-ahead scheduler keeps the groove steady across React renders.
 * All transient nodes are bounded and disconnected; a single, small shared
 * convolution space gives the three orchestras scale without fetching audio.
 */
export class BossAudioController {
  private kind: BossKind;
  private phase = 0;
  private stage = "answer";
  private step = 0;
  private nextAt = 0;
  private stageAt = 0;
  private localDuckUntil = 0;
  private ending = false;
  private stopped = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private output: GainNode;
  private musicBus: GainNode;
  private effectsBus: GainNode;
  private room: ConvolverNode;
  private roomSend: GainNode;
  private roomReturn: GainNode;
  private noiseBuffer: AudioBuffer;
  private choirWave: PeriodicWave;
  private voices = new Set<Voice>();
  private lastCue: Record<string, number> = {};

  constructor(
    private ctx: AudioContext,
    master: AudioNode,
    kind: BossKind,
    private mix: () => Mix,
  ) {
    this.kind = kind;
    this.output = ctx.createGain();
    this.output.gain.value = 0;
    this.output.connect(master);
    this.musicBus = ctx.createGain();
    this.effectsBus = ctx.createGain();
    this.musicBus.connect(this.output);
    this.effectsBus.connect(this.output);
    this.room = ctx.createConvolver();
    this.roomSend = ctx.createGain();
    this.roomReturn = ctx.createGain();
    this.roomSend.gain.value = 0.22;
    this.roomReturn.gain.value = 0.5;
    this.musicBus.connect(this.roomSend);
    this.effectsBus.connect(this.roomSend);
    this.roomSend.connect(this.room);
    this.room.connect(this.roomReturn);
    this.roomReturn.connect(this.output);
    const frames = Math.floor(ctx.sampleRate * 1.65);
    const impulse = ctx.createBuffer(2, frames, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      let smooth = 0;
      for (let i = 0; i < frames; i++) {
        smooth = smooth * 0.42 + (Math.random() * 2 - 1) * 0.58;
        const early = i < ctx.sampleRate * 0.026 ? 0 : 1;
        data[i] = smooth * (1 - i / frames) ** 3.2 * early;
      }
    }
    this.room.buffer = impulse;
    this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const noise = this.noiseBuffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < noise.length; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + white * 0.045) / 1.02;
      noise[i] = white * 0.57 + brown * 1.8;
    }
    const real = new Float32Array(24);
    const imag = new Float32Array(24);
    // A vowel-like harmonic spectrum, shaped around low "ah" formants.
    for (let i = 1; i < imag.length; i++)
      imag[i] =
        (0.28 +
          Math.exp(-((i - 4) ** 2) / 6) +
          0.45 * Math.exp(-((i - 9) ** 2) / 8)) /
        i;
    this.choirWave = ctx.createPeriodicWave(real, imag);
    this.nextAt = ctx.currentTime + 0.07;
    this.stageAt = ctx.currentTime;
    this.output.gain.setTargetAtTime(1, ctx.currentTime, 0.22);
    this.refresh();
    this.timer = setInterval(() => this.schedule(), 100);
    this.schedule();
  }

  update(kind: BossKind, phase: number, stage: string) {
    if (this.stopped) return;
    if (kind !== this.kind) {
      this.kind = kind;
      this.step = 0;
      this.ending = false;
      this.lastCue = {};
      this.nextAt = this.ctx.currentTime + 0.06;
      for (const voice of [...this.voices]) this.release(voice);
    }
    if (stage !== this.stage) this.stageAt = this.ctx.currentTime;
    this.phase = clamp(Math.floor(phase), 0, 2);
    this.stage = stage;
    this.refresh();
  }

  refresh() {
    if (this.stopped) return;
    const mix = this.mix();
    const now = this.ctx.currentTime;
    const revealing = ["roundReveal", "volley", "reveal"].includes(this.stage);
    const suspense = revealing && now - this.stageAt < 3.3;
    const duck = mix.ducked || now < this.localDuckUntil;
    this.musicBus.gain.setTargetAtTime(
      mix.muted || this.ending
        ? 0
        : mix.music * (duck ? 0.24 : suspense ? 0.34 : 0.9),
      now,
      0.07,
    );
    this.effectsBus.gain.setTargetAtTime(
      mix.muted ? 0 : mix.effects * 0.72,
      now,
      0.025,
    );
  }

  private release(voice: Voice) {
    if (!this.voices.delete(voice)) return;
    for (const source of voice.sources) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // A naturally completed source can already have stopped.
      }
    }
    for (const node of voice.nodes) node.disconnect();
  }

  private capacity(bus: Bus) {
    if (this.stopped || this.ctx.state !== "running" || this.mix().muted)
      return false;
    if (bus === "music" && (this.ending || this.mix().music <= 0)) return false;
    if (bus === "effects" && this.mix().effects <= 0) return false;
    if (this.voices.size < (bus === "music" ? 28 : 48)) return true;
    if (bus === "music") return false;
    const victim = [...this.voices].find((voice) => voice.bus === "music");
    if (victim) this.release(victim);
    return this.voices.size < 48;
  }

  private remember(voice: Voice, last: AudioScheduledSourceNode) {
    this.voices.add(voice);
    last.onended = () => this.release(voice);
  }

  private note(
    at: number,
    note: number,
    duration: number,
    volume: number,
    instrument: Instrument,
    bus: Bus = "music",
    pan = 0,
    endNote?: number,
  ) {
    if (!this.capacity(bus)) return;
    const ctx = this.ctx;
    const t = Math.max(ctx.currentTime + 0.002, at);
    const envelope = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const stereo = ctx.createStereoPanner();
    const end = t + duration + 0.045;
    const attack =
      instrument === "choir" ? 0.22 : instrument === "brass" ? 0.055 : 0.008;
    const level =
      volume *
      (instrument === "brass" ? 0.6 : instrument === "strings" ? 0.52 : 1);
    envelope.gain.setValueAtTime(0.0001, t);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, level),
      t + Math.min(attack, duration * 0.3),
    );
    if (["brass", "choir", "strings"].includes(instrument))
      envelope.gain.setValueAtTime(
        Math.max(0.0002, level * 0.68),
        t + duration * 0.62,
      );
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    filter.type = "lowpass";
    filter.Q.value = instrument === "brass" ? 0.7 : 0.35;
    const brightness =
      instrument === "bell"
        ? 11000
        : instrument === "brass"
          ? 2300
          : instrument === "strings"
            ? 1500
            : instrument === "sub"
              ? 220
              : 2800;
    filter.frequency.setValueAtTime(
      instrument === "brass" ? 400 : brightness,
      t,
    );
    if (instrument === "brass") {
      filter.frequency.linearRampToValueAtTime(
        brightness + this.phase * 400,
        t + 0.09,
      );
      filter.frequency.exponentialRampToValueAtTime(420, t + duration);
    }
    stereo.pan.value = clamp(pan, -0.8, 0.8);
    filter.connect(envelope);
    envelope.connect(stereo);
    stereo.connect(bus === "music" ? this.musicBus : this.effectsBus);
    const sources: OscillatorNode[] = [];
    const nodes: AudioNode[] = [filter, envelope, stereo];
    const partials =
      instrument === "bell"
        ? [1, 2.756, 4.07]
        : instrument === "sub"
          ? [1]
          : [1, 1];
    partials.forEach((ratio, index) => {
      const osc = ctx.createOscillator();
      const partialGain = ctx.createGain();
      osc.type =
        instrument === "brass" || instrument === "strings"
          ? "sawtooth"
          : instrument === "pluck"
            ? "triangle"
            : "sine";
      if (instrument === "choir") osc.setPeriodicWave(this.choirWave);
      const f = midi(note) * ratio;
      osc.frequency.setValueAtTime(f, t);
      if (endNote !== undefined)
        osc.frequency.exponentialRampToValueAtTime(
          midi(endNote) * ratio,
          t + duration,
        );
      osc.detune.value =
        instrument === "bell" || instrument === "sub" ? 0 : index ? 5.5 : -5.5;
      const partialLevel =
        instrument === "bell" ? [0.8, 0.24, 0.12][index] : 1 / partials.length;
      partialGain.gain.setValueAtTime(partialLevel, t);
      if (instrument === "bell" && index)
        partialGain.gain.exponentialRampToValueAtTime(
          0.0001,
          t + duration * 0.44,
        );
      osc.connect(partialGain);
      partialGain.connect(filter);
      sources.push(osc);
      nodes.push(osc, partialGain);
      osc.start(t);
      osc.stop(end);
    });
    this.remember({ bus, sources, nodes, end }, sources[sources.length - 1]);
  }

  private noise(
    at: number,
    duration: number,
    volume: number,
    frequency: number,
    bus: Bus = "music",
    pan = 0,
    sweep?: number,
    rise = false,
  ) {
    if (!this.capacity(bus)) return;
    const ctx = this.ctx;
    const t = Math.max(ctx.currentTime + 0.002, at);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const envelope = ctx.createGain();
    const stereo = ctx.createStereoPanner();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    filter.type = frequency < 650 ? "lowpass" : "bandpass";
    filter.Q.value = 0.55;
    filter.frequency.setValueAtTime(frequency, t);
    if (sweep)
      filter.frequency.exponentialRampToValueAtTime(sweep, t + duration);
    envelope.gain.setValueAtTime(rise ? 0.0001 : Math.max(volume, 0.0001), t);
    if (rise)
      envelope.gain.exponentialRampToValueAtTime(
        Math.max(volume, 0.0002),
        t + duration * 0.82,
      );
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    stereo.pan.value = clamp(pan, -0.8, 0.8);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(stereo);
    stereo.connect(bus === "music" ? this.musicBus : this.effectsBus);
    source.start(t, Math.random() * 1.4);
    source.stop(t + duration + 0.025);
    this.remember(
      {
        bus,
        sources: [source],
        nodes: [source, filter, envelope, stereo],
        end: t + duration + 0.025,
      },
      source,
    );
  }

  private drum(
    at: number,
    weight: number,
    bus: Bus = "music",
    pan = 0,
    kind = "deep",
  ) {
    if (kind === "rim") {
      this.note(at, 54, 0.085, weight * 0.32, "pluck", bus, pan, 42);
      this.noise(at, 0.055, weight * 0.21, 2450, bus, pan);
    } else {
      this.note(
        at,
        kind === "timpani" ? 43 : 34,
        0.48,
        weight * 0.6,
        "sub",
        bus,
        pan,
        kind === "timpani" ? 35 : 25,
      );
      this.note(at, 46, 0.19, weight * 0.17, "pluck", bus, pan, 32);
      this.noise(at, 0.2, weight * 0.28, 780, bus, pan, 170);
    }
  }

  private schedule() {
    if (this.stopped) return;
    const now = this.ctx.currentTime;
    this.refresh();
    // Never replay a backlog after a suspended tab/context or a busy frame.
    if (
      this.ctx.state !== "running" ||
      (typeof document !== "undefined" && document.hidden)
    ) {
      this.nextAt = now + 0.08;
      return;
    }
    if (this.nextAt < now - 0.12) this.nextAt = now + 0.025;
    if (this.ending) return;
    const bpm =
      (this.kind === "colossus" ? 84 : this.kind === "kraken" ? 94 : 108) +
      this.phase * 8;
    const eighth = 60 / bpm / (this.kind === "kraken" ? 3 : 2);
    while (this.nextAt < now + 0.22) {
      if (this.kind === "colossus")
        this.colossus(this.nextAt, this.step, eighth);
      if (this.kind === "kraken") this.kraken(this.nextAt, this.step, eighth);
      if (this.kind === "dragon") this.dragon(this.nextAt, this.step, eighth);
      this.step++;
      this.nextAt += eighth;
    }
  }

  // Slow asymmetrical stone drums, D-minor low horns and an answering rune motif.
  private colossus(t: number, step: number, e: number) {
    const p = step % 16;
    const phrase = Math.floor(step / 16);
    const variation = bossMusicVariant("colossus", step);
    const score = bossMusicVariants.colossus[variation];
    const root = score.roots[phrase % 4];
    const intensity = 0.8 + this.phase * 0.18;
    if (score.drums.includes(p))
      this.drum(
        t,
        (p % 8 === 0 ? 0.85 : 0.44) * intensity,
        "music",
        p % 4 ? 0.3 : -0.3,
      );
    if (p === 0 || p === 8) {
      this.note(t, root, e * 6.8, 0.31, variation===1?"strings":"brass", "music", -0.18);
      this.note(t + 0.035, root + 7, e * 5.8, 0.16, "brass", "music", 0.2);
      if (p === 0)
        [12, 15, 19].forEach((n, i) =>
          this.note(
            t,
            root + n,
            e * 13,
            0.065 + this.phase * 0.015,
            "choir",
            "music",
            (i - 1) * 0.45,
          ),
        );
    }
    if ([2, 5, 10, 13].includes(p)) {
      const motif = score.melody[[2, 5, 10, 13].indexOf(p)];
      this.note(
        t,
        root + motif,
        e * 2.6,
        0.16,
        variation===2?"pluck":"bell",
        "music",
        p < 8 ? -0.5 : 0.5,
      );
    }
    if (this.phase > 0 && p % 2 === 0)
      this.note(
        t,
        root + (p % 4 ? 19 : 12),
        e * 0.78,
        0.13,
        "strings",
        "music",
        -0.4,
      );
    if (this.phase === 2 && p % 2) this.drum(t, 0.25, "music", 0.5, "rim");
    if (p === 15) this.noise(t, e * 1.1, 0.09, 600, "music", 0, 3500, true);
  }

  // A swaying compound-meter sea score: low bows, answering horns and storm wash.
  private kraken(t: number, step: number, e: number) {
    const p = step % 12;
    const phrase = Math.floor(step / 12);
    const variation = bossMusicVariant("kraken", step);
    const score = bossMusicVariants.kraken[variation];
    const root = score.roots[phrase % 4];
    if (p % 3 === 0)
      this.drum(
        t,
        p % 6 === 0 ? 0.72 : 0.36,
        "music",
        p < 6 ? -0.4 : 0.4,
        "timpani",
      );
    if ([2, 5, 8, 10, 11].includes(p))
      this.noise(
        t,
        0.09,
        0.07 + this.phase * 0.025,
        2600,
        "music",
        p % 2 ? 0.5 : -0.5,
      );
    const pattern = score.melody;
    this.note(
      t,
      root + pattern[p],
      e * 0.92,
      0.115 + this.phase * 0.025,
      variation===1?"pluck":"strings",
      "music",
      p % 2 ? -0.35 : 0.35,
    );
    if (p === 0 || p === 6) {
      this.note(t, root - 12, e * 5.8, 0.26, "sub");
      this.note(
        t,
        root + (p === 0 ? 12 : 7),
        e * 4.9,
        0.23,
        variation===2?"choir":"brass",
        "music",
        p === 0 ? -0.25 : 0.25,
      );
    }
    if (p === 0) {
      this.noise(t, e * 11, 0.095, 1100, "music", -0.6, 3000, true);
      if (this.phase > 0)
        [12, 19].forEach((n, i) =>
          this.note(
            t,
            root + n,
            e * 10.4,
            0.08,
            "choir",
            "music",
            i ? 0.45 : -0.45,
          ),
        );
    }
    if (this.phase === 2 && [4, 5, 10, 11].includes(p))
      this.drum(t, 0.3, "music", 0.2, "rim");
  }

  // A dangerous treasure waltz, with pizzicato bass and irregular golden bells.
  private dragon(t: number, step: number, e: number) {
    const p = step % 12;
    const phrase = Math.floor(step / 12);
    const variation = bossMusicVariant("dragon", step);
    const score = bossMusicVariants.dragon[variation];
    const root = score.roots[phrase % 4];
    if (p % 6 === 0) {
      this.note(t, root - 12, e * 3.9, 0.32, "pluck", "music", -0.15);
      this.drum(t, 0.48 + this.phase * 0.17, "music", 0.15, "timpani");
    }
    if ([2, 4, 8, 10].includes(p)) {
      [7, 12, 15].forEach((n, i) =>
        this.note(
          t + i * 0.012,
          root + n,
          e * 0.78,
          0.065,
          variation===1?"strings":"pluck",
          "music",
          (i - 1) * 0.4,
        ),
      );
      this.noise(t, 0.06, 0.035, 5200, "music", 0.4);
    }
    const motif: Record<number, number> = Object.fromEntries(
      [0,3,5,6,8,10,11].map((position,i)=>[position,score.melody[i]]),
    );
    if (motif[p] !== undefined)
      this.note(
        t,
        root + motif[p],
        e * 2.8,
        0.14,
        variation===2?"pluck":"bell",
        "music",
        p % 2 ? 0.4 : -0.4,
      );
    if (p === 0) {
      [0, 7, 15].forEach((n, i) =>
        this.note(
          t,
          root + n,
          e * 10,
          0.065 + this.phase * 0.022,
          this.phase > 0 ? "brass" : "choir",
          "music",
          (i - 1) * 0.35,
        ),
      );
      if (this.phase === 2) this.note(t, root + 19, e * 10, 0.1, "choir");
    }
    if (this.phase > 0 && p % 2)
      this.note(
        t,
        root + [12, 15, 19][p % 3],
        e * 0.7,
        0.07 + this.phase * 0.02,
        "strings",
        "music",
        -0.4,
      );
  }

  cue(kind: BossKind, cue: string, strength = 1) {
    if (this.stopped || kind !== this.kind || this.ctx.state !== "running")
      return;
    const t = this.ctx.currentTime + 0.018;
    const throttle = cue === "coin" || cue === "impact" ? 0.065 : 0.16;
    if (t - (this.lastCue[cue] ?? -100) < throttle) return;
    this.lastCue[cue] = t;
    const power = clamp(strength, 0.15, 1.6);
    const root = kind === "colossus" ? 38 : kind === "kraken" ? 40 : 45;
    const note = (
      delay: number,
      pitch: number,
      length: number,
      gain: number,
      voice: Instrument,
      pan = 0,
      slide?: number,
    ) =>
      this.note(
        t + delay,
        pitch,
        length,
        gain * power,
        voice,
        "effects",
        pan,
        slide,
      );
    const noise = (
      delay: number,
      length: number,
      gain: number,
      hz: number,
      pan = 0,
      sweep?: number,
      rise = false,
    ) =>
      this.noise(
        t + delay,
        length,
        gain * power,
        hz,
        "effects",
        pan,
        sweep,
        rise,
      );

    if (
      ["intro", "break", "price", "victory", "retreat", "suspense"].includes(
        cue,
      )
    )
      this.localDuckUntil =
        t + (cue === "intro" ? 2.2 : cue === "victory" ? 4 : 1.2);

    if (cue === "suspense") {
      noise(0, 0.9, 0.18, 450, 0, 4200, true);
      note(0, root - 12, 0.9, 0.16, "sub", 0, root - 13);
      note(0.28, root + 19, 0.62, 0.055, "strings", 0.45, root + 20);
    } else if (cue === "intro") {
      if (kind === "colossus") {
        noise(0, 1.4, 0.45, 280, -0.2, 800);
        this.drum(t + 0.45, 0.9, "effects", -0.2);
        note(0.4, root - 12, 1.9, 0.5, "brass");
        [12, 19, 24].forEach((n, i) =>
          note(0.95 + i * 0.22, root + n, 1.1, 0.16, "bell", (i - 1) * 0.4),
        );
        [0, 3, 7].forEach((n, i) =>
          note(0.8, root + n, 2, 0.14, "choir", (i - 1) * 0.4),
        );
      } else if (kind === "kraken") {
        noise(0, 2, 0.35, 700, -0.65, 3000, true);
        noise(0.25, 1.8, 0.27, 1400, 0.65, 420);
        note(0.4, 28, 1.6, 0.45, "brass", 0, 22);
        [0, 7, 12].forEach((n, i) =>
          note(0.8 + i * 0.18, root + n, 1.4, 0.2, "brass", (i - 1) * 0.25),
        );
        this.drum(t + 1.15, 0.95, "effects", 0, "timpani");
      } else {
        noise(0.2, 1.4, 0.35, 260, 0, 1300, true);
        note(0.35, 33, 1.45, 0.4, "brass", 0, 25);
        [24, 31, 27, 36, 34, 39].forEach((n, i) =>
          note(i * 0.14, root + n, 1.1, 0.17, "bell", ((i % 3) - 1) * 0.6),
        );
        [0, 3, 7].forEach((n, i) =>
          note(1, root + n, 1.6, 0.15, "choir", (i - 1) * 0.4),
        );
      }
    } else if (cue === "roll") {
      [0, 0.07, 0.17, 0.3, 0.47, 0.66].forEach((d, i) => {
        const pan = ((i % 3) - 1) * 0.5;
        noise(d, 0.095, 0.22 - i * 0.015, 750 + i * 220, pan);
        note(
          d,
          47 + ((i * 7) % 12),
          0.115,
          0.19 - i * 0.016,
          "pluck",
          pan,
          38 + i,
        );
      });
    } else if (cue === "hold") {
      note(0, root + 31, 0.5, 0.22, "bell", 0.15);
      note(0, root + 12, 0.12, 0.12, "pluck");
      noise(0, 0.035, 0.07, 1900);
    } else if (cue === "charge") {
      if (kind === "kraken") {
        noise(0, 0.7, 0.25, 400, -0.1, 1900, true);
        note(0, 37, 0.7, 0.24, "strings", 0, 49);
        [0, 0.17, 0.34].forEach((d, i) =>
          note(d, 49 + i * 3, 0.16, 0.09, "pluck", i % 2 ? 0.25 : -0.25),
        );
      } else {
        noise(0, 0.6, 0.18, 250, 0, 3100, true);
        note(0, root, 0.6, 0.2, "choir", 0, root + 12);
        note(0.15, root + 19, 0.45, 0.13, "bell");
      }
    } else if (cue === "fire") {
      if (kind === "kraken") {
        noise(0, 0.14, 0.62, 2900, -0.1, 600);
        noise(0.035, 0.8, 0.45, 430, 0.2, 80);
        note(0, 43, 0.7, 0.7, "sub", 0, 20);
        note(0.08, 39, 0.28, 0.22, "brass", -0.3, 24);
        noise(0.15, 0.32, 0.17, 1300, 0.25, 250);
      } else if (kind === "colossus") {
        noise(0, 0.42, 0.29, 900, -0.25, 4300, true);
        note(0, root + 7, 0.36, 0.28, "brass", 0, root + 19);
        note(0.25, root + 24, 0.55, 0.24, "bell", 0.3);
      } else {
        [0, 0.06, 0.12, 0.2].forEach((d, i) =>
          note(d, root + 19 + i * 5, 0.34, 0.15, "bell", (i - 1.5) * 0.35),
        );
        noise(0, 0.5, 0.24, 600, 0, 4500, true);
      }
    } else if(cue==='splash'&&kind==='kraken'){
      noise(0,.38,.3,1500,-.25,350);
      noise(.08,.5,.18,380,.3,1800);
    } else if (cue === "impact" || cue === "perfect") {
      note(0, 37, 0.48, 0.48, "sub", 0, 24);
      if (kind === "colossus") {
        noise(0, 0.32, 0.42, 600, -0.2, 130);
        [0.04, 0.13, 0.24].forEach((d, i) => {
          noise(d, 0.11, 0.16, 1900 + i * 400, (i - 1) * 0.55);
          note(d, 54 - i * 5, 0.12, 0.11, "pluck", (i - 1) * 0.4);
        });
      } else if (kind === "kraken") {
        noise(0, 0.57, 0.4, 1700, -0.45, 450);
        noise(0.12, 0.46, 0.27, 3000, 0.45, 800);
        note(0.04, 31, 0.34, 0.2, "brass", 0, 23);
      } else {
        noise(0, 0.24, 0.22, 2900);
        [12, 19, 24].forEach((n, i) =>
          note(i * 0.045, root + n, 0.54, 0.2, "bell", (i - 1) * 0.55),
        );
      }
      if (cue === "perfect" || strength > 0.95) {
        note(0.04, root + 12, 0.56, 0.19, "brass", -0.2);
        note(0.04, root + 19, 0.56, 0.12, "choir", 0.2);
      }
    } else if (cue === "break") {
      note(0, 34, 1.3, 0.67, "sub", 0, 18);
      noise(0, 0.85, 0.6, kind === "kraken" ? 1500 : 700, 0, 130);
      if (kind === "colossus") {
        [0.06, 0.2, 0.37, 0.58, 0.8].forEach((d, i) => {
          noise(d, 0.22, 0.26, 1100 + i * 280, ((i % 3) - 1) * 0.7);
          note(d, 54 - i * 4, 0.18, 0.17, "pluck", ((i % 3) - 1) * 0.6, 28);
        });
      } else if (kind === "kraken") {
        note(0.12, 32, 1.2, 0.4, "brass", -0.2, 21);
        noise(0.35, 1.1, 0.42, 3600, 0.6, 500);
      } else {
        note(0.1, 38, 1.15, 0.38, "brass", 0, 27);
        [24, 27, 31, 36, 39, 43].forEach((n, i) =>
          note(
            0.3 + i * 0.085,
            root + n,
            0.7,
            0.15,
            "bell",
            ((i % 3) - 1) * 0.65,
          ),
        );
      }
      [0, 7, 12].forEach((n, i) =>
        note(0.6, root + n, 1.5, 0.19, "brass", (i - 1) * 0.4),
      );
      noise(0.55, 1.1, 0.2, 3900);
    } else if (cue === "price") {
      noise(0, 0.12, 0.2, 900);
      note(0, root, 0.68, 0.32, "pluck");
      [24, 31, 36, 40].forEach((n, i) =>
        note(i * 0.075, root + n, 0.85, 0.24, "bell", (i - 1.5) * 0.25),
      );
      note(0.28, root + 12, 0.85, 0.16, "brass", -0.15);
    } else if (cue === "coin") {
      const variation = Math.floor(t * 19) % 4;
      [0, 0.052, 0.127].forEach((d, i) => {
        note(
          d,
          root + [31, 36, 43, 38][(variation + i) % 4],
          0.27,
          0.15,
          "bell",
          (i - 1) * 0.55,
        );
        noise(d, 0.021, 0.075, 6900, (i - 1) * 0.5);
      });
    } else if (cue === "victory") {
      this.ending = true;
      this.localDuckUntil = t + 6;
      const major =
        kind === "colossus"
          ? [0, 7, 12, 16, 19, 24]
          : kind === "kraken"
            ? [0, 7, 12, 14, 16, 19, 24]
            : [12, 16, 19, 24, 28, 31, 36];
      const pace = kind === "colossus" ? 0.29 : kind === "kraken" ? 0.2 : 0.145;
      major.forEach((n, i) => {
        note(
          0.2 + i * pace,
          root + n,
          1.3,
          0.29,
          kind === "dragon" ? "bell" : "brass",
          ((i % 3) - 1) * 0.3,
        );
        if (i % 2 === 0)
          this.drum(
            t + 0.2 + i * pace,
            0.6,
            "effects",
            0,
            kind === "kraken" ? "timpani" : "deep",
          );
      });
      const finish = major.length * pace + 0.08;
      [0, 4, 7, 12].forEach((n, i) => {
        note(finish, root + n, 2.65, 0.2, "brass", (i - 1.5) * 0.25);
        note(
          finish + 0.05,
          root + n + 12,
          2.8,
          0.085,
          "choir",
          (i - 1.5) * 0.4,
        );
      });
      note(finish, root - 12, 2.4, 0.38, "sub");
      noise(finish, 1.6, 0.26, 5200);
      if (kind === "dragon")
        [0, 0.2, 0.45, 0.73, 1.1].forEach((d, i) =>
          note(
            finish + d,
            root + 36 + [0, 7, 4, 12, 7][i],
            0.8,
            0.13,
            "bell",
            ((i % 3) - 1) * 0.65,
          ),
        );
    } else if (cue === "retreat") {
      this.ending = true;
      [12, 10, 7, 0].forEach((n, i) =>
        note(i * 0.26, root + n, 1.2, 0.19, "brass", (i % 2 ? 1 : -1) * 0.2),
      );
      [0, 3, 7].forEach((n, i) =>
        note(0.8, root + n, 2, 0.09, "choir", (i - 1) * 0.35),
      );
      noise(0.3, 1.6, 0.18, kind === "kraken" ? 1700 : 450, 0, 170);
    }
    this.refresh();
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.output.gain.cancelScheduledValues(this.ctx.currentTime);
    this.output.gain.setTargetAtTime(0, this.ctx.currentTime, 0.075);
    // Fade before disconnecting, including queued cue voices and the reverb tail.
    setTimeout(() => {
      for (const voice of [...this.voices]) this.release(voice);
      [
        this.musicBus,
        this.effectsBus,
        this.roomSend,
        this.room,
        this.roomReturn,
        this.output,
      ].forEach((node) => node.disconnect());
      this.room.buffer = null;
    }, 420);
  }
}
