import fs from "node:fs/promises";
import sharp from "sharp";
import { createHash } from "node:crypto";
const headers = {
  "User-Agent":
    "OlympartyPanoramaCatalog/2.0 (educational geography game; Wikimedia Commons reuse)",
};
const checkpoint = "outputs/world-source-checkpoint.json";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function request(url) {
  for (let n = 0; n < 8; n++) {
    try {
      const r = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(60000),
      });
      if (r.ok) return r;
      if (![429, 500, 502, 503, 504].includes(r.status))
        throw Error(`HTTP ${r.status}`);
      console.log("Retry", r.status, n);
      await wait(Math.min(120000, 60000 * 2 ** n));
    } catch (e) {
      if (n === 7) throw e;
      await wait(3000 * (n + 1));
    }
  }
  throw Error("Retries exhausted");
}
async function api(p) {
  const r = await request(
    "https://commons.wikimedia.org/w/api.php?" +
      new URLSearchParams({ action: "query", format: "json", ...p }),
  );
  return r.json();
}
const strip = (s) =>
  String(s ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .trim();
let state;
try {
  state = JSON.parse(await fs.readFile(checkpoint, "utf8"));
} catch {
  state = {
    queue: [
      "Category:Spherical panoramas",
      "Category:360° panoramas with equirectangular projection",
      "Category:Photo Sphere",
      "Category:Photospheres taken by Sdkb",
    ],
    done: [],
    candidates: [],
    rejected: [],
  };
}
const save = () => fs.writeFile(checkpoint, JSON.stringify(state));
if (!process.argv.includes("--download"))
  while (state.queue.length) {
    const cat = state.queue[0];
    console.log("Category", cat, "remaining", state.queue.length);
    let cont = state.cont ?? {};
    do {
      const data = await api({
        generator: "categorymembers",
        gcmtitle: cat,
        gcmtype: "file|subcat",
        gcmlimit: "50",
        prop: "imageinfo",
        iiprop: "url|size|extmetadata",
        iiurlwidth: "2560",
        ...cont,
      });
      for (const p of Object.values(data.query?.pages ?? {})) {
        if (p.ns === 14) {
          if (
            !state.done.includes(p.title) &&
            !state.queue.includes(p.title) &&
            !/unidentified|partial|polar coordinates/i.test(p.title)
          )
            state.queue.push(p.title);
          continue;
        }
        const i = p.imageinfo?.[0],
          m = i?.extmetadata;
        let lat = Number(m?.GPSLatitude?.value),
          lon = Number(m?.GPSLongitude?.value);
        const license = strip(m?.LicenseShortName?.value);
        if (
          !i ||
          Math.abs(i.width / i.height - 2) > 0.01 ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          Math.abs(lat) > 90 ||
          Math.abs(lon) > 180 ||
          !/CC BY|CC0|Public domain/i.test(license) ||
          !/\.(jpe?g|png)$/i.test(p.title)
        )
          continue;
        if (
          /interior|innen|werkshalle|gallery|biblioteca|stern|night|35c3|raum|lobby|meeting|bedroom|common room|office|kühlschrank/i.test(
            p.title,
          )
        )
          continue;
        if (!state.candidates.some((c) => c.title === p.title))
          state.candidates.push({ title: p.title, lat, lon, info: i });
      }
      cont = data.continue;
      state.cont = cont;
      await save();
      console.log("Candidates", state.candidates.length);
      await wait(3000);
    } while (cont);
    state.done.push(cat);
    state.queue.shift();
    delete state.cont;
    await save();
  }
if (process.argv.includes("--crawl")) process.exit(0);
try {
  state.rejected = [
    ...new Set([
      ...state.rejected,
      ...JSON.parse(
        await fs.readFile("outputs/world-download-rejected.json", "utf8"),
      ),
    ]),
  ];
} catch {}
const photos = JSON.parse(
  await fs.readFile("lib/game/data/world-panoramas.json", "utf8"),
);
const distance = (a, b) => {
  const r = Math.PI / 180,
    dlat = (b.lat - a.lat) * r,
    dlon = (b.lon - a.lon) * r;
  const v =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlon / 2) ** 2;
  return 12742 * Math.atan2(Math.sqrt(v), Math.sqrt(1 - v));
};
const selected = [...photos];
const available = state.candidates.filter(
  (c) =>
    !photos.some((p) => p.source === c.info.descriptionurl) &&
    !state.rejected.includes(c.title) &&
    !/San Diego Panorama DSC|Fliegender Teppich|The Legacy by 2go4|Wikimedia Sverige|konferensrum|kontor|vestibule|editathon|meeting|common room|office/i.test(
      c.title,
    ),
);
// Farthest-first chooses geographically diverse locations before local additions.
while (available.length && selected.length < 620) {
  let best = -1,
    dist = -1;
  for (let n = 0; n < available.length; n++) {
    const d = Math.min(...selected.map((p) => distance(p, available[n])));
    if (d > dist) {
      dist = d;
      best = n;
    }
  }
  if (dist < 0.1) break;
  const p = available.splice(best, 1)[0];
  selected.push(p);
}
console.log(
  "Spatially distinct selected",
  selected.length,
  "existing",
  photos.length,
  "available",
  state.candidates.length,
);
if (process.argv.includes("--stats")) process.exit(0);
await fs.mkdir("public/world-panoramas", { recursive: true });
const downloadQueue = selected.filter((p) => p.info);
let writeQueue = Promise.resolve();
async function worker() {
  while (downloadQueue.length) {
    const p = downloadQueue.shift();
    if (photos.length >= 510) break;
    const id =
        "pano-" +
        createHash("sha256").update(p.title).digest("hex").slice(0, 12),
      file = `public/world-panoramas/${id}.webp`;
    try {
      const r = await request(p.info.thumburl || p.info.url);
      const original = Buffer.from(await r.arrayBuffer());
      const preview = await sharp(original)
        .resize(64, 32)
        .removeAlpha()
        .raw()
        .toBuffer();
      for (const row of [0, 1, 30, 31]) {
        let dark = 0;
        for (let x = 0; x < 64; x++) {
          const k = (row * 64 + x) * 3;
          if (preview[k] < 8 && preview[k + 1] < 8 && preview[k + 2] < 8)
            dark++;
        }
        if (dark > 52)
          throw Error("Black polar band indicates incomplete sphere");
      }
      const bytes = await sharp(original)
        .resize(2048, 1024)
        .webp({ quality: 75 })
        .toBuffer();
      await fs.writeFile(file, bytes);
      const m = p.info.extmetadata;
      photos.push({
        id,
        image: `/world-panoramas/${id}.webp`,
        name: p.title
          .replace(/^File:/, "")
          .replace(/\.(jpe?g|png)$/i, "")
          .replace(/panorama|panosphere|360x180|equirectangular/gi, "")
          .trim(),
        lat: p.lat,
        lon: p.lon,
        source: p.info.descriptionurl,
        author: strip(m.Artist?.value || m.Credit?.value),
        license: strip(m.LicenseShortName?.value),
        licenseUrl:
          m.LicenseUrl?.value ||
          "https://commons.wikimedia.org/wiki/Help:Public_domain",
      });
      writeQueue = writeQueue.then(() =>
        fs.writeFile(
          "lib/game/data/world-panoramas.json",
          JSON.stringify(photos, null, 2) + "\n",
        ),
      );
      await writeQueue;
      console.log("Saved", photos.length, p.title, bytes.length);
      await wait(400);
    } catch (e) {
      console.log("Rejected", p.title, e.message);
      state.rejected.push(p.title);
      await fs.writeFile(
        "outputs/world-download-rejected.json",
        JSON.stringify(state.rejected),
      );
    }
  }
}
await Promise.all(Array.from({ length: 2 }, () => worker()));
const escape = (s) =>
  String(s).replace(
    /[&<>\"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
await fs.writeFile(
  "public/world-panoramas/credits.html",
  `<!doctype html><html lang="de"><meta charset="utf-8"><title>Weltreise · Bildnachweise</title><style>body{font:16px system-ui;background:#121b2d;color:white;max-width:1000px;margin:40px auto;padding:20px}a{color:#bcff5c}img{width:100%;max-width:420px}article{margin:30px 0}</style><h1>Weltreise · ${photos.length} Panoramen</h1><p>Verkleinert und in WebP umgewandelt. Koordinaten aus den Metadaten der Originaldateien. Vollständige sphärische Aufnahmen aus Wikimedia Commons.</p>${photos.map((p) => `<article><img src="${p.image}" loading="lazy"><h2>${escape(p.name)}</h2><p>${escape(p.author)}</p><a href="${escape(p.source)}">Original</a> · <a href="${escape(p.licenseUrl)}">${escape(p.license)}</a></article>`).join("")}</html>`,
);
console.log("DONE", photos.length);
