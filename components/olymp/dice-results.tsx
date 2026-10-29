"use client";
import {useEffect,useRef,useState} from 'react';
import {categories} from '@/lib/game/games/dice';
import {diceResultRows,diceHistoryGame} from '@/lib/dice-results';
import {useAdventureDraft} from './adventure-context';
import {Avatar} from './art';
import {sound} from '@/lib/audio';

export function DiceResults({game,players,me,linked=true}:{game:any;players:any[];me?:string;linked?:boolean}){
 const rows=diceResultRows(game,players),root=useRef<HTMLElement>(null),[selected,setSelected]=useState(()=>rows.find(p=>p.id===me)?.id??rows[0]?.id??'');
 const active=rows.find(p=>p.id===selected)??rows[0],own=rows.find(p=>p.id===me),compare=!!own&&own.id!==active?.id;
 useAdventureDraft({diceResult:active?.id},[active?.id]);
 const selectRef=useRef((id:string)=>{});
 selectRef.current=(id:string)=>{if(!rows.some(p=>p.id===id))return;if(id!==selected){sound.init();sound.play('card',undefined,'diceResultSheet');}setSelected(id);};
 useEffect(()=>{const element=root.current;if(!element)return;const pick=(event:Event)=>{selectRef.current((event as CustomEvent).detail?.id);element.querySelector<HTMLElement>('.dice-result-sheet')?.scrollIntoView({block:'nearest',behavior:'instant'});};element.addEventListener('olymp-dice-result',pick);return()=>element.removeEventListener('olymp-dice-result',pick);},[]);
 if(!active)return null;
 const winners=rows.filter(p=>p.rank===1),profile=players.find(p=>p.id===active.id);
 return <section ref={root} className="dice-results" aria-label="Gemeinsamer Blattvergleich" data-selected={active.id}>
  <header><span>EURE RUNDE AM TISCH</span><h3>{winners.length>1?`${winners.length} gleich starke Spitzenblätter`:`Das beste Blatt: ${winners[0].name}`}</h3><p>Vergleicht eure Blattpunkte. Die Olympiadenwertung folgt anschließend.</p></header>
  <div className="dice-result-crew" role="group" aria-label="Wertungsblätter der Crew">{rows.map(row=>{const p=players.find(p=>p.id===row.id);return <button type="button" key={row.id} aria-pressed={row.id===active.id} onClick={()=>selectRef.current(row.id)}><Avatar avatar={p?.avatar} color={p?.color} look={p?.look}/><span><strong>{row.name}{row.id===me?' · Du':''}</strong><small>Blattplatz {row.rank}</small></span><b>{row.total}<small>Blattpunkte</small></b></button>;})}</div>
  <label className="dice-result-picker">Wertungsblatt auswählen<select value={active.id} onChange={e=>selectRef.current(e.target.value)}>{rows.map(row=><option key={row.id} value={row.id}>{row.name} · {row.total} Punkte</option>)}</select></label>
  <article className="dice-result-sheet" tabIndex={-1} aria-label={`Wertungsblatt von ${active.name}`}>
   <div className="dice-result-heading"><Avatar avatar={profile?.avatar} color={profile?.color} look={profile?.look}/><div><h4>{active.name}</h4><p>Blattplatz {active.rank}{active.complete?' · Alle 13 Kategorien eingetragen':' · Blatt nicht vollständig'}</p></div><strong>{active.total}<small>Blattpunkte</small></strong></div>
   <p className="dice-result-bonus">{active.bonus?'35 Bonuspunkte für mindestens 63 Punkte im oberen Block.':`${Math.max(0,63-active.upper)} Punkte fehlten zum 35-Punkte-Bonus.`}</p>
   {compare&&<p className="dice-result-comparison">Zum Vergleich steht dein eigenes Blatt daneben.</p>}
   <table><caption>Alle Kategorien und die Gesamtsumme</caption><thead><tr><th scope="col">Kategorie</th><th scope="col">{active.name}</th>{compare&&<th scope="col">Du</th>}</tr></thead><tbody>{categories.map((category,index)=><tr key={category}><th scope="row">{category}</th><td>{active.sheet[index]??'—'}</td>{compare&&<td>{own!.sheet[index]??'—'}</td>}</tr>)}<tr className="dice-result-subtotal"><th scope="row">Oberer Block</th><td>{active.upper}</td>{compare&&<td>{own!.upper}</td>}</tr><tr><th scope="row">Bonus ab 63</th><td>{active.bonus?'+35':'0'}</td>{compare&&<td>{own!.bonus?'+35':'0'}</td>}</tr><tr><th scope="row">Unterer Block</th><td>{active.lower}</td>{compare&&<td>{own!.lower}</td>}</tr></tbody><tfoot><tr><th scope="row">Gesamtsumme</th><td>{active.total}</td>{compare&&<td>{own!.total}</td>}</tr></tfoot></table>
  </article>
  <p className="dice-result-hint">{linked?'Die markierte Platzkarte am 3D-Tisch gehört zu diesem Blatt. Dort kannst du auch ein anderes Blatt auswählen.':'Dieser Blattvergleich stammt aus eurem abgeschlossenen Spiel. Eure Ergebnisse bleiben unverändert.'}</p>
 </section>;
}
export function DiceResultsArchive({history,players,me}:{history:any[];players:any[];me?:string}){
 const entries=history.filter(entry=>entry.game==='dice'&&diceHistoryGame(entry).reveal.players.length),[open,setOpen]=useState(false),[chosen,setChosen]=useState('');
 const active=entries.find(entry=>entry.id===chosen)??entries.at(-1);
 if(!active)return null;
 return <details className="dice-results-archive" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Würfelblätter im Spielrückblick</summary>{open&&<><label>Würfelpartie auswählen<select aria-label="Würfelpartie auswählen" value={active.id} onChange={e=>setChosen(e.target.value)}>{entries.map(entry=><option key={entry.id} value={entry.id}>Disziplin {history.indexOf(entry)+1} · Würfelwerk</option>)}</select></label><DiceResults key={active.id} game={diceHistoryGame(active)} players={players} me={me} linked={false}/></>}</details>;
}
