import type { GameId } from "./game/types";
export type AdventureId=GameId|"hub";
export interface AdventureTheme {title:string;subtitle:string;accent:string;stone:string;sky:string;mechanic:string}
const theme=(title:string,subtitle:string,accent:string,mechanic:string,stone="#72958c",sky="#102b40"):AdventureTheme=>({title,subtitle,accent,mechanic,stone,sky});
export const adventureThemes:Record<AdventureId,AdventureTheme>={
  hub:theme("Das Tor zu eurer Legende","Eine Crew. Eine Welt voller Möglichkeiten.","#f3cc83","temple"),
  code:theme("Die Geheimniswerkstatt","Vier Mechanismen. Ein Tresor. Eure nächste Kombination.","#bda7ff","prisms","#74769c"),
  auction:theme("Das Haus der großen Worte","Bietet hoch. Betretet die Bühne. Holt euch den Applaus.","#efbf80","gavel"),
  timing:theme("Der stille Sternengarten","Vertraue deinem Gefühl. Die Zeit bleibt unsichtbar.","#9fdcdb","stillness"),
  bomb:theme("Die Funkenwerkstatt","Ein Wort rettet dich. Dann wandert die Gefahr weiter.","#ffb079","bomb","#927b71"),
  chain:theme("Der Pfad der Gedanken","Jedes gültige Wort baut eure Brücke weiter.","#b7d9ab","chain"),
  categories:theme("Das Atelier der sieben Ideen","Schreibt eure Ideen. Belebt die Stadt. Vergleicht gemeinsam.","#a5d9ca","towers"),
  geo:theme("Das Observatorium der Welt","Dreh dich um. Finde Hinweise. Setze deinen Pin.","#8dd9e7","globe"),
  typer:theme("Die Küstenkurve","Kurve für Kurve. Wort für Wort. Gemeinsam ins Ziel.","#a1d5ff","race"),
  herd:theme("Das Picknick der Gedanken","Viele Köpfe. Vielleicht dieselbe Idee.","#c0dca3","village"),
  spectrum:theme("Die Messstation der Gegensätze","Ein Hinweis. Ein gemeinsames Gespür für die Mitte.","#ecadd0","balance","#8c7f9f"),
  dice:theme("Der Würfelsalon","Eure Tischrunde. Fünf Würfel. Ein großer Wurf.","#f0d3a0","dice"),
  wiki:theme("Die Bibliothek der Buchportale","Jeder echte Link öffnet ein neues Kapitel.","#c8b5f3","library"),
  picture:theme("Die Galerie der Enthüllungen","Ein echtes Bild erwacht im Licht der Bühne.","#eeb9d4","gallery"),
  budget:theme("Das Olymp-Kaufhaus","Dein Einkauf. Dein Gespür. Ein knappes Budget.","#edca8f","market"),
  blackjack:theme("Der Smaragdpalast","Karten auf den Tisch. Alles im Blick. Bis zur 21.","#a5d9ba","casino"),
  cards:theme("Die bunte Baumrunde","Eine Tischrunde zwischen den Baumkronen. Jede Karte zählt.","#f0acb6","cards"),
  color:theme("Die Alchemie des Lichts","Mische dein Licht. Erinnere dich an die Farbe.","#c9b2f5","alchemy"),
  size:theme("Das Museum der Ma\u00dfst\u00e4be","Modelle vergleichen. Gr\u00f6\u00dfen sch\u00e4tzen. Gemeinsam staunen.","#cddaa4","scale"),
  fleet:theme("Die vergessene Werft","Plane deine Flotte im schwebenden Hafen.","#9acddb","fleet"),
  blocks:theme("Die Türme aus Sternenglas","Stein auf Stein in den Himmel.","#b3c7f2","blocks"),
  colossus:theme("Die Zitadelle der Titanen","Stellt euch dem Würfelkoloss.","#cbb1ff","boss"),
  kraken:theme("Das zerrissene Sturmmeer","Eine Crew gegen die Tiefe.","#78e8f3","boss"),
  dragon:theme("Der Vulkan des Münzdrachen","Das große Finale im goldenen Feuer.","#ffcf7d","boss"),
};
export const bounded=(value:unknown,min:number,max:number,fallback=min)=>typeof value==="number"&&Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
export function adventureProgress(game:any,id:string,me:string) {
  if(game.id==="typer")return bounded((game.racers?.[id]?.progress??0)/Math.max(1,game.text?.length??1),0,1);
  if(game.id==="wiki")return game.racers?.[id]?.arrived?1:bounded((game.racers?.[id]?.clicks??0)/12,0,0.9);
  if(game.id==="categories")return bounded((game.progress?.[id]?.filled??0)/Math.max(1,game.categories?.length??7),0,1);
  const status=game.roster?.[id]??game.submitted?.[id];
  return id===me&&game.mine?.submitted||status===true||status?.submitted?1:0;
}
/** Excludes hidden clocks: effects can follow public events, never expose a secret deadline. */
export function adventureEventKey(game:any) {return [game.id,game.round,game.stage,game.mine?.rollId,game.lastMove?.id,game.turn,game.path?.length,game.mine?.submitted,game.mine?.dice?.join(),game.guesses?Object.values(game.guesses).map((v:any)=>v.solved).join():""].join(":");}



