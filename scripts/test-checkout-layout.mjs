import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/checkout-layout.test.ts'],outfile:'outputs/checkout-layout-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});const r=spawnSync(process.execPath,['--test','outputs/checkout-layout-test.mjs'],{stdio:'inherit'});process.exitCode=r.status??1;
