import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/casino-table.test.ts'],outfile:'outputs/casino-table-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
await build({entryPoints:['tests/casino-spectator.test.ts'],outfile:'outputs/casino-spectator-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/casino-table-test.mjs','outputs/casino-spectator-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
