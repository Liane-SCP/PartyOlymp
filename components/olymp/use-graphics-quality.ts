"use client";
import {useCallback, useEffect, useState} from 'react';
import {validQuality, type QualityChoice} from '@/lib/adventure-quality';

const key = 'olymp.graphics', eventName = 'olymp:graphics';

/** One preference for the world and game stages, including simultaneously open views. */
export function useGraphicsQuality() {
  const [quality, setQuality] = useState<QualityChoice>('auto');
  useEffect(() => {
    const read = () => { try { setQuality(validQuality(localStorage.getItem(key))); } catch {} };
    const changed = (event: Event) => setQuality(validQuality((event as CustomEvent).detail));
    const stored = (event: StorageEvent) => { if (event.key === key || event.key === null) read(); };
    read();
    window.addEventListener(eventName, changed);
    window.addEventListener('storage', stored);
    return () => { window.removeEventListener(eventName, changed); window.removeEventListener('storage', stored); };
  }, []);
  const choose = useCallback((value: QualityChoice) => {
    const next = validQuality(value);
    setQuality(next);
    try { localStorage.setItem(key, next); } catch {}
    window.dispatchEvent(new CustomEvent(eventName, {detail: next}));
  }, []);
  return [quality, choose] as const;
}
