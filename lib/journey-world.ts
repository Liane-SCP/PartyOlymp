import type { GameId, Selection } from "./game/types";
import { isBoss } from "./game/boss-rules";
import {regionForChapter,type JourneyRegion} from './journey-regions';
export const JOURNEY_CAMERA=[62,180,108] as const;

export interface IslandTheme { name: string; subtitle: string; color: string; ground: string; landmark: string }
export const islandThemes: Record<GameId, IslandTheme> = {
  colossus: { name: "Die Zitadelle der Titanen", subtitle: "Ein gewaltiger Runentempel über dem Wolkenmeer", color: "#cbb1ff", ground: "#77648b", landmark: "titan-citadel" },
  kraken: { name: "Das zerrissene Sturmmeer", subtitle: "Ein ganzes Meer im Griff eines uralten Ungeheuers", color: "#78e8f3", ground: "#326e83", landmark: "kraken-maelstrom" },
  dragon: { name: "Der Vulkan des Münzdrachen", subtitle: "Goldene Festungen, glühende Lava und ein unermesslicher Hort", color: "#ffcf7d", ground: "#704940", landmark: "dragon-volcano" },
  code: { name: "Die Tresorwerkstatt", subtitle: "Vier Farbmechanismen bewahren das gemeinsame Geheimnis", color: "#ac9dff", ground: "#5a5e82", landmark: "code-prisms" },
  auction: { name: "Das Haus der großen Gebote", subtitle: "Bieterplätze und eine Bühne für große Versprechen", color: "#ffc58c", ground: "#95826c", landmark: "auction-market" },
  timing: { name: "Die stille Sternwarte", subtitle: "Im Observatorium zählt nur euer Zeitgefühl", color: "#b7dfff", ground: "#627e8e", landmark: "timing-hourglass" },
  bomb: { name: "Die Funkenfestung", subtitle: "Zwischen Rauch und Glut zählt jedes neue Wort", color: "#ff9c82", ground: "#815a59", landmark: "bomb-fortress" },
  chain: { name: "Die Gärten der Verbindungen", subtitle: "Goldene Kettenglieder verbinden die schwebenden Haine", color: "#e4cd90", ground: "#6c8a69", landmark: "chain-gardens" },
  categories: { name: "Das Atelier der sieben Ideen", subtitle: "Eine Modellstadt wartet auf eure Einfälle", color: "#a6e5c2", ground: "#718b79", landmark: "categories-city" },
  geo: { name: "Das Observatorium der Welt", subtitle: "Ein goldener Globus zeigt euch ferne Horizonte", color: "#8cdbe9", ground: "#658e80", landmark: "geo-globe" },
  typer: { name: "Die Rennstrecke der Worte", subtitle: "Leuchtende Bahnen führen durch das Wolkenstadion", color: "#9bd4ff", ground: "#5c738b", landmark: "typer-racetrack" },
  herd: { name: "Die Gedankenwiesen", subtitle: "Ein friedliches Dorf unter einem gemeinsamen Gedanken", color: "#c4eea3", ground: "#79915f", landmark: "herd-village" },
  spectrum: { name: "Die Messhalle der Gegensätze", subtitle: "Ein Hinweis bringt eure Zeiger zusammen", color: "#ffaddd", ground: "#8b7292", landmark: "spectrum-rainbow" },
  dice: { name: "Der Salon am Wolkenrand", subtitle: "Nehmt Platz an eurer gemeinsamen Würfelrunde", color: "#e6d3ac", ground: "#8c847b", landmark: "dice-acropolis" },
  wiki: { name: "Die Bibliothek des Himmels", subtitle: "Offene Bücher und Brücken durch ein Meer aus Wissen", color: "#d8c9ff", ground: "#7d718e", landmark: "wiki-library" },
  picture: { name: "Das Pixelblitz-Studio", subtitle: "Bildwand, Scheinwerfer und der schnellste Buzzer", color: "#ffaecf", ground: "#917182", landmark: "picture-gallery" },
  budget: { name: "Das Kaufhaus der Fundstücke", subtitle: "Volle Regale und eine spannende Abrechnung an der Kasse", color: "#f4d493", ground: "#8f8569", landmark: "budget-treasure-port" },
  blackjack: { name: "Der Palast der Einundzwanzig", subtitle: "Smaragdgrüne Spieltische unter goldenen Kuppeln", color: "#96e6bb", ground: "#527b70", landmark: "blackjack-palace" },
  cards: { name: "Das Baumhaus der vier Farben", subtitle: "Eure Kartenrunde zwischen Blättern und bunten Bannern", color: "#ffa8bd", ground: "#7c7087", landmark: "cards-castle" },
  color: { name: "Das Labor der Farben", subtitle: "Ein kurzer Blick, drei Regler und eure eigene Mischung", color: "#d1a8ff", ground: "#80738f", landmark: "color-fountains" },
  size: { name: "Das Tal der Giganten", subtitle: "Winzige Häuser unter dem Schatten riesiger Monumente", color: "#d3e9b1", ground: "#7e8c71", landmark: "size-giants" },
  fleet: { name: "Die vergessene Werft", subtitle: "Schiffe am Rand des Himmels", color: "#8bd5e9", ground: "#5c8191", landmark: "fleet-docks" },
  blocks: { name: "Die Kristalltürme", subtitle: "Leuchtende Blöcke ragen in die Wolken", color: "#99d3ff", ground: "#696d91", landmark: "blocks-towers" },
};

export interface JourneyIsland { index: number; game: GameId; position: [number, number, number]; radius: number; boss: boolean; theme: IslandTheme; chapter: number; realm: string; region:JourneyRegion }
/** Stable positions across focus/zoom. Every selected occurrence gets its own physical island. */
export function journeyLayout(selection: Selection[]): JourneyIsland[] {
  // A realm ends at a boss, or after five discoveries. Realms form an open,
  // ascending crescent; each contains its own loose arc of islands.
  const chapters:number[][]=[];let group:number[]=[];
  selection.forEach((s,i)=>{group.push(i);if(isBoss(s.id)||group.length>=5||i===selection.length-1){chapters.push(group);group=[];}});
  const nodes:JourneyIsland[]=[],span=Math.max(1,chapters.length-1),voyageRadius=Math.max(60,chapters.length*31);
  chapters.forEach((indices,chapter)=>{
    const phase=chapter/span,heading=-1.05+phase*2.25,angle=heading-1.05;
    const cx=Math.cos(angle)*voyageRadius-voyageRadius*0.5,cz=-Math.sin(angle)*voyageRadius;
    const turn=heading+(chapter%2?0.32:-0.18),forward={x:Math.sin(turn),z:-Math.cos(turn)},side={x:Math.cos(turn),z:Math.sin(turn)};
    indices.forEach((index,slot)=>{
      const s=selection[index],f=indices.length===1?0.5:slot/(indices.length-1),arc=-1.7+f*3.4;
      const along=Math.sin(arc)*23,lateral=(Math.cos(arc)-0.45)*19+Math.sin(index*2.3)*3;
      const position:[number,number,number]=[cx+forward.x*along+side.x*lateral,chapter*3.8+Math.sin(index*1.7)*1.4+(isBoss(s.id)?2:0),cz+forward.z*along+side.z*lateral];
      const region=regionForChapter(chapter,chapters.length);
      nodes.push({index,game:s.id,boss:isBoss(s.id),radius:isBoss(s.id)?9.6:3.2,position,theme:islandThemes[s.id],chapter,realm:region.name,region});
    });
  });
  // Keep large boss coasts and any repeated/very short realms clear of neighbours.
  for(let pass=0;pass<8;pass++)for(let i=0;i<nodes.length;i++)for(let j=0;j<i;j++){
    const a=nodes[i],b=nodes[j],dx=a.position[0]-b.position[0],dz=a.position[2]-b.position[2],d=Math.hypot(dx,dz),min=a.radius+b.radius+9;
    if(d<min){const angle=i*2.399,ux=d>0.001?dx/d:Math.cos(angle),uz=d>0.001?dz/d:Math.sin(angle);a.position[0]+=ux*(min-d+0.1);a.position[2]+=uz*(min-d+0.1);}
  }
  if(nodes.length){const [x,,z]=nodes[0].position;nodes.forEach(n=>{const dx=n.position[0]-x,dz=n.position[2]-z;n.position[0]=dx*Math.cos(-0.6)-dz*Math.sin(-0.6);n.position[2]=dx*Math.sin(-0.6)+dz*Math.cos(-0.6);});}
  return nodes;
}

export function journeyBounds(nodes: JourneyIsland[]) {
  if (!nodes.length) return { x: 0, z: 0, width: 30, depth: 30 };
  const minX = Math.min(...nodes.map(n => n.position[0] - n.radius)), maxX = Math.max(...nodes.map(n => n.position[0] + n.radius));
  const minZ = Math.min(...nodes.map(n => n.position[2] - n.radius)), maxZ = Math.max(...nodes.map(n => n.position[2] + n.radius));
  return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, width: maxX - minX + 12, depth: maxZ - minZ + 20 };
}

export function islandViewSize(node: JourneyIsland, aspect: number) {
  return (node.boss ? 33 : 14.5) * Math.max(1, 0.9 / Math.max(0.3, aspect));
}
