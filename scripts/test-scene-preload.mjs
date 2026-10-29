import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/scene-preload.test.ts'],outfile:'outputs/scene-preload-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});const result=spawnSync(process.execPath,['--test','outputs/scene-preload-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
