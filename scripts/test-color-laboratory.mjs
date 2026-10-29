import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/color-laboratory.test.ts'],outfile:'outputs/color-laboratory.test.mjs',bundle:true,platform:'node',format:'esm',target:'node22'});
const r=spawnSync(process.execPath,['--test','outputs/color-laboratory.test.mjs'],{stdio:'inherit'});process.exitCode=r.status??1;
