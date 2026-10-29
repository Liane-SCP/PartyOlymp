import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/adventure.test.ts'],outfile:'outputs/adventure-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/adventure-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
