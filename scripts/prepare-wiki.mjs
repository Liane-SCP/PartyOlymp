import { buildWikiRoutes } from "./wiki-routes.mjs";
import { writeFile, mkdir, readFile } from "node:fs/promises";
const seeds = [
  "Berlin",
  "Deutschland",
  "Europa",
  "Frankreich",
  "Paris",
  "London",
  "Rom",
  "Italien",
  "Spanien",
  "Madrid",
  "Japan",
  "Tokio",
  "China",
  "Indien",
  "Australien",
  "Kanada",
  "Brasilien",
  "Afrika",
  "Ägypten",
  "Nil",
  "Erde",
  "Mond",
  "Sonne",
  "Mars (Planet)",
  "Sonnensystem",
  "Astronomie",
  "Physik",
  "Chemie",
  "Biologie",
  "Mathematik",
  "Musik",
  "Gitarre",
  "Klavier",
  "Jazz",
  "Ludwig van Beethoven",
  "Wolfgang Amadeus Mozart",
  "Fußball",
  "Olympische Spiele",
  "Basketball",
  "Tennis",
  "Schach",
  "Internet",
  "Wikipedia",
  "Computer",
  "Elefant",
  "Giraffe",
  "Katze",
  "Hund",
  "Wal",
  "Wald",
  "Baum",
  "Pflanze",
  "Wasser",
  "Meer",
  "Atlantischer Ozean",
  "Pazifischer Ozean",
  "Alpen",
  "Schweiz",
  "Österreich",
  "Donau",
  "Rhein",
  "Bier",
  "Kaffee",
  "Tee",
  "Schokolade",
  "Kartoffel",
  "Brot",
  "Apfel",
  "Fahrrad",
  "Eisenbahn",
  "Flugzeug",
  "Automobil",
  "Geschichte",
  "Römisches Reich",
  "Antike",
  "Demokratie",
  "Sprache",
  "Deutsche Sprache",
  "Englische Sprache",
  "Film",
  "Fotografie",
  "Malerei",
  "Leonardo da Vinci",
  "Museum",
];
await mkdir("lib/game/data", { recursive: true });
const cache = "lib/game/data/wiki-cache.json";
let articles = {};
try {
  articles = JSON.parse(await readFile(cache, "utf8"));
} catch {}
async function api(params) {
  const url = new URL("https://de.wikipedia.org/w/api.php");
  for (const [k, v] of Object.entries({ ...params, format: "json" }))
    url.searchParams.set(k, v);
  for (let tries = 0; tries < 8; tries++) {
    await new Promise((r) => setTimeout(r, 1500 + tries * 4000));
    const res = await fetch(url, {
      headers: {
        "User-Agent": "PartyOlymp/1.0 (attributed browser game excerpts)",
      },
    });
    if (res.status === 429) {
      console.log("Wikipedia rate limit; backing off");
      continue;
    }
    if (!res.ok) throw new Error("Wikipedia " + res.status);
    const body = await res.json();
    if (body.error) throw new Error(body.error.info);
    return body;
  }
  throw new Error("Wikipedia rate limit");
}
for (let i = 0; i < seeds.length; i += 8) {
  if (seeds.slice(i, i + 8).every((t) => articles[t])) continue;
  const body = await api({
    action: "query",
    redirects: "1",
    titles: seeds.slice(i, i + 8).join("|"),
    prop: "extracts|info",
    inprop: "url",
    explaintext: "1",
    exintro: "1",
  });
  for (const p of Object.values(body.query.pages)) {
    if (p.missing !== undefined) continue;
    articles[p.title] = {
      title: p.title,
      text: p.extract,
      url: p.fullurl,
      revision: p.lastrevid,
      links: [],
      cached: false,
    };
  }
  await writeFile(cache, JSON.stringify(articles));
  console.log("Excerpts: " + Object.keys(articles).length);
}
for (const p of Object.values(articles)) {
  if (p.cached) continue;
  const body = await api({ action: "parse", page: p.title, prop: "links" });
  p.links = body.parse.links.filter((l) => l.ns === 0).map((l) => l["*"]);
  p.cached = true;
  await writeFile(cache, JSON.stringify(articles));
  console.log("Links: " + p.title);
}
for (const p of Object.values(articles))
  p.links = p.links.filter((t) => articles[t]);
const tasks = buildWikiRoutes(articles);
await writeFile(
  "lib/game/data/wiki.json",
  JSON.stringify(
    {
      fetchedAt: new Date().toISOString(),
      license: "CC BY-SA 4.0",
      attribution: "Wikipedia-Mitwirkende",
      articles,
      tasks,
    },
    null,
    2,
  ),
);
console.log(tasks.length + " verified routes saved.");
