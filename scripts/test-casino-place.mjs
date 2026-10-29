import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/casino-place.test.ts'],outfile:'outputs/casino-place-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/casino-place-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
