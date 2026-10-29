import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { build } from "esbuild";
import sharp from "sharp";

await mkdir("outputs", { recursive: true });
await build({
  stdin: {
    contents:
      'export { sizes, pictures } from "./lib/game/content"; export * from "./lib/game/party-content"; export { accepts } from "./lib/game/games/quiz";',
    resolveDir: process.cwd(),
  },
  outfile: "outputs/content-audit-bank.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { sizes, pictures, raceTexts, herdQuestions, spectrumAxes, accepts } =
  await import("../outputs/content-audit-bank.mjs?" + Date.now());
const read = async (name) =>
  JSON.parse(await readFile(`lib/game/data/${name}.json`, "utf8"));
const products = await read("amazon-products"),
  places = await read("world-panoramas"),
  wiki = await read("wiki");
const counts = {};
function unique(name, rows, key) {
  assert.ok(
    rows.length >= 500,
    `${name}: ${rows.length}, expected at least 500`,
  );
  assert.equal(
    new Set(rows.map((x) => x.id)).size,
    rows.length,
    name + " duplicate ID",
  );
  assert.equal(
    new Set(rows.map(key)).size,
    rows.length,
    name + " duplicate content",
  );
  counts[name] = rows.length;
}
unique("photos", pictures, (x) => x.source);
unique("panoramas", places, (x) => x.source);
unique("products", products, (x) => x.asin);
unique("sizeTasks", sizes, (x) => `${x.name.toLocaleLowerCase("de")}\0${x.measure}`);
counts.sizeObjects = new Set(sizes.map(x=>x.name.toLocaleLowerCase("de"))).size;
assert.ok(counts.sizeObjects >= 500);
unique("wikiRoutes", wiki.tasks, (x) => `${x.start}\0${x.target}`);
unique("raceTexts", raceTexts, (x) => x.text);
unique("herdQuestions", herdQuestions, (x) => x.text);
unique(
  "spectrumTasks",
  spectrumAxes,
  (x) => `${x.context ?? ""}\0${x.left}\0${x.right}`,
);
for (const route of wiki.tasks) {
  assert.equal(route.path[0], route.start);
  assert.equal(route.path.at(-1), route.target);
  for (let i = 1; i < route.path.length; i++)
    assert.ok(
      wiki.articles[route.path[i - 1]]?.links.includes(route.path[i]),
      `Broken Wikipedia edge: ${route.id}`,
    );
}
for (const item of sizes)
  assert.ok(
    Number.isFinite(item.cm) &&
      item.cm > 0 &&
      item.source.startsWith("https://"),
    item.name,
  );
for (const item of products)
  assert.ok(
    Number.isInteger(item.price) && item.price > 0 && item.image && item.source,
    item.id,
  );
for (const item of pictures) {
  assert.ok(
    item.answer &&
      item.aliases.length &&
      item.license &&
      item.author &&
      item.licenseUrl,
    item.id,
  );
  assert.ok(
    accepts(item.answer, item.aliases),
    `The displayed solution must be accepted: ${item.id}`,
  );
}
for (const place of places)
  assert.ok(
    Math.abs(place.lat) <= 90 &&
      Math.abs(place.lon) <= 180 &&
      place.license &&
      place.author &&
      place.licenseUrl,
    place.id,
  );
// Decode all local media, not just check whether a path exists.
for (const item of [...pictures, ...places, ...products]) {
  assert.ok(item.image.startsWith("/"), `Must be a bundled asset: ${item.id}`);
  const { info } = await sharp(`public${item.image}`)
    .resize(8, 8)
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.ok(info.width && info.height, item.id);
}
await writeFile(
  "outputs/content-audit.json",
  JSON.stringify(counts, null, 2) + "\n",
);
console.log(JSON.stringify(counts, null, 2));
