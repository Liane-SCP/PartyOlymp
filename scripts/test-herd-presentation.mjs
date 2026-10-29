import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/herd-presentation.test.ts'],outfile:'outputs/herd-presentation-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
process.exitCode=spawnSync(process.execPath,['--test','outputs/herd-presentation-test.mjs'],{stdio:'inherit'}).status??1;
