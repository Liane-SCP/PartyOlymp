"use client";
import type {sizeMuseumFrame,SizeMuseumView} from '@/lib/size-presentation';
import {formatLength} from './size-art';
type Frame=ReturnType<typeof sizeMuseumFrame>;
export function SizeGallery({frame,me,onSelect,onView,onReference}:{frame:Frame;me:string;onSelect:(id:string)=>void;onView:(view:SizeMuseumView)=>void;onReference:(value:boolean)=>void}){
 const selected=frame.selected;
 return <nav className="size-gallery-nav" aria-label="Maßstabsmuseum erkunden">
  <div className="size-gallery-modes"><button type="button" aria-pressed={frame.view==='compare'} onClick={()=>onView('compare')}>Modelle vergleichen</button><button type="button" aria-pressed={frame.view==='gallery'} onClick={()=>onView('gallery')}>Museumsrunde ansehen</button>{frame.revealed&&<button type="button" aria-pressed={frame.referenceMode} onClick={()=>onReference(!frame.referenceMode)}>{frame.referenceMode?'Echten Wert vergleichen':'Referenz vergleichen'}</button>}</div>
  {frame.revealed&&selected?<>
   <div className="size-gallery-selection"><button type="button" aria-label="Vorherigen Größentipp ansehen" disabled={frame.selectedIndex===0} onClick={()=>onSelect(frame.rows[frame.selectedIndex-1].id)}>←</button><select aria-label="Öffentlichen Größentipp auswählen" value={selected.id} onChange={event=>onSelect(event.target.value)}>{frame.rows.map(row=><option key={row.id} value={row.id}>{row.index+1}. {row.name}{row.estimate===null?' · kein Tipp':''}</option>)}</select><button type="button" aria-label="Nächsten Größentipp ansehen" disabled={frame.selectedIndex===frame.rows.length-1} onClick={()=>onSelect(frame.rows[frame.selectedIndex+1].id)}>→</button>{frame.rows.some(row=>row.id===me)&&<button type="button" onClick={()=>onSelect(me)}>Mein Tipp</button>}</div>
   <p className="size-gallery-summary" aria-live="polite"><strong>{selected.name}</strong><span>{selected.estimate===null?'Keinen Tipp abgegeben':formatLength(selected.estimate)} · {selected.score.toFixed(1)} Punkte{selected.estimate!==null?` · Platz ${selected.place}`:''}</span></p>
  </>:<p className="size-gallery-summary">Dein Modell und die Referenz verwenden denselben Maßstab. Die Tipps der Crew bleiben verdeckt.</p>}
 </nav>;
}
