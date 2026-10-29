import fs from "node:fs/promises";
import sharp from "sharp";
import { createHash } from "node:crypto";
const photos = JSON.parse(
  await fs.readFile("lib/game/data/world-panoramas.json", "utf8"),
);
const outdoorReview = JSON.parse(
  await fs.readFile("lib/game/data/world-panorama-outdoor-review.json", "utf8"),
);
const reviewed = new Map(outdoorReview.accepted.map((p) => [p.id, p.sha256]));
const errors = [],
  hashes = new Set(),
  ids = new Set(),
  sources = new Set();
let bytes = 0,
  minKm = Infinity;
function distance(a, b) {
  const r = Math.PI / 180,
    dlat = (b.lat - a.lat) * r,
    dlon = (b.lon - a.lon) * r,
    v =
      Math.sin(dlat / 2) ** 2 +
      Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlon / 2) ** 2;
  return 12742 * Math.atan2(Math.sqrt(v), Math.sqrt(1 - v));
}
for (let i = 0; i < photos.length; i++) {
  const p = photos[i];
  if (ids.has(p.id)) errors.push("DuplicateID " + p.id);
  ids.add(p.id);
  if (sources.has(p.source)) errors.push("DuplicateSource " + p.id);
  sources.add(p.source);
  if (
    !p.author ||
    !p.license ||
    !p.licenseUrl ||
    !Number.isFinite(p.lat) ||
    !Number.isFinite(p.lon)
  )
    errors.push("Missingmetadata " + p.id);
  const data = await fs.readFile("public" + p.image),
    meta = await sharp(data).metadata();
  bytes += data.length;
  const hash = createHash("sha256").update(data).digest("hex");
  if (
    p.environment !== "outdoor" ||
    p.outdoorReviewed !== true ||
    reviewed.get(p.id) !== hash
  )
    errors.push("Missing or stale visual outdoor approval " + p.id);
  if (hashes.has(hash)) errors.push("DuplicateImage " + p.id);
  hashes.add(hash);
  if (
    meta.width / meta.height !== 2 ||
    (p.id.startsWith("pano-") && meta.width !== 2048)
  )
    errors.push("Dimensions " + p.id);
  for (let j = 0; j < i; j++) minKm = Math.min(minKm, distance(p, photos[j]));
}
if (photos.length < 500) errors.push("Under500");
if (minKm < 0.1) errors.push("Locationscloser100m");
const result = {
  count: photos.length,
  uniqueImageHashes: hashes.size,
  uniqueSources: sources.size,
  totalMB: Math.round(bytes / 1048576),
  minimumSeparationMeters: Math.round(minKm * 1000),
  preservedCurated: photos.filter((p) => p.id.startsWith("place-")).length,
  errors,
};
console.log(JSON.stringify(result, null, 2));
await fs.writeFile(
  "outputs/world-validation.json",
  JSON.stringify(result, null, 2),
);
if (errors.length) process.exitCode = 1;
