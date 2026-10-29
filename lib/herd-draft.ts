/** Public phase keys start with the Olympiad's start timestamp. */
export function herdDraftKey(room:{code:string;phaseKey:string;index:number},player:string){return `olymp.herd.thought:${room.code}:${room.phaseKey.split(':')[0]}:${room.index}:${player}`;}
