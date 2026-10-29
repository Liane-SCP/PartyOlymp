// Original cartoon vocal performances: pitch, vowel, rhythm and foley are authored
// per reaction. No external recordings, speech service or network request.
type Syllable = [
  pitch: number,
  seconds: number,
  vowel: number,
  endPitch?: number,
];
const vowels = [
  [730, 1090, 2440],
  [300, 870, 2240],
  [270, 2290, 3010],
  [530, 1840, 2480],
  [570, 840, 2410],
];
export const emoteVoices: Syllable[][] = [
  [
    [155, 0.16, 0, 125],
    [190, 0.17, 0, 145],
    [165, 0.18, 0, 120],
    [210, 0.28, 0, 130],
  ],
  [
    [260, 0.35, 4, 185],
    [225, 0.5, 0, 125],
  ],
  [
    [100, 0.25, 1, 85],
    [125, 0.42, 0, 70],
  ],
  [
    [170, 0.18, 1, 230],
    [280, 0.55, 4, 145],
  ],
  [
    [160, 0.2, 1, 230],
    [260, 0.65, 0, 340],
  ],
  [
    [210, 0.16, 2, 280],
    [250, 0.22, 2, 175],
  ],
  [
    [165, 0.16, 4, 130],
    [130, 0.5, 0, 75],
  ],
  [[210, 0.7, 1, 90]],
  [
    [225, 0.28, 4, 180],
    [180, 0.55, 4, 90],
  ],
  [
    [160, 0.19, 0, 185],
    [190, 0.22, 0, 210],
    [230, 0.25, 0, 250],
  ],
  [
    [165, 0.24, 2, 190],
    [215, 0.36, 2, 255],
  ],
  [
    [130, 0.25, 4, 160],
    [180, 0.32, 0, 200],
    [220, 0.4, 0, 240],
  ],
  [[320, 0.15, 1, 500]],
  [
    [155, 0.18, 0, 190],
    [210, 0.22, 0, 260],
    [280, 0.35, 2, 320],
  ],
  [
    [150, 0.13, 0, 120],
    [180, 0.14, 0, 130],
    [170, 0.24, 0, 110],
  ],
  [[140, 0.33, 1, 100]],
  [
    [170, 0.25, 3, 160],
    [150, 0.35, 3, 125],
  ],
  [
    [160, 0.16, 1, 230],
    [260, 0.4, 0, 310],
  ],
  [[120, 0.65, 0, 52]],
  [
    [135, 0.2, 0, 180],
    [190, 0.55, 0, 250],
  ],
  [[190, 0.25, 1, 270]],
  [
    [185, 0.16, 4, 155],
    [200, 0.17, 4, 160],
    [220, 0.25, 4, 150],
  ],
  [[150, 0.48, 2, 95]],
  [
    [260, 0.13, 1, 310],
    [240, 0.33, 1, 100],
  ],
  [
    [220, 0.25, 0, 260],
    [270, 0.36, 1, 310],
  ],
  [
    [145, 0.16, 1, 200],
    [230, 0.6, 1, 430],
  ],
  [
    [115, 0.22, 3, 90],
    [130, 0.35, 3, 75],
  ],
  [
    [210, 0.15, 0, 160],
    [245, 0.16, 0, 180],
    [260, 0.22, 0, 150],
  ],
  [
    [90, 0.55, 1, 125],
    [100, 0.45, 0, 65],
  ],
  [
    [120, 0.2, 1, 170],
    [200, 0.22, 0, 260],
    [320, 0.45, 0, 390],
  ],
  [
    [180, 0.18, 3, 210],
    [230, 0.28, 0, 270],
  ],
  [
    [210, 0.18, 1, 260],
    [300, 0.45, 0, 370],
  ],
  [
    [270, 0.1, 2, 220],
    [310, 0.12, 2, 235],
    [290, 0.13, 2, 215],
    [340, 0.27, 2, 200],
  ],
  [
    [120, 0.2, 1, 145],
    [155, 0.23, 0, 85],
  ],
  [[130, 0.55, 1, 190]],
  [
    [235, 0.22, 2, 265],
    [260, 0.25, 2, 300],
    [280, 0.4, 2, 190],
  ],
  [
    [150, 0.15, 4, 230],
    [270, 0.16, 4, 350],
    [380, 0.35, 0, 190],
  ],
  [
    [165, 0.16, 0, 210],
    [240, 0.14, 2, 195],
    [180, 0.16, 0, 240],
    [275, 0.27, 2, 310],
  ],
  [
    [280, 0.45, 2, 210],
    [245, 0.5, 2, 160],
  ],
  [
    [150, 0.25, 1, 200],
    [130, 0.5, 0, 90],
  ],
  [
    [225, 0.23, 1, 170],
    [180, 0.3, 1, 120],
  ],
  [
    [210, 0.17, 1, 290],
    [320, 0.4, 0, 400],
  ],
  [
    [125, 0.2, 3, 145],
    [155, 0.38, 0, 95],
  ],
  [
    [320, 0.38, 4, 200],
    [300, 0.5, 0, 140],
    [240, 0.4, 4, 120],
  ],
  [
    [100, 0.18, 1, 150],
    [165, 0.5, 0, 220],
  ],
  [
    [180, 0.2, 1, 330],
    [390, 0.25, 2, 240],
    [270, 0.38, 4, 125],
  ],
  [
    [140, 0.18, 4, 165],
    [175, 0.2, 4, 200],
    [205, 0.35, 0, 230],
  ],
  [
    [160, 0.15, 4, 90],
    [105, 0.65, 0, 45],
  ],
];

export function playEmoteVoice(
  ctx: AudioContext,
  output: AudioNode,
  id: number,
  volume: number,
) {
  const score = emoteVoices[id];
  if (!score || volume <= 0) return;
  let delay = 0.08;
  score.forEach(([pitch, duration, vowel, endPitch]) => {
    const t = ctx.currentTime + delay,
      osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(
      pitch * 1.09,
      t + duration * 0.22,
    );
    osc.frequency.exponentialRampToValueAtTime(
      endPitch ?? pitch * 0.8,
      t + duration,
    );
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume * 0.8, t + 0.018);
    gain.gain.setValueAtTime(volume * 0.62, t + duration * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    const formants = vowels[vowel].map((f, i) => {
      const filter = ctx.createBiquadFilter(),
        mix = ctx.createGain();
      filter.type = "bandpass";
      filter.Q.value = i === 0 ? 4 : 7;
      filter.frequency.setValueAtTime(f * (id === 32 ? 1.18 : 1), t);
      filter.frequency.linearRampToValueAtTime(f * 0.87, t + duration);
      mix.gain.value = [1, 0.48, 0.16][i];
      osc.connect(filter);
      filter.connect(mix);
      mix.connect(gain);
      return { filter, mix };
    });
    const vibrato = ctx.createOscillator(),
      depth = ctx.createGain();
    vibrato.frequency.value = [1, 8, 38, 43].includes(id) ? 8 : 5.5;
    depth.gain.value = pitch * ([1, 8, 38, 43].includes(id) ? 0.045 : 0.012);
    vibrato.connect(depth);
    depth.connect(osc.frequency);
    gain.connect(output);
    osc.start(t);
    vibrato.start(t);
    osc.stop(t + duration + 0.03);
    vibrato.stop(t + duration + 0.03);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      vibrato.disconnect();
      depth.disconnect();
      formants.forEach(({ filter, mix }) => {
        filter.disconnect();
        mix.disconnect();
      });
    };
    delay += duration + ([0, 14, 27, 32].includes(id) ? 0.065 : 0.08);
  });
  return delay;
}
