import { readFile, writeFile } from "node:fs/promises";
import { buildWikiRoutes } from "./wiki-routes.mjs";
const path = new URL("../lib/game/data/wiki.json", import.meta.url);
const bank = JSON.parse(await readFile(path, "utf8"));
bank.tasks = buildWikiRoutes(bank.articles);
await writeFile(path, JSON.stringify(bank, null, 2) + "\n");
console.log(
  `${bank.tasks.length} unique, reachable Wikipedia start/target pairs.`,
);
