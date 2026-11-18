import {studioRoot,browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia} from '@remotion/renderer';

/**
 * Renders ACTUAL frames 0..104 as one uninterrupted 105-frame movie,
 * not separate Shot 01/02 files stitched at frame 84.
 * Shot 01's previously approved camera curve stays unchanged.
 * Shot 02 picks up the exact previous camera/target/FOV at frame 84.
 *
 * Silent scratch only. No publishing, paid media generation, or narration.
 */
const outputDir=path.join(studioRoot,'out/v2-episodes/in-this-town-02/shot01-02-uncut');
await fs.mkdir(outputDir,{recursive:true});
const input=JSON.parse(await fs.readFile(path.join(
 studioRoot,'out/v2-episodes/in-this-town-02/render-props.json'),'utf8'));
if(input.shots?.length!==60||
 input.shots[0].start!==0||input.shots[0].end!==84||
 input.shots[1].start!==84||input.shots[1].end!==105)
 throw new Error('Uncut opening requires 84-frame Shot 01 + 21-frame Shot 02');
const props={...input,captions:[],audioApproved:false,previewScale:.5,optimize:true};
const serveUrl=await bundle({entryPoint:path.join(studioRoot,'src/index.ts')});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
const outputLocation=path.join(outputDir,'EP02_Shots01-02_ContinuousCityToBox_540p.mp4');
try{
 const composition=await selectComposition({
  serveUrl,id:'InThisTownEpisode02Box',inputProps:props,
  puppeteerInstance:browser,logLevel:'error'
 });
 await renderMedia({
  overwrite:true,serveUrl,composition,inputProps:props,
  frameRange:[0,104],outputLocation,
  codec:'h264',crf:18,pixelFormat:'yuv420p',
  imageFormat:'jpeg',jpegQuality:95,scale:.5,
  concurrency:renderConcurrency(),puppeteerInstance:browser,
  chromiumOptions,logLevel:'error',timeoutInMilliseconds:240000
 });
}finally{await browser.close({silent:true});}
const bytes=await fs.readFile(outputLocation);
const hash=createHash('sha256').update(bytes).digest('hex');
const manifest={
 stage:'105_ACTUAL_CONSECUTIVE_RENDERED_FRAMES_REVIEW_PENDING',
 sourceCommit:process.env.GITHUB_SHA??'unknown',
 approvedShot01Preserved:true,
 frames:105,shots:[1,2],boundaryFrame:84,fps:30,
 durationSeconds:3.5,width:540,height:960,
 uncut:true,captions:false,audioApproved:false,
 sourceShot01End:[4.6,4.20,13.4],
 sourceShot02Start:[4.6,4.20,13.4],
 file:path.basename(outputLocation),sha256:hash,bytes:bytes.length
};
await fs.writeFile(path.join(outputDir,'EP02_Shots01-02_RenderManifest.json'),
 JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
