"use client";
import {ColorConsoleMount} from './color-console-context';
import {ColorConsole} from './color-console';
import {SpectrumConsoleMount} from './spectrum-console-context';
import {PictureConsoleMount} from './picture-console-context';
import {PictureConsole} from './picture-console';
import {HerdThoughtMount} from './herd-thought-context';
import { useState, useEffect, useRef, useCallback } from "react";
import { Club21, ColorCards } from "./card-games";
import { WikiReader } from "./wiki-reader";
import {SizeConsoleMount} from './size-console-context';
import {SizeConsole} from './size-console';
import { SpectatorPanel } from "./spectator-panel";
import { BudgetBasket } from "./budget-basket";
import { Particles } from "./showtime";
import { sound } from "@/lib/audio";
import {DiceTableControls} from "./dice-table-controls";
import {DiceConsoleMount} from "./dice-console-context";
import { PlayGuide, LiveCrew } from "./play-context";
import { RoundReveal } from "./round-results";
import { Typeracer, Hivemind, Spectrum } from "./party-games";
import { GeoGame } from "./geo-game";
import {AtelierNotebookMount} from './atelier-notebook-context';
import { CategoriesGame } from "./categories-game";
import { ChainGame } from "./chain-game";
import { TopicWheel } from "./topic-wheel";
import { useDeadlineInput } from "./deadline-input";
import { AuctionGame, TimingGame, BombGame } from "./trio-games";
import { CodeGame } from "./code-game";
import { BossGame } from "./boss-game";
import { isBoss } from "@/lib/game/boss-rules";
import { AdventureStage } from "./adventure-stage";
import { AdventureDraft } from "./adventure-context";
import {CardTableView} from './card-view-context';
import {BombConsoleMount} from './bomb-console-context';
import {ChainConsoleMount} from './chain-console-context';
import {RaceConsoleMount} from './race-console-context';
export { RoundReveal } from "./round-results";
export function GameBoard(props:{room:any;me:string;now:number;act:(a:any)=>void|Promise<boolean>}) {
  const draftScope=JSON.stringify([props.room.code,props.room.startedAt,props.room.index,props.room.game.id,props.room.game.round,props.me]);
  const currentDraftScope=useRef(draftScope);currentDraftScope.current=draftScope;
  const [draftEntry,setDraftEntry]=useState<{scope:string;value:Record<string,unknown>}>(()=>({scope:draftScope,value:{}}));
  const draft=draftEntry.scope===draftScope?draftEntry.value:{};
  const consoleRef=useRef<HTMLDivElement>(null);
  const [sizeMount,setSizeMount]=useState<HTMLElement|null>(null);
  const [colorMount,setColorMount]=useState<HTMLElement|null>(null);
  const [pictureMount,setPictureMount]=useState<HTMLElement|null>(null);
  const [spectrumMount,setSpectrumMount]=useState<HTMLElement|null>(null);
  const [herdMount,setHerdMount]=useState<HTMLElement|null>(null),[herdFocused,setHerdFocused]=useState(false);
  const [atelierMount,setAtelierMount]=useState<HTMLElement|null>(null),[atelierWritingFocused,setAtelierWritingFocused]=useState(false);
  const [diceMount,setDiceMount]=useState<HTMLElement|null>(null);
  const [bombMount,setBombMount]=useState<HTMLElement|null>(null),[bombFocused,setBombFocused]=useState(false);
  const [chainMount,setChainMount]=useState<HTMLElement|null>(null),[chainFocused,setChainFocused]=useState(false);
  const [raceMount,setRaceMount]=useState<HTMLElement|null>(null),[raceFocused,setRaceFocused]=useState(false);
  const updateDraft=useCallback((patch:Record<string,unknown>)=>{
    if(currentDraftScope.current!==draftScope)return;
    setDraftEntry(previous=>currentDraftScope.current!==draftScope?previous:{scope:draftScope,value:{...(previous.scope===draftScope?previous.value:{}),...patch}});
  },[draftScope]);
  const [cardView,setCardView]=useState<'hand'|'table'|null>(null),[cardMount,setCardMount]=useState<HTMLElement|null>(null);
  const g=props.room.game,cardPersonal=g.id==='cards'&&props.room.phase==='playing'&&g.stage==='answer'&&!!g.mine&&cardView==='hand',cardExpanded=g.id==='cards'&&props.room.phase==='playing'&&cardView!==null;
  useEffect(()=>{if(g.id!=='herd'||g.stage!=='answer'||!g.mine||g.mine.submitted||g.mine.abandoned)setHerdFocused(false);},[g.id,g.stage,g.mine?.submitted,g.mine?.abandoned,!!g.mine]);
  useEffect(()=>{if(g.id!=='categories'||g.stage!=='answer'||!g.mine||g.mine.submitted||g.mine.abandoned)setAtelierWritingFocused(false);},[g.id,g.stage,g.mine?.submitted,g.mine?.abandoned,!!g.mine]);
  useEffect(()=>{if(g.id!=='chain'||g.stage!=='answer'||g.turnId!==props.me)setChainFocused(false);},[g.id,g.stage,g.turnId,props.me]);
  useEffect(()=>{if(g.id!=='bomb'||g.stage!=='word'||g.turnId!==props.me)setBombFocused(false);},[g.id,g.stage,g.turnId,props.me]);
  useEffect(()=>{if(g.id!=='cards'||props.room.phase!=='playing')setCardView(null);else if(g.stage!=='answer')setCardView(v=>v==='hand'?'table':v);},[g.id,g.stage,props.room.phase]);
  const toggleCardView=useCallback(()=>setCardView(v=>v==='hand'?'table':'hand'),[]),expandCardTable=useCallback(()=>setCardView('table'),[]);
  const leaveCardView=useCallback(()=>{setCardView(null);requestAnimationFrame(()=>{consoleRef.current?.focus({preventScroll:true});consoleRef.current?.scrollIntoView({block:'start',behavior:'instant'});});},[]);
  useEffect(()=>setRaceFocused(false),[g.id]);
  if(isBoss(g.id))return <GameControls {...props}/>;
  const pick=(key:string)=>{
    const [kind,raw]=key.split(":"),index=Number(raw),p=g.mine;
    if(kind==='diceResult'&&g.id==='dice'&&['roundReveal','done'].includes(g.stage)){consoleRef.current?.querySelector('.dice-results')?.dispatchEvent(new CustomEvent('olymp-dice-result',{detail:{id:raw}}));return;}
    if(kind==='diceSheet'&&g.id==='dice'){consoleRef.current?.closest('.adventure-session')?.querySelector('.dice-table-controls')?.dispatchEvent(new Event('olymp-dice-sheet'));return;}
    if(kind==='wikiRead'){const session=consoleRef.current?.closest('.adventure-session'),field=consoleRef.current?.querySelector<HTMLElement>('.wiki-article h2')??consoleRef.current;session?.querySelector('.adventure-stage')?.dispatchEvent(new Event('olymp-wiki-read'));requestAnimationFrame(()=>{field?.focus();field?.scrollIntoView({block:'center',behavior:'instant'});});return;}
    if(g.id==='geo'&&(kind==="geoMap"||kind==="geoPhoto")){const arena=consoleRef.current?.querySelector<HTMLElement>(".geo-arena");arena?.dispatchEvent(new CustomEvent("olymp-geo-view",{detail:kind==="geoMap"?"map":"photo"}));requestAnimationFrame(()=>{const node=consoleRef.current?.querySelector<HTMLElement>(kind==="geoMap"?".street-map":".geo-panorama canvas");node?.focus({preventScroll:true});});return;}
    if(!p||p.submitted||p.abandoned)return;
    if(kind==='auctionReview'&&g.id==='auction'&&g.stage==='judge'&&g.leader!==props.me){consoleRef.current?.querySelector('[data-auction-jury]')?.dispatchEvent(new CustomEvent('olymp-auction-review',{detail:{index}}));return;}
    if(kind==='chainAnswer'){if(g.id==='chain'&&g.turnId===props.me)consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLInputElement>('[data-chain-console] input')?.focus({preventScroll:true});return;}
    if(kind==='category'){const dock=consoleRef.current?.closest('.adventure-session')?.querySelector('.atelier-writing-dock');if(dock?.querySelector('[data-atelier-notebook]')){dock.dispatchEvent(new CustomEvent('olymp-atelier-category',{detail:{index}}));return;}}
    if(kind==="category"||kind==="bombWord"){if(kind==="bombWord"&&g.turnId!==props.me)return;const input=kind==="category"?consoleRef.current?.querySelectorAll<HTMLInputElement>(".words-sheet input")[index]:consoleRef.current?.closest(".adventure-session")?.querySelector<HTMLInputElement>("[data-bomb-entry] input");if(input&&!input.disabled){if(kind==='bombWord')input.focus({preventScroll:true});else{input.focus({preventScroll:true});requestAnimationFrame(()=>input.scrollIntoView({block:"center",behavior:"auto"}));}}return;}
    if(kind==="spectrumDial"||kind==="spectrumPreview"){const control=consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLInputElement>('.spectrum-controls input[type="range"]');if(control&&!control.disabled)control.dispatchEvent(new CustomEvent('olymp-spectrum',{detail:{value:index,commit:kind==="spectrumDial"}}));return;}
    if(kind==='herdAnswer'&&g.id==='herd'){consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLInputElement>('[data-herd-entry] input')?.focus({preventScroll:true});return;}

    if(kind==="colorDial"){const control=consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLElement>('[data-color-controls]');if(control)control.dispatchEvent(new CustomEvent('olymp-color',{detail:{channel:index,value:Number(key.split(':')[2])}}));return;}
    if(kind==="sizeModel"){consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLElement>('[data-size-controls]')?.dispatchEvent(new CustomEvent('olymp-size',{detail:{value:index}}));return;}
    if(kind==="geoPin"){const node=consoleRef.current?.querySelector<HTMLElement>('.geo-arena');node?.dispatchEvent(new CustomEvent('olymp-geopin',{detail:{lat:index,lon:Number(key.split(':')[2])}}));return;}
    let target:HTMLButtonElement|undefined;
    if(kind==='casinoBetChoice'&&g.id==='blackjack')target=Array.from(consoleRef.current?.querySelectorAll<HTMLButtonElement>('.bet-options > button')??[]).find(button=>Number(button.dataset.casinoBet)===index);
    if(kind==="geoConfirm")target=consoleRef.current?.querySelector<HTMLButtonElement>('.geo-confirm button')??undefined;
    if(kind==="sizeConfirm")target=consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLButtonElement>('[data-action="confirm-size"]')??undefined;
    if(kind==="colorConfirm")target=consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLButtonElement>('[data-action="confirm-color"]')??undefined;
    if(kind==="spectrumLock")target=consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLButtonElement>(".spectrum-controls > button.primary")??undefined;
    if(kind==="wikiLink")target=consoleRef.current?.querySelectorAll<HTMLButtonElement>(".wiki-links > button")[index];
    if(kind==="die")target=consoleRef.current?.closest(".adventure-session")?.querySelectorAll<HTMLButtonElement>(".dice-tray > button")[index];
    if(kind==="diceRoll"&&g.id==="dice")target=consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLButtonElement>('.dice-table-controls .action-row > button.primary')??undefined;
    if(kind==="card"&&g.id==="cards")target=consoleRef.current?.closest(".adventure-session")?.querySelector<HTMLButtonElement>(`[data-card-index="${index}"]`)??undefined;
    if(kind==='cardDraw'&&g.id==='cards')target=consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLButtonElement>('[data-card-draw]')??undefined;
    if(kind==='cardPage'&&g.id==='cards')target=consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLButtonElement>(raw==='next'?'.card-scene-next':'.card-scene-previous')??undefined;
    if(kind==="codeSlot")target=consoleRef.current?.querySelectorAll<HTMLButtonElement>(".code-slots > button")[index];
    if(kind==="codeColor")target=consoleRef.current?.querySelectorAll<HTMLButtonElement>(".code-palette > button")[index];
    if(kind==="codeConfirm")target=consoleRef.current?.querySelector<HTMLButtonElement>(".code-submit")??undefined;
    if(kind==="auctionBid")target=consoleRef.current?.querySelector<HTMLButtonElement>(".auction-controls > button.primary")??undefined;
    if(kind==="clock")target=consoleRef.current?.querySelector<HTMLButtonElement>(".clock-button")??undefined;
    if(kind==="casino"&&g.id==="blackjack")target=raw==="bet"?consoleRef.current?.querySelector<HTMLButtonElement>(".bet-panel > button.primary")??undefined:consoleRef.current?.querySelectorAll<HTMLButtonElement>(".club-actions > button")[raw==="hit"?0:1];
    if(kind==="offer")target=consoleRef.current?.querySelectorAll<HTMLButtonElement>(".product-grid > button")[index];
    if(kind==="buzz")target=consoleRef.current?.closest('.adventure-session')?.querySelector<HTMLButtonElement>(".pixel-buzzer button")??undefined;
    if(target&&!target.disabled){if(kind==="clock")target.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,button:0}));target.click();if(kind!=="clock"&&kind!=="wikiLink")sound.play("click");}
  };
  return <SizeConsoleMount.Provider value={sizeMount}><ColorConsoleMount.Provider value={colorMount}><PictureConsoleMount.Provider value={pictureMount}><SpectrumConsoleMount.Provider value={spectrumMount}><HerdThoughtMount.Provider value={{element:herdMount,focused:herdFocused,enter:()=>{if(g.id==='herd'&&g.stage==='answer'&&g.mine&&!g.mine.submitted&&!g.mine.abandoned)setHerdFocused(true);},leave:()=>setHerdFocused(false)}}><AtelierNotebookMount.Provider value={{element:atelierMount,focused:atelierWritingFocused,enter:()=>{if(g.id==='categories'&&g.stage==='answer'&&g.mine&&!g.mine.submitted&&!g.mine.abandoned)setAtelierWritingFocused(true);},leave:()=>setAtelierWritingFocused(false)}}><CardTableView.Provider value={{focused:cardPersonal,expanded:cardExpanded,mount:cardMount,exit:leaveCardView}}><AdventureDraft.Provider value={updateDraft}><DiceConsoleMount.Provider value={diceMount}><BombConsoleMount.Provider value={{element:bombMount,enter:()=>{if(matchMedia('(max-width:600px)').matches)setBombFocused(true);}}}><ChainConsoleMount.Provider value={{element:chainMount,enter:()=>{if(matchMedia('(max-width:600px)').matches)setChainFocused(true);}}}><RaceConsoleMount.Provider value={{element:raceMount,enter:()=>{if(matchMedia('(max-width:600px)').matches)setRaceFocused(true);}}}><div className={`adventure-session adventure-mode-${g.id}`}><AdventureStage room={props.room} me={props.me} now={props.now} draft={draft} onPick={pick} onSizeMount={setSizeMount} onColorMount={setColorMount} onPictureMount={setPictureMount} onSpectrumMount={setSpectrumMount} onHerdMount={setHerdMount} herdFocused={herdFocused} onHerdExit={()=>setHerdFocused(false)} onAtelierMount={setAtelierMount} atelierWritingFocused={atelierWritingFocused} onAtelierExit={()=>setAtelierWritingFocused(false)} onDiceMount={setDiceMount} onChainMount={setChainMount} chainFocused={chainFocused} onChainExit={()=>setChainFocused(false)} onBombMount={setBombMount} bombFocused={bombFocused} onBombExit={()=>setBombFocused(false)} onRaceMount={setRaceMount} raceFocused={raceFocused} onRaceExit={()=>setRaceFocused(false)} cardFocused={cardPersonal} cardExpanded={cardExpanded} onCardFocus={toggleCardView} onCardExpand={expandCardTable} onCardExit={leaveCardView} onCardMount={setCardMount}/><div className="adventure-console" ref={consoleRef} inert={cardExpanded||bombFocused||chainFocused||atelierWritingFocused||herdFocused||undefined} tabIndex={-1} role="region" aria-label="Spielpult"><GameControls {...props} onDraft={updateDraft}/></div></div></RaceConsoleMount.Provider></ChainConsoleMount.Provider></BombConsoleMount.Provider></DiceConsoleMount.Provider></AdventureDraft.Provider></CardTableView.Provider></AtelierNotebookMount.Provider></HerdThoughtMount.Provider></SpectrumConsoleMount.Provider></PictureConsoleMount.Provider></ColorConsoleMount.Provider></SizeConsoleMount.Provider>;
}
function GameControls({
  room,
  me,
  now,
  act,
  onDraft,
}: {
  room: any;
  me: string;
  now: number;
  act: (a: any) => void | Promise<boolean>;
  onDraft?:(draft:any)=>void;
}) {
  const g = room.game,
    p = g.mine;
  const [zeroCategory, setZeroCategory] = useState<number | null>(null);
  useEffect(
    () => setZeroCategory(null),
    [g.round, g.turn, p?.rollId, p?.submitted],
  );
  const name = (id: string) =>
    room.players.find((p: any) => p.id === id)?.name ?? "Spieler";
  useDeadlineInput(room,act,p&&!p.submitted&&g.id==="dice"&&zeroCategory!==null?{type:"category",index:zeroCategory}:null);
  if (isBoss(g.id)) return <BossGame room={room} me={me} now={now} act={act} />;
  if (g.id === "chain" && ["topicSuggest", "topicSpin"].includes(g.stage))
    return <TopicWheel key={`topic-${g.round}`} room={room} me={me} act={act} now={now} />;
  if (g.stage === "roundReveal" || g.stage === "done")
    return (
      <RoundReveal g={g} name={name} now={now} me={me} players={room.players} />
    );
  if (g.id === 'picture' && (!p || p.abandoned))
    return <section className="picture-spectator" data-picture-spectator aria-label="Pixelblitz live verfolgen">
      <span>ZUSCHAUER IM STUDIO</span>
      <h2 aria-live="polite">{g.buzzer?`${name(g.buzzer)} ist am Buzzer`:'Wer erkennt das Bild?'}</h2>
      {g.buzzer?<p>Nur dieser Buzzer darf antworten. <strong role="timer" aria-label="Verbleibende Antwortzeit">{Math.max(0,Math.ceil((g.buzzDeadline-now)/1000))} s</strong></p>:<p>Das Bild wird klarer. Beim nächsten Buzzer folgt die Kamera dem Spieler.</p>}
      <details className="party-crew-progress"><summary>Spielstände der Crew</summary><LiveCrew room={room} me={me} now={now}/></details>
      <small>{p?.abandoned?'Beim nächsten Spiel bist du wieder dabei.':'Du kannst bei der nächsten Olympiade mitspielen.'}</small>
    </section>;
  if (p?.abandoned) return <SpectatorPanel room={room} me={me} now={now}/>;
  if (!p && g.id === "code") return <CodeGame room={room} me={me} act={act} />;
  if (!p && g.id === "auction") return <AuctionGame room={room} me={me} now={now} act={act} />;
  if (!p) return <SpectatorPanel room={room} me={me} now={now}/>;
  if(g.id==="size")return <SizeConsole key={`size-${g.round}`} room={room} me={me} act={act}/>;
  return (
    <div className={`game-board board-${g.id}`}>
      <PlayGuide g={g} me={me} now={now} />
      {!["cards", "code", "dice"].includes(g.id) && (
        <details className="party-crew-progress"><summary>Spielstände der Crew</summary><LiveCrew room={room} me={me} now={now} /></details>
      )}
      <div className="play-surface">
        {g.id === "code" && (
          <CodeGame key={`code-${g.round}`} room={room} me={me} act={act} />
        )}
        {g.id === "auction" && (
          <AuctionGame
            key={`auction-${g.round}`}
            room={room}
            me={me}
            now={now}
            act={act}
          />
        )}
        {g.id === "timing" && (
          <TimingGame
            key={`timing-${g.round}`}
            room={room}
            me={me}
            now={now}
            act={act}
          />
        )}
        {g.id === "bomb" && (
          <BombGame
            key={`bomb-${g.round}`}
            room={room}
            me={me}
            now={now}
            act={act}
          />
        )}
        {g.id === "chain" && (
          <ChainGame key={`chain-${g.round}`} room={room} me={me} act={act} now={now} />
        )}
        {g.id === "categories" && (
          <CategoriesGame
            key={`categories-${g.round}`}
            room={room}
            me={me}
            act={act}
            now={now}
          />
        )}
        {g.id === "geo" && (
          <GeoGame key={`geo-${g.round}`} room={room} me={me} act={act} />
        )}
        {g.id === "typer" && (
          <Typeracer
            key={`typer-${g.round}`}
            room={room}
            me={me}
            now={now}
            act={act}
          />
        )}
        {g.id === "herd" && (
          <Hivemind
            key={`herd-${g.round}`}
            room={room}
            me={me}
            now={now}
            act={act}
          />
        )}
        {g.id === "spectrum" && (
          <Spectrum
            key={`spectrum-${g.round}`}
            room={room}
            me={me}
            now={now}
            act={act}
          />
        )}
        {p.submitted && g.id !== "code" && (
          <div
            className="commit-seal"
            role="status"
            key={`${g.round}:${g.turn}:${g.volley}`}
          >
            <Particles seed={`${g.round}:${g.turn}:${g.volley}`} />✓ Gesichert{" "}
            <span>
              {g.id === "picture"
                ? "Richtig erkannt"
                : "Deine Entscheidung steht"}
            </span>
          </div>
        )}
        {g.id === "dice" && <DiceTableControls room={room} me={me} now={now} act={act} zeroCategory={zeroCategory} setZeroCategory={setZeroCategory}/>}
        {g.id==='picture'&&<PictureConsole room={room} me={me} now={now} act={act}/>}
        {g.id === "budget" && <BudgetBasket key={`basket-${g.round}`} room={room} me={me} act={act} onDraft={onDraft}/>}
        {g.id === "color" && <ColorConsole key={`color-${g.round}`} room={room} me={me} now={now} act={act}/>}
        {g.id === "blackjack" && (
          <Club21 room={room} g={g} players={room.players} me={me} act={act} />
        )}
        {g.id === "cards" && (
          <ColorCards
            room={room}
            g={g}
            players={room.players}
            me={me}
            now={now}
            act={act}
          />
        )}

        {g.id === "wiki" && <WikiReader g={g} act={act} />}
      </div>
    </div>
  );
}
