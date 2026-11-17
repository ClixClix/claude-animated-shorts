/**
 * Episode 02 end sequence 58-60 — actual short moving Remotion preview.
 * Renders under 10 seconds of scene footage, NEVER the full movie.
 * No narration, paid services, production audio, or publication.
 */
import {studioRoot,browserExecutable,chromiumOptions} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia} from '@remotion/renderer';

const root=path.join(studioRoot,'src/v2/episodes/in-this-town-02');
const scratch=JSON.parse(await fs.readFile(path.join(root,'EDITORIAL_SCRATCH_PLAN.json'),'utf8'));
const shots=scratch.shots.map(s=>({
 id:s.id,sequence:s.sequence,act:s.act,start:s.estimateStartFrame,
 end:s.estimateEndFrame,cameraAndAction:s.cameraAndAction,
 narrationAnchor:s.narrationAnchor,soundCue:s.soundCue
}));
const get=n=>shots.find(s=>s.sequence===n);
if(shots.length!==60||!get(58)||!get(59)||!get(60))
 throw Error('Episode02 60-shot scratch plan changed; do not generate a misaligned preview');
const first=get(58).start,last=get(60).end-1;
const frameCount=last-first+1;
if(frameCount<50||frameCount>350)
 throw Error('Refusing to render unexpected shot58–60 duration '+frameCount);
const props={shots,captions:[],previewScale:.5,optimize:true,audioApproved:false};
const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02/ep1-asset-reuse-proof');
await fs.mkdir(out,{recursive:true});
const video=path.join(out,'EP2_ENDING_SHOTS_58-60_CLOUD_PREVIEW.mp4');
const errors=[];
const onBrowserLog=log=>{
 if(log.type==='error'){errors.push(log.text);console.error(log.text);}
};
let browser;
try{
 const serveUrl=await bundle({entryPoint:path.join(studioRoot,'src/index.ts')});
 browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
 const composition=await selectComposition({
  serveUrl,id:'InThisTownEpisode02Box',inputProps:props,
  puppeteerInstance:browser,logLevel:'error',onBrowserLog
 });
 await renderMedia({
  serveUrl,composition,inputProps:props,
  frameRange:[first,last],outputLocation:video,
  overwrite:true,codec:'h264',crf:19,pixelFormat:'yuv420p',
  imageFormat:'jpeg',jpegQuality:94,scale:.5,concurrency:1,
  puppeteerInstance:browser,chromiumOptions,
  logLevel:'error',onBrowserLog,timeoutInMilliseconds:240000
 });
}finally{if(browser)await browser.close({silent:true});}
const report={
 stage:errors.length?'RENDER_WITH_BROWSER_ERRORS':'ACTUAL_MOVIE_RENDERED_CREATIVE_REVIEW_REQUIRED',
 frames:frameCount,first,last,fps:30,format:[540,960],
 shots:[58,59,60],video,
 browserErrors:errors,
 sourceStyle:'Approved Episode 01 assets and rendering preset',
 creativeApproved:false,finalMovie:false,publishingAllowed:false,
 notes:'Compare the entire motion to The Door at 11:11: shot continuity, natural feline jump, cardboard collisions, warm cuddle and camera movement.'
};
await fs.writeFile(path.join(out,'EP2_ENDING_58-60_CLOUD_QA.json'),
 JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({stage:report.stage,frames:frameCount,
 seconds:frameCount/30,video,errors:errors.length},null,2));
if(errors.length)process.exitCode=2;
