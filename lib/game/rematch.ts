import {ensure,type Room,type Player} from './types';
import {ranking} from './scoring';
const available=(p:Player,now:number,grace:number)=>!p.kicked&&now-p.lastSeen<grace;

function state(r:Room,now:number,grace:number){
 if(r.rematch?.startedAt===r.startedAt)return {...r.rematch,seats:[...r.rematch.seats],responses:{...r.rematch.responses}};
 return {startedAt:r.startedAt,seats:r.players.filter(p=>available(p,now,grace)&&!p.spectator).slice(0,12).map(p=>p.id),responses:{} as Record<string,'play'|'watch'>,champions:ranking(r.players.filter(p=>r.participantIds.includes(p.id))).filter(p=>p.rank===1).map(p=>({id:p.id,name:p.name,points:p.points}))};
}
function prune(s:NonNullable<Room['rematch']>,r:Room,now:number,grace:number,actor?:string){
 s.seats=s.seats.filter(id=>r.players.some(p=>p.id===id&&!p.kicked&&(id===actor||available(p,now,grace))));
 for(const id of Object.keys(s.responses))if(s.responses[id]==='play'&&!s.seats.includes(id))delete s.responses[id];
}

/** Explicit values make retries harmless; choosing never changes the finished result. */
export function chooseRematch(r:Room,p:Player,choice:unknown,now:number,grace:number){
 ensure(choice==='play'||choice==='watch','Wähle Mitspielen oder Zuschauen.');const s=state(r,now,grace);prune(s,r,now,grace,p.id);
 if(choice==='play'&&!s.seats.includes(p.id)){ensure(s.seats.length<12,'Alle zwölf Spielplätze sind reserviert. Sobald jemand Zuschauen wählt, wird ein Platz frei.');s.seats.push(p.id);}
 if(choice==='watch')s.seats=s.seats.filter(id=>id!==p.id);s.responses[p.id]=choice;r.rematch=s;p.lastSeen=now;
}

export function prepareRematch(r:Room,now:number,grace:number){
 const s=state(r,now,grace);prune(s,r,now,grace);r.rematch=s;
 r.players=r.players.filter(p=>!p.kicked);for(const p of r.players){p.spectator=!s.seats.includes(p.id);p.ready=false;}
}

/** Lobby admission also serves late spectators, with a server-checked twelve-seat limit. */
export function chooseParticipation(r:Room,p:Player,choice:unknown,now:number,grace:number){
 ensure(choice==='play'||choice==='watch','Wähle Mitspielen oder Zuschauen.');
 if(choice==='play'){ensure(r.players.filter(q=>q.id!==p.id&&!q.spectator&&available(q,now,grace)).length<12,'Alle zwölf Spielplätze sind reserviert.');
  for(const q of r.players)if(q.id!==p.id&&!available(q,now,grace)){q.spectator=true;q.ready=false;}
 }
 const spectator=choice==='watch';if(p.spectator!==spectator){p.spectator=spectator;p.ready=false;}p.lastSeen=now;
 if(r.rematch){r.rematch.responses[p.id]=choice;r.rematch.seats=r.players.filter(q=>!q.spectator&&available(q,now,grace)).map(q=>q.id);}
}

/** Deliberately project public fields; player/session tokens never enter this view. */
export function rematchView(r:Room,me:string,now:number,grace:number){
 if(r.phase!=='podium'&&!(r.phase==='lobby'&&r.rematch))return null;const s=state(r,now,grace);prune(s,r,now,grace);
 const rows=r.players.filter(p=>!p.kicked).map(p=>{const eligible=available(p,now,grace),reserved=r.phase==='lobby'?!p.spectator&&eligible:s.seats.includes(p.id),choice=r.phase==='lobby'?(p.spectator?'watch':'play'):s.responses[p.id]??(p.spectator?'watch':null);return {id:p.id,name:p.name,choice,explicit:!!s.responses[p.id],reserved,eligible,connected:now-p.lastSeen<12000};});
 const eligible=rows.filter(p=>p.eligible),seats=rows.filter(p=>p.reserved).length;
 return {startedAt:s.startedAt,champions:s.champions,rows,mine:rows.find(p=>p.id===me)??null,seats,free:Math.max(0,12-seats),playing:eligible.filter(p=>p.choice==='play').length,watching:eligible.filter(p=>p.choice==='watch').length,pending:eligible.filter(p=>p.choice===null).length};
}
