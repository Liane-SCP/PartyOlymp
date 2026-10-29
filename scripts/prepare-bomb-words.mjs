import { mkdir, writeFile } from "node:fs/promises";
const base =
  "https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/de/";
const [dic, license] = await Promise.all(
  ["index.dic", "license"].map(async (file) => {
    const r = await fetch(base + file);
    if (!r.ok) throw new Error(`${file}: ${r.status}`);
    return r.text();
  }),
);
const words = [
  ...new Set(
    dic
      .split(/\r?\n/)
      .slice(1)
      .map((x) => x.split("/")[0])
      .filter((x) => /^[A-Za-zÄÖÜäöüß]{3,24}$/.test(x))
      .map((x) => x.toLocaleLowerCase("de").replaceAll("ß", "ss")),
  ),
];
const counts = new Map();
for (const word of words) {
  const parts = new Set();
  for (let size = 2; size <= 3; size++)
    for (let i = 0; i <= word.length - size; i++) {
      const s = word.slice(i, i + size);
      if (/^[a-z]+$/.test(s)) parts.add(s);
    }
  for (const s of parts) counts.set(s, (counts.get(s) || 0) + 1);
}
const fragments = [...counts]
  .filter(([s, n]) => n >= 40 && n <= 3000)
  .map(([text, count]) => ({ id: `bomb-${text}`, text, count }));
if (words.length < 20000 || fragments.length < 500)
  throw new Error("Pool too small");
await mkdir("public/wordbook", { recursive: true });
await writeFile("lib/game/data/bomb-words.json", JSON.stringify(words));
await writeFile("lib/game/data/bomb-fragments.json", JSON.stringify(fragments));
await writeFile("public/wordbook/words.json", JSON.stringify(words));
await writeFile("public/wordbook/LICENSE.txt", license);
await writeFile(
  "public/wordbook/source.txt",
  `German word data: igerman98 by Björn Jacke; distributed by wooorm/dictionaries.\nSource: ${base}index.dic\nLicense: GPL-2.0 OR GPL-3.0 (see LICENSE.txt).\nDerived by scripts/prepare-bomb-words.mjs: dictionary headwords, lowercase, ß→ss, 3–24 letters. No affix expansion.\n`,
);
console.log({ words: words.length, fragments: fragments.length });
