import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/kraken-salvo.test.ts'],outfile:'outputs/kraken-salvo-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/kraken-salvo-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
