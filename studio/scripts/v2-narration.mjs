// No new dependencies: the project already includes esbuild through its Remotion toolchain.
import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const mode=process.argv[2];fs.mkdirSync('out/v2-narration/tools',{recursive:true});
const test=mode==='test';const file=test?'test.mjs':'cli.mjs';
await build({entryPoints:[test?'src/v2/narration/tests/narration.test.ts':'src/v2/narration/server/cli.ts'],bundle:true,platform:'node',format:'esm',target:'node24',outfile:'out/v2-narration/tools/'+file,sourcemap:false});
if(test)await build({entryPoints:['src/v2/narration/tests/townAudition.test.ts'],bundle:true,platform:'node',format:'esm',target:'node24',outfile:'out/v2-narration/tools/town-audition-test.mjs',sourcemap:false});
if(test)await build({entryPoints:['src/v2/narration/tests/processing.test.ts'],bundle:true,platform:'node',format:'esm',target:'node24',outfile:'out/v2-narration/tools/processing-test.mjs',sourcemap:false});
const r=spawnSync(process.execPath,[...(test?['--test']:[]),'out/v2-narration/tools/'+file,...(test?['out/v2-narration/tools/town-audition-test.mjs','out/v2-narration/tools/processing-test.mjs']:process.argv.slice(2))],{stdio:'inherit',env:{...process.env,NODE_USE_ENV_PROXY:'1'}});process.exitCode=r.status??1;
