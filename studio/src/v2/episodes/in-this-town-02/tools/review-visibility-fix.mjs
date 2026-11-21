import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url)),studio=path.resolve(here,'../../../../..');
const run=args=>{const r=spawnSync(process.execPath,args,{cwd:studio,stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw Error('Review stopped: '+args.join(' '));};
run([path.join(here,'scene-visibility-test.mjs')]);
const shots='04,05,06,07,09,10,11,12,13,14,15,16,17,19,20,22,23,24,28,29,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,57,58,59,60';
run([path.join(here,'review-story-direction.mjs'),'--shots',shots]);
