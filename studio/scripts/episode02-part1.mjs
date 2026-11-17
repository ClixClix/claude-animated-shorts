import {studioRoot,browserExecutable,chromiumOptions,renderConcurrency} from './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';

const native=process.argv.includes('--native');
const stillsOnly=process.argv.includes('--stills-only');
const videoOnly=process.argv.includes('--video-only');
const force=process.argv.includes('--force');
if(stillsOnly&&videoOnly)throw Error('Choose one of --stills-only or --video-only.');
const out=path.join(studioRoot,'out/v2-episodes/in-this-town-02/part1-pilot');
const stills=path.join(out,'frames');
await fs.mkdir(stills,{recursive:true});
const blueprint=JSON.parse(await fs.readFile(path.join(studioRoot,
 'src/v2/episodes/in-this-town-02/PART1_SHOT_BLUEPRINT.json'),'utf8'));
const shots=blueprint.shots.map(({id,start,end})=>({id,start,end}));
if(shots.length!==4||shots[0].start!==0||
 shots[shots.length-1].end!==183||
 shots.some((q,i)=>q.end<=q.start||(i&&q.start!==shots[i-1].end)))
 throw Error('Part 1 blueprint shot timing violates the approved 183-frame opening.');
const scale=native?1:.5;
const hash=x=>createHash('sha256').update(x).digest('hex');
const sourceFiles=[
 'src/v2/episodes/in-this-town-02/Episode02Part1.tsx',
 'src/v2/episodes/in-this-town-02/ruleCats.ts',
 'src/v2/cats/drawCat.ts',
 'src/v2/cats/Cat.tsx',
 'src/v2/cats/pose.ts',
 'src/v2/cats/designs.ts',
 'src/v2/episodes/in-this-town-02/PART1_SHOT_BLUEPRINT.json',
 'src/v2/episodes/in-this-town-02/boxProps.ts',
 'src/v2/episodes/door-at-1111-polish/world.ts',
 'src/v2/episodes/door-at-1111-polish/actors.ts',
 'src/v2/episodes/door-at-1111-polish/population.ts',
 'src/v2/episodes/door-at-1111-polish/city.ts',
 'src/v2/episodes/door-at-1111-polish/cityConfig.ts',
 'src/v2/cafe/environment.ts',
 'src/v2/cafe/config.ts',
 'src/videos/bridge/ink.ts','src/videos/bridge/grade.ts'
];
const sourceHash=hash((await Promise.all(sourceFiles.map(p=>
 fs.readFile(path.join(studioRoot,p))))).map(hash).join(':'));
const props={previewScale:scale,optimize:true};
const browserLogs=[],audits=[],errors=[];
const log=l=>{
 if(l.text?.startsWith('PART1_AUDIT ')){
  try{audits.push(JSON.parse(l.text.slice('PART1_AUDIT '.length)));}catch(e){errors.push('Invalid pilot audit: '+String(e));}
 }else if(l.type==='error'){errors.push(l.text);console.error(l.text.slice(0,600));}
};
const sidecar=path.join(out,'PART1_RENDER_STATUS.json');
const video=path.join(out,native?'Part1_01-04_NATIVE.mp4':'Part1_01-04_PREVIEW.mp4');
let browser;
try{
 const serveUrl=await bundle({entryPoint:path.join(studioRoot,'src/index.ts')});
 browser=await openBrowser('chrome',{browserExecutable,chromiumOptions});
 const composition=await selectComposition({serveUrl,id:'InThisTownEpisode02Part1',
  inputProps:props,puppeteerInstance:browser,logLevel:'error',onBrowserLog:log});
 if(!videoOnly){
  for(const shot of shots){
   // Multiple actual timeline frames, not drawn storyboard guesses.
   for(const pct of [.2,.5,.8]){
    const frame=shot.start+Math.floor((shot.end-shot.start-1)*pct);
    const file=path.join(stills,shot.id+'_'+Math.round(pct*100)+'.png');
    console.log('PART1 '+shot.id+' frame '+frame);
    await renderStill({serveUrl,composition,inputProps:props,frame,output:file,
     imageFormat:'png',scale,puppeteerInstance:browser,logLevel:'error',
     onBrowserLog:log,timeoutInMilliseconds:240000});
   }
  }
 }
 if(!stillsOnly){
  const stale=await fs.readFile(sidecar,'utf8').then(JSON.parse,()=>null);
  const exists=await fs.access(video).then(()=>true,()=>false);
  if(!force&&exists&&stale?.sourceHash===sourceHash&&stale?.scale===scale){
   console.log('PART1 video cached for matching source and scale.');
  }else{
   const partial=video+'.partial.mp4';
   await renderMedia({overwrite:true,serveUrl,composition,inputProps:props,
    frameRange:[0,182],outputLocation:partial,codec:'h264',crf:18,
    pixelFormat:'yuv420p',imageFormat:'jpeg',jpegQuality:95,scale,
    concurrency:renderConcurrency(),puppeteerInstance:browser,chromiumOptions,
    logLevel:'error',timeoutInMilliseconds:240000,onBrowserLog:log});
   await fs.rename(partial,video);
   console.log('PART1 movie encoded: '+video);
  }
 }
}finally{
 if(browser)await browser.close({silent:true});
}
// Media and stills log the same frames. Count distinct timeline samples once.
const uniqueAudits=[...new Map(audits.map(a=>[a.frame,a])).values()]
 .sort((a,b)=>a.frame-b.frame);
const issues=uniqueAudits.flatMap(a=>[
 ...(a.cropWarning?[{frame:a.frame,shot:a.shot,kind:'SUBJECT_CROP'}]:[]),
 ...(a.occlusionWarning?[{frame:a.frame,shot:a.shot,kind:'REAL_WORLD_OCCLUSION',
  objects:a.occludingWorldObjects}]:[]),
 ...(a.faceOccluded?[{frame:a.frame,shot:a.shot,kind:'BOX_HIDES_CAT_FACE',
  blockingMesh:a.faceBlocker}]:[]),
]);
const status={
 id:'in-this-town-ep02-part1',stage:'RENDERED_PROTOTYPE_NOT_APPROVED',
 sourceHash,scale,width:native?1080:540,height:native?1920:960,
 shots,frames:183,durationSeconds:6.1,
 fullFilmRendered:false,publishingAllowed:false,paidNarrationRequests:0,
 movie:stillsOnly?null:video,stillsDirectory:stills,
 visualAudit:{sampledFrames:uniqueAudits.length,issues,raw:uniqueAudits,browserErrors:errors},
 next:'Review the 12 real frames and the 6.1-second MP4 against Episode 01. Rework any blocked, clipped, incorrect-scale or confusing shot before continuing.'
};
await fs.writeFile(sidecar,JSON.stringify(status,null,2)+'\n');
console.log(JSON.stringify({stage:status.stage,video:status.movie,framesFolder:stills,
 actualVisualSampleFrames:uniqueAudits.length,issues:issues.length,browserErrors:errors.length},null,2));
if(errors.length||issues.length)process.exitCode=2;
