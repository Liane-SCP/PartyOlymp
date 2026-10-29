import { build } from "esbuild";
import { spawnSync } from "node:child_process";
await build({entryPoints:["tests/categories.test.ts"],outfile:"outputs/categories.test.mjs",bundle:true,platform:"node",format:"esm",target:"node22"});
const result=spawnSync(process.execPath,["--test","outputs/categories.test.mjs"],{stdio:"inherit"});process.exitCode=result.status??1;
