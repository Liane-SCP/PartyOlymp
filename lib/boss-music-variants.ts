import type { BossKind } from "./boss-audio";
export const bossMusicVariants = {
  colossus: [
    { roots:[38,34,41,36], melody:[12,19,15,14], drums:[0,6,8,11,14] },
    { roots:[38,41,43,34], melody:[19,22,17,15], drums:[0,3,8,10,14] },
    { roots:[38,36,34,45], melody:[24,19,22,17], drums:[0,4,6,8,12,15] },
  ],
  kraken: [
    { roots:[40,36,43,35], melody:[0,7,12,3,7,12,0,7,15,3,14,12] },
    { roots:[40,43,38,36], melody:[12,7,3,14,12,7,15,12,7,14,10,7] },
    { roots:[40,35,36,43], melody:[0,3,7,12,15,14,12,7,3,10,7,2] },
  ],
  dragon: [
    { roots:[45,41,38,40], melody:[24,19,22,27,26,24,23] },
    { roots:[45,43,41,38], melody:[19,24,27,22,31,27,26] },
    { roots:[45,38,41,47], melody:[27,26,24,31,29,22,24] },
  ],
};
export function bossMusicVariant(kind: BossKind, step: number) {
  return Math.floor(Math.max(0,step)/((kind==="colossus"?16:12)*8))%3;
}
