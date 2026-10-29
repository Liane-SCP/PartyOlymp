import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/race-motor.test.ts'],outfile:'outputs/race-motor-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/race-motor-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
