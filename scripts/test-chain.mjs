import {build} from "esbuild";
import {spawnSync} from "node:child_process";
await build({entryPoints:["tests/chain.test.ts"],outfile:"outputs/chain.test.mjs",bundle:true,platform:"node",format:"esm",target:"node22"});
const result=spawnSync(process.execPath,["--test","outputs/chain.test.mjs"],{stdio:"inherit"});process.exitCode=result.status??1;
