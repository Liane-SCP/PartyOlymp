import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/wiki-presentation.test.ts'],outfile:'outputs/wiki-presentation-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
process.exitCode=spawnSync(process.execPath,['--test','outputs/wiki-presentation-test.mjs'],{stdio:'inherit'}).status??1;
