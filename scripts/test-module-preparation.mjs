import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/module-preparation.test.ts'],outfile:'outputs/module-preparation-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});const result=spawnSync(process.execPath,['--test','outputs/module-preparation-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
