import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/geo-camera.test.ts'],outfile:'outputs/geo-camera-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const r=spawnSync(process.execPath,['--test','outputs/geo-camera-test.mjs'],{stdio:'inherit'});process.exitCode=r.status??1;
