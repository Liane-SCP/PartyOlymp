"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "./art";
import { emoteCategories, emoteNames } from "@/lib/emotes";
import type { Appearance } from "@/lib/appearance";
export function EmotePicker({
  look,
  avatar,
  color,
  onSend,
  favorites,
  onFavorites,
  onClose,
}: {
  look?: Appearance;
  avatar?: number;
  color?: string;
  onSend: (id: number) => void;
  favorites: number[];
  onFavorites: (ids: number[]) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState(0),
    [replacement, setReplacement] = useState<number | null>(null);
  const menu = useRef<HTMLDivElement>(null);
  const categoryId = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const node = menu.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node?.querySelector<HTMLButtonElement>('.emote-menu-heading button')?.focus({preventScroll:true});
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !node?.contains(event.target) && !opener?.contains(event.target)) close.current();
    };
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      queueMicrotask(() => {
        if(node?.isConnected)return;
        if (opener?.isConnected && (document.activeElement === document.body || node?.contains(document.activeElement))) opener.focus({preventScroll:true});
      });
    };
  }, []);
  const toggle = (id: number) => {
    if (favorites.includes(id)) {
      onFavorites(favorites.filter((x) => x !== id));
      setReplacement(null);
    } else if (favorites.length < 6) {
      onFavorites([...favorites, id]);
      setReplacement(null);
    } else setReplacement(id);
  };
  return (
    <div ref={menu} className="emote-picker reaction-studio direct-emotes" role="dialog" aria-label="Emotes und Favoriten" onKeyDown={event => {
      if (event.defaultPrevented || event.nativeEvent.isComposing) return;
      if (event.key === 'Escape') {
        event.preventDefault();event.stopPropagation();
        if (replacement !== null) setReplacement(null);else onClose();
        return;
      }
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || !/^[1-6]$/.test(event.key)) return;
      const slot = Number(event.key) - 1, id = favorites[slot];
      if (id === undefined) return;
      event.preventDefault();event.stopPropagation();
      if (replacement !== null) {
        onFavorites(favorites.map((value,index) => index === slot ? replacement : value));
        setReplacement(null);
      } else onSend(id);
    }}>
      <div className="emote-menu-heading">
        <div>
          <strong>
            Alle Emotes <small>{emoteNames.length}</small>
          </strong>
          <p>Emote anklicken und direkt senden.</p>
        </div>
        <button
          type="button"
          aria-label="Emote-Menü schließen"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="emote-favorite-heading">
        <strong>
          ★ Deine Schnellleiste <small>{favorites.length}/6</small>
        </strong>
        <span>Tasten 1–6</span>
      </div>
      <div className={`emote-slots ${replacement !== null ? "replacing" : ""}`}>
        {Array.from({ length: 6 }, (_, slot) => {
          const id = favorites[slot];
          return (
            <button
              type="button"
              key={slot}
              disabled={id === undefined}
              aria-label={
                id === undefined
                  ? `Platz ${slot + 1} frei`
                  : replacement !== null
                    ? `${emoteNames[id]} durch ${emoteNames[replacement]} ersetzen`
                    : `${emoteNames[id]} senden · Taste ${slot + 1}`
              }
              onClick={() => {
                if (replacement !== null) {
                  onFavorites(
                    favorites.map((x, i) => (i === slot ? replacement : x)),
                  );
                  setReplacement(null);
                } else onSend(id);
              }}
            >
              {id === undefined ? (
                <span className="empty-slot">☆</span>
              ) : (
                <Avatar look={look} avatar={avatar} color={color} emote={id} />
              )}
              <kbd>{slot + 1}</kbd>
              {id !== undefined && replacement !== null && (
                <span className="slot-remove">
                  ↻
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="emote-favorite-help" role="status">
        {replacement !== null ? (
          <>
            <span>
              Welchen Platz soll „{emoteNames[replacement]}“ übernehmen? Anklicken oder Taste 1–6.
            </span>
            <button type="button" onClick={() => setReplacement(null)}>
              Abbrechen
            </button>
          </>
        ) : (
          <span>Favorit anklicken oder Taste 1–6: senden. Mit ★ unten verwalten.</span>
        )}
      </div>
      <div
        className="reaction-tabs"
        role="tablist"
        aria-label="Emote-Kategorien"
      >
        {emoteCategories.map((c, i) => (
          <button
            type="button"
            role="tab"
            aria-selected={category === i}
            id={`${categoryId}-tab-${i}`}
            aria-controls={`${categoryId}-panel`}
            tabIndex={category === i ? 0 : -1}
            key={c.name}
            onClick={() => setCategory(i)}
            onKeyDown={event => {
              const count = emoteCategories.length;
              const next = event.key === 'ArrowRight' ? (i + 1) % count : event.key === 'ArrowLeft' ? (i - 1 + count) % count : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : null;
              if (next === null) return;
              event.preventDefault();event.stopPropagation();setCategory(next);
              document.getElementById(`${categoryId}-tab-${next}`)?.focus({preventScroll:true});
            }}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="reaction-grid" role="tabpanel" id={`${categoryId}-panel`} aria-labelledby={`${categoryId}-tab-${category}`}>
        {emoteCategories[category].ids.map((i) => (
          <div className="emote-choice" key={i}>
            <button
              type="button"
              className="emote-send-choice"
              aria-label={`${emoteNames[i]} senden`}
              onClick={() => onSend(i)}
            >
              <Avatar look={look} avatar={avatar} color={color} emote={i} />
              <span>{emoteNames[i]}</span>
            </button>
            <button
              type="button"
              className={`emote-star ${favorites.includes(i) ? "selected" : ""}`}
              aria-label={`${emoteNames[i]} ${favorites.includes(i) ? "aus Favoriten entfernen" : "zu Favoriten hinzufügen"}`}
              aria-pressed={favorites.includes(i)}
              onClick={() => toggle(i)}
            >
              {favorites.includes(i) ? "★" : "☆"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
