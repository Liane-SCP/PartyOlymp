import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/dice-results.test.ts'],outfile:'outputs/dice-results-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
process.exitCode=spawnSync(process.execPath,['--test','outputs/dice-results-test.mjs'],{stdio:'inherit'}).status??1;
