import fs from "node:fs/promises";
import sharp from "sharp";
const photos = JSON.parse(
  await fs.readFile("lib/game/data/world-panoramas.json", "utf8"),
);
const issues = [];
let total = 0;
for (const p of photos) {
  const file = "public" + p.image;
  const meta = await sharp(file).metadata();
  total += (await fs.stat(file)).size;
  const buf = await sharp(file).resize(64, 32).removeAlpha().raw().toBuffer();
  const dark = (y) => {
    let n = 0;
    for (let x = 0; x < 64; x++) {
      const k = (y * 64 + x) * 3;
      if (buf[k] < 10 && buf[k + 1] < 10 && buf[k + 2] < 10) n++;
    }
    return n / 64;
  };
  const top = dark(1),
    bottom = dark(30);
  if (top > 0.8 || bottom > 0.8)
    issues.push({ id: p.id, name: p.name, top, bottom });
  if (meta.width / meta.height !== 2) throw Error("Not2:1 " + p.id);
}
console.log(
  JSON.stringify(
    {
      count: photos.length,
      megabytes: Math.round(total / 1048576),
      suspicious: issues,
    },
    null,
    2,
  ),
);
await fs.mkdir("outputs/world-review", { recursive: true });
const esc = (s) =>
  s.replace(/[<&]/g, (c) => ({ "<": "&lt;", "&": "&amp;" })[c]);
for (let start = 0; start < photos.length; start += 80) {
  const tiles = [];
  for (let i = start; i < Math.min(start + 80, photos.length); i++) {
    const p = photos[i],
      x = ((i - start) % 8) * 240,
      y = Math.floor((i - start) / 8) * 150;
    const bytes = await sharp("public" + p.image)
      .resize(240, 120)
      .toBuffer();
    tiles.push({ input: bytes, left: x, top: y });
    tiles.push({
      input: Buffer.from(
        `<svg width="240" height="30"><rect width="240" height="30" fill="#fff"/><text x="4" y="11" font-size="9">${i + 1} ${esc(p.id)}</text><text x="4" y="23" font-size="9">${esc(p.name.slice(0, 40))}</text></svg>`,
      ),
      left: x,
      top: y + 120,
    });
  }
  await sharp({
    create: { width: 1920, height: 1500, channels: 3, background: "#ddd" },
  })
    .composite(tiles)
    .jpeg({ quality: 85 })
    .toFile(`outputs/world-review/sheet-${Math.floor(start / 80) + 1}.jpg`);
}
