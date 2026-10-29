import { dice } from "./dice";
import { code } from "./code";
import { blackjack } from "./blackjack";
import { cards } from "./cards";
import { fleet } from "./fleet";
import { quiz } from "./quiz";
import { wiki } from "./wiki";
import { typer } from "./typer";
import { herd } from "./herd";
import { spectrum } from "./spectrum";
import { blocks } from "./blocks";
import { geo } from "./geo";
import { categories } from "./categories";
import { chain } from "./chain";
import { auction } from "./auction";
import { timing } from "./timing";
import { bomb } from "./bomb";
import { colossus, kraken, dragon } from "./boss";
import type { GameId, GameModule } from "../types";
export const games: Record<GameId, GameModule> = {
  colossus,
  kraken,
  dragon,
  code,
  auction,
  timing,
  bomb,
  chain,
  categories,
  typer,
  herd,
  spectrum,
  blocks,
  geo,
  dice,
  blackjack,
  cards,
  fleet,
  wiki,
  picture: quiz("picture"),
  budget: quiz("budget"),
  color: quiz("color"),
  size: quiz("size"),
};
