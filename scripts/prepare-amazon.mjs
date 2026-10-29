/**
 * Imports the publicly displayed Amazon.de bestseller listings for Budget-Bande.
 * No account, CAPTCHA solving, hidden API or image downloads are used.
 * Stops on a challenge or throttling. New images start as original retailer URLs;
 * run cache-amazon-images.mjs afterwards to cache them for reliable game loading.
 * The import is a dated game snapshot, never a promise of current retail prices.
 * Preserves existing products and checkpoints after every successful public page.
 * Usage: node scripts/prepare-amazon.mjs [--categories=toys,kitchen,...] [--pages=1,2]
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(
  new URL("../lib/game/data/amazon-products.json", import.meta.url),
);
const categories = process.argv
  .find((arg) => arg.startsWith("--categories="))
  ?.split("=")[1]
  .split(",") ?? [
  "toys",
  "kitchen",
  "officeproduct",
  "ce-de",
  "computers",
  "sports",
  "diy",
  "beauty",
  "grocery",
  "pet-supplies",
  "garden",
];
const priceDate = new Date().toISOString().slice(0, 10);
const existing = await readFile(output, "utf8")
  .then(JSON.parse)
  .catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
const items = new Map(existing.map((item) => [item.asin, item]));
const pages = (
  process.argv.find((arg) => arg.startsWith("--pages="))?.split("=")[1] ?? "1,2"
)
  .split(",")
  .map(Number);
if (pages.some((page) => ![1, 2].includes(page)))
  throw new Error("Only public bestseller pages 1 and 2 are supported");
async function checkpoint() {
  await mkdir(fileURLToPath(new URL("../lib/game/data/", import.meta.url)), {
    recursive: true,
  });
  await writeFile(
    output + ".tmp",
    JSON.stringify([...items.values()], null, 2) + "\n",
    "utf8",
  );
  await rename(output + ".tmp", output);
}
const decode = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .trim();
const attribute = (tag, name) =>
  decode(tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? "");

for (const category of categories) {
  if (!/^[a-z-]+$/.test(category)) throw new Error("Invalid category");
  for (const page of pages) {
    const url = `https://www.amazon.de/gp/bestsellers/${category}${page === 2 ? "?pg=2" : ""}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: { "Accept-Language": "de-DE,de;q=0.9" },
    });
    if (!response.ok)
      throw new Error(
        `Amazon ${response.status}; stopped without retrying or bypassing restrictions.`,
      );
    const html = await response.text();
    if (/validateCaptcha|Robot Check|api-services-support@amazon/i.test(html))
      throw new Error("Amazon challenge; stopped without bypassing it.");
    let imported = 0;
    let complete = 0;
    for (const block of html.split(/(?=<div id="p13n-asin-index-)/).slice(1)) {
      const asin = block.match(/data-asin="([A-Z0-9]{10})"/)?.[1];
      const imageTag = block.match(
        /<img\b[^>]*class="[^"]*p13n-product-image[^>]*>/,
      )?.[0];
      const priceText = decode(
        block.match(
          /<span class="[^"]*p13n-sc-price_[^"]*">([^<]*)<\/span>/,
        )?.[1] ?? "",
      );
      if (!asin || !imageTag || !/^[\d.]+,\d{2}\s*€$/.test(priceText)) continue;
      const name = attribute(imageTag, "alt");
      const image = attribute(imageTag, "src");
      const price = Math.round(
        Number(
          priceText
            .replace(/\./g, "")
            .replace(",", ".")
            .replace(/[^\d.]/g, ""),
        ) * 100,
      );
      if (
        !name ||
        !/^https:\/\/[^/]*amazon\.com\/images\/I\//.test(image) ||
        !Number.isSafeInteger(price) ||
        price <= 0
      )
        continue;
      complete++;
      if (items.has(asin)) continue;
      items.set(asin, {
        id: `amazon-${asin}`,
        asin,
        name,
        price,
        image,
        source: `https://www.amazon.de/dp/${asin}`,
        category,
        priceDate,
        priceKind: "Amazon-Snapshot",
      });
      imported++;
    }
    if (!complete)
      throw new Error(
        `No complete product records in ${category}; the public page format may have changed.`,
      );
    await checkpoint();
    console.log(
      `${category} page ${page}: ${imported} new products; ${items.size} total`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1600));
  }
}
if (
  items.size < 500 &&
  !process.argv.some((arg) => arg.startsWith("--categories="))
)
  throw new Error(
    "Incomplete catalog (<500); acquired records remain checkpointed for a later resume.",
  );
await checkpoint();
console.log(
  `Saved ${items.size} dated Amazon.de products to ${output}. Product photographs belong to their rights holders, not own or openly licensed assets. Run scripts/cache-amazon-images.mjs for local caching.`,
);
