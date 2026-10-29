import { build } from "esbuild";
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
const files = readdirSync("tests").filter((x) => x.endsWith(".test.ts"));
await build({
  entryPoints: files.map((x) => `tests/${x}`),
  outdir: "outputs/audit-tests",
  bundle: true,
  platform: "node",
  format: "esm",
  outExtension: { ".js": ".mjs" },
});
const result = spawnSync(
  process.execPath,
  [
    "--test",
    ...files.map((x) => `outputs/audit-tests/${x.replace(/\.ts$/, ".mjs")}`),
  ],
  { stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
