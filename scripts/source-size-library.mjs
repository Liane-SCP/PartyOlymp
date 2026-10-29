/** Reproducible CC0 Wikidata measurements; no estimates, dimensions of parts or conflicting best-rank values. */
import fs from "node:fs/promises";
const cohorts = [
  {
    kind: "bridge",
    class: "Q12280",
    property: "P2043",
    measure: "Länge",
    limit: 160,
  },
  {
    kind: "aircraft",
    class: "Q11436",
    property: "P2043",
    measure: "Länge",
    limit: 140,
  },
  {
    kind: "ship",
    class: "Q11446",
    property: "P2043",
    measure: "Länge",
    limit: 140,
  },
  {
    kind: "tower",
    class: "Q12518",
    property: "P2048",
    measure: "Höhe",
    limit: 100,
  },
  {
    kind: "statue",
    class: "Q179700",
    property: "P2048",
    measure: "Höhe",
    limit: 100,
  },
  {
    kind: "building",
    class: "Q11303",
    property: "P2048",
    measure: "Höhe",
    limit: 700,
  },
];
const factors = {
  Q11573: 100,
  Q174728: 1,
  Q174789: 0.1,
  Q828224: 100000,
  Q3710: 30.48,
  Q218593: 2.54,
  Q482798: 91.44,
};
await fs.mkdir("outputs/size-source", { recursive: true });
const catalog = new Map();
// Wikidata's statue subclass tree also contains beads, weights, potsherds and
// generically labelled museum inventory. Only these individually reviewed,
// specifically named complete artworks belong in the statue guessing category.
const reviewedStatues = new Set([
  "Q19404664",
  "Q510876",
  "Q849063",
  "Q19404637",
  "Q19404728",
  "Q9362624",
  "Q17008494",
  "Q15726561",
  "Q2220407",
  "Q25383859",
  "Q2040958",
  "Q11608105",
  "Q12752821",
  "Q3720136",
  "Q203765",
  "Q131397",
  "Q724710",
  "Q2734209",
  "Q7283381",
  "Q6116657",
  "Q124309662",
  "Q700728",
  "Q552113",
  "Q19341508",
  "Q1307686",
  "Q1636061",
  "Q1639016",
  "Q1518432",
  "Q1728619",
  "Q1398760",
  "Q1445773",
  "Q1365951",
]);
for (const cohort of cohorts) {
  const cache = `outputs/size-source/${cohort.kind}.json`;
  let data;
  try {
    data = JSON.parse(await fs.readFile(cache, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const p = cohort.property;
    const query = `SELECT DISTINCT ?item ?itemLabel ?amount ?unit ?statement WHERE {
   ?item wdt:P31/wdt:P279* wd:${cohort.class}; p:${p} ?statement.
   ?statement a wikibase:BestRank; psv:${p} ?value.
   FILTER NOT EXISTS { ?statement ?qualifier ?detail. FILTER(STRSTARTS(STR(?qualifier), "http://www.wikidata.org/prop/qualifier/")) }
   ?value wikibase:quantityAmount ?amount; wikibase:quantityUnit ?unit.
   FILTER(?amount > 0)
   FILTER NOT EXISTS { ?item p:${p} ?other. ?other a wikibase:BestRank; psv:${p} ?otherValue. ?otherValue wikibase:quantityAmount ?otherAmount; wikibase:quantityUnit ?otherUnit. FILTER(?otherAmount != ?amount || ?otherUnit != ?unit) }
   SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
  } LIMIT ${cohort.limit}`;
    const response = await fetch(
      "https://query.wikidata.org/sparql?" +
        new URLSearchParams({ query, format: "json" }),
      {
        headers: {
          Accept: "application/sparql-results+json",
          "User-Agent": "OlympartySizeLibrary/1.0",
        },
        signal: AbortSignal.timeout(60000),
      },
    );
    if (!response.ok)
      throw new Error(
        `Wikidata ${cohort.kind}: ${response.status}; no automated retry`,
      );
    data = await response.json();
    await fs.writeFile(cache, JSON.stringify(data, null, 2));
  }
  let added = 0;
  for (const row of data.results.bindings) {
    const qid = row.item.value.split("/").at(-1);
    if (cohort.kind === "statue" && !reviewedStatues.has(qid)) continue;
    const factor = factors[row.unit.value.split("/").at(-1)];
    const cm = Math.round(Number(row.amount.value) * factor * 10000) / 10000;
    const name = row.itemLabel.value;
    if (
      !factor ||
      !Number.isFinite(cm) ||
      cm <= 0 ||
      /^Q\d+$/.test(name) ||
      catalog.has(qid)
    )
      continue;
    catalog.set(qid, {
      id: `size-wd-${qid.toLowerCase()}`,
      name,
      measure: cohort.measure,
      cm,
      source: `https://www.wikidata.org/wiki/${qid}#${cohort.property}`,
      kind: cohort.kind,
    });
    added++;
  }
  console.log(
    `${cohort.kind}: ${added} added (${data.results.bindings.length} source statements); total ${catalog.size}`,
  );
}
// A place-free label such as "Sky Tower" can describe unrelated objects. Keep
// only unambiguous labels rather than asking players to distinguish them by ID.
const nameCounts = new Map();
for (const item of catalog.values()) {
  const name = item.name.toLocaleLowerCase("de");
  nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
}
const output = [...catalog.values()].filter(
  (item) => nameCounts.get(item.name.toLocaleLowerCase("de")) === 1,
);
if (output.length < 500)
  throw new Error(
    "Fewer than 500 qualified objects; existing library not replaced",
  );
await fs.writeFile(
  "lib/game/data/size-library.json",
  JSON.stringify(output, null, 2) + "\n",
);
console.log(
  `Saved ${output.length} source-backed physical objects; ${catalog.size - output.length} ambiguous labels excluded.`,
);
