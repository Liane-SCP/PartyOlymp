import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/shopping-displays.test.ts'],outfile:'outputs/shopping-displays-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/shopping-displays-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
