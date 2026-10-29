import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/budget-receipts.test.ts'],outfile:'outputs/budget-receipts-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});process.exitCode=spawnSync(process.execPath,['--test','outputs/budget-receipts-test.mjs'],{stdio:'inherit'}).status??1;
