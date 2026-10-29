"use client";
import {createContext} from 'react';
export const HerdThoughtMount=createContext<{element:HTMLElement|null;focused:boolean;enter:()=>void;leave:()=>void}|undefined>(undefined);
