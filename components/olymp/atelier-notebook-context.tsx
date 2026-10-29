"use client";
import {createContext} from 'react';
export const AtelierNotebookMount=createContext<{element:HTMLElement|null;focused:boolean;enter:()=>void;leave:()=>void}|undefined>(undefined);
