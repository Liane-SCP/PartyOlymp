import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/rematch.test.ts'],outfile:'outputs/rematch.test.mjs',bundle:true,platform:'node',format:'esm',target:'node22'});
const r=spawnSync(process.execPath,['--test','outputs/rematch.test.mjs'],{stdio:'inherit'});process.exitCode=r.status??1;
