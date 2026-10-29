import { byId } from "./catalog";
import { olympiadMultiplier } from "./scoring";
import type { GameId, Result, Selection } from "./types";

export interface RecordBreak { player: string; previous: number; raw: number; game: GameId }
export type PersonalBests = Record<string, Record<string, number>>;
export interface ShowMoment {
  id: string; kind: "duel" | "lead" | "comeback" | "streak" | "record" | "win" | "opening";
  label: string; title: string; text: string; players: string[]; metric?: string;
  headToHead?: {left:number; right:number; ties:number};
}
interface Standing { id: string; name: string; points: number; rank: number; lastPoints: number }
interface ShowInput {
  standings: Standing[];
  previousStandings?: { id: string; rank: number; points: number }[];
  history: { id: string; game: GameId; results: Result[]; recordBreaks?: RecordBreak[] }[];
  selection: Selection[]; index: number;
}
const close = (a:number,b:number) => Math.abs(a-b) <= Number.EPSILON*32*Math.max(1,Math.abs(a),Math.abs(b));
export const showNumber = (n:number) => n.toLocaleString("de-DE", {maximumFractionDigits:1});
const gameName = (id:GameId) => byId(id)?.name ?? "dieser Disziplin";

/** Raw game scores are comparable only within the same game, settings and crew size. */
export function updatePersonalBests(bests: PersonalBests, settings: Selection, count: number, results: Result[]): RecordBreak[] {
  const key=`${settings.id}:${settings.rounds}:${settings.seconds}:${count}`;
  const broken: RecordBreak[]=[];
  for(const result of results) {
    if(!result.valid || !Number.isFinite(result.raw)) continue;
    const records=bests[result.id] ??= {};
    const previous=records[key];
    if(previous === undefined || (result.raw > previous && !close(result.raw,previous))) {
      records[key]=result.raw;
      if(previous !== undefined) broken.push({player:result.id,previous,raw:result.raw,game:settings.id});
    }
  }
  return broken;
}

export function gameShow(input: ShowInput): {preview: ShowMoment[]; recap: ShowMoment[]} {
  const {standings:players,history,previousStandings:before=[]}=input;
  const last=history.at(-1), preview:ShowMoment[]=[],recap:ShowMoment[]=[];
  const name=(id:string)=>players.find(p=>p.id===id)?.name ?? "Spieler";
  const old=(id:string)=>before.find(p=>p.id===id);
  const key=last?.id ?? "opening";
  if(!players.length) return {preview,recap};
  if(!history.length) preview.push({id:"opening",kind:"opening",label:"DIE SHOW BEGINNT",title:"Noch gehört der Olymp niemandem.",text:`${players.length} Spieler, eine Olympiade. ${gameName(input.selection[input.index]?.id)} eröffnet euer Rennen.`,players:[]});
  else {
    const pairs=players.slice(1).map((chaser,i)=>({chaser,target:players[i],gap:Math.max(0,players[i].points-chaser.points)}));
    pairs.sort((a,b)=>a.gap-b.gap || a.target.rank-b.target.rank);
    const duel=pairs[0];
    if(duel) {
      const tied=close(duel.gap,0);
      const headToHead={left:0,right:0,ties:0};
      for(const round of history) {
        const left=round.results.find(r=>r.id===duel.chaser.id&&r.valid&&Number.isFinite(r.raw));
        const right=round.results.find(r=>r.id===duel.target.id&&r.valid&&Number.isFinite(r.raw));
        if(!left||!right)continue;
        if(close(left.raw,right.raw))headToHead.ties++;
        else if(left.raw>right.raw)headToHead.left++;else headToHead.right++;
      }
      preview.push({id:`duel:${key}`,kind:"duel",label:"DUELL DES ABENDS",title:`${duel.chaser.name} vs. ${duel.target.name}`,
        text:tied ? "Gleiche Punkte, gleicher Platz. Die nächste Disziplin kann dieses Duell entscheiden." : `${duel.chaser.name} fehlen ${showNumber(duel.gap)} Punkte zum Punktgleichstand mit ${duel.target.name}.`,
        players:[duel.chaser.id,duel.target.id],metric:tied?"PUNKTGLEICH":`${showNumber(duel.gap)} PUNKTE ABSTAND`,headToHead});
    }
    const leaders=players.filter(p=>p.rank===1);
    const chaser=players.find(p=>p.rank>1);
    if(leaders.length===1 && chaser && (duel?.target.id!==leaders[0].id || duel?.chaser.id!==chaser.id)) {
      const lead=leaders[0],gap=lead.points-chaser.points;
      preview.push({id:`chase:${key}`,kind:"duel",label:"JAGD AUF DIE SPITZE",title:`${chaser.name} hat ${lead.name} im Visier.`,
        text:close(gap,0)?"Gleiche Punkte, gleicher Platz. Die nächste Disziplin kann dieses Duell entscheiden.":`${showNumber(gap)} Punkte trennen sie von der Führung. Wer setzt sich jetzt durch?`,players:[chaser.id,lead.id],metric:"DIE SPITZE IM BLICK"});
    }
  }
  if(!last) return {preview,recap};
  const winners=last.results.filter(r=>r.valid && r.rank===1).map(r=>r.id);
  const leaders=players.filter(p=>p.rank===1);
  const newLeader=leaders.find(p=>old(p.id) && old(p.id)!.rank>1);
  if(newLeader) recap.push({id:`lead:${key}`,kind:"lead",label:leaders.length===1?"NEUE NUMMER EINS":"GETEILTE FÜHRUNG",
    title:leaders.length===1?`${newLeader.name} übernimmt den Olymp!`:`${newLeader.name} zieht an die Spitze!`,
    text:leaders.length===1?`Von Platz ${old(newLeader.id)!.rank} auf Platz 1. ${showNumber(newLeader.lastPoints)} neue Punkte verändern das Rennen.`:"Die Führung wird jetzt geteilt. Dieses Rennen ist noch nicht entschieden.",players:[newLeader.id],metric:"PLATZ 1"});
  const climbers=players.filter(p=>old(p.id) && old(p.id)!.rank-p.rank>=2).sort((a,b)=>(old(b.id)!.rank-b.rank)-(old(a.id)!.rank-a.rank));
  const climber=climbers.find(p=>p.id!==newLeader?.id);
  if(climber) recap.push({id:`comeback:${key}`,kind:"comeback",label:"AUFHOLJAGD",title:`${climber.name} macht Boden gut!`,
    text:`Von Platz ${old(climber.id)!.rank} auf Platz ${climber.rank}. ${gameName(last.game)} bringt ${showNumber(climber.lastPoints)} Punkte aufs Konto.`,players:[climber.id],metric:`↑ ${old(climber.id)!.rank-climber.rank} PLÄTZE`});
  const streaks=players.map(p=>{
    let count=0;for(let i=history.length-1;i>=0;i--){if(!history[i].results.some(r=>r.id===p.id&&r.valid&&r.rank===1))break;count++;}
    return {player:p,count};
  }).filter(s=>s.count>=2).sort((a,b)=>b.count-a.count);
  if(streaks.length) {
    const {player:p,count}=streaks[0];recap.push({id:`streak:${key}`,kind:"streak",label:"SIEGESSERIE",title:`${p.name} ist im Lauf!`,text:`${count} Disziplinsiege in Folge. Wer stoppt diese Serie? Geteilte erste Plätze zählen ebenfalls als Sieg.`,players:[p.id],metric:`${count} SIEGE IN FOLGE`});
  }
  for(const record of last.recordBreaks ?? []) {
    if(!players.some(p=>p.id===record.player))continue;
    recap.push({id:`record:${key}:${record.player}`,kind:"record",label:"PERSÖNLICHER REKORD",title:`${name(record.player)} übertrifft sich selbst!`,
      text:`Neue persönliche Bestleistung in ${gameName(record.game)} – bei denselben Runden, Zeitvorgaben und derselben Spielerzahl wie zuvor.`,players:[record.player],metric:"NEUE BESTMARKE"});
  }
  if(!recap.length && winners.length) recap.push({id:`win:${key}`,kind:"win",label:winners.length>1?"GETEILTER DISZIPLINSIEG":"DISZIPLINSIEG",title:winners.length>2?`${winners.length} Spieler teilen den Sieg!`:winners.length>1?`${winners.map(name).join(" & ")} teilen den Sieg!`:`${name(winners[0])} setzt ein Ausrufezeichen!`,text:`${gameName(last.game)} ist entschieden. ${olympiadMultiplier(last.game)===3?"Dieser Bosskampf bringt dreifache Olympiadenpunkte.":"Diese Punkte gehören jetzt zum Rennen um den Olymp."}`,players:winners.slice(0,2)});
  if(!recap.length) recap.push({id:`result:${key}`,kind:"opening",label:"DAS RENNEN GEHT WEITER",title:"Noch ist nichts entschieden.",text:"In dieser Disziplin gab es keinen gültigen ersten Platz. Die nächste Gelegenheit wartet schon.",players:[]});
  // Preview carries momentum into the next discipline, alongside the closest duel.
  if(history.length)preview.push(...recap.filter(s=>["streak","record","comeback"].includes(s.kind)).slice(0,2));
  return {preview:preview.slice(0,3),recap};
}
