import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/dragon-camera.test.ts'],outfile:'outputs/dragon-camera-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});const result=spawnSync(process.execPath,['--test','outputs/dragon-camera-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
