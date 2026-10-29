import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/color-card-table.test.ts'],outfile:'outputs/color-card-table-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});process.exitCode=spawnSync(process.execPath,['--test','outputs/color-card-table-test.mjs'],{stdio:'inherit'}).status??1;
