import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/chain-expedition.test.ts'],outfile:'outputs/chain-expedition-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
process.exitCode=spawnSync(process.execPath,['--test','outputs/chain-expedition-test.mjs'],{stdio:'inherit'}).status??1;
