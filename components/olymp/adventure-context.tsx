"use client";
import {createContext,useContext,useEffect,type DependencyList} from "react";
export const AdventureDraft=createContext<(patch:Record<string,unknown>)=>void>(()=>{});
export function useAdventureDraft(value:Record<string,unknown>,deps:DependencyList){const update=useContext(AdventureDraft);useEffect(()=>{update(value);},[update,...deps]);}
