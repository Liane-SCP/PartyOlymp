import { build } from "esbuild";
import { spawnSync } from "node:child_process";
await build({
  entryPoints: ["tests/refinement.test.ts"],
  outfile: "outputs/refinement.test.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
});
const result = spawnSync(
  process.execPath,
  ["--test", "outputs/refinement.test.mjs"],
  { stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
