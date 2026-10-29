import * as React from 'react';import {createRoot} from 'react-dom/client';import {useDeadlineInput} from '../components/olymp/deadline-input';
type Action={type:string;guess:number;risk:string;round:number};const estimate:Action={type:'estimate',guess:12345,risk:'bold',round:1},state=window as any;state.__deadlineEvents=[];
function Probe({id,had=false,initial=null,change=false,phaseChange=false}:{id:string;had?:boolean;initial?:Action|null;change?:boolean;phaseChange?:boolean}){
 const [action,setAction]=React.useState<Action|null>(initial),[phase,setPhase]=React.useState('one');
 useDeadlineInput({phase:'playing',phaseKey:phase,game:{mine:{timeoutInput:had?{phase:'one',action:estimate}:undefined}}},a=>state.__deadlineEvents.push({id,action:a}),action,had);
 React.useEffect(()=>{const timer=setTimeout(()=>{if(change)setAction(estimate);if(phaseChange)setPhase('two');},30);return()=>clearTimeout(timer);},[]);return <div>{id}</div>;
}
const root=createRoot(document.getElementById('root')!);root.render(<><Probe id="default"/><Probe id="resumed-invalid" had/><Probe id="corrected" had change/><Probe id="valid" had initial={estimate}/><Probe id="next-phase" had phaseChange/></>);state.__deadlineCleanup=()=>root.unmount();
