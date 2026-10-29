import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/camera-direction.test.ts'],outfile:'outputs/camera-direction-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
process.exitCode=spawnSync(process.execPath,['--test','outputs/camera-direction-test.mjs'],{stdio:'inherit'}).status??1;
