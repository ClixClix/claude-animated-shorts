/**
 * True uninterrupted 105-frame, 3.5-second opening (shots 01 + 02).
 * Render as ONE Remotion frame range, not a concat of unrelated camera takes.
 * Silent scratch only. No paid media, publishing or source asset replacement.
 */
import {studioRoot,browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia,renderStill} from '@remotion/renderer';

const root=path.join(studioRoot,'out/v2-episodes/in-this-town-02');
const out=path.join(root,'opening-crane-review');
await fs.mkdir(out,{recursive:true});
const props=JSON.parse(await fs.readFile(path.join(root,'render-props.json'),'utf8'));
if(props.shots.length!==60||props.shots[0].start!==0||
  props.shots[0].end!==84||props.shots[1].start!==84||props.shots[1].end!==105)
 throw Error('Opening is not the approved 84 + 21 frame edit');
props.captions=[];props.audioApproved=false;props.previewScale=.5;props.optimize=true;
const url=await bundle({entryPoint:path.join(studioRoot,'src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
try{
 const composition=await selectComposition({
  serveUrl:url,id:'InThisTownEpisode02Box',inputProps:props,
  puppeteerInstance:browser,logLevel:'error'
 });
 const video=path.join(out,'EP02_Shots01-02_ContinuousCrane_540p.mp4');
 await renderMedia({
  overwrite:true,serveUrl:url,composition,inputProps:props,
  frameRange:[0,104],outputLocation:video,
  codec:'h264',crf:18,pixelFormat:'yuv420p',imageFormat:'jpeg',
  jpegQuality:95,scale:.5,concurrency:renderConcurrency(),
  puppeteerInstance:browser,chromiumOptions,logLevel:'error',
  timeoutInMilliseconds:240000
 });
 // Individually rendered frames are real source frames. Especially check
 // the boundary at 83->84, plus speed and physical box/kitten in 84..104.
 const frames=[0,25,50,68,77,82,83,84,85,91,97,104];
 const stillStatus=[];
 for(const frame of frames){
  const name='SHOT01_02_frame_'+String(frame).padStart(3,'0')+'.png';
  try{
   await renderStill({
    serveUrl:url,composition,inputProps:props,frame,scale:.5,
    output:path.join(out,name),imageFormat:'png',
    puppeteerInstance:browser,chromiumOptions,logLevel:'error'
   });
   stillStatus.push({frame,file:name,result:'rendered'});
  }catch(error){
   console.warn('STILL_CAPTURE_FAILED '+frame+' '+String(error));
   stillStatus.push({frame,result:'failed',message:String(error)});
  }
 }
 await fs.writeFile(path.join(out,'EP02_OpenCrane_Review.json'),
  JSON.stringify({
   stage:'ENCODED_AWAITING_ARTISTIC_REVIEW',frames:105,fps:30,
   width:540,height:960,seconds:3.5,
   continuityBoundary:[83,84],
   source:'Single Remotion composition frameRange 0..104',
   originalWideFirstFrameKept:true,containsAudio:false,
   mediaGenerationRequests:0,stillStatus
  },null,2)+'\n');
 console.log(JSON.stringify({stage:'ENCODED_AWAITING_ARTISTIC_REVIEW',
  output:video,frames:105,stillStatus},null,2));
}finally{await browser.close({silent:true});}
