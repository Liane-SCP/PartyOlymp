import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/colossus-runes.test.ts'],outfile:'outputs/colossus-runes-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/colossus-runes-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
