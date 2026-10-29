export type GameId =
  | "colossus"
  | "kraken"
  | "dragon"
  | "code"
  | "auction"
  | "timing"
  | "bomb"
  | "chain"
  | "categories"
  | "dice"
  | "wiki"
  | "picture"
  | "budget"
  | "blackjack"
  | "cards"
  | "fleet"
  | "color"
  | "size"
  | "typer"
  | "herd"
  | "spectrum"
  | "blocks"
  | "geo";
export type Phase =
  | "lobby"
  | "travel"
  | "wheel"
  | "rules"
  | "countdown"
  | "playing"
  | "reveal"
  | "standings"
  | "paused"
  | "podium";
export interface Selection {
  id: GameId;
  rounds: number;
  seconds: number;
}
export interface Player {
  kicked?: boolean;
  id: string;
  token: string;
  name: string;
  avatar: number;
  look?: {
    shape: number;
    accessory: number;
    color: number;
    detail?: number;
    accent?: number;
  };
  color: string;
  ready: boolean;
  spectator: boolean;
  lastSeen: number;
  points: number;
  wins: number;
  seconds: number;
  lastPoints: number;
  previousRank: number;
}
export interface Result {
  id: string;
  raw: number;
  valid: boolean;
  detail: unknown;
  rank?: number;
  points?: number;
}
export interface GameState {
  id: GameId;
  round: number;
  totalRounds: number;
  deadline: number;
  stage: string;
  public: Record<string, any>;
  secret: Record<string, any>;
  players: Record<string, any>;
  scores: Record<string, number>;
  results: Result[];
  events: { id: string; type: string; player?: string; round?: number; at?: number }[];
}
export interface Room {
  rematch?: {startedAt:number;seats:string[];responses:Record<string,'play'|'watch'>;champions:{id:string;name:string;points:number}[]};
  journey?: import("./journey").Journey;
  personalBests?: import("./gameshow").PersonalBests;
  wheelEnabled?: boolean;
  draw?: import("./wheel").WheelDraw;
  rulesVersion?: number;
  code: string;
  host: string;
  players: Player[];
  selection: Selection[];
  phase: Phase;
  deadline: number;
  startedAt: number;
  participantIds: string[];
  index: number;
  game: GameState | null;
  history: { id: string; game: GameId; results: Result[]; recordBreaks?: import("./gameshow").RecordBreak[] }[];
  previousStandings?: {
    id: string;
    rank: number;
    points: number;
    wins: number;
    seconds: number;
  }[];
  used: string[];
  emotes: { id: string; player: string; emote: number; at: number }[];
  receipts: string[];
  revision: number;
  createdAt: number;
}
export interface Context {
  now: number;
  ids: string[];
  settings: Selection;
  used: string[];
  random: () => number;
}
export interface GameModule {
  init(ctx: Context): GameState;
  action(g: GameState, player: string, action: any, ctx: Context): void;
  tick(g: GameState, ctx: Context): void;
  view(g: GameState, player: string, reveal: boolean): any;
  results(g: GameState, ctx: Context): Result[];
}
export const palette = [
  "#bcff5c",
  "#9b8aff",
  "#ff7b9d",
  "#56d9ff",
  "#ffb85c",
  "#76e8c5",
  "#fa8eff",
  "#ebe66c",
  "#90aeff",
  "#ff9580",
  "#c4a1ff",
  "#8feb96",
];
export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function int(v: unknown, min: number, max: number) {
  const n = Number(v);
  ensure(Number.isInteger(n) && n >= min && n <= max, "Ungültige Zahl.");
  return n;
}
export const uid = () => crypto.randomUUID();
export const shuffle = <T>(a: T[], r: () => number) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
export const random = () => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] / 4294967296;
};
