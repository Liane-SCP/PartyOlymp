import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/auction-jury.test.ts'],outfile:'outputs/auction-jury-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
process.exitCode=spawnSync(process.execPath,['--test','outputs/auction-jury-test.mjs'],{stdio:'inherit'}).status??1;
