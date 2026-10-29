import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/party-flow.test.ts'],outfile:'outputs/party-flow.test.mjs',bundle:true,platform:'node',format:'esm',target:'node22'});
process.exitCode=spawnSync(process.execPath,['--test','outputs/party-flow.test.mjs'],{stdio:'inherit'}).status??1;
