/**
 * User-facing LOCAL Windows rig + box-perspective review.
 * Shots 01–02 remain source-locked; the contiguous clip starts at 03.
 * Renders all of 03–07 (291 frames at 30fps) and diagnostic stills of
 * later Essie box scenes. No cloud/GitHub Actions, no paid APIs or audio.
 */
import {studioRoot,browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia,renderStill} from '@remotion/renderer';

const script=path.join(studioRoot,'src/v2/episodes/in-this-town-02/EDITORIAL_SCRATCH_PLAN.json');
const source=JSON.parse(await fs.readFile(script,'utf8'));
const shots=source.shots.map(s=>({
 id:s.id,sequence:s.sequence,act:s.act,
 start:s.estimateStartFrame,end:s.estimateEndFrame,
 narrationAnchor:s.narrationAnchor,cameraAndAction:s.cameraAndAction,
 soundCue:s.soundCue
}));
if(shots.length!==60||shots.at(-1).end!==3876||
  shots[2].start!==105||shots[6].end!==396)
 throw Error('Episode02 expected 60 shots, 3876 frames, Shots03-07 at 105-395.');
const base=path.join(studioRoot,'out/v2-episodes/in-this-town-02');
const review=path.join(base,'rig-and-box-review');
await fs.mkdir(review,{recursive:true});
const props={shots,captions:[],previewScale:.5,optimize:true,audioApproved:false};
await fs.writeFile(path.join(base,'render-props.json'),JSON.stringify(props,null,2)+'\n');

function verify(args){
 console.log('QA '+args.join(' '));
 execFileSync(process.execPath,args,{cwd:studioRoot,stdio:'inherit'});
}
verify([path.join(studioRoot,'node_modules/typescript/bin/tsc'),'--noEmit']);
verify([path.join(studioRoot,'scripts/episode02-style-preflight.mjs')]);

const url=await bundle({entryPoint:path.join(studioRoot,'src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
const output=path.join(review,'EP02_Shots03-07_RigAndBox_540p.mp4');
const stills=[];
try{
 const composition=await selectComposition({serveUrl:url,
  id:'InThisTownEpisode02Box',inputProps:props,
  puppeteerInstance:browser,logLevel:'error'});
 await renderMedia({overwrite:true,serveUrl:url,composition,inputProps:props,
  frameRange:[105,395],outputLocation:output,
  codec:'h264',crf:18,pixelFormat:'yuv420p',imageFormat:'jpeg',
  jpegQuality:95,scale:.5,concurrency:renderConcurrency(),
  puppeteerInstance:browser,chromiumOptions,logLevel:'error',
  timeoutInMilliseconds:240000});
 // Inspects action, hip/paw contact, the box wall, and angled rests.
 // Some late frames are stills only, NOT a purported late-scene movie QA.
 const frames=[105,124,144,152,160,174,182,
  183,202,225,242,243,276,305,320,321,352,395,
  1158,2168,2295,2355,2422];
 for(const frame of frames){
  const name='EP02_RIG_frame_'+String(frame).padStart(4,'0')+'.png';
  try{
   await renderStill({serveUrl:url,composition,inputProps:props,
    frame,scale:.5,output:path.join(review,name),imageFormat:'png',
    puppeteerInstance:browser,chromiumOptions,logLevel:'error'});
   stills.push({frame,name,ok:true});
  }catch(error){stills.push({frame,ok:false,error:String(error)});}
 }
 await fs.writeFile(path.join(review,'EP02_RigBox_QA.json'),JSON.stringify({
  sourceFrameRange:[105,395],filmFrames:291,fps:30,seconds:9.7,
  stillOnlyLaterShots:[19,35,37,38,39],
  style:'Original Episode 01 cat art / Episode 02 rig staging',
  checkedByScript:['TypeScript','Episode 01 style-lock','MP4 generation'],
  humanMotionReviewed:false,
  clippingReviewed:false,
  userApproval:false,
  unreviewedFullFilm:true,
  stills
 },null,2)+'\n');
}finally{
 await browser.close({silent:true});
}
const stat=await fs.stat(output);
if(stat.size<1000)throw Error('No valid export found at '+output);
console.log('\nLOCAL EP02 RIG + BOX REVIEW EXPORTED');
console.log('MP4: '+output);
console.log('Frames: 291 / Shots 03–07 / 9.7 sec / 540x960 / 30fps / silent');
console.log('Additional diagnostic stills in: '+review);
console.log('Actual MP4 and still images require visual review before approval.');
