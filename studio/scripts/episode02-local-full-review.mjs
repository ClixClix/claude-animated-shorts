/**
 * Windows/local complete 60-shot Episode 02 silent visual QA.
 *
 * GitHub Actions may be unavailable on the user's fork. This is the SAME
 * full 3,876-frame episode, not a montage of selected shots. The existing
 * per-shot renderer caches only source/props-matching segments, so interrupted
 * renders can resume without mixing versions. No audio generation or upload.
 *
 * From C:\\V2\\ep02-local-render\\studio:
 *   npm.cmd run episode2:local-full-review
 */
import {studioRoot} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02');
await fs.mkdir(out,{recursive:true});
const started=new Date().toISOString();
const steps=[];
function run(name,script,args=[],optional=false){
 console.log('\n=== EP02 FULL 60-SHOT: '+name+' ===');
 const result=spawnSync(process.execPath,[path.join(studioRoot,'scripts',script),...args],
  {cwd:studioRoot,stdio:'inherit',windowsHide:false});
 const ok=!result.error&&result.status===0;
 steps.push({name,script,args,passed:ok,
  status:result.status,error:result.error?String(result.error):null,
  optional});
 if(!ok&&!optional)throw Error('Episode02 '+name+' failed; see output above. Rerun after fixing to resume source-matched shots.');
 return ok;
}
const ffmpeg=spawnSync('ffmpeg',['-version'],{encoding:'utf8',windowsHide:true});
const ffprobe=spawnSync('ffprobe',['-version'],{encoding:'utf8',windowsHide:true});
if(ffmpeg.error||ffmpeg.status!==0||ffprobe.error||ffprobe.status!==0)
 throw Error('FFmpeg and FFprobe must be on PATH. Local full review did not start.');
const git=spawnSync('git',['rev-parse','HEAD'],{cwd:studioRoot,encoding:'utf8',windowsHide:true});
const sourceCommit=git.status===0?git.stdout.trim():null;
let failure=null;
try{
 run('Episode01 style, TypeScript, box and finale geometry','episode02-quality-cycle.mjs');
 // These warnings are vital evidence but should not prevent rendering actual
 // footage for visual inspection. Their output must be reviewed separately.
 run('Full timeline camera/obstruction diagnostic','episode02-camera-blocker-audit.mjs',[],true);
 run('Prepare EXACT 3876-frame silent scratch','episode02-prepare.mjs',
  ['--allow-scratch','--force-silent-scratch']);
 const manifest=JSON.parse(await fs.readFile(path.join(out,'EP02_SHOT_MANIFEST.json'),'utf8'));
 if(manifest.shots.length!==60||manifest.durationInFrames!==3876||
    manifest.shots[0].start!==0||manifest.shots.at(-1).end!==3876)
  throw Error('Manifest is not the required complete 60-shot 3876-frame edit.');
 const props=JSON.parse(await fs.readFile(path.join(out,'render-props.json'),'utf8'));
 if(props.audioApproved||props.captions.length)
  throw Error('Silent scratch unexpectedly includes narration/captions.');
 run('Render ALL 60 original Remotion shots at 540x960','episode02-render.mjs',['preview']);
 run('Assemble ALL 60 source-matched segments','episode02-assemble.mjs',['preview']);
 run('Decode ALL 3876 frames and extract 180 actual frames','episode02-full-review.mjs');
}catch(error){failure=String(error?.stack??error);console.error(failure);}
const movie=path.join(out,'EP02_540p_Visual.mp4');
const review=path.join(out,'full-timeline-review');
const report={
 stage:failure?'LOCAL_FULL_QA_FAILED':'LOCAL_FULL_60_SHOT_RENDERED_NOT_ARTISTICALLY_APPROVED',
 started,finished:new Date().toISOString(),sourceCommit,
 requiredShots:60,requiredFrames:3876,fps:30,
 previewWidth:540,previewHeight:960,
 movie:failure?null:movie,
 reviewBoard:failure?null:path.join(review,'ALL_60_SHOTS.html'),
 sampleCountExpected:180,steps,failure,
 fullMotionReviewedByHuman:false,episode1ReferenceCompared:false,
 finalAudioIncluded:false,publishingAllowed:false,
 note:'A decoded full 60-shot movie is only a technical proof. Watch every shot and inspect all cat/box contacts, overhead poses, street activity, and camera clipping before any creative signoff.'
};
await fs.writeFile(path.join(out,'EP02_LOCAL_FULL_QA.json'),JSON.stringify(report,null,2)+'\n');
console.log('\n'+JSON.stringify(report,null,2));
if(failure)process.exitCode=2;
