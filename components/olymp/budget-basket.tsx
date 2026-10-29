"use client";

import { useEffect, useState } from "react";
import { sound } from "@/lib/audio";
import { useDeadlineInput } from "./deadline-input";
import { useGameSubmission } from "./use-game-submission";

const emptyBasket: string[] = [];

export function BudgetBasket({ room, me, act, onDraft }: {
  room: any;
  me: string;
  act: (action: any) => void | Promise<boolean>;
  onDraft?: (draft: any) => void;
}) {
  const game = room.game;
  const mine = game.mine;
  const key = `olymp.basket:${room.code}:${room.phaseKey.split(":")[0]}:${room.index}:${game.round}:${me}`;
  const [entry, setEntry] = useState<{ key: string; ids: string[]; changed: boolean }>({ key: "", ids: [], changed: false });
  const { pending, error, clearError, submit } = useGameSubmission(act, key);
  const restored = entry.key === key;
  const locked = !!mine.submitted;
  const basket: string[] = locked ? mine.answer ?? emptyBasket : restored ? entry.ids : emptyBasket;
  const canChange = restored && game.stage === "answer" && !mine.abandoned && !locked && !pending;
  const selected = game.items.filter((item: any) => basket.includes(item.id));

  useEffect(() => {
    let ids: string[] = [];
    let changed = false;
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
      if (Array.isArray(saved?.ids)) {
        ids = [...new Set<string>(saved.ids.filter((id: unknown) => typeof id === "string" && game.items.some((item: any) => item.id === id)))];
        changed = !!saved.changed;
      }
    } catch {}
    setEntry({ key, ids, changed });
  }, [key]);
  useEffect(() => {
    if (!restored) return;
    onDraft?.({ basket, basketPending: pending });
    try {
      if (locked) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify({ ids: entry.ids, changed: entry.changed }));
    } catch {}
  }, [restored, key, entry, locked, basket, pending, onDraft]);
  useDeadlineInput(room, act, restored && game.stage === "answer" && !locked && !mine.abandoned && entry.changed
    ? { type: "answer", value: basket, round: game.round }
    : null);

  function toggle(id: string) {
    if (!canChange) return;
    sound.init();
    sound.play("basket");
    clearError();
    setEntry((previous) => ({ ...previous, changed: true, ids: previous.ids.includes(id)
      ? previous.ids.filter((candidate) => candidate !== id)
      : [...previous.ids, id] }));
  }

  return (
    <section className="budget-basket" aria-label="Dein privater Warenkorb" data-restored={restored}>
      <div className="budget-title">
        <span>Dein Limit</span>
        <strong>{(game.budget / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</strong>
        <small>{game.priceNotice}</small>
      </div>
      <div className="product-grid">
        {game.items.map((item: any) => (
          <button key={item.id} className={basket.includes(item.id) ? "selected" : ""} aria-pressed={basket.includes(item.id)} disabled={!canChange} onClick={() => toggle(item.id)}>
            <span className="product-photo"><img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" /></span>
            <span>{item.name}</span>
            <small>{basket.includes(item.id) ? "✓ im Korb · entfernen" : `${item.category ?? "Artikel"} · einpacken +`}</small>
          </button>
        ))}
      </div>
      <div className="budget-basket-contents">
        <strong>{locked ? "Dein abgegebener Korb" : "In deinem privaten Korb"}</strong>
        {selected.length > 0 ? <ul aria-label="Eingepackte Produkte" tabIndex={0}>
          {selected.map((item: any) => <li key={item.id}><span>{item.name}</span>{!locked && <button type="button" className="text-button" disabled={!canChange} aria-label={`${item.name} zurücklegen`} onClick={() => toggle(item.id)}>Zurücklegen</button>}</li>)}
        </ul> : <p>Dein Korb ist noch leer. Packe Produkte aus dem Kaufhaus ein.</p>}
      </div>
      <div className="basket-checkout">
        <div>
          <strong>{basket.length}<small> / {game.items.length} Produkte</small></strong>
          <span>{locked ? "Deine Auswahl ist bestätigt. Die Preise werden gemeinsam aufgedeckt." : "Mehr Produkte gewinnen. Über Budget gibt es 0 Punkte."}</span>
        </div>
        <button type="button" className="primary wide" disabled={!canChange || !basket.length} onClick={() => void submit({ type: "answer", value: basket, round: game.round })}>
          {locked ? "✓ Warenkorb abgegeben" : pending ? "Korb wird abgegeben …" : `Korb mit ${basket.length} Produkten abgeben`}
        </button>
        {!locked && error && <p className="submission-error" role="alert">{error}</p>}
      </div>
    </section>
  );
}
