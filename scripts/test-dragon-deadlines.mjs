import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/deadlines-buzzer-kick.test.ts'],outfile:'outputs/dragon-deadline-tests.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});const result=spawnSync(process.execPath,['--test','outputs/dragon-deadline-tests.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
