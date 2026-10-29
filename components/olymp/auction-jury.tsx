"use client";
import {useEffect,useRef,useState} from 'react';
import {useAdventureDraft} from './adventure-context';
import {useDeadlineInput} from './deadline-input';
import {sound} from '@/lib/audio';
import {useGameSubmission} from './use-game-submission';
import {juryBallot,jurySummary,serverJurySheet,restoreJurySheet,nextOpenJuryPage,type JuryMark} from '@/lib/auction-jury';

export function AuctionJury({room,me,act}:{room:any;me:string;act:(a:any)=>void|Promise<boolean>}){
 const g=room.game,words=g.answers.map((a:any)=>String(a.word)),cacheKey=`olymp.auction-jury:${room.code}:${me}:${room.phaseKey}`;
 const [sheet,setSheet]=useState(()=>serverJurySheet(g,room.phaseKey)),[restored,setRestored]=useState(false),[confirm,setConfirm]=useState(false);
 const {pending:busy,error,submit:send}=useGameSubmission(act,cacheKey);
 const root=useRef<HTMLElement>(null),sealed=!!g.mine.submitted,summary=jurySummary(sheet.marks),pages=Math.max(1,Math.ceil(words.length/6));
 useEffect(()=>{if(!sealed)try{const saved=restoreJurySheet(JSON.parse(sessionStorage.getItem(cacheKey)??'null'),words);if(saved)setSheet(saved);}catch{}setRestored(true);},[cacheKey]);
 useEffect(()=>{if(!restored)return;try{if(sealed)sessionStorage.removeItem(cacheKey);else sessionStorage.setItem(cacheKey,JSON.stringify({version:1,words,...sheet}));}catch{}},[sheet,sealed,restored,cacheKey]);
 const votes=sealed?g.mine.ballot: juryBallot(sheet.marks);
 useDeadlineInput(room,act,!sealed&&restored&&summary.reviewed>0?{type:'judge',round:g.round,votes,reviewed:sheet.marks.map(v=>v!=='open')}:null,!!g.mine.timeoutInput);
 useAdventureDraft({auctionPage:sheet.page,auctionReview:sheet.active},[sheet.page,sheet.active]);
 const choose=(index:number)=>{if(!Number.isInteger(index)||index<0||index>=words.length||sealed)return;setSheet(s=>({...s,page:Math.floor(index/6),active:index}));setConfirm(false);requestAnimationFrame(()=>{const row=root.current?.querySelector<HTMLElement>(`[data-jury-word="${index}"]`);row?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});row?.scrollIntoView({block:'nearest',behavior:'instant'});});};
 const chooseRef=useRef(choose);chooseRef.current=choose;
 useEffect(()=>{const element=root.current;if(!element)return;const pick=(e:Event)=>chooseRef.current((e as CustomEvent).detail?.index);element.addEventListener('olymp-auction-review',pick);return()=>element.removeEventListener('olymp-auction-review',pick);},[]);
 function change(index:number,value:JuryMark){if(sheet.marks[index]!==value){sound.init();sound.play('click');}setSheet(s=>({...s,active:index,marks:s.marks.map((v,i)=>i===index?value:v)}));setConfirm(false);}
 async function submit(){if(sealed||busy||!restored)return;const ok=await send({type:'judge',round:g.round,votes:juryBallot(sheet.marks)});if(ok)setConfirm(false);}
 function page(value:number){if(value!==sheet.page){sound.init();sound.play('card',undefined,'auctionJuryPage');}setSheet(s=>({...s,page:value,active:Math.min(words.length-1,value*6)}));setConfirm(false);}
 function openNext(){const next=nextOpenJuryPage(sheet.marks,sheet.page),index=sheet.marks.findIndex((v,i)=>v==='open'&&Math.floor(i/6)===next);if(index<0)return;if(next!==sheet.page){sound.init();sound.play('card',undefined,'auctionJuryPage');}choose(index);}
 function showBook(){const session=root.current?.closest('.adventure-session'),button=session?.querySelector<HTMLButtonElement>('[data-auction-book-toggle]');if(button?.getAttribute('aria-pressed')!=='true')button?.click();session?.querySelector('.adventure-stage')?.scrollIntoView({block:'start',behavior:'instant'});}
 const displayed=sealed&&Array.isArray(votes)?votes:sheet.marks;
 return <section ref={root} className="auction-jury" data-auction-jury aria-label="Dein privates Jurybuch">
  <header><div><span>DEIN JURYBUCH</span><h3>{sealed?'Bewertung versiegelt':'Welche Begriffe zählen?'}</h3><p>{sealed?'Deine Stimmen bleiben bis zur gemeinsamen Auflösung geheim.':'Prüfe jeden Begriff. Deine Auswahl bleibt bis zur Auflösung privat.'}</p></div><button type="button" onClick={showBook}>Bühnenbuch ansehen</button></header>
  <p className="auction-jury-progress" role="status">{sealed?`${words.length} Begriffe festgelegt`: `${summary.reviewed} / ${words.length} geprüft · ${summary.open} noch offen`}</p>
  {!sealed&&<p className="auction-jury-help">Bühnenbuch und Jurybuch zeigen dieselbe Seite. Wähle auf der Bühne einen Begriff, um ihn hier zu prüfen.</p>}
  <nav className="auction-book-nav" aria-label="Seiten in deinem Jurybuch"><button type="button" aria-label="Vorherige Begriffe auf der Bühne" disabled={sheet.page===0} onClick={()=>page(sheet.page-1)}>←</button><span>Seite {sheet.page+1} / {pages}</span><button type="button" aria-label="Nächste Begriffe auf der Bühne" disabled={sheet.page===pages-1} onClick={()=>page(sheet.page+1)}>→</button>{!sealed&&<button type="button" disabled={!summary.open} onClick={openNext}>Offene Begriffe</button>}</nav>
  <div className="auction-ballot">{words.slice(sheet.page*6,sheet.page*6+6).map((word:string,row:number)=>{const index=sheet.page*6+row,selection=displayed[index];return <div key={index} data-jury-word={index} data-active={sheet.active===index}><strong><small>{index+1}.</small> {word}</strong><div role="group" aria-label={`Bewertung für ${word}`}>{([[true,'✓ Gültig'],[false,'✕ Ungültig'],[null,'– Enthalten']] as const).map(([value,label])=><button type="button" key={String(value)} disabled={sealed||busy} className={selection===value?'chosen':''} aria-pressed={selection===value} onClick={()=>change(index,value)}>{label}</button>)}</div><small>{selection==='open'?'Noch nicht geprüft':selection===true?'Zählt für das Gebot':selection===false?'Zählt nicht für das Gebot':'Enthaltung · keine Ja- oder Nein-Stimme'}</small></div>;})}</div>
  {!sealed&&<><p className="auction-jury-help">{summary.yes} gültig · {summary.no} ungültig · {summary.abstain} Enthaltungen. Offene Begriffe werden bei Abgabe oder Zeitablauf als Enthaltung behandelt.</p>{confirm?<div className="auction-jury-confirm" role="group" aria-label="Offene Bewertungen bestätigen"><p>Noch {summary.open} Begriffe sind offen. Für sie enthältst du dich.</p><button type="button" disabled={busy} onClick={()=>setConfirm(false)}>Weiter prüfen</button><button type="button" className="primary" disabled={busy} onClick={()=>void submit()}>Mit {summary.open} offenen Begriffen festlegen</button></div>:<button type="button" className="primary" disabled={!restored||busy} onClick={()=>summary.open?setConfirm(true):void submit()}>{busy?'Wird versiegelt …':'Bewertung festlegen'}</button>}</>}
 {error&&!sealed&&<p className="submission-error" role="alert">{error}</p>}
 </section>;
}
