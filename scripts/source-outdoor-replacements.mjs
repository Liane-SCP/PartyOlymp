import fs from "node:fs/promises";
import sharp from "sharp";
import { createHash } from "node:crypto";
const root = "outputs/outdoor-replacements";
await fs.mkdir(root, { recursive: true });
const photos = JSON.parse(
  await fs.readFile("lib/game/data/world-panoramas.json", "utf8"),
);
const audit = JSON.parse(
  await fs.readFile("lib/game/data/world-panorama-outdoor-review.json", "utf8"),
);
const state = JSON.parse(
  await fs.readFile("outputs/world-source-checkpoint.json", "utf8"),
);
const rejected = JSON.parse(
  await fs.readFile("outputs/world-download-rejected.json", "utf8"),
);
const distance = (a, b) => {
  const r = Math.PI / 180,
    v =
      Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
      Math.cos(a.lat * r) *
        Math.cos(b.lat * r) *
        Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 12742 * Math.atan2(Math.sqrt(v), Math.sqrt(1 - v));
};
let candidates = state.candidates.filter(
  (c) =>
    ![...photos, ...audit.removed].some(
      (p) => p.source === c.info.descriptionurl,
    ) &&
    !rejected.includes(c.title) &&
    !/innen|interior|inside|church|kirche|chapel|kapelle|hall|saal|museum|passage|arcade|tunnel|cave|grotte|room|stair|biblioth|library|shop|mosque|masjid|temple|katedr|cathed|basil|station|bahnhof|airport|school|office|lobby|restaurant|gebäude|building|supermarket|salon|театр|церк|мечет/i.test(
      c.title,
    ),
);
const selected = [...photos];
const queue = [];
while (candidates.length && queue.length < 110) {
  let best = -1,
    max = -1;
  for (let i = 0; i < candidates.length; i++) {
    const d = Math.min(...selected.map((p) => distance(p, candidates[i])));
    if (d > max) {
      best = i;
      max = d;
    }
  }
  if (max < 0.12) break;
  const c = candidates.splice(best, 1)[0];
  selected.push(c);
  queue.push(c);
}
await fs.writeFile(root + "/candidates.json", JSON.stringify(queue, null, 2));
console.log("Staged candidates", queue.length);
const results = [];
const strip = (s) =>
  String(s ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .trim();
async function worker() {
  while (queue.length) {
    const c = queue.shift(),
      id =
        "pano-" +
        createHash("sha256").update(c.title).digest("hex").slice(0, 12),
      file = root + "/" + id + ".webp";
    try {
      let bytes;
      try {
        bytes = await fs.readFile(file);
      } catch {
        const r = await fetch(c.info.thumburl || c.info.url, {
          headers: {
            "User-Agent":
              "OlympartyPanoramaCatalog/3.0 (outdoor educational geography game)",
          },
          signal: AbortSignal.timeout(45000),
        });
        if (r.status === 429) {
          console.log("Rate limited, stopping workers");
          queue.length = 0;
          throw Error("HTTP429");
        }
        if (!r.ok) throw Error("HTTP" + r.status);
        bytes = await sharp(Buffer.from(await r.arrayBuffer()))
          .resize(2048, 1024)
          .webp({ quality: 75 })
          .toBuffer();
        await fs.writeFile(file, bytes);
      }
      const m = c.info.extmetadata;
      results.push({
        id,
        image: "/world-panoramas/" + id + ".webp",
        name: c.title.replace(/^File:/, "").replace(/\.(jpe?g|png)$/i, ""),
        lat: c.lat,
        lon: c.lon,
        source: c.info.descriptionurl,
        author: strip(m.Artist?.value || m.Credit?.value),
        license: strip(m.LicenseShortName?.value),
        licenseUrl:
          m.LicenseUrl?.value ||
          "https://commons.wikimedia.org/wiki/Help:Public_domain",
      });
      await fs.writeFile(
        root + "/downloaded.json",
        JSON.stringify(results, null, 2),
      );
      console.log("Downloaded", results.length, id);
      await new Promise((r) => setTimeout(r, 350));
    } catch (e) {
      console.log("Rejected", c.title, e.message);
    }
  }
}
await Promise.all([worker(), worker()]);
for (let start = 0; start < results.length; start += 40) {
  const tiles = [];
  for (let i = start; i < Math.min(start + 40, results.length); i++) {
    const p = results[i],
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
console.log("DONE", results.length);
