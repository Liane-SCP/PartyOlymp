import fs from "node:fs/promises";
import sharp from "sharp";
import { createHash } from "node:crypto";
const photos = JSON.parse(
  await fs.readFile("lib/game/data/pixel-photos.json", "utf8"),
);
if (process.argv.includes("--final") && photos.length < 500)
  throw new Error("At least 500 verified photo subjects are required");
const sources = new Set(),
  answers = new Set(),
  hashes = new Set();
for (const photo of photos) {
  if (sources.has(photo.source))
    throw new Error(`Duplicate photo source ${photo.id}`);
  if (answers.has(photo.answer))
    throw new Error(`Duplicate answer ${photo.id}`);
  sources.add(photo.source);
  answers.add(photo.answer);
  if (
    !photo.aliases.includes(photo.answer) ||
    photo.aliases.some((x) => !x || /[?\uFFFD]/.test(x))
  )
    throw new Error(`Invalid answer aliases ${photo.id}`);
  if (photo.image !== `/pixel-photos/${photo.id}.webp`)
    throw new Error(`Unexpected image path ${photo.id}`);
  const buffer = await fs.readFile("public" + photo.image);
  const hash = createHash("sha256").update(buffer).digest("hex");
  if (hashes.has(hash)) throw new Error(`Duplicate image bytes ${photo.id}`);
  hashes.add(hash);
  const meta = await sharp(buffer).metadata();
  if (
    meta.format !== "webp" ||
    meta.width !== photo.width ||
    meta.height !== photo.height
  )
    throw new Error(`Image mismatch ${photo.id}`);
  if (
    !photo.author ||
    !photo.license ||
    !photo.source.startsWith("https://commons.wikimedia.org/") ||
    !photo.licenseUrl
  )
    throw new Error(`Attribution missing ${photo.id}`);
}
if (process.argv.includes("--final")) {
  const credits = await fs.readFile("public/pixel-photos/credits.html", "utf8");
  for (const photo of photos)
    if (!credits.includes(photo.image))
      throw new Error(`Missing public credit ${photo.id}`);
}
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
await fs.mkdir("outputs/qa/pixel-contact", { recursive: true });
for (let start = 0; start < photos.length; start += 30) {
  const layers = [];
  for (const [i, p] of photos.slice(start, start + 30).entries()) {
    const tile = await sharp("public" + p.image)
      .resize(178, 135, { fit: "contain", background: "#222" })
      .png()
      .toBuffer();
    const left = (i % 6) * 180,
      top = Math.floor(i / 6) * 166;
    layers.push({ input: tile, left, top });
    layers.push({
      input: Buffer.from(
        `<svg width="180" height="31"><rect width="180" height="31" fill="white"/><text x="3" y="13" font-size="11" fill="black">${escape(p.id)} ${escape(p.answer.slice(0, 22))}</text></svg>`,
      ),
      left,
      top: top + 135,
    });
  }
  await sharp({
    create: { width: 1080, height: 830, channels: 3, background: "#ddd" },
  })
    .composite(layers)
    .png()
    .toFile(
      `outputs/qa/pixel-contact/sheet-${String(start / 30 + 1).padStart(2, "0")}.png`,
    );
}
console.log(
  `${photos.length} unique answers and Commons photos: attribution, local WebP dimensions and contact sheets valid.`,
);
