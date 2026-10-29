import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
await build({ entryPoints:['tests/new-games.test.ts'],outfile:'outputs/new-games.test.mjs',bundle:true,platform:'node',format:'esm',target:'node22' });
const result=spawnSync(process.execPath,['--test','outputs/new-games.test.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
