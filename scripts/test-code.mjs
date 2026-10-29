import { build } from "esbuild";
import { spawnSync } from "node:child_process";
await build({
  entryPoints: ["tests/code.test.ts"],
  outfile: "outputs/code.test.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
process.exitCode =
  spawnSync(process.execPath, ["--test", "outputs/code.test.mjs"], {
    stdio: "inherit",
  }).status ?? 1;
