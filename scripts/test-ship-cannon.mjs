import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/ship-cannon.test.ts'],outfile:'outputs/ship-cannon-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/ship-cannon-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
