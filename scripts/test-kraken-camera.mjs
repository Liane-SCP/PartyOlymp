import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/kraken-camera.test.ts'],outfile:'outputs/kraken-camera-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});const result=spawnSync(process.execPath,['--test','outputs/kraken-camera-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
