"use client";
import {createContext} from 'react';
export const ChainConsoleMount=createContext<{element:HTMLElement|null;enter:()=>void}|undefined>(undefined);
