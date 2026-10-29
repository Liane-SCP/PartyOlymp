'use client';
import type {ShoppingView} from '@/lib/shopping-camera';
import {useEffect,useRef} from 'react';

export function ShoppingTour({items,index,view,selected,canSelect,pending=false,onIndex,onView,onNavigate,onPick}:{items:{id:string;name?:string;title?:string}[];index:number;view:ShoppingView;selected:boolean;canSelect:boolean;pending?:boolean;onIndex:(index:number)=>void;onView:(view:ShoppingView)=>void;onNavigate:(x:number,z:number)=>void;onPick?:()=>void}){
 const item=items[index],root=useRef<HTMLDivElement>(null);
 useEffect(()=>{const node=root.current,stage=node?.closest<HTMLElement>('.adventure-stage');if(!node||!stage)return;const resize=()=>stage.style.setProperty('--shopping-desk',`${node.offsetHeight+78}px`),observer=new ResizeObserver(resize);observer.observe(node);resize();return()=>{observer.disconnect();stage.style.removeProperty('--shopping-desk');};},[]);
 return <div className="shopping-tour" ref={root}>
  <nav className="shopping-offer-nav" aria-label="Angebote im Kaufhaus">
   <button type="button" aria-pressed={view==='overview'} onClick={()=>onView(view==='overview'?'offer':'overview')}>{view==='offer'?'Übersicht':'Angebot ansehen'}</button>
   <button type="button" aria-label="Vorheriges Angebot" disabled={!item||index===0} onClick={()=>onIndex(index-1)}>←</button>
   <select aria-label="Angebot auswählen" value={index} disabled={!item} onChange={e=>onIndex(Number(e.target.value))}>{items.map((item,i)=><option key={item.id} value={i}>{i+1}. {item.name??item.title??'Artikel'}</option>)}</select>
   <button type="button" aria-label="Nächstes Angebot" disabled={!item||index===items.length-1} onClick={()=>onIndex(index+1)}>→</button>
  </nav>
  {view==='offer'&&item&&<div className="shopping-offer-description"><div><strong>{item.name??item.title??'Artikel'}</strong><span>{index+1} / {items.length} · {pending?'Dein Korb wird abgegeben':!canSelect?'Auswahl geschlossen':selected?'In deinem privaten Korb':'Produkt antippen zum Einpacken'}</span></div><button type="button" disabled={!canSelect} aria-pressed={selected} onClick={onPick}>{selected?'Zurücklegen':'Einpacken'}</button></div>}
  <nav className="shopping-department-nav" aria-label="Kaufhaus erkunden">{[{name:'Feinkost',x:-7.8,z:0},{name:'Technik',x:0,z:0},{name:'Wohnen',x:7.8,z:0},{name:'Zur Kasse',x:6.8,z:7.8}].map(place=><button type="button" key={place.name} onClick={()=>{onView('overview');onNavigate(place.x,place.z);}}>{place.name}</button>)}</nav>
 </div>;
}
