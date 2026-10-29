"use client";
import {createContext} from 'react';
export const CardTableView=createContext<{focused:boolean;expanded:boolean;mount:HTMLElement|null;exit:()=>void}>({focused:false,expanded:false,mount:null,exit:()=>{}});
