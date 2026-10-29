import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/race-view.test.ts'],outfile:'outputs/race-view-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/race-view-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
