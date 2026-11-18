/**
 * Episode 02 LOCAL WINDOWS render entrypoint.
 *
 * Run in C:\\V2\\studio:
 *   node scripts/episode02-local-opening.mjs
 *
 * Does not require GitHub Actions, FFmpeg, a voice file, online assets,
 * subscription media APIs or uploading/publishing any output.
 * Renders the 105-frame / 3.5-second continuous Shot 01 -> 02 camera
 * into out/v2-episodes/in-this-town-02/opening-crane-review/.
 */
import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const jsonPath=path.join(root,'src/v2/episodes/in-this-town-02/EDITORIAL_SCRATCH_PLAN.json');
const source=JSON.parse(await fs.readFile(jsonPath,'utf8'));
if(!Array.isArray(source.shots)||source.shots.length!==60||
   source.shots[0].estimateStartFrame!==0||source.shots[0].estimateEndFrame!==84||
   source.shots[1].estimateStartFrame!==84||source.shots[1].estimateEndFrame!==105||
   source.shots.at(-1).estimateEndFrame!==3876){
 throw Error('Unexpected Episode 02 edit: expected 60 shots / 3,876 frames with 0–83 and 84–104 opening.');
}
const shots=source.shots.map(s=>({
 id:s.id,sequence:s.sequence,act:s.act,
 start:s.estimateStartFrame,end:s.estimateEndFrame,
 narrationAnchor:s.narrationAnchor,
 cameraAndAction:s.cameraAndAction,soundCue:s.soundCue
}));
const out=path.join(root,'out/v2-episodes/in-this-town-02');
await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,'render-props.json'),JSON.stringify({
 shots,captions:[],previewScale:.5,optimize:true,audioApproved:false
},null,2)+'\n');

const run=(args)=>{
 console.log('\n> '+process.execPath+' '+args.join(' '));
 execFileSync(process.execPath,args,{cwd:root,stdio:'inherit',env:{
  ...process.env,V2_RENDER_CONCURRENCY:process.env.V2_RENDER_CONCURRENCY||'2'
 }});
};
run([path.join(root,'node_modules/typescript/bin/tsc'),'--noEmit']);
run([path.join(root,'scripts/episode02-style-preflight.mjs')]);
run([path.join(root,'scripts/episode02-opening-crane-preview.mjs')]);

const mp4=path.join(out,'opening-crane-review/EP02_Shots01-02_ContinuousCrane_540p.mp4');
const stat=await fs.stat(mp4);
if(stat.size<1000)throw Error('MP4 file is unexpectedly empty: '+mp4);
console.log('\nLOCAL SHOT 01 -> 02 EXPORT COMPLETE');
console.log('Video: '+mp4);
console.log('Duration: 3.5 seconds / 105 frames at 30fps / 540 x 960');
console.log('This is silent source footage. Check frames 82-85 before approving.');
