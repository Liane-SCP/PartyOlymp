"use client";
import {createContext} from 'react';
export const BombConsoleMount=createContext<{element:HTMLElement|null;enter:()=>void}|undefined>(undefined);
