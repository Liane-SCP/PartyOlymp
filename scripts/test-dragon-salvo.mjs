import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/dragon-salvo.test.ts'],outfile:'outputs/dragon-salvo-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/dragon-salvo-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
