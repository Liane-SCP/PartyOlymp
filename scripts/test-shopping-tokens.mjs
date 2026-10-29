import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/shopping-token-batch.test.ts'],outfile:'outputs/shopping-token-batch-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});const result=spawnSync(process.execPath,['--test','outputs/shopping-token-batch-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
