import { build } from "esbuild";
import { spawnSync } from "node:child_process";
await build({
  entryPoints: ["tests/trio.test.ts"],
  outfile: "outputs/trio.test.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
});
process.exitCode =
  spawnSync(process.execPath, ["--test", "outputs/trio.test.mjs"], {
    stdio: "inherit",
  }).status ?? 1;
