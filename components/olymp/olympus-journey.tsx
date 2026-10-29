"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Compass, Gem, LockKeyhole, PackageOpen, Sparkles, Trophy } from "lucide-react";
import { byId } from "@/lib/game/catalog";
import { isBoss } from "@/lib/game/boss-rules";
import { journeyRealm, relicInfo, relics, type Relic } from "@/lib/game/journey";
import { Avatar, GameIcon } from "./art";
import { sound } from "@/lib/audio";
import { JourneyMap } from "./journey-map";
import { islandThemes } from "@/lib/journey-world";

export function OlympusJourney({ room, me, reduced, act }: {
  room: any; me: string; reduced: boolean; act: (a: any) => Promise<unknown>;
}) {
  const compact = ["playing", "countdown", "reveal", "podium"].includes(room.phase);
  const [expanded, setExpanded] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  useEffect(() => { const query = matchMedia('(min-width: 1100px)'); const update = () => setDesktop(query.matches); update(); query.addEventListener('change', update); return () => query.removeEventListener('change', update); }, []);
  const open = !compact || expanded;
  const [selected, setSelected] = useState(room.index);
  const [pending, setPending] = useState(false);
  const focused = useRef<HTMLButtonElement>(null);
  const journey = room.journey;
  const completed = room.history.length;
  const selectedGame = room.selection[selected] ?? room.selection[room.index];
  const realm = islandThemes[selectedGame.id as keyof typeof islandThemes] ?? journeyRealm(selectedGame.id);
  const own = room.players.find((p: any) => p.id === me);
  const equipped = journey?.equipped.find((e: any) => e.player === me);
  const canEquip = room.phase === "rules" && !own?.ready && !own?.spectator && !equipped;
  const activeCrew = room.players.filter((p: any) => room.participantIds.includes(p.id));
  useEffect(() => { setSelected(room.index); setExpanded(false); }, [room.index, room.phase]);
  useEffect(() => {
    const button = focused.current, route = button?.parentElement;
    if (button && route) route.scrollTo({ left: button.offsetLeft - route.offsetLeft - route.clientWidth / 2 + button.clientWidth / 2, behavior: "instant" });
  }, [selected, open]);
  const send = async (a: any) => { if (pending) return; setPending(true); try { const result = await act(a); if (result) sound.play("confirm"); } finally { setPending(false); } };
  const reward = journey?.lastRewards?.index === room.index ? journey.lastRewards : null;
  const mineReward = reward?.rows.find((row: any) => row.player === me);
  return <section className={`olympus-journey ${open ? "is-open" : "is-compact"} ${inventoryOpen ? 'inventory-open' : ''} ${expanded ? 'map-expanded' : ''}`} aria-label="Eure Reise zum Olymp" style={{ "--realm": realm.color } as CSSProperties}>
    <header className="journey-heading">
      <div className="journey-heading-icon"><Compass size={22} /></div>
      <div><span className="journey-eyebrow">EURE ODYSSEE</span><h2>{room.phase === "podium" ? "Ihr habt den Olymp erreicht." : "Eine ganze Welt wartet auf euch."}</h2></div>
      <div className="journey-progress"><strong>{completed}<small> / {room.selection.length}</small></strong><span>ETAPPEN</span></div>
      {desktop && journey && ['rules','standings','paused'].includes(room.phase) && <button className="desktop-relic-toggle secondary" aria-expanded={inventoryOpen} onClick={() => setInventoryOpen(v => !v)}>{inventoryOpen ? 'Relikte schließen' : `Relikte${journey.chests ? ' · Truhe öffnen' : ''}`}</button>}
      {compact && <button className="journey-expand" aria-expanded={expanded} aria-label="Reisekarte anzeigen" onClick={() => setExpanded(v => !v)}><ChevronDown size={18} /></button>}
    </header>
    {open && <>
      <JourneyMap selection={room.selection} selected={selected} current={room.index} crew={activeCrew} completed={completed} trophies={journey?.trophies ?? []} reduced={reduced} onSelect={setSelected}
        me={me} canMove={!own?.spectator&&room.phase!=="podium"} moves={journey?.moves} travel={journey?.travel} emotes={(room.emotes??[]).filter((e:any)=>!sound.settings.mutedPlayers.includes(e.player))} serverTime={room.serverTime} act={act}/>
      <nav className="journey-route" aria-label="Etappen der Olympiade">
        {room.selection.map((s: any, i: number) => <button key={i} ref={i === selected ? focused : undefined} aria-current={i === room.index ? "step" : undefined} aria-pressed={selected === i} className={`${i < completed ? "is-complete" : ""} ${isBoss(s.id) ? "is-boss" : ""}`} onClick={() => setSelected(i)}>
          <span>{i < completed ? "✓" : String(i + 1).padStart(2, "0")}</span><GameIcon id={s.id}/><strong>{byId(s.id).name}</strong>{isBoss(s.id) && <small>BOSS</small>}
        </button>)}
        <div className="journey-destination"><Trophy size={18}/><span>DER OLYMP</span></div>
      </nav>
      <div className="journey-crew"><div className="journey-party">{activeCrew.map((p: any) => <Avatar key={p.id} avatar={p.avatar} color={p.color} look={p.look}/>)}<span>Eine Crew. Euer Abenteuer.</span></div>
        <div className="journey-trophies">{["colossus", "kraken", "dragon"].map(boss => {
          const won = journey?.trophies.some((t: any) => t.boss === boss && t.victory);
          const attempted = journey?.trophies.some((t: any) => t.boss === boss);
          return <span key={boss} className={won ? "is-earned" : ""} title={`${byId(boss as any).name}: ${won ? "Besiegt · Trophäe errungen" : attempted ? "Begegnet · nicht besiegt" : "Noch keine Trophäe"}`}><GameIcon id={boss as any}/>{won ? <Sparkles size={11}/> : <LockKeyhole size={10}/>}</span>;
        })}</div>
      </div>
    </>}
    {journey && !own?.spectator && ["rules", "standings", "paused"].includes(room.phase) && <div className="journey-inventory">
      <div className="journey-inventory-title"><Gem size={17}/><h3>Deine Relikte</h3><span>{journey.inventory.length}/5 im Rucksack</span></div>
      <p>{canEquip ? "Wähle ein Relikt für diese Disziplin. Danach meldest du dich bereit." : equipped ? `${relicInfo(equipped.kind)?.name} ist für diese Disziplin versiegelt.` : "Vor jeder Disziplin kannst du ein Relikt einsetzen. Alle starten mit denselben drei Relikten."}</p>
      {!!journey.equipped.length && <div className="journey-loadout" aria-label="Versiegelte Relikte der Crew">{journey.equipped.map((entry: any) => <span key={entry.player}>{room.players.find((p: any) => p.id === entry.player)?.name} · <b>{relicInfo(entry.kind)?.name}</b></span>)}</div>}
      <div className="relic-grid">{relics.map(info => {
        const items = journey.inventory.filter((r: Relic) => r.kind === info.id);
        return <article className={`relic-card ${!items.length ? "is-empty" : ""}`} key={info.id} style={{ "--relic": info.color } as CSSProperties}>
          <div className="relic-art" aria-hidden="true"><i/><b>{info.symbol}</b><i/></div>
          <div><span>{info.title}</span><h4>{info.name} <small>×{items.length}</small></h4><p>{info.description}</p></div>
          <button disabled={!canEquip || !items.length || pending} onClick={() => void send({ type: "relic", item: items[0].id })}>{equipped?.kind === info.id ? "Versiegelt ✓" : canEquip ? "Für diese Disziplin einsetzen" : "Vor der Disziplin einsetzbar"}</button>
        </article>;
      })}</div>
      {!!journey.chests && <div className="journey-chest"><PackageOpen size={27}/><div><strong>Eine Schatztruhe wartet auf dich. {journey.chests > 1 && `(${journey.chests})`}</strong><p>Nach jeder zweiten Etappe: Wähle ein neues Relikt für deinen weiteren Aufstieg.</p><div>{relics.map(info => <button key={info.id} disabled={pending || journey.inventory.length >= 5} onClick={() => void send({ type: "chest", kind: info.id })}>{info.symbol} {info.name}</button>)}</div>{journey.inventory.length >= 5 && <p>Dein Rucksack ist voll. Setze vor dem nächsten Spiel ein Relikt ein, dann kannst du die Truhe öffnen.</p>}</div></div>}
      {mineReward && <div className="journey-reward" role="status"><Sparkles size={16}/>{relicInfo(mineReward.kind)?.name}: {mineReward.bonus > 0 ? `+${mineReward.bonus.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Olympiadenpunkte` : "Dieses Mal kein Bonus – beim nächsten Aufstieg wartet eine neue Chance."}</div>}
      <small className="journey-fairness">Ein Relikt pro Disziplin · Beim Einsetzen verbraucht · Kein Bonus ohne gültiges Spielergebnis · Disziplinplätze bleiben unverändert</small>
    </div>}
    {equipped && compact && <div className="journey-equipped"><Gem size={13}/>{relicInfo(equipped.kind)?.name} aktiv</div>}
  </section>;
}
