import {studioRoot,browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';

/** Visual rehearsal ONLY. Does not render the rejected four-shot pilot. */
const native=process.argv.includes('--native');
const stillsOnly=process.argv.includes('--stills-only');
const force=process.argv.includes('--force');
const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02/shot01-performance');
const frameDir=path.join(out,'frames');
await fs.mkdir(frameDir,{recursive:true});
console.log('SHOT01: TypeScript preflight...');
execFileSync(process.execPath,[path.join(studioRoot,'node_modules/typescript/bin/tsc'),'--noEmit'],
 {cwd:studioRoot,stdio:'inherit'});
const blueprint=JSON.parse(await fs.readFile(path.join(studioRoot,
 'src/v2/episodes/in-this-town-02/SHOT01_PERFORMANCE_BLUEPRINT.json'),'utf8'));
if(blueprint.durationFrames!==78||blueprint.fps!==30)
 throw Error('The performance blueprint and rig are out of sync: expected 78 frames / 30 fps.');
const sources=[
 'src/Root.tsx',
 'src/v2/episodes/in-this-town-02/articulatedGuest.ts',
 'src/v2/episodes/in-this-town-02/Shot01Performance.tsx',
 'src/v2/episodes/in-this-town-02/SHOT01_PERFORMANCE_BLUEPRINT.json',
 'src/v2/episodes/in-this-town-02/boxProps.ts',
 'src/v2/episodes/in-this-town-02/ruleCats.ts',
 'src/v2/cats/Cat.tsx','src/v2/cats/drawCat.ts','src/v2/cats/designs.ts','src/v2/cats/pose.ts',
 'src/v2/episodes/door-at-1111-polish/world.ts',
 'src/v2/episodes/door-at-1111-polish/timeline.ts',
 'src/v2/cafe/environment.ts',
 'src/v2/cafe/config.ts',
 'src/videos/bridge/cardshade.ts',
 'src/videos/bridge/ink.ts',
 'src/videos/bridge/grade.ts'
];
const hash=src=>createHash('sha256').update(src).digest('hex');
const sourceHash=hash((await Promise.all(sources.map(f=>
 fs.readFile(path.join(studioRoot,f))))).map(hash).join(':'));
const frames=blueprint.visualGate.framesToCheck;
const scale=native?1:.5;
const props={previewScale:scale,optimize:true};
const output=path.join(out,native?'SHOT01_PERFORMANCE_NATIVE.mp4':'SHOT01_PERFORMANCE_PREVIEW.mp4');
const sidecar=path.join(out,'SHOT01_PERFORMANCE_QA.json');
const audits=[],browserErrors=[];
const onBrowserLog=(msg)=>{
 if(msg.text?.startsWith('SHOT01_PERFORMANCE_QA ')){
  try{audits.push(JSON.parse(msg.text.slice('SHOT01_PERFORMANCE_QA '.length)));}
  catch(e){browserErrors.push('Failed to parse QA result: '+String(e));}
 }else if(msg.type==='error'){
  browserErrors.push(msg.text);console.error(msg.text.slice(0,500));
 }
};
let browser=null,renderedMovie=null;
try{
 const serveUrl=await bundle({entryPoint:path.join(studioRoot,'src/index.ts')});
 browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
 const composition=await selectComposition({
  serveUrl,id:'InThisTownEpisode02Shot01Performance',inputProps:props,
  puppeteerInstance:browser,onBrowserLog,logLevel:'error'
 });
 for(const frame of frames){
  const filename=path.join(frameDir,'shot01_'+String(frame).padStart(3,'0')+'.png');
  console.log('SHOT01 frame '+frame);
  await renderStill({
   serveUrl,composition,inputProps:props,frame,output:filename,
   imageFormat:'png',scale,puppeteerInstance:browser,onBrowserLog,
   logLevel:'error',timeoutInMilliseconds:240000
  });
 }
 const samples=[...new Map(audits.map(x=>[x.frame,x])).values()]
  .sort((a,b)=>a.frame-b.frame);
 const problems=samples.flatMap(a=>[
  ...((a.setIntersections??[]).length?[{frame:a.frame,
   code:'PHYSICAL_SET_COLLISION',objects:a.setIntersections}]:[]),
  ...((a.setOcclusion??[]).length?[{frame:a.frame,
   code:'VISIBLE_SET_OBSTRUCTION',objects:a.setOcclusion}]:[]),
  ...(a.prematureRimCross?[{frame:a.frame,code:'JUMP_WALL_INTERSECTION'}]:[]),
  ...(a.framingWarning?[{frame:a.frame,code:'SHOT_FRAMING'}]:[])
 ]);
 const missing=frames.filter(f=>!samples.some(a=>a.frame===f));
 if(missing.length)problems.push({code:'MISSING_QA_FRAMES',frames:missing});
 if(browserErrors.length)problems.push({code:'BROWSER_ERRORS',count:browserErrors.length});
 if(problems.length){
  // Stop BEFORE another pointless encode when the stage is still blocked.
  console.error('SHOT01 static blocking/QA failed: skipping animation encoding.');
 }else if(!stillsOnly){
  const prev=await fs.readFile(sidecar,'utf8').then(JSON.parse,()=>null);
  const cached=await fs.access(output).then(()=>true,()=>false);
  if(!force&&cached&&prev?.sourceHash===sourceHash&&prev?.scale===scale){
   console.log('SHOT01 matched source cache. Reusing MP4.');
   renderedMovie=output;
  }else{
   const partial=output+'.partial.mp4';
   await renderMedia({
    overwrite:true,serveUrl,composition,inputProps:props,
    frameRange:[0,blueprint.durationFrames-1],outputLocation:partial,
    codec:'h264',crf:18,pixelFormat:'yuv420p',
    imageFormat:'jpeg',jpegQuality:95,scale,
    concurrency:renderConcurrency(),puppeteerInstance:browser,
    chromiumOptions,logLevel:'error',onBrowserLog,
    timeoutInMilliseconds:240000
   });
   await fs.rename(partial,output);
   renderedMovie=output;
   console.log('SHOT01 new movement proof: '+output);
  }
 }
 const status={
  id:'episode02-articulated-shot01-proof',
  stage:'UNVERIFIED_PERFORMANCE_PROTOTYPE',
  sourceHash,scale,width:native?1080:540,height:native?1920:960,
  frames:blueprint.durationFrames,fps:30,durationSeconds:2.6,
  availableSamples:samples.length,requiredSamples:frames.length,
  qualityProblems:problems,qa:samples,browserErrors,
  encodedMovie:renderedMovie,framesFolder:frameDir,
  passesAutomatedBlocking:problems.length===0,
  passesArtisticReview:false,
  fullEpisodeRendered:false,publishingAllowed:false,paidVoiceRequests:0,
  next:problems.length?
   'Inspect stage/QA errors and saved frames; fix collisions BEFORE encoding movie.':
   'Upload preview MP4 and QA JSON for creative review; this is only one independent animated action.'
 };
 await fs.writeFile(sidecar,JSON.stringify(status,null,2)+'\n');
 console.log(JSON.stringify({
  status:status.stage,samples:samples.length,
  blockingAndFramingProblems:problems.length,
  encodedMovie:renderedMovie,report:sidecar
 },null,2));
 if(problems.length)process.exitCode=2;
}finally{
 if(browser)await browser.close({silent:true});
}
