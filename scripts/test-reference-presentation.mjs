import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/reference-presentation.test.ts'],outfile:'outputs/reference-presentation-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/reference-presentation-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
