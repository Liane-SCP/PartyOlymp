import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/static-batches.test.ts'],outfile:'outputs/static-batches-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/static-batches-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
