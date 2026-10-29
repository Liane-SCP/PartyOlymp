import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
await mkdir("outputs", { recursive: true });
await build({
  entryPoints: ["tests/engine.test.ts"],
  outfile: "outputs/engine.test.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
});
const result = spawnSync(
  process.execPath,
  ["--test", "outputs/engine.test.mjs"],
  { stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
