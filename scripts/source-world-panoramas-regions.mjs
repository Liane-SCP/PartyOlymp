import fs from "node:fs/promises";
const file = "outputs/world-source-checkpoint.json",
  state = JSON.parse(await fs.readFile(file, "utf8"));
const places = [
  "South Africa",
  "Tanzania",
  "Australia",
  "India",
  "the Philippines",
  "Mexico",
  "Kazakhstan",
  "Kyrgyzstan",
];
const strip = (s) =>
  String(s ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&");
for (const place of places) {
  let cont = {};
  do {
    const url =
      "https://commons.wikimedia.org/w/api.php?" +
      new URLSearchParams({
        action: "query",
        format: "json",
        generator: "categorymembers",
        gcmtitle: "Category:Spherical panoramics in " + place,
        gcmtype: "file",
        gcmlimit: "50",
        prop: "imageinfo",
        iiprop: "url|size|extmetadata",
        iiurlwidth: "2560",
        ...cont,
      });
    let r;
    for (let n = 0; n < 5; n++) {
      r = await fetch(url, {
        headers: {
          "User-Agent":
            "OlympartyPanoramaCatalog/2.0 (educational geography game; Wikimedia Commons reuse)",
        },
        signal: AbortSignal.timeout(60000),
      });
      if (r.status !== 429) break;
      console.log("Rate limit; waiting60s");
      await new Promise((r) => setTimeout(r, 60000));
    }
    if (!r.ok) throw Error("HTTP" + r.status);
    const data = await r.json();
    let added = 0;
    for (const p of Object.values(data.query?.pages ?? {})) {
      const info = p.imageinfo?.[0],
        m = info?.extmetadata,
        lat = Number(m?.GPSLatitude?.value),
        lon = Number(m?.GPSLongitude?.value),
        license = strip(m?.LicenseShortName?.value);
      if (
        !info ||
        Math.abs(info.width / info.height - 2) > 0.01 ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        !/CC BY|CC0|Public domain/i.test(license) ||
        !/\.(jpe?g|png)$/i.test(p.title)
      )
        continue;
      if (!state.candidates.some((c) => c.title === p.title)) {
        state.candidates.push({ title: p.title, lat, lon, info });
        added++;
      }
    }
    console.log(place, "added", added, "total", state.candidates.length);
    await fs.writeFile(file, JSON.stringify(state));
    cont = data.continue;
    await new Promise((r) => setTimeout(r, 10000));
  } while (cont);
}
