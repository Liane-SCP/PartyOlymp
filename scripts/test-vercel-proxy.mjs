import { build } from "esbuild";
import { spawnSync } from "node:child_process";
await build({ entryPoints: ["tests/vercel-proxy.test.ts"], outfile: "outputs/vercel-proxy.test.mjs", bundle: true, platform: "node", format: "esm", target: "node22" });
process.exitCode = spawnSync(process.execPath, ["--test", "outputs/vercel-proxy.test.mjs"], { stdio: "inherit" }).status ?? 1;
