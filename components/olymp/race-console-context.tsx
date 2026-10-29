"use client";
import {createContext} from 'react';
export const RaceConsoleMount=createContext<{element:HTMLElement|null;enter:()=>void}|undefined>(undefined);
