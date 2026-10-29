/** Original scores: every mode has its own key, groove and three musical sections. */
export type MusicInstrument = "keys" | "pluck" | "bell" | "chip" | "reed" | "strings" | "pad" | "bass";
type Style = "lounge" | "arcade" | "discovery" | "mystery" | "party" | "pulse" | "dream" | "fanfare";
export interface MusicProfile {
  title: string; bpm: number; root: number; style: Style; lead: MusicInstrument;
  scale: number[]; chords: number[][]; melodies: number[][]; rhythm: number[]; drums: number[];
  ambient?: boolean;
}
const themes: Record<Style, number[][]> = {
  lounge: [[0,-1,2,4,-1,3,2,-1,1,-1,3,5,4,-1,2,-1],[4,3,-1,2,0,-1,1,3,2,-1,5,4,-1,3,1,-1],[0,2,-1,4,6,-1,5,4,3,1,-1,2,4,-1,1,0]],
  arcade: [[0,4,7,-1,5,4,2,4,1,5,8,-1,7,5,4,2],[7,-1,6,4,5,2,4,-1,5,7,9,7,5,-1,4,2],[0,2,4,7,9,7,4,-1,2,4,5,8,7,5,2,-1]],
  discovery: [[0,-1,2,4,2,-1,1,0,4,-1,5,7,5,4,-1,2],[4,5,-1,7,8,7,5,-1,2,4,5,-1,4,2,1,-1],[0,3,4,-1,7,5,4,2,1,-1,2,5,4,2,-1,0]],
  mystery: [[0,-1,-1,4,3,-1,2,-1,1,-1,4,-1,3,2,-1,-1],[4,-1,5,-1,3,-1,1,2,0,-1,-1,3,4,-1,2,-1],[0,-1,3,4,-1,6,5,-1,4,-1,2,1,-1,3,2,-1]],
  party: [[0,2,-1,4,4,-1,5,4,2,-1,1,2,4,2,-1,0],[4,-1,5,7,5,4,-1,2,3,4,-1,5,4,2,1,-1],[7,5,4,-1,2,4,5,-1,4,2,0,2,-1,4,2,0]],
  pulse: [[0,-1,0,2,-1,4,3,-1,2,-1,4,5,4,-1,2,1],[4,2,-1,0,2,-1,5,4,3,-1,2,4,-1,5,3,2],[0,0,-1,3,4,-1,2,0,5,-1,4,3,2,-1,1,0]],
  dream: [[0,-1,-1,4,-1,-1,2,-1,1,-1,-1,5,-1,3,-1,-1],[4,-1,-1,7,-1,5,-1,-1,2,-1,4,-1,-1,1,-1,-1],[0,-1,2,-1,-1,5,-1,-1,4,-1,-1,3,-1,1,-1,-1]],
  fanfare: [[0,-1,0,4,7,-1,7,5,4,-1,2,4,5,4,2,-1],[4,5,7,-1,9,7,5,4,2,-1,4,7,5,4,-1,2],[7,-1,7,9,11,9,7,5,4,5,7,-1,5,4,2,0]],
};
const major=[0,2,4,5,7,9,11],minor=[0,2,3,5,7,8,10],pentatonic=[0,2,4,7,9];
function profile(title: string, bpm: number, root: number, style: Style, lead: MusicInstrument,
  scale=major, identity=0, ambient=false): MusicProfile {
  return {title,bpm,root,style,lead,scale,ambient,
    chords: [[0,3,4,1],[0,5,3,4],[0,2,5,4]],
    melodies: themes[style].map((melody,variant)=>melody.map((note,i)=>note<0?-1:note+((i+identity+variant)%7===0?1:0))),
    rhythm: style==="lounge"?[0,3,6]:style==="discovery"?[0,2,5,7]:style==="mystery"?[0,5]:[0,2,4,6],
    drums: style==="dream"||ambient?[]:style==="lounge"?[0,3,4,7]:style==="discovery"?[0,3,5]:[0,2,4,6],
  };
}
export const musicProfiles: Record<string, MusicProfile> = {
  wheel: profile("Das Schicksalsrad",124,46,"fanfare","strings",minor,23),
  lobby: profile("Vorfreude",94,48,"lounge","keys",major,1),
  podium: profile("Auf dem Olymp",112,48,"fanfare","reed",major,2),
  standings: profile("Das Blatt wendet sich",92,50,"discovery","keys",major,3),
  reveal: profile("Der große Moment",80,45,"mystery","bell",minor,4),
  code: profile("Geheime Frequenzen",98,45,"mystery","pluck",minor,0),
  auction: profile("Unter dem Hammer",116,48,"lounge","keys",major,2),
  timing: profile("Schwebende Sekunden",64,50,"dream","pad",pentatonic,3,true),
  bomb: profile("Die Lunte brennt",128,40,"pulse","strings",minor,4),
  chain: profile("Gedankensprung",106,52,"party","pluck",major,5),
  categories: profile("Tintenfieber",102,53,"lounge","reed",major,6),
  geo: profile("Weiter Horizont",96,55,"discovery","bell",pentatonic,7),
  typer: profile("Tastenrausch",124,47,"arcade","chip",minor,8),
  herd: profile("Mit der Herde",108,48,"party","reed",pentatonic,9),
  spectrum: profile("Zwischen den Zeilen",88,51,"dream","bell",major,10),
  dice: profile("Glück im Becher",104,50,"lounge","pluck",major,11),
  wiki: profile("Von Link zu Link",118,52,"discovery","pluck",major,12),
  picture: profile("Pixel im Neonlicht",114,48,"arcade","chip",major,13),
  budget: profile("Schaufensterbummel",110,53,"party","keys",major,14),
  blackjack: profile("Mitternacht im Casino",86,46,"lounge","keys",minor,15),
  cards: profile("Farben auf dem Tisch",122,55,"party","pluck",major,16),
  color: profile("Licht und Farbe",78,57,"dream","bell",pentatonic,17),
  size: profile("Eine Frage der Größe",90,49,"mystery","keys",major,18),
};
export const musicVariant = (step: number) => Math.floor(Math.max(0,step)/128)%3;
export function musicKey(phase: string, game?: string): string | null {
  if(phase==="playing"||phase==="rules") return game && musicProfiles[game] ? game : null;
  if(phase==="countdown"||phase==='travel') return "lobby";
  return musicProfiles[phase] ? phase : null;
}
export interface MusicNote { note: number; duration: number; level: number; instrument: MusicInstrument; pan: number; }
function scaleNote(profile: MusicProfile, degree: number) {
  const n=profile.scale.length;
  return profile.root+profile.scale[((degree%n)+n)%n]+12*Math.floor(degree/n);
}
/** A pure score planner allows all sections to be tested and rendered offline. */
export function musicStep(profile: MusicProfile, step: number): MusicNote[] {
  const variant=musicVariant(step),bar=Math.floor(step/8),beat=step%8;
  const chord=profile.chords[variant][Math.floor(bar/2)%4];
  const eighth=30/profile.bpm;
  const notes: MusicNote[]=[];
  const add=(degree:number,duration:number,level:number,instrument:MusicInstrument,pan=0)=>
    notes.push({note:scaleNote(profile,degree),duration,level,instrument,pan});
  // Free, uneven pads for Zeitgefühl: no metronome, melody pulse or percussion.
  if(profile.ambient) {
    if(step%37===0) for(const [i,n] of [0,2,4].entries()) add(chord+n+variant,9,0.035,"pad",(i-1)*0.45);
    if(step%53===17) add(chord+6+variant,6,0.025,"pad",0.25);
    return notes;
  }
  if(beat===0) {
    for(const [i,n] of [0,2,4].entries()) add(chord+n, eighth*7.2,0.026,"pad",(i-1)*0.5);
    add(chord-profile.scale.length,eighth*2.2,0.13,"bass");
  }
  if(beat===4) add(chord-profile.scale.length+(variant===2?4:0),eighth*2,0.1,"bass");
  const melodic=profile.melodies[variant][step%16];
  if(melodic>=0) add(chord+melodic+profile.scale.length,eighth*(profile.lead==="bell"?2.1:0.9),0.12,profile.lead,Math.sin(step*0.7)*0.3);
  if(profile.rhythm.includes(beat)) add(chord+[2,4,6][(bar+beat+variant)%3],eighth*0.65,0.05,
    variant===1?"keys":variant===2?"bell":"pluck",beat<4?-0.4:0.4);
  if(variant===2&&beat===7) add(chord+2+profile.scale.length,eighth*1.5,0.06,"strings",-0.25);
  return notes;
}
