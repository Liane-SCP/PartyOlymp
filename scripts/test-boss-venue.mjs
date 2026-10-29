import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/boss-venue.test.ts'],outfile:'outputs/boss-venue-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','outputs/boss-venue-test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
