import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { moreSubjects } from "./source-pixel-photos-subjects.mjs";
import { rejectedPhotoAnswers } from "./source-pixel-photos-rejections.mjs";
import { normalizePhotoSubject } from "./source-pixel-photos-aliases.mjs";

// English article names select a recognizable photograph; only Commons photos
// with explicit reusable licensing enter the game. Attribution travels with it.
const subjects = `
Giraffe|Giraffe
Elefant|African bush elephant|Afrikanischer Elefant
Löwe|Lion|Loewe
Tiger|Tiger
Zebra|Plains zebra
Panda|Giant panda|Pandabär
Koala|Koala
Känguru|Red kangaroo|Kaenguru
Eisbär|Polar bear|Eisbaer
Braunbär|Brown bear|Bär,Braunbaer
Fuchs|Red fox|Rotfuchs
Wolf|Wolf
Eichhörnchen|Red squirrel|Eichhoernchen
Igel|European hedgehog
Kaninchen|European rabbit|Hase
Reh|Roe deer
Hirsch|Red deer|Rothirsch
Elch|Moose
Wildschwein|Wild boar
Pferd|Horse
Esel|Donkey
Ziege|Goat
Schaf|Sheep
Kuh|Cattle|Rind
Schwein|Pig
Hund|Dog
Katze|Cat|Hauskatze
Hamster|Golden hamster|Goldhamster
Meerschweinchen|Guinea pig
Alpaka|Alpaca
Lama|Llama
Kamel|Dromedary|Dromedar
Nashorn|White rhinoceros|Rhino
Nilpferd|Hippopotamus|Flusspferd
Gorilla|Gorilla
Orang-Utan|Orangutan|Orangutan
Schimpanse|Chimpanzee
Faultier|Brown-throated sloth
Erdmännchen|Meerkat|Erdmaennchen
Waschbär|Raccoon|Waschbaer
Otter|Eurasian otter|Fischotter
Biber|Eurasian beaver
Robbe|Harbor seal|Seehund
Walross|Walrus
Delfin|Common bottlenose dolphin|Delphin
Buckelwal|Humpback whale|Wal
Orca|Orca|Schwertwal
Hai|Great white shark|Weißer Hai
Clownfisch|Ocellaris clownfish|Anemonenfisch,Nemo
Seepferdchen|Hippocampus kuda
Qualle|Aurelia aurita|Ohrenqualle
Seestern|Common starfish
Krabbe|Carcinus maenas|Krebs,Strandkrabbe
Hummer|European lobster
Oktopus|Common octopus|Krake,Tintenfisch
Schildkröte|Green sea turtle|Meeresschildkröte,Schildkroete
Krokodil|Nile crocodile
Schlange|Ball python|Python
Chamäleon|Veiled chameleon|Chamaeleon
Leguan|Green iguana
Frosch|European tree frog|Laubfrosch
Salamander|Fire salamander|Feuersalamander
Axolotl|Axolotl
Pinguin|King penguin|Königspinguin
Flamingo|Greater flamingo
Pfau|Indian peafowl
Strauß|Common ostrich|Strauss,Vogelstrauß
Pelikan|Great white pelican
Schwan|Mute swan
Ente|Mallard|Stockente
Gans|Greylag goose
Storch|White stork
Eule|Eurasian eagle-owl|Uhu
Adler|Golden eagle|Steinadler
Papagei|Scarlet macaw|Ara
Tukan|Toco toucan
Specht|Great spotted woodpecker|Buntspecht
Rotkehlchen|European robin
Eisvogel|Common kingfisher
Taube|Rock dove
Huhn|Chicken|Hahn
Truthahn|Wild turkey|Pute
Kolibri|Ruby-throated hummingbird
Biene|Western honey bee|Honigbiene
Hummel|Buff-tailed bumblebee
Marienkäfer|Coccinella septempunctata|Marienkaefer
Schmetterling|Monarch butterfly|Falter
Libelle|Emperor dragonfly
Ameise|Red wood ant|Waldameise
Heuschrecke|Locusta migratoria|Grashüpfer
Schnecke|Helix pomatia|Weinbergschnecke
Spinne|European garden spider|Kreuzspinne
Skorpion|Emperor scorpion
Apfel|Apple
Banane|Banana
Orange|Orange (fruit)|Apfelsine
Zitrone|Lemon
Limette|Lime (fruit)
Erdbeere|Strawberry
Himbeere|Raspberry
Heidelbeere|Blueberry|Blaubeere
Weintraube|Grape|Traube,Trauben
Ananas|Pineapple
Wassermelone|Watermelon|Melone
Kiwi|Kiwifruit
Mango|Mango
Papaya|Papaya
Kokosnuss|Coconut
Avocado|Avocado
Pfirsich|Peach
Birne|Pear
Kirsche|Cherry
Granatapfel|Pomegranate
Karotte|Carrot|Möhre,Karotten
Kartoffel|Potato
Tomate|Tomato
Gurke|Cucumber
Brokkoli|Broccoli
Blumenkohl|Cauliflower
Kürbis|Pumpkin|Kuerbis
Zwiebel|Onion
Knoblauch|Garlic
Aubergine|Eggplant
Mais|Maize|Maiskolben
Spargel|Asparagus
Radieschen|Radish
Champignon|Agaricus bisporus|Pilz
Sonnenblume|Helianthus annuus
Rose|Rose
Tulpe|Tulip
Lavendel|Lavandula angustifolia
Kaktus|Saguaro
Fliegenpilz|Amanita muscaria
Eiffelturm|Eiffel Tower|Eiffel Tower
Freiheitsstatue|Statue of Liberty
Big Ben|Big Ben|Elizabeth Tower
Kolosseum|Colosseum|Kolosseum Rom
Taj Mahal|Taj Mahal|Tadsch Mahal
Golden Gate Bridge|Golden Gate Bridge|Golden Gate,Brücke
Schiefer Turm von Pisa|Leaning Tower of Pisa|Turm von Pisa,Pisa
Sydney Opera House|Sydney Opera House|Opernhaus Sydney,Oper von Sydney
Brandenburger Tor|Brandenburg Gate
Schloss Neuschwanstein|Neuschwanstein Castle|Neuschwanstein
Stonehenge|Stonehenge
Christusstatue|Christ the Redeemer (statue)|Christusstatue Rio,Christus der Erlöser
Sphinx|Great Sphinx of Giza|Sphinx von Gizeh
Chinesische Mauer|Great Wall of China|Große Mauer
Pyramide|Great Pyramid of Giza|Pyramiden,Cheops-Pyramide
`
  .trim()
  .split("\n")
  .map((line) => {
    const [answer, title, aliases = ""] = line.split("|");
    return {
      answer,
      title,
      aliases: [answer, ...aliases.split(",").filter(Boolean)],
    };
  });

subjects.push(
  ...moreSubjects.filter(
    (subject) =>
      !subjects.some((existing) => existing.answer === subject.answer),
  ),
);
for (let index = 0; index < subjects.length; index++)
  subjects[index] = normalizePhotoSubject(subjects[index]);
if (process.argv.includes("--cooldown")) {
  console.log("Respecting upload cooldown: 60 seconds");
  await new Promise((r) => setTimeout(r, 60000));
}
const root = process.cwd(),
  folder = path.join(root, "public/pixel-photos");
await fs.mkdir(folder, { recursive: true });
const jsonPath = path.join(root, "lib/game/data/pixel-photos.json");
let photos = [];
try {
  photos = JSON.parse(await fs.readFile(jsonPath, "utf8"));
} catch {}
photos = photos.map(normalizePhotoSubject);
const removedPhotos = photos.filter((photo) =>
  rejectedPhotoAnswers.has(photo.answer),
);
photos = photos.filter((photo) => !rejectedPhotoAnswers.has(photo.answer));
for (const photo of removedPhotos) {
  if (/^photo-\d+$/.test(photo.id))
    await fs.unlink(path.join(folder, photo.id + ".webp")).catch(() => {});
}
if (removedPhotos.length) await persistPhotos();
async function persistPhotos() {
  await fs.writeFile(
    jsonPath + ".next",
    JSON.stringify(photos, null, 2) + "\n",
  );
  await fs.rename(jsonPath + ".next", jsonPath);
}
const wikiLanguage = process.argv.includes("--german") ? "de" : "en";
if (wikiLanguage === "de")
  for (const subject of subjects) subject.title = subject.answer;
const headers = {
  "User-Agent":
    "OlympartyPhotoLibrary/1.0 (educational picture guessing game; reusable Commons photos)",
};
const throttleHistory = new Map();
async function get(url) {
  const host = new URL(url).hostname;
  for (let n = 0; n < 4; n++) {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(25000),
    });
    if (response.ok) return response;
    if (response.status === 429 || response.status >= 500) {
      const raw = response.headers.get("retry-after");
      const seconds = Number(raw);
      const requested = raw
        ? Number.isFinite(seconds)
          ? seconds * 1000
          : Math.max(0, Date.parse(raw) - Date.now())
        : 0;
      const strikes =
        response.status === 429 ? throttleHistory.get(host) || 0 : 0;
      if (response.status === 429) throttleHistory.set(host, strikes + 1);
      const wait =
        response.status === 429
          ? Math.max(
              Number.isFinite(requested) ? requested : 0,
              Math.min(180000, 60000 * 2 ** strikes),
            )
          : 2500 * (n + 1);
      console.log(
        "Service " +
          host +
          " HTTP " +
          response.status +
          "; Retry-After=" +
          (raw || "none") +
          "; respecting " +
          wait / 1000 +
          "s backoff",
      );
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error("HTTP " + response.status);
  }
  throw new Error("retry limit");
}
const strip = (html) =>
  String(html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#160;|&nbsp;/g, " ")
    .trim();
const candidates = [];
const cachePath = path.join(
  root,
  "outputs/qa/pixel-photo-candidates-expanded.json",
);
let cached = [];
try {
  cached = JSON.parse(await fs.readFile(cachePath, "utf8"));
} catch {}
if (process.argv.includes("--download-cache"))
  candidates.push(
    ...cached.filter((x) => !process.argv.includes("--ready-only") || x.info),
  );
// Visual review rejected these article lead images: botanical illustrations,
// not photographs. Do not reintroduce them on a later refresh.
const rejectedTitles = new Set([
  "Papaya",
  "Coconut",
  "Peach",
  "Garlic",
  "Maize",
]);
for (
  let offset = 0;
  !process.argv.includes("--credits-only") &&
  !process.argv.includes("--download-cache") &&
  offset < subjects.length;
  offset += 40
) {
  const batch = subjects
    .slice(offset, offset + 40)
    .filter(
      (subject) =>
        !rejectedTitles.has(subject.title) &&
        !photos.some((p) => p.answer === subject.answer),
    );
  if (!batch.length) continue;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "pageimages",
    piprop: "original",
    redirects: "1",
    titles: batch.map((x) => x.title).join("|"),
  });
  const response = await (
    await get(`https://${wikiLanguage}.wikipedia.org/w/api.php?` + params)
  ).json();
  const pages = Object.values(response.query.pages);
  for (const subject of batch) {
    try {
      let title = subject.title;
      for (const item of [
        ...(response.query.normalized || []),
        ...(response.query.redirects || []),
      ])
        if (item.from === title) title = item.to;
      const page = pages.find((p) => p.title === title);
      const summary = { originalimage: page?.original };
      if (!summary.originalimage?.source?.includes("/commons/")) continue;
      const imagePath = new URL(summary.originalimage.source).pathname.split(
        "/",
      );
      const filename = decodeURIComponent(
        imagePath.at(imagePath.includes("thumb") ? -2 : -1),
      );
      if (!/\.(jpe?g|png|webp)$/i.test(filename)) continue;
      candidates.push({
        ...subject,
        filename,
        summary,
        info: cached.find((p) => p.filename === filename)?.info,
      });
    } catch (error) {
      console.log("Summary unavailable:", subject.answer, error.message);
    }
  }
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  if (!process.argv.includes("--credits-only"))
    await fs.writeFile(cachePath, JSON.stringify(candidates));
  console.log(
    `Subjects ${offset + batch.length}/${subjects.length}: ${candidates.length} photo candidates`,
  );
  await new Promise((r) => setTimeout(r, 2500));
}
console.log(`Found ${candidates.length} candidate photographs`);
await fs.mkdir(path.join(root, "outputs/qa"), { recursive: true });
if (!process.argv.includes("--credits-only"))
  await fs.writeFile(cachePath, JSON.stringify(candidates));
for (
  let offset = 0;
  !process.argv.includes("--ready-only") && offset < candidates.length;
  offset += 20
) {
  const batch = candidates.slice(offset, offset + 20).filter((x) => !x.info);
  if (!batch.length) continue;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size",
    iiurlwidth: "640",
    titles: batch.map((x) => "File:" + x.filename).join("|"),
  });
  const data = await (
    await get("https://commons.wikimedia.org/w/api.php?" + params)
  ).json();
  const infos = Object.values(data.query.pages);
  for (const subject of batch)
    subject.info = infos.find(
      (p) =>
        p.title.replaceAll("_", " ") ===
        ("File:" + subject.filename).replaceAll("_", " "),
    )?.imageinfo?.[0];
  if (!process.argv.includes("--credits-only"))
    await fs.writeFile(cachePath, JSON.stringify(candidates));
  console.log(`License metadata ${offset + batch.length}/${candidates.length}`);
  await new Promise((r) => setTimeout(r, 10000));
}
if (!process.argv.includes("--credits-only"))
  await fs.writeFile(cachePath, JSON.stringify(candidates));
for (const candidate of candidates) {
  const subject = normalizePhotoSubject(candidate);
  if (
    photos.some((p) => p.answer === subject.answer) ||
    rejectedPhotoAnswers.has(subject.answer)
  )
    continue;
  if (photos.length >= 520) break;
  try {
    const summary = subject.summary;
    if (!summary.originalimage?.source?.includes("/commons/"))
      throw new Error("No Commons image");
    const imagePath = new URL(summary.originalimage.source).pathname.split("/");
    const filename = decodeURIComponent(
      imagePath.at(imagePath.includes("thumb") ? -2 : -1),
    );
    if (!/\.(jpe?g|png|webp)$/i.test(filename))
      throw new Error("Not a photograph format");
    const info = subject.info;
    if (!info) throw new Error("No Commons metadata");
    if (photos.some((p) => p.source === info.descriptionurl))
      throw new Error("Duplicate photograph");
    const metadata = info?.extmetadata;
    const description = strip(metadata?.ImageDescription?.value);
    if (
      /(botanical illustration|illustration from|illustration of|engraving|lithograph|oil on canvas|watercolor|watercolour|drawing of|in this drawing|diagram of)/i.test(
        description,
      )
    )
      throw new Error("Illustration instead of photo");
    const license = strip(metadata?.LicenseShortName?.value);
    if (!/CC BY|CC0|Public domain/i.test(license))
      throw new Error("License not accepted: " + license);
    const img = await get(info.thumburl || info.url);
    if (!img.headers.get("content-type")?.startsWith("image/"))
      throw new Error("Non-image response");
    const buffer = Buffer.from(await img.arrayBuffer());
    const resized = await sharp(buffer)
      .rotate()
      .resize({
        width: 640,
        height: 480,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 78 })
      .toBuffer();
    const dimensions = await sharp(resized).metadata();
    if (dimensions.width < 180 || dimensions.height < 130)
      throw new Error("Image too small");
    const nextId =
      Math.max(0, ...photos.map((p) => Number(p.id.replace("photo-", "")))) + 1;
    const id = `photo-${String(nextId).padStart(3, "0")}`;
    await fs.writeFile(path.join(folder, id + ".webp"), resized);
    photos.push({
      id,
      answer: subject.answer,
      aliases: subject.aliases,
      image: `/pixel-photos/${id}.webp`,
      width: dimensions.width,
      height: dimensions.height,
      source: info.descriptionurl,
      author:
        strip(metadata.Artist?.value || metadata.Credit?.value) ||
        "Wikimedia Commons contributors",
      license,
      licenseUrl:
        metadata.LicenseUrl?.value ||
        "https://commons.wikimedia.org/wiki/Help:Public_domain",
      original: info.url,
      changes:
        "Resized and converted to WebP; displayed pixelated during guessing.",
    });
    await fs.mkdir(path.dirname(jsonPath), { recursive: true });
    await persistPhotos();
    console.log(
      `${photos.length}: ${subject.answer} (${resized.length} B; ${license})`,
    );
  } catch (error) {
    console.log(`SKIP ${subject.answer}: ${error.message}`);
  }
  await new Promise((r) => setTimeout(r, 1500));
}
await persistPhotos();
const escape = (s) =>
  String(s).replace(
    /[&<>\"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
await fs.writeFile(
  path.join(folder, "credits.html"),
  `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Pixelblitz · Bildnachweise</title><style>body{font:16px system-ui;max-width:1100px;margin:40px auto;padding:20px;background:#111827;color:#eef2ff}a{color:#adff65}section{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px}article{background:#202a3b;padding:16px;border-radius:16px}img{width:100%;height:150px;object-fit:contain}p{overflow-wrap:anywhere;font-size:14px}</style><h1>Pixelblitz · ${photos.length} echte Fotos</h1><p>Die Fotos wurden verkleinert und in WebP umgewandelt. Im Spiel werden sie zeitweise verpixelt dargestellt. Die jeweilige Originaldatei und Lizenz sind unten verlinkt.</p><section>${photos.map((p) => `<article><img src="${escape(p.image)}" alt="${escape(p.answer)}" loading="lazy"><h2>${escape(p.answer)}</h2><p>${escape(p.author)}</p><a href="${escape(p.source)}">Original & Bildnachweis</a><p><a href="${escape(p.licenseUrl)}">${escape(p.license)}</a></p></article>`).join("")}</section></html>`,
);
console.log(`DONE ${photos.length} licensed real photographs`);
