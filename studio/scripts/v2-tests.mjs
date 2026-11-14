import './lib/runtime.mjs';
import {spawnSync} from 'node:child_process';
const commands=[['node_modules/typescript/bin/tsc','--noEmit'],['src/v2/cafe/layout.test.mjs'],['src/v2/animation/timeline.test.mjs'],['scripts/v2-narration.mjs','test'],['scripts/door-at-1111-tests.mjs']];
for(const args of commands){const result=spawnSync(process.execPath,args,{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);}
console.log('TypeScript, café, animation, narration and episode regressions passed. No render or provider request was made.');
