import { build } from "esbuild";
import { spawnSync } from "node:child_process";
await build({
  entryPoints: ["tests/game-fixes.test.ts"],
  outfile: "outputs/game-fixes.test.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
});
process.exitCode =
  spawnSync(process.execPath, ["--test", "outputs/game-fixes.test.mjs"], {
    stdio: "inherit",
  }).status ?? 1;
