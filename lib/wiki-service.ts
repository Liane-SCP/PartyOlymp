import bank from "./game/data/wiki.json";
import type { Room } from "./game/types";
export type WikiArticle = {
  title: string;
  text: string;
  html?: string;
  url: string;
  revision: number;
  links: string[];
  live?: boolean;
  fetchedAt?: string;
};
const memory = new Map<string, WikiArticle>();
const allowed = new Set(
  "p div span section article h2 h3 h4 h5 h6 ul ol li dl dt dd table thead tbody tfoot tr th td caption blockquote strong b em i u sup sub br hr a img figure figcaption".split(
    " ",
  ),
);
export async function wikiArticle(
  title: string,
  db: D1Database,
): Promise<WikiArticle> {
  title = title.replaceAll("_", " ");
  if (!title || title.length > 250 || /[\x00-\x1f]/.test(title))
    throw new Error("Ungültiger Artikel.");
  const cached = memory.get(title);
  if (cached) return cached;
  const saved = await db
    .prepare("SELECT article FROM wiki_articles WHERE title=? AND fetched_at>?")
    .bind(title, Date.now() - 86400000)
    .first<{ article: string }>();
  if (saved) {
    const article = JSON.parse(saved.article);
    remember(title, article);
    return article;
  }
  try {
    const url = new URL("https://de.wikipedia.org/w/api.php");
    Object.entries({
      action: "parse",
      page: title,
      prop: "text|links|revid",
      redirects: "1",
      format: "json",
      formatversion: "2",
      disableeditsection: "1",
      disabletoc: "1",
    }).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "PartyOlymp/1.0 (browser Wikipedia race; https://party-olymp.vividboar4.chatgpt.site)",
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw new Error("Wikipedia ist gerade nicht erreichbar.");
    const result: any = await res.json();
    if (!result.parse)
      throw new Error("Der Artikel konnte nicht geladen werden.");
    const page = result.parse;
    const links = [
      ...new Set<string>(
        page.links
          .filter((l: any) => l.ns === 0 && l.exists !== false)
          .map((l: any) => l.title),
      ),
    ];
    const safe = new HTMLRewriter()
      .on("*", {
        element(element) {
          const tag = element.tagName;
          if (!allowed.has(tag)) {
            if (
              ["script", "style", "iframe", "form", "noscript", "svg"].includes(
                tag,
              )
            )
              element.remove();
            else element.removeAndKeepContent();
            return;
          }
          const href = element.getAttribute("href"),
            src = element.getAttribute("src"),
            alt = element.getAttribute("alt"),
            colspan = element.getAttribute("colspan");
          for (const [name] of Array.from(
            element.attributes as unknown as Iterable<[string, string]>,
          ))
            element.removeAttribute(name);
          if (tag === "a" && href) {
            const raw = href.match(/^(?:\.\/|\/wiki\/)([^#?]+)/)?.[1];
            if (raw) {
              let target = "";
              try {
                target = decodeURIComponent(raw).replaceAll("_", " ");
              } catch {}
              if (links.includes(target)) {
                element.setAttribute("data-wiki-title", target);
                element.setAttribute("href", "#article");
              }
            }
          }
          if (tag === "img") {
            const image = src?.startsWith("//") ? "https:" + src : src;
            if (!image || !/^https:\/\/upload\.wikimedia\.org\//.test(image)) {
              element.remove();
              return;
            }
            element.setAttribute("src", image);
            element.setAttribute("alt", alt ?? "Wikipedia-Abbildung");
            element.setAttribute("loading", "lazy");
          }
          if (
            ["th", "td"].includes(tag) &&
            colspan &&
            /^[1-9][0-9]?$/.test(colspan)
          )
            element.setAttribute("colspan", colspan);
        },
      })
      .transform(new Response(page.text));
    const html = await safe.text();
    if (html.length > 1500000)
      throw new Error("Dieser Artikel ist zu groß. Wähle einen anderen Weg.");
    const article: WikiArticle = {
      title: page.title,
      text: "",
      html,
      url: `https://de.wikipedia.org/w/index.php?title=${encodeURIComponent(page.title)}&oldid=${page.revid}`,
      revision: page.revid,
      links,
      live: true,
      fetchedAt: new Date().toISOString(),
    };
    await db
      .prepare(
        "INSERT INTO wiki_articles (title,article,fetched_at) VALUES (?,?,?) ON CONFLICT(title) DO UPDATE SET article=excluded.article,fetched_at=excluded.fetched_at",
      )
      .bind(title, JSON.stringify(article), Date.now())
      .run();
    remember(title, article);
    return article;
  } catch (error) {
    const older = await db
      .prepare("SELECT article FROM wiki_articles WHERE title=?")
      .bind(title)
      .first<{ article: string }>();
    if (older) {
      const article = JSON.parse(older.article);
      remember(title, article);
      return article;
    }
    const fallback = (bank.articles as Record<string, WikiArticle>)[title];
    if (fallback) return { ...fallback, live: false };
    throw error;
  }
}
function remember(title: string, article: WikiArticle) {
  if (memory.size >= 60) memory.delete(memory.keys().next().value!);
  memory.set(title, article);
}
export async function prepareWiki(
  room: Room,
  id: string,
  action: any,
  db: D1Database,
) {
  if (
    room.game?.id !== "wiki" ||
    room.phase !== "playing" ||
    room.game.stage !== "answer" ||
    action?.type !== "game" ||
    action.action?.type !== "navigate"
  )
    return;
  const p = room.game.players[id];
  if (!p) return;
  if (!room.game.secret.targetCanonical) {
    try {
      const goal = await wikiArticle(room.game.public.target, db);
      room.game.secret.targetCanonical = goal.title;
    } catch {
      // Keep the current article usable during a temporary Wikipedia failure.
    }
  }
  const title = p.path.at(-1);
  const article = await wikiArticle(title, db);
  room.game.secret.liveLinks ??= {};
  room.game.secret.liveLinks[id] = { title, links: article.links };
  if (action?.type === "game" && action.action?.type === "navigate") {
    const target = action.action.title;
    if (!article.links.includes(target))
      throw new Error("Dieser Navigationsschritt ist nicht erlaubt.");
    const next = await wikiArticle(target, db);
    room.game.secret.nextArticle = { requested: target, canonical: next.title };
  }
}
export async function enrichWiki(view: any, db: D1Database) {
  if (view.game?.id !== "wiki") return view;
  const title = view.game.path?.at(-1) ?? view.game.start;
  try {
    view.game.article = await wikiArticle(title, db);
  } catch {
    view.game.articleError =
      "Wikipedia antwortet gerade nicht. Dein Weg bleibt erhalten; versuche es erneut.";
  }
  return view;
}
