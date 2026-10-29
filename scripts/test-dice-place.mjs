import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/dice-place.test.ts'],outfile:'outputs/dice-place-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/dice-place-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
