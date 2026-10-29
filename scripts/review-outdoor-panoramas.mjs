import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
const file = "lib/game/data/world-panoramas.json";
const photos = JSON.parse(await fs.readFile(file, "utf8"));
const manifestFile = "lib/game/data/world-panorama-outdoor-review.json";
// One-based positions on the seven original 2026-10-10 visual contact sheets.
// Each retained image was visually reviewed; titles are not acceptance evidence.
const indoor = [
  4, 17, 31, 45, 47, 54, 58, 59, 74, 78, 81, 85, 87, 93, 108, 116, 127, 130,
  131, 134, 138, 142, 145, 149, 160, 163, 172, 175, 191, 196, 199, 202, 204,
  207, 219, 228, 235, 237, 239, 242, 258, 260, 263, 264, 271, 280, 310, 329,
  330, 339, 341, 344, 345, 363, 373, 379, 380, 382, 389, 391, 402, 433, 435,
  437, 438, 450, 462, 469, 481,
];
const covered = [13, 177, 209, 224, 248, 277, 335, 468];
const underground = [38, 126, 136, 167, 195, 466];
if (process.argv.includes("--initial")) {
  try {
    await fs.access(manifestFile);
    throw Error("Initial audit already recorded");
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const rejected = new Map([
    ...indoor.map((i) => [
      i,
      "Building interior or enclosed glass-roofed arcade",
    ]),
    ...covered.map((i) => [
      i,
      "Predominantly covered/enclosed viewpoint; excluded conservatively",
    ]),
    ...underground.map((i) => [
      i,
      "Tunnel or viewpoint inside cave; not an outdoor scene",
    ]),
  ]);
  const removed = photos
    .filter((p, i) => rejected.has(i + 1))
    .map((p) => ({ ...p, reason: rejected.get(photos.indexOf(p) + 1) }));
  const accepted = [];
  for (const [i, p] of photos.entries())
    if (!rejected.has(i + 1)) {
      p.environment = "outdoor";
      p.outdoorReviewed = true;
      accepted.push({
        id: p.id,
        sha256: createHash("sha256")
          .update(await fs.readFile("public" + p.image))
          .digest("hex"),
        evidence: `Original contact sheet ${Math.floor(i / 80) + 1}, tile ${(i % 80) + 1}`,
        decision: "outdoor",
      });
    }
  await fs.writeFile(
    manifestFile,
    JSON.stringify(
      {
        reviewDate: "2026-10-10",
        method:
          "Visual review of every equirectangular image; full-size inspection of ambiguous views. Indoor scenes, enclosed arcades, cabin viewpoints and caves excluded.",
        removed,
        accepted,
      },
      null,
      2,
    ) + "\n",
  );
  await fs.writeFile(
    file,
    JSON.stringify(
      photos.filter((p, i) => !rejected.has(i + 1)),
      null,
      2,
    ) + "\n",
  );
  console.log({ retained: accepted.length, removed: removed.length });
}
if (process.argv.includes("--staged-sheets")) {
  const root = "outputs/outdoor-replacements";
  const list = JSON.parse(await fs.readFile(root + "/downloaded.json", "utf8"));
  for (let start = 0; start < list.length; start += 40) {
    const tiles = [];
    for (let i = start; i < Math.min(start + 40, list.length); i++) {
      const p = list[i],
        x = ((i - start) % 5) * 384,
        y = Math.floor((i - start) / 5) * 215;
      tiles.push(
        {
          input: await sharp(root + "/" + p.id + ".webp")
            .resize(384, 192)
            .toBuffer(),
          left: x,
          top: y,
        },
        {
          input: Buffer.from(
            `<svg width="384" height="23"><rect width="384" height="23" fill="white"/><text x="4" y="16" font-size="13">${i + 1} ${p.id}</text></svg>`,
          ),
          left: x,
          top: y + 192,
        },
      );
    }
    await sharp({
      create: { width: 1920, height: 1720, channels: 3, background: "#ddd" },
    })
      .composite(tiles)
      .jpeg({ quality: 90 })
      .toFile(root + `/sheet-${start / 40 + 1}.jpg`);
  }
  console.log("Contact sheets generated", list.length);
}
if (process.argv.includes("--approve-staged")) {
  const root = "outputs/outdoor-replacements";
  const list = JSON.parse(await fs.readFile(root + "/downloaded.json", "utf8"));
  const decisions = JSON.parse(
    await fs.readFile(root + "/decisions.json", "utf8"),
  );
  const manifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
  for (const p of list) {
    const decision = decisions[p.id];
    if (!decision) throw Error("Missing explicit visual decision for " + p.id);
    if (decision !== "outdoor") {
      if (!manifest.removed.some((r) => r.id === p.id))
        manifest.removed.push({ ...p, reason: decision });
      continue;
    }
    if (photos.some((r) => r.id === p.id)) continue;
    const bytes = await fs.readFile(root + "/" + p.id + ".webp");
    await fs.writeFile("public" + p.image, bytes);
    photos.push({ ...p, environment: "outdoor", outdoorReviewed: true });
    manifest.accepted.push({
      id: p.id,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      evidence:
        "Replacement contact sheets and full-size inspection of questionable views",
      decision: "outdoor",
    });
  }
  await fs.writeFile(file, JSON.stringify(photos, null, 2) + "\n");
  await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  console.log("Approved catalog size", photos.length);
}
if (process.argv.includes("--credits")) {
  const esc = (s) =>
    String(s).replace(
      /[&<>\"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  await fs.writeFile(
    "public/world-panoramas/credits.html",
    `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Weltreise · Bildnachweise</title><style>body{font:16px system-ui;background:#121b2d;color:white;max-width:1000px;margin:40px auto;padding:20px}a{color:#bcff5c}img{width:100%;max-width:420px}article{margin:30px 0}</style><h1>Weltreise · ${photos.length} Außenpanoramen</h1><p>Visuell geprüfte Außenaufnahmen aus Wikimedia Commons. Verkleinert und in WebP umgewandelt. Koordinaten aus den Metadaten der Originaldateien. Die jeweilige Lizenz gilt für das einzelne Foto.</p>${photos.map((p) => `<article><img src="${p.image}" loading="lazy" alt="${esc(p.name)}"><h2>${esc(p.name)}</h2><p>${esc(p.author)}</p><a href="${esc(p.source)}">Original</a> · <a href="${esc(p.licenseUrl)}">${esc(p.license)}</a></article>`).join("")}</html>`,
  );
  // Delete only explicitly rejected image files under the known asset directory.
  const manifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
  const dir = path.resolve("public/world-panoramas");
  for (const p of manifest.removed) {
    if (photos.some((k) => k.id === p.id))
      throw Error("Conflicting review " + p.id);
    const target = path.resolve("public" + p.image);
    if (!target.startsWith(dir + path.sep)) throw Error("Unsafe image path");
    await fs.rm(target, { force: true });
  }
}
