import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/scene-audio-frame.test.ts'],outfile:'outputs/scene-audio-frame-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/scene-audio-frame-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
