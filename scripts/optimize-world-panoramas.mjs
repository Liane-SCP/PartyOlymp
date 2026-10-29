import fs from "node:fs/promises";
import sharp from "sharp";
const photos = JSON.parse(
  await fs.readFile("lib/game/data/world-panoramas.json", "utf8"),
);
let count = 0,
  before = 0,
  after = 0;
for (const p of photos.filter((p) => p.id.startsWith("pano-"))) {
  const path = "public" + p.image;
  const source = await fs.readFile(path);
  const meta = await sharp(source).metadata();
  if (meta.width <= 2048) continue;
  const optimized = await sharp(source)
    .resize(2048, 1024)
    .webp({ quality: 75 })
    .toBuffer();
  await fs.writeFile(path, optimized);
  before += source.length;
  after += optimized.length;
  count++;
}
console.log({ optimized: count, before, after });
