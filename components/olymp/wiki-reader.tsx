"use client";
import { memo, useEffect, useRef, useState } from "react";
import {sound} from '@/lib/audio';
const ArticleBody = memo(function ArticleBody({
  html,
  bodyRef,
}: {
  html: string;
  bodyRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={bodyRef}
      className="wiki-full"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
export function WikiReader({ g, act }: { g: any; act: (a: any) => void | Promise<boolean> }) {
  const article = g.article,
    body = useRef<HTMLDivElement>(null),
    scroll = useRef<HTMLDivElement>(null),
    callback = useRef(act),
    context = useRef(g),
    pending = useRef<{ title: string } | null>(null),
    [loading, setLoading] = useState<string | null>(null),
    [slow, setSlow] = useState(false),
    [failure, setFailure] = useState<{ title: string; message: string } | null>(null);
  callback.current = act;
  context.current = g;
  const navigate = async (title: string) => {
    const game = context.current;
    if (pending.current || game.mine?.arrival || game.mine?.abandoned || game.stage !== 'answer' || !game.article?.links.includes(title)) return;
    sound.init();
    const request = { title };
    pending.current = request;
    setFailure(null);
    setSlow(false);
    setLoading(title);
    try {
      const accepted = await callback.current({ type: "navigate", title, round: game.round, from: game.path.at(-1), step: game.path.length });
      if (accepted === false && pending.current === request) {
        pending.current = null;
        setLoading(null);
        setFailure({ title, message: 'Der Artikelwechsel wurde nicht bestätigt. Dein bisheriger Artikel bleibt geöffnet.' });
      }
    } catch (cause) {
      if (pending.current !== request) return;
      pending.current = null;
      setLoading(null);
      setFailure({ title, message: cause instanceof Error ? cause.message : 'Der Artikel konnte nicht geöffnet werden. Dein Weg bleibt erhalten.' });
    }
  };
  useEffect(() => {
    if (pending.current)
      scroll.current
        ?.querySelector<HTMLHeadingElement>("h2")
        ?.focus({ preventScroll: true });
    pending.current = null;
    setLoading(null);
    setSlow(false);
    setFailure(null);
    scroll.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [article?.title, g.round, g.path.length]);
  useEffect(() => () => { pending.current = null; }, []);
  useEffect(() => {
    if (!loading) return;
    const request = pending.current;
    const slowTimer = setTimeout(() => setSlow(true), 8000);
    const timer = setTimeout(() => {
      if (pending.current !== request) return;
      pending.current = null;
      setLoading(null);
      setFailure({ title: loading, message: 'Der Artikelwechsel wurde noch nicht bestätigt. Dein bisheriger Artikel bleibt geöffnet.' });
    }, 30000);
    return () => { clearTimeout(slowTimer); clearTimeout(timer); };
  }, [loading]);
  useEffect(() => {
    const node = body.current;
    if (!node) return;
    // Native capture also handles links in injected Wikipedia HTML before the
    // browser can follow its placeholder fragment and jump down the page.
    const click = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target.closest("a") : null;
      if (!target || !node.contains(target)) return;
      e.preventDefault();
      e.stopPropagation();
      const title = target.getAttribute("data-wiki-title");
      if (title && context.current.article?.links.includes(title))
        void navigate(title);
    };
    node.addEventListener("click", click, true);
    return () => node.removeEventListener("click", click, true);
  }, [article?.html, article?.title]);
  return (
    <div className="wiki-reader">
      <div className="wiki-route">
        <span>
          <small>START</small>
          {g.start}
        </span>
        <b>→</b>
        <strong>
          <small>DEIN ZIEL</small>
          {g.target}
        </strong>
      </div>
      <div className="wiki-progress">
        <strong>
          {g.mine?.arrival
            ? "✓ Ziel erreicht!"
            : `${g.path.length - 1} ${g.path.length === 2 ? "Schritt" : "Schritte"}`}
        </strong>
        <div className="wiki-breadcrumbs" aria-label="Dein bisheriger Weg">
          {g.path.map((title: string, i: number) => (
            <span key={`${i}:${title}`}>
              {i > 0 && <b>→</b>}
              <em>{title}</em>
            </span>
          ))}
        </div>
      </div>
      {!!g.mine?.arrival && (
        <div className="wiki-finish" role="status">
          <strong>✦ Ziel erreicht!</strong>
          <span>
            Deine Zeit ist gesichert. Oben siehst du, wo die anderen gerade
            sind.
          </span>
        </div>
      )}
      <div className="wiki-browser">
        <div className="wiki-browser-bar">
          <span className="wiki-w">W</span>
          <div>
            <small>
              WIKIPEDIA ·{" "}
              {article?.live ? "VOLLSTÄNDIGER ARTIKEL" : "OFFLINE-RESERVE"}
            </small>
            <strong>{article?.title ?? g.path.at(-1)}</strong>
          </div>
          <span
            className={`wiki-load ${loading ? "loading" : ""}`}
            role="status"
          >
            {loading ? slow ? "Dauert länger …" : "Lädt …" : failure ? "Wechsel nicht bestätigt" : g.articleError ? "Artikel nicht verfügbar" : "Artikel bereit"}
          </span>
        </div>
        {loading && (
          <div className="wiki-loading" role="status">
            <span className="loading-ring" />
            <span>{slow ? <>Weiter zu <strong>{loading}</strong> dauert länger. Du kannst hier weiterlesen.</> : <>Weiter zu <strong>{loading}</strong></>}</span>
          </div>
        )}
        {failure && (
          <div className="wiki-navigation-error">
            <p role="alert">{failure.message}</p>
            {!g.mine?.arrival && !g.mine?.abandoned && g.stage === 'answer' && article?.links.includes(failure.title) && (
              <button type="button" className="secondary" onClick={() => void navigate(failure.title)}>Erneut versuchen: {failure.title}</button>
            )}
          </div>
        )}
        {g.articleError && <p className="notice">{g.articleError}</p>}
        <div
          className={`wiki-scroll ${loading ? "is-loading" : ""}`}
          ref={scroll}
          aria-busy={!!loading}
        >
          <article className="wiki-article">
            <p className="wiki-tip">
              Klicke einen <span>grünen Artikellink</span>, um weiterzureisen.
            </p>
            <h2 tabIndex={-1} key={article?.title}>
              {article?.title ?? g.path.at(-1)}
            </h2>
            {article?.html ? (
              <ArticleBody html={article.html} bodyRef={body} />
            ) : (
              article?.text
                ?.split("\n")
                .filter(Boolean)
                .map((t: string, i: number) => <p key={i}>{t}</p>)
            )}
            <details className="wiki-all-links">
              <summary>
                Alle Artikellinks anzeigen · {article?.links.length ?? 0}
              </summary>
              <div className="wiki-links">
                {article?.links.map((title: string) => (
                  <button
                    key={title}
                    disabled={!!loading || !!g.mine?.arrival}
                    onClick={() => navigate(title)}
                  >
                    {title} ↗
                  </button>
                ))}
              </div>
            </details>
            <footer>
              <a href={article?.url} target="_blank" rel="noreferrer">
                Wikipedia-Mitwirkende · {article?.title}
              </a>{" "}
              ·{" "}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY-SA 4.0
              </a>{" "}
              · Revision {article?.revision} · Artikelbilder: jeweilige
              Wikimedia-Urheber
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
