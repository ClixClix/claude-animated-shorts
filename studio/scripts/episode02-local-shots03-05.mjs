/**
 * Local Windows render of EP02 approved 01–02 plus newly authored 03–05.
 * Full contiguous 243 source frames, 8.1 seconds. The actual first 105
 * frames remain from the same source while Shots 03–05 are visually judged.
 * No GitHub Actions, paid services, narration, or external FFmpeg needed.
 *
 * Run in studio: npm.cmd run episode2:local-shots03-05
 */
import {studioRoot,browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia,renderStill} from '@remotion/renderer';

const script=path.join(studioRoot,'src/v2/episodes/in-this-town-02/EDITORIAL_SCRATCH_PLAN.json');
const input=JSON.parse(await fs.readFile(script,'utf8'));
const shots=input.shots.map(s=>({
 id:s.id,sequence:s.sequence,act:s.act,
 start:s.estimateStartFrame,end:s.estimateEndFrame,
 narrationAnchor:s.narrationAnchor,cameraAndAction:s.cameraAndAction,
 soundCue:s.soundCue
}));
const boundaries=[0,84,105,153,183,243];
if(shots.length!==60||shots.at(-1).end!==3876||
   boundaries.some((v,i)=>i<5&&shots[i].start!==v)||
   boundaries.slice(1).some((v,i)=>shots[i].end!==v))
 throw new Error('Episode 02 timing unexpectedly changed: expected 01–05 = [0,84,105,153,183,243].');

const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02');
const review=path.join(out,'shots03-05-review');
await fs.mkdir(review,{recursive:true});
const props={shots,captions:[],previewScale:.5,optimize:true,audioApproved:false};
await fs.writeFile(path.join(out,'render-props.json'),JSON.stringify(props,null,2)+'\n');

function run(args){
 console.log('CHECK '+args.join(' '));
 execFileSync(process.execPath,args,{cwd:studioRoot,stdio:'inherit'});
}
run([path.join(studioRoot,'node_modules/typescript/bin/tsc'),'--noEmit']);
run([path.join(studioRoot,'scripts/episode02-style-preflight.mjs')]);

const url=await bundle({entryPoint:path.join(studioRoot,'src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
const video=path.join(review,'EP02_Shots01-05_540p_Review.mp4');
try{
 const composition=await selectComposition({
  serveUrl:url,id:'InThisTownEpisode02Box',inputProps:props,
  puppeteerInstance:browser,logLevel:'error'
 });
 // One real uninterrupted 8.1s film makes it possible to judge both the
 // approved crane/box and new 03→04→05 story escalation in context.
 await renderMedia({
  overwrite:true,serveUrl:url,composition,inputProps:props,
  frameRange:[0,242],outputLocation:video,codec:'h264',
  crf:18,pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:95,
  scale:.5,concurrency:renderConcurrency(),
  puppeteerInstance:browser,chromiumOptions,logLevel:'error',
  timeoutInMilliseconds:240000
 });
 const frames=[104,105,117,128,139,151,152,153,163,173,182,183,205,226,242];
 const stills=[];
 for(const frame of frames){
  const name='EP02_frame_'+String(frame).padStart(3,'0')+'.png';
  try{
   await renderStill({
    serveUrl:url,composition,inputProps:props,frame,scale:.5,
    output:path.join(review,name),imageFormat:'png',
    puppeteerInstance:browser,chromiumOptions,logLevel:'error'
   });
   stills.push({frame,file:name,status:'rendered'});
  }catch(e){
   console.warn('Frame preview failed',frame,String(e));
   stills.push({frame,status:'failed',reason:String(e)});
  }
 }
 await fs.writeFile(path.join(review,'EP02_Shots03-05_Review.json'),
  JSON.stringify({
   stage:'RENDERED_AWAITING_ACTUAL_ARTISTIC_REVIEW',
   frameRange:[0,242],shots:[1,2,3,4,5],
   newShots:[3,4,5],fps:30,seconds:8.1,
   format:'540x960 silent visual preview',
   newShotBounds:{3:[105,152],4:[153,182],5:[183,242]},
   intendedBeats:[
    'Same original kitten visibly folds into its physical box',
    'Second cardboard box twitches; on-sidewalk shoppers recoil',
    'Mocha approaches and actively avoids the box'
   ],
   releaseApproved:false,audioChecked:false,reviewStills:stills
  },null,2)+'\n');
}finally{
 await browser.close({silent:true});
}
const st=await fs.stat(video);
if(st.size<1000)throw new Error('MP4 was not created correctly: '+video);
console.log('\nEPISODE 02 SHOTS 01–05 LOCAL RENDER COMPLETE');
console.log('Video: '+video);
console.log('Frames: 243 / 8.1 seconds / 30fps / 540x960');
console.log('Inspect newly authored frames 105–242 and every shot transition.');
