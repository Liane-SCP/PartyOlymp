import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/dragon-altar.test.ts'],outfile:'outputs/dragon-altar-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});const result=spawnSync(process.execPath,['--test','outputs/dragon-altar-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
