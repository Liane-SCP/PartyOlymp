import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/ceremony.test.ts'],outfile:'outputs/ceremony-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
process.exitCode=spawnSync(process.execPath,['--test','outputs/ceremony-test.mjs'],{stdio:'inherit'}).status??1;
