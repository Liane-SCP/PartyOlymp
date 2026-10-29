/** Cache the dated Amazon game snapshot's product photographs for reliable play.
 * Original retailer URLs and all product/price provenance are retained.
 * These are retailer photographs, not our work or freely licensed assets.
 * Usage: node scripts/cache-amazon-images.mjs (resumable; at most four requests).
 */
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
const root = fileURLToPath(new URL("../", import.meta.url));
const catalogPath = root + "lib/game/data/amazon-products.json";
const items = JSON.parse(await fs.readFile(catalogPath, "utf8"));
await fs.mkdir(root + "public/amazon-products", { recursive: true });
await fs.mkdir(root + "outputs", { recursive: true });
const failures = [];
let cached = 0;
async function imageFor(item) {
  const original = item.originalImage ?? item.image;
  if (!/^[A-Z0-9]{10}$/.test(item.asin)) throw new Error("Invalid ASIN");
  const relative = `/amazon-products/${item.asin}.webp`;
  const target = root + "public" + relative;
  try {
    try {
      await fs.access(target);
      const meta = await sharp(target).metadata();
      if (
        meta.format !== "webp" ||
        !meta.width ||
        !meta.height ||
        meta.width > 480 ||
        meta.height > 480
      )
        throw new Error("Invalid cached image");
    } catch {
      const url = new URL(original);
      if (
        url.protocol !== "https:" ||
        !/(^|\.)(ssl-images-amazon|media-amazon|images-amazon|amazon)\.com$/.test(
          url.hostname,
        ) ||
        !url.pathname.startsWith("/images/I/")
      )
        throw new Error("Unexpected original image host");
      const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error("Image HTTP " + response.status);
      if (!response.headers.get("content-type")?.startsWith("image/"))
        throw new Error("Not an image response");
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 100 || bytes.length > 10000000)
        throw new Error("Unexpected image size");
      await sharp(bytes)
        .rotate()
        .resize({
          width: 480,
          height: 480,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(target + ".tmp");
      await fs.rename(target + ".tmp", target);
    }
    item.originalImage = original;
    item.image = relative;
    cached++;
  } catch (error) {
    failures.push({
      asin: item.asin,
      originalImage: original,
      error: error.message,
    });
  }
}
for (let index = 0; index < items.length; index += 4) {
  await Promise.all(items.slice(index, index + 4).map(imageFor));
  await fs.writeFile(
    catalogPath + ".tmp",
    JSON.stringify(items, null, 2) + "\n",
  );
  await fs.rename(catalogPath + ".tmp", catalogPath);
  if (index % 40 === 0)
    console.log(
      `${Math.min(index + 4, items.length)}/${items.length} processed; ${cached} cached; ${failures.length} failures`,
    );
}
await fs.writeFile(
  root + "outputs/amazon-image-cache-report.json",
  JSON.stringify({ total: items.length, cached, failures }, null, 2) + "\n",
);
console.log(
  `Finished: ${cached}/${items.length} local images; ${failures.length} failures.`,
);
if (cached < 500 || failures.length) process.exitCode = 1;
