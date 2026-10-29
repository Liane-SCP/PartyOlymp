import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/size-presentation.test.ts'],outfile:'outputs/size-presentation-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
process.exitCode=spawnSync(process.execPath,['--test','outputs/size-presentation-test.mjs'],{stdio:'inherit'}).status??1;
