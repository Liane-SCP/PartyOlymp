import { build } from "esbuild";
import { spawnSync } from "node:child_process";
await build({ entryPoints: ["tests/journey-transit.test.ts", "tests/journey-labels.test.ts", "tests/nature.test.ts", "tests/wheel.test.ts", "tests/atlas.test.ts", "tests/journey.test.ts", "tests/ceremony.test.ts", "tests/boss-awards.test.ts"], outdir: "outputs/journey-tests", bundle: true, platform: "node", format: "esm", target: "node22" });
const r = spawnSync(process.execPath, ["--test", "outputs/journey-tests/journey-transit.test.js", "outputs/journey-tests/journey-labels.test.js", "outputs/journey-tests/nature.test.js", "outputs/journey-tests/wheel.test.js", "outputs/journey-tests/atlas.test.js", "outputs/journey-tests/journey.test.js", "outputs/journey-tests/ceremony.test.js", "outputs/journey-tests/boss-awards.test.js"], { stdio: "inherit" });
process.exitCode = r.status ?? 1;
