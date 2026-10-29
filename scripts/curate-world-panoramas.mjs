import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const catalogFile = "lib/game/data/world-panoramas.json";
const photos = JSON.parse(await fs.readFile(catalogFile, "utf8"));
const candidates = JSON.parse(
  await fs.readFile("outputs/world-source-checkpoint.json", "utf8"),
).candidates;
let rejected = [];
try {
  rejected = JSON.parse(
    await fs.readFile("outputs/world-download-rejected.json", "utf8"),
  );
} catch {}
const keep = [],
  removed = [];
const niceName = (s) =>
  s
    .replace(/^(?:MJK|MK|MKa|MKi)\s*\d+(?:-\d+)?\s*/i, "")
    .replace(/[-\s](?:IMG|DSC|DJI)\b.*$/i, "")
    .replace(/\b(?:photosphere|panorama|panosphere|equirectangular)\b/gi, "")
    .replace(/\b(?:360[-° ]*(?:degree view)?|360x180|\d{8})\b/gi, "")
    .replace(/\s+-\s+panoramio$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[,·\s]+$/g, "")
    .trim();
for (const p of photos) {
  let remove =
    /San Diego.*DSC|Wikimedia Sverige|konferensrum|PHOTOSPHERE of vestibule|herstory.editathon|Fliegender Teppich|The Legacy by 2go4/i.test(
      p.name,
    );
  if (p.id.startsWith("pano-")) {
    const pixels = await sharp(await fs.readFile("public" + p.image))
      .resize(64, 32)
      .removeAlpha()
      .raw()
      .toBuffer();
    for (const y of [1, 30]) {
      let n = 0;
      for (let x = 0; x < 64; x++) {
        const k = (y * 64 + x) * 3;
        if (pixels[k] < 10 && pixels[k + 1] < 10 && pixels[k + 2] < 10) n++;
      }
      if (n > 52) remove = true;
    }
  }
  if (remove) {
    removed.push(p);
    const source = candidates.find((c) => c.info.descriptionurl === p.source);
    if (source) rejected.push(source.title);
    continue;
  }
  if (p.id.startsWith("pano-")) p.name = niceName(p.name);
  keep.push(p);
}
await fs.writeFile(catalogFile, JSON.stringify(keep, null, 2) + "\n");
await fs.writeFile(
  "outputs/world-download-rejected.json",
  JSON.stringify([...new Set(rejected)]),
);
const directory = path.resolve("public/world-panoramas");
for (const p of removed) {
  const file = path.resolve("public" + p.image);
  if (!file.startsWith(directory + path.sep)) throw Error("Unexpected path");
  await fs.unlink(file);
}
const escape = (s) =>
  String(s).replace(
    /[&<>\"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
await fs.writeFile(
  "public/world-panoramas/credits.html",
  `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Weltreise · Bildnachweise</title><style>body{font:16px system-ui;background:#121b2d;color:white;max-width:1000px;margin:40px auto;padding:20px}a{color:#bcff5c}img{width:100%;max-width:420px}article{margin:30px 0}</style><h1>Weltreise · ${keep.length} Panoramen</h1><p>Echte sphärische Aufnahmen aus Wikimedia Commons. Verkleinert und in WebP umgewandelt. Koordinaten aus den Metadaten der Originaldateien. Die jeweilige Lizenz gilt für das einzelne Foto.</p>${keep.map((p) => `<article><img src="${p.image}" loading="lazy" alt="${escape(p.name)}"><h2>${escape(p.name)}</h2><p>${escape(p.author)}</p><a href="${escape(p.source)}">Original</a> · <a href="${escape(p.licenseUrl)}">${escape(p.license)}</a></article>`).join("")}</html>`,
);
console.log(
  JSON.stringify(
    {
      kept: keep.length,
      removed: removed.map((p) => ({ id: p.id, name: p.name })),
    },
    null,
    2,
  ),
);
