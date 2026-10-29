"use client";
import {useCallback,useContext,useEffect} from 'react';
import {AdventureDraft} from './adventure-context';
import {WorldMap,type MapPin} from './world-map';
import {geoResultKey} from '@/lib/geo-presentation';

/** Result inspection is local and contains only already published guesses. */
export function GeoResultsMap({game,players,name}:{game:any;players:any[];name:(id:string)=>string}){
 const update=useContext(AdventureDraft),key=geoResultKey(game);
 const highlight=useCallback((pin:MapPin|null)=>update({geoHighlight:{key,player:pin?.playerId??null}}),[update,key]);
 useEffect(()=>()=>update({geoHighlight:null}),[update,key]);
 return <WorldMap key={key} target={game.reveal.place} onHighlight={highlight} pins={(game.reveal.players??[]).filter((p:any)=>p.guess).map((p:any)=>({...p.guess,playerId:p.id,label:`${name(p.id)} · ${Math.round(p.distance)} km`,color:players.find(x=>x.id===p.id)?.color}))}/>;
}
