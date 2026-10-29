import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/atelier-presentation.test.ts'],outfile:'outputs/atelier-presentation-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
process.exitCode=spawnSync(process.execPath,['--test','outputs/atelier-presentation-test.mjs'],{stdio:'inherit'}).status??1;
